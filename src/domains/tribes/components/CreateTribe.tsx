import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTribe } from '../hooks/useTribes';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_SPORTS } from '@/domains/games/components/SportPicker';

export function CreateTribe() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const createTribe = useCreateTribe();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activity: '',
    is_public: true,
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      toast.error('You must be logged in to create a tribe');
      navigate('/login');
      return;
    }

    if (!formData.name.trim() || !formData.activity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newTribe = await createTribe.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        activity: formData.activity,
        is_public: formData.is_public,
        location: formData.location.trim() || null,
        creator_id: user.id,
      });

      navigate(`/tribe/${newTribe.id}`);
    } catch (error) {
      console.error('Error creating tribe:', error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tribes')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create New Tribe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tribe Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tribe Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., UF Basketball Club"
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/50 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">
                Primary Activity <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.activity}
                onValueChange={(value) => setFormData({ ...formData, activity: value })}
                required
              >
                <SelectTrigger id="activity" className="w-full">
                  {formData.activity ? (
                    <span className="flex items-center gap-2">
                      <span>
                        {DEFAULT_SPORTS.find((s) => s.value === formData.activity)?.icon}
                      </span>
                      <SelectValue>
                        {DEFAULT_SPORTS.find((s) => s.value === formData.activity)?.label}
                      </SelectValue>
                    </span>
                  ) : (
                    <SelectValue placeholder="Select an activity" />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_SPORTS.map((sport) => (
                    <SelectItem key={sport.value} value={sport.value}>
                      <span className="flex items-center gap-2">
                        <span className="text-base">{sport.icon}</span>
                        <span>{sport.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell people about your tribe..."
                maxLength={500}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Gainesville, FL"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="is_public">Public Tribe</Label>
                <p className="text-sm text-muted-foreground">
                  Anyone can find and join this tribe
                </p>
              </div>
              <Switch
                id="is_public"
                checked={formData.is_public}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_public: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tribes')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createTribe.isPending} className="flex-1">
            {createTribe.isPending ? 'Creating...' : 'Create Tribe'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateTribe;

