import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, ArrowLeft, Car, Star,
  MessageSquare, CheckCheck, Check, Calendar,
  MapPin, Users, Zap, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
} from '@/hooks/use-messages';
import { useAuthStore } from '@/stores/auth-store';
import type { BookingPreviewDto, MessageDto, ConversationDto } from '@/types';

// ─── helpers ────────────────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateHeader(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatDateRange(start: string, end: string) {
  const s = new Date(start).toLocaleDateString([], { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  return `${s} – ${e}`;
}

const STATUS_STYLES: Record<string, string> = {
  Confirmed:       'text-green-700 bg-green-50 border-green-200',
  PendingApproval: 'text-amber-700 bg-amber-50 border-amber-200',
  Cancelled:       'text-red-700 bg-red-50 border-red-200',
  Rejected:        'text-red-700 bg-red-50 border-red-200',
  Completed:       'text-slate-600 bg-slate-50 border-slate-200',
};

const STATUS_LABELS: Record<string, string> = {
  Confirmed:       'Confirmed',
  PendingApproval: 'Pending',
  Cancelled:       'Cancelled',
  Rejected:        'Rejected',
  Completed:       'Completed',
};

function lastMessagePreview(msg: MessageDto | null): string {
  if (!msg) return 'No messages yet';
  if (msg.type === 'BookingCard') return 'Booking request · tap to view';
  return msg.body ?? '';
}

// ─── BookingMessageCard ──────────────────────────────────────────────────────────────────────

function BookingMessageCard({
  preview,
  bookingId,
  isHost,
}: {
  preview: BookingPreviewDto;
  bookingId: string;
  isHost: boolean;
}) {
  const navigate = useNavigate();
  const href = isHost ? `/host/bookings/${bookingId}` : `/bookings/${bookingId}`;

  return (
    <div className="mx-auto w-[min(340px,90vw)] rounded-2xl overflow-hidden border border-border bg-card shadow-sm">
      {preview.carPhotoUrl ? (
        <img
          src={preview.carPhotoUrl}
          alt={preview.carTitle}
          className="w-full aspect-[16/10] object-cover"
        />
      ) : (
        <div className="w-full aspect-[16/10] bg-muted flex items-center justify-center">
          <Car className="h-10 w-10 text-muted-foreground" />
        </div>
      )}

      <div className="p-4 space-y-3">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Booking</p>
        <p className="font-semibold text-sm leading-snug">{preview.carTitle}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" />
            {preview.city}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3 shrink-0" />
            {preview.seats} seats
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 shrink-0" />
            {preview.fuelType}
          </span>
        </div>

        <div className="border-t border-border/60" />

        <div className="flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <p className="text-foreground font-medium">
              {formatDateRange(preview.startUtc, preview.endUtc)}
            </p>
            <p className="text-muted-foreground">
              {preview.days} day{preview.days !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="font-bold text-sm text-foreground">${preview.totalUsd.toFixed(2)}</p>
            <span className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
              STATUS_STYLES[preview.status] ?? 'text-muted-foreground bg-muted border-border',
            )}>
              {STATUS_LABELS[preview.status] ?? preview.status}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full h-8 text-xs gap-1.5"
          onClick={() => navigate(href)}
        >
          View booking
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── ConversationItem ───────────────────────────────────────────────────────────────────────────

function ConversationItem({
  conv,
  isActive,
  onClick,
  index,
}: {
  conv: ConversationDto;
  isActive: boolean;
  onClick: () => void;
  index: number;
}) {
  const name = conv.otherParty?.firstName ?? 'User';

  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors text-left border-b border-border/40 relative',
        isActive && 'bg-primary/5 border-l-2 border-l-primary',
      )}
    >
      <UserAvatar name={name} photoUrl={conv.otherParty?.profilePhotoUrl} size={48} />

      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center justify-between gap-1">
          <span className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-bold' : 'font-semibold')}>
            {name}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
            {conv.lastMessage ? formatTime(conv.lastMessage.sentAt) : ''}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <Car className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">{conv.carTitle}</span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={cn(
            'text-xs truncate leading-tight',
            conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground',
          )}>
            {lastMessagePreview(conv.lastMessage)}
          </p>
          {conv.unreadCount > 0 && (
            <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ─── MessageBubble ─────────────────────────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  isFirst,
  isLast,
  otherPartyName,
  otherPartyPhotoUrl,
  bookingId,
  isHost,
}: {
  msg: MessageDto;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  otherPartyName: string;
  otherPartyPhotoUrl?: string | null;
  bookingId: string;
  isHost: boolean;
}) {
  if (msg.type === 'BookingCard' && msg.bookingPreview) {
    return (
      <div className="w-full flex justify-center py-2">
        <BookingMessageCard preview={msg.bookingPreview} bookingId={bookingId} isHost={isHost} />
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe && (
        <div className="shrink-0 w-7 flex items-end">
          {isLast && <UserAvatar name={otherPartyName} photoUrl={otherPartyPhotoUrl} size={32} />}
        </div>
      )}

      <div className={cn('flex flex-col max-w-[72%]', isMe && 'items-end')}>
        <div
          className={cn(
            'px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
            isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
            isMe
              ? cn('rounded-l-2xl', isFirst ? 'rounded-tr-2xl' : 'rounded-tr-md', isLast ? 'rounded-br-sm' : 'rounded-br-md')
              : cn('rounded-r-2xl', isFirst ? 'rounded-tl-2xl' : 'rounded-tl-md', isLast ? 'rounded-bl-sm' : 'rounded-bl-md'),
          )}
        >
          {msg.body}
        </div>

        {isLast && (
          <div className={cn(
            'flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 px-1',
            isMe && 'flex-row-reverse',
          )}>
            <span>{formatMessageTime(msg.sentAt)}</span>
            {isMe && (msg.readAt
              ? <CheckCheck className="h-3 w-3 text-primary" />
              : <Check className="h-3 w-3" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MessagesPage ───────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();

  const { data: conversations, isLoading: convsLoading } = useConversations();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(conversationId ?? null);

  const selectedConv = conversations?.find((c) => c.bookingId === selectedBookingId);
  const { data: messages, isLoading: msgsLoading } = useMessages(selectedBookingId ?? '');
  const sendMutation = useSendMessage(selectedBookingId ?? '');
  const markReadMutation = useMarkConversationRead(selectedBookingId ?? '');

  const [draft, setDraft] = useState('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastConvIdRef = useRef<string | null>(null);
  const lastMsgCountRef = useRef(0);

  const isHost = user?.hostOnboardingStatus === 'Complete';

  // Scroll to bottom: instant when switching conversation, smooth-ish when new message arrives
  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el || !messages) return;

    const convChanged = lastConvIdRef.current !== selectedBookingId;
    const prevCount = lastMsgCountRef.current;
    lastConvIdRef.current = selectedBookingId;
    lastMsgCountRef.current = messages.length;

    if (convChanged || prevCount === 0) {
      // New conversation selected or initial load — instant jump
      el.scrollTop = el.scrollHeight;
    } else if (messages.length > prevCount) {
      // New message arrived — only scroll if user is near the bottom
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom < 200) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages, selectedBookingId]);

  useEffect(() => {
    if (selectedBookingId && selectedConv && selectedConv.unreadCount > 0) {
      markReadMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookingId]);

  useEffect(() => {
    if (conversationId) setSelectedBookingId(conversationId);
  }, [conversationId]);

  function openConversation(bookingId: string) {
    setSelectedBookingId(bookingId);
    navigate(`/messages/${bookingId}`, { replace: true });
  }

  const handleSend = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || !selectedBookingId) return;
    sendMutation.mutate({ body }, {
      onSuccess: () => {
        setDraft('');
        textareaRef.current?.focus();
      },
    });
  }, [draft, selectedBookingId, sendMutation]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const groupedMessages: { dateLabel: string; messages: MessageDto[] }[] = [];
  if (messages) {
    const groups = new Map<string, MessageDto[]>();
    for (const msg of messages) {
      const key = new Date(msg.sentAt).toDateString();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(msg);
    }
    for (const [, msgs] of groups) {
      groupedMessages.push({ dateLabel: formatDateHeader(msgs[0]!.sentAt), messages: msgs });
    }
  }

  const otherPartyName = selectedConv?.otherParty?.firstName ?? 'User';

  return (
    <div className="flex h-[calc(100dvh-64px)] overflow-hidden bg-background">

      {/* SIDEBAR */}
      <aside className={cn(
        'flex-shrink-0 w-full md:w-[320px] lg:w-[360px] border-r flex flex-col',
        selectedBookingId && 'hidden md:flex',
      )}>
        <div className="px-5 py-4 border-b shrink-0">
          <h1 className="text-xl font-heading font-bold">Messages</h1>
          {conversations && conversations.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {conversations.filter((c) => c.unreadCount > 0).length > 0
                ? `${conversations.filter((c) => c.unreadCount > 0).length} unread`
                : `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {convsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations && conversations.length > 0 ? (
            <div>
              {conversations.map((conv, i) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={selectedBookingId === conv.bookingId}
                  onClick={() => openConversation(conv.bookingId)}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-semibold">No conversations yet</p>
              <p className="text-sm text-muted-foreground mt-1">Book a car to start chatting with a host</p>
              <Button className="mt-4" size="sm" onClick={() => navigate('/search')}>Browse cars</Button>
            </div>
          )}
        </div>
      </aside>

      {/* CHAT PANE */}
      <main className={cn('flex-1 flex flex-col min-w-0', !selectedBookingId && 'hidden md:flex')}>
        {selectedBookingId && selectedConv ? (
          <>
            {/* Thread header */}
            <div className="border-b bg-background/95 backdrop-blur-sm px-4 py-3 flex items-center gap-3 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden shrink-0"
                onClick={() => { setSelectedBookingId(null); navigate('/messages', { replace: true }); }}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <UserAvatar name={otherPartyName} photoUrl={selectedConv.otherParty?.profilePhotoUrl} size={40} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{otherPartyName}</p>
                  {selectedConv.otherParty?.averageRatingAsHost != null &&
                    selectedConv.otherParty.averageRatingAsHost > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {selectedConv.otherParty.averageRatingAsHost.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <Car className="h-3 w-3 shrink-0" />
                  <span className="truncate">{selectedConv.carTitle}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                onClick={() => navigate(isHost ? `/host/bookings/${selectedBookingId}` : `/bookings/${selectedBookingId}`)}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View booking</span>
              </Button>
            </div>

            {/* Messages area */}
            <div ref={scrollAreaRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {msgsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={cn('flex', i % 3 === 0 ? 'justify-end' : 'justify-start')}>
                      <Skeleton className={cn('h-10 rounded-2xl', i % 3 === 0 ? 'w-40' : 'w-56')} />
                    </div>
                  ))}
                </div>
              ) : groupedMessages.length > 0 ? (
                <>
                  {groupedMessages.map(({ dateLabel, messages: msgs }) => (
                    <div key={dateLabel}>
                      <div className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[11px] text-muted-foreground font-medium px-2 bg-background">{dateLabel}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      <div className="space-y-1.5">
                        {msgs.map((msg, idx) => {
                          const isMe = msg.senderId === user?.id;
                          const prev = idx > 0 ? msgs[idx - 1] : null;
                          const next = idx < msgs.length - 1 ? msgs[idx + 1] : null;
                          const isFirst = !prev || prev.senderId !== msg.senderId;
                          const isLast = !next || next.senderId !== msg.senderId;
                          return (
                            <AnimatePresence key={msg.id} mode="popLayout">
                              <motion.div
                                layout
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                              >
                                <MessageBubble
                                  msg={msg}
                                  isMe={isMe}
                                  isFirst={isFirst}
                                  isLast={isLast}
                                  otherPartyName={otherPartyName}
                                  otherPartyPhotoUrl={selectedConv.otherParty?.profilePhotoUrl}
                                  bookingId={selectedBookingId}
                                  isHost={isHost}
                                />
                              </motion.div>
                            </AnimatePresence>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-sm">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Say hi to get the conversation started!</p>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t bg-background px-4 py-3 shrink-0">
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  className="flex-1 min-h-[40px] max-h-[144px] resize-none rounded-2xl py-2.5 px-4 text-sm leading-relaxed border-border/60 focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 rounded-2xl shrink-0"
                  disabled={!draft.trim() || sendMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Messages are end-to-end encrypted — only you and {selectedConv.otherParty?.firstName ?? 'the other party'} can read them
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="space-y-4"
            >
              <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Your messages</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Select a conversation to continue chatting, or book a car to start a new one.
                </p>
              </div>
              <Button onClick={() => navigate('/search')}>
                <Car className="h-4 w-4 mr-2" />
                Browse cars
              </Button>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
