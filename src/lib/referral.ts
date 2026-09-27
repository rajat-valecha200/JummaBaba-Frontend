// Employee referral code, carried from a shared link (?ref=CODE) through to signup. Stored in
// localStorage so it survives the person browsing around before they actually register.
// A code that arrived through a link is remembered as such (source 'link') so the signup form can
// lock it; a code the person typed themselves stays editable. A link code is forgotten after 30 days.
const KEY = 'jb_ref';
const SRC_KEY = 'jb_ref_src';
const AT_KEY = 'jb_ref_at';
const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const normalizeReferralCode = (code: string) => code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

const clearAll = () => {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(SRC_KEY);
    localStorage.removeItem(AT_KEY);
  } catch {
    /* storage unavailable */
  }
};

export const getStoredReferralCode = (): string => {
  try {
    const code = localStorage.getItem(KEY) || '';
    if (code && localStorage.getItem(SRC_KEY) === 'link') {
      const at = Number(localStorage.getItem(AT_KEY) || 0);
      if (!at || Date.now() - at > LINK_TTL_MS) {
        clearAll();
        return '';
      }
    }
    return code;
  } catch {
    return '';
  }
};

// True when the stored code came from a referral link — the signup form shows it read-only.
export const isReferralFromLink = (): boolean => {
  try {
    return !!getStoredReferralCode() && localStorage.getItem(SRC_KEY) === 'link';
  } catch {
    return false;
  }
};

export const setStoredReferralCode = (code: string, source: 'link' | 'typed' = 'typed') => {
  try {
    const clean = normalizeReferralCode(code);
    if (!clean) {
      clearAll();
      return;
    }
    localStorage.setItem(KEY, clean);
    localStorage.setItem(SRC_KEY, source);
    localStorage.setItem(AT_KEY, String(Date.now()));
  } catch {
    /* storage unavailable (private mode etc.) — the field itself still works for this session */
  }
};

export const clearStoredReferralCode = () => clearAll();

// Call on every route change: pulls ?ref=CODE out of the URL if present.
export const captureReferralFromUrl = (search: string) => {
  const ref = new URLSearchParams(search).get('ref');
  if (ref) setStoredReferralCode(ref, 'link');
};
