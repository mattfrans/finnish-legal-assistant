import OpenAI from "openai";

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
  lakimieskieli: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in formal legal Finnish.
Use precise Finnish legal terminology (lakikieli), citations from Finnish legislation, and formal academic language.
Include relevant precedents from the Finnish Supreme Court (KKO) and thorough analysis of legal implications.
Format responses in structured legal Finnish with proper citations to Finlex.
Target audience: Finnish legal professionals, lawyers, and academics.
Required elements:
- Start with formal Finnish legal citations and references
- Use proper Finnish legal terminology and Latin terms where established in Finnish legal practice
- Include relevant KKO precedents and legal practice guidelines
- Maintain strict academic Finnish writing standards
- Provide detailed analysis based on Finnish legal doctrine
Style example: "Kuluttajansuojalain (38/1978) 1 §:n 1 momentin mukaan, sekä korkeimman oikeuden ratkaisukäytännön mukaisesti (KKO:2019:42)..."`,

  yleiskieli: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in clear standard Finnish.
Use standard Finnish (yleiskieli), explain legal terms when used, and provide practical Finnish context.
Include relevant legal information while maintaining clarity and using everyday Finnish terminology.
Format responses in clear, well-structured Finnish with explanations of legal terms.
Target audience: Finnish adults and business professionals.
Required elements:
- Use clear, standard Finnish language
- Explain legal concepts in everyday terms
- Provide practical examples from Finnish context
- Define Finnish legal terms when used
- Focus on real-world applications in Finland
Style example: "Kuluttajansuojalain mukaan sinulla on kuluttajana seuraavat oikeudet tässä tilanteessa..."`,

  regular: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in English.
Provide clear explanations of Finnish law and legal concepts in English.
Include relevant legal information while maintaining clarity and accessibility.
Format responses in clear, well-structured English with explanations of Finnish legal terms.
Target audience: International professionals and English-speaking residents in Finland.
Required elements:
- Use clear, professional English
- Explain Finnish legal concepts in English terms
- Provide practical examples relevant to Finland
- Include original Finnish terms in parentheses when relevant
- Focus on real-world applications in Finland
Style example: "According to the Finnish Consumer Protection Act (Kuluttajansuojalaki), you have the following rights in this situation..."`
};

const BASE_SYSTEM_PROMPT = `Analyze legal questions in the context of Finnish law and provide accurate, well-reasoned responses.
Include relevant citations to Finnish legislation, case law, and legal practice.
Format your response as a JSON object with the following structure:

{
  "answer": "Your detailed response here",
  "confidence": {
    "score": "Number between 0 and 1",
    "reasoning": "Explanation of your confidence level"
  },
  "sources": [
    {
      "title": "Source title",
      "link": "URL to Finlex or other official source",
      "section": "Relevant section or paragraph",
      "type": "finlex | kkv | other",
      "relevance": "Number between 0 and 1"
    }
  ]
}`;

export class OpenAIService {
  async generateLegalResponse(query: string, languageMode: keyof typeof LANGUAGE_MODES = 'yleiskieli'): Promise<LegalResponse> {
    try {
      const modePrompt = LANGUAGE_MODES[languageMode];
      const systemPrompt = `${modePrompt}\n\n${BASE_SYSTEM_PROMPT}`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      try {
        const result = JSON.parse(content);
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
      } catch (parseError) {
        // If parsing fails, return a formatted response
        return {
          answer: content,
          confidence: {
            score: 0.7,
            reasoning: "Response format was non-standard"
          }
        };
      }
    } catch (error) {
      console.error('Error generating legal response:', error);
      throw new Error('Failed to generate legal response');
    }
  }

  async analyzeLegalContext(query: string, files?: Array<{ type: string, content: string, name: string }>) {
    try {
      // First analyze any attached files
      let fileAnalyses: Array<{ analysis: string; type: string; name: string }> = [];
      if (files && files.length > 0) {
        fileAnalyses = await Promise.all(
          files.map(async file => {
            let analysis = '';
            const mimeType = file.type || 'application/octet-stream';
            
            if (mimeType.startsWith('image/')) {
              analysis = await this.analyzeImage(file.content);
            } else {
              analysis = await this.analyzeLegalDocument(file.content);
            }
            
            return { 
              analysis,
              type: mimeType,
              name: file.name
            };
          })
        );
      }

      // Then generate the main legal response
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: `${BASE_SYSTEM_PROMPT}\n\nAnalyze the following query and any attached documents in the context of Finnish law.`
          },
          { 
            role: "user", 
            content: `Question: ${query}${
              fileAnalyses.length > 0 
                ? '\n\nDocument Analyses:\n' + fileAnalyses.map(f => 
                    `\n${f.name}:\n${f.analysis}`
                  ).join('\n')
                : ''
            }`
          }
        ],
        temperature: 0.7
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      try {
        const result = JSON.parse(content);
        return {
          ...result,
          fileAnalysis: fileAnalyses
        };
      } catch (parseError) {
        // If parsing fails, return a formatted response
        return {
          answer: content,
          confidence: {
            score: 0.7,
            reasoning: "Response format was non-standard"
          },
          fileAnalysis: fileAnalyses
        };
      }
    } catch (error) {
      console.error('Error analyzing legal context:', error);
      throw new Error('Failed to analyze legal context');
    }
  }

  private async analyzeImage(base64Image: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image in the context of Finnish law. What legal documents, forms, or relevant information do you see?"
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }

  private async analyzeLegalDocument(content: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a Finnish legal document analyzer. Extract and summarize key legal points, obligations, rights, and requirements from the document. Focus on relevance to Finnish law."
          },
          {
            role: "user",
            content
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error('Failed to analyze document');
    }
  }

  async generateChatSuggestions(context: { messages: Array<{ role: "user" | "assistant"; content: string }> }): Promise<string[]> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a Finnish legal assistant. Based on the conversation history, suggest 3 relevant follow-up questions the user might want to ask. Make them specific to Finnish law and the current context."
          },
          ...context.messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        ],
        temperature: 0.7,
        n: 3
      });

      return response.choices.map(choice => choice.message.content || '').filter(Boolean);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      throw new Error('Failed to generate suggestions');
    }
  }
}
