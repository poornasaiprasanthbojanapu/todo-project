'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/profile';
import CreateProfileModal from './CreateProfileModal';

interface ProfilePickerProps {
  onSelectProfile: (id: string) => void;
}

export default function ProfilePicker({ onSelectProfile }: ProfilePickerProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at');
    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleCreated = (profile: Profile) => {
    setShowCreate(false);
    onSelectProfile(profile.id);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[var(--bg)] animate-fade-up">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 mb-10">
        <span className="text-5xl">🛒</span>
        <h1 className="text-4xl font-black text-emerald-600 tracking-tight">CartList</h1>
        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Choose a home profile to continue
        </p>
      </div>

      {/* Profile grid */}
      <div className="w-full max-w-md flex flex-col gap-3">
        {loading ? (
          <div className="flex gap-1.5 justify-center py-10">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse-dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        ) : (
          <>
            {profiles.map(profile => (
              <button
                key={profile.id}
                onClick={() => onSelectProfile(profile.id)}
                className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  background: 'var(--card)',
                  border: `2px solid var(--card-border)`,
                }}
              >
                <span
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${profile.color}20`, border: `2px solid ${profile.color}40` }}
                >
                  {profile.emoji}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black truncate" style={{ color: profile.color }}>
                    {profile.name}
                  </p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Tap to open
                  </p>
                </div>
                <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}

            {/* New home card */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none border-2 border-dashed"
              style={{
                background: 'transparent',
                borderColor: 'var(--item-border)',
              }}
            >
              <span
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{ background: 'var(--item-completed-bg)' }}
              >
                +
              </span>
              <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                New home profile
              </p>
            </button>
          </>
        )}
      </div>

      {showCreate && (
        <CreateProfileModal
          existingNames={profiles.map(p => p.name)}
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
