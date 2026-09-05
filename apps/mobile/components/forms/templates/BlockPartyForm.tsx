import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { TemplateFormData } from '../TemplateForm';
import {
  Section, TextField, NumberField, ToggleField, ChipMultiSelect, RepeaterField,
} from './fields';
import { cleanList, styles } from './fieldStyles';

interface BlockPartyFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const PERMIT_STAGES = ['Not started', 'Applied', 'Approved', 'Not required'] as const;
const ACTIVITIES = ["Kids' games", 'Live music', 'BBQ / grill', 'Face painting', 'Bouncy castle', 'Street sports', 'Talent show'] as const;
const POTLUCK = ['Mains', 'Sides', 'Salads', 'Desserts', 'Drinks', 'Ice'] as const;

export default function BlockPartyForm({ initialData = {}, onChange, onValidation }: BlockPartyFormProps) {
  const [streets, setStreets] = useState<string[]>(initialData.streets_closed?.length ? initialData.streets_closed : ['']);
  const [permitStatus, setPermitStatus] = useState<string[]>(initialData.permit_status ? [initialData.permit_status] : []);
  const [households, setHouseholds] = useState<string>(initialData.expected_households?.toString() || '');
  const [isPotluck, setIsPotluck] = useState<boolean>(initialData.is_potluck ?? false);
  const [potluckCategories, setPotluckCategories] = useState<string[]>(initialData.potluck_categories || []);
  const [activities, setActivities] = useState<string[]>(initialData.activities || []);
  const [noiseCurfew, setNoiseCurfew] = useState<string>(initialData.noise_curfew || '');
  const [rainPlan, setRainPlan] = useState<string>(initialData.rain_plan || '');

  useEffect(() => {
    const cleanStreets = cleanList(streets);
    onChange({
      streets_closed: cleanStreets,
      permit_status: permitStatus[0] ?? null,
      expected_households: households ? parseInt(households, 10) : null,
      is_potluck: isPotluck,
      potluck_categories: isPotluck ? potluckCategories : [],
      activities,
      noise_curfew: noiseCurfew.trim(),
      rain_plan: rainPlan.trim(),
    });
    // A street party needs a street and a rough headcount. Everything else is
    // planning detail the host can fill in later.
    onValidation(cleanStreets.length > 0 && parseInt(households || '0', 10) > 0);
  }, [streets, permitStatus, households, isPotluck, potluckCategories, activities, noiseCurfew, rainPlan]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="The street">
        <RepeaterField label="Streets being closed" rows={streets} onChange={setStreets}
          placeholder="e.g. Oak Avenue, between 3rd and 5th" addLabel="Add another street"
          helper="Name each stretch you are closing. Your council will want this exact wording." />
        <NumberField label="Expected households" value={households} onChangeText={setHouseholds}
          placeholder="40" required helper="A rough count is fine. It drives catering and seating." />
        <ChipMultiSelect label="Road-closure permit" options={PERMIT_STAGES} selected={permitStatus}
          onToggle={(next) => setPermitStatus(next.slice(-1))}
          helper="Most councils need four to six weeks' notice." />
      </Section>

      <Section title="Food">
        <ToggleField label="Potluck" value={isPotluck} onValueChange={setIsPotluck}
          helper="Neighbours each bring a dish rather than one host catering." />
        {isPotluck ? (
          <ChipMultiSelect label="Categories to cover" options={POTLUCK}
            selected={potluckCategories} onToggle={setPotluckCategories}
            helper="Guests claim a category so you do not end up with nine desserts." />
        ) : null}
      </Section>

      <Section title="On the day">
        <ChipMultiSelect label="Activities" options={ACTIVITIES} selected={activities} onToggle={setActivities} />
        <TextField label="Noise curfew" value={noiseCurfew} onChangeText={setNoiseCurfew}
          placeholder="e.g. music off by 10pm" helper="Usually set by the same permit as the closure." />
        <TextField label="Wet weather plan" value={rainPlan} onChangeText={setRainPlan} multiline
          placeholder="Move to the community hall, or postpone to the following Saturday" />
      </Section>
    </ScrollView>
  );
}
