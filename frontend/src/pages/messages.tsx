import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send, Car, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn, getInitials } from '@/lib/utils';
import { useConversations, useMessages, useSendMessage } from '@/hooks/use-messages';
import { useAuthStore } from '@/stores/auth-store';

export default function MessagesPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { data: conversations, isLoading: convsLoading } = useConversations();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [selectedId, setSelectedId] = useState<string | null>(conversationId ?? null);
  const { data: messages, isLoading: msgsLoading } = useMessages(selectedId ?? '');
  const sendMutation = useSendMessage(selectedId ?? '');
  const [newMessage, setNewMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const selectedConv = conversations?.find((c) => c.id === selectedId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedId) return;
    sendMutation.mutate({ body: newMessage.trim() }, {
      onSuccess: () => setNewMessage(''),
    });
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-heading font-bold mb-6">{t('nav.messages')}</h1>
      <div className="grid lg:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-16rem)]">
        {/* Conversation List */}
        <Card className={cn('overflow-hidden', selectedId && 'hidden lg:block')}>
          <ScrollArea className="h-full">
            {convsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div>
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b',
                      selectedId === conv.id && 'bg-muted',
                    )}
                    onClick={() => setSelectedId(conv.id)}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={conv.otherParty?.profilePhotoUrl ?? undefined} />
                      <AvatarFallback>{getInitials(conv.otherParty?.firstName ?? '?')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.otherParty?.firstName ?? 'User'}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="ml-2 h-5 min-w-[20px] flex items-center justify-center">{conv.unreadCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.carTitle}</p>
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage.body}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Car className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('search.noResults')}</p>
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className={cn('flex flex-col overflow-hidden', !selectedId && 'hidden lg:flex')}>
          {selectedId && selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSelectedId(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedConv.otherParty?.profilePhotoUrl ?? undefined} />
                  <AvatarFallback>{getInitials(selectedConv.otherParty?.firstName ?? '?')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{selectedConv.otherParty?.firstName}</p>
                  <p className="text-xs text-muted-foreground">{selectedConv.carTitle}</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {msgsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-2/3" />)}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      return (
                        <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                            'max-w-[75%] rounded-lg px-3 py-2',
                            isMe ? 'bg-primary text-primary-foreground' : 'bg-muted',
                          )}>
                            <p className="text-sm">{msg.body}</p>
                            <p className={cn('text-xs mt-1', isMe ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">{t('search.noResults')}</p>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSend} className="flex gap-2 p-4 border-t">
                <Input
                  placeholder="Xabar yozing..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || sendMutation.isPending}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Car className="h-12 w-12 mx-auto mb-2" />
                <p>{t('nav.messages')}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
