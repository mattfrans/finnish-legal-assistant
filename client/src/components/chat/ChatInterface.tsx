import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { InputArea } from './InputArea';
import { FileAttachment } from '../../types';

interface ChatInterfaceProps {
  initialSessionId?: string;
}

export function ChatInterface({ initialSessionId }: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [messages, setMessages] = useState([]);
  const [languageMode, setLanguageMode] = useState('regular');
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

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

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...attachments];
    if (newAttachments[index]?.preview) {
      URL.revokeObjectURL(newAttachments[index].preview!);
    }
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const sendMessage = useQuery({
    queryFn: async (formData: FormData) => {
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
      const userMessage: any = {
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
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Chat messages will go here */}
          </div>
        </ScrollArea>
      </div>
      <InputArea
        onSubmit={handleSubmit}
        onFileSelect={handleFileSelect}
        attachments={attachments}
        onRemoveAttachment={handleRemoveAttachment}
        languageMode={languageMode}
        onLanguageChange={setLanguageMode}
      />
    </div>
  );
}