'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, Loader2, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

export default function ForgotPasswordPage() {
  const [statusMessage, setStatusMessage] = useState({ type: null, text: '' });
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setStatusMessage({ type: null, text: '' });

    try {
      // Simulate password reset email request feedback
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const successMsg = 'Password reset instructions have been sent to your email address.';
      setStatusMessage({
        type: 'success',
        text: successMsg,
      });
      setSubmitted(true);
      toast.success('Password reset link sent!', { autoClose: 2000 });
    } catch (error) {
      const errorMsg = 'Could not process password reset. Please verify your email address.';
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
      toast.error(errorMsg, { autoClose: 2000 });
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Login</span>
        </Link>

        {/* Brand Logo */}
        <Link
          href="/"
          className="text-4xl font-extrabold text-chart-5 font-(family-name:--font-press-start) tracking-tight"
        >
          AlumNet
        </Link>
      </header>

      {/* Main Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-chart-5 border border-border">
                <KeyRound className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                Reset Password
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Enter your registered PSTU email to receive password reset instructions.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Alert Feedback Message */}
              {statusMessage.text && (
                <div
                  className={`p-3.5 rounded-lg text-xs font-medium flex items-center gap-2.5 border transition-all ${
                    statusMessage.type === 'error'
                      ? 'bg-destructive/10 text-destructive border-destructive/20'
                      : 'bg-chart-5/10 text-chart-5 border-chart-5/20'
                  }`}
                >
                  {statusMessage.type === 'error' ? (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              {!submitted ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email Input Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Registered Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="alumni@pstu.ac.bd"
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        className="pl-9 h-11 text-sm bg-background border-input focus-visible:ring-ring"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending Link...
                      </span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center pt-2 space-y-4">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Check your inbox and spam folder for the password reset email. Follow the link inside to set a new password.
                  </p>
                  <Link href="/login">
                    <Button variant="outline" className="w-full h-10 text-xs font-semibold">
                      Return to Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2 text-center border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">
                Remembered your password?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-chart-5 hover:underline transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PSTU AlumNet. All rights reserved.</p>
      </footer>
    </div>
  );
}
