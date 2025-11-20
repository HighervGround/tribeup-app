import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Check } from 'lucide-react';

export interface WizardProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: Array<{ id: string; title: string }>;
  currentStep: number;
  completedSteps?: number[];
  variant?: 'dots' | 'bar' | 'steps';
  className?: string;
}

/**
 * Wizard Progress Component
 * 
 * Standalone progress indicator for wizard steps.
 * 
 * @example
 * ```tsx
 * <WizardProgress
 *   steps={steps}
 *   currentStep={2}
 *   completedSteps={[0, 1]}
 *   variant="steps"
 * />
 * ```
 */
export function WizardProgress({
  steps,
  currentStep,
  completedSteps = [],
  variant = 'bar',
  className,
  ...props
}: WizardProgressProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)} {...props}>
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'size-2 rounded-full transition-all',
              index < currentStep || completedSteps.includes(index)
                ? 'bg-primary'
                : index === currentStep
                ? 'bg-primary size-3'
                : 'bg-muted'
            )}
            aria-label={`Step ${index + 1}: ${step.title}`}
          />
        ))}
      </div>
    );
  }

  if (variant === 'steps') {
    return (
      <div className={cn('flex items-center justify-between', className)} {...props}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep || completedSteps.includes(index);
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'size-8 rounded-full flex items-center justify-center border-2 transition-all',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : isCurrent
                      ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'bg-background border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs text-center truncate w-full',
                    isCurrent ? 'font-semibold text-primary' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Bar variant (default)
  return (
    <div className={cn('space-y-2', className)} {...props}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="font-medium text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

