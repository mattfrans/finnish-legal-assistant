import { Card } from "@/components/ui/card";
import { ExternalLink, FileText } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { motion } from "framer-motion";
import { RatingInterface } from "./RatingInterface";

interface MessageProps {
  message: {
    id?: number;
    role: "user" | "assistant";
    content: string;
    sessionId?: number;
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <Card 
        className={`max-w-[80%] p-4 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        } transform-gpu transition-all duration-200 hover:scale-[1.01]`}
      >
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
              <div className="mt-4 border-t border-border/50 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-sm font-medium">Legal Sources</p>
                  <span className="text-xs text-muted-foreground">
                    ({message.sources.length} {message.sources.length === 1 ? 'source' : 'sources'})
                  </span>
                </div>
                <ul className="space-y-3">
                  {message.sources
                    .sort((a, b) => b.relevance - a.relevance)
                    .map((source, i) => (
                    <li 
                      key={i} 
                      className="bg-background/50 rounded-lg p-3 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <ExternalLink className="h-4 w-4 flex-shrink-0 mt-1 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <a 
                              href={source.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline font-medium text-sm"
                            >
                              {source.title}
                            </a>
                            <div className="flex items-center gap-2">
                              {source.type && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  source.type === 'finlex' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  source.type === 'kkv' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                }`}>
                                  {source.type.toUpperCase()}
                                </span>
                              )}
                              <span 
                                className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted"
                                title="Source relevance score"
                              >
                                {Math.round(source.relevance * 100)}% relevant
                              </span>
                            </div>
                          </div>
                          {(source.section || source.identifier) && (
                            <p className="text-muted-foreground text-sm mt-1">
                              {source.section}
                              {source.identifier && (
                                <>
                                  {source.section && " - "}
                                  <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                                    {source.identifier}
                                  </span>
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {message.role === "assistant" && message.id && message.sessionId && (
              <RatingInterface 
                queryId={message.id} 
                sessionId={message.sessionId}
              />
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}