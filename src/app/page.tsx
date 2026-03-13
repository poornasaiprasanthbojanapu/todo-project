'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';
import { Profile } from '@/types/profile';
import ProfilePicker from '@/components/ProfilePicker';
import TodoApp from '@/components/TodoApp';

export default function Home() {
  const { profileId, setProfileId, clearProfile, hydrated } = useProfile();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!profileId) { setProfile(null); return; }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()
      .then(({ data }) => {
        if (!data) clearProfile(); // stale id — profile deleted
        else setProfile(data as Profile);
      });
  }, [profileId]);

  if (!hydrated) return null; // prevent hydration mismatch
  if (!profileId || !profile) return <ProfilePicker onSelectProfile={setProfileId} />;
  return <TodoApp profile={profile} onSwitchProfile={clearProfile} />;
}
