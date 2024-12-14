import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db/index";
import { chatSessions, queries } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Create new chat session
  app.post("/api/sessions", async (req, res) => {
    try {
      const title = "Uusi keskustelu"; // "New conversation" in Finnish
      const [session] = await db.insert(chatSessions)
        .values({ title })
        .returning();
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to create chat session" });
    }
  });

  // Get all chat sessions
  app.get("/api/sessions", async (_req, res) => {
    try {
      const sessions = await db.query.chatSessions.findMany({
        orderBy: [desc(chatSessions.createdAt)],
        with: {
          queries: {
            limit: 1,
            orderBy: [desc(queries.createdAt)]
          }
        }
      });
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });

  // Get single chat session with all its messages
  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, parseInt(req.params.id)),
        with: {
          queries: {
            orderBy: [desc(queries.createdAt)]
          }
        }
      });
      
      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat session" });
    }
  });

  // Chat endpoint
  app.post("/api/sessions/:id/chat", async (req, res) => {
    try {
      const { question } = req.body;
      const sessionId = parseInt(req.params.id);

      // Verify session exists
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, sessionId)
      });

      if (!session) {
        return res.status(404).json({ error: "Chat session not found" });
      }

      // Check if this is the first message in the session
      const existingQueries = await db.query.queries.findMany({
        where: eq(queries.sessionId, sessionId)
      });

      if (existingQueries.length === 0) {
        // If this is the first message, update the session title
        const truncatedTitle = question.length > 50 
          ? question.substring(0, 47) + "..."
          : question;
        await db.update(chatSessions)
          .set({ title: truncatedTitle })
          .where(eq(chatSessions.id, sessionId));
      }

      // Enhanced mock response with Finnish legal context
      // TODO: Integrate with actual Finlex API
      const mockResponse = {
        answer: "Suomen lain mukaan kuluttajalla on oikeus...", // "According to Finnish law, consumers have the right to..."
        sources: [
          {
            link: "https://www.finlex.fi/fi/laki/ajantasa/1978/19780038",
            title: "Kuluttajansuojalaki",
            section: "2 luku - Markkinointi ja menettelyt asiakassuhteessa"
          },
          {
            link: "https://www.kkv.fi/kuluttaja-asiat/",
            title: "KKV Kuluttaja-asiat",
            section: "Kuluttajan oikeudet"
          }
        ]
      };

      // Store in database
      const [query] = await db.insert(queries)
        .values({
          sessionId,
          question,
          answer: mockResponse.answer,
          sources: mockResponse.sources
        })
        .returning();

      res.json({ ...mockResponse, id: query.id });
    } catch (error) {
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
