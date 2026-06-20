import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface FestivalFormData {
  festival_name?: string;
  festival_type?: string;
  music_genres?: string[];
  duration_days?: number;
  expected_attendees?: number;
  venue_type?: string;
  outdoor_indoor?: string;
  number_of_stages?: number;
  headliner_artist?: string;
  supporting_artists?: string;
  has_camping?: boolean;
  camping_type?: string;
  food_vendors?: boolean;
  merchandise_vendors?: boolean;
  art_installations?: boolean;
  workshops_activities?: boolean;
  ticket_tiers?: string[];
  security_plan?: string;
  sustainability_plan?: string;
  special_requests?: string;
}

interface FestivalFormProps {
  initialData?: FestivalFormData;
  onChange: (data: FestivalFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const FESTIVAL_TYPES = [
  'Music Festival',
  'Arts & Culture Festival',
  'Food & Drink Festival',
  'Film Festival',
  'Literary Festival',
  'Comedy Festival',
  'Dance Festival',
  'Electronic/EDM Festival',
  'Multi-Genre Festival',
  'Community Festival',
  'Seasonal Festival',
];

const MUSIC_GENRES = [
  'Rock',
  'Pop',
  'Hip-Hop/Rap',
  'Electronic/EDM',
  'Indie/Alternative',
  'Jazz',
  'Classical',
  'Country',
  'R&B/Soul',
  'Reggae',
  'Folk',
  'World Music',
];

const VENUE_TYPES = [
  'Outdoor Fields/Grounds',
  'Beach/Coastal',
  'Park/Forest',
  'Desert',
  'Urban/City Center',
  'Amphitheater',
  'Fairgrounds',
  'Racetrack',
  'Ski Resort',
  'Multi-Venue City',
];

const CAMPING_TYPES = [
  'General Tent Camping',
  'RV Camping',
  'Glamping (Luxury)',
  'Car Camping',
  'VIP Camping',
  'Group Camping',
  'No Camping (Nearby Hotels)',
];

const TICKET_TIERS = [
  'General Admission',
  'VIP',
  'Backstage/Platinum',
  'Single Day',
  'Weekend Pass',
  'Early Entry',
  'Group/Camping Bundle',
];

export default function FestivalForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: FestivalFormProps) {
  const [formData, setFormData] = useState<FestivalFormData>(initialData);

  const updateField = (field: keyof FestivalFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const toggleGenre = (genre: string) => {
    const current = formData.music_genres || [];
    const updated = current.includes(genre)
      ? current.filter(g => g !== genre)
      : [...current, genre];
    updateField('music_genres', updated);
  };

  const toggleTicket = (tier: string) => {
    const current = formData.ticket_tiers || [];
    const updated = current.includes(tier)
      ? current.filter(t => t !== tier)
      : [...current, tier];
    updateField('ticket_tiers', updated);
  };

  const isValid = () => {
    return formData.festival_name &&
           formData.festival_type &&
           formData.duration_days &&
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
          <h1 className="text-2xl font-bold text-gray-900">🎵 Festival Planning</h1>
          <p className="text-gray-600">Let&apos;s create an unforgettable experience!</p>
        </div>
      </div>

      {/* Festival Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Festival Basics</CardTitle>
          <CardDescription>Core information about your event</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="festival-name">Festival Name *</Label>
            <Input
              id="festival-name"
              placeholder="e.g., Summer Sound Festival"
              value={formData.festival_name || ''}
              onChange={(e) => updateField('festival_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="festival-type">Festival Type *</Label>
              <Select
                value={formData.festival_type}
                onValueChange={(value) => updateField('festival_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {FESTIVAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (Days) *</Label>
              <Input
                id="duration"
                type="number"
                placeholder="1-3 days typical"
                value={formData.duration_days || ''}
                onChange={(e) => updateField('duration_days', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expected-attendees">Expected Attendees</Label>
            <Input
              id="expected-attendees"
              type="number"
              placeholder="Total capacity"
              value={formData.expected_attendees || ''}
              onChange={(e) => updateField('expected_attendees', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>

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
            <Label htmlFor="stages">Number of Stages/Areas</Label>
            <Input
              id="stages"
              type="number"
              placeholder="Main stages, side stages, etc."
              value={formData.number_of_stages || ''}
              onChange={(e) => updateField('number_of_stages', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Music/Entertainment (only for music festivals) */}
      {formData.festival_type?.includes('Music') && (
        <Card>
          <CardHeader>
            <CardTitle>Music & Entertainment</CardTitle>
            <CardDescription>Lineup and genre focus</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Music Genres (select all that apply)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {MUSIC_GENRES.map((genre) => (
                  <label key={genre} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.music_genres || []).includes(genre)}
                      onChange={() => toggleGenre(genre)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{genre}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="headliner">Headliner/Featured Artist</Label>
              <Input
                id="headliner"
                placeholder="Main attraction"
                value={formData.headliner_artist || ''}
                onChange={(e) => updateField('headliner_artist', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="supporting">Supporting Artists/Lineup</Label>
              <Textarea
                id="supporting"
                placeholder="List other performing artists..."
                value={formData.supporting_artists || ''}
                onChange={(e) => updateField('supporting_artists', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accommodations */}
      <Card>
        <CardHeader>
          <CardTitle>Accommodations & Camping</CardTitle>
          <CardDescription>Where will attendees stay?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="has-camping"
              checked={formData.has_camping || false}
              onCheckedChange={(checked) => updateField('has_camping', checked)}
            />
            <Label htmlFor="has-camping">On-Site Camping Available</Label>
          </div>

          {formData.has_camping && (
            <div>
              <Label htmlFor="camping-type">Camping Type</Label>
              <Select
                value={formData.camping_type}
                onValueChange={(value) => updateField('camping_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select camping option" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPING_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Festival Features */}
      <Card>
        <CardHeader>
          <CardTitle>Festival Features</CardTitle>
          <CardDescription>Amenities and experiences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="food-vendors"
                checked={formData.food_vendors || false}
                onCheckedChange={(checked) => updateField('food_vendors', checked)}
              />
              <Label htmlFor="food-vendors">Food Vendors/Trucks</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="merch-vendors"
                checked={formData.merchandise_vendors || false}
                onCheckedChange={(checked) => updateField('merchandise_vendors', checked)}
              />
              <Label htmlFor="merch-vendors">Merchandise Vendors</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="art-installations"
                checked={formData.art_installations || false}
                onCheckedChange={(checked) => updateField('art_installations', checked)}
              />
              <Label htmlFor="art-installations">Art Installations</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="workshops"
                checked={formData.workshops_activities || false}
                onCheckedChange={(checked) => updateField('workshops_activities', checked)}
              />
              <Label htmlFor="workshops">Workshops/Activities</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ticketing */}
      <Card>
        <CardHeader>
          <CardTitle>Ticketing</CardTitle>
          <CardDescription>Ticket options and pricing tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Ticket Tiers (select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {TICKET_TIERS.map((tier) => (
                <label key={tier} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.ticket_tiers || []).includes(tier)}
                    onChange={() => toggleTicket(tier)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{tier}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operations */}
      <Card>
        <CardHeader>
          <CardTitle>Operations & Logistics</CardTitle>
          <CardDescription>Safety and planning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="security">Security Plan</Label>
            <Textarea
              id="security"
              placeholder="Security measures, crowd control, medical stations..."
              value={formData.security_plan || ''}
              onChange={(e) => updateField('security_plan', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="sustainability">Sustainability Plan</Label>
            <Textarea
              id="sustainability"
              placeholder="Waste management, eco-friendly initiatives..."
              value={formData.sustainability_plan || ''}
              onChange={(e) => updateField('sustainability_plan', e.target.value)}
              rows={2}
            />
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
            placeholder="Special permits, celebrity riders, unique requirements..."
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
            Share a brief overview attendees will see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="event-description"
            placeholder="Describe your festival—share the vibe and what makes it special!"
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
