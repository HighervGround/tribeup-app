import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTribe } from '../hooks/useTribes';
import { useUpdateTribe, useDeleteTribe } from '../hooks/useTribes';
import { useTribeRole } from '../hooks/useTribeMembers';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { ArrowLeft, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner';
import { DEFAULT_SPORTS } from '@/domains/games/components/SportPicker';
import { supabase } from '@/core/database/supabase';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';

export function TribeEdit() {
  const { tribeId } = useParams<{ tribeId: string }>();
  const navigate = useNavigate();
  const { user } = useAppStore();
  const { data: tribe, isLoading } = useTribe(tribeId || '');
  const { data: userRole } = useTribeRole(tribeId || '', user?.id);
  const updateTribe = useUpdateTribe();
  const deleteTribe = useDeleteTribe();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    activity: '',
    is_public: true,
    location: '',
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (tribe) {
      setFormData({
        name: tribe.name || '',
        description: tribe.description || '',
        activity: tribe.activity || '',
        is_public: tribe.is_public ?? true,
        location: tribe.location || '',
      });
      setAvatarPreview(tribe.avatar_url || null);
      setCoverPreview(tribe.cover_image_url || null);
    }
  }, [tribe]);

  const canEdit = userRole === 'admin' || tribe?.creator_id === user?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!tribe) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate('/app/tribes')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tribes
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Tribe not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-4">
        <Button variant="ghost" onClick={() => navigate(`/tribe/${tribeId}`)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tribe
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">You don't have permission to edit this tribe</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tribes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('tribes').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.activity) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      let avatarUrl = tribe.avatar_url;
      let coverUrl = tribe.cover_image_url;

      // Upload images if new files selected
      if (avatarFile) {
        const uploaded = await uploadImage(avatarFile, `avatars/${tribeId}`);
        if (uploaded) avatarUrl = uploaded;
      }

      if (coverFile) {
        const uploaded = await uploadImage(coverFile, `covers/${tribeId}`);
        if (uploaded) coverUrl = uploaded;
      }

      await updateTribe.mutateAsync({
        tribeId: tribeId!,
        updates: {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          activity: formData.activity,
          is_public: formData.is_public,
          location: formData.location.trim() || null,
          avatar_url: avatarUrl || null,
          cover_image_url: coverUrl || null,
        },
      });

      navigate(`/tribe/${tribeId}`);
    } catch (error) {
      console.error('Error updating tribe:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTribe.mutateAsync(tribeId!);
      toast.success('Tribe deleted');
      navigate('/app/tribes');
    } catch (error) {
      console.error('Error deleting tribe:', error);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/tribe/${tribeId}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Edit Tribe</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <div className="relative h-32 w-full rounded-lg overflow-hidden border border-border">
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(tribe.cover_image_url || null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="cursor-pointer"
              />
            </div>

            {/* Avatar */}
            <div className="space-y-2">
              <Label>Avatar</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border border-border">
                  {avatarPreview ? (
                    <>
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-0 right-0"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(tribe.avatar_url || null);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="cursor-pointer flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
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
              <p className="text-xs text-muted-foreground">{formData.name.length}/50 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">
                Primary Activity <span className="text-destructive">*</span>
              </Label>
              <select
                id="activity"
                value={formData.activity}
                onChange={(e) => setFormData({ ...formData, activity: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Select an activity</option>
                {DEFAULT_SPORTS.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.icon} {sport.label}
                  </option>
                ))}
              </select>
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
                onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/tribe/${tribeId}`)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateTribe.isPending} className="flex-1">
            {updateTribe.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Delete Tribe */}
        {tribe.creator_id === user?.id && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Tribe
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the tribe and all its data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  );
}

export default TribeEdit;

