import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Button } from '@/shared/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: React.ReactNode;
  isValid?: boolean;
  isOptional?: boolean;
}

export interface WizardProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  showProgress?: boolean;
  showNavigation?: boolean;
  allowSkip?: boolean;
  className?: string;
}

/**
 * Wizard Component
 * 
 * Multi-step form wizard with validation, progress indicator, and navigation.
 * 
 * @example
 * ```tsx
 * <Wizard
 *   steps={steps}
 *   currentStep={currentStep}
 *   onStepChange={setCurrentStep}
 *   onComplete={() => handleSubmit()}
 * />
 * ```
 */
export function Wizard({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  onCancel,
  showProgress = true,
  showNavigation = true,
  allowSkip = false,
  className,
  ...props
}: WizardProps) {
  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      if (onComplete) {
        onComplete();
      }
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      onStepChange(currentStep - 1);
    }
  };

  const canProceed = currentStepData?.isValid !== false || currentStepData?.isOptional || allowSkip;

  return (
    <div className={cn('flex flex-col h-full', className)} {...props}>
      {/* Progress Indicator */}
      {showProgress && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex flex-col items-center flex-1',
                  index < currentStep && 'text-primary',
                  index === currentStep && 'text-primary font-semibold',
                  index > currentStep && 'text-muted-foreground'
                )}
              >
                <div
                  className={cn(
                    'size-2 rounded-full mb-1 transition-colors',
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
                <span className="text-xs text-center truncate w-full">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="flex-1 overflow-auto">
        {currentStepData?.component}
      </div>

      {/* Navigation */}
      {showNavigation && (
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
          <div>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
              >
                Cancel
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isFirstStep && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
            )}
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
            >
              {isLastStep ? 'Complete' : 'Next'}
              {!isLastStep && <ChevronRight className="size-4 ml-1" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

