import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TradeEligibility {
  canTrade: boolean;
  reason: string | null;
  age: number | null;
  needsGuardian: boolean;
  hasVerifiedGuardian: boolean;
  loading: boolean;
}

export const useCanTrade = (): TradeEligibility => {
  const { profile, loading: authLoading } = useAuth();
  const [eligibility, setEligibility] = useState<TradeEligibility>({
    canTrade: false,
    reason: null,
    age: null,
    needsGuardian: false,
    hasVerifiedGuardian: false,
    loading: true,
  });

  useEffect(() => {
    const checkEligibility = async () => {
      if (authLoading) return;
      
      if (!profile) {
        setEligibility({
          canTrade: false,
          reason: 'Please sign in to trade',
          age: null,
          needsGuardian: false,
          hasVerifiedGuardian: false,
          loading: false,
        });
        return;
      }

      // Fetch profile with guardian info
      const { data: fullProfile } = await supabase
        .from('profiles')
        .select('birthday, guardian_id, guardian_verified')
        .eq('id', profile.id)
        .single();

      if (!fullProfile?.birthday) {
        setEligibility({
          canTrade: false,
          reason: 'Please set your birthday in settings',
          age: null,
          needsGuardian: false,
          hasVerifiedGuardian: false,
          loading: false,
        });
        return;
      }

      // Calculate age
      const birthDate = new Date(fullProfile.birthday);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Check age restrictions
      if (age < 13) {
        setEligibility({
          canTrade: false,
          reason: 'You must be at least 13 years old',
          age,
          needsGuardian: false,
          hasVerifiedGuardian: false,
          loading: false,
        });
        return;
      }

      if (age < 16) {
        // Under 16 needs verified guardian
        const hasVerifiedGuardian = fullProfile.guardian_id && fullProfile.guardian_verified;
        
        if (!fullProfile.guardian_id) {
          setEligibility({
            canTrade: false,
            reason: 'Users under 16 need a guardian account (18+) linked to trade. Go to Settings to link one.',
            age,
            needsGuardian: true,
            hasVerifiedGuardian: false,
            loading: false,
          });
          return;
        }

        if (!fullProfile.guardian_verified) {
          setEligibility({
            canTrade: false,
            reason: 'Your guardian account needs to verify the connection before you can trade.',
            age,
            needsGuardian: true,
            hasVerifiedGuardian: false,
            loading: false,
          });
          return;
        }

        setEligibility({
          canTrade: true,
          reason: null,
          age,
          needsGuardian: true,
          hasVerifiedGuardian: true,
          loading: false,
        });
        return;
      }

      // Age 16+ has full access
      setEligibility({
        canTrade: true,
        reason: null,
        age,
        needsGuardian: false,
        hasVerifiedGuardian: false,
        loading: false,
      });
    };

    checkEligibility();
  }, [profile, authLoading]);

  return eligibility;
};
