import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { MessageBubble } from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

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

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { link: string; title: string; section?: string }[];
}

interface ChatInterfaceProps {
  initialSessionId?: number;
}

export function ChatInterface({ initialSessionId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create a new chat session
  const createSession = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to create chat session");
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setIsInitialized(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create chat session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize session
  useEffect(() => {
    if (!isInitialized) {
      if (initialSessionId) {
        setSessionId(initialSessionId);
        setIsInitialized(true);
      } else {
        createSession.mutate();
      }
    }
  }, [initialSessionId, isInitialized]);

  // Fetch session data and messages
  const { data: sessionData } = useQuery<ChatSession>({
    queryKey: [`/api/sessions/${sessionId}`],
    enabled: sessionId !== null,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0,
  });

  // Update messages when session data changes
  useEffect(() => {
    if (sessionData?.queries) {
      const sortedQueries = [...sessionData.queries].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      const messageList: Message[] = sortedQueries.flatMap(q => [
        { role: "user", content: q.question },
        { role: "assistant", content: q.answer, sources: q.sources }
      ]);
      
      setMessages(messageList);
    }
  }, [sessionData]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (question: string) => {
      if (!sessionId) throw new Error("No active session");
      
      const res = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to send message");
      }
      
      return res.json();
    },
    onMutate: (question) => {
      // Optimistically update UI
      setMessages(prev => [...prev, { role: "user", content: question }]);
      setInput("");
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: data.answer,
        sources: data.sources 
      }]);
      // Refresh session data
      queryClient.invalidateQueries({ queryKey: [`/api/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Remove the optimistic update
      setMessages(prev => prev.slice(0, -1));
    },
  });

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    sendMessage.mutate(trimmedInput);
  };

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <MessageBubble key={`${sessionId}-${i}`} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your legal question..."
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={sendMessage.isPending}
        />
        <Button 
          onClick={handleSubmit}
          disabled={sendMessage.isPending || !input.trim()}
          className="px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
