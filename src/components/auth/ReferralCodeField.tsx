import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { getStoredReferralCode, isReferralFromLink, normalizeReferralCode, setStoredReferralCode } from '@/lib/referral';

// Optional "Referral code" box for the signup forms. Pre-filled from a shared ?ref= link, and
// checks the code as the user types so a typo is caught before they submit. A code that came from
// a shared link is locked (read-only) — only a code that turns out to be invalid can be edited. The value lives in
// localStorage (see lib/referral.ts), which is what the signup call reads — this component never
// blocks registration, an empty or invalid code is simply ignored by the server.
export function ReferralCodeField() {
  const [code, setCode] = useState(getStoredReferralCode());
  const [state, setState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [name, setName] = useState('');
  const [fromLink, setFromLink] = useState(isReferralFromLink());
  const locked = fromLink && state !== 'invalid';

  useEffect(() => {
    if (!code) {
      setState('idle');
      return;
    }
    setState('checking');
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const res = await api.employees.validateReferral(code);
        if (cancelled) return;
        setState(res.valid ? 'valid' : 'invalid');
        setName(res.employee_name || '');
      } catch {
        if (!cancelled) setState('idle');
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code]);

  return (
    <div className="space-y-1.5 mt-4">
      <Label htmlFor="referral_code" className="text-sm">Referral code <span className="text-muted-foreground">(optional)</span></Label>
      <div className="relative">
        <Input
          id="referral_code"
          value={code}
          readOnly={locked}
          onChange={(e) => {
            if (locked) return;
            const v = normalizeReferralCode(e.target.value);
            setCode(v);
            setFromLink(false);
            setStoredReferralCode(v);
          }}
          placeholder="e.g. JBK7M2XQ"
          maxLength={12}
          className={`uppercase pr-10 ${locked ? 'bg-muted text-muted-foreground cursor-not-allowed' : ''}`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {locked && state !== 'checking' && <Lock className="h-4 w-4 text-muted-foreground" />}
          {state === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {state === 'valid' && !locked && <CheckCircle2 className="h-4 w-4 text-success" />}
          {state === 'invalid' && <XCircle className="h-4 w-4 text-destructive" />}
        </span>
      </div>
      {state === 'valid' && <p className="text-xs text-success">Referred by {name || 'a JummaBaba partner'}{locked && ' — code applied from the link you used'}</p>}
      {state === 'invalid' && <p className="text-xs text-destructive">This code isn't valid — you can correct it, or sign up without it.</p>}
    </div>
  );
}
