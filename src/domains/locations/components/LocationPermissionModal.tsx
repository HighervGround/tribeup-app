import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { MapPin, Shield, Users, Eye, X } from 'lucide-react';

interface LocationPermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAllow: () => void;
  onDeny: () => void;
}

interface BenefitItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function BenefitItem({ icon, title, description }: BenefitItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-sm">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function LocationPermissionModal({
  open,
  onOpenChange,
  onAllow,
  onDeny,
}: LocationPermissionModalProps) {
  const handleAllow = () => {
    onAllow();
  };

  const handleDeny = () => {
    onDeny();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">Enable Location Access</DialogTitle>
          <DialogDescription className="text-base">
            TribeUp uses your location to help you find sports activities and players near you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <h3 className="font-semibold text-sm text-center mb-3">Why we need your location</h3>
          
          <h4 className="font-semibold text-sm text-center mb-3">Why we need your location</h4>
            <BenefitItem
              icon={<Users className="w-5 h-5 text-primary" />}
              title="Find Nearby Games"
              description="Discover pickup games and sports activities happening close to you in real-time."
            />
            
            <BenefitItem
              icon={<MapPin className="w-5 h-5 text-primary" />}
              title="Sort by Distance"
              description="See games sorted by how far they are, making it easy to find convenient locations."
            />
            
            <BenefitItem
              icon={<Eye className="w-5 h-5 text-primary" />}
              title="Local Recommendations"
              description="Get personalized suggestions for venues and activities in your area."
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 mb-2">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium mb-1">Your Privacy Matters</p>
              <ul className="space-y-0.5 list-disc list-inside">
                <li>Your exact location is never shared with other users</li>
                <li>Location data is only used to find nearby activities</li>
                <li>You can disable location access anytime in settings</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleAllow} className="w-full">
            <MapPin className="w-4 h-4 mr-2" />
            Allow Location Access
          </Button>
          <Button variant="ghost" onClick={handleDeny} className="w-full">
            <X className="w-4 h-4 mr-2" />
            Not Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
