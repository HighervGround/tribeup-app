import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface ProgressCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  max: number;
  icon?: React.ReactNode;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  showValue?: boolean;
  showPercentage?: boolean;
  tooltip?: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Progress Card Component
 * 
 * Displays a progress bar with label, value, and optional icon.
 * 
 * @example
 * ```tsx
 * <ProgressCard
 *   label="Win Rate"
 *   value={35}
 *   max={50}
 *   icon={<Trophy />}
 *   showPercentage
 *   color="success"
 * />
 * ```
 */
export function ProgressCard({
  label,
  value,
  max,
  icon,
  color = 'default',
  showValue = true,
  showPercentage = false,
  tooltip,
  unit,
  size = 'md',
  className,
  ...props
}: ProgressCardProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  const colorClasses = {
    default: 'bg-primary',
    primary: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    destructive: 'bg-destructive',
  }[color];

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[size];

  return (
    <Card className={cn(sizeClasses, className)} {...props}>
      <CardContent className="p-0 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className="flex items-center justify-center text-muted-foreground">
                {icon}
              </div>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {showValue && (
            <span className="text-sm font-semibold">
              {value.toLocaleString()}
              {unit && ` ${unit}`}
              {showPercentage && ` (${percentage.toFixed(0)}%)`}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <Progress value={percentage} className="h-2" />
          {showPercentage && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>0%</span>
              <span>{percentage.toFixed(0)}%</span>
              <span>100%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

