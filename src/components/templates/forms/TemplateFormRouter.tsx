import React from 'react';
import BirthdayForm from './BirthdayForm';
import WeddingForm from './WeddingForm';
import KidsBirthdayForm from './KidsBirthdayForm';
import ConferenceForm from './ConferenceForm';
import ProductLaunchForm from './ProductLaunchForm';
import FundraiserForm from './FundraiserForm';
import FestivalForm from './FestivalForm';
import TravelForm from './TravelForm';
import BlockPartyForm from './BlockPartyForm';
import WorkshopForm from './WorkshopForm';
import HackathonForm from './HackathonForm';

interface TemplateFormRouterProps {
  templateId: string;
  templateName: string;
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onBack: () => void;
  onNext: () => void;
  eventDescription: string;
  onDescriptionChange: (value: string) => void;
}

export default function TemplateFormRouter({
  templateId,
  templateName,
  initialData = {},
  onChange,
  onBack,
  onNext,
  eventDescription,
  onDescriptionChange
}: TemplateFormRouterProps) {
  // Route to specific template forms
  switch (templateId) {
    case 'birthday':
    case 'adult-birthday':
      return (
        <BirthdayForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'kids-birthday':
      return (
        <KidsBirthdayForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'wedding':
      return (
        <WeddingForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'conference':
      return (
        <ConferenceForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'product-launch':
      return (
        <ProductLaunchForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'fundraiser':
      return (
        <FundraiserForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'festival':
      return (
        <FestivalForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'travel':
      return (
        <TravelForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'block-party':
      return (
        <BlockPartyForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'class':
    case 'workshop':
      return (
        <WorkshopForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    case 'hackathon':
      return (
        <HackathonForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
          eventDescription={eventDescription}
          onDescriptionChange={onDescriptionChange}
        />
      );

    default:
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">Template Form</h3>
          <p className="text-gray-600 mb-4">Template form for {templateName} is not implemented yet.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-orange-500 text-white rounded">Continue</button>
          </div>
        </div>
      );
  }
}