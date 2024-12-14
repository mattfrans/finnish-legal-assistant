export interface Citation {
  id: string;
  title: string;
  url: string;
  type: 'statute' | 'case' | 'guideline';
  relevance: number;
  section?: string;
  effectiveDate?: string;
  jurisdiction: 'FI' | 'EU';
}

export interface DateRange {
  from: string;
  to?: string;
}

export interface LegalResponse {
  answer: string;
  confidence: {
    score: number;
    reasoning: string;
  };
  citations: {
    statutes: Citation[];
    cases: Citation[];
    guidelines: Citation[];
  };
  context: {
    relevantSections: string[];
    effectiveDates: DateRange;
    jurisdiction: string;
  };
  metadata: {
    processingTime: number;
    sourcesUsed: string[];
    lastUpdated: string;
  };
}

export interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

export interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  queries?: Query[];
}

export interface Query {
  id: number;
  sessionId: number;
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
  legalContext?: string;
  confidence?: {
    score: number;
    reasoning: string;
  };
  createdAt: string;
}