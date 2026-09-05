import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { TemplateFormData } from '../TemplateForm';
import {
  Section, TextField, NumberField, ToggleField, ChipMultiSelect, RepeaterField,
} from './fields';
import { cleanList, styles } from './fieldStyles';

interface TravelFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const ACCOMMODATION = ['Hotel', 'Hostel', 'Rental house', 'Apartments', 'Camping', 'Split across venues'] as const;
const TRANSPORT = ['Flights', 'Train', 'Coach', 'Hire cars', 'Own transport', 'Ferry'] as const;
const INCLUDED = ['Accommodation', 'Breakfast', 'All meals', 'Local transport', 'Activities', 'Guide'] as const;

export default function TravelForm({ initialData = {}, onChange, onValidation }: TravelFormProps) {
  const [destination, setDestination] = useState<string>(initialData.destination || '');
  const [nights, setNights] = useState<string>(initialData.nights?.toString() || '');
  const [groupSize, setGroupSize] = useState<string>(initialData.group_size?.toString() || '');
  const [accommodation, setAccommodation] = useState<string[]>(initialData.accommodation_type ? [initialData.accommodation_type] : []);
  const [transport, setTransport] = useState<string[]>(initialData.transport || []);
  const [included, setIncluded] = useState<string[]>(initialData.included || []);
  const [costPerPerson, setCostPerPerson] = useState<string>(initialData.cost_per_person?.toString() || '');
  const [currency, setCurrency] = useState<string>(initialData.currency || 'GBP');
  const [passportRequired, setPassportRequired] = useState<boolean>(initialData.passport_required ?? false);
  const [visaNotes, setVisaNotes] = useState<string>(initialData.visa_notes || '');
  const [itinerary, setItinerary] = useState<string[]>(initialData.itinerary?.length ? initialData.itinerary : ['']);

  const nightsNum = parseInt(nights || '0', 10);
  const groupNum = parseInt(groupSize || '0', 10);

  useEffect(() => {
    onChange({
      destination: destination.trim(),
      nights: nightsNum > 0 ? nightsNum : null,
      group_size: groupNum > 0 ? groupNum : null,
      accommodation_type: accommodation[0] ?? null,
      transport,
      included,
      cost_per_person: costPerPerson ? parseInt(costPerPerson, 10) : null,
      currency: currency.trim().toUpperCase(),
      passport_required: passportRequired,
      visa_notes: passportRequired ? visaNotes.trim() : '',
      itinerary: cleanList(itinerary),
    });
    // Where, how long, and how many. Cost is deliberately optional because
    // group trips are usually priced after the group size is known.
    onValidation(destination.trim().length > 0 && nightsNum > 0 && groupNum > 0);
  }, [destination, nightsNum, groupNum, accommodation, transport, included, costPerPerson, currency, passportRequired, visaNotes, itinerary]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="The trip">
        <TextField label="Destination" value={destination} onChangeText={setDestination}
          placeholder="e.g. Lisbon, Portugal" required />
        <NumberField label="Nights" value={nights} onChangeText={setNights}
          placeholder="3" required />
        <NumberField label="Group size" value={groupSize} onChangeText={setGroupSize}
          placeholder="12" required helper="Drives accommodation and most group discounts." />
      </Section>

      <Section title="Getting there and staying">
        <ChipMultiSelect label="Accommodation" options={ACCOMMODATION} selected={accommodation}
          onToggle={(next) => setAccommodation(next.slice(-1))} />
        <ChipMultiSelect label="Transport" options={TRANSPORT} selected={transport} onToggle={setTransport} />
        <RepeaterField label="Itinerary" rows={itinerary} onChange={setItinerary}
          placeholder="e.g. Day 1: arrive, dinner at 8" addLabel="Add day"
          helper="Becomes the event timeline." />
      </Section>

      <Section title="Money and documents">
        <NumberField label="Cost per person" value={costPerPerson} onChangeText={setCostPerPerson}
          placeholder="450" helper="Optional. Leave blank until the group is confirmed." />
        <TextField label="Currency" value={currency} onChangeText={setCurrency} placeholder="GBP" />
        <ChipMultiSelect label="What that covers" options={INCLUDED} selected={included} onToggle={setIncluded}
          helper="Stating this up front prevents most of the arguments." />
        <ToggleField label="Passport required" value={passportRequired} onValueChange={setPassportRequired} />
        {passportRequired ? (
          <TextField label="Visa and document notes" value={visaNotes} onChangeText={setVisaNotes} multiline
            placeholder="e.g. Passport must be valid for six months beyond return date"
            helper="Shown to every guest when they RSVP." />
        ) : null}
      </Section>
    </ScrollView>
  );
}
