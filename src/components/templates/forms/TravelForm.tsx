import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface TravelFormData {
  trip_name?: string;
  destination?: string;
  trip_type?: string;
  duration_days?: number;
  group_size?: number;
  accommodation_type?: string;
  transportation_mode?: string;
  has_flights?: boolean;
  departure_location?: string;
  activities?: string[];
  meal_plan?: string;
  budget_per_person?: number;
  trip_insurance?: boolean;
  packing_list?: string;
  passport_visa_required?: boolean;
  emergency_contacts?: string;
  special_requests?: string;
}

interface TravelFormProps {
  initialData?: TravelFormData;
  onChange: (data: TravelFormData) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

const TRIP_TYPES = [
  'Vacation/Getaway',
  'Adventure Trip',
  'Cultural Tour',
  'Beach Resort',
  'City Break',
  'Road Trip',
  'Cruise',
  'Ski/Snow Trip',
  'Camping/Outdoors',
  'Bachelor/Bachelorette',
  'Reunion Trip',
  'Business + Leisure',
];

const ACCOMMODATION_TYPES = [
  'Hotel',
  'Resort',
  'Vacation Rental (Airbnb/Vrbo)',
  'Hostel',
  'Camping/Glamping',
  'Boutique Hotel',
  'All-Inclusive Resort',
  'Multiple Locations',
];

const TRANSPORTATION_MODES = [
  'Flight',
  'Road Trip (Driving)',
  'Train',
  'Bus/Coach',
  'RV/Camper',
  'Multiple Modes',
];

const ACTIVITIES = [
  'Sightseeing',
  'Beach/Water Sports',
  'Hiking/Nature',
  'Museums/Culture',
  'Nightlife',
  'Shopping',
  'Dining/Food Tours',
  'Adventure Sports',
  'Spa/Wellness',
  'Photography',
  'Local Experiences',
  'Group Games/Activities',
];

const MEAL_PLANS = [
  'All-Inclusive (All Meals)',
  'Half Board (Breakfast + Dinner)',
  'Breakfast Only',
  'Cook Your Own',
  'Dine Out/Explore',
  'Mixed (Some Group, Some Free)',
];

export default function TravelForm({
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange,
}: TravelFormProps) {
  const [formData, setFormData] = useState<TravelFormData>(initialData);

  const updateField = (field: keyof TravelFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const toggleActivity = (activity: string) => {
    const current = formData.activities || [];
    const updated = current.includes(activity)
      ? current.filter(a => a !== activity)
      : [...current, activity];
    updateField('activities', updated);
  };

  const isValid = () => {
    return formData.trip_name &&
           formData.destination &&
           formData.trip_type &&
           formData.duration_days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">✈️ Group Travel</h1>
          <p className="text-gray-600">Let&apos;s plan an amazing trip together!</p>
        </div>
      </div>

      {/* Trip Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Basics</CardTitle>
          <CardDescription>Where are you going?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="trip-name">Trip Name *</Label>
            <Input
              id="trip-name"
              placeholder="e.g., Thailand Adventure 2024"
              value={formData.trip_name || ''}
              onChange={(e) => updateField('trip_name', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                placeholder="City, Country"
                value={formData.destination || ''}
                onChange={(e) => updateField('destination', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="trip-type">Trip Type *</Label>
              <Select
                value={formData.trip_type}
                onValueChange={(value) => updateField('trip_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {TRIP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (Days) *</Label>
              <Input
                id="duration"
                type="number"
                placeholder="Number of days"
                value={formData.duration_days || ''}
                onChange={(e) => updateField('duration_days', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="group-size">Group Size</Label>
              <Input
                id="group-size"
                type="number"
                placeholder="Number of travelers"
                value={formData.group_size || ''}
                onChange={(e) => updateField('group_size', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transportation & Accommodation */}
      <Card>
        <CardHeader>
          <CardTitle>Transportation & Accommodation</CardTitle>
          <CardDescription>How you will get there and stay</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transportation">Transportation Mode</Label>
              <Select
                value={formData.transportation_mode}
                onValueChange={(value) => updateField('transportation_mode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {TRANSPORTATION_MODES.map((mode) => (
                    <SelectItem key={mode} value={mode}>{mode}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accommodation">Accommodation Type</Label>
              <Select
                value={formData.accommodation_type}
                onValueChange={(value) => updateField('accommodation_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select accommodation" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOMMODATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="has-flights"
              checked={formData.has_flights || false}
              onCheckedChange={(checked) => updateField('has_flights', checked)}
            />
            <Label htmlFor="has-flights">Flight Booking Required</Label>
          </div>

          <div>
            <Label htmlFor="departure">Departure Location</Label>
            <Input
              id="departure"
              placeholder="Where will the group depart from?"
              value={formData.departure_location || ''}
              onChange={(e) => updateField('departure_location', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Activities & Interests</CardTitle>
          <CardDescription>What will you do on this trip?</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Select Planned Activities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
              {ACTIVITIES.map((activity) => (
                <label key={activity} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(formData.activities || []).includes(activity)}
                    onChange={() => toggleActivity(activity)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{activity}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logistics */}
      <Card>
        <CardHeader>
          <CardTitle>Logistics & Planning</CardTitle>
          <CardDescription>Details for the group</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="meal-plan">Meal Plan</Label>
              <Select
                value={formData.meal_plan}
                onValueChange={(value) => updateField('meal_plan', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select meal plan" />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_PLANS.map((plan) => (
                    <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budget">Budget Per Person ($)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Estimated cost"
                value={formData.budget_per_person || ''}
                onChange={(e) => updateField('budget_per_person', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="insurance"
              checked={formData.trip_insurance || false}
              onCheckedChange={(checked) => updateField('trip_insurance', checked)}
            />
            <Label htmlFor="insurance">Trip Insurance Recommended/Required</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="passport"
              checked={formData.passport_visa_required || false}
              onCheckedChange={(checked) => updateField('passport_visa_required', checked)}
            />
            <Label htmlFor="passport">Passport/Visa Required</Label>
          </div>

          <div>
            <Label htmlFor="packing">Packing Suggestions</Label>
            <Textarea
              id="packing"
              placeholder="What should travelers bring?"
              value={formData.packing_list || ''}
              onChange={(e) => updateField('packing_list', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="emergency">Emergency Contacts/Info</Label>
            <Textarea
              id="emergency"
              placeholder="Emergency contact numbers, medical info..."
              value={formData.emergency_contacts || ''}
              onChange={(e) => updateField('emergency_contacts', e.target.value)}
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
            placeholder="Group discounts, accessibility needs, special occasions..."
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
            Share a brief overview travelers will see
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            id="event-description"
            placeholder="Describe this trip—share why it will be unforgettable!"
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
