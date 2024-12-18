import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image, FileText, X } from "lucide-react";
import { addDocument } from "@/lib/preview-events";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFiles = async (files: FileList) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Virheellinen tiedostomuoto",
          description: "Vain kuvat (JPG, PNG, GIF) ja asiakirjat (PDF, DOC, DOCX, TXT) ovat sallittuja."
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add files to document preview sidebar
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        // Add to document preview
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          title: file.name,
          content: `Tiedostotyyppi: ${file.type}, Koko: ${(file.size / 1024).toFixed(2)} KB`,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          timestamp: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
    });

    onFileUpload(validFiles);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/10' : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={handleFileInput}
          accept="image/*,.pdf,.doc,.docx,.txt"
        />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Raahaa ja pudota tiedostoja tähän tai klikkaa valitaksesi
          </p>
          <p className="text-xs text-muted-foreground">
            Tuetut tiedostotyypit: JPG, PNG, GIF, PDF, DOC, DOCX, TXT
          </p>
        </div>
      </div>
    </div>
  );
}
