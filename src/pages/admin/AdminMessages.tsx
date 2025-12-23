import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Check,
  CheckCheck, 
  ArrowLeft,
  Shield,
  Clock,
  Filter,
  ChevronDown,
  Users,
  Store,
  User,
  MessageSquare,
  CornerDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';

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
  participantType: 'buyer' | 'vendor';
  linkedProductId?: string;
  linkedProductName?: string;
  linkedVendorId?: string;
  linkedVendorName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isVerified: boolean;
  messages: Message[];
}

// Mock data for admin unified inbox
const mockBuyerConversations: Conversation[] = [
  {
    id: 'buyer-1',
    participantName: 'Rajesh Kumar',
    participantAvatar: '',
    participantCompany: 'Kumar Textiles Pvt Ltd',
    participantType: 'buyer',
    linkedProductId: 'prod-1',
    linkedProductName: 'Industrial Cotton Fabric 60"',
    linkedVendorId: 'vendor-1',
    linkedVendorName: 'Sharma Fabrics Co.',
    lastMessage: 'I need 5000 meters of cotton fabric. What is the best price?',
    lastMessageTime: '10:30 AM',
    unreadCount: 2,
    isOnline: true,
    isVerified: true,
    messages: [
      { id: 'm1', senderId: 'buyer', text: 'Hello, I am interested in Industrial Cotton Fabric 60"', timestamp: '10:00 AM', status: 'read' },
      { id: 'm2', senderId: 'admin', text: 'Hello Rajesh! Thank you for reaching out. Let me check with the vendor for you.', timestamp: '10:15 AM', status: 'read' },
      { id: 'm3', senderId: 'buyer', text: 'I need 5000 meters of cotton fabric. What is the best price?', timestamp: '10:30 AM', status: 'delivered' },
    ],
  },
  {
    id: 'buyer-2',
    participantName: 'Priya Sharma',
    participantAvatar: '',
    participantCompany: 'Sharma Electronics',
    participantType: 'buyer',
    linkedProductId: 'prod-2',
    linkedProductName: 'LED Panel Lights 40W',
    linkedVendorId: 'vendor-2',
    linkedVendorName: 'Bright Lighting Solutions',
    lastMessage: 'Can you provide GST invoice for 1000 units?',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    isVerified: true,
    messages: [
      { id: 'm1', senderId: 'buyer', text: 'Hi, I want to order LED Panel Lights', timestamp: 'Yesterday', status: 'read' },
      { id: 'm2', senderId: 'admin', text: 'Hello Priya! We have great options for you. The price for 1000+ units is ₹450/unit.', timestamp: 'Yesterday', status: 'read' },
      { id: 'm3', senderId: 'buyer', text: 'Can you provide GST invoice for 1000 units?', timestamp: 'Yesterday', status: 'read' },
      { id: 'm4', senderId: 'admin', text: 'Absolutely! GST invoice will be provided. Shall I proceed with the order?', timestamp: 'Yesterday', status: 'read' },
    ],
  },
  {
    id: 'buyer-3',
    participantName: 'Amit Patel',
    participantAvatar: '',
    participantCompany: 'Patel Industries',
    participantType: 'buyer',
    linkedProductId: 'prod-3',
    linkedProductName: 'Industrial Bearings SKF',
    linkedVendorId: 'vendor-3',
    linkedVendorName: 'SKF Authorized Dealer',
    lastMessage: 'Need bulk order quotation for 10000 bearings',
    lastMessageTime: '2 days ago',
    unreadCount: 1,
    isOnline: true,
    isVerified: false,
    messages: [
      { id: 'm1', senderId: 'buyer', text: 'Need bulk order quotation for 10000 bearings', timestamp: '2 days ago', status: 'delivered' },
    ],
  },
];

