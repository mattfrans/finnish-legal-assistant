import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface RatingInterfaceProps {
  queryId: number;
  sessionId: number;
  onRatingSubmit?: () => void;
}

export function RatingInterface({ queryId, sessionId, onRatingSubmit }: RatingInterfaceProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitRating = useMutation({
    mutationFn: async () => {
      if (rating === null || helpful === null) return;
      
      const response = await fetch(`/api/v1/sessions/${sessionId}/queries/${queryId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          helpful,
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/v1/sessions/${sessionId}`] });
      toast({ description: "Thank you for your feedback!" });
      onRatingSubmit?.();
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit rating. Please try again.",
      });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mt-4 space-y-4"
    >
      <div className="flex items-center gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Was this response helpful?</p>
          <div className="flex gap-2">
            <Button
              variant={helpful === true ? "default" : "outline"}
              size="sm"
              onClick={() => setHelpful(true)}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Yes
            </Button>
            <Button
              variant={helpful === false ? "default" : "outline"}
              size="sm"
              onClick={() => setHelpful(false)}
              className="gap-2"
            >
              <ThumbsDown className="h-4 w-4" />
              No
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Rate the response</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button
                key={value}
                variant="ghost"
                size="sm"
                onClick={() => setRating(value)}
                className="p-1"
              >
                <Star
                  className={`h-5 w-5 transition-all ${
                    rating !== null && value <= rating
                      ? "fill-primary stroke-primary"
                      : "stroke-muted-foreground"
                  }`}
                />
              </Button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(helpful === false || rating !== null) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Additional comments (optional)"
              className="resize-none"
            />
            <Button
              onClick={() => submitRating.mutate()}
              disabled={rating === null || helpful === null || submitRating.isPending}
              className="mt-2"
            >
              Submit Feedback
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
