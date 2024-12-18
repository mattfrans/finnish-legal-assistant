import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Send, X, ChevronRight, LucideIcon, Scale, FileText, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface HelpMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  sources?: Array<{
    title: string;
    link: string;
    section?: string;
    type: 'finlex' | 'kkv' | 'other';
  }>;
}

interface PageContext {
  path: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

const PAGE_CONTEXTS: Record<string, PageContext> = {
  '/': {
    path: '/',
    title: 'Legal Assistant Chat',
    icon: Scale,
    description: 'Ask questions about Finnish law and get AI-powered answers with citations.',
  },
  '/legal': {
    path: '/legal',
    title: 'Legal Document Templates',
    icon: FileText,
    description: 'Browse and customize legal document templates following Finnish law.',
  },
  '/pricing': {
    path: '/pricing',
    title: 'Subscription Plans',
    icon: CreditCard,
    description: 'View our pricing plans and subscription options.',
  },
};

export function ContextualHelpSidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<HelpMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [languageMode, setLanguageMode] = useState<'professional' | 'regular' | 'simple' | 'crazy'>('regular');
  const { toast } = useToast();

  const currentContext = PAGE_CONTEXTS[location] || PAGE_CONTEXTS['/'];

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Generate initial contextual help when sidebar is opened
      generateContextualHelp();
    }
  }, [isOpen, location]);

  const generateContextualHelp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/contextual-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            path: currentContext.path,
            title: currentContext.title,
            description: currentContext.description,
          }
        })
      });

      if (!response.ok) throw new Error('Failed to get help');
      
      const data = await response.json();
      setMessages([{
        role: 'assistant',
        content: data.content,
        sources: data.sources
      }]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load help content. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/contextual-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context: {
            path: currentContext.path,
            title: currentContext.title,
            description: currentContext.description,
            languageMode: languageMode
          },
          history: messages
        })
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.content,
        sources: data.sources
      }]);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-lg"
        onClick={() => setIsOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50"
          >
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <currentContext.icon className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold">Legal Assistant</h2>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={languageMode === 'professional' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguageMode('professional')}
                  >
                    Professional
                  </Button>
                  <Button
                    variant={languageMode === 'regular' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguageMode('regular')}
                  >
                    Regular
                  </Button>
                  <Button
                    variant={languageMode === 'simple' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLanguageMode('simple')}
                  >
                    Simple
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.role === 'user' ? 'ml-8' : 'mr-8'
                    }`}
                  >
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.sources && (
                      <div className="mt-2 space-y-1">
                        {message.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                          >
                            <ChevronRight className="h-3 w-3" />
                            {source.title}
                            {source.section && ` - ${source.section}`}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask a question..."
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}