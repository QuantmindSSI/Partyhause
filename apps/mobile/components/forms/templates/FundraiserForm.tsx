import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { TemplateFormData } from '../TemplateForm';
import {
  Section, TextField, NumberField, ToggleField, ChipMultiSelect, RepeaterField,
} from './fields';
import { cleanList, styles } from './fieldStyles';

interface FundraiserFormProps {
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

const REVENUE = ['Ticket sales', 'Silent auction', 'Live auction', 'Raffle', 'Direct donations', 'Sponsorship', 'Merchandise'] as const;
const CAUSE_AREAS = ['Health', 'Education', 'Environment', 'Animals', 'Community', 'Arts', 'Emergency relief'] as const;

export default function FundraiserForm({ initialData = {}, onChange, onValidation }: FundraiserFormProps) {
  const [beneficiary, setBeneficiary] = useState<string>(initialData.beneficiary || '');
  const [causeArea, setCauseArea] = useState<string[]>(initialData.cause_area ? [initialData.cause_area] : []);
  const [goalAmount, setGoalAmount] = useState<string>(initialData.goal_amount?.toString() || '');
  const [currency, setCurrency] = useState<string>(initialData.currency || 'GBP');
  const [revenueStreams, setRevenueStreams] = useState<string[]>(initialData.revenue_streams || []);
  const [isRegistered, setIsRegistered] = useState<boolean>(initialData.is_registered_charity ?? false);
  const [charityNumber, setCharityNumber] = useState<string>(initialData.charity_number || '');
  const [sponsors, setSponsors] = useState<string[]>(initialData.sponsors?.length ? initialData.sponsors : ['']);
  const [impactStatement, setImpactStatement] = useState<string>(initialData.impact_statement || '');

  useEffect(() => {
    onChange({
      beneficiary: beneficiary.trim(),
      cause_area: causeArea[0] ?? null,
      goal_amount: goalAmount ? parseInt(goalAmount, 10) : null,
      currency: currency.trim().toUpperCase(),
      revenue_streams: revenueStreams,
      is_registered_charity: isRegistered,
      charity_number: isRegistered ? charityNumber.trim() : '',
      sponsors: cleanList(sponsors),
      impact_statement: impactStatement.trim(),
    });
    // Who benefits, how much is being raised, and at least one way of raising
    // it. A fundraiser without a revenue stream is just an event.
    onValidation(
      beneficiary.trim().length > 0 &&
      parseInt(goalAmount || '0', 10) > 0 &&
      revenueStreams.length > 0,
    );
  }, [beneficiary, causeArea, goalAmount, currency, revenueStreams, isRegistered, charityNumber, sponsors, impactStatement]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="The cause">
        <TextField label="Beneficiary" value={beneficiary} onChangeText={setBeneficiary}
          placeholder="e.g. Riverside Children's Hospice" required
          helper="Named on the invitation and on every donation prompt." />
        <ChipMultiSelect label="Cause area" options={CAUSE_AREAS} selected={causeArea}
          onToggle={(next) => setCauseArea(next.slice(-1))} />
        <TextField label="Impact statement" value={impactStatement} onChangeText={setImpactStatement} multiline
          placeholder="e.g. GBP 50 funds one night of respite care"
          helper="Concrete beats abstract. Donors give more when they can picture the result." />
      </Section>

      <Section title="The target">
        <NumberField label="Fundraising goal" value={goalAmount} onChangeText={setGoalAmount}
          placeholder="10000" required helper="Whole units, no decimals. Shown as a progress bar to guests." />
        <TextField label="Currency" value={currency} onChangeText={setCurrency}
          placeholder="GBP" helper="Three-letter code." />
        <ChipMultiSelect label="How you will raise it" options={REVENUE}
          selected={revenueStreams} onToggle={setRevenueStreams} required />
      </Section>

      <Section title="Governance">
        <ToggleField label="Registered charity" value={isRegistered} onValueChange={setIsRegistered}
          helper="Affects gift aid and what you are legally required to display." />
        {isRegistered ? (
          <TextField label="Charity number" value={charityNumber} onChangeText={setCharityNumber}
            placeholder="e.g. 1234567" helper="Printed on receipts and the event page." />
        ) : null}
        <RepeaterField label="Sponsors" rows={sponsors} onChange={setSponsors}
          placeholder="Organisation name" addLabel="Add sponsor" />
      </Section>
    </ScrollView>
  );
}
