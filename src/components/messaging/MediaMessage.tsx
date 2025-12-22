import { useState } from 'react';
import { X, FileText, Download, Eye, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface MediaAttachment {
  id: string;
  type: 'image' | 'document';
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

interface MediaMessageProps {
  media: MediaAttachment;
  isOwn: boolean;
}

export function MediaMessage({ media, isOwn }: MediaMessageProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [zoom, setZoom] = useState(1);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📑';
    return '📎';
  };

  if (media.type === 'image') {
    return (
      <>
        <div 
          className="cursor-pointer rounded-lg overflow-hidden max-w-[240px]"
          onClick={() => setShowPreview(true)}
        >
          <img 
            src={media.url} 
            alt={media.name}
            className="w-full h-auto max-h-[200px] object-cover"
          />
        </div>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
            <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
              <DialogTitle className="text-white text-sm truncate pr-12">
                {media.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="relative flex items-center justify-center min-h-[60vh] p-4">
              <img 
                src={media.url} 
                alt={media.name}
                className="max-w-full max-h-[80vh] object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-4 py-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-white text-sm min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-white/30 mx-1" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => window.open(media.url, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Document preview
  return (
    <>
      <div 
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg cursor-pointer min-w-[200px] max-w-[280px] transition-colors",
          isOwn 
            ? "bg-primary-foreground/10 hover:bg-primary-foreground/20" 
            : "bg-muted hover:bg-muted/80"
        )}
        onClick={() => setShowPreview(true)}
      >
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl",
          isOwn ? "bg-primary-foreground/20" : "bg-primary/10"
        )}>
          {getFileIcon(media.mimeType)}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            isOwn ? "text-primary-foreground" : "text-foreground"
          )}>
            {media.name}
          </p>
          <p className={cn(
            "text-xs",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {formatFileSize(media.size)}
          </p>
        </div>
        <Eye className={cn(
          "h-4 w-4 flex-shrink-0",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )} />
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {media.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-8">
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center text-4xl mb-4">
              {getFileIcon(media.mimeType)}
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {formatFileSize(media.size)} • {media.mimeType.split('/')[1]?.toUpperCase() || 'File'}
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={() => window.open(media.url, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Open
              </Button>
              <Button onClick={() => window.open(media.url, '_blank')}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface MediaPreviewBarProps {
  files: File[];
  onRemove: (index: number) => void;
  onClear: () => void;
}

export function MediaPreviewBar({ files, onRemove, onClear }: MediaPreviewBarProps) {
  if (files.length === 0) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-card border-t px-2 md:px-4 py-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {files.map((file, index) => (
          <div 
            key={index}
            className="relative flex-shrink-0 group"
          >
            {file.type.startsWith('image/') ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex flex-col items-center justify-center p-1">
                <FileText className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-[8px] text-muted-foreground truncate w-full text-center">
                  {file.name.split('.').pop()?.toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {files.length > 1 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClear}
            className="text-xs text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {files.length} file{files.length > 1 ? 's' : ''} selected
      </p>
    </div>
  );
}
