import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RfqStepStatus = 'pending' | 'current' | 'completed' | 'error';

export interface RfqStep {
  id: string;
  label: string;
  description?: string;
  status: RfqStepStatus;
  icon: React.ReactNode;
}

interface RfqTimelineProps {
  steps: RfqStep[];
  className?: string;
}

export function RfqTimeline({ steps, className }: RfqTimelineProps) {
  return (
    <div className={cn("space-y-8", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          {/* Connector Line */}
          {index !== steps.length - 1 && (
            <div 
              className={cn(
                "absolute left-6 top-10 w-0.5 h-12 -ml-px",
                step.status === 'completed' ? "bg-primary" : "bg-muted"
              )}
            />
          )}

          <div className="flex items-start gap-4 group">
            {/* Icon Circle */}
            <motion.div 
              initial={false}
              animate={{
                scale: step.status === 'current' ? 1.1 : 1,
                backgroundColor: step.status === 'completed' ? '#4f46e5' : step.status === 'current' ? '#4f46e5' : '#f1f5f9',
              }}
              className={cn(
                "relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white transition-colors shadow-xl",
                step.status === 'completed' ? "text-white" : step.status === 'current' ? "text-white" : "text-slate-400",
                step.status === 'current' && "ring-4 ring-indigo-500/20",
                step.status === 'pending' && "border-slate-100"
              )}
            >
              {step.status === 'completed' ? (
                <Check className="h-6 w-6 stroke-[3]" />
              ) : (
                <span className="stroke-[2.5]">{step.icon}</span>
              )}
            </motion.div>

            {/* Content */}
            <div className="flex-1 pt-1.5">
              <h4 className={cn(
                "text-sm font-bold uppercase tracking-widest mb-1",
                step.status === 'completed' ? "text-primary" : step.status === 'current' ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </h4>
              {step.description && (
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Utility to generate steps based on status
export function getRfqSteps(status: string, moderationStatus: string): RfqStep[] {
  const isOrdered = status === 'ordered' || status === 'shipped' || status === 'delivered' || status === 'completed';
  
  return [
    {
      id: 'submitted',
      label: 'RFQ Submitted',
      description: 'Your requirement is being reviewed by our experts.',
      status: moderationStatus !== 'pending_moderation' ? 'completed' : 'current',
      icon: <Clock className="h-6 w-6" />
    },
    {
      id: 'forwarded',
      label: 'Forwarded to Vendor',
      description: 'Negotiating the best price slabs for you.',
      status: ['forwarded', 'quote_pending', 'quote_approved', 'quote_rejected'].includes(moderationStatus) || isOrdered 
        ? (moderationStatus === 'forwarded' ? 'current' : 'completed') 
        : 'pending',
      icon: <Truck className="h-6 w-6" />
    },
    {
      id: 'quoted',
      label: 'Quote Received',
      description: 'Vendor has provided pricing and terms.',
      status: ['quote_pending', 'quote_approved', 'quote_rejected'].includes(moderationStatus) || isOrdered
        ? (moderationStatus === 'quote_approved' ? 'completed' : moderationStatus === 'quote_pending' ? 'current' : moderationStatus === 'quote_rejected' ? 'error' : 'completed')
        : 'pending',
      icon: <Package className="h-6 w-6" />
    },
    {
      id: 'ordered',
      label: 'Order Confirmed',
      description: 'Payment verified and order placed.',
      status: isOrdered ? (status === 'ordered' ? 'current' : 'completed') : 'pending',
      icon: <CheckCircle2 className="h-6 w-6" />
    }
  ];
}