const mockVendorConversations: Conversation[] = [
  {
    id: 'vendor-1',
    participantName: 'Sharma Fabrics Co.',
    participantAvatar: '',
    participantCompany: 'Verified Supplier',
    participantType: 'vendor',
    lastMessage: 'We can offer ₹85/meter for 5000+ meters order',
    lastMessageTime: '11:00 AM',
    unreadCount: 1,
    isOnline: true,
    isVerified: true,
    messages: [
      { id: 'm1', senderId: 'admin', text: 'Hi, we have a buyer inquiry for Industrial Cotton Fabric 60". Quantity: 5000 meters.', timestamp: '10:45 AM', status: 'read' },
      { id: 'm2', senderId: 'vendor', text: 'We can offer ₹85/meter for 5000+ meters order', timestamp: '11:00 AM', status: 'delivered' },
    ],
  },
  {
    id: 'vendor-2',
    participantName: 'Bright Lighting Solutions',
    participantAvatar: '',
    participantCompany: 'Verified Supplier',
    participantType: 'vendor',
    lastMessage: 'Stock available. Ready for dispatch within 3 days.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    isVerified: true,
    messages: [
      { id: 'm1', senderId: 'admin', text: 'New order inquiry: LED Panel Lights 40W, Quantity: 1000 units', timestamp: 'Yesterday', status: 'read' },
      { id: 'm2', senderId: 'vendor', text: 'Stock available. Ready for dispatch within 3 days.', timestamp: 'Yesterday', status: 'read' },
    ],
  },
  {
    id: 'vendor-3',
    participantName: 'SKF Authorized Dealer',
    participantAvatar: '',
    participantCompany: 'Verified Supplier',
    participantType: 'vendor',
    lastMessage: 'Awaiting your response on bulk bearing inquiry',
    lastMessageTime: '1 day ago',
    unreadCount: 0,
    isOnline: true,
    isVerified: true,
    messages: [
      { id: 'm1', senderId: 'admin', text: 'Bulk inquiry received: Industrial Bearings, Quantity: 10000 units. Please provide best price.', timestamp: '2 days ago', status: 'read' },
      { id: 'm2', senderId: 'admin', text: 'Awaiting your response on bulk bearing inquiry', timestamp: '1 day ago', status: 'delivered' },
    ],
  },
];

// Message Status Component
function MessageStatus({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />;
    case 'sent':
      return <Check className="h-3.5 w-3.5 text-muted-foreground/70" />;
    case 'delivered':
      return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/70" />;
    case 'read':
      return <CheckCheck className="h-3.5 w-3.5 text-b2b-orange" />;
    default:
      return null;
  }
}

