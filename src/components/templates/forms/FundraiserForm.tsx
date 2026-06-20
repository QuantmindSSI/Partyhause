import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface FundraiserFormData {
  cause_name?: string;
  beneficiary_organization?: string;
  fundraiser_type?: string;
  fundraising_goal?: number;
  expected_guest_count?: number;
  venue_type?: string;
  ticket_price?: number;
  has_silent_auction?: boolean;
  has_live_auction?: boolean;
  has_raffle?: boolean;
  has_donation_station?: boolean;
  entertainment_type?: string;
  speaker_presenter?: string;
  catering_style?: string;
  sponsor_levels?: string;
  marketing_plan?: string;
  volunteer_needs?: string;
  tax_deductible?: boolean;
  special_requests?: string;
}

interface FundraiserFormProps {
  initialData?: FundraiserFormData;
  onChange: (data: FundraiserFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const FUNDRAISER_TYPES = [
  'Gala Dinner',
  'Charity Auction',
  'Benefit Concert',
  'Charity Run/Walk',
  'Silent Auction',
  'Casino Night',
  'Wine Tasting',
  'Charity Golf Tournament',
  'Dinner Dance',
  'Community Carnival',
  'Peer-to-Peer Fundraising',
  'Crowdfunding Event',
];

const VENUE_TYPES = [
  'Hotel Ballroom',
  'Banquet Hall',
  'Restaurant/Private Room',
  'Community Center',
  'Country Club',
  'Outdoor Venue',
  'Theater/Performing Arts',
  'Museum/Gallery',
  'School/University',
  'Virtual Event',
];

const ENTERTAINMENT_OPTIONS = [
  'Live Band/Musician',
  'DJ',
  'Comedian',
  'Magician',
  'Speaker/Motivational',
  'Celebrity Appearance',
  'Dance Performance',
  'No Entertainment (Focus on Mission)',
];

const CATERING_STYLES = [
  'Plated Dinner',
  'Buffet',
  'Cocktail Reception',
  'Heavy Hors d\'oeuvres',
  'Food Stations',
  'Brunch',
  'Dessert Only',
];

export default function FundraiserForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: FundraiserFormProps) {
  const [formData, setFormData] = useState<FundraiserFormData>(initialData);

  const updateField = (field: keyof FundraiserFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const isValid = () => {
    return formData.cause_name &&
           formData.fundraiser_type &&
           formData.fundraising_goal &&
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
          <h1 className="text-2xl font-bold text-gray-900">💰 Fundraiser Planning</h1>
          <p className="text-gray-600">Let&apos;s raise money for a great cause!</p>
        </div>
      </div>

      {/* Cause Information */}
      <Card>
        <CardHeader>
          <CardTitle>Cause Information</CardTitle>
          <CardDescription>What are you fundraising for?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cause-name">Cause/Organization Name *</Label>
            <Input
              id="cause-name"
              placeholder="Who benefits from this fundraiser?"
              value={formData.cause_name || ''}
              onChange={(e) => updateField('cause_name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="beneficiary">Beneficiary Organization</Label>
            <Input
              id="beneficiary"
              placeholder="Specific charity, school, community group..."
              value={formData.beneficiary_organization || ''}
              onChange={(e) => updateField('beneficiary_organization', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="fundraiser-type">Fundraiser Type *</Label>
            <Select
              value={formData.fundraiser_type}
              onValueChange={(value) => updateField('fundraiser_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fundraiser type" />
              </SelectTrigger>
              <SelectContent>
                {FUNDRAISER_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fundraising-goal">Fundraising Goal ($) *</Label>
              <Input
                id="fundraising-goal"
                type="number"
                placeholder="Target amount to raise"
                value={formData.fundraising_goal || ''}
                onChange={(e) => updateField('fundraising_goal', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="expected-guests">Expected Attendees</Label>
              <Input
                id="expected-guests"
                type="number"
                placeholder="Number of guests expected"
                value={formData.expected_guest_count || ''}
                onChange={(e) => updateField('expected_guest_count', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Venue & Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Venue & Pricing</CardTitle>
          <CardDescription>Where and how much to attend</CardDescription>
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
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {VENUE_TYPES.map((venue) => (
                    <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ticket-price">Ticket Price ($)</Label>
              <Input
                id="ticket-price"
                type="number"
                placeholder="0 for free events"
                value={formData.ticket_price || ''}
                onChange={(e) => updateField('ticket_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fundraising Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Fundraising Activities</CardTitle>
          <CardDescription>How will you raise money?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="silent-auction"
                checked={formData.has_silent_auction || false}
                onCheckedChange={(checked) => updateField('has_silent_auction', checked)}
              />
              <Label htmlFor="silent-auction">Silent Auction</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="live-auction"
                checked={formData.has_live_auction || false}
                onCheckedChange={(checked) => updateField('has_live_auction', checked)}
              />
              <Label htmlFor="live-auction">Live Auction</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="raffle"
                checked={formData.has_raffle || false}
                onCheckedChange={(checked) => updateField('has_raffle', checked)}
              />
              <Label htmlFor="raffle">Raffle/Lottery</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="donation-station"
                checked={formData.has_donation_station || false}
                onCheckedChange={(checked) => updateField('has_donation_station', checked)}
              />
              <Label htmlFor="donation-station">Donation Station</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entertainment & Catering */}
      <Card>
        <CardHeader>
          <CardTitle>Entertainment & Catering</CardTitle>
          <CardDescription>Make it memorable</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="entertainment">Entertainment</Label>
            <Select
              value={formData.entertainment_type}
              onValueChange={(value) => updateField('entertainment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select entertainment" />
              </SelectTrigger>
              <SelectContent>
                {ENTERTAINMENT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="speaker">Featured Speaker/Presenter</Label>
            <Input
              id="speaker"
              placeholder="Keynote speaker, honoree, or special guest"
              value={formData.speaker_presenter || ''}
              onChange={(e) => updateField('speaker_presenter', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="catering">Catering Style</Label>
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
        </CardContent>
      </Card>

      {/* Sponsorship & Marketing */}
      <Card>
        <CardHeader>
          <CardTitle>Sponsorship & Marketing</CardTitle>
          <CardDescription>Amplify your reach</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sponsor-levels">Sponsorship Levels</Label>
            <Textarea
              id="sponsor-levels"
              placeholder="List sponsor tiers and benefits (Gold, Silver, Bronze...)"
              value={formData.sponsor_levels || ''}
              onChange={(e) => updateField('sponsor_levels', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="marketing">Marketing Plan</Label>
            <Textarea
              id="marketing"
              placeholder="How will you promote this event?"
              value={formData.marketing_plan || ''}
              onChange={(e) => updateField('marketing_plan', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="volunteers">Volunteer Needs</Label>
            <Textarea
              id="volunteers"
              placeholder="How many volunteers needed and for what roles?"
              value={formData.volunteer_needs || ''}
              onChange={(e) => updateField('volunteer_needs', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>Legal and special details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="tax-deductible"
              checked={formData.tax_deductible || false}
              onCheckedChange={(checked) => updateField('tax_deductible', checked)}
            />
            <Label htmlFor="tax-deductible">Donations are Tax-Deductible</Label>
          </div>

          <div>
            <Label htmlFor="special-requests">Special Requests</Label>
            <Textarea
              id="special-requests"
              placeholder="Any special requirements or additional details..."
              value={formData.special_requests || ''}
              onChange={(e) => updateField('special_requests', e.target.value)}
              rows={3}
            />
          </div>
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
            placeholder="Describe your fundraiser—share your mission and why people should attend!"
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
