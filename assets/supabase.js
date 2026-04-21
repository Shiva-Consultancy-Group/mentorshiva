import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const cfg = window.SCG_CONFIG || {};
export const supabase = createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

export async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function currentProfile() {
  const user = await currentUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return data;
}

export async function requireAuth(redirectTo = '/admin/login.html') {
  const user = await currentUser();
  if (!user) {
    window.location.href = redirectTo + '?next=' + encodeURIComponent(window.location.pathname);
    return null;
  }
  return user;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = '/admin/login.html';
}

// Fetch public documents for a given page slug
export async function listPublicDocuments(pageSlug) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, description, category, file_name, file_size, mime_type, storage_path, download_count, created_at')
    .in('page_slug', [pageSlug, 'shared'])
    .eq('is_public', true)
    .order('created_at', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

export function publicDocumentUrl(storagePath) {
  return `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.storageBucket}/${storagePath}`;
}

export async function recordDownload(docId) {
  try {
    await supabase.rpc('increment_download', { doc_id: docId });
  } catch (_) { /* non-critical */ }
}

export function humanFileSize(bytes) {
  if (!bytes && bytes !== 0) return '';
  const units = ['B','KB','MB','GB'];
  let i = 0; let n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}
