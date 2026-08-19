/**
 * Explore Page - Web Version
 * Discover new creators and users to follow
 */

import { useNavigate } from 'react-router-dom';
import { useSuggestedUsers } from '@/features/partycrew/hooks';
import { JoinCrewButton } from '@/features/partycrew/components';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { PageShell } from '@/components/layout/PageShell';
import { Loader2, CheckCircle2, Calendar, Search } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';

export default function ExplorePage() {
  const navigate = useNavigate();
  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);
  const { users, isLoading, refetch } = useSuggestedUsers(50);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageShell
      title="Discover Creators"
      subtitle="Find amazing party hosts and creators to follow"
      maxWidth="2xl"
      onBack={() => setCurrentPage('dashboard')}
      actions={
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          Refresh
        </Button>
      }
    >
      {/* Empty State */}
      {users.length === 0 && (
        <EmptyState
          icon={Search}
          title="No suggestions available"
          description="Check back later for new creators to follow!"
        />
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
                  aria-label={`View ${user.display_name}'s profile`}
                >
                  <Avatar className="h-16 w-16 border-2 border-border hover:border-primary transition-colors">
                    <AvatarImage src={user.avatar_url || undefined} alt={user.display_name} />
                    <AvatarFallback className="bg-orange-100 text-orange-600 text-xl font-bold">
                      {user.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/profile/${user.id}`)}
                    className="block group text-left"
                  >
                    <div className="flex items-center gap-1">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {user.display_name}
                      </h3>
                      {user.is_verified && (
                        <CheckCircle2 className="h-4 w-4 text-info flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
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
                <p className="text-sm text-foreground line-clamp-2">{user.bio}</p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
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
        <div className="text-center py-8 text-muted-foreground">
          <p>That's all for now! Check back later for more creators.</p>
        </div>
      )}
    </PageShell>
  );
}
