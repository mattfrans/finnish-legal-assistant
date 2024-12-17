import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface LegalResponse {
  answer: string;
  confidence: {
    score: number;
    reasoning: string;
  };
  sources?: Array<{
    title: string;
    link: string;
    section?: string;
    type: 'finlex' | 'kkv' | 'other';
    relevance: number;
  }>;
}

const LANGUAGE_MODES = {
  professional: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating as a highly professional legal expert.
Use sophisticated legal terminology, precise citations, and formal academic language.
Include relevant legal precedents and thorough analysis of legal implications.
Format responses in a structured, professional legal document style.
Target audience: Legal professionals, lawyers, and academics.`,

  regular: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in a clear, balanced manner.
Use standard professional language with some legal terms explained when necessary.
Include relevant legal information while maintaining accessibility.
Format responses in a clear, well-structured style.
Target audience: Educated adults and business professionals.`,

  simple: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in simple, everyday language.
Avoid legal jargon, use simple explanations and practical examples.
Focus on the practical implications and actionable advice.
Format responses in a conversational, easy-to-understand style.
Target audience: General public with no legal background.`,

  crazy: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in an entertaining and engaging way.
Use creative analogies, humor, and playful language while maintaining accuracy.
Include fun examples and memorable explanations of legal concepts.
Format responses in an entertaining style with emoji and casual language.
Target audience: Users who prefer engaging, informal communication.`
};

const BASE_SYSTEM_PROMPT = `Your primary focus is helping users understand Finnish legal concepts, rights, and obligations.

Key responsibilities:
1. Provide accurate information based on current Finnish legislation
2. Reference specific laws and regulations from Finlex when applicable
3. Include consumer protection guidelines from KKV (Kilpailu- ja kuluttajavirasto) when relevant
4. Express confidence levels and reasoning for your answers
5. If you're unsure about something, clearly state it and suggest consulting a legal professional

Format your response as a JSON object with the following structure:
{
  "answer": "Your detailed response in Finnish and English",
  "confidence": {
    "score": "Number between 0 and 1",
    "reasoning": "Explanation of your confidence level"
  },
  "sources": [
    {
      "title": "Name of the law or guideline",
      "link": "URL to the source",
      "section": "Specific section if applicable",
      "type": "finlex or kkv or other",
      "relevance": "Number between 0 and 1"
    }
  ]
}`;

export class OpenAIService {
  async generateLegalResponse(query: string, languageMode: 'professional' | 'regular' | 'simple' | 'crazy' = 'regular'): Promise<LegalResponse> {
    try {
      const modePrompt = LANGUAGE_MODES[languageMode];
      const systemPrompt = `${modePrompt}\n\n${BASE_SYSTEM_PROMPT}`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: languageMode === 'crazy' ? 0.9 : 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const result = JSON.parse(content);
      
      // Validate and clean the response
      return {
        answer: result.answer,
        confidence: {
          score: Math.max(0, Math.min(1, result.confidence.score)),
          reasoning: result.confidence.reasoning
        },
        sources: result.sources?.map(source => ({
          title: source.title,
          link: source.link,
          section: source.section,
          type: source.type as 'finlex' | 'kkv' | 'other',
          relevance: Math.max(0, Math.min(1, source.relevance))
        }))
      };
    } catch (error) {
      console.error('Error generating legal response:', error);
      throw new Error('Failed to generate legal response');
    }
  }

  async analyzeLegalContext(query: string, relevantSections?: string[]): Promise<{
    context: string;
    confidence: number;
  }> {
    try {
      const contextPrompt = `Analyze the following legal query in the context of Finnish law:
Query: ${query}
${relevantSections ? `Relevant sections:\n${relevantSections.join('\n')}` : ''}

Provide a JSON response with:
{
  "context": "Brief analysis of the legal context and applicable Finnish laws",
  "confidence": "Number between 0 and 1 indicating confidence in the analysis"
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contextPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return {
        context: result.context,
        confidence: Math.max(0, Math.min(1, result.confidence))
      };
    } catch (error) {
      console.error('Error analyzing legal context:', error);
      throw new Error('Failed to analyze legal context');
    }
  }

  async generateChatSuggestions(context: { messages: Array<{ role: "user" | "assistant"; content: string }> }): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a Finnish legal assistant. Based on the conversation history, generate 3 relevant follow-up questions that the user might want to ask. Focus on Finnish law and regulations. The questions should be specific and contextual to the previous conversation.

Output a JSON object with this structure:
{
  "suggestions": [
    "specific question 1",
    "specific question 2",
    "specific question 3"
  ]
}`
          },
          ...context.messages.slice(-3),
          {
            role: "user",
            content: "Based on our conversation, what are 3 specific follow-up questions I might want to ask?"
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const result = JSON.parse(content);
      return result.suggestions || [];
    } catch (error) {
      console.error('Error generating chat suggestions:', error);
      return [
        "Could you explain more about my legal rights in this situation?",
        "What are the specific requirements under Finnish law?",
        "Are there any relevant precedent cases I should know about?"
      ];
    }
  }
}
