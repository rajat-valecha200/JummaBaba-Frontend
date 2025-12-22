import { useState } from 'react';
import { Send, Search, Phone, MoreVertical, Paperclip, Image, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  participantName: string;
  participantAvatar: string;
  participantCompany: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    participantName: 'Rajesh Electronics',
    participantAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop',
    participantCompany: 'Verified Supplier',
    lastMessage: 'Yes, we can offer bulk pricing for 500+ units',
    lastMessageTime: '10:30 AM',
    unreadCount: 2,
    isOnline: true,
    messages: [
      { id: 'm1', senderId: 'other', text: 'Hello! I saw your inquiry about Samsung phones.', timestamp: '10:15 AM', isRead: true },
      { id: 'm2', senderId: 'me', text: 'Hi! Yes, I need 500 units of Galaxy A54. What is your best price?', timestamp: '10:20 AM', isRead: true },
      { id: 'm3', senderId: 'other', text: 'For 500 units, we can offer ₹27,500 per unit with free shipping.', timestamp: '10:25 AM', isRead: true },
      { id: 'm4', senderId: 'other', text: 'Yes, we can offer bulk pricing for 500+ units', timestamp: '10:30 AM', isRead: false },
    ],
  },
  {
    id: 'conv-2',
    participantName: 'Sharma Textiles',
    participantAvatar: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop',
    participantCompany: 'Manufacturer',
    lastMessage: 'Sample shipment dispatched today',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Can you send fabric samples before bulk order?', timestamp: 'Yesterday 2:00 PM', isRead: true },
      { id: 'm2', senderId: 'other', text: 'Sure! Please share your delivery address.', timestamp: 'Yesterday 2:15 PM', isRead: true },
      { id: 'm3', senderId: 'me', text: '123 Tech Park, Andheri East, Mumbai - 400069', timestamp: 'Yesterday 2:20 PM', isRead: true },
      { id: 'm4', senderId: 'other', text: 'Sample shipment dispatched today', timestamp: 'Yesterday 4:30 PM', isRead: true },
    ],
  },
  {
    id: 'conv-3',
    participantName: 'Industrial Tools India',
    participantAvatar: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100&h=100&fit=crop',
    participantCompany: 'Wholesaler',
    lastMessage: 'Payment received. Order confirmed!',
    lastMessageTime: 'Mon',
    unreadCount: 0,
    isOnline: true,
    messages: [
      { id: 'm1', senderId: 'other', text: 'Your order for drill machines is ready.', timestamp: 'Mon 11:00 AM', isRead: true },
      { id: 'm2', senderId: 'me', text: 'Great! I have made the payment. Please check.', timestamp: 'Mon 11:30 AM', isRead: true },
      { id: 'm3', senderId: 'other', text: 'Payment received. Order confirmed!', timestamp: 'Mon 12:00 PM', isRead: true },
    ],
  },
  {
    id: 'conv-4',
    participantName: 'Agro Fresh Exports',
    participantAvatar: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=100&h=100&fit=crop',
    participantCompany: 'Exporter',
    lastMessage: 'We have organic certification',
    lastMessageTime: 'Last week',
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Do you have organic certification for the rice?', timestamp: 'Last week', isRead: true },
      { id: 'm2', senderId: 'other', text: 'We have organic certification', timestamp: 'Last week', isRead: true },
    ],
  },
];

interface MessagesPageProps {
  userType: 'buyer' | 'vendor';
}

export default function MessagesPage({ userType }: MessagesPageProps) {
  const [conversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    // In a real app, this would send the message to the backend
    setMessageInput('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex rounded-lg border bg-background overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b",
                selectedConversation?.id === conv.id && "bg-muted"
              )}
              onClick={() => setSelectedConversation(conv)}
            >
              <div className="relative">
                <Avatar>
                  <AvatarImage src={conv.participantAvatar} />
                  <AvatarFallback>{conv.participantName[0]}</AvatarFallback>
                </Avatar>
                {conv.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{conv.participantName}</p>
                  <span className="text-xs text-muted-foreground">{conv.lastMessageTime}</span>
                </div>
                <p className="text-xs text-muted-foreground">{conv.participantCompany}</p>
                <p className="text-sm text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
              </div>
              {conv.unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground">{conv.unreadCount}</Badge>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar>
                  <AvatarImage src={selectedConversation.participantAvatar} />
                  <AvatarFallback>{selectedConversation.participantName[0]}</AvatarFallback>
                </Avatar>
                {selectedConversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-background" />
                )}
              </div>
              <div>
                <p className="font-medium">{selectedConversation.participantName}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.isOnline ? 'Online' : 'Offline'} • {selectedConversation.participantCompany}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.senderId === 'me' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-2",
                      message.senderId === 'me'
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div className={cn(
                      "flex items-center gap-1 mt-1",
                      message.senderId === 'me' ? "justify-end" : "justify-start"
                    )}>
                      <span className={cn(
                        "text-xs",
                        message.senderId === 'me' ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}>
                        {message.timestamp}
                      </span>
                      {message.senderId === 'me' && (
                        <CheckCheck className={cn(
                          "h-3 w-3",
                          message.isRead ? "text-primary-foreground" : "text-primary-foreground/50"
                        )} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Image className="h-4 w-4" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  );
}
