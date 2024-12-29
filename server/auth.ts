import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, type User as DbUser, insertUserSchema } from "../db/schema";
import { db } from "../db/index";
import { eq } from "drizzle-orm";
import { MFAService } from './services/mfa';

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
};

// Extend session type to include MFA properties
declare module 'express-session' {
  interface SessionData {
    mfaPending?: boolean;
    mfaUserId?: number;
  }
}

// extend express user object with our schema
declare global {
  namespace Express {
    interface User extends Omit<DbUser, 'password'> {
      mfaEnabled: boolean;
      mfaMethod: 'none' | 'totp' | 'email' | 'sms';
    }
  }
}

export function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "finnish-legal-platform",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = {
      secure: true,
    };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        const isMatch = await crypto.compare(password, user.password);
        if (!isMatch) {
          return done(null, false, { message: "Incorrect password." });
        }

        // Update last login timestamp
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));

        // Omit password from user object
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword as Express.User);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        return done(null, false);
      }

      // Omit password from user object
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword as Express.User);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map((i: any) => i.message).join(", "));
      }

      const { username, password, email, firstName, lastName, companyName, position } = result.data;

      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      // Hash the password
      const hashedPassword = await crypto.hash(password);

      // Create the new user
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          email,
          firstName,
          lastName,
          companyName,
          position,
          role: 'free',
          subscriptionStatus: 'trial',
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: { language: 'fi', notifications: true, theme: 'system' },
          mfaEnabled: false,
          mfaMethod: 'none'
        })
        .returning();

      // Log the user in after registration
      req.login(newUser, (err) => {
        if (err) {
          return next(err);
        }
        return res.json({
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            subscriptionStatus: newUser.subscriptionStatus,
            mfaEnabled: newUser.mfaEnabled,
            mfaMethod: newUser.mfaMethod
          },
        });
      });
    } catch (error) {
      next(error);
    }
  });

  const mfaService = new MFAService();

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", async (err: any, user: Express.User, info: IVerifyOptions) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.status(400).send(info.message ?? "Login failed");
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        req.session.mfaPending = true;
        req.session.mfaUserId = user.id;

        return res.status(200).json({
          requiresMFA: true,
          mfaMethod: user.mfaMethod
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            preferences: user.preferences,
            mfaEnabled: user.mfaEnabled,
            mfaMethod: user.mfaMethod
          },
        });
      });
    })(req, res, next);
  });

  app.post("/api/verify-mfa", async (req, res) => {
    const { token, method } = req.body;
    const userId = req.session.mfaUserId;

    if (!userId || !req.session.mfaPending) {
      return res.status(401).json({
        error: "MFA verification not initiated",
        code: "MFA_NOT_INITIATED"
      });
    }

    try {
      let isValid = false;

      if (method === 'totp') {
        isValid = await mfaService.verifyTOTP(userId, token);
      } else if (method === 'backup') {
        isValid = await mfaService.verifyBackupCode(userId, token);
      }

      if (!isValid) {
        return res.status(401).json({
          error: "Invalid MFA token",
          code: "INVALID_TOKEN"
        });
      }

      // Get user data for login
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Complete login
      req.session.mfaPending = false;
      req.session.mfaUserId = undefined;

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({
            error: "Login failed after MFA",
            code: "LOGIN_FAILED"
          });
        }

        return res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
            preferences: user.preferences
          }
        });
      });
    } catch (error) {
      console.error('MFA verification error:', error);
      res.status(500).json({
        error: "MFA verification failed",
        code: "MFA_ERROR"
      });
    }
  });

  app.post("/api/setup-mfa", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      const mfaData = await mfaService.setupTOTP(req.user.id);
      res.json(mfaData);
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({
        error: "Failed to setup MFA",
        code: "MFA_SETUP_ERROR"
      });
    }
  });

  app.post("/api/disable-mfa", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not logged in");
    }

    try {
      await mfaService.disableMFA(req.user.id);
      res.json({ message: "MFA disabled successfully" });
    } catch (error) {
      console.error('MFA disable error:', error);
      res.status(500).json({
        error: "Failed to disable MFA",
        code: "MFA_DISABLE_ERROR"
      });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).send("Logout failed");
      }

      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user;
      return res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        subscriptionStatus: user.subscriptionStatus,
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        position: user.position,
        preferences: user.preferences,
        mfaEnabled: user.mfaEnabled,
        mfaMethod: user.mfaMethod
      });
    }

    res.status(401).send("Not logged in");
  });
}