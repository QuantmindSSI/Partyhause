import React from 'react';
import { View } from 'react-native';
import AdultBirthdayForm from './templates/AdultBirthdayForm';
import KidsBirthdayForm from './templates/KidsBirthdayForm';
import WeddingForm from './templates/WeddingForm';
import FestivalForm from './templates/FestivalForm';
import ConferenceForm from './templates/ConferenceForm';
import ProductLaunchForm from './templates/ProductLaunchForm';
import FundraiserForm from './templates/FundraiserForm';
import TravelForm from './templates/TravelForm';
import BlockPartyForm from './templates/BlockPartyForm';
import ClassReunionForm from './templates/ClassReunionForm';
import HackathonForm from './templates/HackathonForm';
import CorporateForm from './templates/CorporateForm';

export interface TemplateFormData {
  [key: string]: any;
}

export interface TemplateFormProps {
  template: string;
  initialData?: TemplateFormData;
  onChange: (data: TemplateFormData) => void;
  onValidation: (isValid: boolean) => void;
}

export default function TemplateForm({ template, initialData = {}, onChange, onValidation }: TemplateFormProps) {
  // Route to the appropriate template form
  const renderTemplateForm = () => {
    switch (template) {
      case 'birthday':
        return <AdultBirthdayForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'kids-birthday':
        return <KidsBirthdayForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'wedding':
        return <WeddingForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'festival':
        return <FestivalForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'conference':
        return <ConferenceForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'product-launch':
        return <ProductLaunchForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'fundraiser':
        return <FundraiserForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'travel':
        return <TravelForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'block-party':
        return <BlockPartyForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'class':
        return <ClassReunionForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'hackathon':
        return <HackathonForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      case 'corporate':
        return <CorporateForm initialData={initialData} onChange={onChange} onValidation={onValidation} />;
      
      default:
        // No template-specific form, return empty view
        return <View />;
    }
  };

  return renderTemplateForm();
}
