'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { api } from '@/lib/api/client';
import Link from 'next/link';

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: { email: string }) => {
    try {
      await api.post('/auth/forgot-password', data);
    } catch {
      // Don't reveal errors
    }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="rounded-[20px] shadow-lg">
          <CardContent className="pt-6">
            {sent ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-success" />
                </div>
                <h2 className="font-display text-xl font-bold">Check your email</h2>
                <p className="text-sm text-muted-foreground">If an account exists, we&apos;ve sent a reset link.</p>
                <Link href="/login">
                  <Button variant="outline" className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <h2 className="font-display text-xl font-bold">Reset password</h2>
                <p className="text-sm text-muted-foreground">Enter your email to receive a reset link.</p>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" className="rounded-lg" {...register('email')} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <Button type="submit" className="w-full rounded-lg" disabled={isSubmitting}>
                  Send reset link
                </Button>
                <Link href="/login" className="block text-center text-sm text-primary hover:underline">
                  Back to login
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
