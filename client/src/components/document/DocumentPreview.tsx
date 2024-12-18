import { FileText, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Citation {
  title: string;
  content: string;
  source: string;
  relevance: number;
}

export function DocumentPreview() {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

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
          Show Preview
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Preview
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMinimized(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {activeCitation ? (
          <div className="p-4">
            <h3 className="font-medium mb-2">{activeCitation.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeCitation.content}
            </p>
            <p className="text-xs text-muted-foreground">
              Source: {activeCitation.source}
            </p>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Select a citation or document to preview</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
