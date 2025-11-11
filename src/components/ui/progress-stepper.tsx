import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  label: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export function ProgressStepper({ steps, currentStep, completedSteps, className }: ProgressStepperProps) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);
  
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop: Horizontal Layout */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isUpcoming = index > currentIndex;
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                    isCompleted && "bg-orange-500 border-orange-500",
                    isCurrent && "bg-white border-orange-500 shadow-lg ring-4 ring-orange-100",
                    isUpcoming && "bg-gray-100 border-gray-300"
                  )}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : isCurrent ? (
                    <Circle className="w-5 h-5 text-orange-500 fill-orange-500" />
                  ) : (
                    <span className="text-gray-400 text-sm font-semibold">{index + 1}</span>
                  )}
                </motion.div>
                
                {/* Step Label */}
                <div className="mt-2 text-center max-w-[120px]">
                  <p className={cn(
                    "text-sm font-semibold transition-colors",
                    isCurrent && "text-orange-500",
                    isCompleted && "text-gray-900",
                    isUpcoming && "text-gray-400"
                  )}>
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                  )}
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 relative">
                  <div className="absolute inset-0 bg-gray-200" />
                  <motion.div
                    className="absolute inset-0 bg-orange-500"
                    initial={{ width: '0%' }}
                    animate={{ width: isCompleted ? '100%' : '0%' }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Mobile: Vertical Layout */}
      <div className="md:hidden space-y-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = step.id === currentStep;
          const isUpcoming = index > currentIndex;
          
          return (
            <div key={step.id} className="flex items-start">
              {/* Step Circle */}
              <motion.div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0",
                  isCompleted && "bg-orange-500 border-orange-500",
                  isCurrent && "bg-white border-orange-500 shadow-lg ring-2 ring-orange-100",
                  isUpcoming && "bg-gray-100 border-gray-300"
                )}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 text-white" />
                ) : isCurrent ? (
                  <Circle className="w-4 h-4 text-orange-500 fill-orange-500" />
                ) : (
                  <span className="text-gray-400 text-xs font-semibold">{index + 1}</span>
                )}
              </motion.div>
              
              {/* Step Info */}
              <div className="ml-3 flex-1">
                <p className={cn(
                  "text-sm font-semibold transition-colors",
                  isCurrent && "text-orange-500",
                  isCompleted && "text-gray-900",
                  isUpcoming && "text-gray-400"
                )}>
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                )}
              </div>
              
              {/* Connector Line (Mobile) */}
              {index < steps.length - 1 && (
                <div className="absolute left-4 mt-8 w-0.5 h-8 -ml-0.5">
                  <div className="h-full bg-gray-200" />
                  {isCompleted && (
                    <motion.div
                      className="absolute inset-0 bg-orange-500"
                      initial={{ height: '0%' }}
                      animate={{ height: '100%' }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function CompactProgressBar({ 
  current, 
  total,
  label 
}: { 
  current: number; 
  total: number;
  label?: string;
}) {
  const percentage = (current / total) * 100;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          {label || 'Progress'}
        </span>
        <span className="text-sm text-gray-500">
          {current} of {total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
