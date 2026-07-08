'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, X, RefreshCw, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Client-compress an image to <= maxDim px on its long edge, JPEG quality 0.75,
// keeping field uploads small on 2G. PDFs and non-images pass through untouched.
async function compress(file, maxDim = 1400) {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.75));
  return blob || file;
}

// Upload a photo/document to a private org-scoped Storage bucket and persist its
// path on a row. Reads back via a signed URL. Online-only (Storage needs network).
//   bucket: 'operator-photos' | 'group-docs'
//   path: existing object path (or null); onChange(newPath) after upload/remove.
//   subdir: e.g. operatorId — file lands at {org_id}/{subdir}/{uuid}.{ext}
export default function PhotoUpload({ bucket, path, subdir, onChange, label, accept = 'image/*', fr }) {
  const { orgId } = useAuth();
  const [url, setUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const sign = useCallback(async () => {
    if (!path) { setUrl(null); return; }
    const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
    setUrl(data?.signedUrl || null);
  }, [bucket, path]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { sign(); }, [sign]);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setBusy(true);
    try {
      if (!orgId) { setError(fr ? 'Organisation manquante.' : 'Missing organization.'); return; }
      const body = await compress(file);
      const ext = file.type.startsWith('image/') ? 'jpg' : (file.name.split('.').pop() || 'bin');
      const key = `${orgId}/${subdir}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(key, body, { upsert: false, contentType: file.type.startsWith('image/') ? 'image/jpeg' : file.type });
      if (upErr) { setError(upErr.message); return; }
      // Remove the previous object (best-effort) then persist the new path.
      if (path) await supabase.storage.from(bucket).remove([path]).catch(() => {});
      onChange(key);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function remove() {
    if (!path) return;
    setBusy(true);
    await supabase.storage.from(bucket).remove([path]).catch(() => {});
    setBusy(false);
    onChange(null);
  }

  const isImage = accept.includes('image');

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="flex items-center gap-3">
        {path ? (
          isImage && url ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed private-bucket URL; next/image can't optimize it
            <img src={url} alt="" className="size-16 rounded-lg object-cover border" />
          ) : (
            <a href={url || '#'} target="_blank" rel="noopener noreferrer" className="size-16 rounded-lg border flex items-center justify-center bg-gray-50 text-gray-400">
              <FileText className="size-6" />
            </a>
          )
        ) : (
          <div className="size-16 rounded-lg border border-dashed flex items-center justify-center text-gray-300">
            <Camera className="size-6" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-60">
            {busy ? <RefreshCw className="size-4 animate-spin" /> : <Camera className="size-4" />}
            {path ? (fr ? 'Remplacer' : 'Replace') : (fr ? 'Ajouter' : 'Add')}
          </button>
          {path && (
            <button type="button" onClick={remove} disabled={busy}
              className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
              <X className="size-3.5" /> {fr ? 'Retirer' : 'Remove'}
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} capture={isImage ? 'environment' : undefined} onChange={handleFile} className="hidden" />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
