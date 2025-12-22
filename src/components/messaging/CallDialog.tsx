import { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';

interface CallDialogProps {
  isOpen: boolean;
  onClose: () => void;
  callType: 'voice' | 'video';
  participantName: string;
  participantAvatar: string;
  isIncoming?: boolean;
}

type CallStatus = 'ringing' | 'connecting' | 'connected' | 'ended';

export function CallDialog({
  isOpen,
  onClose,
  callType,
  participantName,
  participantAvatar,
  isIncoming = false
}: CallDialogProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate call connection
  useEffect(() => {
    if (isOpen && callStatus === 'ringing' && !isIncoming) {
      const connectTimer = setTimeout(() => {
        setCallStatus('connecting');
      }, 2000);

      const connectedTimer = setTimeout(() => {
        setCallStatus('connected');
      }, 4000);

      return () => {
        clearTimeout(connectTimer);
        clearTimeout(connectedTimer);
      };
    }
  }, [isOpen, callStatus, isIncoming]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCallStatus('ringing');
      setCallDuration(0);
      setIsMuted(false);
      setIsSpeakerOn(false);
      setIsVideoEnabled(callType === 'video');
    }
  }, [isOpen, callType]);

  const handleEndCall = () => {
    setCallStatus('ended');
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleAnswerCall = () => {
    setCallStatus('connecting');
    setTimeout(() => {
      setCallStatus('connected');
    }, 1500);
  };

  const handleDeclineCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'ringing':
        return isIncoming ? 'Incoming call...' : 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call ended';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "p-0 border-0 overflow-hidden bg-gradient-to-b from-background to-muted",
          isFullscreen ? "max-w-full h-screen w-screen rounded-none" : "max-w-sm w-full rounded-2xl",
          callType === 'video' && callStatus === 'connected' && !isFullscreen && "max-w-md"
        )}
      >
        <div className={cn(
          "relative flex flex-col",
          isFullscreen ? "h-screen" : "min-h-[500px]"
        )}>
          {/* Video Background (for video calls when connected) */}
          {callType === 'video' && callStatus === 'connected' && isVideoEnabled && (
            <div className="absolute inset-0 bg-muted">
              {/* Simulated remote video */}
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={participantAvatar} />
                  <AvatarFallback className="text-4xl">{participantName[0]}</AvatarFallback>
                </Avatar>
              </div>
              
              {/* Self video preview */}
              <div className="absolute bottom-24 right-4 w-28 h-36 rounded-xl bg-card shadow-lg border-2 border-background overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">You</span>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className={cn(
            "flex items-center justify-between p-4 z-10",
            callType === 'video' && callStatus === 'connected' && isVideoEnabled && "absolute top-0 left-0 right-0"
          )}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-card/50 backdrop-blur-sm"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
            
            {callType === 'video' && callStatus === 'connected' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full bg-card/50 backdrop-blur-sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* Main Content */}
          <div className={cn(
            "flex-1 flex flex-col items-center justify-center px-8 z-10",
            callType === 'video' && callStatus === 'connected' && isVideoEnabled && "hidden"
          )}>
            {/* Avatar with ripple effect for ringing */}
            <div className="relative mb-6">
              {callStatus === 'ringing' && (
                <>
                  <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <span className="absolute inset-[-10px] rounded-full bg-primary/10 animate-pulse" />
                </>
              )}
              <Avatar className={cn(
                "border-4 border-background shadow-xl",
                callStatus === 'connected' ? "h-28 w-28" : "h-24 w-24"
              )}>
                <AvatarImage src={participantAvatar} />
                <AvatarFallback className="text-3xl">{participantName[0]}</AvatarFallback>
              </Avatar>
              
              {/* Call type indicator */}
              <div className={cn(
                "absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center shadow-lg",
                callType === 'video' ? "bg-primary" : "bg-success"
              )}>
                {callType === 'video' ? (
                  <Video className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <Phone className="h-4 w-4 text-success-foreground" />
                )}
              </div>
            </div>

            {/* Name and Status */}
            <h3 className="text-xl font-semibold mb-1">{participantName}</h3>
            <p className={cn(
              "text-sm mb-8",
              callStatus === 'connected' ? "text-success font-medium tabular-nums" : "text-muted-foreground"
            )}>
              {callType === 'video' ? 'Video ' : 'Voice '}
              {getStatusText()}
            </p>

            {/* Connection animation */}
            {callStatus === 'connecting' && (
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className={cn(
            "p-6 z-10",
            callType === 'video' && callStatus === 'connected' && isVideoEnabled && "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent pt-12"
          )}>
            {/* Incoming call controls */}
            {isIncoming && callStatus === 'ringing' ? (
              <div className="flex items-center justify-center gap-12">
                <button
                  onClick={handleDeclineCall}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
                >
                  <PhoneOff className="h-7 w-7 text-destructive-foreground" />
                </button>
                <button
                  onClick={handleAnswerCall}
                  className="w-16 h-16 rounded-full bg-success flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95 animate-pulse"
                >
                  {callType === 'video' ? (
                    <Video className="h-7 w-7 text-success-foreground" />
                  ) : (
                    <Phone className="h-7 w-7 text-success-foreground" />
                  )}
                </button>
              </div>
            ) : callStatus === 'connected' ? (
              <div className="space-y-4">
                {/* Action buttons */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      isMuted 
                        ? "bg-destructive/20 text-destructive" 
                        : "bg-card text-foreground shadow-md hover:bg-muted"
                    )}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                  
                  {callType === 'video' && (
                    <button
                      onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        !isVideoEnabled 
                          ? "bg-destructive/20 text-destructive" 
                          : "bg-card text-foreground shadow-md hover:bg-muted"
                      )}
                    >
                      {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      isSpeakerOn 
                        ? "bg-primary/20 text-primary" 
                        : "bg-card text-foreground shadow-md hover:bg-muted"
                    )}
                  >
                    {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </button>

                  {callType === 'video' && (
                    <button
                      className="w-12 h-12 rounded-full bg-card shadow-md flex items-center justify-center hover:bg-muted transition-all"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* End call button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleEndCall}
                    className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
                  >
                    <PhoneOff className="h-7 w-7 text-destructive-foreground" />
                  </button>
                </div>
              </div>
            ) : callStatus !== 'ended' ? (
              /* Outgoing call - waiting for answer */
              <div className="flex justify-center">
                <button
                  onClick={handleEndCall}
                  className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
                >
                  <PhoneOff className="h-7 w-7 text-destructive-foreground" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Muted indicator */}
          {isMuted && callStatus === 'connected' && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 z-20">
              <MicOff className="h-3 w-3" />
              Muted
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CallDialog;
