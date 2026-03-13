'use client';

import { Profile } from '@/types/profile';

interface ProfileBadgeProps {
  profile: Profile;
  onSwitch: () => void;
}

export default function ProfileBadge({ profile, onSwitch }: ProfileBadgeProps) {
  return (
    <button
      onClick={onSwitch}
      className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1"
      style={{
        background: 'var(--item-completed-bg)',
        border: '1px solid var(--item-border)',
      }}
      aria-label="Switch profile"
    >
      <span className="text-xl leading-none">{profile.emoji}</span>
      <span className="text-sm font-black tracking-tight" style={{ color: profile.color }}>
        {profile.name}
      </span>
      <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
        Switch ↕
      </span>
    </button>
  );
}
