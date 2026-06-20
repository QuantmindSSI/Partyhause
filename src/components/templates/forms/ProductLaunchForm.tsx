import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface ProductLaunchFormData {
  product_name?: string;
  company_name?: string;
  product_category?: string;
  launch_type?: string;
  target_audience?: string;
  expected_attendees?: number;
  venue_type?: string;
  presentation_format?: string;
  demo_requirements?: string;
  press_media_invited?: boolean;
  influencer_invites?: boolean;
  vip_guests?: boolean;
  pre_launch_nda?: boolean;
  live_streaming?: boolean;
  catering_style?: string;
  swag_gifts?: boolean;
  swag_details?: string;
  follow_up_required?: boolean;
  special_requests?: string;
}

interface ProductLaunchFormProps {
  initialData?: ProductLaunchFormData;
  onChange: (data: ProductLaunchFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const PRODUCT_CATEGORIES = [
  'Technology/Software',
  'Consumer Electronics',
  'Fashion/Apparel',
  'Food & Beverage',
  'Beauty/Wellness',
  'Automotive',
  'Home/Garden',
  'Toys/Games',
  'Fitness/Sports',
  'Entertainment/Media',
  'Financial Services',
  'Healthcare/Medical',
  'Sustainable/Eco-friendly',
  'Other',
];

const LAUNCH_TYPES = [
  'Official Public Launch',
  'Beta/Soft Launch',
  'Relaunch/Rebrand',
  'Limited Release',
  'Crowdfunding Launch',
  'Investor Preview',
  'Press Preview',
  'VIP Exclusive',
];

const VENUE_TYPES = [
  'Corporate Office/Event Space',
  'Conference Center',
  'Hotel Ballroom',
  'Rooftop/Outdoor Venue',
  'Warehouse/Industrial',
  'Gallery/Museum',
  'Restaurant/Private Room',
  'Tech Hub/Co-working',
  'Pop-up Space',
  'Virtual Launch',
];

const PRESENTATION_FORMATS = [
  'Stage Presentation (Keynote Style)',
  'Interactive Demo Stations',
  'Theater Screening',
  'Exhibition/Trade Show Style',
  'Intimate Roundtable',
  'Networking + Presentation',
  'Experiential/Immersive',
  'Panel Discussion',
];

const CATERING_STYLES = [
  'Cocktail Reception',
  'Plated Dinner',
  'Buffet',
  'Passed Hors d\'oeuvres',
  'Food Stations',
  'Brunch',
  'Coffee & Light Snacks',
  'No Catering (Brief Event)',
];

export default function ProductLaunchForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: ProductLaunchFormProps) {
  const [formData, setFormData] = useState<ProductLaunchFormData>(initialData);

  const updateField = (field: keyof ProductLaunchFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const isValid = () => {
    return formData.product_name &&
           formData.company_name &&
           formData.product_category &&
           formData.venue_type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🚀 Product Launch</h1>
          <p className="text-gray-600">Let&apos;s unveil something amazing!</p>
        </div>
      </div>

      {/* Product Information */}
      <Card>
        <CardHeader>
          <CardTitle>Product Information</CardTitle>
          <CardDescription>Tell us about what you&apos;re launching</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-name">Product Name *</Label>
              <Input
                id="product-name"
                placeholder="What are you launching?"
                value={formData.product_name || ''}
                onChange={(e) => updateField('product_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="company-name">Company/Brand Name *</Label>
              <Input
                id="company-name"
                placeholder="Your company or brand"
                value={formData.company_name || ''}
                onChange={(e) => updateField('company_name', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-category">Product Category *</Label>
              <Select
                value={formData.product_category}
                onValueChange={(value) => updateField('product_category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="launch-type">Launch Type</Label>
              <Select
                value={formData.launch_type}
                onValueChange={(value) => updateField('launch_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select launch type" />
                </SelectTrigger>
                <SelectContent>
                  {LAUNCH_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="target-audience">Target Audience</Label>
            <Input
              id="target-audience"
              placeholder="e.g., Tech enthusiasts, investors, press, early adopters"
              value={formData.target_audience || ''}
              onChange={(e) => updateField('target_audience', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="expected-attendees">Expected Attendees</Label>
            <Input
              id="expected-attendees"
              type="number"
              placeholder="Number of guests expected"
              value={formData.expected_attendees || ''}
              onChange={(e) => updateField('expected_attendees', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Venue & Format */}
      <Card>
        <CardHeader>
          <CardTitle>Venue & Presentation</CardTitle>
          <CardDescription>Where and how you&apos;ll present</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="venue-type">Venue Type *</Label>
              <Select
                value={formData.venue_type}
                onValueChange={(value) => updateField('venue_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map((venue) => (
                    <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="presentation-format">Presentation Format</Label>
              <Select
                value={formData.presentation_format}
                onValueChange={(value) => updateField('presentation_format', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {PRESENTATION_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>{format}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="demo-requirements">Demo/Display Requirements</Label>
            <Textarea
              id="demo-requirements"
              placeholder="Product demonstrations, display needs, technical setup..."
              value={formData.demo_requirements || ''}
              onChange={(e) => updateField('demo_requirements', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guest Types */}
      <Card>
        <CardHeader>
          <CardTitle>Guest Types</CardTitle>
          <CardDescription>Who will be attending your launch?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="press-media"
              checked={formData.press_media_invited || false}
              onCheckedChange={(checked) => updateField('press_media_invited', checked)}
            />
            <Label htmlFor="press-media">Press/Media Invited</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="influencer"
              checked={formData.influencer_invites || false}
              onCheckedChange={(checked) => updateField('influencer_invites', checked)}
            />
            <Label htmlFor="influencer">Influencer Invites</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="vip-guests"
              checked={formData.vip_guests || false}
              onCheckedChange={(checked) => updateField('vip_guests', checked)}
            />
            <Label htmlFor="vip-guests">VIP/Distinguished Guests</Label>
          </div>
        </CardContent>
      </Card>

      {/* Event Features */}
      <Card>
        <CardHeader>
          <CardTitle>Event Features</CardTitle>
          <CardDescription>Special elements for your launch</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="pre-launch-nda"
              checked={formData.pre_launch_nda || false}
              onCheckedChange={(checked) => updateField('pre_launch_nda', checked)}
            />
            <Label htmlFor="pre-launch-nda">Pre-Launch NDA Required</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="live-streaming"
              checked={formData.live_streaming || false}
              onCheckedChange={(checked) => updateField('live_streaming', checked)}
            />
            <Label htmlFor="live-streaming">Live Stream the Event</Label>
          </div>

          <div>
            <Label htmlFor="catering-style">Catering Style</Label>
            <Select
              value={formData.catering_style}
              onValueChange={(value) => updateField('catering_style', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select catering" />
              </SelectTrigger>
              <SelectContent>
                {CATERING_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="swag-gifts"
              checked={formData.swag_gifts || false}
              onCheckedChange={(checked) => updateField('swag_gifts', checked)}
            />
            <Label htmlFor="swag-gifts">Provide Swag/Gifts</Label>
          </div>

          {formData.swag_gifts && (
            <div>
              <Label htmlFor="swag-details">Swag/Gift Details</Label>
              <Input
                id="swag-details"
                placeholder="Branded items, product samples, gift bags..."
                value={formData.swag_details || ''}
                onChange={(e) => updateField('swag_details', e.target.value)}
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="follow-up"
              checked={formData.follow_up_required || false}
              onCheckedChange={(checked) => updateField('follow_up_required', checked)}
            />
            <Label htmlFor="follow-up">Follow-up Communications Required</Label>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests</CardTitle>
          <CardDescription>Any additional details or requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Special signage, security needs, celebrity appearances, or anything else..."
            value={formData.special_requests || ''}
            onChange={(e) => updateField('special_requests', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Event Description */}
      <Card>
        <CardHeader>
          <CardTitle>Event Description *</CardTitle>
          <CardDescription>
            Share a brief overview guests will see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="event-description"
            placeholder="Describe your product launch—share the excitement and what makes it special!"
            value={eventDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={4}
            required
          />
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back to Templates
        </Button>
        <Button
          onClick={onNext}
          className="flex-1"
          disabled={!isValid() || !eventDescription.trim()}
        >
          Continue to Event Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
