# Event Templates

This directory contains seed data for PartyHause event templates.

## Template Files

- `birthday-kids.json` - Birthday Party for Kids (ages 4-12)
- `birthday-large.json` - Large Adult Birthday Party (40-80 guests)
- `corporate-offsite.json` - Corporate Team Offsite (20-50 attendees)
- `wedding-intimate.json` - Intimate Wedding (50-100 guests)
- `group-travel.json` - Group Travel Trip (8-20 travelers)

## Template Structure

Each template JSON file contains:

- **Metadata**: name, slug, description, category, price_tier
- **default_payload**: Full event seed data including:
  - Event details
  - PartyBoard tasks
  - Features (games, polls, budget, email sequences)
  - Budget line items
  - Email template references
  - Customization hints
- **required_fields_schema**: JSON Schema for validation

## Usage

### Load Templates into Database

```javascript
// Example: Load all templates from this directory
const fs = require('fs');
const path = require('path');

async function seedTemplates() {
  const templatesDir = path.join(__dirname, 'templates');
  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const templateData = JSON.parse(
      fs.readFileSync(path.join(templatesDir, file), 'utf8')
    );
    await supabase.from('templates').insert(templateData);
  }
}
```

### API Access

```javascript
// Get all templates
GET /api/templates

// Get template by slug
GET /api/templates/birthday-kids

// Create event from template
POST /api/events/from-template
{
  "template_id": "uuid",
  "overrides": {
    "event": {
      "title": "Emma's 6th Birthday",
      "date": "2025-11-15T14:00:00Z",
      "location": "123 Main St"
    }
  }
}
```

## Adding New Templates

1. Create a new JSON file in this directory following the structure above
2. Ensure `slug` is unique and URL-friendly
3. Include all required fields in `required_fields_schema`
4. Test validation logic with sample overrides
5. Run seed script to load into database

## Categories

- `personal` - Birthday parties, social gatherings
- `corporate` - Team offsites, company events
- `wedding` - Weddings and related celebrations
- `travel` - Group trips and vacations
- `fundraiser` - Charity events and galas
- `community` - Neighborhood events, meetups

## Price Tiers

- `free` - Available to all users
- `premium` - Included with premium subscription
- `purchase` - Individual purchase required (set `price_amount` in cents)

## Development Notes

- Templates are immutable once published (no versioning in MVP)
- `due_offset_days` is calculated relative to event date
- Email template references (`emails` object) must exist in email template system
- Budget `split: true` indicates expense can be split among travelers/attendees
- Multi-day events use `duration_hours` > 24 and support itinerary features
