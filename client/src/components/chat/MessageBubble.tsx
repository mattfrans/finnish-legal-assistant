import { Card } from "@/components/ui/card";
import { ExternalLink, FileText } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface MessageProps {
  message: {
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
    legalContext?: string;
    confidence?: {
      score: number;
      reasoning: string;
    };
  };
}

export function MessageBubble({ message }: MessageProps) {
  const isUser = message.role === "user";
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <Card className={`max-w-[80%] p-4 ${
        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
      }`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium">Attachments:</p>
            <div className="grid grid-cols-2 gap-2">
              {message.attachments.map((attachment, i) => (
                <div key={i} className="relative group">
                  {attachment.type === 'image' ? (
                    <AspectRatio ratio={16 / 9}>
                      <a 
                        href={attachment.url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full"
                      >
                        <img
                          src={attachment.url}
                          alt={attachment.filename}
                          className="object-cover w-full h-full rounded-md hover:opacity-90 transition-opacity"
                        />
                      </a>
                    </AspectRatio>
                  ) : (
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 bg-background rounded-md hover:bg-accent transition-colors"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{attachment.filename}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.size)}
                        </p>
                      </div>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {message.role === "assistant" && (
          <div className="mt-3 pt-3 border-t border-border/50 space-y-4">
            {message.confidence && (
              <div className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">Confidence Score:</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    message.confidence.score > 0.8 ? 'bg-green-100 text-green-800' :
                    message.confidence.score > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(message.confidence.score * 100)}%
                  </span>
                </div>
                <p className="text-muted-foreground">{message.confidence.reasoning}</p>
              </div>
            )}
            
            {message.legalContext && (
              <div className="text-sm">
                <p className="font-medium mb-1">Legal Context:</p>
                <p className="text-muted-foreground">{message.legalContext}</p>
              </div>
            )}
            
            {message.sources && message.sources.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Legal Sources:</p>
                <ul className="space-y-2">
                  {message.sources
                    .sort((a, b) => b.relevance - a.relevance)
                    .map((source, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      <div>
                        <a 
                          href={source.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-center gap-2"
                        >
                          {source.title}
                          {source.type && (
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                              source.type === 'finlex' ? 'bg-blue-100 text-blue-800' :
                              source.type === 'kkv' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {source.type.toUpperCase()}
                            </span>
                          )}
                        </a>
                        {source.section && (
                          <p className="text-muted-foreground text-xs mt-0.5">
                            {source.section}
                            {source.identifier && ` (${source.identifier})`}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
