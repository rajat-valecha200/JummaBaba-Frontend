import MessagesPage from '@/components/messaging/MessagesPage';

export default function VendorMessages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with buyers about orders and inquiries</p>
      </div>
      <MessagesPage userType="vendor" />
    </div>
  );
}
