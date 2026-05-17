import { createClient } from '@/lib/supabase/client';

const LOCKOUT_KEY = 'NOXIS_pin_lockout';
const ATTEMPTS_KEY = 'NOXIS_pin_attempts';

export const requirePin = async (action: string): Promise<boolean> => {
  // 1. Check for active lockout
  const lockoutTime = sessionStorage.getItem(LOCKOUT_KEY);
  if (lockoutTime && Date.now() < parseInt(lockoutTime)) {
    const remaining = Math.ceil((parseInt(lockoutTime) - Date.now()) / 60000);
    alert(`System Locked. Too many failed attempts. Try again in ${remaining} minutes.`);
    return false;
  }

  // 2. Open PIN Modal (This is a simplified logic, in a real app this would trigger a UI state)
  const pin = prompt(`Security Verification Required: ${action}\nEnter 4-digit PIN:`);
  if (!pin || pin.length !== 4) return false;

  const supabase = createClient();
  
  try {
    const { data, error } = await supabase.functions.invoke('verify-pin', {
      body: { pin },
    });

    if (error || !data.valid) {
      // Manage attempts
      const attempts = parseInt(sessionStorage.getItem(ATTEMPTS_KEY) || '0') + 1;
      sessionStorage.setItem(ATTEMPTS_KEY, attempts.toString());

      if (attempts >= 3) {
        const until = Date.now() + 5 * 60 * 1000; // 5 min lockout
        sessionStorage.setItem(LOCKOUT_KEY, until.toString());
        alert("CRITICAL SECURITY LOCK: 3 failed attempts. System locked for 5 minutes.");
      } else {
        alert(`Incorrect PIN. ${3 - attempts} attempts remaining.`);
      }
      return false;
    }

    // Success: reset attempts
    sessionStorage.removeItem(ATTEMPTS_KEY);
    return true;
  } catch (err) {
    console.error('PIN verification failed:', err);
    return false;
  }
};

