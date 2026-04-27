import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, X, Mail, Phone, MessageCircle, HelpCircle, ChevronRight, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';

const FAQ = [
  { q: 'How do I book a car?', a: 'Search for a car, pick dates, then click "Request to book" or "Book now".' },
  { q: 'How do I verify my identity?', a: 'Go to your dashboard and click "Verify Identity" to upload your documents.' },
  { q: 'How do I become a host?', a: 'Click "Become a Host" in the menu and follow the steps to list your car.' },
  { q: 'What is the cancellation policy?', a: 'Cancellations made 48+ hours before the trip start are fully refunded.' },
];

// Fixed anchor: bottom-right corner, always stable
const ANCHOR = 'fixed bottom-20 right-5 md:bottom-8 md:right-8 z-[9999]';
const PANEL_ANCHOR = 'fixed bottom-36 right-5 md:bottom-24 md:right-8 z-[9998]';

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'support'; text: string }[]>([
    { from: 'support', text: 'Hi! 👋 How can we help you today?' },
  ]);
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const navigate = useNavigate();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleClose = () => {
    setOpen(false);
  };

  const sendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    setChatMessages((prev) => [...prev, { from: 'user', text }]);
    setSending(true);
    // Simulate a support reply after a short delay
    await new Promise((r) => setTimeout(r, 1200));
    setChatMessages((prev) => [
      ...prev,
      {
        from: 'support',
        text: "Thanks for reaching out! Our team will reply within 1 hour. You can also email us at support@carsharing.uz.",
      },
    ]);
    setSending(false);
  };

  return (
    <>
      {/* ── Floating trigger button ─── independent fixed element ── */}
      <div className={ANCHOR}>
        <AnimatePresence mode="wait">
          {!open ? (
            <motion.button
              key="btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => setOpen(true)}
              aria-label="Open Support"
              className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40"
            >
              <Headphones className="h-6 w-6" />
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/25 pointer-events-none" />
            </motion.button>
          ) : (
            <motion.button
              key="close"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.93 }}
              onClick={handleClose}
              aria-label="Close Support"
              className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40"
            >
              <X className="h-6 w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Panel ─── separate fixed element, anchored above the button ── */}
      <div className={PANEL_ANCHOR} style={{ pointerEvents: open ? 'auto' : 'none' }}>
        <AnimatePresence>
          {open && (
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              style={{ transformOrigin: 'bottom right' }}
              className="w-[340px] max-h-[520px] rounded-2xl border bg-card shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="bg-primary px-5 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                    {chatMode
                      ? <MessageCircle className="h-5 w-5 text-white" />
                      : <Headphones className="h-5 w-5 text-white" />}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{chatMode ? 'Live Chat' : 'Support'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="text-white/80 text-xs">
                        {chatMode ? 'Typically replies in under 1 hr' : "We're here to help"}
                      </span>
                    </div>
                  </div>
                </div>
                {chatMode && (
                  <button
                    onClick={() => setChatMode(false)}
                    className="text-white/70 hover:text-white text-xs underline"
                  >
                    Back
                  </button>
                )}
              </div>

              {chatMode ? (
                /* ─── CHAT MODE ─── */
                <>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                            m.from === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {sending && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex gap-1 items-center">
                          <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t p-3 flex gap-2 shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message…"
                      className="flex-1 bg-muted rounded-xl px-3 py-2 text-sm outline-none border border-transparent focus:border-primary/30 transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || sending}
                      className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                  </div>
                </>
              ) : (
                /* ─── MENU MODE ─── */
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 space-y-2.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact us</p>

                    <button
                      onClick={() => setChatMode(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">Chat with support</p>
                        <p className="text-xs text-muted-foreground">Get answers fast</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <a
                      href="mailto:support@carsharing.uz"
                      className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Email support</p>
                        <p className="text-xs text-muted-foreground truncate">support@carsharing.uz</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </a>

                    <a
                      href="tel:+998712345678"
                      className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Call us</p>
                        <p className="text-xs text-muted-foreground">+998 71 234 56 78</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </a>

                    {isAuthenticated && (
                      <button
                        onClick={() => { navigate('/messages'); setOpen(false); }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors group"
                      >
                        <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium">My Messages</p>
                          <p className="text-xs text-muted-foreground">View booking chats</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>

                  {/* FAQ */}
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5" /> FAQ
                    </p>
                    {FAQ.map((item, i) => (
                      <div key={i} className="rounded-xl border overflow-hidden">
                        <button
                          onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                          className="w-full flex items-center justify-between p-3 text-left text-sm font-medium hover:bg-muted/40 transition-colors"
                        >
                          <span className="pr-2">{item.q}</span>
                          <ChevronRight
                            className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`}
                          />
                        </button>
                        {expandedFaq === i && (
                          <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t px-4 py-3">
                    <p className="text-xs text-center text-muted-foreground">
                      Typical reply time: <span className="font-medium text-foreground">under 1 hour</span>
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
