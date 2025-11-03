/**
 * Profile Page - Web Version
 * Shows user profile with stats, events, and PartyCrew integration
 * Ported from mobile app
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserProfile } from '@/features/partycrew/hooks';
import { JoinCrewButton } from '@/features/partycrew/components';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Edit
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, isLoading, refetch } = useUserProfile(id);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentUserId(session?.user?.id || null);
    };
    getUserId();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 space-y-6">
        <Users className="h-24 w-24 text-gray-300" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Profile Not Found</h2>
          <p className="text-gray-600 max-w-md">
            This user profile hasn't been created yet.
            {'\n'}
            If this is your profile, you need to create it in Supabase first.
          </p>
        </div>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
        <p className="text-sm text-gray-500">
          💡 Check scripts/create-user-profile.sql for instructions
        </p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  const handleWebsitePress = () => {
    if (profile.website_url) {
      window.open(profile.website_url, '_blank');
    }
  };

  const handleEditProfile = () => {
    navigate('/settings/profile');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{profile.display_name}</h1>
            <p className="text-sm text-gray-500">@{profile.username}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Cover Photo */}
        <div className="relative">
          {profile.cover_photo_url ? (
            <img
              src={profile.cover_photo_url}
              alt="Cover"
              className="w-full h-48 md:h-64 object-cover"
            />
          ) : (
            <div className="w-full h-48 md:h-64 bg-gradient-to-r from-purple-400 via-pink-400 to-red-400" />
          )}
        </div>

        {/* Profile Content */}
        <div className="px-4 pb-8">
          {/* Profile Header */}
          <div className="relative -mt-16 mb-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-4xl font-bold">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {profile.is_verified && (
                  <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-1.5">
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Button onClick={handleEditProfile} variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
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
              <h2 className="text-2xl font-bold text-gray-900">{profile.display_name}</h2>
              <p className="text-gray-600">@{profile.username}</p>
            </div>

            {profile.bio && (
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            )}

            {/* Location and Website */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                <div className="text-3xl font-bold text-gray-900">{profile.partycrew_count}</div>
                <div className="text-sm text-gray-600">PartyCrew</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{profile.crewing_count}</div>
                <div className="text-sm text-gray-600">Crewing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{profile.events_hosted}</div>
                <div className="text-sm text-gray-600">Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{profile.haus_score}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
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
              <Lock className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">This account is private</h3>
                <p className="text-gray-600">
                  Join their PartyCrew to see their events and content
                </p>
              </div>
            </Card>
          )}

          {/* Events and Content would go here */}
          <div className="space-y-4">
            <Separator />
            <h3 className="text-lg font-semibold text-gray-900">Events & Activity</h3>
            <p className="text-gray-600">
              Events and activity feed will appear here once implemented.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