export default function AdminMessages() {
  const [activeTab, setActiveTab] = useState<'all' | 'buyers' | 'vendors'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([...mockBuyerConversations, ...mockVendorConversations]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         c.participantCompany.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'buyers') return matchesSearch && c.participantType === 'buyer';
    if (activeTab === 'vendors') return matchesSearch && c.participantType === 'vendor';
    return matchesSearch;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const buyerUnread = conversations.filter(c => c.participantType === 'buyer').reduce((sum, c) => sum + c.unreadCount, 0);
  const vendorUnread = conversations.filter(c => c.participantType === 'vendor').reduce((sum, c) => sum + c.unreadCount, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation?.messages]);

  const openConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Mark as read
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      senderId: 'admin',
      text: messageInput,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'sent',
    };

    setConversations(prev => prev.map(c => {
      if (c.id !== selectedConversation.id) return c;
      return {
        ...c,
        messages: [...c.messages, newMessage],
        lastMessage: messageInput,
        lastMessageTime: 'Just now',
      };
    }));

    setSelectedConversation(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage],
    } : null);

    setMessageInput('');
  };

  const handleForwardToVendor = (conv: Conversation) => {
    if (conv.participantType !== 'buyer' || !conv.linkedVendorId) return;
    
    // Find the linked vendor conversation
    const vendorConv = conversations.find(c => c.id === conv.linkedVendorId);
    if (vendorConv) {
      setSelectedConversation(vendorConv);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground">Unified Inbox</h1>
        <p className="text-muted-foreground">Mediate all buyer and vendor conversations</p>
      </div>

      <Card className="h-full flex overflow-hidden bg-card border-border">
        {/* Conversation List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-card",
          selectedConversation && "hidden md:flex"
        )}>
          {/* Tabs */}
          <div className="p-3 border-b border-border">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="w-full bg-muted">
                <TabsTrigger value="all" className="flex-1 gap-1.5 data-[state=active]:bg-b2b-orange data-[state=active]:text-white">
                  <MessageSquare className="h-4 w-4" />
                  All
                  {totalUnread > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background">
                      {totalUnread}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="buyers" className="flex-1 gap-1.5 data-[state=active]:bg-b2b-orange data-[state=active]:text-white">
                  <User className="h-4 w-4" />
                  Buyers
                  {buyerUnread > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background">
                      {buyerUnread}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="vendors" className="flex-1 gap-1.5 data-[state=active]:bg-b2b-orange data-[state=active]:text-white">
                  <Store className="h-4 w-4" />
                  Vendors
                  {vendorUnread > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background">
                      {vendorUnread}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted border-border"
              />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className={cn(
                      "w-full p-3 text-left hover:bg-muted/50 transition-colors",
                      selectedConversation?.id === conv.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-border">
                          <AvatarImage src={conv.participantAvatar} />
                          <AvatarFallback className={cn(
                            "font-semibold",
                            conv.participantType === 'buyer' ? "bg-blue-500/20 text-blue-400" : "bg-b2b-orange/20 text-b2b-orange"
                          )}>
                            {conv.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {conv.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium truncate text-foreground">
                              {conv.participantName}
                            </span>
                            {conv.isVerified && (
                              <Shield className="h-3.5 w-3.5 text-b2b-orange flex-shrink-0" />
                            )}
                            <Badge variant="outline" className={cn(
                              "text-[10px] px-1.5 py-0 h-4 flex-shrink-0",
                              conv.participantType === 'buyer' 
                                ? "border-blue-500 text-blue-400" 
                                : "border-b2b-orange text-b2b-orange"
                            )}>
                              {conv.participantType === 'buyer' ? 'Buyer' : 'Vendor'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {conv.lastMessageTime}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {conv.participantCompany}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-b2b-orange text-white h-5 px-1.5 text-xs flex-shrink-0">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>

                        {/* Linked Product/Vendor Info for Buyers */}
                        {conv.participantType === 'buyer' && conv.linkedProductName && (
                          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded px-1.5 py-0.5">
                            <CornerDownRight className="h-3 w-3" />
                            <span className="truncate">{conv.linkedProductName}</span>
                            <span className="text-muted-foreground/50">→</span>
                            <span className="truncate text-b2b-orange">{conv.linkedVendorName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col bg-background",
          !selectedConversation && "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-3 border-b border-border bg-card flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <div className="relative">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarImage src={selectedConversation.participantAvatar} />
                    <AvatarFallback className={cn(
                      "font-semibold",
                      selectedConversation.participantType === 'buyer' 
                        ? "bg-blue-500/20 text-blue-400" 
                        : "bg-b2b-orange/20 text-b2b-orange"
                    )}>
                      {selectedConversation.participantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground truncate">
                      {selectedConversation.participantName}
                    </span>
                    {selectedConversation.isVerified && (
                      <Shield className="h-4 w-4 text-b2b-orange" />
                    )}
                    <Badge variant="outline" className={cn(
                      "text-xs",
                      selectedConversation.participantType === 'buyer' 
                        ? "border-blue-500 text-blue-400" 
                        : "border-b2b-orange text-b2b-orange"
                    )}>
                      {selectedConversation.participantType === 'buyer' ? 'Buyer' : 'Vendor'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedConversation.participantCompany}
                    {selectedConversation.isOnline && ' • Online'}
                  </p>
                </div>

                {/* Action buttons for buyer conversations */}
                {selectedConversation.participantType === 'buyer' && selectedConversation.linkedVendorId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-b2b-orange text-b2b-orange hover:bg-b2b-orange hover:text-white"
                        onClick={() => handleForwardToVendor(selectedConversation)}
                      >
                        <CornerDownRight className="h-4 w-4 mr-1.5" />
                        View Vendor Chat
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Open conversation with {selectedConversation.linkedVendorName}
                    </TooltipContent>
                  </Tooltip>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card border-border">
                    <DropdownMenuItem>View Profile</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Resolved</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      Archive Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Linked Product Banner for Buyer Chats */}
              {selectedConversation.participantType === 'buyer' && selectedConversation.linkedProductName && (
                <div className="px-4 py-2 bg-muted/50 border-b border-border flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Product Inquiry:</span>
                  <span className="font-medium text-foreground">{selectedConversation.linkedProductName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-b2b-orange font-medium">{selectedConversation.linkedVendorName}</span>
                </div>
              )}

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map(msg => {
                    const isAdmin = msg.senderId === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          isAdmin ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                          isAdmin 
                            ? "bg-b2b-orange text-white rounded-br-md" 
                            : "bg-card text-foreground rounded-bl-md border border-border"
                        )}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </p>
                          <div className={cn(
                            "flex items-center justify-end gap-1.5 mt-1.5",
                            isAdmin ? "text-white/70" : "text-muted-foreground"
                          )}>
                            <span className="text-[10px]">{msg.timestamp}</span>
                            {isAdmin && <MessageStatus status={msg.status} />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-3 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Type a message as Admin..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    className="flex-1 bg-muted border-border"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-b2b-orange hover:bg-b2b-orange/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  You are responding as <span className="text-b2b-orange font-medium">JummaBaba Support</span>
                </p>
              </div>
            </>
          ) : (
            // Empty State
            <div className="flex-1 flex items-center justify-center bg-muted/30">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-b2b-orange/10 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-10 w-10 text-b2b-orange" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Unified Admin Inbox
                </h3>
                <p className="text-muted-foreground max-w-sm">
                  Select a conversation to start mediating between buyers and vendors.
                  All communications flow through JummaBaba Support.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
