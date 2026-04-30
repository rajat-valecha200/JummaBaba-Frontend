import { useState, useRef, useEffect, useCallback } from 'react';
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
  CornerDownRight,
  Plus
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

// Unified inbox now dynamic

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'buyers' | 'vendors'>('all');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Chat State
  const [showNewChat, setShowNewChat] = useState<'vendor' | 'buyer' | null>(null);
  const [availableParticipants, setAvailableParticipants] = useState<any[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const playNotificationSound = useCallback(() => {
    /* 
    try {
      const audio = new Audio('/notification_sound.wav');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Audio play blocked by browser:', e));
    } catch (e) {
      console.log('Audio play failed:', e);
    }
    */
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.messages.getConversations();
      const mapped: Conversation[] = data.map((c: any) => ({
        id: c.participant_id,
        participantName: c.participant_name,
        participantAvatar: c.participant_avatar,
        participantCompany: c.participant_company,
        participantType: c.participant_role === 'vendor' ? 'vendor' : 'buyer',
        lastMessage: c.last_message,
        lastMessageTime: new Date(c.last_message_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        unreadCount: (c.participant_id === selectedConversation?.id) ? 0 : parseInt(c.unread_count, 10),
        isOnline: c.is_online,
        isVerified: true,
        messages: []
      }));
      
      // Play sound if unread count increased globally
      const totalUnreadNow = mapped.reduce((sum, c) => sum + c.unreadCount, 0);
      setConversations(prev => {
        const totalUnreadPrev = prev.reduce((sum, c) => sum + c.unreadCount, 0);
        if (totalUnreadNow > totalUnreadPrev) {
          // playNotificationSound(); // Commented out for now
        }
        return mapped;
      });
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation?.id, playNotificationSound]); // Add dependency on selected ID

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation?.id || !user?.id) return;
    try {
      const history = await api.messages.getHistory(selectedConversation.id);
      const mappedMessages: Message[] = history.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id === user?.id ? 'admin' : m.sender_id,
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: m.is_read ? 'read' : 'sent'
      }));
      
      setSelectedConversation(prev => {
        if (!prev || prev.id !== selectedConversation.id) return prev;
        if (JSON.stringify(prev.messages) === JSON.stringify(mappedMessages)) return prev;
        return { ...prev, messages: mappedMessages };
      });

      // If there are unread messages from the other user, mark them as read
      const hasUnread = history.some((m: any) => m.sender_id !== user.id && !m.is_read);
      if (hasUnread) {
        api.messages.markAsRead(selectedConversation.id).then(() => {
          window.dispatchEvent(new CustomEvent('refreshAdminStats'));
          fetchConversations();
        }).catch(err => console.error('Failed to mark as read in poll:', err));
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  }, [selectedConversation?.id, user?.id, fetchConversations]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // 10s for sidebar
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConversation?.id) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // 3s for active chat
      return () => clearInterval(interval);
    }
  }, [selectedConversation?.id, fetchMessages]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!showNewChat) return;
      try {
        const data = await api.profiles.list(showNewChat, 'approved');
        setAvailableParticipants(data);
      } catch (error) {
        console.error('Failed to fetch participants:', error);
      }
    };
    fetchParticipants();
  }, [showNewChat]);

  const handleStartChat = async (participant: any) => {
    const existing = conversations.find(c => c.id === participant.id);
    if (existing) {
      setSelectedConversation(existing);
    } else {
      const newConv: Conversation = {
        id: participant.id,
        participantName: participant.full_name,
        participantAvatar: participant.logo_url,
        participantCompany: participant.business_name || '',
        participantType: participant.role === 'vendor' ? 'vendor' : 'buyer',
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        isOnline: participant.is_online,
        isVerified: true,
        messages: []
      };
      setConversations(prev => [newConv, ...prev]);
      setSelectedConversation(newConv);
    }
    setShowNewChat(null);
    setParticipantSearch('');
  };

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

  const openConversation = async (conv: Conversation) => {
    setSelectedConversation(conv);
    // Locally zero out count for immediate feedback
    setConversations(prev => prev.map(c => 
      c.id === conv.id ? { ...c, unreadCount: 0 } : c
    ));
    try {
      await api.messages.markAsRead(conv.id);
      // Trigger global stats refresh for the Admin Bell
      window.dispatchEvent(new CustomEvent('refreshAdminStats'));
      // Wait a bit for DB to commit before fetching fresh list
      setTimeout(fetchConversations, 500);
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    try {
      await api.messages.send(selectedConversation.id, messageInput.trim());
      setMessageInput('');
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
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

          {/* Search & Actions */}
          <div className="p-3 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted border-border"
                />
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" className="bg-b2b-orange hover:bg-b2b-orange/90 h-10 w-10 shrink-0">
                      <Plus className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <DropdownMenuLabel>Start New Chat</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowNewChat('vendor')}>
                      <Store className="h-4 w-4 mr-2" /> New Vendor Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowNewChat('buyer')}>
                      <User className="h-4 w-4 mr-2" /> New Buyer Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* New Chat Dialog */}
          <Dialog open={!!showNewChat} onOpenChange={() => setShowNewChat(null)}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Start Conversation with {showNewChat === 'vendor' ? 'Vendor' : 'Buyer'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder={`Search ${showNewChat}s...`} 
                    className="pl-9"
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                  />
                </div>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-2">
                    {availableParticipants
                      .filter(p => p.full_name.toLowerCase().includes(participantSearch.toLowerCase()) || 
                                  p.business_name?.toLowerCase().includes(participantSearch.toLowerCase()))
                      .map(p => (
                        <button
                          key={p.id}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                          onClick={() => handleStartChat(p)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>{p.full_name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold truncate">{p.full_name}</p>
                              {p.is_online && (
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" title="Online" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{p.business_name || p.email}</p>
                          </div>
                        </button>
                      ))}
                    {availableParticipants.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-10">No {showNewChat}s found</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {loading ? (
               <div className="p-8 text-center animate-pulse">
                <div className="h-12 w-12 bg-muted rounded-full mx-auto mb-3" />
                <div className="h-4 w-32 bg-muted mx-auto" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center h-full">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-foreground">No conversations yet</h3>
                <p className="text-sm text-muted-foreground mt-1 px-6 text-center">
                  Click the <Plus className="h-3 w-3 inline" /> button to start a new chat with a vendor or buyer.
                </p>
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
                            {conv.isOnline && (
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" title="Online" />
                            )}
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
                          {conv.unreadCount > 0 && selectedConversation?.id !== conv.id && (
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
                  className="flex-shrink-0"
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
