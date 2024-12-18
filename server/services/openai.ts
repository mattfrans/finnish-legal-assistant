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

  async analyzeImage(base64Image: string): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a Finnish legal assistant analyzing images in a legal context. Focus on identifying legally relevant details and potential legal implications."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this image in the context of Finnish law. Identify any legal documents, relevant details, or potential legal implications."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ],
          },
        ],
        max_tokens: 500
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error analyzing image:', error);
      return 'Failed to analyze image content';
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
