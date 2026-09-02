'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, Ticket, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentHistorySection() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <Card className="border border-border bg-card rounded-2xl shadow-2xs space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">My Payment & Ticket History</h3>
            <p className="text-xs text-muted-foreground">Transactions and event registration receipts for your account.</p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading} className="h-8 text-xs gap-1 cursor-pointer">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p>Loading transaction history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border rounded-xl">
            <Ticket className="h-8 w-8 mx-auto opacity-40 text-primary mb-1" />
            <p className="font-semibold text-foreground text-sm">No payment history found</p>
            <p>When you register for paid events, your payment records will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, idx) => (
              <div
                key={item.id || item.registrationId || idx}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground truncate">{item.eventName || item.eventTitle || 'Event Ticket Registration'}</h4>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] font-bold ${
                        item.paymentStatus === 'PAID' || item.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                          : item.paymentStatus === 'FREE'
                          ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-700 border-amber-500/20'
                      }`}
                    >
                      {item.paymentStatus || item.status || 'SUCCESS'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      {new Date(item.registrationDate || item.eventDate || item.createdAt).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {item.stripeSessionId && (
                      <span className="font-mono text-[10px] text-muted-foreground/80 truncate max-w-[140px]" title={item.stripeSessionId}>
                        ID: {item.stripeSessionId.slice(-10)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0">
                  <span className="text-xs text-muted-foreground">Amount Paid</span>
                  <span className="font-extrabold text-sm text-foreground">
                    {Number(item.amount) > 0 ? `৳${item.amount} BDT` : 'Free Registration'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
