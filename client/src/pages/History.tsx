import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { ChevronRight, MessageCircle, Pin, Pencil, Trash2, FileText } from "lucide-react";

interface ChatSession {
  id: number;
  title: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  queries?: Array<{
    id: number;
    question: string;
    answer: string;
    createdAt: string;
  }>;
}

interface RenameChatDialogProps {
  session: ChatSession;
  onClose: () => void;
}

function RenameChatDialog({ session, onClose }: RenameChatDialogProps) {
  const [title, setTitle] = useState(session.title);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/v1/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      
      if (!res.ok) throw new Error('Failed to rename chat');
      
      queryClient.invalidateQueries({ queryKey: ['/api/v1/sessions'] });
      toast({ description: 'Chat renamed successfully' });
      onClose();
    } catch (error) {
      toast({ 
        title: 'Error',
        description: 'Failed to rename chat',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter chat title"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export function History() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery<ChatSession[]>({
    queryKey: ['/api/v1/sessions'],
    gcTime: 0,
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      const res = await fetch(`/api/v1/sessions/${id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error('Failed to update pin status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/sessions'] });
      toast({ description: 'Pin status updated' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update pin status',
        variant: 'destructive',
      });
    },
  });

  const deleteChat = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/v1/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete chat');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/sessions'] });
      toast({ description: 'Chat deleted successfully' });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete chat',
        variant: 'destructive',
      });
    },
  });

  // Sort sessions: pinned first, then by date
  const sortedSessions = sessions?.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

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
      <div className="max-w-4xl mx-auto p-4 space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Chat History</h2>
          {sortedSessions?.map((session) => (
            <Card
              key={session.id}
              className="p-4 hover:bg-muted/50 transition-colors relative group"
            >
              <div className="flex items-center justify-between">
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer" 
                  onClick={() => setSelectedSession(session.id)}
                >
                  <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {session.title || 'Chat Session'}
                      </p>
                      {session.isPinned && (
                        <Pin className="h-3 w-3 text-primary fill-primary" />
                      )}
                    </div>
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
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{session.title || 'New Chat'}</DialogTitle>
                      </DialogHeader>
                      <RenameChatDialog 
                        session={session} 
                        onClose={(e: Event) => {
                          e?.preventDefault();
                          const dialogTrigger = document.querySelector('[data-state="open"]');
                          if (dialogTrigger instanceof HTMLButtonElement) {
                            dialogTrigger.click();
                          }
                        }} 
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => togglePin.mutate({ 
                      id: session.id, 
                      isPinned: !session.isPinned 
                    })}
                  >
                    <Pin className={`h-4 w-4 ${session.isPinned ? 'text-primary fill-primary' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-destructive"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this chat?')) {
                        deleteChat.mutate(session.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
