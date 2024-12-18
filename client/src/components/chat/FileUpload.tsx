import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Image, FileText, X } from "lucide-react";
import { addDocument } from "@/lib/preview-events";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFileUpload: (files: Array<{ file: File, content: string }>) => Promise<void>;
}

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File): Promise<{ file: File, content: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const base64Content = reader.result as string;
        const base64Data = base64Content.split(',')[1]; // Remove data URL prefix
        
        resolve({ 
          file,
          content: base64Data
        });
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
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

    setIsProcessing(true);
    try {
      const processedFiles = await Promise.all(validFiles.map(processFile));
      
      // Add files to document preview sidebar
      processedFiles.forEach(({ file }) => {
        addDocument({
          id: Math.random().toString(36).substr(2, 9),
          title: file.name,
          content: `Tiedostotyyppi: ${file.type}, Koko: ${(file.size / 1024).toFixed(2)} KB`,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          timestamp: new Date().toISOString()
        });
      });

      // Send to parent for AI analysis
      await onFileUpload(processedFiles);
    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        variant: "destructive",
        title: "Virhe tiedostojen käsittelyssä",
        description: "Tiedostojen käsittelyssä tapahtui virhe. Yritä uudelleen."
      });
    } finally {
      setIsProcessing(false);
    }
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
          disabled={isProcessing}
        />
        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">
            {isProcessing 
              ? "Käsitellään tiedostoja..."
              : "Raahaa ja pudota tiedostoja tähän tai klikkaa valitaksesi"
            }
          </p>
          <p className="text-xs text-muted-foreground">
            Tuetut tiedostotyypit: JPG, PNG, GIF, PDF, DOC, DOCX, TXT
          </p>
        </div>
      </div>
    </div>
  );
}
