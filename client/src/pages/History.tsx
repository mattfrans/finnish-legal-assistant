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
          <h2 className="text-2xl font-semibold mb-4">Legal Document Templates</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start gap-4 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Service Agreement Template</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Standard service agreement template following Finnish contract law requirements.
                  </p>
                  <Button 
                    onClick={() => {
                      const content = `SERVICE AGREEMENT

This Service Agreement (the "Agreement") is made between:

[Service Provider Name]
Business ID: [Business ID]
Address: [Address]

and

[Client Name]
Business ID/Personal ID: [ID]
Address: [Address]

1. SERVICES
1.1 The Service Provider agrees to provide the following services:
[Detailed description of services]

2. TERM AND TERMINATION
2.1 This Agreement commences on [start date] and continues until [end date].
2.2 Either party may terminate this Agreement with [X] days written notice.

3. FEES AND PAYMENT
3.1 The Client agrees to pay [amount] EUR for the services.
3.2 Payment terms: [payment schedule and method]

4. CONFIDENTIALITY
4.1 Both parties agree to maintain the confidentiality of any proprietary information.

5. APPLICABLE LAW
5.1 This Agreement is governed by Finnish law.

Signed on [date]

_____________________          _____________________
[Service Provider]             [Client]`;
                      
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'service-agreement-template.txt';
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}
                    className="w-full"
                  >
                    Download Template
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-start gap-4 mb-4">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold">Privacy Policy Template</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    GDPR-compliant privacy policy template for Finnish businesses.
                  </p>
                  <Button 
                    onClick={() => {
                      const content = `PRIVACY POLICY

Last updated: [Date]

1. INTRODUCTION
This Privacy Policy explains how [Company Name] ("we," "us," or "our") collects, uses, and protects your personal data.

2. DATA CONTROLLER
[Company Name]
Business ID: [Business ID]
Address: [Address]
Contact: [Email/Phone]

3. PERSONAL DATA WE COLLECT
- Name and contact information
- [Other data types]

4. PURPOSE OF PROCESSING
We process personal data for:
- Service delivery
- Communication
- Legal obligations

5. LEGAL BASIS
We process personal data based on:
- Contract performance
- Legal obligations
- Legitimate interests
- Consent (where applicable)

6. DATA RETENTION
We retain personal data for [period] or as required by law.

7. YOUR RIGHTS
Under GDPR, you have the right to:
- Access your data
- Request rectification
- Request erasure
- Object to processing
- Data portability

8. CONTACT
For privacy concerns, contact:
[Data Protection Officer/Contact Person]
[Email/Phone]`;
                      
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'privacy-policy-template.txt';
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                    }}
                    className="w-full"
                  >
                    Download Template
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

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
                        <DialogTitle>Rename Chat</DialogTitle>
                      </DialogHeader>
                      <RenameChatDialog session={session} onClose={() => {}} />
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
