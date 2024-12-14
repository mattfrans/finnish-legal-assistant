import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db/index";
import { queries } from "@db/schema";
import { desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { question } = req.body;

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
      await db.insert(queries).values({
        question,
        answer: mockResponse.answer,
        sources: mockResponse.sources
      });

      res.json(mockResponse);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // History endpoint
  app.get("/api/history", async (_req, res) => {
    try {
      const history = await db.query.queries.findMany({
        orderBy: [desc(queries.createdAt)],
        limit: 50
      });
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
