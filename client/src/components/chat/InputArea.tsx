import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import FileUpload from './FileUpload';
import LanguageSelector from './LanguageSelector';
import { FileAttachment, LanguageMode } from '../../types';

interface InputAreaProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

const InputArea: React.FC<InputAreaProps> = ({ onSubmit, isLoading }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [languageMode, setLanguageMode] = useState<LanguageMode>('finnish');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message);
      setMessage('');
    }
  };

  const handleFileSelect = (files: FileList) => {
    const newAttachments: FileAttachment[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = [...attachments];
    if (newAttachments[index]?.preview) {
      URL.revokeObjectURL(newAttachments[index].preview!);
    }
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4 border-t">
      <div className="flex gap-2">
        <FileUpload
          onFileSelect={handleFileSelect}
          attachments={attachments}
          onRemoveAttachment={handleRemoveAttachment}
        />
        <LanguageSelector
          value={languageMode}
          onChange={setLanguageMode}
        />
      </div>
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};

export default InputArea;
