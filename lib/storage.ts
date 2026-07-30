import { supabase } from './supabase';

const BUCKET = 'cotizacion-assets';

/**
 * Sube un archivo al bucket de Supabase Storage y retorna la URL pública.
 */
export async function uploadFile(
  file: File,
  folder: 'productos' | 'logos' | 'firmas'
): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file, { upsert: true });

  if (error) throw new Error(`Error al subir archivo: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

/**
 * Elimina un archivo del bucket de Storage por su URL pública.
 */
export async function deleteFile(publicUrl: string): Promise<void> {
  try {
    const url = new URL(publicUrl);
    const pathParts = url.pathname.split(`/${BUCKET}/`);
    if (pathParts.length < 2) return;
    const filePath = pathParts[1];
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch {
    // Ignorar errores de eliminación
  }
}

/**
 * Convierte una URL pública de imagen a base64 (para usar en @react-pdf/renderer).
 */
export async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}
