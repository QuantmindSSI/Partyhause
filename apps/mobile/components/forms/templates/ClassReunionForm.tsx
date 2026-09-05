import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { TemplateFormData } from '../TemplateForm';
import {
  Section, TextField, NumberField, ToggleField, ChipMultiSelect, RepeaterField,
} from './fields';
import { cleanList, styles } from './fieldStyles';

interface ClassReunionFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const MEMORABILIA = ['Yearbooks', 'Photo slideshow', 'Trophy cabinet', 'Old uniforms', 'Time capsule', 'Class video'] as const;
const DRESS_CODE = ['Casual', 'Smart casual', 'Cocktail', 'Black tie', 'Throwback to the era'] as const;

export default function ClassReunionForm({ initialData = {}, onChange, onValidation }: ClassReunionFormProps) {
  const [school, setSchool] = useState<string>(initialData.school_name || '');
  const [gradYear, setGradYear] = useState<string>(initialData.graduation_year?.toString() || '');
  const [classSize, setClassSize] = useState<string>(initialData.class_size?.toString() || '');
  const [memorabilia, setMemorabilia] = useState<string[]>(initialData.memorabilia || []);
  const [dressCode, setDressCode] = useState<string[]>(initialData.dress_code ? [initialData.dress_code] : []);
  const [committee, setCommittee] = useState<string[]>(initialData.committee?.length ? initialData.committee : ['']);
  const [hasMemorial, setHasMemorial] = useState<boolean>(initialData.has_memorial ?? false);
  const [memorialNames, setMemorialNames] = useState<string[]>(initialData.memorial_names?.length ? initialData.memorial_names : ['']);

  // A four-digit year inside a plausible range. Rejects typos like 199 or 20255
  // rather than letting them reach the payload and fail server-side.
  const yearNum = parseInt(gradYear || '0', 10);
  const currentYear = new Date().getFullYear();
  const yearValid = /^\d{4}$/.test(gradYear) && yearNum >= 1900 && yearNum <= currentYear;

  useEffect(() => {
    onChange({
      school_name: school.trim(),
      graduation_year: yearValid ? yearNum : null,
      class_size: classSize ? parseInt(classSize, 10) : null,
      memorabilia,
      dress_code: dressCode[0] ?? null,
      committee: cleanList(committee),
      has_memorial: hasMemorial,
      memorial_names: hasMemorial ? cleanList(memorialNames) : [],
    });
    onValidation(school.trim().length > 0 && yearValid);
  }, [school, gradYear, classSize, memorabilia, dressCode, committee, hasMemorial, memorialNames, yearValid, yearNum]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="The class">
        <TextField label="School or university" value={school} onChangeText={setSchool}
          placeholder="e.g. Riverside High" required />
        <NumberField label="Graduation year" value={gradYear} onChangeText={setGradYear}
          placeholder={String(currentYear - 20)} required
          helper={yearValid || gradYear === '' ? 'Used to title the event and find classmates.' : `Enter a four-digit year between 1900 and ${currentYear}.`} />
        <NumberField label="Class size" value={classSize} onChangeText={setClassSize}
          placeholder="120" helper="Roughly how many graduated. Sets expectations for turnout." />
      </Section>

      <Section title="The evening">
        <ChipMultiSelect label="Dress code" options={DRESS_CODE} selected={dressCode}
          onToggle={(next) => setDressCode(next.slice(-1))} />
        <ChipMultiSelect label="Memorabilia to bring" options={MEMORABILIA}
          selected={memorabilia} onToggle={setMemorabilia} />
      </Section>

      <Section title="Organising">
        <RepeaterField label="Committee" rows={committee} onChange={setCommittee}
          placeholder="Name" addLabel="Add committee member"
          helper="People helping organise. They can be given co-host access later." />
        <ToggleField label="Memorial tribute" value={hasMemorial} onValueChange={setHasMemorial}
          helper="A moment for classmates who have died. Handled quietly in the running order." />
        {hasMemorial ? (
          <RepeaterField label="Names to remember" rows={memorialNames} onChange={setMemorialNames}
            placeholder="Name" addLabel="Add a name" />
        ) : null}
      </Section>
    </ScrollView>
  );
}
