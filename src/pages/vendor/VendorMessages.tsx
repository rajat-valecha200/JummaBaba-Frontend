import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MessagesPage from '@/components/messaging/MessagesPage';

export default function VendorMessages() {
  return (
    <div className="h-full flex flex-col space-y-3 min-h-0">
      <Alert className="bg-primary/5 border-primary/20 flex-shrink-0">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          All buyer communications are handled by JummaBaba Support. You cannot contact buyers directly.
        </AlertDescription>
      </Alert>
      <div className="flex-1 min-h-0">
        <MessagesPage userType="vendor" />
      </div>
    </div>
  );
}
