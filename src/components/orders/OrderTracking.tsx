import { CheckCircle, Clock, Package, Truck, XCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed' | 'cancelled';

interface TrackingEvent {
  status: string;
  timestamp: string;
  location?: string;
  description: string;
}

interface OrderTrackingProps {
  currentStatus: OrderStatus;
  orderNumber: string;
  orderDate: string;
  estimatedDelivery?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  dispatchLocation?: string;
}

const statusSteps: { status: OrderStatus; label: string; icon: typeof Package }[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Processing', icon: CheckCircle },
  { status: 'shipped', label: 'In Transit', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Package },
];

const statusIndex: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  completed: 3,
  cancelled: -1,
};

export function OrderTracking({
  currentStatus,
  orderNumber,
  orderDate,
  estimatedDelivery,
  shippingCarrier,
  trackingNumber,
  shippedAt,
  deliveredAt,
  dispatchLocation,
}: OrderTrackingProps) {
  const currentStepIndex = statusIndex[currentStatus];
  const isCancelled = currentStatus === 'cancelled';

  // Compute dynamic tracking events
  const realEvents: TrackingEvent[] = [
    {
      status: 'Order Placed',
      timestamp: orderDate,
      description: 'Order successfully placed on JummaBaba.com',
    }
  ];

  if (currentStepIndex >= 1) {
    realEvents.unshift({
      status: 'Order Confirmed',
      timestamp: orderDate, // Fallback to orderDate
      description: 'Seller has confirmed and started processing your order',
    });
  }

  if (currentStepIndex >= 2) {
    realEvents.unshift({
      status: 'Shipped',
      timestamp: shippedAt || orderDate, 
      location: dispatchLocation || 'Vendor Warehouse',
      description: `Package is in transit via ${shippingCarrier || 'Standard Courier'}`,
    });
  }

  if (currentStepIndex >= 3) {
    realEvents.unshift({
      status: 'Delivered',
      timestamp: deliveredAt || shippedAt || orderDate,
      description: 'Package has been delivered successfully',
    });
  }

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-lg">Order Status</CardTitle>
            {isCancelled ? (
              <Badge variant="destructive" className="w-fit">
                <XCircle className="h-3 w-3 mr-1" />
                Cancelled
              </Badge>
            ) : (
              estimatedDelivery && currentStatus !== 'delivered' && (
                <p className="text-sm text-muted-foreground">
                  Expected delivery: <span className="font-medium text-foreground">{estimatedDelivery}</span>
                </p>
              )
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isCancelled ? (
            <div className="flex items-center justify-center py-8 text-center">
              <div>
                <XCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
                <p className="text-lg font-medium text-destructive">Order Cancelled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This order has been cancelled and will not be processed.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Desktop Timeline */}
              <div className="hidden sm:flex items-center justify-between">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex flex-col items-center flex-1 relative">
                      {/* Connector Line */}
                      {index < statusSteps.length - 1 && (
                        <div
                          className={cn(
                            'absolute top-5 left-1/2 h-0.5 w-full -z-10',
                            index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                          )}
                        />
                      )}
                      {/* Step Circle */}
                      <div
                        className={cn(
                          'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                          isCurrent && 'ring-4 ring-primary/20'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      {/* Label */}
                      <p
                        className={cn(
                          'mt-2 text-sm font-medium text-center',
                          isCompleted ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Mobile Timeline */}
              <div className="sm:hidden space-y-4">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div key={step.status} className="flex items-center gap-4">
                      <div className="relative">
                        {/* Connector Line */}
                        {index < statusSteps.length - 1 && (
                          <div
                            className={cn(
                              'absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-8',
                              index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                            )}
                          />
                        )}
                        {/* Step Circle */}
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center',
                            isCompleted
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                            isCurrent && 'ring-4 ring-primary/20'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <p
                          className={cn(
                            'font-medium',
                            isCompleted ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-primary">Current status</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Information */}
      {!isCancelled && currentStepIndex >= 2 && trackingNumber && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Carrier</p>
                <p className="font-medium uppercase">{shippingCarrier || 'Standard Partner'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tracking Number</p>
                <p className="font-mono font-black text-primary">{trackingNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking History */}
      {!isCancelled && realEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracking History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {realEvents.map((event, index) => (
                <div key={index} className="flex gap-4 pb-6 last:pb-0">
                  {/* Timeline indicator */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                    {index < realEvents.length - 1 && (
                      <div className="w-0.5 flex-1 bg-muted mt-2" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 -mt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className={cn('font-bold', index === 0 ? 'text-slate-900' : 'text-slate-500')}>
                        {event.status}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        {new Date(event.timestamp).toLocaleString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                    {event.location && (
                      <p className="text-xs font-bold text-primary flex items-center gap-1 mt-1 uppercase tracking-widest">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
