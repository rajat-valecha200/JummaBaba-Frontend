import { CheckCircle, Clock, Package, Truck, XCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

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
  trackingEvents?: TrackingEvent[];
  shippingCarrier?: string;
  trackingNumber?: string;
}

const statusSteps: { status: OrderStatus; label: string; icon: typeof Package }[] = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Package },
];

const statusIndex: Record<OrderStatus, number> = {
  pending: 0,
  confirmed: 1,
  shipped: 2,
  delivered: 3,
  cancelled: -1,
};

const mockTrackingEvents: TrackingEvent[] = [
  {
    status: 'Order Placed',
    timestamp: '2024-01-20T10:30:00Z',
    description: 'Your order has been placed successfully',
  },
  {
    status: 'Order Confirmed',
    timestamp: '2024-01-20T14:15:00Z',
    description: 'Seller has confirmed your order',
  },
  {
    status: 'Packed',
    timestamp: '2024-01-21T09:00:00Z',
    location: 'Warehouse, Mumbai',
    description: 'Your order has been packed and is ready for dispatch',
  },
  {
    status: 'Shipped',
    timestamp: '2024-01-21T16:30:00Z',
    location: 'Sorting Facility, Mumbai',
    description: 'Package picked up by courier partner',
  },
  {
    status: 'In Transit',
    timestamp: '2024-01-22T08:00:00Z',
    location: 'Hub, Pune',
    description: 'Package in transit to destination city',
  },
  {
    status: 'Out for Delivery',
    timestamp: '2024-01-23T07:30:00Z',
    location: 'Delivery Hub, Destination City',
    description: 'Package is out for delivery',
  },
];

export function OrderTracking({
  currentStatus,
  orderNumber,
  orderDate,
  estimatedDelivery,
  trackingEvents = mockTrackingEvents,
  shippingCarrier = 'BlueDart Express',
  trackingNumber = 'BD123456789IN',
}: OrderTrackingProps) {
  const currentStepIndex = statusIndex[currentStatus];
  const isCancelled = currentStatus === 'cancelled';

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
              estimatedDelivery && (
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
      {!isCancelled && currentStepIndex >= 2 && (
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
                <p className="font-medium">{shippingCarrier}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tracking Number</p>
                <p className="font-mono font-medium">{trackingNumber}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking History */}
      {!isCancelled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tracking History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {trackingEvents.slice(0, currentStepIndex >= 2 ? undefined : 2).map((event, index) => (
                <div key={index} className="flex gap-4 pb-6 last:pb-0">
                  {/* Timeline indicator */}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full',
                        index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'
                      )}
                    />
                    {index < trackingEvents.slice(0, currentStepIndex >= 2 ? undefined : 2).length - 1 && (
                      <div className="w-0.5 flex-1 bg-muted mt-2" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 -mt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <p className={cn('font-medium', index === 0 && 'text-primary')}>
                        {event.status}
                      </p>
                      <p className="text-sm text-muted-foreground">
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
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
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
