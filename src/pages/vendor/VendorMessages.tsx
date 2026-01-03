import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import MessagesPage from '@/components/messaging/MessagesPage';

export default function VendorMessages() {
  return (
    <div className="space-y-4">
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription>
          All buyer communications are handled by JummaBaba Support. You cannot contact buyers directly.
        </AlertDescription>
      </Alert>
      <MessagesPage userType="vendor" />
    </div>
  );
}
