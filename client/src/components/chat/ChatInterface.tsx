import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Pin, Trash2 } from "lucide-react";
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
import { MessageList } from "./MessageList";
import { InputArea } from "./InputArea";
import type { Message, FileAttachment, LanguageMode, ChatSession } from "./types";

interface ChatInterfaceProps {
  initialSessionId?: number;
}

export function ChatInterface({ initialSessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(initialSessionId || null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('regular');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create a new session if none exists
  const createSession = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to create session');
      return res.json();
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setIsInitialized(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to initialize chat. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      createSession.mutate();
    } else {
      setIsInitialized(true);
    }
  }, [sessionId]);

  // Cleanup URLs when component unmounts or attachments change
  useEffect(() => {
    return () => {
      attachments.forEach(att => URL.revokeObjectURL(att.preview));
    };
  }, [attachments]);

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files);
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
  };

  const handleSubmit = async (input: string) => {
    if (!sessionId) return;
    
    const formData = new FormData();
    formData.append('question', input);
    formData.append('languageMode', languageMode);
    
    attachments.forEach(att => {
      formData.append('files', att.file);
    });

    await sendMessage.mutate(formData);
  };

  const sendMessage = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!sessionId) throw new Error("No active session");
      const res = await fetch(`/api/v1/sessions/${sessionId}/chat`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to send message");
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
      setAttachments([]);
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer,
        sources: data.sources
      }]);
      queryClient.invalidateQueries({ queryKey: ['sessions', sessionId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (!isInitialized) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <InputArea
        onSubmit={handleSubmit}
        onFileSelect={handleFileSelect}
        attachments={attachments}
        onRemoveAttachment={(index) => {
          setAttachments(prev => {
            const newAttachments = [...prev];
            URL.revokeObjectURL(newAttachments[index].preview);
            newAttachments.splice(index, 1);
            return newAttachments;
          });
        }}
        languageMode={languageMode}
        onLanguageChange={setLanguageMode}
        isLoading={sendMessage.isPending}
      />
    </div>
  );
}