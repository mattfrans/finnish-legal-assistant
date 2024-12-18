import { FileText, X, Link as LinkIcon, Clock, ExternalLink } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Citation {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  type: 'finlex' | 'kkv' | 'other';
  relevance: number;
  timestamp: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  url?: string;
  type: string;
  timestamp: string;
}

interface PreviewItem {
  type: 'citation' | 'document';
  data: Citation | Document;
}

export function DocumentPreview() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeItem, setActiveItem] = useState<PreviewItem | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);

  // Subscribe to citation and document events
  useEffect(() => {
    const handleNewCitation = (event: CustomEvent<Citation>) => {
      setCitations(prev => [event.detail, ...prev]);
    };

    const handleNewDocument = (event: CustomEvent<Document>) => {
      setDocuments(prev => [event.detail, ...prev]);
    };

    window.addEventListener('new-citation', handleNewCitation as EventListener);
    window.addEventListener('new-document', handleNewDocument as EventListener);

    return () => {
      window.removeEventListener('new-citation', handleNewCitation as EventListener);
      window.removeEventListener('new-document', handleNewDocument as EventListener);
    };
  }, []);

  const handleItemClick = (item: PreviewItem) => {
    if (!item.data.url) {
        // If no URL is provided, show the item details in the preview pane
        setActiveItem(item);
      } else if (item.data.type === 'citation') {
        // For citations, open the URL in a new tab
        window.open(item.data.url, '_blank');
      } else {
        // For documents, show them in the preview pane
        setActiveItem(item);
      }
  };

  if (isMinimized) {
    return (
      <div className="p-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsMinimized(false)}
          className="w-full justify-start"
        >
          <FileText className="h-4 w-4 mr-2" />
          Näytä esikatselu
        </Button>
      </div>
    );
  }

  const renderPreviewContent = () => {
    if (!activeItem) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Valitse viittaus tai asiakirja esikatselua varten</p>
        </div>
      );
    }

    const item = activeItem.data;
    return (
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-medium">{item.title}</h3>
          {item.url && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.open(item.url, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Avaa</span>
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {item.content}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{new Date(item.timestamp).toLocaleDateString('fi-FI')}</span>
        </div>
      </div>
    );
  };

  const renderListItem = (item: PreviewItem) => {
    const { data } = item;
    return (
      <div
        key={data.id}
        onClick={() => handleItemClick(item)}
        className={cn(
          "p-3 border-b cursor-pointer hover:bg-accent transition-colors",
          activeItem?.data.id === data.id && "bg-accent"
        )}
      >
        <div className="flex items-start gap-2">
          {item.type === 'citation' ? (
            <LinkIcon className="h-4 w-4 mt-1 flex-shrink-0" />
          ) : (
            <FileText className="h-4 w-4 mt-1 flex-shrink-0" />
          )}
          <div>
            <h4 className="font-medium text-sm">{data.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {data.content}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Esikatselu
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="citations" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="citations" className="flex-1">Viittaukset</TabsTrigger>
          <TabsTrigger value="documents" className="flex-1">Asiakirjat</TabsTrigger>
        </TabsList>

        <div className="flex-1 flex">
          <div className="w-1/2 border-r">
            <ScrollArea className="h-full">
              <TabsContent value="citations" className="m-0">
                {citations.map(citation => renderListItem({
                  type: 'citation',
                  data: citation
                }))}
              </TabsContent>
              <TabsContent value="documents" className="m-0">
                {documents.map(document => renderListItem({
                  type: 'document',
                  data: document
                }))}
              </TabsContent>
            </ScrollArea>
          </div>

          <div className="w-1/2">
            <ScrollArea className="h-full">
              {renderPreviewContent()}
            </ScrollArea>
          </div>
        </div>
      </Tabs>
    </div>
  );
}