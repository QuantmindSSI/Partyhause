import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

/**
 * Consistent empty-state block: icon, title, supporting copy, optional CTA.
 * Use for "no data yet" screens instead of ad-hoc markup so every surface
 * communicates the same way.
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-6',
      className,
    )}
  >
    {Icon && (
      <div className="w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
    )}
    {action && (
      <Button onClick={action.onClick} className="mt-1">
        {action.label}
      </Button>
    )}
    {children}
  </div>
);

export default EmptyState;
