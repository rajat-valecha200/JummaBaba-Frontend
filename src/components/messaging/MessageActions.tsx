import { useState } from "react";
import { Reply, Forward, X, CornerUpRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ReplyToMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isVoice?: boolean;
  isMedia?: boolean;
}

interface ReplyPreviewProps {
  replyTo: ReplyToMessage;
  onClear: () => void;
  isOwn: boolean;
}

export function ReplyPreview({ replyTo, onClear, isOwn }: ReplyPreviewProps) {
  const getPreviewText = () => {
    if (replyTo.isVoice) return "🎤 Voice message";
    if (replyTo.isMedia) return "📷 Photo";
    return replyTo.text.length > 60 ? `${replyTo.text.substring(0, 60)}...` : replyTo.text;
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 border-l-4 border-primary rounded-r-lg">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-primary">
          {replyTo.senderId === "me" ? "You" : replyTo.senderName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {getPreviewText()}
        </p>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-6 w-6 flex-shrink-0"
        onClick={onClear}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface QuotedMessageProps {
  replyTo: ReplyToMessage;
  isOwn: boolean;
  onClick?: () => void;
}

export function QuotedMessage({ replyTo, isOwn, onClick }: QuotedMessageProps) {
  const getPreviewText = () => {
    if (replyTo.isVoice) return "🎤 Voice message";
    if (replyTo.isMedia) return "📷 Photo";
    return replyTo.text.length > 50 ? `${replyTo.text.substring(0, 50)}...` : replyTo.text;
  };

  return (
    <div 
      className={cn(
        "flex gap-2 p-2 rounded-lg mb-1 cursor-pointer",
        isOwn 
          ? "bg-primary-foreground/10 border-l-2 border-primary-foreground/50" 
          : "bg-muted/50 border-l-2 border-primary/50"
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[10px] font-medium",
          isOwn ? "text-primary-foreground/80" : "text-primary"
        )}>
          {replyTo.senderId === "me" ? "You" : replyTo.senderName}
        </p>
        <p className={cn(
          "text-xs truncate",
          isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
        )}>
          {getPreviewText()}
        </p>
      </div>
    </div>
  );
}

interface MessageActionsProps {
  onReply: () => void;
  onForward: () => void;
  onReact: () => void;
  isOwn: boolean;
}

export function MessageActions({ onReply, onForward, onReact, isOwn }: MessageActionsProps) {
  return (
    <div className={cn(
      "flex items-center gap-0.5 bg-card shadow-lg rounded-full px-1 py-0.5 border animate-scale-in",
      isOwn ? "flex-row-reverse" : ""
    )}>
      <button
        onClick={onReply}
        className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
        title="Reply"
      >
        <Reply className="h-4 w-4" />
      </button>
      <button
        onClick={onForward}
        className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
        title="Forward"
      >
        <CornerUpRight className="h-4 w-4" />
      </button>
      <button
        onClick={onReact}
        className="w-8 h-8 flex items-center justify-center hover:bg-muted rounded-full transition-colors text-lg"
        title="React"
      >
        😊
      </button>
    </div>
  );
}

interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
}

interface ForwardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  messagePreview: string;
  onForward: (conversationIds: string[]) => void;
}

export function ForwardDialog({ 
  open, 
  onOpenChange, 
  conversations, 
  messagePreview, 
  onForward 
}: ForwardDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const handleForward = () => {
    onForward(selected);
    setSelected([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-5 w-5" />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        <div className="p-3 bg-muted rounded-lg mb-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {messagePreview}
          </p>
        </div>

        <p className="text-sm text-muted-foreground mb-2">Select conversations:</p>
        
        <ScrollArea className="h-64">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => toggleSelection(conv.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                  selected.includes(conv.id) 
                    ? "bg-primary/10 border border-primary/30" 
                    : "hover:bg-muted"
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conv.participantAvatar} />
                  <AvatarFallback>{conv.participantName[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium flex-1">{conv.participantName}</span>
                {selected.includes(conv.id) && (
                  <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleForward}
            disabled={selected.length === 0}
          >
            <Forward className="h-4 w-4 mr-2" />
            Forward ({selected.length})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
