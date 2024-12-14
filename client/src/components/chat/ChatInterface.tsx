import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageBubble } from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: { link: string; title: string; section?: string }[];
}

export function ChatInterface() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (question: string) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      
      if (!res.ok) throw new Error("Failed to send message");
      return res.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, 
        { role: "assistant", content: data.answer, sources: data.sources }
      ]);
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: input }]);
    mutation.mutate(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
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
        />
        <Button 
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
