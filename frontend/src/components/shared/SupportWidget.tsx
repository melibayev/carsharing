import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Mail, Phone, HelpCircle, ChevronRight, Headphones } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useNavigate } from 'react-router-dom';

const FAQ = [
  { q: 'How do I book a car?', a: 'Search for a car, pick dates, then click "Request to book" or "Book now".' },
  { q: 'How do I verify my identity?', a: 'Go to your dashboard and click "Verify Identity" to upload your documents.' },
  { q: 'How do I become a host?', a: 'Click "Become a Host" in the menu and follow the steps to list your car.' },
  { q: 'What is the cancellation policy?', a: 'Cancellations made 48+ hours before the trip start are fully refunded.' },
];

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const navigate = useNavigate();

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-20 right-5 md:bottom-8 md:right-8 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpen(true)}
              className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/40"
            >
              <Headphones className="h-6 w-6" />
              {/* Pulse ring */}
              <span className="absolute inset-0 rounded-full animate-ping bg-primary/30" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Panel */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20, originX: 1, originY: 1 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="w-[340px] rounded-2xl border bg-card shadow-2xl shadow-black/20 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-primary px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Headphones className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">Support</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-2 w-2 rounded-full bg-green-400" />
                      <span className="text-white/80 text-xs">We're here to help</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[420px]">
                {/* Quick actions */}
                <div className="p-4 space-y-2.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact us</p>

                  <a
                    href="mailto:support@carsharing.uz"
                    className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors group"
                  >
                    <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
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
                    <div className="flex-1 min-w-0">
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
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium">Messages</p>
                        <p className="text-xs text-muted-foreground">View your booking chats</p>
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
                        {item.q}
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground shrink-0 ml-2 transition-transform ${expandedFaq === i ? 'rotate-90' : ''}`}
                        />
                      </button>
                      <AnimatePresence>
                        {expandedFaq === i && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="px-3 pb-3 text-xs text-muted-foreground leading-relaxed">{item.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-3">
                <p className="text-xs text-center text-muted-foreground">
                  Typical reply time: <span className="font-medium text-foreground">under 1 hour</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
