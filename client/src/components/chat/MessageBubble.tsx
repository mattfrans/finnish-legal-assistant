import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface MessageProps {
  message: {
    role: "user" | "assistant";
    content: string;
    sources?: { link: string; title: string; section?: string }[];
  };
}

export function MessageBubble({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Card className={`max-w-[80%] p-4 ${
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-sm font-medium mb-2">Sources:</p>
            <ul className="space-y-2">
              {message.sources.map((source, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 flex-shrink-0" />
                  <a 
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {source.title}
                    {source.section && ` - ${source.section}`}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}
