import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface HistoryItem {
  id: number;
  question: string;
  answer: string;
  sources: { link: string; title: string; section?: string }[];
  createdAt: string;
}

export function History() {
  const { data: history, isLoading } = useQuery<HistoryItem[]>({
    queryKey: ["/api/history"],
  });

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <ScrollArea className="h-full p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {history?.map((item) => (
          <Card key={item.id} className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </p>
            <p className="font-medium">Q: {item.question}</p>
            <p>A: {item.answer}</p>
            {item.sources.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Sources: {item.sources.map(s => s.title).join(", ")}
              </div>
            )}
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
