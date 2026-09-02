'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { CheckCircle2, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentSuccessPage({ params, searchParams }) {
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);

  const eventId = unwrappedParams?.id;
  const sessionId = unwrappedSearchParams?.session_id;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden text-center">
        <div className="bg-emerald-500/10 p-6 flex flex-col items-center justify-center border-b border-emerald-500/20">
          <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 animate-in zoom-in-50 duration-300">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="font-extrabold text-xl text-foreground">Payment Successful!</h2>
          <p className="text-xs text-muted-foreground mt-1">Your seat is reserved for this event.</p>
        </div>

        <CardContent className="p-6 space-y-4 text-xs">
          <div className="bg-muted/30 p-3.5 rounded-xl border border-border/60 space-y-1.5 text-left">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Event ID:</span>
              <span className="font-bold text-foreground">#{eventId}</span>
            </div>
            {sessionId && (
              <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
                <span>Session ID:</span>
                <span className="font-mono text-[10px] truncate max-w-[160px]" title={sessionId}>
                  {sessionId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
              <span>Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Registered & Paid
              </span>
            </div>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            A confirmation notification has been sent to your account dashboard. We look forward to seeing you at the event!
          </p>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-2">
          <Link href="/events" className="w-full">
            <Button className="w-full text-xs font-semibold gap-1.5 h-10 cursor-pointer">
              <Calendar className="h-4 w-4" />
              <span>Back to Events</span>
            </Button>
          </Link>
          <Link href="/dashboard" className="w-full">
            <Button variant="outline" className="w-full text-xs font-semibold gap-1.5 h-10 cursor-pointer">
              <span>Go to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
