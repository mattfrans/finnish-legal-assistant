import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, ChevronRight } from "lucide-react";
import { ChatInterface } from "@/components/chat/ChatInterface";

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
  
  const { data: sessions, isLoading: isLoadingSessions } = useQuery<ChatSession[]>({
    queryKey: ["/api/sessions"],
  });

  const { data: sessionDetails, isLoading: isLoadingDetails } = useQuery<ChatSession>({
    queryKey: [`/api/sessions/${selectedSession}`],
    enabled: selectedSession !== null,
  });

  if (isLoadingSessions) {
    return <div className="p-4">Loading...</div>;
  }

  if (selectedSession && sessionDetails) {
    return (
      <ScrollArea className="h-full">
        <div className="h-full">
          <ChatInterface initialSessionId={selectedSession} />
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {sessions?.map((session) => (
          <Card
            key={session.id}
            className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => setSelectedSession(session.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Chat Session</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
