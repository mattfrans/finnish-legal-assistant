import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { InputArea } from './InputArea';
import { FileAttachment } from '../../types';
import { useToast } from '../../hooks/use-toast';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  attachments?: { name: string; url: string }[];
  sources?: string[];
}

interface ChatInterfaceProps {
  initialSessionId?: string;
}

export function ChatInterface({ initialSessionId }: ChatInterfaceProps) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [languageMode, setLanguageMode] = useState('regular');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMessage = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!sessionId) throw new Error("No active session");
      const res = await fetch(`/api/chat/sessions/${sessionId}/chat`, {
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
          name: att.file.name,
          url: att.preview || ''
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
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (input: string) => {
    if (!sessionId) return;
    
    const formData = new FormData();
    formData.append('question', input);
    formData.append('languageMode', languageMode);
    
    attachments.forEach(att => {
      formData.append('files', att.file);
    });

    await sendMessage.mutateAsync(formData);
  };

  const handleFileSelect = (files: FileList) => {
    const newAttachments = Array.from(files).map((file) => ({
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                }`}
              >
                <p>{message.content}</p>
                {message.attachments && (
                  <div className="mt-2 flex gap-2">
                    {message.attachments.map((att, i) => (
                      <div key={i} className="text-sm text-blue-600">
                        {att.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <InputArea 
        onSubmit={handleSubmit}
        isLoading={sendMessage.isPending}
      />
    </div>
  );
}