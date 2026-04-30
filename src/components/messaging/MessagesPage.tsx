import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, 
  Search, 
  Phone, 
  Video,
  MoreVertical, 
  Paperclip, 
  Image as ImageIcon, 
  Check,
  CheckCheck, 
  ArrowLeft,
  Smile,
  Shield,
  Mic,
  Clock,
  Bell,
  BellOff,
  BellRing,
  Trash2,
  X,
  MicOff,
  FileText,
  Camera,
  Reply,
  CornerUpRight,
  Filter,
  ChevronDown,
  Plus,
  MessageSquare,
  Loader2,
  Users,
  CornerDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { VoiceMessage } from './VoiceMessage';
import { MediaMessage, MediaPreviewBar, type MediaAttachment } from './MediaMessage';
import { EmojiPicker, QuickReactions, MessageReactions, type Reaction } from './EmojiPicker';
import { ReplyPreview, QuotedMessage, MessageActions, ForwardDialog, type ReplyToMessage } from './MessageActions';
import { CallDialog } from './CallDialog';
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
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  statusTimestamp?: string; // When the status last changed
  deliveredAt?: string; // When message was delivered
  readAt?: string; // When message was read
  isVoice?: boolean;
  voiceData?: {
    audioUrl: string;
    duration: number;
  };
  isMedia?: boolean;
  mediaData?: MediaAttachment;
  reactions?: Reaction[];
  replyTo?: ReplyToMessage;
  isForwarded?: boolean;
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

