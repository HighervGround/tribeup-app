import React, { useState, useRef } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { PhotoService } from '@/domains/users/services/photoService';

interface SimplePhotoUploadProps {
  gameId: string;
  onPhotoUploaded?: (photo: any) => void;
}

export function SimplePhotoUpload({ gameId, onPhotoUploaded }: SimplePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection (drag, drop, or click)
  const handleFiles = async (files: FileList) => {
    if (files.length === 0) return;
    
    const file = files[0];
    await uploadPhoto(file);
  };

  // Upload photo with auto-compression
  const uploadPhoto = async (file: File) => {
    setUploading(true);
    try {
      // Auto-compress if needed
      const compressedFile = await PhotoService.compressImage(file);
      
      // Upload without requiring caption
      const photo = await PhotoService.uploadGamePhoto(gameId, compressedFile);
      
      if (photo && onPhotoUploaded) {
        onPhotoUploaded(photo);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Click to upload
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card 
      className={`p-6 border-2 border-dashed transition-colors cursor-pointer ${
        dragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
      />
      
      <div className="text-center">
        {uploading ? (
          <div className="flex flex-col items-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Uploading photo...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="flex space-x-2">
              <Camera className="h-8 w-8 text-gray-400" />
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium">Share a photo from the game!</p>
            <p className="text-xs text-gray-500">
              Drag & drop, click to browse, or take a photo
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Simple photo gallery for viewing uploaded photos
export function SimplePhotoGallery({ gameId }: { gameId: string }) {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadPhotos();
  }, [gameId]);

  const loadPhotos = async () => {
    const gamePhotos = await PhotoService.getGamePhotos(gameId);
    setPhotos(gamePhotos);
    setLoading(false);
  };

  const handlePhotoUploaded = (newPhoto: any) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

  if (loading) {
    return <div className="text-center py-4">Loading photos...</div>;
  }

  return (
    <div className="space-y-4">
      <SimplePhotoUpload gameId={gameId} onPhotoUploaded={handlePhotoUploaded} />
      
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative aspect-square">
              <img
                src={photo.photo_url}
                alt={photo.caption || 'Game photo'}
                className="w-full h-full object-cover rounded-lg"
              />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {photos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No photos yet. Be the first to share!</p>
        </div>
      )}
    </div>
  );
}
