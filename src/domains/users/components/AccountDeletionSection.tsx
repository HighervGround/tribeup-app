import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { ConfirmDeleteModal } from '@/shared/components/common/ConfirmDeleteModal';
import { deleteUserAccount } from '@/domains/users/services/accountDeletion';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';
import { Trash2, AlertTriangle } from 'lucide-react';

export function AccountDeletionSection() {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteUserAccount();
      
      if (result.success) {
        // Clear the app state
        setUser(null);
        
        toast.success('Your account has been deleted successfully');
        
        // Navigate to the public home page
        navigate('/', { replace: true });
      } else {
        toast.error(result.error || 'Failed to delete account. Please try again.');
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Account deletion error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
      setIsModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const deletionConsequences = [
    'Your profile and all personal information',
    'All games you have created',
    'Your game participation history',
    'All chat messages you have sent',
    'Your tribe memberships and created tribes',
    'All notifications and activity history',
    'Your friends and connections',
  ];

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="w-5 h-5" aria-hidden="true" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Deleting your account will permanently remove all your data, including your profile, 
            games, messages, and activity history. This action cannot be undone.
          </AlertDescription>
        </Alert>
        
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          <Button
            variant="destructive"
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
            Delete Account
          </Button>
        </div>

        <ConfirmDeleteModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          onConfirm={handleDeleteAccount}
          title="Delete Your Account?"
          description="This action is permanent and cannot be undone. All your data will be immediately and irreversibly deleted."
          confirmationText="DELETE"
          confirmationPlaceholder="Type DELETE to confirm"
          isLoading={isDeleting}
          consequences={deletionConsequences}
        />
      </CardContent>
    </Card>
  );
}