// Admin-mediated chat - Buyers and Vendors only talk to JummaBaba Support
// Admin-mediated chat - Buyers and Vendors only talk to JummaBaba Support
const getAdminConversationPlaceholder = (userType: 'buyer' | 'vendor'): Conversation[] => [
  {
    id: 'admin-support',
    participantName: 'JummaBaba Support',
    participantAvatar: '',
    participantCompany: 'Platform Admin',
    lastMessage: 'Contact us for any assistance.',
    lastMessageTime: '10:30 AM',
    unreadCount: 0,
    isOnline: true,
    isVerified: true,
    isTyping: false,
    messages: [],
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

// Message Status Icon Component with animation
function MessageStatus({ 
  status, 
  deliveredAt, 
  readAt,
  showDetails = false 
}: { 
  status: Message['status'];
  deliveredAt?: string;
  readAt?: string;
  showDetails?: boolean;
}) {
  const getStatusInfo = () => {
    switch (status) {
      case 'sending':
        return { icon: <Clock className="h-3.5 w-3.5" />, color: 'text-primary-foreground/50', label: 'Sending...' };
      case 'sent':
        return { icon: <Check className="h-3.5 w-3.5" />, color: 'text-primary-foreground/70', label: 'Sent' };
      case 'delivered':
        return { icon: <CheckCheck className="h-3.5 w-3.5" />, color: 'text-primary-foreground/70', label: deliveredAt ? `Delivered ${deliveredAt}` : 'Delivered' };
      case 'read':
        return { icon: <CheckCheck className="h-3.5 w-3.5" />, color: 'text-[hsl(var(--chart-3))]', label: readAt ? `Read ${readAt}` : 'Read' };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn(
          "inline-flex items-center transition-all duration-300",
          statusInfo.color,
          status === 'sending' && 'animate-pulse',
          status === 'read' && 'animate-in fade-in-0 duration-300'
        )}>
          {statusInfo.icon}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-xs">
        {statusInfo.label}
      </TooltipContent>
    </Tooltip>
  );
}

// Read Receipt Sync Indicator - shows when receipts are syncing
function ReadReceiptSyncIndicator({ isSyncing }: { isSyncing: boolean }) {
  if (!isSyncing) return null;
  
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground animate-pulse">
      <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
      <span>Syncing receipts...</span>
    </div>
  );
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
  rfqId?: string; // Optional RFQ context
}

export default function MessagesPage({ userType, rfqId }: MessagesPageProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Search and filter state
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'recent'>('all');
  const [supplierTypeFilter, setSupplierTypeFilter] = useState<string>('all');
  const [searchResults, setSearchResults] = useState<Array<{
    conversationId: string;
    conversationName: string;
    messageId: string;
    text: string;
    timestamp: string;
  }>>([]);
  
  const { 
    permission, 
    isSupported, 
    requestPermission, 
    showMessageNotification,
    isEnabled 
  } = useNotifications();

  const {
    isRecording,
    recordingDuration,
    permissionDenied,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration
  } = useVoiceRecorder();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showReactionsFor, setShowReactionsFor] = useState<string | null>(null);
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyToMessage | null>(null);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  
  // Call state
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  
  // Read receipt sync state
  const [isReceiptSyncing, setIsReceiptSyncing] = useState(false);
  
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const data = await api.profiles.list('admin', 'approved');
      setAdmins(data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    } finally {
      setLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (!isNewChatOpen) return;
    fetchAdmins();
    const interval = setInterval(fetchAdmins, 10000);
    return () => clearInterval(interval);
  }, [isNewChatOpen]);

  const startConversationWithAdmin = async (admin: any) => {
    setIsNewChatOpen(false);
    
    // Check if conversation already exists
    const existing = conversations.find(c => c.id === admin.id);
    if (existing) {
      openConversation(existing);
      return;
    }

    // Create a temporary conversation object
    const newConv: Conversation = {
      id: admin.id,
      participantName: admin.full_name || 'Admin',
      participantAvatar: admin.avatar_url || '',
      participantCompany: 'JummaBaba Support',
      lastMessage: 'Start a new conversation',
      lastMessageTime: 'Just now',
      unreadCount: 0,
      isOnline: true,
      isVerified: true,
      isTyping: false,
      messages: []
    };

    setConversations(prev => [newConv, ...prev]);
    openConversation(newConv);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Search messages across all conversations
  const handleMessageSearch = useCallback((query: string) => {
    setMessageSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    const results: typeof searchResults = [];
    conversations.forEach(conv => {
      conv.messages.forEach(msg => {
        if (msg.text.toLowerCase().includes(query.toLowerCase()) && !msg.isVoice && !msg.isMedia) {
          results.push({
            conversationId: conv.id,
            conversationName: conv.participantName,
            messageId: msg.id,
            text: msg.text,
            timestamp: msg.timestamp
          });
        }
      });
    });
    setSearchResults(results);
  }, [conversations]);

  // Navigate to a specific message from search results
  const handleSearchResultClick = (result: typeof searchResults[0]) => {
    const conv = conversations.find(c => c.id === result.conversationId);
    if (conv) {
      openConversation(conv);
      setIsMessageSearchOpen(false);
      setMessageSearchQuery('');
      setSearchResults([]);
      // Scroll to message after a short delay to allow the conversation to render
      setTimeout(() => {
        scrollToMessage(result.messageId);
      }, 100);
    }
  };

  // Filter conversations
  const getFilteredConversations = useCallback(() => {
    let filtered = conversations.filter(c =>
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Apply filter type
    if (filterType === 'unread') {
      filtered = filtered.filter(c => c.unreadCount > 0);
    } else if (filterType === 'recent') {
      filtered = filtered.filter(c => 
        c.lastMessageTime === 'Just now' || 
        c.lastMessageTime.includes('AM') || 
        c.lastMessageTime.includes('PM') ||
        c.lastMessageTime === 'Yesterday'
      );
    }
    
    // Apply supplier type filter
    if (supplierTypeFilter !== 'all') {
      filtered = filtered.filter(c => 
        c.participantCompany.toLowerCase().includes(supplierTypeFilter.toLowerCase())
      );
    }
    
    return filtered;
  }, [conversations, searchQuery, filterType, supplierTypeFilter]);

  const filteredConversations = getFilteredConversations();

  const handleReply = (message: Message) => {
    setReplyingTo({
      id: message.id,
      senderId: message.senderId,
      senderName: selectedConversation?.participantName || "Unknown",
      text: message.text,
      isVoice: message.isVoice,
      isMedia: message.isMedia
    });
    setShowActionsFor(null);
    setShowReactionsFor(null);
    inputRef.current?.focus();
  };

  const handleForwardMessage = (conversationIds: string[]) => {
    if (!forwardMessage) return;

    conversationIds.forEach(convId => {
      setConversations(prev => prev.map(conv => {
        if (conv.id !== convId) return conv;
        
        const forwardedMsg: Message = {
          id: `fwd-${Date.now()}-${convId}`,
          senderId: "me",
          text: forwardMessage.text,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
          status: "sent",
          isVoice: forwardMessage.isVoice,
          voiceData: forwardMessage.voiceData,
          isMedia: forwardMessage.isMedia,
          mediaData: forwardMessage.mediaData,
          isForwarded: true
        };

        return {
          ...conv,
          messages: [...conv.messages, forwardedMsg],
          lastMessage: "Forwarded message",
          lastMessageTime: "Just now"
        };
      }));
    });

    setForwardMessage(null);
  };

  const scrollToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("bg-primary/10");
      setTimeout(() => element.classList.remove("bg-primary/10"), 2000);
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (!selectedConversation) return;

    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages.map(msg => {
          if (msg.id !== messageId) return msg;
          
          const existingReactions = msg.reactions || [];
          const existingReaction = existingReactions.find(r => r.emoji === emoji);
          
          if (existingReaction) {
            if (existingReaction.hasReacted) {
              // Remove reaction
              if (existingReaction.count === 1) {
                return {
                  ...msg,
                  reactions: existingReactions.filter(r => r.emoji !== emoji)
                };
              }
              return {
                ...msg,
                reactions: existingReactions.map(r => 
                  r.emoji === emoji 
                    ? { ...r, count: r.count - 1, hasReacted: false }
                    : r
                )
              };
            } else {
              // Add to existing reaction
              return {
                ...msg,
                reactions: existingReactions.map(r =>
                  r.emoji === emoji
                    ? { ...r, count: r.count + 1, hasReacted: true }
                    : r
                )
              };
            }
          } else {
            // New reaction
            return {
              ...msg,
              reactions: [...existingReactions, { emoji, count: 1, users: ['me'], hasReacted: true }]
            };
          }
        })
      };
    });

    setShowReactionsFor(null);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
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

  // Real Messaging Integration
  const fetchConversations = useCallback(async () => {
    try {
      const data = await api.messages.getConversations();
      const mapped: Conversation[] = data.map((c: any) => ({
        id: c.participant_id,
        participantName: c.participant_name,
        participantAvatar: c.participant_avatar,
        participantCompany: c.participant_company,
        lastMessage: c.last_message,
        lastMessageTime: new Date(c.last_message_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        unreadCount: (c.participant_id === selectedConversation?.id) ? 0 : parseInt(c.unread_count, 10),
        isOnline: c.is_online,
        isVerified: true,
        isTyping: false,
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
    }
  }, [selectedConversation?.id, playNotificationSound]); // Add dependency on selected ID

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation?.id || !user?.id) return;
    try {
      const history = await api.messages.getHistory(selectedConversation.id);
      const mappedMessages: Message[] = history.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id === user.id ? 'me' : 'other',
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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || isSending) return;
    
    try {
      setIsSending(true);
      await api.messages.send(selectedConversation.id, messageInput.trim());
      setMessageInput('');
      setReplyingTo(null);
      
      // Refresh messages immediately
      const history = await api.messages.getHistory(selectedConversation.id);
      const mappedMessages: Message[] = history.map((m: any) => ({
        id: m.id,
        senderId: m.sender_id === user?.id ? 'me' : 'other',
        text: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: m.is_read ? 'read' : 'sent'
      }));
      
      setSelectedConversation(prev => prev ? { ...prev, messages: mappedMessages } : null);
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendVoiceMessage = async () => {
    if (!selectedConversation) return;
    
    const recording = await stopRecording();
    if (!recording) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMessage: Message = {
      id: `voice-${Date.now()}`,
      senderId: 'me',
      text: 'Voice message',
      timestamp: timeString,
      status: 'sending',
      statusTimestamp: timeString,
      isVoice: true,
      voiceData: {
        audioUrl: recording.audioUrl,
        duration: recording.duration
      }
    };

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, newMessage],
      lastMessage: '🎤 Voice message',
      lastMessageTime: 'Just now'
    };

    setSelectedConversation(updatedConversation);
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id ? updatedConversation : c
    ));
    setIsReceiptSyncing(true);

    // Simulate status progression with timestamps
    setTimeout(() => {
      const sentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === newMessage.id ? { ...m, status: 'sent' as const, statusTimestamp: sentTime } : m)
      } : prev);
    }, 500);

    setTimeout(() => {
      const deliveredTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === newMessage.id ? { ...m, status: 'delivered' as const, deliveredAt: deliveredTime, statusTimestamp: deliveredTime } : m)
      } : prev);
    }, 1500);

    setTimeout(() => {
      const readTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      setSelectedConversation(prev => prev ? {
        ...prev,
        messages: prev.messages.map(m => m.id === newMessage.id ? { ...m, status: 'read' as const, readAt: readTime, statusTimestamp: readTime } : m)
      } : prev);
      setIsReceiptSyncing(false);
    }, 2500);
  };

  const handleFileSelect = (files: FileList | null, type: 'image' | 'document') => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        console.warn(`File ${file.name} is too large`);
        return;
      }
      
      if (type === 'image' && !file.type.startsWith('image/')) {
        console.warn(`File ${file.name} is not an image`);
        return;
      }
      
      validFiles.push(file);
    });
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
  };

  const handleSendMedia = () => {
    if (!selectedConversation || selectedFiles.length === 0) return;

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newMessages: Message[] = selectedFiles.map((file, index) => {
      const isImage = file.type.startsWith('image/');
      const mediaAttachment: MediaAttachment = {
        id: `media-${Date.now()}-${index}`,
        type: isImage ? 'image' : 'document',
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        mimeType: file.type
      };

      return {
        id: `msg-media-${Date.now()}-${index}`,
        senderId: 'me',
        text: isImage ? '📷 Photo' : `📎 ${file.name}`,
        timestamp: timeString,
        status: 'sending' as const,
        statusTimestamp: timeString,
        isMedia: true,
        mediaData: mediaAttachment
      };
    });

    const updatedConversation = {
      ...selectedConversation,
      messages: [...selectedConversation.messages, ...newMessages],
      lastMessage: newMessages.length === 1 
        ? (selectedFiles[0].type.startsWith('image/') ? '📷 Photo' : `📎 ${selectedFiles[0].name}`)
        : `📎 ${newMessages.length} files`,
      lastMessageTime: 'Just now'
    };

    setSelectedConversation(updatedConversation);
    setConversations(prev => prev.map(c => 
      c.id === selectedConversation.id ? updatedConversation : c
    ));
    setSelectedFiles([]);
    setIsReceiptSyncing(true);

    // Simulate status progression for all messages with timestamps
    newMessages.forEach((msg, index) => {
      setTimeout(() => {
        const sentTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(m => m.id === msg.id ? { ...m, status: 'sent' as const, statusTimestamp: sentTime } : m)
        } : prev);
      }, 500);

      setTimeout(() => {
        const deliveredTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(m => m.id === msg.id ? { ...m, status: 'delivered' as const, deliveredAt: deliveredTime, statusTimestamp: deliveredTime } : m)
        } : prev);
      }, 1500);

      setTimeout(() => {
        const readTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: prev.messages.map(m => m.id === msg.id ? { ...m, status: 'read' as const, readAt: readTime, statusTimestamp: readTime } : m)
        } : prev);
        // Only stop syncing after last message is read
        if (index === newMessages.length - 1) {
          setIsReceiptSyncing(false);
        }
      }, 2500);
    });
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setSelectedFiles([]);
  };

  // Start a call
  const handleStartCall = (type: 'voice' | 'video') => {
    setCallType(type);
    setIsCallOpen(true);
  };

  // Get last message status for conversation list
  const getLastMessageStatus = (conv: Conversation) => {
    const lastMyMessage = [...conv.messages].reverse().find(m => m.senderId === 'me');
    return lastMyMessage?.status;
  };

  return (
    <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex rounded-xl border bg-background overflow-hidden shadow-sm">
      {/* Conversations List */}
      <div 
        className={cn(
          "flex flex-col transition-all duration-300 ease-out overflow-hidden",
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
              
              <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-primary hover:bg-primary/10">
                    <Plus className="h-6 w-6" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                  <DialogHeader className="p-6 bg-primary text-primary-foreground">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Start New Conversation
                    </DialogTitle>
                    <p className="text-primary-foreground/70 text-sm mt-1">Select an administrator to chat with</p>
                  </DialogHeader>
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {loadingAdmins ? (
                      <div className="p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                        <p className="text-sm text-muted-foreground mt-4">Searching for admins...</p>
                      </div>
                    ) : admins.length > 0 ? (
                      <div className="space-y-1">
                        {admins.map((admin) => (
                          <div
                            key={admin.id}
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted cursor-pointer transition-all group"
                            onClick={() => startConversationWithAdmin(admin)}
                          >
                            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                              <AvatarImage src={admin.logo_url} />
                              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {admin.full_name?.[0] || 'A'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-bold text-sm group-hover:text-primary transition-colors">{admin.full_name}</p>
                                {admin.is_online && (
                                  <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" title="Online" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 uppercase tracking-tighter">Support</Badge>
                                <span className="text-[10px] text-muted-foreground italic">Platform Admin</span>
                              </div>
                            </div>
                            <CornerDownRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-12 text-center text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">No administrators available right now.</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-card z-50">
                  <DropdownMenuItem onClick={() => setIsMessageSearchOpen(true)}>
                    <Search className="h-4 w-4 mr-2" />
                    Search messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filter conversations
                  </DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={filterType} onValueChange={(val) => setFilterType(val as typeof filterType)}>
                    <DropdownMenuRadioItem value="all">All conversations</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="unread">Unread only</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="recent">Recent</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Supplier type</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={supplierTypeFilter} onValueChange={setSupplierTypeFilter}>
                    <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="verified">Verified Supplier</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="manufacturer">Manufacturer</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="wholesaler">Wholesaler</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="exporter">Exporter</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Active filters indicator */}
          {(filterType !== 'all' || supplierTypeFilter !== 'all') && (
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {filterType !== 'all' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  {filterType === 'unread' ? 'Unread' : 'Recent'}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setFilterType('all')}
                  />
                </Badge>
              )}
              {supplierTypeFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  {supplierTypeFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => setSupplierTypeFilter('all')}
                  />
                </Badge>
              )}
            </div>
          )}
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
                      {conv.isOnline && (
                        <span className="w-2 h-2 rounded-full bg-success animate-pulse flex-shrink-0" title="Online" />
                      )}
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
                    {conv.unreadCount > 0 && selectedConversation?.id !== conv.id && (
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
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground px-6 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 opacity-20" />
              </div>
              <p className="text-sm font-medium text-foreground">No conversations found</p>
              <p className="text-xs mt-1 mb-4">Start a new chat with JummaBaba support for any assistance.</p>
              <Button 
                onClick={() => {
                  setIsNewChatOpen(true);
                  fetchAdmins();
                }}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat View */}
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-out min-w-0 overflow-hidden",
          selectedConversation 
            ? "w-full" 
            : "hidden md:flex md:flex-1"
        )}
      >
        {selectedConversation ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* WhatsApp-style Chat Header - Sticky */}
            <div className="bg-card border-b px-2 md:px-4 py-2 flex items-center gap-2 md:gap-3 flex-shrink-0 z-20">
              {/* Back Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0 rounded-full"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {/* Supplier DP */}
              <div className="relative flex-shrink-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedConversation.participantAvatar} />
                  <AvatarFallback>{selectedConversation.participantName[0]}</AvatarFallback>
                </Avatar>
                {selectedConversation.isOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-background" />
                )}
              </div>
              
              {/* Supplier Info */}
              <div className="flex-1 min-w-0" onClick={() => {}}>
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold truncate">{selectedConversation.participantName}</p>
                  {selectedConversation.isVerified && (
                    <Shield className="h-4 w-4 text-success flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {selectedConversation.isTyping ? (
                    <span className="text-success font-medium">typing...</span>
                  ) : selectedConversation.isOnline ? (
                    <span className="text-success font-medium">Online</span>
                  ) : (
                    <span>Offline</span>
                  )}
                  {selectedConversation.isVerified && (
                    <>
                      <span className="text-muted-foreground/50">•</span>
                      <span className="text-success">Verified</span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Action Icons */}
              <div className="flex items-center gap-0.5">
                {/* Call actions hidden for now */}
                
                {/* 3-dot Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 bg-card z-50">
                    <DropdownMenuItem onClick={() => setIsMessageSearchOpen(true)}>
                      <Search className="h-4 w-4 mr-2" />
                      Search messages
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filter conversations
                    </DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={filterType} onValueChange={(val) => setFilterType(val as typeof filterType)}>
                      <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="unread">Unread</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="recent">Recent</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Supplier type</DropdownMenuLabel>
                    <DropdownMenuRadioGroup value={supplierTypeFilter} onValueChange={setSupplierTypeFilter}>
                      <DropdownMenuRadioItem value="all">All types</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="verified">Verified</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="manufacturer">Manufacturer</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="wholesaler">Wholesaler</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="exporter">Exporter</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area with Vertical Scroll - No Horizontal */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 scroll-smooth min-h-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundColor: 'hsl(var(--muted) / 0.3)'
              }}
            >
              <div className="flex flex-col gap-2 max-w-3xl mx-auto w-full">
                {/* Date separator - Sticky */}
                <div className="flex justify-center mb-4 sticky top-0 z-10">
                  <span className="bg-muted/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground shadow-sm">
                    Today
                  </span>
                </div>

                {selectedConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    id={`message-${message.id}`}
                    className={cn(
                      "flex w-full mb-2",
                      message.senderId === 'me' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "flex flex-col gap-1 max-w-[85%] md:max-w-[70%]",
                      message.senderId === 'me' ? "items-end" : "items-start"
                    )}>
                      <div className="relative group">
                        {/* Message Actions Popup */}
                        {showActionsFor === message.id && (
                          <div className={cn(
                            "absolute bottom-full mb-2 z-10",
                            message.senderId === 'me' ? "right-0" : "left-0"
                          )}>
                            <MessageActions 
                              onReply={() => handleReply(message)}
                              onForward={() => {
                                setForwardMessage(message);
                                setShowActionsFor(null);
                              }}
                              onReact={() => {
                                setShowReactionsFor(message.id);
                                setShowActionsFor(null);
                              }}
                              isOwn={message.senderId === 'me'}
                            />
                          </div>
                        )}

                        {/* Quick Reactions Popup */}
                        {showReactionsFor === message.id && (
                          <div className={cn(
                            "absolute bottom-full mb-2 z-10",
                            message.senderId === 'me' ? "right-0" : "left-0"
                          )}>
                            <QuickReactions 
                              onSelect={(emoji) => handleAddReaction(message.id, emoji)}
                              isOwn={message.senderId === 'me'}
                            />
                          </div>
                        )}

                        <div
                          className={cn(
                            "rounded-2xl px-4 py-2.5 shadow-sm relative cursor-pointer transition-all",
                            message.senderId === 'me'
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-card text-foreground rounded-tl-none border border-border"
                          )}
                        onDoubleClick={() => setShowActionsFor(showActionsFor === message.id ? null : message.id)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setShowActionsFor(showActionsFor === message.id ? null : message.id);
                        }}
                      >
                        {/* Forwarded Label */}
                        {message.isForwarded && (
                          <div className={cn(
                            "flex items-center gap-1 text-[10px] mb-1",
                            message.senderId === 'me' ? "text-primary-foreground/60" : "text-muted-foreground"
                          )}>
                            <CornerUpRight className="h-3 w-3" />
                            Forwarded
                          </div>
                        )}

                        {/* Quoted Reply */}
                        {message.replyTo && (
                          <QuotedMessage 
                            replyTo={message.replyTo}
                            isOwn={message.senderId === 'me'}
                            onClick={() => scrollToMessage(message.replyTo!.id)}
                          />
                        )}

                        {message.isMedia && message.mediaData ? (
                          <MediaMessage 
                            media={message.mediaData}
                            isOwn={message.senderId === 'me'}
                          />
                        ) : message.isVoice && message.voiceData ? (
                          <VoiceMessage 
                            audioUrl={message.voiceData.audioUrl}
                            duration={message.voiceData.duration}
                            isOwn={message.senderId === 'me'}
                          />
                        ) : (
                          <p className="text-sm leading-relaxed break-words">{message.text}</p>
                        )}
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
                            <MessageStatus 
                              status={message.status} 
                              deliveredAt={message.deliveredAt}
                              readAt={message.readAt}
                            />
                          )}
                        </div>

                        {/* Hover action buttons */}
                        <div className={cn(
                          "absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                          message.senderId === 'me' ? "-left-20" : "-right-20"
                        )}>
                          <button
                            onClick={() => handleReply(message)}
                            className="w-7 h-7 rounded-full bg-card shadow-md flex items-center justify-center border hover:bg-muted transition-colors"
                            title="Reply"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setShowActionsFor(showActionsFor === message.id ? null : message.id)}
                            className="w-7 h-7 rounded-full bg-card shadow-md flex items-center justify-center text-sm border hover:bg-muted transition-colors"
                            title="More"
                          >
                            ⋮
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Message Reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <MessageReactions
                        reactions={message.reactions}
                        onReactionClick={(emoji) => handleAddReaction(message.id, emoji)}
                        isOwn={message.senderId === 'me'}
                      />
                    )}
                  </div>
                </div>
                ))}

                {/* Read Receipt Sync Indicator */}
                {isReceiptSyncing && <ReadReceiptSyncIndicator isSyncing={isReceiptSyncing} />}

                {/* Typing indicator */}
                {selectedConversation.isTyping && <TypingIndicator />}
                
                {/* Scroll anchor for auto-scroll */}
                <div ref={messagesEndRef} className="h-px flex-shrink-0" />
              </div>
            </div>

            {/* Voice Recording UI - Fixed at Bottom */}
            {isRecording ? (
              <div className="bg-card border-t px-2 md:px-4 py-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={cancelRecording}
                    className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex-1 flex items-center justify-center gap-3">
                    <span className="w-2.5 h-2.5 bg-destructive rounded-full animate-pulse" />
                    <span className="text-sm font-medium tabular-nums">{formatDuration(recordingDuration)}</span>
                    <span className="text-xs text-muted-foreground">Recording...</span>
                  </div>
                  
                  <Button 
                    size="icon"
                    onClick={handleSendVoiceMessage}
                    className="rounded-full h-10 w-10"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Microphone Permission Warning */}
                {permissionDenied && (
                  <div className="mx-2 md:mx-4 mb-2 p-2 bg-destructive/10 rounded-lg flex items-center gap-2 text-sm text-destructive">
                    <MicOff className="h-4 w-4 flex-shrink-0" />
                    <span>Microphone access denied. Enable it in browser settings.</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => {}}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* File Preview Bar */}
                <MediaPreviewBar 
                  files={selectedFiles}
                  onRemove={handleRemoveFile}
                  onClear={handleClearFiles}
                />

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-2 md:px-4 pt-2">
                    <ReplyPreview 
                      replyTo={replyingTo}
                      onClear={() => setReplyingTo(null)}
                      isOwn={replyingTo.senderId === "me"}
                    />
                  </div>
                )}

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, "document")}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, "image")}
                />

                {/* Message Input - Fixed at Bottom */}
                <div className="bg-card border-t px-2 md:px-4 py-2 flex-shrink-0">
                  <div className="flex items-center gap-1 md:gap-2">
                    <div className="hidden md:block">
                      <EmojiPicker 
                        onSelect={(emoji) => setMessageInput(prev => prev + emoji)}
                        trigger={
                          <Button variant="ghost" size="icon" className="rounded-full">
                            <Smile className="h-5 w-5 text-muted-foreground" />
                          </Button>
                        }
                        align="start"
                      />
                    </div>
                    
                    {/* Attachments hidden for now */}

                    <div className="flex-1 relative">
                      <Input
                        ref={inputRef}
                        placeholder="Type a message"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (selectedFiles.length > 0 ? handleSendMedia() : handleSendMessage())}
                        className="pr-10 bg-muted/50 border-0 rounded-full"
                      />
                      {/* Mobile image hidden */}
                    </div>

                    {(messageInput.trim() || selectedFiles.length > 0) && (
                      <Button 
                        onClick={selectedFiles.length > 0 ? handleSendMedia : handleSendMessage}
                        size="icon"
                        className="rounded-full flex-shrink-0 h-10 w-10"
                        disabled={isSending}
                      >
                        <Send className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-muted-foreground bg-muted/30 p-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <MessageSquare className="h-10 w-10 text-primary opacity-80" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Connect with Support</h3>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Welcome to JummaBaba Messaging. Start a conversation with our support team to get help with your account, listings, or orders.
            </p>
            <Button 
              size="lg"
              onClick={() => {
                setIsNewChatOpen(true);
                fetchAdmins();
              }}
              className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105"
            >
              <Plus className="h-5 w-5 mr-2" />
              Start New Conversation
            </Button>
            
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-lg w-full">
               <div className="text-center">
                 <div className="text-primary font-bold">24/7</div>
                 <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Support</div>
               </div>
               <div className="text-center">
                 <div className="text-primary font-bold">Safe</div>
                 <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Platform</div>
               </div>
               <div className="text-center">
                 <div className="text-primary font-bold">Direct</div>
                 <div className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Chat</div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Forward Dialog */}
      <ForwardDialog
        open={!!forwardMessage}
        onOpenChange={(open) => !open && setForwardMessage(null)}
        conversations={conversations.filter(c => c.id !== selectedConversation?.id)}
        messagePreview={forwardMessage?.isVoice ? "🎤 Voice message" : forwardMessage?.isMedia ? "📷 Photo" : forwardMessage?.text || ""}
        onForward={handleForwardMessage}
      />

      {/* Message Search Dialog */}
      <Dialog open={isMessageSearchOpen} onOpenChange={setIsMessageSearchOpen}>
        <DialogContent className="max-w-md mx-4 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Messages
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search across all conversations..."
              value={messageSearchQuery}
              onChange={(e) => handleMessageSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
            {messageSearchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => {
                  setMessageSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="flex-1 max-h-[50vh]">
            {searchResults.length > 0 ? (
              <div className="space-y-2 pr-4">
                {searchResults.map((result, idx) => (
                  <div
                    key={`${result.messageId}-${idx}`}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{result.conversationName}</span>
                      <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {result.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : messageSearchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No messages found</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Type to search messages</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      {selectedConversation && (
        <CallDialog
          isOpen={isCallOpen}
          onClose={() => setIsCallOpen(false)}
          callType={callType}
          participantName={selectedConversation.participantName}
          participantAvatar={selectedConversation.participantAvatar}
        />
      )}
    </div>
  );
}
