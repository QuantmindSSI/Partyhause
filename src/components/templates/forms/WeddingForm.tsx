import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface WeddingFormData {
  bride_name?: string;
  groom_name?: string;
  wedding_style?: string;
  ceremony_location?: string;
  reception_location?: string;
  expected_guest_count?: number;
  wedding_theme?: string;
  color_scheme?: string;
  meal_service?: string;
  dietary_restrictions?: string;
  bar_service?: string;
  entertainment_type?: string;
  photography?: string;
  accommodation_info?: string;
  gift_registry?: string;
  dress_code?: string;
  special_requests?: string;
  has_ceremony?: boolean;
  has_reception?: boolean;
  has_cocktail_hour?: boolean;
}

interface WeddingFormProps {
  initialData?: WeddingFormData;
  onChange: (data: WeddingFormData) => void;
  onBack: () => void;
  onNext: () => void;
}

const WEDDING_STYLES = [
  'Traditional/Classic',
  'Modern/Contemporary',
  'Rustic/Country',
  'Beach/Destination',
  'Garden/Outdoor',
  'Vintage/Retro',
  'Bohemian/Boho',
  'Elegant/Formal',
  'Intimate/Small',
  'Cultural/Religious',
];

const WEDDING_THEMES = [
  'Romantic Elegance',
  'Garden Romance',
  'Vintage Glamour',
  'Rustic Charm',
  'Modern Minimalist',
  'Fairy Tale',
  'Beach Paradise',
  'Classic Traditional',
  'Bohemian Spirit',
  'Custom Theme',
];

const COLOR_SCHEMES = [
  'Blush & Bashful',
  'Navy & Gold',
  'Burgundy & Cream',
  'Sage Green & White',
  'Dusty Blue & Rose',
  'Black & White',
  'Lavender & Silver',
  'Coral & Peach',
  'Emerald & Gold',
  'Custom Colors',
];

const MEAL_SERVICES = [
  'Plated Dinner',
  'Buffet',
  'Family Style',
  'Cocktail Reception',
  'Brunch/Lunch',
  'Food Stations',
  'Passed Hors d\'oeuvres',
];

const ENTERTAINMENT_OPTIONS = [
  'Live Band',
  'DJ',
  'String Quartet',
  'Solo Musician',
  'Mixed (Live + DJ)',
  'Cultural Performers',
  'None/Background Music',
];

