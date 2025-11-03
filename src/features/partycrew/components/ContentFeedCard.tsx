/**
 * ContentFeedCard Component - Web Version
 * Unified card for displaying all PartyCrew content types
 * Ported from mobile app
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar,
  Camera,
  Video,
  BarChart3,
  Lightbulb,
  Sparkles,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { FeedPost } from '../types';
import { cn } from '@/lib/utils';

interface ContentFeedCardProps {
  post: FeedPost;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onCreatorPress?: () => void;
}

export function ContentFeedCard({
  post,
  onLike,
  onComment,
  onShare,
  onCreatorPress,
}: ContentFeedCardProps) {
  const navigate = useNavigate();

  const getContentTypeConfig = () => {
    const configs = {
      event_announcement: { icon: Calendar, label: 'Event Announcement', color: 'text-purple-600' },
      photo: { icon: Camera, label: 'Photo', color: 'text-blue-600' },
      video: { icon: Video, label: 'Video', color: 'text-red-600' },
      poll: { icon: BarChart3, label: 'Poll', color: 'text-green-600' },
      tip: { icon: Lightbulb, label: 'Party Tip', color: 'text-amber-600' },
      recap: { icon: Sparkles, label: 'Event Recap', color: 'text-pink-600' },
      update: { icon: FileText, label: 'Update', color: 'text-gray-600' },
    };
    return configs[post.content_type] || configs.update;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleCreatorPress = () => {
    if (onCreatorPress) {
      onCreatorPress();
    } else {
      navigate(`/profile/${post.creator.id}`);
    }
  };

  const handleEventPress = () => {
    if (post.event_id) {
      navigate(`/events/${post.event_id}`);
    }
  };

  const contentTypeConfig = getContentTypeConfig();
  const ContentIcon = contentTypeConfig.icon;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <button onClick={handleCreatorPress} className="flex-shrink-0 group">
            <Avatar className="h-12 w-12 border-2 border-gray-200 group-hover:border-primary transition-colors">
              <AvatarImage src={post.creator.avatar_url || undefined} alt={post.creator.display_name} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold">
                {post.creator.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </button>

          <div className="flex-1 min-w-0">
            <button 
              onClick={handleCreatorPress}
              className="flex items-center gap-1 group"
            >
              <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                {post.creator.display_name}
              </span>
              {post.creator.is_verified && (
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
              )}
            </button>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Badge variant="secondary" className="gap-1">
                <ContentIcon className={cn("h-3 w-3", contentTypeConfig.color)} />
                {contentTypeConfig.label}
              </Badge>
              <span>•</span>
              <span>{formatTimeAgo(post.published_at)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {post.title && (
            <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
          )}
          {post.body && (
            <p className="text-gray-700 whitespace-pre-wrap">{post.body}</p>
          )}
        </div>

        {/* Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {post.media_urls.slice(0, 4).map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Media ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Event Link */}
        {post.event_id && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEventPress}
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Event
          </Button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={onLike}
            className={cn(
              "flex-1",
              post.viewer_has_liked && "text-red-500 hover:text-red-600"
            )}
          >
            <Heart className={cn(
              "h-4 w-4 mr-2",
              post.viewer_has_liked && "fill-current"
            )} />
            {post.likes_count || 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onComment}
            className={cn(
              "flex-1",
              post.viewer_has_commented && "text-blue-500"
            )}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            {post.comments_count || 0}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            {post.shares_count || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
