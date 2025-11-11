import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { eventService } from '@/lib/events';
import { uploadImage, validateImageFile } from '@/lib/image-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Sparkles, ChevronRight, PartyPopper, Send, Check, Users } from 'lucide-react';
import { EventTemplateSelection } from '@/components/templates/EventTemplateSelection';
import TemplateFormRouter from '@/components/templates/forms/TemplateFormRouter';
import InviteTemplateSelection from '@/components/invites/InviteTemplateSelection';
import InviteCustomization from '@/components/invites/InviteCustomization';
import { InviteTemplate, CustomInviteData } from '@/types/invites';
import type { InviteCustomization as InviteCustomizationType } from '@/types/invites';
import { TimelineManagement } from '@/features/timeline/components/TimelineManagement';
import { TimelineBlock } from '@/features/timeline/types';
import { timelineService } from '@/lib/timeline';
import { ProgressStepper, CompactProgressBar, Step } from '@/components/ui/progress-stepper';
import { FlowTip } from '@/components/ui/flow-tip';

interface EventTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}


export const EventCreation = () => {
  const { setCurrentPage, setEvents, events, user } = usePartyStore();
  const [formData, setFormData] = useState({
    name: '',
    event_type: 'single_day' as 'single_day' | 'multi_day',
    description: '',
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
  const [step, setStep] = useState<'template' | 'details' | 'form' | 'timeline' | 'invite' | 'invite-template' | 'invite-customize' | 'curate'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<EventTemplate | null>(null);
  const [templateData, setTemplateData] = useState<Record<string, any>>({});
  const [selectedInviteTemplate, setSelectedInviteTemplate] = useState<InviteTemplate | null>(null);
  const [inviteData, setInviteData] = useState<CustomInviteData | null>(null);
  const [timelineBlocks, setTimelineBlocks] = useState<TimelineBlock[]>([]);
  const [createdEvent, setCreatedEvent] = useState<any>(null);
  const [inviteFile, setInviteFile] = useState<File | null>(null);
  const [invitePreview, setInvitePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  // Define the event creation flow steps
  const EVENT_CREATION_STEPS: Step[] = [
    { id: 'template', label: 'Choose Template', description: 'Pick your event type' },
    { id: 'details', label: 'Event Details', description: 'Fill in information' },
    { id: 'form', label: 'Basic Info', description: 'Date, time, location' },
    { id: 'timeline', label: 'Timeline', description: 'Schedule activities' },
    { id: 'invite-template', label: 'Invite Design', description: 'Choose invitation style' },
    { id: 'invite-customize', label: 'Customize Invite', description: 'Personalize message' },
    { id: 'curate', label: 'Final Review', description: 'Ready to publish' },
  ];

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

    // Calculate start and end dates - use proper ISO format
    const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
    const endDateTime = formData.event_type === 'multi_day' 
      ? `${formData.end_date}T${formData.end_time}:00`
      : `${formData.start_date}T${formData.end_time}:00`;

    const newEvent = {
      host_id: user.id,
      name: formData.name,
      event_type: formData.event_type,
      description: formData.description.trim() || null,
      start_date: startDateTime,
      end_date: endDateTime,
      location: formData.location,
      spotify_playlist_url: formData.spotify_playlist_url || null,
      template_type: selectedTemplate?.id || null,
      template_data: templateData || {},
      timeline_blocks: timelineBlocks || [],
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
        setCompletedSteps(prev => [...new Set([...prev, 'form'])]);
        setStep('timeline');
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
    if (field === 'description' && descriptionError) {
      setDescriptionError(null);
    }
  };

  const handleTemplateSelect = (template: EventTemplate) => {
    setSelectedTemplate(template);
    setCompletedSteps(prev => [...new Set([...prev, 'template'])]);
    setStep('details');
  };

  const handleTemplateDataChange = (data: Record<string, any>) => {
    setTemplateData(data);
  };

  const handleBackToTemplates = () => {
    setSelectedTemplate(null);
    setTemplateData({});
    setStep('template');
  };

  const proceedToEventForm = () => {
    if (!formData.description.trim()) {
      setDescriptionError('Please add a short event description before continuing.');
      return;
    }
    setDescriptionError(null);
    setCompletedSteps(prev => [...new Set([...prev, 'details'])]);
    setStep('form');
  };

  const handleInviteTemplateSelect = (template: InviteTemplate) => {
    setSelectedInviteTemplate(template);
    setCompletedSteps(prev => [...new Set([...prev, 'invite-template'])]);
    setStep('invite-customize');
  };

  const handleInviteCustomize = (customInviteData: CustomInviteData, customization: InviteCustomizationType) => {
    setInviteData(customInviteData);
    // Here you would typically save the invite and send it
    console.log('Invite customized:', { customInviteData, customization });
    setCompletedSteps(prev => [...new Set([...prev, 'invite-customize'])]);
    // For now, go to curate step
    setStep('curate');
  };

  const handleSaveInviteDraft = (customInviteData: CustomInviteData, customization: InviteCustomizationType) => {
    setInviteData(customInviteData);
    console.log('Invite draft saved:', { customInviteData, customization });
    // Could show a success message here
  };

  const handleTimelineNext = async (blocks: TimelineBlock[]) => {
    setTimelineBlocks(blocks);
    
    if (createdEvent) {
      try {
        setIsSubmitting(true);
        await timelineService.updateEventTimeline(createdEvent.id, blocks);
        console.log('Timeline blocks saved to database:', blocks);
      } catch (error) {
        console.error('Failed to save timeline:', error);
        setError('Failed to save timeline. You can continue and add it later.');
      } finally {
        setIsSubmitting(false);
      }
    }
    
    setCompletedSteps(prev => [...new Set([...prev, 'timeline'])]);
    setStep('invite-template');
  };

  const handleTimelineSave = async (blocks: TimelineBlock[]) => {
    setTimelineBlocks(blocks);
    
    if (createdEvent) {
      try {
        setIsSubmitting(true);
        await timelineService.updateEventTimeline(createdEvent.id, blocks);
        console.log('Timeline saved as draft to database:', blocks);
        // Could show a success message here
      } catch (error) {
        console.error('Failed to save timeline draft:', error);
        setError('Failed to save timeline draft. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
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
  // Timeline Management Step
  if (step === 'timeline' && createdEvent) {
    return (
      <TimelineManagement
        eventName={createdEvent.name}
        initialBlocks={timelineBlocks}
        onBack={() => setStep('form')}
        onNext={handleTimelineNext}
        onSave={handleTimelineSave}
      />
    );
  }

  // Invite Template Selection Step
  if (step === 'invite-template') {
    return (
      <InviteTemplateSelection
        eventType={selectedTemplate?.category || 'casual'}
        onSelectTemplate={handleInviteTemplateSelect}
        onBack={() => setStep('curate')}
      />
    );
  }

  // Invite Customization Step
  if (step === 'invite-customize' && selectedInviteTemplate && createdEvent) {
    return (
      <InviteCustomization
        template={selectedInviteTemplate}
        eventData={{
          name: createdEvent.name,
          date: formData.start_date,
          time: formData.start_time,
          location: createdEvent.location,
          host: user?.email || 'Host',
        }}
        onBack={() => setStep('invite-template')}
        onSend={handleInviteCustomize}
        onSave={handleSaveInviteDraft}
      />
    );
  }

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
      <div className="min-h-screen relative">
        <div className="liquid-bg" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Success Celebration */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  delay: 0.2,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 200
                }}
                className="inline-block mb-6"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full blur-2xl opacity-60 animate-pulse" />
                  <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                    <PartyPopper className="w-12 h-12 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl font-bold text-white mb-4"
              >
                🎉 Event Created Successfully!
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl text-gray-800 font-medium mb-8"
              >
                {createdEvent?.name} is ready to go! Now let's make it unforgettable.
              </motion.p>
            </motion.div>

            {/* Next Steps Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="modern-card hover:shadow-xl transition-shadow cursor-pointer h-full" onClick={() => setStep('invite-template')}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                      <Send className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Send Invitations</CardTitle>
                    <CardDescription>
                      Choose a template and invite your guests
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="modern-card hover:shadow-xl transition-shadow cursor-pointer h-full" onClick={() => setCurrentPage('event-management')}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">Manage Event</CardTitle>
                    <CardDescription>
                      Add timeline, music, and guest list
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="modern-card hover:shadow-xl transition-shadow cursor-pointer h-full" onClick={() => setCurrentPage('dashboard')}>
                  <CardHeader>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">View Dashboard</CardTitle>
                    <CardDescription>
                      See all your events and analytics
                    </CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            </div>

            {/* Primary Action */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-center"
            >
              <Button 
                onClick={() => setCurrentPage('dashboard')}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold px-8 py-6 text-lg"
              >
                Go to Dashboard
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Template Selection Step
  if (step === 'template') {
    return (
      <div className="min-h-screen relative">
        <div className="liquid-bg" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className="icon-btn-liquid"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <CompactProgressBar 
                current={completedSteps.length + 1} 
                total={EVENT_CREATION_STEPS.length}
                label="Event Creation"
              />
            </div>

            {/* Progress Stepper */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-white/10 backdrop-blur-sm rounded-xl p-6"
            >
              <ProgressStepper 
                steps={EVENT_CREATION_STEPS}
                currentStep={step}
                completedSteps={completedSteps}
              />
            </motion.div>

            {/* Flow Tip */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <FlowTip currentStep={step} />
            </motion.div>
            
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-12 h-12 text-orange-500 mx-auto" />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-white mb-4"
              >
                Choose Your Event Template
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-800 font-medium max-w-2xl mx-auto"
              >
                Start with a pre-designed template that matches your event type. We'll customize the details for you!
              </motion.p>
            </div>

            {/* Template Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <EventTemplateSelection onSelectTemplate={handleTemplateSelect} />
            </motion.div>

            {/* Skip Option */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-8"
            >
              <button
                onClick={() => {
                  setCompletedSteps(prev => [...new Set([...prev, 'template'])]);
                  setStep('form');
                }}
                className="btn-glass px-6 py-3"
              >
                Skip templates and create from scratch
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Template Details Step
  if (step === 'details' && selectedTemplate) {
    return (
      <div className="min-h-screen relative">
        <div className="liquid-bg" />
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6">
              <button
                onClick={handleBackToTemplates}
                className="icon-btn-liquid mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-orange-600">
                  {selectedTemplate.name} Details
                </h1>
                <p className="text-gray-800 font-medium">
                  Customize your {selectedTemplate.name.toLowerCase()} event
                </p>
              </div>
            </div>

            {/* Template-Specific Form */}
            <TemplateFormRouter
              templateId={selectedTemplate.id}
              templateName={selectedTemplate.name}
              initialData={templateData}
              onChange={handleTemplateDataChange}
              onBack={handleBackToTemplates}
              onNext={proceedToEventForm}
              eventDescription={formData.description}
              onDescriptionChange={(value) => handleInputChange('description', value)}
            />
            {descriptionError && (
              <div className="mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{descriptionError}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: event creation form
  return (
    <div className="min-h-screen relative">
      <div className="liquid-bg" />
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {selectedTemplate && (
              <div className="flex items-center mb-6">
                <button
                  onClick={() => setStep('details')}
                  className="icon-btn-liquid mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-orange-600">
                    {selectedTemplate.name} Event Details
                  </h1>
                  <p className="text-gray-800 font-medium">
                    Complete your {selectedTemplate.name.toLowerCase()} event setup
                  </p>
                </div>
              </div>
            )}
            {!selectedTemplate && (
              <div className="text-center">
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-4xl font-bold text-orange-600 mb-4"
                >
                  Create New Event
                </motion.h1>
                <p className="text-gray-800 font-medium">
                  Plan your perfect party and invite your guests
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="form-container-liquid">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-orange-400" />
                  Event Details
                </h2>
                <p className="text-gray-700 font-medium mt-2">
                  Fill in the information for your event
                </p>
              </div>
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-destructive text-sm">{error}</p>
                    </div>
                  )}

                  {/* Event Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-800 font-medium">Event Name *</Label>
                    <input
                      id="name"
                      type="text"
                      placeholder="e.g., John's Birthday Party"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="input-shimmer w-full"
                    />
                  </div>

                  {/* Event Type */}
                  <div className="space-y-2">
                    <Label htmlFor="event_type" className="text-gray-800 font-medium">Event Type *</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-orange-600 transition-colors font-medium">
                        <input
                          type="radio"
                          name="event_type"
                          value="single_day"
                          checked={formData.event_type === 'single_day'}
                          onChange={(e) => handleInputChange('event_type', e.target.value)}
                          disabled={isSubmitting}
                          className="text-orange-400 focus:ring-orange-400"
                        />
                        <span className="text-sm">Single Day Event</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer text-gray-700 hover:text-orange-600 transition-colors font-medium">
                        <input
                          type="radio"
                          name="event_type"
                          value="multi_day"
                          checked={formData.event_type === 'multi_day'}
                          onChange={(e) => handleInputChange('event_type', e.target.value)}
                          disabled={isSubmitting}
                          className="text-orange-400 focus:ring-orange-400"
                        />
                        <span className="text-sm">Multi-Day Event</span>
                      </label>
                    </div>
                  </div>

                  {/* Event Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Event Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Share details your guests should know"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      disabled={isSubmitting}
                      rows={4}
                      required
                    />
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
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.start_date || !formData.start_time || !formData.end_time || !formData.location || (formData.event_type === 'multi_day' && !formData.end_date)}
                      className="flex-1 btn-liquid-metal disabled:opacity-50 disabled:cursor-not-allowed"
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
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};