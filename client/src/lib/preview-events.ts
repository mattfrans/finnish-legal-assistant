type PreviewEventTypes = {
  'new-citation': {
    id: string;
    title: string;
    content: string;
    source: string;
    url: string;
    type: 'finlex' | 'kkv' | 'other';
    relevance: number;
    timestamp: string;
  };
  'new-document': {
    id: string;
    title: string;
    content: string;
    url?: string;
    type: string;
    timestamp: string;
  };
};

export function dispatchPreviewEvent<T extends keyof PreviewEventTypes>(
  eventName: T,
  detail: PreviewEventTypes[T]
) {
  const event = new CustomEvent(eventName, {
    detail,
    bubbles: true,
  });
  window.dispatchEvent(event);
}

// Helper functions for common events
export function addCitation(citation: PreviewEventTypes['new-citation']) {
  dispatchPreviewEvent('new-citation', {
    ...citation,
    timestamp: citation.timestamp || new Date().toISOString(),
  });
}

export function addDocument(document: PreviewEventTypes['new-document']) {
  dispatchPreviewEvent('new-document', {
    ...document,
    timestamp: document.timestamp || new Date().toISOString(),
  });
}