export default function WeddingForm({ 
  initialData = {}, 
  onChange, 
  onBack, 
  onNext 
}: WeddingFormProps) {
  const [formData, setFormData] = useState<WeddingFormData>({
    has_ceremony: true,
    has_reception: true,
    has_cocktail_hour: true,
    ...initialData
  });

  const updateField = (field: keyof WeddingFormData, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onChange(updated);
  };

  const isValid = () => {
    return formData.bride_name && 
           formData.groom_name && 
           formData.expected_guest_count && 
           (formData.ceremony_location || formData.reception_location);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">💍 Wedding Planning</h1>
          <p className="text-gray-600">Let's create your perfect wedding celebration!</p>
        </div>
      </div>

      {/* Couple Information */}
      <Card>
        <CardHeader>
          <CardTitle>Couple Information</CardTitle>
          <CardDescription>Tell us about the happy couple</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bride-name">Bride's Name *</Label>
              <Input
                id="bride-name"
                placeholder="Bride's full name"
                value={formData.bride_name || ''}
                onChange={(e) => updateField('bride_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="groom-name">Groom's Name *</Label>
              <Input
                id="groom-name"
                placeholder="Groom's full name"
                value={formData.groom_name || ''}
                onChange={(e) => updateField('groom_name', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="guest-count">Expected Guest Count *</Label>
            <Input
              id="guest-count"
              type="number"
              placeholder="How many guests?"
              value={formData.expected_guest_count || ''}
              onChange={(e) => updateField('expected_guest_count', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Wedding Style & Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Style & Theme</CardTitle>
          <CardDescription>Define the look and feel of your wedding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="wedding-style">Wedding Style</Label>
            <Select 
              value={formData.wedding_style} 
              onValueChange={(value) => updateField('wedding_style', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your wedding style" />
              </SelectTrigger>
              <SelectContent>
                {WEDDING_STYLES.map((style) => (
                  <SelectItem key={style} value={style}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wedding-theme">Wedding Theme</Label>
            <Select 
              value={formData.wedding_theme} 
              onValueChange={(value) => updateField('wedding_theme', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a theme" />
              </SelectTrigger>
              <SelectContent>
                {WEDDING_THEMES.map((theme) => (
                  <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="color-scheme">Color Scheme</Label>
            <Select 
              value={formData.color_scheme} 
              onValueChange={(value) => updateField('color_scheme', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose your colors" />
              </SelectTrigger>
              <SelectContent>
                {COLOR_SCHEMES.map((scheme) => (
                  <SelectItem key={scheme} value={scheme}>{scheme}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dress-code">Dress Code</Label>
            <Input
              id="dress-code"
              placeholder="e.g., Black Tie, Cocktail, Beach Formal"
              value={formData.dress_code || ''}
              onChange={(e) => updateField('dress_code', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Components */}
      <Card>
        <CardHeader>
          <CardTitle>Wedding Components</CardTitle>
          <CardDescription>What parts will your wedding include?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="has-ceremony"
                checked={formData.has_ceremony || false}
                onCheckedChange={(checked) => updateField('has_ceremony', checked)}
              />
              <Label htmlFor="has-ceremony">Ceremony</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="has-cocktail-hour"
                checked={formData.has_cocktail_hour || false}
                onCheckedChange={(checked) => updateField('has_cocktail_hour', checked)}
              />
              <Label htmlFor="has-cocktail-hour">Cocktail Hour</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="has-reception"
                checked={formData.has_reception || false}
                onCheckedChange={(checked) => updateField('has_reception', checked)}
              />
              <Label htmlFor="has-reception">Reception</Label>
            </div>
          </div>

          {formData.has_ceremony && (
            <div>
              <Label htmlFor="ceremony-location">Ceremony Location</Label>
              <Input
                id="ceremony-location"
                placeholder="Church, venue, or outdoor location"
                value={formData.ceremony_location || ''}
                onChange={(e) => updateField('ceremony_location', e.target.value)}
              />
            </div>
          )}

          {formData.has_reception && (
            <div>
              <Label htmlFor="reception-location">Reception Location</Label>
              <Input
                id="reception-location"
                placeholder="Reception venue (can be same as ceremony)"
                value={formData.reception_location || ''}
                onChange={(e) => updateField('reception_location', e.target.value)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Food & Beverages */}
      <Card>
        <CardHeader>
          <CardTitle>Food & Beverages</CardTitle>
          <CardDescription>Plan your wedding menu and bar service</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meal-service">Meal Service Style</Label>
            <Select 
              value={formData.meal_service} 
              onValueChange={(value) => updateField('meal_service', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose meal service style" />
              </SelectTrigger>
              <SelectContent>
                {MEAL_SERVICES.map((service) => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dietary-restrictions">Dietary Restrictions</Label>
            <Input
              id="dietary-restrictions"
              placeholder="Vegetarian, vegan, allergies, etc."
              value={formData.dietary_restrictions || ''}
              onChange={(e) => updateField('dietary_restrictions', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="bar-service">Bar Service</Label>
            <Select 
              value={formData.bar_service} 
              onValueChange={(value) => updateField('bar_service', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose bar service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open-bar">Open Bar</SelectItem>
                <SelectItem value="wine-beer">Wine & Beer</SelectItem>
                <SelectItem value="signature-cocktails">Signature Cocktails</SelectItem>
                <SelectItem value="cash-bar">Cash Bar</SelectItem>
                <SelectItem value="no-alcohol">No Alcohol</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Entertainment & Services */}
      <Card>
        <CardHeader>
          <CardTitle>Entertainment & Services</CardTitle>
          <CardDescription>Music, photography, and other services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="entertainment-type">Entertainment</Label>
            <Select 
              value={formData.entertainment_type} 
              onValueChange={(value) => updateField('entertainment_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose entertainment type" />
              </SelectTrigger>
              <SelectContent>
                {ENTERTAINMENT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="photography">Photography/Videography</Label>
            <Input
              id="photography"
              placeholder="Professional photographer, videographer, or DIY"
              value={formData.photography || ''}
              onChange={(e) => updateField('photography', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="accommodation-info">Guest Accommodation</Label>
            <Textarea
              id="accommodation-info"
              placeholder="Hotel recommendations, room blocks, transportation info..."
              value={formData.accommodation_info || ''}
              onChange={(e) => updateField('accommodation_info', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="gift-registry">Gift Registry Information</Label>
            <Input
              id="gift-registry"
              placeholder="Registry website or store information"
              value={formData.gift_registry || ''}
              onChange={(e) => updateField('gift_registry', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Special Requests</CardTitle>
          <CardDescription>Any additional details or special requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Cultural traditions, accessibility needs, surprise elements, or any other special requests..."
            value={formData.special_requests || ''}
            onChange={(e) => updateField('special_requests', e.target.value)}
            rows={4}
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
          disabled={!isValid()}
        >
          Continue to Event Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}