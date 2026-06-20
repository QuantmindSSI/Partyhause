/**
 * Explore Page - Web Version
 * Discover new creators and users to follow
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuggestedUsers } from '@/features/partycrew/hooks';
import { JoinCrewButton } from '@/features/partycrew/components';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';

export default function ExplorePage() {
  const navigate = useNavigate();
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const { users, isLoading, refetch } = useSuggestedUsers(50);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage('dashboard')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Discover Creators</h1>
                <p className="text-gray-600">Find amazing party hosts and creators to follow</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Empty State */}
        {users.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="text-6xl">🔍</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No suggestions available</h3>
              <p className="text-gray-600">
                Check back later for new creators to follow!
              </p>
            </div>
          </div>
        )}

        {/* User Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                {/* User Info */}
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="flex-shrink-0"
                  >
                    <Avatar className="h-16 w-16 border-2 border-gray-200 hover:border-primary transition-colors">
                      <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xl font-bold">
                        {user.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/profile/${user.id}`)}
                      className="block group"
                    >
                      <div className="flex items-center gap-1">
                        <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                          {user.display_name}
                        </h3>
                        {user.is_verified && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 truncate">@{user.username}</p>
                    </button>

                    {user.is_mutual && (
                      <Badge variant="secondary" className="mt-2">
                        Mutual
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <p className="text-sm text-gray-700 line-clamp-2">{user.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{user.events_hosted} events</span>
                  </div>
                  {user.account_type && (
                    <Badge variant="outline" className="text-xs">
                      {user.account_type}
                    </Badge>
                  )}
                </div>

                {/* Action Button */}
                <JoinCrewButton
                  creatorId={user.id}
                  variant="outline"
                  className="w-full"
                  onStatusChange={refetch}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* End Message */}
        {users.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>That's all for now! Check back later for more creators.</p>
          </div>
        )}
      </div>
    </div>
  );
}
