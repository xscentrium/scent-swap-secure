import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  bucket: string;
  folder: string;
  onUpload: (url: string) => void;
  currentImage?: string | null;
  accept?: string;
  maxSize?: number; // in MB
}

export const ImageUpload = ({
  bucket,
  folder,
  onUpload,
  currentImage,
  accept = 'image/*',
  maxSize = 5,
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onUpload(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {preview ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-muted">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-foreground">Click to upload</span>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to {maxSize}MB
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {!preview && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Choose Image'}
        </Button>
      )}
    </div>
  );
};
