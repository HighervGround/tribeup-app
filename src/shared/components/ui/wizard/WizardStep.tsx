import * as React from 'react';
import { cn } from '@/shared/utils/utils';

export interface WizardStepProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wizard Step Component
 * 
 * Container for individual wizard step content.
 * 
 * @example
 * ```tsx
 * <WizardStep
 *   title="Step 1"
 *   description="Enter your information"
 * >
 *   <FormContent />
 * </WizardStep>
 * ```
 */
export function WizardStep({
  title,
  description,
  children,
  className,
  ...props
}: WizardStepProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {title && (
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">{title}</h2>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

