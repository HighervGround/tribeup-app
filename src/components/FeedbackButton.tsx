import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';

interface FeedbackButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showText?: boolean;
}

export function FeedbackButton({ 
  variant = 'outline', 
  size = 'default', 
  className = '',
  showText = true 
}: FeedbackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate('/feedback')}
      className={className}
    >
      <MessageSquare className="w-4 h-4" />
      {showText && <span className="ml-2">Feedback</span>}
    </Button>
  );
}
