import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Construction, Timer, MessageSquare } from 'lucide-react';

interface UnderConstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UnderConstructionModal({ 
  isOpen, 
  onClose, 
  featureName = "This feature" 
}: UnderConstructionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/20 bg-card overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-b2b-black via-blue-600 to-b2b-orange" />
        
        <DialogHeader className="pt-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Construction className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">
            <span className="text-black">Jumma</span>
            <span className="text-blue-600">Baba</span>
            <span className="ml-2">Workbench</span>
          </DialogTitle>
          <DialogDescription className="text-center text-lg mt-2 font-medium text-foreground">
            {featureName} is under construction
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 px-4 text-center space-y-4">
          <p className="text-muted-foreground">
            We are working hard to bring you a premium wholesale experience. This module is being engineered for scale and will be live soon!
          </p>
          
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex flex-col items-center">
              <div className="bg-muted p-3 rounded-xl mb-1">
                <Timer className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">Coming Soon</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-muted p-3 rounded-xl mb-1">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-widest">Priority Module</span>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-center pb-6">
          <Button 
            onClick={onClose} 
            className="w-full sm:w-auto px-12 py-6 text-lg font-bold uppercase tracking-widest shadow-lg hover:shadow-primary/20 transition-all"
          >
            Got it, Let's Explore
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
