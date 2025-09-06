import { supabase } from './supabase';

export interface GamePhoto {
  id: string;
  game_id: string;
  user_id: string;
  photo_url: string;
  caption?: string;
  uploaded_at: string;
  uploader_name: string;
}

export class PhotoService {
  private static readonly BUCKET_NAME = 'game-photos';
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  // One-click upload - no validation needed, auto-compress
  static async quickUpload(gameId: string, file: File): Promise<GamePhoto | null> {
    try {
      // Auto-compress and upload in one step
      const compressedFile = await this.compressImage(file);
      return await this.uploadGamePhoto(gameId, compressedFile);
    } catch (error) {
      console.error('Quick upload failed:', error);
      return null;
    }
  }

  // Upload photo for a game
  static async uploadGamePhoto(
    gameId: string, 
    file: File, 
    caption?: string
  ): Promise<GamePhoto | null> {
    try {
      // Auto-validate and compress
      const processedFile = this.validateFile(file) ? file : await this.compressImage(file);
      if (!processedFile) {
        throw new Error('Invalid file type or size');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${gameId}/${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      // Get user profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

      const uploaderName = profile?.full_name || profile?.username || 'Anonymous';

      // Save photo record to database
      const { data: photoData, error: dbError } = await supabase
        .from('game_photos')
        .insert({
          game_id: gameId,
          user_id: user.id,
          photo_url: publicUrl,
          caption: caption || null,
          uploader_name: uploaderName
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return photoData;
    } catch (error) {
      console.error('Error uploading photo:', error);
      return null;
    }
  }

  // Get photos for a game
  static async getGamePhotos(gameId: string): Promise<GamePhoto[]> {
    try {
      const { data, error } = await supabase
        .from('game_photos')
        .select('*')
        .eq('game_id', gameId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching game photos:', error);
      return [];
    }
  }

  // Delete a photo (only by uploader or game creator)
  static async deletePhoto(photoId: string, gameId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user can delete (photo uploader or game creator)
      const { data: photo } = await supabase
        .from('game_photos')
        .select('user_id, photo_url')
        .eq('id', photoId)
        .single();

      const { data: game } = await supabase
        .from('games')
        .select('creator_id')
        .eq('id', gameId)
        .single();

      const canDelete = photo?.user_id === user.id || game?.creator_id === user.id;
      if (!canDelete) return false;

      // Delete from storage
      if (photo?.photo_url) {
        const fileName = this.extractFileNameFromUrl(photo.photo_url);
        if (fileName) {
          await supabase.storage
            .from(this.BUCKET_NAME)
            .remove([fileName]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('game_photos')
        .delete()
        .eq('id', photoId);

      return !error;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  }

  // Validate file before upload
  private static validateFile(file: File): boolean {
    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return false;
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return false;
    }

    return true;
  }

  // Extract filename from Supabase storage URL
  private static extractFileNameFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex(part => part === this.BUCKET_NAME);
      if (bucketIndex === -1) return null;
      
      return urlParts.slice(bucketIndex + 1).join('/');
    } catch {
      return null;
    }
  }

  // Compress image before upload (optional enhancement)
  static async compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Get file size limit text
  static getFileSizeLimit(): string {
    return `${this.MAX_FILE_SIZE / (1024 * 1024)}MB`;
  }

  // Get allowed file types text
  static getAllowedTypes(): string {
    return this.ALLOWED_TYPES.map(type => type.split('/')[1].toUpperCase()).join(', ');
  }
}
