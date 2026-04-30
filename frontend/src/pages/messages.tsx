import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, ArrowLeft, Car, Star,
  MessageSquare, CheckCheck, Check, Calendar,
  MapPin, Users, Zap, ArrowRight, Shield,
  MoreVertical, Archive, ArchiveRestore, Trash2, Pencil, Paperclip, X, ImageIcon, Reply,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/shared/UserAvatar';
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkConversationRead,
  useArchiveConversation,
  useDeleteConversation,
  useEditMessage,
  useDeleteMessage,
  useSendImageMessage,
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
  onArchive,
  onDelete,
}: {
  conv: ConversationDto;
  isActive: boolean;
  onClick: () => void;
  index: number;
  onArchive: (conv: ConversationDto) => void;
  onDelete: (conv: ConversationDto) => void;
}) {
  const name = conv.otherParty?.firstName ?? 'User';
  const isAdmin = conv.otherParty?.isAdmin;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className={cn(
        'group relative w-full flex items-start hover:bg-muted/50 transition-colors border-b border-border/40',
        isActive && 'bg-primary/5 border-l-2 border-l-primary',
        isAdmin && 'bg-purple-50/50 dark:bg-purple-950/20',
      )}
    >
      <button className="flex items-start gap-3 flex-1 min-w-0 text-left px-4 py-3.5 pr-10" onClick={onClick}>
        <div className="relative shrink-0">
          <UserAvatar name={name} photoUrl={conv.otherParty?.profilePhotoUrl} size={48} />
          {isAdmin && (
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-purple-600 border-2 border-background flex items-center justify-center">
              <Shield className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={cn('text-sm truncate', conv.unreadCount > 0 ? 'font-bold' : 'font-semibold')}>
                {isAdmin ? 'Support Team' : name}
              </span>
              {isAdmin && (
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                  Admin
                </span>
              )}
              {conv.isArchived && (
                <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                  Archived
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
              {conv.lastMessage ? formatTime(conv.lastMessage.sentAt) : ''}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-0.5">
            {conv.carTitle ? (
              <>
                <Car className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{conv.carTitle}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Direct message</span>
            )}
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
      </button>

      {/* Context menu — visible on hover */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus:opacity-100 h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onArchive(conv); }}
            className="gap-2"
          >
            {conv.isArchived
              ? <><ArchiveRestore className="h-4 w-4" /> Unarchive</>
              : <><Archive className="h-4 w-4" /> Archive</>
            }
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(conv); }}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

// ─── MessageBubble ─────────────────────────────────────────────────────────────────────────────

function ReplyQuote({
  senderName, body, type, attachmentUrl, isMe, isAdminConversation,
}: {
  senderName: string; body: string | null; type: string | null;
  attachmentUrl: string | null; isMe: boolean; isAdminConversation?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-xl mb-1 text-xs max-w-full cursor-default',
      'border-l-2',
      isMe
        ? 'bg-primary/20 border-primary-foreground/40 text-primary-foreground/80'
        : isAdminConversation
          ? 'bg-purple-200/60 border-purple-400 text-purple-900 dark:bg-purple-800/30 dark:text-purple-200'
          : 'bg-muted/80 border-border text-muted-foreground',
    )}>
      {type === 'Image' && (attachmentUrl || !body) ? (
        <ImageIcon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      ) : null}
      <div className="min-w-0">
        <p className="font-semibold truncate leading-none mb-0.5">{senderName}</p>
        <p className="truncate leading-snug opacity-90">
          {type === 'Image' && !body ? 'Photo' : (body ?? 'This message was deleted')}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isMe,
  isFirst,
  isLast,
  otherPartyName,
  otherPartyPhotoUrl,
  bookingId,
  isHost,
  isAdminConversation,
  onEdit,
  onDelete,
  onReply,
}: {
  msg: MessageDto;
  isMe: boolean;
  isFirst: boolean;
  isLast: boolean;
  otherPartyName: string;
  otherPartyPhotoUrl?: string | null;
  bookingId: string;
  isHost: boolean;
  isAdminConversation?: boolean;
  onEdit: (msg: MessageDto) => void;
  onDelete: (msg: MessageDto) => void;
  onReply: (msg: MessageDto) => void;
}) {
  if (msg.type === 'BookingCard' && msg.bookingPreview) {
    return (
      <div className="w-full flex justify-center py-2">
        <BookingMessageCard preview={msg.bookingPreview} bookingId={bookingId} isHost={isHost} />
      </div>
    );
  }

  const canEdit = isMe && !msg.isDeleted && msg.type === 'Text';
  const canDelete = isMe && !msg.isDeleted && (msg.type === 'Text' || msg.type === 'Image');
  const canReply = !msg.isDeleted && msg.type !== 'BookingCard';

  return (
    <div className={cn('group flex gap-2', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe && (
        <div className="shrink-0 w-7 flex items-end">
          {isLast && <UserAvatar name={otherPartyName} photoUrl={otherPartyPhotoUrl} size={32} />}
        </div>
      )}

      <div className={cn('flex items-end gap-1 max-w-[78%]', isMe ? 'flex-row-reverse' : 'flex-row')}>
        {/* Action buttons row — appear on group hover */}
        <div className={cn(
          'flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mb-1',
          isMe ? 'flex-row-reverse' : 'flex-row',
        )}>
          {/* Reply button — for all non-deleted, non-BookingCard messages */}
          {canReply && (
            <button
              onClick={() => onReply(msg)}
              className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}

          {/* Context menu — edit/delete for own messages */}
          {(canEdit || canDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                  <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                {canEdit && (
                  <DropdownMenuItem onClick={() => onEdit(msg)} className="gap-2">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(msg)}
                    className="gap-2 text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className={cn('flex flex-col min-w-0', isMe && 'items-end')}>
          <div
            className={cn(
              'text-sm leading-relaxed',
              msg.isDeleted
                ? 'italic text-muted-foreground bg-muted/50 border border-dashed border-border px-4 py-2.5'
                : msg.type === 'Image'
                  ? cn('p-1.5 overflow-hidden',
                      isMe
                        ? 'bg-primary/10'
                        : isAdminConversation
                          ? 'bg-purple-100 dark:bg-purple-900/40'
                          : 'bg-muted')
                  : cn('px-4 py-2.5 whitespace-pre-wrap break-words',
                      isMe
                        ? 'bg-primary text-primary-foreground'
                        : isAdminConversation
                          ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100'
                          : 'bg-muted text-foreground'),
              isMe
                ? cn('rounded-l-2xl', isFirst ? 'rounded-tr-2xl' : 'rounded-tr-md', isLast ? 'rounded-br-sm' : 'rounded-br-md')
                : cn('rounded-r-2xl', isFirst ? 'rounded-tl-2xl' : 'rounded-tl-md', isLast ? 'rounded-bl-sm' : 'rounded-bl-md'),
            )}
          >
            {/* Reply quote */}
            {!msg.isDeleted && msg.replyToMessageId && (
              <ReplyQuote
                senderName={msg.replyToSenderName ?? 'User'}
                body={msg.replyToBody}
                type={msg.replyToType}
                attachmentUrl={msg.replyToAttachmentUrl}
                isMe={isMe}
                isAdminConversation={isAdminConversation}
              />
            )}

            {msg.isDeleted ? (
              'This message was deleted'
            ) : msg.type === 'Image' && msg.attachmentUrl ? (
              <img
                src={msg.attachmentUrl}
                alt="Shared image"
                className="block max-w-full max-h-72 rounded-xl object-contain cursor-pointer"
                onClick={() => window.open(msg.attachmentUrl!, '_blank', 'noopener,noreferrer')}
              />
            ) : (
              msg.body
            )}
          </div>

          {isLast && (
            <div className={cn(
              'flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5 px-1',
              isMe && 'flex-row-reverse',
            )}>
              <span>{formatMessageTime(msg.sentAt)}</span>
              {msg.editedAt && !msg.isDeleted && (
                <span className="text-muted-foreground/70">edited</span>
              )}
              {isMe && (msg.readAt
                ? <CheckCheck className="h-3 w-3 text-primary" />
                : <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MessagesPage ───────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();

  const [showArchived, setShowArchived] = useState(false);
  const { data: conversations, isLoading: convsLoading } = useConversations(showArchived);
  const archiveMutation = useArchiveConversation();
  const deleteMutation = useDeleteConversation();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(conversationId ?? null);

  const selectedConv = conversations?.find((c) => (c.bookingId ?? c.id) === selectedBookingId);
  const { data: messages, isLoading: msgsLoading } = useMessages(selectedBookingId ?? '');
  const sendMutation = useSendMessage(selectedBookingId ?? '');
  const editMutation = useEditMessage(selectedBookingId ?? '');
  const deleteMsgMutation = useDeleteMessage(selectedBookingId ?? '');
  const sendImageMutation = useSendImageMessage(selectedBookingId ?? '');
  const markReadMutation = useMarkConversationRead(selectedBookingId ?? '');

  const [draft, setDraft] = useState('');
  const [editingMsg, setEditingMsg] = useState<MessageDto | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<MessageDto | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lastConvIdRef = useRef<string | null>(null);
  const lastMsgCountRef = useRef(0);

  const isHost = user?.hostOnboardingStatus === 'Complete';

  function handleArchive(conv: ConversationDto) {
    archiveMutation.mutate({ id: conv.id, archive: !conv.isArchived });
  }

  function handleDelete(conv: ConversationDto) {
    const routeId = conv.bookingId ?? conv.id;
    deleteMutation.mutate(conv.id, {
      onSuccess: () => {
        if (selectedBookingId === routeId) {
          setSelectedBookingId(null);
          navigate('/messages', { replace: true });
        }
      },
    });
  }

  function handleEditMsg(msg: MessageDto) {
    setEditingMsg(msg);
    setEditDraft(msg.body ?? '');
    setTimeout(() => editTextareaRef.current?.focus(), 50);
  }

  function handleEditSubmit() {
    const body = editDraft.trim();
    if (!body || !editingMsg) return;
    editMutation.mutate({ messageId: editingMsg.id, body }, {
      onSuccess: () => { setEditingMsg(null); setEditDraft(''); },
    });
  }

  function handleDeleteMsg(msg: MessageDto) {
    deleteMsgMutation.mutate(msg.id);
  }

  function handleReplyMsg(msg: MessageDto) {
    setReplyingTo(msg);
    // Cancel editing if active
    setEditingMsg(null);
    setEditDraft('');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  }

  function clearImagePreview() {
    setImageFile(null);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
  }

  function handleImageSend() {
    if (!imageFile || !selectedBookingId) return;
    sendImageMutation.mutate(imageFile, {
      onSuccess: () => {
        clearImagePreview();
        textareaRef.current?.focus();
      },
    });
  }

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

  function openConversation(conv: ConversationDto) {
    // For support/direct conversations, use conv.id because there's no bookingId
    const routeId = conv.bookingId ?? conv.id;
    setSelectedBookingId(routeId);
    navigate(`/messages/${routeId}`, { replace: true });
  }

  const handleSend = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const body = draft.trim();
    if (!body || !selectedBookingId) return;
    sendMutation.mutate({ body, replyToMessageId: replyingTo?.id }, {
      onSuccess: () => {
        setDraft('');
        setReplyingTo(null);
        textareaRef.current?.focus();
      },
    });
  }, [draft, selectedBookingId, sendMutation, replyingTo]);

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
  const isAdminConv = selectedConv?.otherParty?.isAdmin ?? false;

  return (
    <div className="flex h-[calc(100dvh-64px)] overflow-hidden bg-background">

      {/* SIDEBAR */}
      <aside className={cn(
        'flex-shrink-0 w-full md:w-[320px] lg:w-[360px] border-r flex flex-col',
        selectedBookingId && 'hidden md:flex',
      )}>
        <div className="px-5 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-heading font-bold">Messages</h1>
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors',
                showArchived
                  ? 'bg-primary/10 text-primary border-primary/30'
                  : 'bg-muted text-muted-foreground border-border hover:text-foreground',
              )}
            >
              <Archive className="h-3 w-3" />
              {showArchived ? 'Active' : 'Archived'}
            </button>
          </div>
          {conversations && conversations.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {showArchived
                ? `${conversations.length} archived`
                : conversations.filter((c) => c.unreadCount > 0).length > 0
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
                  isActive={selectedBookingId === (conv.bookingId ?? conv.id)}
                  onClick={() => openConversation(conv)}
                  index={i}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
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

              <div className="relative shrink-0">
                <UserAvatar name={otherPartyName} photoUrl={selectedConv.otherParty?.profilePhotoUrl} size={40} />
                {isAdminConv && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-purple-600 border-2 border-background flex items-center justify-center">
                    <Shield className="h-2 w-2 text-white" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{isAdminConv ? 'Support Team' : otherPartyName}</p>
                  {isAdminConv && (
                    <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                      Admin
                    </span>
                  )}
                  {selectedConv.otherParty?.averageRatingAsHost != null &&
                    selectedConv.otherParty.averageRatingAsHost > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {selectedConv.otherParty.averageRatingAsHost.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  {selectedConv.carTitle ? (
                    <>
                      <Car className="h-3 w-3 shrink-0" />
                      <span className="truncate">{selectedConv.carTitle}</span>
                    </>
                  ) : (
                    <span>Direct message</span>
                  )}
                </div>
              </div>

              {selectedConv.bookingId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                onClick={() => navigate(isHost ? `/host/bookings/${selectedBookingId}` : `/bookings/${selectedBookingId}`)}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">View booking</span>
              </Button>
              )}
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
                                  isAdminConversation={isAdminConv}
                                  onEdit={handleEditMsg}
                                  onDelete={handleDeleteMsg}
                                  onReply={handleReplyMsg}
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

            {/* Composer / Edit bar */}
            <div className="border-t bg-background px-4 py-3 shrink-0">
              {editingMsg ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Pencil className="h-3 w-3" /> Editing message</span>
                    <button
                      onClick={() => { setEditingMsg(null); setEditDraft(''); }}
                      className="hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-end gap-2">
                    <Textarea
                      ref={editTextareaRef}
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); }
                        if (e.key === 'Escape') { setEditingMsg(null); setEditDraft(''); }
                      }}
                      rows={1}
                      className="flex-1 min-h-[40px] max-h-[144px] resize-none rounded-2xl py-2.5 px-4 text-sm leading-relaxed border-primary focus-visible:ring-1 focus-visible:ring-primary"
                    />
                    <Button
                      onClick={handleEditSubmit}
                      size="icon"
                      className="h-10 w-10 rounded-2xl shrink-0"
                      disabled={!editDraft.trim() || editMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Reply context bar */}
                  {replyingTo && (
                    <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-muted/70 border border-border/60 text-xs">
                      <Reply className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate leading-none mb-0.5">
                          {replyingTo.senderId === user?.id ? 'Yourself' : replyingTo.senderName}
                        </p>
                        <p className="text-muted-foreground truncate leading-snug">
                          {replyingTo.type === 'Image' ? 'Photo' : (replyingTo.body ?? '')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReplyingTo(null)}
                        className="shrink-0 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                      >
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  )}

                  {/* Image preview */}
                  {imagePreviewUrl && (
                    <div className="relative inline-block">
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-border shadow-sm">
                        <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={clearImagePreview}
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center shadow-md hover:bg-foreground/80 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); imageFile ? handleImageSend() : handleSend(); }} className="flex items-end gap-2">
                    {/* Hidden file input */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                    {/* Attach image button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 rounded-2xl shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={!!imageFile}
                      title="Attach image"
                    >
                      <Paperclip className="h-4.5 w-4.5" />
                    </Button>
                    {/* Text input — disabled while image is pending */}
                    {imageFile ? (
                      <div className="flex-1 min-h-[40px] rounded-2xl py-2.5 px-4 text-sm leading-relaxed border border-border/60 bg-muted/40 text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{imageFile.name}</span>
                      </div>
                    ) : (
                      <Textarea
                        ref={textareaRef}
                        placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="flex-1 min-h-[40px] max-h-[144px] resize-none rounded-2xl py-2.5 px-4 text-sm leading-relaxed border-border/60 focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    )}
                    <Button
                      type="submit"
                      size="icon"
                      className="h-10 w-10 rounded-2xl shrink-0"
                      disabled={
                        (!draft.trim() && !imageFile) ||
                        sendMutation.isPending ||
                        sendImageMutation.isPending
                      }
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              )}
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
