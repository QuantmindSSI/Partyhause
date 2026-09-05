import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { TemplateFormData } from '../TemplateForm';
import {
  Section, TextField, NumberField, ToggleField, ChipMultiSelect, RepeaterField,
} from './fields';
import { cleanList, styles } from './fieldStyles';

interface HackathonFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const TRACKS = ['AI / ML', 'Web', 'Mobile', 'Hardware / IoT', 'Games', 'Accessibility', 'Climate', 'Open'] as const;
const JUDGING = ['Technical difficulty', 'Originality', 'Design', 'Real-world impact', 'Completeness', 'Presentation'] as const;
const PROVIDED = ['Wifi', 'Power strips', 'Monitors', 'Meals', 'Snacks and coffee', 'Quiet room', 'Sleeping space'] as const;

export default function HackathonForm({ initialData = {}, onChange, onValidation }: HackathonFormProps) {
  const [theme, setTheme] = useState<string>(initialData.theme || '');
  const [durationHours, setDurationHours] = useState<string>(initialData.duration_hours?.toString() || '');
  const [maxTeamSize, setMaxTeamSize] = useState<string>(initialData.max_team_size?.toString() || '4');
  const [tracks, setTracks] = useState<string[]>(initialData.tracks || []);
  const [judgingCriteria, setJudgingCriteria] = useState<string[]>(initialData.judging_criteria || []);
  const [prizes, setPrizes] = useState<string[]>(initialData.prizes?.length ? initialData.prizes : ['']);
  const [mentorsAvailable, setMentorsAvailable] = useState<boolean>(initialData.mentors_available ?? false);
  const [mentors, setMentors] = useState<string[]>(initialData.mentors?.length ? initialData.mentors : ['']);
  const [provided, setProvided] = useState<string[]>(initialData.provided || []);
  const [codeOfConduct, setCodeOfConduct] = useState<string>(initialData.code_of_conduct_url || '');

  const hours = parseInt(durationHours || '0', 10);
  const teamSize = parseInt(maxTeamSize || '0', 10);

  useEffect(() => {
    onChange({
      theme: theme.trim(),
      duration_hours: hours > 0 ? hours : null,
      max_team_size: teamSize > 0 ? teamSize : null,
      tracks,
      judging_criteria: judgingCriteria,
      prizes: cleanList(prizes),
      mentors_available: mentorsAvailable,
      mentors: mentorsAvailable ? cleanList(mentors) : [],
      provided,
      code_of_conduct_url: codeOfConduct.trim(),
    });
    // Duration is the defining constraint of a hackathon, and judging criteria
    // have to be published before people start building, not after.
    onValidation(hours > 0 && teamSize > 0 && judgingCriteria.length > 0);
  }, [theme, hours, teamSize, tracks, judgingCriteria, prizes, mentorsAvailable, mentors, provided, codeOfConduct]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="The format">
        <TextField label="Theme" value={theme} onChangeText={setTheme}
          placeholder="e.g. Build something that helps your neighbourhood"
          helper="Optional. An open brief attracts more entries; a tight one produces better ones." />
        <NumberField label="Duration in hours" value={durationHours} onChangeText={setDurationHours}
          placeholder="48" required helper="Counted from the opening brief to the submission deadline." />
        <NumberField label="Maximum team size" value={maxTeamSize} onChangeText={setMaxTeamSize}
          placeholder="4" required />
        <ChipMultiSelect label="Tracks" options={TRACKS} selected={tracks} onToggle={setTracks} />
      </Section>

      <Section title="Judging">
        <ChipMultiSelect label="Criteria" options={JUDGING} selected={judgingCriteria}
          onToggle={setJudgingCriteria} required
          helper="Published to entrants up front. Judging on unstated criteria is how hackathons get a bad name." />
        <RepeaterField label="Prizes" rows={prizes} onChange={setPrizes}
          placeholder="e.g. First place: GBP 1,000 and mentoring" addLabel="Add prize" />
      </Section>

      <Section title="Support">
        <ToggleField label="Mentors available" value={mentorsAvailable} onValueChange={setMentorsAvailable} />
        {mentorsAvailable ? (
          <RepeaterField label="Mentors" rows={mentors} onChange={setMentors}
            placeholder="Name and speciality" addLabel="Add mentor" />
        ) : null}
        <ChipMultiSelect label="Provided on site" options={PROVIDED} selected={provided} onToggle={setProvided} />
        <TextField label="Code of conduct URL" value={codeOfConduct} onChangeText={setCodeOfConduct}
          placeholder="https://" keyboardType="url"
          helper="Linked from the invitation. Expected at any public event." />
      </Section>
    </ScrollView>
  );
}
