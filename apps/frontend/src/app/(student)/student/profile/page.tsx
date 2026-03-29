'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { User, Lock, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { PageHeader } from '@/components/shared/PageHeader';
import { SkeletonCard } from '@/components/shared/SkeletonCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal('')),
  department: z.string().optional(),
  year: z.coerce.number().min(1).max(6).optional(),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  permanentAddress: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function StudentProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
  });

  const profileData = userData ?? user;
  const studentProfile = profileData?.studentProfile;

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profileData?.name ?? '',
      phone: profileData?.phone ?? '',
      department: studentProfile?.department ?? '',
      year: studentProfile?.year ?? 1,
      parentName: studentProfile?.parentName ?? '',
      parentPhone: studentProfile?.parentPhone ?? '',
      parentEmail: studentProfile?.parentEmail ?? '',
      permanentAddress: studentProfile?.permanentAddress ?? '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const profileMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch('/auth/me', {
        name: data.name,
        phone: data.phone,
        studentProfile: {
          department: data.department,
          year: data.year,
          parentName: data.parentName,
          parentPhone: data.parentPhone,
          permanentAddress: data.permanentAddress,
        },
      }).then((r) => r.data.data),
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully');
      if (updatedUser) setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordForm) =>
      api.patch('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      }),
    onSuccess: () => {
      toast.success('Password changed successfully');
      resetPassword();
    },
    onError: () => {
      toast.error('Failed to change password. Check your current password.');
    },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    profileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    passwordMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" description="Manage your profile and account settings" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Profile"
        description="Manage your profile and account settings"
        action={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="gap-2">
              <User className="h-4 w-4" />
              Edit Profile
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info card */}
        <Card className="rounded-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
              {/* Avatar + basic info header */}
              <div className="flex items-center gap-4">
                <Avatar size="lg" className="h-16 w-16">
                  {profileData?.avatarUrl ? (
                    <AvatarImage src={profileData.avatarUrl} />
                  ) : null}
                  <AvatarFallback className="text-lg">
                    {getInitials(profileData?.name ?? 'S')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-display font-bold text-lg">{profileData?.name}</p>
                  <p className="text-sm text-muted-foreground">{profileData?.email}</p>
                  {studentProfile?.rollNumber && (
                    <p className="text-xs text-muted-foreground">
                      Roll No: {studentProfile.rollNumber}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    className="rounded-lg"
                    disabled={!isEditing}
                    {...registerProfile('name')}
                    aria-invalid={!!profileErrors.name}
                  />
                  {profileErrors.name && (
                    <p className="text-xs text-destructive">{profileErrors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    className="rounded-lg"
                    disabled={!isEditing}
                    {...registerProfile('phone')}
                    aria-invalid={!!profileErrors.phone}
                  />
                  {profileErrors.phone && (
                    <p className="text-xs text-destructive">{profileErrors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    className="rounded-lg"
                    disabled={!isEditing}
                    {...registerProfile('department')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min={1}
                    max={6}
                    className="rounded-lg"
                    disabled={!isEditing}
                    {...registerProfile('year')}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3">Parent / Guardian Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">Parent Name</Label>
                    <Input
                      id="parentName"
                      className="rounded-lg"
                      disabled={!isEditing}
                      {...registerProfile('parentName')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">Parent Phone</Label>
                    <Input
                      id="parentPhone"
                      className="rounded-lg"
                      disabled={!isEditing}
                      {...registerProfile('parentPhone')}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="parentEmail">Parent Email</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      className="rounded-lg"
                      disabled={!isEditing}
                      {...registerProfile('parentEmail')}
                      aria-invalid={!!profileErrors.parentEmail}
                    />
                    {profileErrors.parentEmail && (
                      <p className="text-xs text-destructive">{profileErrors.parentEmail.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      resetProfile();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={profileMutation.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {profileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Password change card */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  className="rounded-lg"
                  {...registerPassword('currentPassword')}
                  aria-invalid={!!passwordErrors.currentPassword}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  className="rounded-lg"
                  {...registerPassword('newPassword')}
                  aria-invalid={!!passwordErrors.newPassword}
                />
                {passwordErrors.newPassword && (
                  <p className="text-xs text-destructive">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  className="rounded-lg"
                  {...registerPassword('confirmPassword')}
                  aria-invalid={!!passwordErrors.confirmPassword}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={passwordMutation.isPending}
                className="w-full"
              >
                {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
