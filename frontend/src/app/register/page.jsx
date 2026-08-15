'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Camera,
  UserPlus,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: null, text: '' });
  const [imagePreview, setImagePreview] = useState(null);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      profileImage: null,
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('profileImage', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setValue('profileImage', null);
    setImagePreview(null);
  };

  const onSubmit = async (data) => {
    setStatusMessage({ type: null, text: '' });
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('password', data.password);

      if (data.profileImage) {
        formData.append('profileImage', data.profileImage);
      }

      const response = await api.post('/api/auth/register', formData);

      setStatusMessage({
        type: 'success',
        text: response.data.message,
      });
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch (error) {
      setStatusMessage({
        type: 'error',
        text:
          error.response?.data?.message ||
          'Registration failed. Please try again.',
      });
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

      {/* Main Register Form Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="border border-border shadow-sm bg-card">
            <CardHeader className="space-y-2 text-center pb-4">
              <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-chart-5 border border-border">
                <UserPlus className="h-6 w-6" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground tracking-tight">
                Create an Account
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Join the PSTU AlumNet community by creating your account
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

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Profile Image (Optional) Avatar Upload */}
                <div className="flex flex-col items-center justify-center pt-1 pb-1">
                  <div className="relative group">
                    <label
                      htmlFor="profileImage"
                      className="relative block h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border hover:border-chart-5 transition-colors cursor-pointer overflow-hidden shadow-xs group"
                    >
                      {imagePreview ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <Image
                          height={1080}
                          width={1080}
                          src={imagePreview}
                          alt="Profile Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground group-hover:text-chart-5 transition-colors">
                          <User className="h-9 w-9" />
                        </div>
                      )}

                      {/* Hover Camera Icon Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </label>

                    {/* Camera Badge Icon */}
                    <label
                      htmlFor="profileImage"
                      className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-chart-5 text-white flex items-center justify-center shadow-md cursor-pointer hover:scale-110 transition-transform"
                      title="Upload Profile Picture"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </label>

                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="mt-2 text-center">
                    {imagePreview ? (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1 text-xs text-destructive hover:underline font-medium"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove photo
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground font-medium">
                        Upload Profile Photo{' '}
                        <span className="text-[11px] text-muted-foreground/60">
                          (Optional)
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Name Input Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      {...register('name', {
                        required: 'Full Name is required',
                      })}
                      className="pl-9 h-11 text-sm bg-background border-input focus-visible:ring-ring"
                      disabled={isSubmitting}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-destructive mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email Input Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="alumni@pstu.ac.bd"
                      {...register('email', {
                        required: 'Email address is required',
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
                    <p className="text-xs text-destructive mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Input Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 4,
                          message: 'Password must be at least 4 characters',
                        },
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
                    <p className="text-xs text-destructive mt-1">
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm mt-2"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-3 pt-2 text-center border-t border-border mt-2">
              <p className="text-xs text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-chart-5 hover:underline transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} PSTU AlumNet. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
