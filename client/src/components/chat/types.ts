export type LanguageMode = 'professional' | 'regular' | 'simple' | 'crazy';

export interface FileAttachment {
  file: File;
  preview: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    link: string;
    title: string;
    section?: string;
    type?: 'finlex' | 'kkv' | 'other';
    identifier?: string;
    relevance: number;
  }>;
  attachments?: Array<{
    filename: string;
    url: string;
    contentType: string;
    size: number;
    type: 'image' | 'document';
  }>;
}

export interface ChatSession {
  id: number;
  title: string;
  isPinned: boolean;
  createdAt: string;
  queries?: Array<{
    id: number;
    question: string;
    answer: string;
    sources?: Array<{
      link: string;
      title: string;
      section?: string;
      type?: 'finlex' | 'kkv' | 'other';
      identifier?: string;
      relevance: number;
    }>;
    createdAt: string;
  }>;
}
