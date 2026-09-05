import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { TemplateFormData } from '../TemplateForm';
import {
  Section, TextField, NumberField, ToggleField, ChipMultiSelect, RepeaterField,
} from './fields';
import { cleanList, styles } from './fieldStyles';

interface CorporateFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const OBJECTIVES = ['Team building', 'Training', 'Strategy day', 'Celebration', 'Client hosting', 'All-hands'] as const;
const AV = ['Projector', 'Microphones', 'Video conferencing', 'Livestream', 'Recording', 'Stage lighting'] as const;

export default function CorporateForm({ initialData = {}, onChange, onValidation }: CorporateFormProps) {
  const [company, setCompany] = useState<string>(initialData.company_name || '');
  const [department, setDepartment] = useState<string>(initialData.department || '');
  const [attendees, setAttendees] = useState<string>(initialData.attendee_count?.toString() || '');
  const [objectives, setObjectives] = useState<string[]>(initialData.objectives || []);
  const [budgetCode, setBudgetCode] = useState<string>(initialData.budget_code || '');
  const [catering, setCatering] = useState<boolean>(initialData.catering_required ?? false);
  const [dietary, setDietary] = useState<string>(initialData.dietary_requirements || '');
  const [av, setAv] = useState<string[]>(initialData.av_requirements || []);
  const [agenda, setAgenda] = useState<string[]>(initialData.agenda?.length ? initialData.agenda : ['']);

  useEffect(() => {
    onChange({
      company_name: company.trim(),
      department: department.trim(),
      attendee_count: attendees ? parseInt(attendees, 10) : null,
      objectives,
      budget_code: budgetCode.trim(),
      catering_required: catering,
      dietary_requirements: catering ? dietary.trim() : '',
      av_requirements: av,
      agenda: cleanList(agenda),
    });
    // Company, headcount and a stated purpose. Without a purpose this is
    // indistinguishable from a generic event and the template earns nothing.
    onValidation(
      company.trim().length > 0 &&
      parseInt(attendees || '0', 10) > 0 &&
      objectives.length > 0,
    );
  }, [company, department, attendees, objectives, budgetCode, catering, dietary, av, agenda]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="Who it is for">
        <TextField label="Company" value={company} onChangeText={setCompany}
          placeholder="e.g. Northwind Ltd" required />
        <TextField label="Department or team" value={department} onChangeText={setDepartment}
          placeholder="e.g. Engineering" />
        <NumberField label="Expected attendees" value={attendees} onChangeText={setAttendees}
          placeholder="30" required helper="Drives room size, catering and AV." />
      </Section>

      <Section title="Purpose">
        <ChipMultiSelect label="Objectives" options={OBJECTIVES} selected={objectives}
          onToggle={setObjectives} required helper="Pick every one that applies." />
        <RepeaterField label="Agenda" rows={agenda} onChange={setAgenda}
          placeholder="e.g. 09:30 Opening remarks" addLabel="Add agenda item"
          helper="Becomes the event timeline. You can reorder it afterwards." />
      </Section>

      <Section title="Logistics">
        <ChipMultiSelect label="AV requirements" options={AV} selected={av} onToggle={setAv} />
        <ToggleField label="Catering required" value={catering} onValueChange={setCatering} />
        {catering ? (
          <TextField label="Dietary requirements" value={dietary} onChangeText={setDietary} multiline
            placeholder="e.g. 4 vegetarian, 1 coeliac, 2 nut allergy"
            helper="Collected per guest later. This is the summary for the caterer." />
        ) : null}
        <TextField label="Budget or cost code" value={budgetCode} onChangeText={setBudgetCode}
          placeholder="e.g. FIN-2026-114" helper="Recorded on the event for finance. Not shown to guests." />
      </Section>
    </ScrollView>
  );
}
