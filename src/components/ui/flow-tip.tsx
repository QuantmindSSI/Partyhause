import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Button } from './button';

interface FlowTip {
  step: string;
  title: string;
  description: string;
  action?: string;
}

const FLOW_TIPS: Record<string, FlowTip> = {
  template: {
    step: 'Choose Template',
    title: 'Pick a template that matches your vibe',
    description: "Don't worry - you can customize everything later! Templates just give you a head start with pre-filled details.",
    action: 'Select any template to continue'
  },
  details: {
    step: 'Event Details',
    title: 'Make it personal',
    description: 'Add specific details about your event. The more info you provide now, the better your invitations will look!',
    action: 'Fill in the required fields'
  },
  form: {
    step: 'Basic Info',
    title: 'The essentials',
    description: 'Date, time, and location are all your guests really need to know. Add a Spotify playlist to set the mood!',
    action: 'Complete the form to create your event'
  },
  timeline: {
    step: 'Timeline',
    title: 'Plan the perfect flow',
    description: 'Break your event into blocks so guests know what to expect. Think: cocktails → dinner → dancing!',
    action: 'Add timeline blocks or skip for now'
  },
  'invite-template': {
    step: 'Invitation Design',
    title: 'Choose your style',
    description: 'Pick a design that matches your event personality. All templates use beautiful solid colors - no gradients!',
    action: 'Select an invitation template'
  },
  'invite-customize': {
    step: 'Customize Invite',
    title: 'Add your personal touch',
    description: 'Customize the message, colors, and details. Preview how your email will look before sending!',
    action: 'Customize and save or send'
  },
  curate: {
    step: 'Success!',
    title: '🎉 Your event is ready!',
    description: 'Now you can send invitations, manage your guest list, or add more details like music and games.',
    action: 'Choose your next step'
  }
};

interface FlowTipProps {
  currentStep: string;
  onDismiss?: () => void;
}

export function FlowTip({ currentStep, onDismiss }: FlowTipProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const tip = FLOW_TIPS[currentStep];

  if (!tip || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm mb-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1 flex items-center">
                {tip.title}
                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {tip.step}
                </span>
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {tip.description}
              </p>
              {tip.action && (
                <div className="flex items-center text-sm text-blue-600 font-medium">
                  <ArrowRight className="w-4 h-4 mr-1" />
                  {tip.action}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss tip"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Inline quick tip (smaller version)
export function QuickTip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-start space-x-2 text-sm text-gray-600 ${className}`}>
      <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}
