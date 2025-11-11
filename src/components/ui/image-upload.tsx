"use client";

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  folder?: 'products' | 'categories' | 'users' | 'payments';
  disabled?: boolean;
  className?: string;
  maxSizeMB?: number;
  aspectRatio?: 'square' | 'video' | 'auto';
}

export function ImageUpload({
  value,
  onChange,
  folder = 'products',
  disabled = false,
  className = '',
  maxSizeMB = 10,
  aspectRatio = 'auto',
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(value || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPG, PNG, WebP, or GIF');
      return;
    }

    // Validate file size
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size: ${maxSizeMB}MB`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Update with actual URL from Vercel Blob
      setPreview(data.url);
      onChange(data.url);
      toast.success('Image uploaded successfully');

    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
      setPreview(value || null); // Revert preview
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = async () => {
    if (!preview) return;

    // If it's a Vercel Blob URL, delete it
    if (preview.includes('blob.vercel-storage.com')) {
      try {
        const response = await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: preview }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete image');
        }

        toast.success('Image removed successfully');
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete image from storage');
      }
    }

    setPreview(null);
    onChange(null);
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'video':
        return 'aspect-video';
      default:
        return 'aspect-auto';
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      <div className="space-y-2">
        {preview ? (
          // Preview with remove button
          <div className="relative group">
            <div className={`relative w-full ${getAspectRatioClass()} overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50`}>
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>

            {!disabled && !isUploading && (
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-center text-white">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-sm">Uploading...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Upload area
          <button
            type="button"
            onClick={handleClick}
            disabled={disabled || isUploading}
            className={`
              w-full ${getAspectRatioClass()} min-h-[200px]
              border-2 border-dashed border-gray-300 rounded-lg
              hover:border-gray-400 hover:bg-gray-50
              transition-colors duration-200
              flex flex-col items-center justify-center
              text-gray-500 hover:text-gray-600
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isUploading ? 'cursor-wait' : 'cursor-pointer'}
            `}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin mb-3" />
                <p className="text-sm font-medium">Uploading...</p>
              </>
            ) : (
              <>
                <div className="bg-gray-100 p-4 rounded-full mb-3">
                  <Upload className="h-8 w-8" />
                </div>
                <p className="text-sm font-medium mb-1">Click to upload image</p>
                <p className="text-xs text-gray-400">
                  JPG, PNG, WebP, or GIF (max {maxSizeMB}MB)
                </p>
              </>
            )}
          </button>
        )}

        {/* Helper text */}
        <p className="text-xs text-gray-500 text-center">
          {preview ? 'Click remove button to delete' : 'Upload an image from your device'}
        </p>
      </div>
    </div>
  );
}

/**
 * Multiple Image Upload Component
 * For products with multiple images
 */
interface MultipleImageUploadProps {
  values?: string[];
  onChange: (urls: string[]) => void;
  folder?: 'products' | 'categories' | 'users' | 'payments';
  disabled?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
}

export function MultipleImageUpload({
  values = [],
  onChange,
  folder = 'products',
  disabled = false,
  maxImages = 5,
  maxSizeMB = 10,
}: MultipleImageUploadProps) {
  const handleImageAdd = (url: string | null) => {
    if (url && values.length < maxImages) {
      onChange([...values, url]);
    }
  };

  const handleImageRemove = async (index: number) => {
    const urlToRemove = values[index];

    // Delete from Vercel Blob if applicable
    if (urlToRemove?.includes('blob.vercel-storage.com')) {
      try {
        await fetch('/api/upload', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToRemove }),
        });
      } catch (error) {
        console.error('Delete error:', error);
      }
    }

    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Existing images */}
        {values.map((url, index) => (
          <div key={url} className="relative group">
            <div className="relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            </div>

            {!disabled && (
              <button
                type="button"
                onClick={() => handleImageRemove(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}

        {/* Add new image button */}
        {values.length < maxImages && (
          <ImageUpload
            value={null}
            onChange={handleImageAdd}
            folder={folder}
            disabled={disabled}
            maxSizeMB={maxSizeMB}
            aspectRatio="square"
          />
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {values.length} / {maxImages} images uploaded
      </p>
    </div>
  );
}
