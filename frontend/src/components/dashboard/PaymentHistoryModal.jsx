'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  X,
  Loader2,
  Calendar,
  CheckCircle,
  Clock,
  Ticket,
} from 'lucide-react';

export default function PaymentHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/payments/history');
        if (res.data?.success && Array.isArray(res.data.history)) {
          setHistory(res.data.history);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn('Error fetching payment history:', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <Card className="relative z-10 w-full max-w-xl max-h-[80vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm text-foreground">My Payment & Event Registrations</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p>Loading payment history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
              <Ticket className="h-8 w-8 mx-auto opacity-40 text-primary mb-1" />
              <p className="font-semibold text-foreground text-sm">No payment history found</p>
              <p>When you register for paid events, transactions will appear here.</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-xl border border-border bg-card space-y-2 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.eventTitle || item.title || 'Event Registration'}</h4>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(item.createdAt || item.eventDate).toLocaleDateString()}
                    </span>
                  </div>

                  <Badge
                    variant="secondary"
                    className={`text-[10px] font-bold ${
                      item.paymentStatus === 'PAID' || item.status === 'PAID' || item.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {item.paymentStatus || item.status || 'SUCCESS'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60 text-muted-foreground">
                  <span>Amount Paid: <strong>৳{item.amount || item.price || 0} BDT</strong></span>
                  {item.stripeSessionId && (
                    <span className="text-[10px] font-mono truncate max-w-[140px]" title={item.stripeSessionId}>
                      ID: {item.stripeSessionId.slice(-10)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/20 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
