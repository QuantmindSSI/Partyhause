import React from 'react';
import BirthdayForm from './BirthdayForm';
import WeddingForm from './WeddingForm';

interface TemplateFormRouterProps {
  templateId: string;
  templateName: string;
  initialData?: Record<string, any>;
  onChange: (data: Record<string, any>) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function TemplateFormRouter({
  templateId,
  templateName,
  initialData = {},
  onChange,
  onBack,
  onNext
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
        />
      );

    case 'kids-birthday':
      // TODO: Create KidsBirthdayForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">🎈 Kids Birthday Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'wedding':
      return (
        <WeddingForm
          initialData={initialData}
          onChange={onChange}
          onBack={onBack}
          onNext={onNext}
        />
      );

    case 'conference':
      // TODO: Create ConferenceForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">🎤 Conference Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'product-launch':
      // TODO: Create ProductLaunchForm  
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">🚀 Product Launch Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'fundraiser':
      // TODO: Create FundraiserForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">💰 Fundraiser Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'festival':
      // TODO: Create FestivalForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">🎵 Festival Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'travel':
      // TODO: Create TravelForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">✈️ Group Travel Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'block-party':
      // TODO: Create BlockPartyForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">🏘️ Block Party Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'class':
    case 'workshop':
      // TODO: Create ClassWorkshopForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">📚 Class/Workshop Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    case 'hackathon':
      // TODO: Create HackathonForm
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">💻 Hackathon Form</h3>
          <p className="text-gray-600 mb-4">Coming soon! For now, continue with basic setup.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );

    default:
      return (
        <div className="text-center p-8">
          <h3 className="text-lg font-semibold mb-2">Template Form</h3>
          <p className="text-gray-600 mb-4">Template form for {templateName} is not implemented yet.</p>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-4 py-2 border rounded">Back</button>
            <button onClick={onNext} className="px-4 py-2 bg-blue-500 text-white rounded">Continue</button>
          </div>
        </div>
      );
  }
}