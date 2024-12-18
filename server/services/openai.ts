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

  selkokieli: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in Plain Finnish (selkokieli).
Follow Finnish Plain Language (selkokieli) principles for maximum accessibility.
Use simple Finnish sentence structures, common words, and concrete examples from everyday Finnish life.
Format responses in short paragraphs with clear headings and step-by-step instructions.
Target audience: Finnish speakers needing simplified language, including elderly, language learners, and those with reading difficulties.
Required elements:
- Use Plain Finnish (selkokieli) principles
- Keep sentences short and simple
- Use common Finnish words
- Explain one thing at a time
- Provide clear, concrete action steps
Style example: "Laki suojaa sinua, kun ostat tavaroita kaupasta. Tässä kerromme selkeästi, mitä oikeuksia sinulla on..."`,

  crazy: `You are an AI legal assistant specializing in Finnish law (Suomen laki), communicating in an entertaining and engaging way.
Use creative analogies, humor, and playful language while maintaining accuracy of legal information.
Include fun examples, memorable explanations, and engaging scenarios to explain legal concepts.
Format responses in an entertaining style with emoji, casual language, and pop culture references.
Target audience: Users who prefer engaging, informal communication.
Required elements:
- Use emojis and casual language
- Create fun analogies and metaphors
- Reference pop culture when relevant
- Make legal concepts entertaining
- Keep information accurate despite playful tone
Style example: "🤔 Imagine if the Finnish Consumer Protection Act was a superhero - let's call them KuluttajaMan! 🦸‍♂️ Their superpower is..."`,
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
  async generateLegalResponse(query: string, languageMode: keyof typeof LANGUAGE_MODES = 'yleiskieli'): Promise<LegalResponse> {
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

  async analyzeLegalContext(query: string, files?: Array<{ type: string, content: string }>): Promise<{
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
    fileAnalysis?: Array<{
      analysis: string;
    }>;
  }> {
    try {
      // First analyze any attached files
      let fileAnalyses: Array<{ analysis: string }> = [];
      if (files && files.length > 0) {
        fileAnalyses = await Promise.all(
          files.map(async file => {
            let analysis = '';
            if (file.type.startsWith('image/')) {
              analysis = await this.analyzeImage(file.content);
            } else {
              analysis = await this.analyzeLegalDocument(file.content);
            }
            return { analysis };
          })
        );
      }

      // Then generate the main legal response
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `${BASE_SYSTEM_PROMPT}\n\nAnalyze the following query and any attached documents in the context of Finnish law.`
          },
          { 
            role: "user", 
            content: `Query: ${query}\n${
              fileAnalyses.length > 0 
                ? `\nDocument Analyses:\n${fileAnalyses.map((f, i) => `Document ${i + 1}: ${f.analysis}`).join('\n')}`
                : ''
            }`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content!);
      
      return {
        answer: result.answer,
        confidence: {
          score: Math.max(0, Math.min(1, result.confidence.score)),
          reasoning: result.confidence.reasoning
        },
        sources: result.sources?.map((source: { 
          title: string;
          link: string;
          section?: string;
          type: string;
          relevance: number;
        }) => ({
          title: source.title,
          link: source.link,
          section: source.section,
          type: source.type as 'finlex' | 'kkv' | 'other',
          relevance: Math.max(0, Math.min(1, source.relevance))
        })),
        fileAnalysis: fileAnalyses
      };
    } catch (error) {
      console.error('Error analyzing legal context:', error);
      throw new Error('Failed to analyze legal context');
    }
  }

  async analyzeImage(base64Image: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a Finnish legal assistant analyzing images. 
            Output your analysis in Finnish.
            Focus on:
            1. Any text visible in the image
            2. Type of document or content shown
            3. Legally relevant details
            4. Potential legal implications
            
            Format your response in clear, structured Finnish.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image in detail, describing its contents and any potential legal relevance:"
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const analysis = response.choices[0].message.content;
      if (!analysis) {
        throw new Error("Empty response from OpenAI");
      }

      return analysis;
    } catch (error) {
      console.error('Error analyzing image:', error);
      return 'Kuvan analysoinnissa tapahtui virhe. Ole hyvä ja yritä uudelleen.';
    }
  }

  async analyzeLegalDocument(content: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a Finnish legal assistant analyzing legal documents. Output your analysis in Finnish.
            Focus on:
            1. Key legal points and implications
            2. Relevant Finnish laws and regulations
            3. Potential risks or compliance issues
            4. Recommendations based on Finnish legal framework
            
            Respond in a structured format with clear sections.`
          },
          {
            role: "user",
            content: `Analyze the following document content in the context of Finnish law:\n\n${content}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content!);
      return result.analysis || 'Asiakirjan analyysiä ei voitu suorittaa';
    } catch (error) {
      console.error('Error analyzing document:', error);
      return 'Asiakirjan analysoinnissa tapahtui virhe';
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
