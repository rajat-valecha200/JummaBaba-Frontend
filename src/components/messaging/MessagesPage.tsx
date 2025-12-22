import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Search, 
  Phone, 
  MoreVertical, 
  Paperclip, 
  Image, 
  Check,
  CheckCheck, 
  ArrowLeft,
  Smile,
  Shield,
  Mic,
  Clock,
  Bell,
  BellOff,
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
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
  isVerified: boolean;
  isTyping: boolean;
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
    isVerified: true,
    isTyping: true,
    messages: [
      { id: 'm1', senderId: 'other', text: 'Hello! I saw your inquiry about Samsung phones.', timestamp: '10:15 AM', status: 'read' },
      { id: 'm2', senderId: 'me', text: 'Hi! Yes, I need 500 units of Galaxy A54. What is your best price?', timestamp: '10:20 AM', status: 'read' },
      { id: 'm3', senderId: 'other', text: 'For 500 units, we can offer ₹27,500 per unit with free shipping.', timestamp: '10:25 AM', status: 'read' },
      { id: 'm4', senderId: 'me', text: 'That sounds good! Can you also include warranty cards?', timestamp: '10:28 AM', status: 'delivered' },
      { id: 'm5', senderId: 'other', text: 'Yes, we can offer bulk pricing for 500+ units', timestamp: '10:30 AM', status: 'read' },
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
    isVerified: true,
    isTyping: false,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Can you send fabric samples before bulk order?', timestamp: 'Yesterday 2:00 PM', status: 'read' },
      { id: 'm2', senderId: 'other', text: 'Sure! Please share your delivery address.', timestamp: 'Yesterday 2:15 PM', status: 'read' },
      { id: 'm3', senderId: 'me', text: '123 Tech Park, Andheri East, Mumbai - 400069', timestamp: 'Yesterday 2:20 PM', status: 'read' },
      { id: 'm4', senderId: 'other', text: 'Sample shipment dispatched today', timestamp: 'Yesterday 4:30 PM', status: 'read' },
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
    isVerified: false,
    isTyping: false,
    messages: [
      { id: 'm1', senderId: 'other', text: 'Your order for drill machines is ready.', timestamp: 'Mon 11:00 AM', status: 'read' },
      { id: 'm2', senderId: 'me', text: 'Great! I have made the payment. Please check.', timestamp: 'Mon 11:30 AM', status: 'read' },
      { id: 'm3', senderId: 'other', text: 'Payment received. Order confirmed!', timestamp: 'Mon 12:00 PM', status: 'read' },
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
    isVerified: true,
    isTyping: false,
    messages: [
      { id: 'm1', senderId: 'me', text: 'Do you have organic certification for the rice?', timestamp: 'Last week', status: 'sent' },
      { id: 'm2', senderId: 'other', text: 'We have organic certification', timestamp: 'Last week', status: 'read' },
    ],
  },
];

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Message Status Icon Component
function MessageStatus({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3.5 w-3.5 text-primary-foreground/50" />;
    case 'sent':
      return <Check className="h-3.5 w-3.5 text-primary-foreground/70" />;
    case 'delivered':
      return <CheckCheck className="h-3.5 w-3.5 text-primary-foreground/70" />;
    case 'read':
      return <CheckCheck className="h-3.5 w-3.5 text-primary-foreground" />;
    default:
      return null;
  }
}

