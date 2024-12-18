import { useState, useEffect, useRef } from "react";
import { LanguageSelector } from "./LanguageSelector";
import { addDocument } from "@/lib/preview-events";
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
  const [recommendedPrompts, setRecommendedPrompts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('regular');

  const sendMessage = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!sessionId) throw new Error("No active session");
      
      // Add language mode to form data
      formData.append('languageMode', languageMode);
      
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

  // Fetch suggestions when messages change
  useEffect(() => {
    if (messages.length > 0 && !sendMessage.isPending) {
      fetch(`/api/v1/sessions/${sessionId}/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-3).map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      })
      .then(res => res.json())
      .then(data => setRecommendedPrompts(data.suggestions))
      .catch(console.error);
    }
  }, [messages, sendMessage.isPending, sessionId]);

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

  const handleSubmit = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && attachments.length === 0) return;
    
    const formData = new FormData();
    formData.append('question', trimmedInput);
    
    // Add language mode to form data
    formData.append('languageMode', languageMode);
    
    // Process attachments - convert to base64 for AI analysis
    const processedAttachments = await Promise.all(
      attachments.map(async (att) => {
        return new Promise<{ file: File, content: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64Content = reader.result as string;
            const base64Data = base64Content.split(',')[1]; // Remove data URL prefix
            resolve({ file: att.file, content: base64Data });
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          if (att.file.type.startsWith('image/')) {
            reader.readAsDataURL(att.file);
          } else {
            reader.readAsText(att.file);
          }
        });
      })
    );
    
    // Append files and their content for AI analysis
    processedAttachments.forEach((att) => {
      formData.append('attachments', att.file);
      formData.append('attachmentContents', att.content);
      formData.append('attachmentTypes', att.file.type);
    });
    
    sendMessage.mutate(formData);
    setAttachments([]); // Clear attachments after sending
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

      // Create preview URLs and add to attachments
      const newAttachments = newFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setAttachments(prev => [...prev, ...newAttachments]);
      
      // Add to document sidebar
      newFiles.forEach(file => {
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          title: file.name,
          content: `File type: ${file.type}, Size: ${(file.size / 1024).toFixed(2)} KB`,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          timestamp: new Date().toISOString()
        });
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {sessionId && (
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  {sessionData?.title || 'New Chat'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{sessionData?.title || 'New Chat'}</DialogTitle>
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
                    await queryClient.invalidateQueries({ queryKey: [`/api/v1/sessions/${sessionId}`] });
                    await queryClient.invalidateQueries({ queryKey: ['/api/v1/sessions'] });
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
                    <Input 
                      id="title" 
                      name="title" 
                      defaultValue={sessionData?.title}
                      placeholder="Enter chat title" 
                    />
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
            
            {messages.length > 0 && recommendedPrompts.length > 0 && (
              <div className="space-y-2 mt-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-px flex-1 bg-border/50"/>
                  <span>Follow-up Questions</span>
                  <div className="h-px flex-1 bg-border/50"/>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {recommendedPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: 0.1 * index }}
                      onClick={() => {
                        const formData = new FormData();
                        formData.append('question', prompt);
                        formData.append('languageMode', languageMode);
                        sendMessage.mutate(formData);
                      }}
                      className="flex items-center gap-3 p-4 text-sm bg-card/50 hover:bg-accent/5 shadow-sm hover:shadow-md rounded-lg transition-all duration-200 text-left w-full transform-gpu hover:translate-x-1 border border-border/20 hover:border-border/40"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                        <span className="text-xs text-primary/80 font-medium">{index + 1}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="line-clamp-2 text-sm font-medium">{prompt}</span>
                        <span className="text-xs text-muted-foreground">Click to ask this follow-up question</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            
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