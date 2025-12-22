import MessagesPage from '@/components/messaging/MessagesPage';

export default function BuyerMessages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with vendors about your orders and inquiries</p>
      </div>
      <MessagesPage userType="buyer" />
    </div>
  );
}
