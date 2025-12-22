import { useState, useRef, useCallback } from 'react';

export interface VoiceRecording {
  id: string;
  audioUrl: string;
  duration: number;
  blob: Blob;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start(100);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setPermissionDenied(false);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setPermissionDenied(true);
      return false;
    }
  }, []);

  const stopRecording = useCallback((): Promise<VoiceRecording | null> => {
    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { 
          type: mediaRecorder.mimeType 
        });
        const audioUrl = URL.createObjectURL(blob);
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        setRecordingDuration(0);
        
        resolve({
          id: `voice-${Date.now()}`,
          audioUrl,
          duration,
          blob
        });
      };

      mediaRecorder.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      mediaRecorder.stop();
    }
    
    setIsRecording(false);
    setRecordingDuration(0);
    chunksRef.current = [];
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    recordingDuration,
    permissionDenied,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration
  };
}
