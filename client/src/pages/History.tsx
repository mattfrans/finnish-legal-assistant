import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { FileText, Search, X } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
}

export function History() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async () => {
      const response = await fetch('/api/chat/sessions');
      if (!response.ok) {
        throw new Error('Failed to fetch chat sessions');
      }
      return response.json();
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      const res = await fetch(`/api/chat/sessions/${id}/pin`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned }),
      });
      if (!res.ok) throw new Error('Failed to update pin status');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  const deleteChat = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/chat/sessions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete chat');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  const filteredSessions = sessions.filter((session: ChatSession) =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedSessions = [...filteredSessions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleSessionClick = (session: ChatSession) => {
    setSelectedSession(session.id);
  };

  const handleCloseDialog = () => {
    setSelectedSession(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search chat history..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          {searchQuery && (
            <Button
              onClick={handleClearSearch}
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="space-y-2">
          {sortedSessions.map((session: ChatSession) => (
            <div
              key={session.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => handleSessionClick(session)}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{session.title}</h3>
                <span className="text-sm text-gray-500">
                  {format(new Date(session.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {selectedSession && (
        <Dialog open={true} onOpenChange={handleCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {sessions.find((s: ChatSession) => s.id === selectedSession)?.title}
              </DialogTitle>
              <DialogDescription>
                {format(
                  new Date(sessions.find((s: ChatSession) => s.id === selectedSession)?.createdAt || ''),
                  'MMMM d, yyyy h:mm a'
                )}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="space-y-4">
                {sessions
                  .find((s: ChatSession) => s.id === selectedSession)
                  ?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-100 ml-auto'
                          : 'bg-gray-100'
                      }`}
                    >
                      <p>{message.content}</p>
                      <span className="text-xs text-gray-500">
                        {format(new Date(message.createdAt), 'h:mm a')}
                      </span>
                    </div>
                  ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
