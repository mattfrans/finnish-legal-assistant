import { useState, useEffect, useRef } from "react";
import { LanguageSelector } from "./LanguageSelector";
type LanguageMode = 'professional' | 'regular' | 'simple' | 'crazy';
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { MessageBubble } from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Pencil, Pin, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatSession {
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
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('regular');

  // Legal-focused recommended prompts
  const recommendedPrompts = [
    "1. Markkinointi ja menettelyt asiakassuhteessa...",
    "2. Kuluttajalla on oikeus..."
  ];

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
      const res = await fetch("/api/v1/sessions", {
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

  // Fetch session data
  const { data: sessionData } = useQuery<ChatSession>({
    queryKey: [`/api/v1/sessions/${sessionId}`],
    enabled: sessionId !== null,
    staleTime: 0,
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
        { 
          role: "assistant", 
          content: q.answer,
          sources: q.sources
        }
      ]);
      
      setMessages(messageList);
    }
  }, [sessionData]);

  const sendMessage = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!sessionId) throw new Error("No active session");
      
      const res = await fetch(`/api/v1/sessions/${sessionId}/chat`, {
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
      queryClient.invalidateQueries({ queryKey: [`/api/v1/sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/v1/sessions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
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
        preview: URL.createObjectURL(file)
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {sessionId && (
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Rename Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename Chat</DialogTitle>
                </DialogHeader>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const title = formData.get('title') as string;
                  try {
                    const res = await fetch(`/api/v1/sessions/${sessionId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ title: title.trim() }),
                    });
                    if (!res.ok) throw new Error('Failed to rename chat');
                    const data = await res.json();
                    queryClient.invalidateQueries({ queryKey: [`/api/v1/sessions/${sessionId}`] });
                    queryClient.invalidateQueries({ queryKey: ['/api/v1/sessions'] });
                    setShowRenameDialog(false);
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to rename chat",
                      variant: "destructive",
                    });
                  }
                }} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" placeholder="Enter chat title" />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector
              currentMode={languageMode}
              onSelect={setLanguageMode}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/v1/sessions/${sessionId}/pin`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isPinned: !sessionData?.isPinned }),
                  });
                  if (!res.ok) throw new Error('Failed to update pin status');
                  queryClient.invalidateQueries({ queryKey: ['/api/v1/sessions'] });
                  toast({ description: 'Pin status updated' });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to update pin status",
                    variant: "destructive",
                  });
                }
              }}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                animate={{ 
                  scale: sessionData?.isPinned ? 1.1 : 1,
                  rotate: sessionData?.isPinned ? [0, 15, -15, 0] : 0,
                }}
                transition={{ 
                  duration: 0.3,
                  type: "spring",
                  stiffness: 200
                }}
              >
                <Pin className={`h-4 w-4 transition-all duration-300 ${
                  sessionData?.isPinned ? 'fill-primary stroke-primary' : ''
                }`} />
              </motion.div>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hover:text-destructive"
              onClick={() => {
                if (confirm('Are you sure you want to delete this chat?')) {
                  fetch(`/api/v1/sessions/${sessionId}`, { method: 'DELETE' })
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/v1/sessions'] });
                      window.location.href = '/history';
                    })
                    .catch(() => {
                      toast({
                        title: "Error",
                        description: "Failed to delete chat",
                        variant: "destructive",
                      });
                    });
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble 
                key={`${sessionId}-${i}`} 
                message={{
                  ...msg,
                  id: i,
                  sessionId: sessionId || undefined
                }} 
              />
            ))}
            
            <AnimatePresence>
              <motion.div 
                layout
                className="flex flex-col items-end space-y-4 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div 
                  className="text-sm text-muted-foreground ml-auto mr-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Tämä perustuu kuluttajansuojalakiin (1978/038) ja KKV:n ohjeistuksiin.
                </motion.div>
                
                {recommendedPrompts.slice(0, 2).map((prompt, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                    onClick={() => {
                      const formData = new FormData();
                      formData.append('question', prompt);
                      sendMessage.mutate(formData);
                    }}
                    className="bg-muted hover:bg-accent p-4 rounded-lg cursor-pointer transition-all duration-200 text-sm max-w-[80%] transform-gpu hover:scale-[1.02] ml-auto mr-4"
                  >
                    {prompt}
                  </motion.div>
                ))}
                
                {messages.length > 0 && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => {
                      if (messages.length > 0) {
                        const lastUserMessage = messages[messages.length - 2];
                        if (lastUserMessage?.role === 'user') {
                          const formData = new FormData();
                          formData.append('question', lastUserMessage.content);
                          sendMessage.mutate(formData);
                        }
                      }
                    }}
                    className="ml-auto mr-4 flex items-center gap-2 p-3 text-sm bg-muted hover:bg-accent rounded-lg transition-all duration-200 transform-gpu hover:scale-[1.02]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-4 w-4"
                      stroke="currentColor"
                    >
                      <path
                        d="M13.5 8.5a5.5 5.5 0 1 1-.724-2.747l1.224.24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Regenerate response
                  </motion.button>
                )}
              </motion.div>
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="p-4 flex items-center gap-2">
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
  );
}