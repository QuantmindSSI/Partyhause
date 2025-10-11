import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';
import { uploadImage, validateImageFile } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, MapPin, Music, Sparkles } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';


export const EventCreation = () => {
  const { setCurrentPage, setEvents, events, user } = usePartyStore();
  const [formData, setFormData] = useState({
    name: '',
    event_type: 'single_day' as 'single_day' | 'multi_day',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    spotify_playlist_url: ''
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showLocationTip, setShowLocationTip] = useState(false);
  const [showPlaylistTip, setShowPlaylistTip] = useState(false);
  const [step, setStep] = useState<'form' | 'invite' | 'curate'>('form');
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [inviteFile, setInviteFile] = useState<File | null>(null);
  const [invitePreview, setInvitePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Effect to auto-set end_date when switching from multi_day to single_day
  useEffect(() => {
    if (formData.event_type === 'single_day' && formData.start_date && !formData.end_date) {
      setFormData(prev => ({ ...prev, end_date: prev.start_date }));
    }
  }, [formData.event_type, formData.start_date]);

  // Validate date range for multi-day events
  useEffect(() => {
    if (formData.event_type === 'multi_day' && formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      
      if (endDate < startDate) {
        setError('End date cannot be before start date');
      } else if (error === 'End date cannot be before start date') {
        setError(null);
      }
    }
  }, [formData.start_date, formData.end_date, formData.event_type, error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('You must be logged in to create an event.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Calculate start and end dates
    const startDateTime = `${formData.start_date}T${formData.start_time}:00Z`;
    const endDateTime = formData.event_type === 'multi_day' 
      ? `${formData.end_date}T${formData.end_time}:00Z`
      : `${formData.start_date}T${formData.end_time}:00Z`;

    const newEvent = {
      host_id: user.id,
      name: formData.name,
      event_type: formData.event_type,
      start_date: startDateTime,
      end_date: endDateTime,
      location: formData.location,
      spotify_playlist_url: formData.spotify_playlist_url,
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const created = await eventService.createEvent(newEvent);
      if (created) {
        const freshEvents = await eventService.getUserEvents(user.id);
        setEvents(freshEvents);
        setCreatedEvent(created);
        setStep('invite');
      } else {
        setError('Failed to create event. Please try again.');
      }
    } catch (err) {
      // Event creation error
      setError('An error occurred while creating the event. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Invite upload/creation handlers
  const handleInviteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setInviteFile(file);
    setError(null); // Clear any previous errors
    
    if (file) {
      // Validate file immediately
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setInviteFile(null);
        setInvitePreview(null);
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (ev) => setInvitePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setInvitePreview(null);
    }
  };

  const uploadInviteImage = async (file: File, eventId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${eventId}_invite.${fileExt}`;
      
      const result = await uploadImage(file, fileName, {
        bucket: 'event-invites',
        folder: user!.id, // Organize by user ID for security
        maxSizeBytes: 5 * 1024 * 1024, // 5MB
        quality: 0.9
      });
      
      if (!result.success) {
        setError(result.error || 'Failed to upload image');
        return null;
      }
      
      return result.url || null;
    } catch (error) {
      console.error('Error uploading invite image:', error);
      setError('An error occurred while uploading the image.');
      return null;
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    if (inviteFile && createdEvent) {
      try {
        // Upload the invite image
        const imageUrl = await uploadInviteImage(inviteFile, createdEvent.id);
        
        if (imageUrl) {
          // Update the event with the invite image URL
          const { supabase } = await import('@/lib/supabase');
          const { error } = await supabase
            .from('events')
            .update({ 
              invite_image_url: imageUrl,
              updated_at: new Date().toISOString()
            })
            .eq('id', createdEvent.id);

          if (error) {
            console.error('Error updating event with invite image:', error);
            setError('Failed to save invite image. Please try again.');
            setIsSubmitting(false);
            return;
          }

          // Update the created event object
          setCreatedEvent({ ...createdEvent, invite_image_url: imageUrl });
          
          // Update the events in the store
          const freshEvents = await eventService.getUserEvents(user!.id);
          setEvents(freshEvents);
          
          console.log('Event updated with invite image successfully');
        } else {
          // Error message already set in uploadInviteImage
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error handling invite upload:', error);
        setError('An unexpected error occurred. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }
    
    setIsSubmitting(false);
    setStep('curate');
  };

  // Step rendering
  if (step === 'invite') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload Your Event Invite
            </CardTitle>
            <CardDescription>
              Add a custom invite image to make your event emails more personal and engaging.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              {/* Error Display */}
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-destructive text-sm">{error}</p>
                </div>
              )}
              
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="invite-file">Choose Invite Image</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input 
                    id="invite-file"
                    type="file" 
                    accept="image/jpeg,image/png,image/webp,image/gif" 
                    onChange={handleInviteFileChange}
                    className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Supports JPEG, PNG, WebP, and GIF files up to 5MB
                  </p>
                </div>
              </div>
              
              {/* Preview */}
              {invitePreview && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={invitePreview} 
                      alt="Invite Preview" 
                      className="w-full h-48 object-cover"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This image will be displayed at the top of your invitation emails
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setStep('curate')}
                  disabled={isSubmitting}
                >
                  Skip for Now
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'curate') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Curate Your Event Experience</CardTitle>
            <CardDescription>
              Add agenda, music, guest list, and more to make your event special!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCurrentPage('dashboard')}>Finish & Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: event creation form
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 mb-4"
            >
              Create New Event
            </motion.h1>
            <p className="text-gray-600">
              Plan your perfect party and invite your guests
            </p>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="modern-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-orange-500" />
                  Event Details
                </CardTitle>
                <CardDescription>
                  Fill in the information for your event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g., John's Birthday Party"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Event Type */}
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="event_type"
                          value="single_day"
                          checked={formData.event_type === 'single_day'}
                          onChange={(e) => handleInputChange('event_type', e.target.value)}
                          disabled={isSubmitting}
                          className="text-primary"
                        />
                        <span className="text-sm">Single Day Event</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="event_type"
                          value="multi_day"
                          checked={formData.event_type === 'multi_day'}
                          onChange={(e) => handleInputChange('event_type', e.target.value)}
                          disabled={isSubmitting}
                          className="text-primary"
                        />
                        <span className="text-sm">Multi-Day Event</span>
                      </label>
                    </div>
                  </div>

                  {/* Start Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_date">Start Date *</Label>
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="start_time">Start Time *</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => handleInputChange('start_time', e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* End Date and Time - Show based on event type */}
                  {formData.event_type === 'multi_day' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="end_date">End Date *</Label>
                        <Input
                          id="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={(e) => handleInputChange('end_date', e.target.value)}
                          min={formData.start_date} // Ensure end date is not before start date
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end_time">End Time *</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => handleInputChange('end_time', e.target.value)}
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="end_time">End Time *</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => handleInputChange('end_time', e.target.value)}
                        required
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Event will end on the same day as it starts
                      </p>
                    </div>
                  )}

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      type="text"
                      placeholder="e.g., 123 Main St, City, State"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Spotify Playlist URL */}
                  <div className="space-y-2">
                    <Label htmlFor="spotify">Spotify Playlist URL (Optional)</Label>
                    <Input
                      id="spotify"
                      type="url"
                      placeholder="https://open.spotify.com/playlist/..."
                      value={formData.spotify_playlist_url}
                      onChange={(e) => handleInputChange('spotify_playlist_url', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground">
                      Add a Spotify playlist to enhance your event experience
                    </p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentPage('dashboard')}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.start_date || !formData.start_time || !formData.end_time || !formData.location || (formData.event_type === 'multi_day' && !formData.end_date)}
                      className="flex-1 btn-floating"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Event...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Event
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};