import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Image, ExternalLink, Maximize2, Minimize2, File, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PanelGroup, 
  Panel, 
  PanelResizeHandle 
} from "react-resizable-panels";

// Set worker URL for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface FilePreviewProps {
  file: File;
  url: string;
}

export function FilePreview({ file, url }: FilePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [extractedText, setExtractedText] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

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
              onLoad={() => setImageLoaded(true)}
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
          <DialogContent className="max-w-6xl h-[80vh]">
            <PanelGroup direction="horizontal">
              <Panel defaultSize={70}>
                <div className="relative h-full">
                  <ScrollArea className="h-full">
                    <div className="relative">
                      <img
                        src={url}
                        alt={file.name}
                        className={cn(
                          "max-w-full transition-transform duration-200",
                          "transform-gpu"
                        )}
                        style={{ 
                          transform: `scale(${scale}) rotate(${rotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                      />
                    </div>
                  </ScrollArea>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 p-2 rounded-lg shadow-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleZoom(-0.1)}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-16 text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleZoom(0.1)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-2" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRotate}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Panel>
              
              <PanelResizeHandle className="w-1.5 bg-border/10 hover:bg-border/20 transition-colors" />
              
              <Panel defaultSize={30}>
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">AI Analysis</h3>
                    <div className="text-sm text-muted-foreground">
                      {extractedText || "AI analysis will appear here..."}
                    </div>
                  </div>
                </ScrollArea>
              </Panel>
            </PanelGroup>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isPDF) {
    return (
      <>
        <Card className="p-4 max-w-sm cursor-pointer" onClick={() => setIsExpanded(true)}>
          <div className="flex items-start gap-3">
            <File className="h-8 w-8 text-primary flex-shrink-0" />
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
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
          <DialogContent className="max-w-6xl h-[80vh]">
            <PanelGroup direction="horizontal">
              <Panel defaultSize={70}>
                <div className="relative h-full">
                  <ScrollArea className="h-full">
                    <div className="relative">
                      <Document
                        file={url}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="mx-auto"
                        error={
                          <div className="p-4 text-center text-muted-foreground">
                            <p>Error loading PDF. Please try again.</p>
                          </div>
                        }
                        loading={
                          <div className="p-4 text-center text-muted-foreground">
                            <p>Loading PDF...</p>
                          </div>
                        }
                      >
                        <Page 
                          pageNumber={pageNumber} 
                          scale={scale}
                          rotate={rotation}
                          width={window.innerWidth * 0.5}
                          renderTextLayer
                          renderAnnotationLayer
                          error={
                            <div className="p-4 text-center text-muted-foreground">
                              <p>Error loading page. Please try again.</p>
                            </div>
                          }
                        />
                      </Document>
                    </div>
                  </ScrollArea>
                  
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 p-2 rounded-lg shadow-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleZoom(-0.1)}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium w-16 text-center">
                      {Math.round(scale * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleZoom(0.1)}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-2" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRotate}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {numPages && numPages > 1 && (
                    <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-background/80 p-2 rounded-lg shadow-lg">
                      <Button
                        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                        disabled={pageNumber <= 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <p className="text-sm">
                        Page {pageNumber} of {numPages}
                      </p>
                      <Button
                        onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                        disabled={pageNumber >= numPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </Panel>
              
              <PanelResizeHandle className="w-1.5 bg-border/10 hover:bg-border/20 transition-colors" />
              
              <Panel defaultSize={30}>
                <ScrollArea className="h-full">
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">Document Content & Analysis</h3>
                    <div className="text-sm text-muted-foreground">
                      {extractedText || "Document text and AI analysis will appear here..."}
                    </div>
                  </div>
                </ScrollArea>
              </Panel>
            </PanelGroup>
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
