'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { uploadFile } from '@/lib/storage';
import { toast } from './Toast';

interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  folder?: 'productos' | 'logos' | 'firmas';
  label?: string;
}

export default function ImageUpload({
  currentUrl,
  onUpload,
  folder = 'productos',
  label = 'Subir imagen',
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setUploading(true);
      const url = await uploadFile(file, folder);
      onUpload(url);
      toast('Imagen subida correctamente', 'success');
    } catch (err: unknown) {
      toast((err as Error).message || 'Error al subir imagen', 'error');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="image-upload-zone"
      onClick={() => inputRef.current?.click()}
      style={{ cursor: 'pointer' }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {preview ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }}
          />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {uploading ? 'Subiendo...' : 'Clic para cambiar'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
          {uploading ? (
            <div className="spinner" />
          ) : (
            <>
              <ImageIcon size={32} style={{ opacity: 0.4 }} />
              <Upload size={16} />
              <span style={{ fontSize: 13 }}>{label}</span>
              <span style={{ fontSize: 11 }}>PNG, JPG, WebP</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
