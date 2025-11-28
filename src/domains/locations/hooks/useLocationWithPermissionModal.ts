import { useState, useCallback } from 'react';
import { useLocation, LocationState } from './useLocation';

interface UseLocationWithPermissionModalResult extends ReturnType<typeof useLocation> {
  showPermissionModal: boolean;
  setShowPermissionModal: (show: boolean) => void;
  requestLocationWithExplanation: () => void;
  handlePermissionAllow: () => Promise<void>;
  handlePermissionDeny: () => void;
}

/**
 * Hook that extends useLocation with permission modal support.
 * Shows an explanation modal before requesting browser location permission.
 */
export function useLocationWithPermissionModal(options?: Parameters<typeof useLocation>[0]): UseLocationWithPermissionModalResult {
  const location = useLocation({ ...options, autoRequest: false });
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  /**
   * Opens the permission explanation modal instead of directly requesting location.
   * Use this when you want to show the user an explanation before requesting permission.
   */
  const requestLocationWithExplanation = useCallback(() => {
    // If permission is already granted, just request location directly
    if (location.permission === 'granted') {
      location.requestLocation();
      return;
    }
    
    // If permission was denied, we can still show the modal to let user try again
    // or understand why they might want to enable it in settings
    setShowPermissionModal(true);
  }, [location]);

  /**
   * Called when user clicks "Allow" in the permission modal.
   * This triggers the actual browser location permission request.
   */
  const handlePermissionAllow = useCallback(async () => {
    setShowPermissionModal(false);
    await location.requestLocation();
  }, [location]);

  /**
   * Called when user clicks "Not Now" in the permission modal.
   * Simply closes the modal without requesting permission.
   */
  const handlePermissionDeny = useCallback(() => {
    setShowPermissionModal(false);
  }, []);

  return {
    ...location,
    showPermissionModal,
    setShowPermissionModal,
    requestLocationWithExplanation,
    handlePermissionAllow,
    handlePermissionDeny,
  };
}
