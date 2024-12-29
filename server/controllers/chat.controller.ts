import { Request, Response } from 'express';
import { db } from '../../db/index';
import { sessions, queries } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { LegalService } from '../services/legal';
import { OpenAIService } from '../services/openai';
import { type Query } from '../types/api';

export class ChatController {
  private legalService: LegalService;
  private openAIService: OpenAIService;

  constructor() {
    this.legalService = new LegalService();
    this.openAIService = new OpenAIService();
  }

  // Upload configuration
  public upload = multer({
    storage: multer.diskStorage({
      destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        try {
          await fs.mkdir(uploadDir, { recursive: true });
          cb(null, uploadDir);
        } catch (error) {
          cb(error as Error, uploadDir);
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    }
  }).fields([
    { name: 'attachments', maxCount: 10 }
  ]);

  async createSession(req: Request, res: Response) {
    try {
      console.log('Creating new chat session...');
      console.log('User:', req.user);

      // Create session using Drizzle ORM
      const [session] = await db.insert(sessions)
        .values({
          title: 'New Chat',
          userId: req.user?.id,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      console.log('Created session:', session);

      if (!session) {
        throw new Error('Failed to create chat session');
      }

      const response = {
        id: session.id,
        title: session.title,
        createdAt: session.createdAt.toISOString(),
        queries: []
      };

      console.log('Sending response:', response);
      res.status(201).json(response);

    } catch (error) {
      console.error('Error in createSession:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');

      res.status(500).json({
        error: 'Failed to create chat session',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  async getSessions(req: Request, res: Response) {
    try {
      const results = await db.query.sessions.findMany({
        where: eq(sessions.userId, req.user?.id),
        orderBy: [desc(sessions.createdAt)],
        with: {
          queries: {
            limit: 1,
            orderBy: [desc(queries.createdAt)]
          }
        }
      });
      res.json(results);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({
        error: "Failed to fetch chat sessions",
        code: "FETCH_ERROR"
      });
    }
  }

  async getSession(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);
      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (!session) {
        return res.status(404).json({
          error: "Chat session not found",
          code: "NOT_FOUND"
        });
      }

      const queryList = await db
        .select()
        .from(queries)
        .where(eq(queries.sessionId, sessionId))
        .orderBy(desc(queries.createdAt));

      const fullSession = {
        ...session,
        queries: queryList
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

  async getSuggestions(req: Request, res: Response) {
    try {
      const { messages } = req.body;

      if (!Array.isArray(messages) || !messages.every(m =>
        typeof m === 'object' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string'
      )) {
        return res.status(400).json({
          error: "Invalid messages format. Each message must have 'role' (user/assistant) and 'content' (string).",
          code: "INVALID_INPUT"
        });
      }

      const suggestions = await this.openAIService.generateChatSuggestions({
        messages: messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      });

      res.json({ suggestions });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({
        error: "Failed to generate suggestions",
        code: "SUGGESTIONS_ERROR",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async addMessage(req: Request, res: Response) {
    try {
      const question = req.body.question || '';
      const languageMode = req.body.languageMode || 'yleiskieli';
      const files = ((req.files as { [fieldname: string]: Express.Multer.File[] })?.['attachments'] || []);
      const fileContents = req.body.attachmentContents || [];
      const fileTypes = req.body.attachmentTypes || [];

      // Process attachments for storage
      const attachments = files.map(file => ({
        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
        filename: file.originalname,
        url: `/uploads/${file.filename}`,
        contentType: file.mimetype,
        size: file.size
      }));

      const sessionId = parseInt(req.params.id);

      // Verify session exists
      const [session] = await db.select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

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
        await db.update(sessions)
          .set({ title: truncatedTitle })
          .where(eq(sessions.id, sessionId));
      }

      const startTime = Date.now();

      // Prepare files for AI analysis
      const filesToAnalyze = files.map((file, index) => ({
        type: file.mimetype,
        content: fileContents[index],
        name: file.originalname
      }));

      // Get legal response with file analysis
      const legalResponse = await this.legalService.analyzeLegalContext(
        question,
        filesToAnalyze
      );

      // Generate file-specific responses
      let answer = legalResponse.answer;
      if (filesToAnalyze.length > 0 && legalResponse.fileAnalysis) {
        answer += '\n\nTiedostoanalyysi:\n';
        legalResponse.fileAnalysis.forEach((analysis, index) => {
          const file = files[index];
          answer += `\n${file.originalname}:\n${analysis.analysis}\n`;
        });
      }

      // Store in database
      const insertData = {
        sessionId,
        question,
        answer,
        sources: legalResponse.sources,
        confidence: legalResponse.confidence,
        attachments
      };

      const [query] = await db.insert(queries)
        .values(insertData)
        .returning();

      // Return enhanced response
      res.json({
        id: query.id,
        answer,
        sources: legalResponse.sources,
        attachments,
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
  async updateSession(req: Request, res: Response) {
    try {
      const { title } = req.body;
      const sessionId = parseInt(req.params.id);

      if (!title?.trim()) {
        return res.status(400).json({
          error: "Title cannot be empty",
          code: "INVALID_INPUT"
        });
      }

      const [session] = await db.update(sessions)
        .set({
          title: title.trim(),
          updatedAt: new Date()
        })
        .where(eq(sessions.id, sessionId))
        .returning();

      if (!session) {
        return res.status(404).json({
          error: "Chat session not found",
          code: "NOT_FOUND"
        });
      }

      res.json(session);
    } catch (error) {
      console.error('Error updating chat session:', error);
      res.status(500).json({
        error: "Failed to update chat session",
        code: "UPDATE_ERROR"
      });
    }
  }

  async togglePin(req: Request, res: Response) {
    try {
      const { isPinned } = req.body;
      const sessionId = parseInt(req.params.id);

      const [session] = await db.update(sessions)
        .set({
          isPinned: isPinned,
          updatedAt: new Date()
        })
        .where(eq(sessions.id, sessionId))
        .returning();

      if (!session) {
        return res.status(404).json({
          error: "Chat session not found",
          code: "NOT_FOUND"
        });
      }

      res.json(session);
    } catch (error) {
      console.error('Error toggling pin status:', error);
      res.status(500).json({
        error: "Failed to update pin status",
        code: "UPDATE_ERROR"
      });
    }
  }

  async deleteSession(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);

      const [session] = await db.delete(sessions)
        .where(eq(sessions.id, sessionId))
        .returning();

      if (!session) {
        return res.status(404).json({
          error: "Chat session not found",
          code: "NOT_FOUND"
        });
      }

      res.status(204).end();
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({
        error: "Failed to delete chat session",
        code: "DELETE_ERROR"
      });
    }
  }

  async addFeedback(req: Request, res: Response) {
    try {
      const sessionId = parseInt(req.params.id);
      const queryId = parseInt(req.params.queryId);
      const { rating, helpful, comment } = req.body;

      // Validate input
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({
          error: "Invalid rating. Must be between 1 and 5",
          code: "INVALID_INPUT"
        });
      }

      if (typeof helpful !== 'boolean') {
        return res.status(400).json({
          error: "Helpful field must be a boolean",
          code: "INVALID_INPUT"
        });
      }

      // Create feedback
      const [feedback] = await db.insert(queries)
        .values({
          queryId,
          rating,
          helpful,
          comment: comment || null,
        })
        .returning();

      res.json(feedback);
    } catch (error) {
      console.error('Error adding feedback:', error);
      res.status(500).json({
        error: "Failed to add feedback",
        code: "FEEDBACK_ERROR"
      });
    }
  }
}