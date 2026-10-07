'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, KeyRound, ShieldCheck, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [statusMessage, setStatusMessage] = useState({ type: null, text: '' });
  const [resetRequested, setResetRequested] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState('');
  
  // OTP & New Password state
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resending, setResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 mins

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
    },
  });

  useEffect(() => {
    let timer;
    if (resetRequested && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resetRequested, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Step 1: Request 6-Digit OTP Code
  const handleRequestReset = async (data) => {
    setStatusMessage({ type: null, text: '' });

    try {
      const response = await api.post('/api/auth/forgot-password/request', {
        email: data.email,
      });

      if (response.data?.success) {
        setEmailSentTo(data.email);
        setResetRequested(true);
        setTimeLeft(300);
        const msg = response.data.message || 'A 6-digit verification code has been sent to your email.';
        setStatusMessage({ type: 'success', text: msg });
        toast.success(msg, { autoClose: 3000 });
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Could not process password reset. Please check your email.';
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
      toast.error(errorMsg, { autoClose: 2500 });
    }
  };

  // Step 2: Verify Code and Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: null, text: '' });

    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please enter and confirm your new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setResetting(true);
      const res = await api.post('/api/auth/forgot-password/reset', {
        email: emailSentTo,
        code: otpCode.trim(),
        newPassword,
        confirmPassword,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Password reset successfully!', { autoClose: 2000 });
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error) {
      const errText = error.response?.data?.message || 'Failed to reset password. Please try again.';
      setStatusMessage({ type: 'error', text: errText });
      toast.error(errText);
    } finally {
      setResetting(false);
    }
  };

  const handleResendCode = async () => {
    if (!emailSentTo) return;
    try {
      setResending(true);
      const res = await api.post('/api/auth/forgot-password/request', {
        email: emailSentTo,
      });
      if (res.data?.success) {
        setTimeLeft(300);
        toast.success('A new 6-digit code has been sent to your email.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
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
                {resetRequested ? 'Verify & Reset Password' : 'Forgot Password'}
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {resetRequested
                  ? `Enter the 6-digit code sent to ${emailSentTo} and your new password.`
                  : 'Enter your registered PSTU email to receive a 6-digit verification code.'}
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

              {!resetRequested ? (
                /* Step 1: Enter Email Form */
                <form onSubmit={handleSubmit(handleRequestReset)} className="space-y-4">
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

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending Verification Code...
                      </span>
                    ) : (
                      'Send Reset Code to Gmail'
                    )}
                  </Button>
                </form>
              ) : (
                /* Step 2: Enter Code & New Password Form */
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* 6-Digit Code */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        6-Digit Reset Code
                      </Label>
                      <span className={`text-xs font-mono font-bold ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="h-11 text-center text-lg tracking-[0.4em] font-mono font-bold bg-background border-input"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPass ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-9 pr-10 h-11 text-sm bg-background border-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPass ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-9 pr-10 h-11 text-sm bg-background border-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={resetting || otpCode.length !== 6}
                    className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
                  >
                    {resetting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating Password...
                      </span>
                    ) : (
                      'Set New Password & Sign In'
                    )}
                  </Button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resending || timeLeft > 240}
                      className="inline-flex items-center gap-1 text-primary hover:underline font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>Resend Reset Code</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResetRequested(false);
                        setOtpCode('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setStatusMessage({ type: null, text: '' });
                      }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Change Email
                    </button>
                  </div>
                </form>
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
