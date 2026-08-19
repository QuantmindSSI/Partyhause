/**
 * Profile Page - Web Version
 * Shows user profile with stats, events, and PartyCrew integration
 * Ported from mobile app
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUserProfile } from '@/features/partycrew/hooks';
import { JoinCrewButton } from '@/features/partycrew/components';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageShell, useBackToDashboard } from '@/components/layout/PageShell';
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Link as LinkIcon,
  Calendar,
  Users,
  Trophy,
  CheckCircle2,
  Lock,
  ArrowLeftRight,
  Edit,
  LogOut,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { usePartyStore } from '@/store/usePartyStore';
import { useAuth } from '@/hooks/use-auth';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const storeUser = usePartyStore((s) => s.user);
  const { signOut } = useAuth();
  const handleBack = useBackToDashboard();
  // If no URL param, use the logged-in user's id from the store
  const profileId = id || storeUser?.id || undefined;
  const { profile, isLoading, refetch } = useUserProfile(profileId);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getUserId();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setCurrentPage('auth');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 space-y-6">
        <Users className="h-24 w-24 text-muted-foreground opacity-40" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Profile Not Found</h2>
          <p className="text-muted-foreground max-w-md">
            This user profile hasn't been set up yet.
          </p>
        </div>
        <Button onClick={handleBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id || storeUser?.id === profile.id;

  const handleWebsitePress = () => {
    if (profile.website_url) {
      window.open(profile.website_url, '_blank');
    }
  };

  const handleEditProfile = () => {
    setCurrentPage('settings');
  };

  return (
    <PageShell
      title={profile.display_name}
      subtitle={`@${profile.username}`}
      maxWidth="lg"
      onBack={handleBack}
    >
      {/* Cover Photo */}
      <div className="relative -mx-4 -mt-6">
        {profile.cover_photo_url ? (
          <img
            src={profile.cover_photo_url}
            alt={`${profile.display_name}'s cover photo`}
            className="w-full h-48 md:h-64 object-cover"
          />
        ) : (
          <div className="w-full h-48 md:h-64 bg-gradient-primary" />
        )}
      </div>

      {/* Profile Content */}
      <div className="pb-8">
        {/* Profile Header */}
        <div className="relative -mt-16 mb-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-card shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                <AvatarFallback className="bg-orange-100 text-orange-600 text-4xl font-bold">
                  {profile.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {profile.is_verified && (
                <div className="absolute bottom-2 right-2 bg-info rounded-full p-1.5">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isOwnProfile ? (
                <>
                  <Button onClick={handleEditProfile} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button onClick={handleLogout} variant="destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <JoinCrewButton
                  creatorId={profile.id}
                  variant="default"
                  onStatusChange={refetch}
                />
              )}
            </div>
          </div>
        </div>

        {/* Name and Bio */}
        <div className="space-y-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{profile.display_name}</h2>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          {profile.bio && (
            <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
          )}

          {/* Location and Website */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {profile.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{profile.location}</span>
              </div>
            )}
            {profile.website_url && (
              <button
                onClick={handleWebsitePress}
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="hover:underline">
                  {profile.website_url.replace(/^https?:\/\//, '')}
                </span>
              </button>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{profile.partycrew_count}</div>
              <div className="text-sm text-muted-foreground">PartyCrew</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{profile.crewing_count}</div>
              <div className="text-sm text-muted-foreground">Crewing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{profile.events_hosted}</div>
              <div className="text-sm text-muted-foreground">Events</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground">{profile.haus_score}</div>
              <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                <Trophy className="h-3 w-3" />
                Haus Score
              </div>
            </div>
          </div>
        </Card>

        {/* Mutual Banner */}
        {!isOwnProfile && profile.viewer_is_mutual && (
          <Card className="p-4 mb-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-center gap-2 text-green-800">
              <ArrowLeftRight className="h-5 w-5" />
              <span className="font-semibold">You're both in each other's PartyCrew</span>
            </div>
          </Card>
        )}

        {/* Private Account Notice */}
        {profile.is_private && !profile.viewer_is_following && !isOwnProfile && (
          <Card className="p-6 text-center space-y-3">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-foreground">This account is private</h3>
              <p className="text-muted-foreground">
                Join their PartyCrew to see their events and content
              </p>
            </div>
          </Card>
        )}

        {/* Events and Content */}
        <div className="space-y-4">
          <Separator />
          <h3 className="text-lg font-semibold text-foreground">Events & Activity</h3>
          <p className="text-muted-foreground">No activity to show yet.</p>
        </div>
      </div>
    </PageShell>
  );
}
