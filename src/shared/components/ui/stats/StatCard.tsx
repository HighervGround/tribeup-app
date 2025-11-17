import * as React from 'react';
import { cn } from '@/shared/utils/utils';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { ArrowUp, ArrowDown, Minus, Info } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

const statCardVariants = cva('', {
  variants: {
    size: {
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statCardVariants> {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    isPositive?: boolean;
  };
  color?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  tooltip?: string;
  onClick?: () => void;
}

/**
 * Stat Card Component
 * 
 * Displays a single statistic with icon, label, value, and optional trend indicator.
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Games Played"
 *   value={50}
 *   icon={<Activity />}
 *   trend={{ value: 12, isPositive: true, label: "vs last month" }}
 * />
 * ```
 */
export function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'default',
  tooltip,
  onClick,
  size = 'md',
  className,
  ...props
}: StatCardProps) {
  const colorClasses = {
    default: 'text-foreground',
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[color];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) {
      return <ArrowUp className="size-3 text-success" />;
    }
    if (trend.value < 0) {
      return <ArrowDown className="size-3 text-destructive" />;
    }
    return <Minus className="size-3 text-muted-foreground" />;
  };

  const content = (
    <Card
      className={cn(
        statCardVariants({ size }),
        onClick && 'cursor-pointer hover:shadow-medium transition-all duration-200',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <CardContent className="p-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={cn('flex items-center justify-center', colorClasses)}>
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
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <span className={cn('text-2xl font-bold', colorClasses)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>

        {/* Trend */}
        {trend && (
          <div className="flex items-center gap-1 text-xs">
            {getTrendIcon()}
            <span
              className={cn(
                trend.value > 0
                  ? 'text-success'
                  : trend.value < 0
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              )}
            >
              {Math.abs(trend.value)}%
              {trend.label && ` ${trend.label}`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return content;
}

