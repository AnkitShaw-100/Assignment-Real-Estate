import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadImage, ACCEPTED, MAX_IMAGE_MB } from '../../lib/upload';
import { imageUrl } from '../../lib/format';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { spring } from '../../lib/motion';

/**
 * Photos for a listing: drag-and-drop or browse to upload, reorder, pick the
 * cover, remove. `value` is the images array; `cover` is the cover index.
 */
export function ImageManager({ value, onChange, cover, onCoverChange, error }) {
  const inputRef = useRef(null);
  const [uploads, setUploads] = useState([]); // { id, name, progress }
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [url, setUrl] = useState('');
  // Latest images without stale closures while several uploads finish
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const addFiles = async (files) => {
    for (const file of Array.from(files)) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;
      setUploads((u) => [...u, { id, name: file.name, progress: 0 }]);
      try {
        const img = await uploadImage(file, { onProgress: (p) => setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: p } : x))) });
        onChange([...latest.current, img]);
      } catch (err) {
        if (err.status === 503) setUrlMode(true); // uploads not configured on this server: offer URLs instead
        toast.error(err.message);
      } finally {
        setUploads((u) => u.filter((x) => x.id !== id));
      }
    }
  };

  const move = (i, dir) => {
    const next = [...value];
    const j = i + dir;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (cover === i) onCoverChange(j);
    else if (cover === j) onCoverChange(i);
  };

  const remove = (i) => {
    onChange(value.filter((_, k) => k !== i));
    if (cover === i) onCoverChange(0);
    else if (cover > i) onCoverChange(cover - 1);
  };

  // Not a <form>: this sits inside the property form, and nested forms submit the outer one
  const addUrl = () => {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
      onChange([...value, { url: u.toString(), alt: '' }]);
      setUrl('');
    } catch {
      toast.error('Enter a full image link starting with https://');
    }
  };

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AnimatePresence initial={false}>
          {value.map((img, i) => (
            <motion.li key={img.publicId ?? img.url} layout transition={spring.soft} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="group relative aspect-[4/3] overflow-hidden rounded-card bg-mist-100">
              <img src={imageUrl(img.url, 400)} alt={img.alt || `Photo ${i + 1}`} className="size-full object-cover" />
              {cover === i && <span className="absolute top-2 left-2 rounded-full bg-brass-400 px-2 py-0.5 text-xs font-semibold text-navy-900">Cover</span>}
              <div className="absolute inset-x-2 bottom-2 flex justify-between gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                <div className="flex gap-1">
                  <IconBtn label="Move earlier" onClick={() => move(i, -1)} disabled={i === 0}><ArrowLeft className="size-3.5" /></IconBtn>
                  <IconBtn label="Move later" onClick={() => move(i, 1)} disabled={i === value.length - 1}><ArrowRight className="size-3.5" /></IconBtn>
                </div>
                <div className="flex gap-1">
                  {cover !== i && <IconBtn label="Use as cover photo" onClick={() => onCoverChange(i)}><Star className="size-3.5" /></IconBtn>}
                  <IconBtn label="Remove photo" onClick={() => remove(i)}><Trash2 className="size-3.5 text-danger" /></IconBtn>
                </div>
              </div>
            </motion.li>
          ))}
          {uploads.map((u) => (
            <motion.li key={u.id} layout className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-card bg-mist-100 p-3 text-center">
              <div className="w-full">
                <p className="truncate text-xs text-slate-500">{u.name}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist-200" role="progressbar" aria-valuenow={u.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${u.name}`}>
                  <motion.div className="h-full bg-navy-900" animate={{ width: `${u.progress}%` }} transition={{ ease: 'linear' }} />
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>

        <li>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            className={clsx(
              'flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed text-sm transition-colors',
              dragging ? 'border-brass-400 bg-brass-400/10' : 'border-line text-slate-500 hover:border-navy-600 hover:text-navy-900',
            )}
          >
            <ImagePlus className="size-6" strokeWidth={1.5} />
            <span className="font-medium">Add photos</span>
            <span className="text-xs text-slate-400">Drop or browse · up to {MAX_IMAGE_MB} MB</span>
          </button>
        </li>
      </ul>
      <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />

      <div className="mt-3">
        {urlMode ? (
          <div className="flex gap-2" role="group" aria-label="Add a photo by link">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addUrl();
                }
              }}
              placeholder="https://images.unsplash.com/…"
              aria-label="Image link"
            />
            <Button variant="secondary" onClick={addUrl}>Add link</Button>
          </div>
        ) : (
          <button type="button" onClick={() => setUrlMode(true)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-900">
            <Link2 className="size-4" /> Add a photo by link instead
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-[13px] text-danger" role="alert">{error}</p>}
    </div>
  );
}

function IconBtn({ label, children, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} className="glass grid size-7 place-items-center rounded-full text-navy-900 disabled:opacity-40" {...props}>
      {children}
    </button>
  );
}
