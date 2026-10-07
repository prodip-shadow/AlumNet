'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: null, text: '' });
  const [twoFactorData, setTwoFactorData] = useState(null); // { required: boolean, userId: number, email: string }
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown

  const router = useRouter();
  const { fetchCurrentUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Countdown timer for 2FA OTP expiration
  useEffect(() => {
    let timer;
    if (twoFactorData && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [twoFactorData, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const onSubmit = async (data) => {
    setStatusMessage({ type: null, text: '' });

    try {
      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      // Handle Two-Factor Authentication requirement
      if (response.data?.requires2FA) {
        setTwoFactorData({
          required: true,
          userId: response.data.userId,
          email: response.data.email,
        });
        setTimeLeft(300);
        toast.info(response.data.message || 'Verification code sent to your email', { autoClose: 3000 });
        return;
      }

      const successMsg = response.data.message || 'Login successful! Welcome back.';
      setStatusMessage({
        type: 'success',
        text: successMsg,
      });
      toast.success(successMsg, { autoClose: 1500 });

      const currentUser = await fetchCurrentUser();

      setTimeout(() => {
        if (currentUser?.role?.toUpperCase() === 'USER') {
          router.push('/dashboard');
        } else {
          router.push('/');
        }
      }, 1000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed. Please try again.';
      setStatusMessage({
        type: 'error',
        text: errorMsg,
      });
      toast.error(errorMsg, { autoClose: 2000 });
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      toast.error('Please enter the full 6-digit verification code');
      return;
    }

    try {
      setVerifyingOtp(true);
      setStatusMessage({ type: null, text: '' });

      const res = await api.post('/api/auth/verify-2fa', {
        userId: twoFactorData.userId,
        code: otpCode.trim(),
      });

      if (res.data?.success) {
        toast.success('2FA Verification successful!', { autoClose: 1500 });
        const currentUser = await fetchCurrentUser();
        setTimeout(() => {
          if (currentUser?.role?.toUpperCase() === 'USER') {
            router.push('/dashboard');
          } else {
            router.push('/');
          }
        }, 1000);
      }
    } catch (error) {
      const errText = error.response?.data?.message || 'Invalid or expired 2FA code';
      setStatusMessage({ type: 'error', text: errText });
      toast.error(errText);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResend2FA = async () => {
    if (!twoFactorData?.userId) return;
    try {
      setResendingOtp(true);
      const res = await api.post('/api/auth/resend-2fa', {
        userId: twoFactorData.userId,
      });
      if (res.data?.success) {
        setTimeLeft(300);
        toast.success(res.data.message || 'A new code has been sent to your email.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setResendingOtp(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground flex flex-col justify-between selection:bg-primary/20 selection:text-primary">
      {/* Top Header Navigation */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Home</span>
        </Link>

        {/* Brand Logo */}
        <Link
          href="/"
          className="text-4xl font-extrabold text-chart-5 font-(family-name:--font-press-start) tracking-tight"
        >
          AlumNet
        </Link>
      </header>

      {/* Main Form Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {twoFactorData ? (
            /* 2FA Verification Card */
            <Card className="border border-border shadow-xl bg-card animate-in zoom-in-95 duration-200">
              <CardHeader className="space-y-2 text-center pb-6">
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20 ring-8 ring-primary/5">
                  <KeyRound className="h-7 w-7" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Enter the 6-digit security code sent to{' '}
                  <span className="font-semibold text-foreground">{twoFactorData.email}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
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

                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        6-Digit Security Code
                      </Label>
                      <span className={`text-xs font-mono font-bold ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>

                    <Input
                      id="otp"
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="h-12 text-center text-xl tracking-[0.5em] font-mono font-bold bg-background border-input focus-visible:ring-ring"
                      autoFocus
                      disabled={verifyingOtp}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={verifyingOtp || otpCode.length !== 6}
                    className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-2 cursor-pointer"
                  >
                    {verifyingOtp ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verifying Code...
                      </span>
                    ) : (
                      'Verify & Sign In'
                    )}
                  </Button>
                </form>

                <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={handleResend2FA}
                    disabled={resendingOtp || timeLeft > 240}
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resendingOtp ? 'animate-spin' : ''}`} />
                    <span>Resend Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTwoFactorData(null);
                      setOtpCode('');
                      setStatusMessage({ type: null, text: '' });
                    }}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Standard Login Card */
            <Card className="border border-border shadow-sm bg-card">
              <CardHeader className="space-y-2 text-center pb-6">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-chart-5 border border-border">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Enter your credentials to access your PSTU AlumNet account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
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

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email Input Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email or Student ID
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

                  {/* Password Input Field */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-chart-5 hover:underline transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...register('password', {
                          required: 'Password is required',
                        })}
                        className="pl-9 pr-10 h-11 text-sm bg-background border-input focus-visible:ring-ring"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
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
                        Signing in...
                      </span>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex flex-col space-y-3 pt-2 text-center border-t border-border mt-2">
                <p className="text-xs text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/register"
                    className="font-semibold text-chart-5 hover:underline transition-colors"
                  >
                    Register here
                  </Link>
                </p>
              </CardFooter>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PSTU AlumNet. All rights reserved.</p>
      </footer>
    </div>
  );
}