'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';

const EMOJIS = ['🏠', '🏡', '🌴', '🏖', '🌿', '🏔', '🏘', '🌆', '🏕', '🌾', '🏙', '🏰'];
const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#14b8a6', // teal
  '#0ea5e9', // sky
  '#f97316', // orange
];

interface CreateProfileModalProps {
  existingNames: string[];
  onCreated: (profile: Profile) => void;
  onCancel: () => void;
}

export default function CreateProfileModal({ existingNames, onCreated, onCancel }: CreateProfileModalProps) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏠');
  const [color, setColor] = useState('#10b981');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError('Name is required.'); return; }
    if (existingNames.map(n => n.toLowerCase()).includes(trimmed.toLowerCase())) {
      setError('A profile with that name already exists.');
      return;
    }
    setSaving(true);
    const { data, error: dbError } = await supabase
      .from('profiles')
      .insert({ name: trimmed, emoji, color })
      .select()
      .single();
    setSaving(false);
    if (dbError || !data) { setError('Failed to create profile. Try again.'); return; }
    onCreated(data as Profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-up"
        style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
      >
        <h2 className="text-xl font-black mb-5" style={{ color: 'var(--text-primary)' }}>
          New Home Profile
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              placeholder="e.g. Palm Vistas Villas"
              autoFocus
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold outline-none transition-all duration-200"
              style={{
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--input-border)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = color)}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--input-border)')}
            />
            {error && <p className="text-xs text-red-500 mt-1 font-semibold">{error}</p>}
          </div>

          {/* Emoji picker */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Emoji
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className="text-xl h-10 rounded-xl flex items-center justify-center transition-all duration-150"
                  style={{
                    background: emoji === e ? 'var(--item-hover)' : 'var(--input-bg)',
                    border: emoji === e ? `2px solid ${color}` : '2px solid transparent',
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color swatches */}
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center"
                  style={{
                    background: c,
                    outline: color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  {color === c && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'var(--item-completed-bg)', border: '1px solid var(--item-border)' }}
          >
            <span className="text-xl">{emoji}</span>
            <span className="text-sm font-black" style={{ color }}>{name || 'Profile name'}</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-150"
              style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)', border: '1px solid var(--input-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-black text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: color }}
            >
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
