import { Request, Response } from 'express';
import { db } from '@db/index';
import { chatSessions, queries } from '@db/schema';
import { desc, eq } from 'drizzle-orm';
import { LegalService } from '../services/legal';

export class ChatController {
  private legalService: LegalService;

  constructor() {
    this.legalService = new LegalService();
  }

  async createSession(req: Request, res: Response) {
    try {
      const title = "Uusi keskustelu"; // "New conversation" in Finnish
      const [session] = await db.insert(chatSessions)
        .values({ title })
        .returning();
      res.json(session);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to create chat session",
        code: "CREATE_ERROR"
      });
    }
  }

  async getSessions(req: Request, res: Response) {
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
      res.status(500).json({ 
        error: "Failed to fetch chat sessions",
        code: "FETCH_ERROR"
      });
    }
  }

  async getSession(req: Request, res: Response) {
    try {
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, parseInt(req.params.id)),
        with: {
          queries: {
            orderBy: [queries.createdAt]
          }
        }
      });
      
      if (!session) {
        return res.status(404).json({ 
          error: "Chat session not found",
          code: "NOT_FOUND"
        });
      }

      const fullSession = {
        ...session,
        queries: session.queries.map(q => ({
          ...q,
          sources: q.sources || []
        }))
      };
      
      res.json(fullSession);
    } catch (error) {
      console.error('Error fetching chat session:', error);
      res.status(500).json({ 
        error: "Failed to fetch chat session",
        code: "FETCH_ERROR"
      });
    }
  }

  async addMessage(req: Request, res: Response) {
    try {
      const { question } = req.body;
      const sessionId = parseInt(req.params.id);

      // Verify session exists
      const session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, sessionId)
      });

      if (!session) {
        return res.status(404).json({ 
          error: "Chat session not found",
          code: "NOT_FOUND"
        });
      }

      // Check if this is the first message
      const existingQueries = await db.query.queries.findMany({
        where: eq(queries.sessionId, sessionId)
      });

      if (existingQueries.length === 0) {
        const truncatedTitle = question.length > 50 
          ? question.substring(0, 47) + "..."
          : question;
        await db.update(chatSessions)
          .set({ title: truncatedTitle })
          .where(eq(chatSessions.id, sessionId));
      }

      const startTime = Date.now();
      const legalResponse = await this.legalService.analyzeLegalContext(question);

      // Store in database
      const [query] = await db.insert(queries)
        .values({
          sessionId,
          question,
          answer: legalResponse.answer,
          sources: legalResponse.sources,
          legalContext: legalResponse.legalContext,
          confidence: legalResponse.confidence
        })
        .returning();

      // Return enhanced response
      res.json({
        id: query.id,
        answer: legalResponse.answer,
        sources: legalResponse.sources,
        metadata: {
          processingTime: Date.now() - startTime,
          sourcesUsed: ['finlex', 'kkv'],
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
      res.status(500).json({ 
        error: "Failed to process chat message",
        code: "PROCESSING_ERROR"
      });
    }
  }

  async getAnalysis(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);
      
      const analysis = await db.query.queries.findMany({
        where: eq(queries.sessionId, sessionId),
        orderBy: [queries.createdAt]
      });

      if (!analysis.length) {
        return res.status(404).json({ 
          error: "No analysis found for this session",
          code: "NOT_FOUND"
        });
      }

      // Aggregate analysis from all queries in the session
      const response = {
        summary: {
          totalQueries: analysis.length,
          averageConfidence: analysis.reduce((acc, curr) => 
            acc + (curr.confidence?.score || 0), 0) / analysis.length,
          topics: Array.from(new Set(analysis.flatMap(q => 
            q.sources?.map(s => s.title) || []
          ))),
        },
        timeline: analysis.map(q => ({
          question: q.question,
          timestamp: q.createdAt,
          confidence: q.confidence,
          sources: q.sources
        }))
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to generate session analysis",
        code: "ANALYSIS_ERROR"
      });
    }
  }
}
