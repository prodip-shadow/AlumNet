'use client';

import React from 'react';
import { ShieldAlert, LogOut, Mail, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';

export default function DeactivatedScreen() {
  const { logoutUser, user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col items-center justify-center p-4 selection:bg-destructive/20">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <Card className="border border-destructive/30 shadow-2xl bg-card overflow-hidden">
          <div className="h-2 w-full bg-destructive" />
          
          <CardHeader className="text-center pt-8 pb-4 space-y-3">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
              <ShieldAlert className="h-8 w-8" />
            </div>
            
            <div>
              <Badge variant="destructive" className="mb-2 px-3 py-1 text-[11px] font-bold tracking-wider uppercase">
                Account Suspended
              </Badge>
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Account Deactivated
              </CardTitle>
            </div>

            <CardDescription className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Your account has been deactivated by the administrator.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 py-2 text-center text-xs text-muted-foreground">
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2 text-left">
              <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                <HelpCircle className="h-4 w-4 text-amber-500 shrink-0" />
                Why am I seeing this?
              </p>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                An administrator has temporarily or permanently restricted access for user account{' '}
                <span className="font-semibold text-foreground">{user?.email || 'associated with this profile'}</span>.
                You cannot view website feeds, directory, events, or dashboard until your account is re-activated.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 p-6 pt-2 border-t border-border">
            <Button
              onClick={logoutUser}
              variant="destructive"
              className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign Out from Account
            </Button>
            
            <p className="text-[11px] text-center text-muted-foreground pt-1">
              Need help? Contact system admin at{' '}
              <a href="mailto:admin@pstu.ac.bd" className="font-semibold text-primary hover:underline">
                admin@pstu.ac.bd
              </a>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
