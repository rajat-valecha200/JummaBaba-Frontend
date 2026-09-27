import type { ProfileStrengthItem } from '@/components/b2b/ProfileStrengthCard';

// The exact same five checks, wherever a buyer's Profile Strength is shown (their own Profile
// page, and the Dashboard nudge for anyone still missing something) — read straight off the
// profile object /profiles/me (or auth.getMe()) returns, no page-specific reshaping needed.
export function buyerProfileStrengthItems(p: {
  full_name?: string;
  business_name?: string;
  phone?: string;
  business_type?: string;
  gst_number?: string;
  pan_number?: string;
  description?: string;
  business_details?: { description?: string; addresses?: unknown[] };
}): ProfileStrengthItem[] {
  const addresses = p.business_details?.addresses || [];
  const description = p.description || p.business_details?.description || '';
  return [
    { label: 'Business Identity', done: !!(p.business_name && p.business_type) },
    { label: 'Contact Details', done: !!(p.full_name && p.phone) },
    { label: 'GST/PAN Verified', done: !!(p.gst_number && p.pan_number) },
    { label: 'Shipping Address', done: addresses.length > 0 },
    { label: 'Business Description', done: description.length > 20 },
  ];
}