// Notification Permission Button
function NotificationButton({ 
  permission, 
  onRequest, 
  isSupported 
}: { 
  permission: NotificationPermission; 
  onRequest: () => void; 
  isSupported: boolean;
}) {
  if (!isSupported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full"
          onClick={onRequest}
        >
          {permission === 'granted' ? (
            <Bell className="h-5 w-5 text-success" />
          ) : permission === 'denied' ? (
            <BellOff className="h-5 w-5 text-destructive" />
          ) : (
            <BellRing className="h-5 w-5 text-warning animate-pulse" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {permission === 'granted' 
          ? 'Notifications enabled' 
          : permission === 'denied'
          ? 'Notifications blocked - enable in browser settings'
          : 'Click to enable notifications'}
      </TooltipContent>
    </Tooltip>
  );
}

interface MessagesPageProps {
  userType: 'buyer' | 'vendor';
}

export default function MessagesPage({ userType }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    permission, 
    isSupported, 
    requestPermission, 
    showMessageNotification,
    isEnabled 
  } = useNotifications();

  const filteredConversations = conversations.filter(c =>
    c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedConversation) {
      scrollToBottom();
    }
  }, [selectedConversation, selectedConversation?.messages.length]);

  // Simulate incoming messages for demo
  const simulateIncomingMessage = useCallback((conv: Conversation) => {
    const incomingMessages = [
      "Thanks for your inquiry! Let me check our inventory.",
      "We have a special discount running this week.",
      "Can you confirm the delivery address?",
      "Your order has been processed successfully!",
      "I'll send you the updated quotation shortly."
    ];
    
    const randomMessage = incomingMessages[Math.floor(Math.random() * incomingMessages.length)];
    
    const newMessage: Message = {
      id: `m-incoming-${Date.now()}`,
      senderId: 'other',
      text: randomMessage,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'read'
    };

    // Show notification if not viewing this conversation
    if (!selectedConversation || selectedConversation.id !== conv.id) {
      showMessageNotification(
        conv.participantName,
        randomMessage,
        conv.participantAvatar,
        () => openConversation(conv)
      );
    }

    // Update conversation
    setConversations(prev => prev.map(c => {
      if (c.id === conv.id) {
        return {
          ...c,
          messages: [...c.messages, newMessage],
          lastMessage: randomMessage,
          lastMessageTime: 'Just now',
          unreadCount: selectedConversation?.id !== conv.id ? c.unreadCount + 1 : c.unreadCount,
          isTyping: false
        };
      }
      return c;
    }));

    // Update selected conversation if viewing
    if (selectedConversation?.id === conv.id) {
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          isTyping: false
        };
      });
    }
  }, [selectedConversation, showMessageNotification]);

  // Demo: Simulate typing and incoming message after user sends
  useEffect(() => {
    if (selectedConversation?.isTyping) {
      const timeout = setTimeout(() => {
        simulateIncomingMessage(selectedConversation);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [selectedConversation?.isTyping, simulateIncomingMessage]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || isSending) return;
    
    const newMessage: Message = {
      id: `m-${Date.now()}`,
      senderId: 'me',
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'sending'
    };

    // Add message with 'sending' status
    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: newMessage.text,
      lastMessageTime: 'Just now',
      isTyping: false
    };

    setSelectedConversation(updatedConversation);
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id ? updatedConversation : c
    ));
    setMessageInput('');
    setIsSending(true);

    // Simulate message status progression
    setTimeout(() => {
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === newMessage.id ? { ...m, status: 'sent' as const } : m
          )
        };
      });
    }, 500);

    setTimeout(() => {
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === newMessage.id ? { ...m, status: 'delivered' as const } : m
          )
        };
      });
      setIsSending(false);
    }, 1500);

    setTimeout(() => {
      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === newMessage.id ? { ...m, status: 'read' as const } : m
          ),
          isTyping: true // Start typing indicator
        };
      });
    }, 2000);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const openConversation = (conv: Conversation) => {
    // Clear unread count when opening
    const updatedConv = { ...conv, unreadCount: 0 };
    setSelectedConversation(updatedConv);
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? updatedConv : c
    ));
  };

  // Get last message status for conversation list
  const getLastMessageStatus = (conv: Conversation) => {
    const lastMyMessage = [...conv.messages].reverse().find(m => m.senderId === 'me');
    return lastMyMessage?.status;
  };

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex flex-col rounded-xl border bg-background overflow-hidden shadow-sm">
      {/* Conversations List */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-out",
          selectedConversation 
            ? "hidden md:flex md:w-[340px] md:border-r md:flex-shrink-0" 
            : "w-full"
        )}
      >
        {/* List Header */}
        <div className="bg-card border-b px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Chats</h2>
            <div className="flex items-center gap-1">
              <NotificationButton 
                permission={permission}
                onRequest={requestPermission}
                isSupported={isSupported}
              />
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50 border-0 rounded-full"
            />
          </div>
        </div>

        {/* Notification Banner */}
        {isSupported && permission === 'default' && (
          <div 
            className="mx-4 mt-3 p-3 bg-primary/10 rounded-lg border border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors"
            onClick={requestPermission}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <BellRing className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Enable Notifications</p>
                <p className="text-xs text-muted-foreground">Get notified when you receive new messages</p>
              </div>
            </div>
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conv) => {
            const lastStatus = getLastMessageStatus(conv);
            
            return (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors active:bg-muted",
                  selectedConversation?.id === conv.id && "bg-muted/70"
                )}
                onClick={() => openConversation(conv)}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conv.participantAvatar} />
                    <AvatarFallback className="text-lg">{conv.participantName[0]}</AvatarFallback>
                  </Avatar>
                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-background" />
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="font-semibold truncate">{conv.participantName}</p>
                      {conv.isVerified && (
                        <Shield className="h-4 w-4 text-success flex-shrink-0" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs flex-shrink-0",
                      conv.unreadCount > 0 ? "text-success font-medium" : "text-muted-foreground"
                    )}>
                      {conv.lastMessageTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {lastStatus && (
                        <span className="flex-shrink-0">
                          {lastStatus === 'sending' && <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />}
                          {lastStatus === 'sent' && <Check className="h-3.5 w-3.5 text-muted-foreground/70" />}
                          {lastStatus === 'delivered' && <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/70" />}
                          {lastStatus === 'read' && <CheckCheck className="h-3.5 w-3.5 text-success" />}
                        </span>
                      )}
                      {conv.isTyping ? (
                        <span className="text-sm text-success italic">typing...</span>
                      ) : (
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-success text-success-foreground text-xs">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-out",
          selectedConversation 
            ? "w-full" 
            : "hidden md:flex md:flex-1"
        )}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-card border-b px-2 md:px-4 py-2 flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden flex-shrink-0 rounded-full"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.participantAvatar} />
                  <AvatarFallback>{selectedConversation.participantName[0]}</AvatarFallback>
                </Avatar>
                {selectedConversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold truncate">{selectedConversation.participantName}</p>
                  {selectedConversation.isVerified && (
                    <Shield className="h-4 w-4 text-success flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.isTyping ? (
                    <span className="text-success">typing...</span>
                  ) : selectedConversation.isOnline ? (
                    <span className="text-success">Online</span>
                  ) : (
                    'Offline'
                  )}
                  {selectedConversation.isVerified && ' • Verified Supplier'}
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              className="flex-1 overflow-y-auto px-3 py-4"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: 'hsl(var(--muted) / 0.3)'
              }}
            >
              <div className="space-y-2 max-w-3xl mx-auto">
                {/* Date separator */}
                <div className="flex justify-center mb-4">
                  <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground shadow-sm">
                    Today
                  </span>
                </div>

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
                        "max-w-[85%] md:max-w-[70%] rounded-lg px-3 py-2 shadow-sm relative",
                        message.senderId === 'me'
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-card rounded-tl-none"
                      )}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.text}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        message.senderId === 'me' ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-[10px]",
                          message.senderId === 'me' ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {message.timestamp}
                        </span>
                        {message.senderId === 'me' && (
                          <MessageStatus status={message.status} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {selectedConversation.isTyping && <TypingIndicator />}
                
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="bg-card border-t px-2 md:px-4 py-2">
              <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0 hidden md:flex">
                  <Smile className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full flex-shrink-0">
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="pr-10 bg-muted/50 border-0 rounded-full"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full md:hidden"
                  >
                    <Image className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  size="icon"
                  className="rounded-full flex-shrink-0 h-10 w-10"
                  disabled={!messageInput.trim() || isSending}
                >
                  {messageInput.trim() ? (
                    <Send className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Send className="h-10 w-10 opacity-50" />
            </div>
            <h3 className="text-xl font-medium mb-1">Your Messages</h3>
            <p className="text-sm text-center max-w-sm">
              Select a conversation to start messaging with {userType === 'buyer' ? 'suppliers' : 'buyers'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
