import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { 
  ArrowRight, 
  Users, 
  Calendar, 
  Trophy,
  MapPin,
  Sparkles,
  TrendingUp
} from 'lucide-react';

interface ValuePropositionScreenProps {
  onContinue: () => void;
}

/**
 * Value Proposition Screen for onboarding
 * Shows the platform's value immediately to increase user engagement
 */
export function ValuePropositionScreen({ onContinue }: ValuePropositionScreenProps) {
  const benefits = [
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: 'Find Players',
      description: 'Connect with sports enthusiasts near you',
      bgColor: 'bg-primary/10'
    },
    {
      icon: <Calendar className="w-6 h-6 text-secondary" />,
      title: 'Join Games',
      description: 'Discover pickup games happening today',
      bgColor: 'bg-secondary/10'
    },
    {
      icon: <Trophy className="w-6 h-6 text-success" />,
      title: 'Have Fun',
      description: 'Play sports and make new friends',
      bgColor: 'bg-success/10'
    }
  ];

  const socialProof = [
    { label: 'Active Players', value: '500+', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Games Weekly', value: '100+', icon: <Calendar className="w-4 h-4" /> },
    { label: 'Sports', value: '12+', icon: <Sparkles className="w-4 h-4" /> }
  ];

  return (
    <div className="flex flex-col items-center text-center space-y-8 py-4">
      {/* Hero Section */}
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <MapPin className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Welcome to TribeUp!
        </h1>
        
        <p className="text-lg text-muted-foreground max-w-sm">
          Your sports community awaits. Find games, meet players, and start playing today.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="w-full max-w-sm space-y-3">
        {benefits.map((benefit, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className={`w-12 h-12 ${benefit.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
              {benefit.icon}
            </div>
            <div className="text-left">
              <h3 className="font-semibold">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Social Proof */}
      <div className="w-full max-w-sm">
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-muted/30">
          {socialProof.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                {stat.icon}
                <span className="text-xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <Button 
        onClick={onContinue}
        size="lg"
        className="w-full max-w-sm h-12 text-base font-semibold"
      >
        Get Started
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}

export default ValuePropositionScreen;
