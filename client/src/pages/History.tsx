import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, ChevronRight } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Button } from "@/components/ui/button";

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  queries: Array<{
    id: number;
    question: string;
    answer: string;
    sources: Array<{ link: string; title: string; section?: string }>;
    createdAt: string;
  }>;
}

export function History() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  
  const { data: sessions, isLoading } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
    staleTime: 0,
    cacheTime: 0,
  });

  // Return to session list
  const handleBack = () => {
    setSelectedSession(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading chat history...</p>
      </div>
    );
  }

  if (selectedSession) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Back to History
          </Button>
        </div>
        <div className="flex-1">
          <ChatInterface 
            key={selectedSession} 
            initialSessionId={selectedSession} 
          />
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {sessions?.map((session) => (
          <Card
            key={session.id}
            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => setSelectedSession(session.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {session.title || 'Chat Session'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </p>
                  {session.queries?.[0] && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {session.queries[0].question}
                    </p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
