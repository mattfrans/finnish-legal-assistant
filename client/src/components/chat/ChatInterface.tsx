import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { MessageBubble } from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, X } from "lucide-react";
import { Label } from "@/components/ui/label";

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

interface FileAttachment {
  file: File;
  preview: string;
}

interface ChatInterfaceProps {
  initialSessionId?: number;
}

export function ChatInterface({ initialSessionId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const recommendedPrompts = [
    "Mitä oikeuksia minulla on kuluttajana verkkokaupassa?",
    "Miten voin tehdä reklamaation viallisesta tuotteesta?",
    "Kerro työsopimuksen irtisanomisen säännöistä"
  ];
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
    gcTime: 0,
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
    mutationFn: async (formData: FormData) => {
      if (!sessionId) throw new Error("No active session");
      
      const res = await fetch(`/api/sessions/${sessionId}/chat`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to send message");
      }
      
      return res.json();
    },
    onMutate: (formData) => {
      const question = formData.get('question') as string;
      // Only add user message with serializable data
      const userMessage: Message = {
        role: "user",
        content: question,
        attachments: attachments.map(att => ({
          filename: att.file.name,
          contentType: att.file.type,
          size: att.file.size,
          type: att.file.type.startsWith('image/') ? 'image' : 'document',
          url: att.preview
        }))
      };
      setMessages(prev => [...prev, userMessage]);
      setInput("");
      setAttachments([]);
    },
    onSuccess: (data) => {
      const newMessage: Message = { 
        role: "assistant", 
        content: data.answer,
        sources: data.sources
      };
      setMessages(prev => [...prev.slice(0, -1), prev[prev.length - 1], newMessage]);
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
    if (!trimmedInput && attachments.length === 0) return;
    
    const formData = new FormData();
    formData.append('question', trimmedInput);
    attachments.forEach(att => {
      formData.append('attachments', att.file);
    });
    
    sendMessage.mutate(formData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalSize = newFiles.reduce((acc, file) => acc + file.size, 0);
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (totalSize > maxSize) {
        toast({
          title: "Error",
          description: "Total file size cannot exceed 5MB",
          variant: "destructive",
        });
        return;
      }

      const newAttachments = newFiles.map(file => ({
        file,
        preview: file.type.startsWith('image/') 
          ? URL.createObjectURL(file)
          : URL.createObjectURL(file)
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 mb-4">
          {recommendedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => {
                setInput(prompt);
                const formData = new FormData();
                formData.append('question', prompt);
                sendMessage.mutate(formData);
              }}
              className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-md">
            {attachments.map((att, index) => (
              <div key={index} className="flex items-center gap-2 bg-background p-1 rounded">
                <span className="text-sm truncate max-w-[200px]">{att.file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    URL.revokeObjectURL(att.preview);
                    setAttachments(prev => prev.filter((_, i) => i !== index));
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="outline"
            size="icon"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMessage.isPending}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
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
            disabled={sendMessage.isPending || (!input.trim() && attachments.length === 0)}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
