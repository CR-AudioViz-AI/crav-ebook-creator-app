import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

export async function saveFileHTML(
  html: string,
  keyPrefix: string = 'exports'
): Promise<string> {
  const backend = process.env.STORAGE_BACKEND || 'supabase';
  const filename = `${keyPrefix}/book-${nanoid(8)}.html`;

  if (backend === 'supabase') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_CONFIG_MISSING');
    }

    const supa = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supa.storage
      .from('public')
      .upload(filename, new Blob([html], { type: 'text/html' }), {
        upsert: true,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supa.storage.from('public').getPublicUrl(filename);

    return publicUrl;
  }

  if (backend === 's3') {
    throw new Error('S3_NOT_IMPLEMENTED_YET');
  }

  throw new Error('STORAGE_BACKEND_UNSUPPORTED');
}

export async function saveImage(
  imageUrl: string,
  keyPrefix: string = 'images'
): Promise<string> {
  const backend = process.env.STORAGE_BACKEND || 'supabase';

  if (backend === 'supabase') {
    return imageUrl;
  }

  if (backend === 's3') {
    throw new Error('S3_NOT_IMPLEMENTED_YET');
  }

  return imageUrl;
}
