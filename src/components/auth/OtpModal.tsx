import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onVerify: (otp: string) => void;
  onResend: () => void;
  onChangeEmail?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  isSuccess?: boolean;
  errorMessage?: string;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  email,
  onVerify,
  onResend,
  onChangeEmail,
  isLoading = false,
  isError = false,
  isSuccess = false,
  errorMessage = "Invalid verification code",
}) => {
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    if (canResend) {
      setTimer(30);
      setCanResend(false);
      onResend();
    }
  };

  const handleComplete = (value: string) => {
    if (value.length === 6) {
      onVerify(value);
    }
  };

  // Common slot classes for high-fidelity feel
  const getSlotClass = (index: number) => cn(
    "w-12 h-14 text-xl font-bold bg-white/5 border-white/10 text-white rounded-lg transition-all duration-300",
    "flex items-center justify-center",
    otp.length === index && "ring-2 ring-primary ring-offset-0 scale-105 border-primary/50 bg-primary/5",
    isError && "border-destructive/50 text-destructive animate-shake",
    isSuccess && "border-success text-success bg-success/5 scale-105 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn(
        "sm:max-w-[440px] border-white/10 shadow-2xl transition-all duration-500",
        "bg-black/80 backdrop-blur-xl", // Glassmorphism
        "overflow-hidden p-8"
      )}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10"
        >
          <DialogHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <motion.div 
                animate={isLoading ? { rotate: 360 } : {}}
                transition={isLoading ? { repeat: Infinity, duration: 2, ease: "linear" } : {}}
                className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner"
              >
                <RefreshCw className={cn("w-8 h-8 text-primary")} />
              </motion.div>
            </div>
            <div className="space-y-2 text-center">
              <DialogTitle className="text-3xl font-extrabold tracking-tight text-white">
                Verify Identity
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-base leading-relaxed">
                Enter the 6-digit code sent to <br />
                <span className="font-semibold text-primary/90 underline decoration-primary/30 underline-offset-4">{email}</span>
                {onChangeEmail && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={onChangeEmail}
                      disabled={isLoading || isSuccess}
                      className="text-slate-400 hover:text-primary underline underline-offset-2 text-sm font-medium disabled:opacity-50"
                    >
                      (wrong email? change it)
                    </button>
                  </>
                )}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-10 py-6">
            <div className="relative group">
              {/* Subtle glow behind inputs */}
              <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500 opacity-50" />
              
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                onComplete={handleComplete}
                disabled={isLoading || isSuccess}
              >
                <InputOTPGroup className="gap-3">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <InputOTPSlot 
                      key={idx} 
                      index={idx} 
                      className={getSlotClass(idx)} 
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              
              <AnimatePresence mode="wait">
                {isError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-destructive text-sm font-semibold"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}
                {isSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-success text-sm font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verification successful!</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="text-center w-full">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-6" />
              <p className="text-slate-400 text-sm">
                Didn't receive the code?{' '}
                {timer > 0 ? (
                  <span className="text-primary font-bold ml-1">Resend in {formatTime(timer)}</span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-primary font-bold hover:text-primary-foreground hover:bg-primary/10 px-2 py-1 rounded-md transition-all active:scale-95"
                  >
                    Resend Now
                  </button>
                )}
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-center">
            <Button
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 group overflow-hidden relative"
              onClick={() => handleComplete(otp)}
              disabled={otp.length !== 6 || isLoading || isSuccess}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Validating...</span>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div 
                    key="success"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Access Granted</span>
                  </motion.div>
                ) : (
                  <motion.span 
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    Confirm Verification
                  </motion.span>
                )}
              </AnimatePresence>
              
              {/* Animated background shine on hover */}
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
