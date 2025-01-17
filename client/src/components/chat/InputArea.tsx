import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { FileUpload } from "./FileUpload";
import { LanguageSelector } from "./LanguageSelector";
import type { FileAttachment } from "./types";
import type { LanguageMode } from "./types";

interface InputAreaProps {
  onSubmit: (input: string) => void;
  onFileSelect: (files: FileList) => void;
  attachments: FileAttachment[];
  onRemoveAttachment: (index: number) => void;
  languageMode: LanguageMode;
  onLanguageChange: (mode: LanguageMode) => void;
  isLoading?: boolean;
}

export function InputArea({
  onSubmit,
  onFileSelect,
  attachments,
  onRemoveAttachment,
  languageMode,
  onLanguageChange,
  isLoading
}: InputAreaProps) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput && attachments.length === 0) return;
    onSubmit(trimmedInput);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <FileUpload
          onFileSelect={onFileSelect}
          attachments={attachments}
          onRemoveAttachment={onRemoveAttachment}
        />
        <LanguageSelector value={languageMode} onChange={onLanguageChange} />
      </div>
      <div className="flex space-x-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1"
          rows={1}
        />
        <Button 
          onClick={handleSubmit}
          disabled={isLoading || (!input.trim() && attachments.length === 0)}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
