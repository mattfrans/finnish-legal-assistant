import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db/index";
import { chatSessions, queries } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Create new chat session
  app.post("/api/sessions", async (req, res) => {
    try {
      const title = new Date().toLocaleString('fi-FI');
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

      // TODO: Integrate with actual Finlex API
      // This is a mock response for now
      const mockResponse = {
        answer: "According to Finnish law...",
        sources: [
          {
            link: "https://finlex.fi/fi/laki/example",
            title: "Consumer Protection Act",
            section: "Chapter 2, Section 1"
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
