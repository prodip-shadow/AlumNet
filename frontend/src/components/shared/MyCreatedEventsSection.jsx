'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Users,
  CreditCard,
  Loader2,
  RefreshCw,
  Clock,
  MapPin,
  ExternalLink,
  Eye,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function MyCreatedEventsSection({ isAdmin = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // Admin views all events, regular creators view /api/events/my
      const endpoint = isAdmin ? '/api/events' : '/api/events/my';
      const res = await api.get(endpoint);

      if (res.data?.success && Array.isArray(res.data.events)) {
        setEvents(res.data.events);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.warn('Error loading hosted events:', err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <Card className="border border-border bg-card rounded-2xl shadow-2xs space-y-4 p-5">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground tracking-tight">
              {isAdmin ? 'All Platform Events & Financials' : 'Hosted Events & Registrations'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? 'Overview of all events created across AlumNet, attendee counts, and ticket sales.'
                : 'Manage your created events, track ticket sales, and view registered attendee profiles.'}
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading} className="h-8 text-xs gap-1 cursor-pointer">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2 border border-dashed border-border rounded-xl">
            <Calendar className="h-8 w-8 mx-auto opacity-40 text-primary mb-1" />
            <p className="font-semibold text-foreground text-sm">No events found</p>
            <p>{isAdmin ? 'No events published on the platform yet.' : 'When you create events, they will appear here.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((ev) => {
              const totalCollected = parseFloat(ev.totalCollectedAmount) || 0;
              const regCount = Number(ev.currentRegistrationCount || ev.registrationCount || ev.attendeeCount || 0);

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-1">{ev.title}</h4>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          !ev.isFree
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {!ev.isFree ? `৳${ev.registrationFee || ev.price} BDT` : 'Free Event'}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{new Date(ev.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial & Attendees Summary Bar */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-muted/30 rounded-lg border border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total Registered</span>
                      <span className="font-extrabold text-foreground flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        {regCount} attendees
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Total Revenue</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        ৳{totalCollected} BDT
                      </span>
                    </div>
                  </div>

                  {/* Dedicated Details / Analytics Button */}
                  <Link href={`/events/${ev.id}/analytics`} className="w-full">
                    <Button
                      size="sm"
                      className="w-full text-xs font-semibold gap-1.5 h-8.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Event Details & Financial Receipts</span>
                      <ExternalLink className="h-3 w-3 text-primary-foreground/80" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
