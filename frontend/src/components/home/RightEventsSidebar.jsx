'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, ArrowRight, Loader2, Sparkles } from 'lucide-react';

const RightEventsSidebar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopEvents = async () => {
      try {
        const res = await api.get('/api/events');
        if (res.data?.success && Array.isArray(res.data.events)) {
          // Take the top 3 latest/upcoming events
          setEvents(res.data.events.slice(0, 3));
        }
      } catch (err) {
        console.warn('Could not load sidebar events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopEvents();
  }, []);

  return (
    <aside className="hidden xl:block w-80 shrink-0 sticky top-22 self-start max-h-[calc(100vh-6.5rem)] overflow-y-auto space-y-3 pl-2 scrollbar-none">
      <Card className="border border-border bg-card p-4 rounded-2xl shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
              Upcoming Events
            </h3>
          </div>

          <Link
            href="/events"
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
            <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
            <Calendar className="h-6 w-6 mx-auto opacity-40 mb-1" />
            <p className="font-medium text-foreground">No upcoming events</p>
            <p className="text-[11px]">Check back later for PSTU reunions and seminars.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const eventDateObj = new Date(ev.eventDate);
              const month = eventDateObj.toLocaleDateString('en-US', { month: 'short' });
              const day = eventDateObj.getDate();

              return (
                <Link
                  key={ev.id}
                  href="/events"
                  className="block p-2.5 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    {/* Date Block */}
                    <div className="shrink-0 w-10 h-11 bg-primary/10 text-primary border border-primary/20 rounded-lg flex flex-col items-center justify-center text-center">
                      <span className="text-[9px] font-bold uppercase leading-none">{month}</span>
                      <span className="text-sm font-extrabold leading-none mt-0.5">{day}</span>
                    </div>

                    {/* Details */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {ev.title}
                      </h4>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>

                      <div className="flex items-center justify-between pt-0.5 text-[10px]">
                        <span className="text-muted-foreground">
                          {ev.isPaid ? `৳${ev.price}` : 'Free'}
                        </span>
                        <span className="text-primary font-medium group-hover:underline inline-flex items-center gap-1">
                          <span>View details</span>
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </aside>
  );
};

export default RightEventsSidebar;
