'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentCancelPage({ params }) {
  const unwrappedParams = use(params);
  const eventId = unwrappedParams?.id;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden text-center">
        <div className="bg-destructive/10 p-6 flex flex-col items-center justify-center border-b border-destructive/20">
          <div className="h-16 w-16 rounded-full bg-destructive/20 text-destructive flex items-center justify-center mb-3 animate-in zoom-in-50 duration-300">
            <XCircle className="h-10 w-10" />
          </div>
          <h2 className="font-extrabold text-xl text-foreground">Payment Cancelled</h2>
          <p className="text-xs text-muted-foreground mt-1">No charges were made to your account.</p>
        </div>

        <CardContent className="p-6 space-y-3 text-xs text-muted-foreground">
          <p className="leading-relaxed">
            You have cancelled the Stripe payment checkout for Event #{eventId}. You can try registering again whenever you're ready.
          </p>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex flex-col sm:flex-row gap-2">
          <Link href="/events" className="w-full">
            <Button className="w-full text-xs font-semibold gap-1.5 h-10 cursor-pointer">
              <RefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </Button>
          </Link>
          <Link href="/events" className="w-full">
            <Button variant="outline" className="w-full text-xs font-semibold gap-1.5 h-10 cursor-pointer">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to Events</span>
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
