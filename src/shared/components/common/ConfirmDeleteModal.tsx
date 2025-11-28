import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/components/ui/alert-dialog';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmationText: string;
  confirmationPlaceholder?: string;
  isLoading?: boolean;
  consequences?: string[];
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title = 'Delete Account',
  description = 'This action cannot be undone. This will permanently delete your account and remove all your data from our servers.',
  confirmationText,
  confirmationPlaceholder = 'Type DELETE to confirm',
  isLoading = false,
  consequences = [],
}: ConfirmDeleteModalProps) {
  const [inputValue, setInputValue] = useState('');
  
  const isConfirmationValid = inputValue.trim().toUpperCase() === confirmationText.trim().toUpperCase();

  const handleConfirm = () => {
    if (isConfirmationValid && !isLoading) {
      onConfirm();
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue(''); // Reset input when closing
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            </div>
            <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left pt-2">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {consequences.length > 0 && (
          <div className="space-y-2 py-2">
            <p className="text-sm font-medium text-destructive">
              The following will be permanently deleted:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              {consequences.map((consequence, index) => (
                <li key={index}>{consequence}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2 py-2">
          <Label htmlFor="confirmation-input" className="text-sm font-medium">
            Type <span className="font-bold text-destructive">{confirmationText}</span> to confirm
          </Label>
          <Input
            id="confirmation-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={confirmationPlaceholder}
            className="w-full"
            disabled={isLoading}
            aria-describedby="confirmation-hint"
            autoComplete="off"
          />
          <p id="confirmation-hint" className="text-xs text-muted-foreground">
            This helps prevent accidental deletion
          </p>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid || isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Deleting...' : 'Delete Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
