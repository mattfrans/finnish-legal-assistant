import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface FilePreviewProps {
  file: File;
  url: string;
}

export function FilePreview({ file, url }: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isImage = file.type.startsWith('image/');

  if (isImage) {
    return (
      <>
        <Card className="overflow-hidden max-w-sm">
          <div className="relative">
            <img
              src={url}
              alt={file.name}
              className="w-full h-auto max-h-48 object-cover cursor-pointer"
              onClick={() => setIsExpanded(true)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
              onClick={() => setIsExpanded(true)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-2 text-sm text-muted-foreground border-t">
            {file.name}
          </div>
        </Card>

        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="max-w-4xl">
            <div className="relative">
              <img
                src={url}
                alt={file.name}
                className="w-full h-auto"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                onClick={() => setIsExpanded(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Card className="p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <FileText className="h-8 w-8 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={() => window.open(url, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
