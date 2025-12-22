import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessageProps {
  audioUrl: string;
  duration: number;
  isOwn: boolean;
}

export function VoiceMessage({ audioUrl, duration, isOwn }: VoiceMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(Math.floor(audio.duration));
      }
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * audioDuration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Generate waveform bars with consistent pattern
  const waveformBars = Array.from({ length: 32 }, (_, i) => {
    const seed = (i * 7 + 3) % 10;
    const height = 25 + Math.sin(i * 0.6) * 20 + seed * 4;
    return Math.min(100, Math.max(20, height));
  });

  return (
    <div className="flex items-center gap-2 min-w-[180px] max-w-[260px]">
      <button
        onClick={togglePlay}
        className={cn(
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors",
          isOwn 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        )}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-0.5">
        <div 
          ref={progressRef}
          className="relative h-6 flex items-center gap-[2px] cursor-pointer"
          onClick={handleProgressClick}
        >
          {waveformBars.map((height, i) => {
            const barProgress = (i / waveformBars.length) * 100;
            const isActive = barProgress <= progress;
            
            return (
              <div
                key={i}
                className={cn(
                  "w-[2px] rounded-full transition-colors",
                  isOwn
                    ? isActive ? "bg-primary-foreground" : "bg-primary-foreground/40"
                    : isActive ? "bg-primary" : "bg-primary/30"
                )}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        
        <span className={cn(
          "text-[10px]",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {isPlaying ? formatTime(currentTime) : formatTime(audioDuration)}
        </span>
      </div>
    </div>
  );
}
