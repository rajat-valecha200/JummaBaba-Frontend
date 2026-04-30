import { useState, useEffect, useCallback } from 'react';
import { MapPin, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATE_NAMES, getCitiesForState, lookupPincode } from '@/lib/india-locations';
import { cn } from '@/lib/utils';

interface LocationValue {
  address: string;
  state: string;
  city: string;
  pincode: string;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (updated: Partial<LocationValue>) => void;
  errors?: Partial<Record<keyof LocationValue, string | null>>;
  touched?: Partial<Record<keyof LocationValue, boolean>>;
  onBlur?: (field: keyof LocationValue) => void;
  showAddress?: boolean; // default true
}

export function LocationPicker({
  value,
  onChange,
  errors = {},
  touched = {},
  onBlur,
  showAddress = true,
}: LocationPickerProps) {
  const [cities, setCities] = useState<string[]>([]);
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'ok' | 'mismatch' | 'error'>('idle');
  const [pincodeInfo, setPincodeInfo] = useState<string>('');

  // When state changes, update city list and reset city if not in list
  useEffect(() => {
    const newCities = getCitiesForState(value.state);
    setCities(newCities);
    // If current city is not in new list, reset it
    if (value.city && !newCities.includes(value.city)) {
      onChange({ city: '' });
    }
  }, [value.state]);

  const validatePincode = useCallback(async (pincode: string) => {
    if (pincode.length !== 6) {
      setPincodeStatus('idle');
      setPincodeInfo('');
      return;
    }
    setPincodeStatus('loading');
    const result = await lookupPincode(pincode);
    if (!result) {
      setPincodeStatus('error');
      setPincodeInfo('Invalid pincode');
      return;
    }
    // Check if pincode matches selected state
    if (value.state) {
      const stateMatch = result.state.toLowerCase().includes(value.state.toLowerCase()) ||
        value.state.toLowerCase().includes(result.state.toLowerCase().split(' ')[0]);
      if (!stateMatch) {
        setPincodeStatus('mismatch');
        setPincodeInfo(`This pincode belongs to ${result.state}, not the selected state`);
        return;
      }
    }
    // Auto-fill city if empty or if not set
    if (!value.city && result.district) {
      onChange({ city: result.district });
    }
    // Auto-fill state if not set
    if (!value.state && result.state) {
      onChange({ state: result.state });
    }
    setPincodeStatus('ok');
    setPincodeInfo(`${result.district}, ${result.state}`);
  }, [value.state, value.city, onChange]);

  const handlePincodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6);
    onChange({ pincode: cleaned });
    if (cleaned.length === 6) {
      validatePincode(cleaned);
    } else {
      setPincodeStatus('idle');
      setPincodeInfo('');
    }
  };

  const hasError = (field: keyof LocationValue) =>
    touched[field] && errors[field];

  return (
    <div className="space-y-4">
      {showAddress && (
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              placeholder="Building, street, locality..."
              className={cn('pl-10', hasError('address') && 'border-destructive')}
              value={value.address}
              onChange={e => onChange({ address: e.target.value })}
              onBlur={() => onBlur?.('address')}
            />
          </div>
          {hasError('address') && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.address}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* State */}
        <div className="space-y-2">
          <Label htmlFor="state">State *</Label>
          <Select
            value={value.state}
            onValueChange={val => {
              onChange({ state: val, city: '' });
              onBlur?.('state');
            }}
          >
            <SelectTrigger id="state" className={cn(hasError('state') && 'border-destructive')}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {STATE_NAMES.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasError('state') && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.state}
            </p>
          )}
        </div>

        {/* City — filtered by state */}
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          {cities.length > 0 ? (
            <Select
              value={value.city}
              onValueChange={val => { onChange({ city: val }); onBlur?.('city'); }}
              disabled={!value.state}
            >
              <SelectTrigger id="city" className={cn(hasError('city') && 'border-destructive')}>
                <SelectValue placeholder={value.state ? 'Select city' : 'Select state first'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id="city"
              placeholder={value.state ? 'Enter city name' : 'Select state first'}
              disabled={!value.state}
              className={cn(hasError('city') && 'border-destructive')}
              value={value.city}
              onChange={e => onChange({ city: e.target.value })}
              onBlur={() => onBlur?.('city')}
            />
          )}
          {hasError('city') && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />{errors.city}
            </p>
          )}
        </div>
      </div>

      {/* Pincode with live validation */}
      <div className="space-y-2">
        <Label htmlFor="pincode">Pincode *</Label>
        <div className="relative">
          <Input
            id="pincode"
            placeholder="e.g. 110001"
            maxLength={6}
            inputMode="numeric"
            className={cn(
              'pr-10',
              hasError('pincode') && 'border-destructive',
              pincodeStatus === 'ok' && 'border-emerald-500',
              pincodeStatus === 'mismatch' && 'border-amber-500',
              pincodeStatus === 'error' && 'border-destructive',
            )}
            value={value.pincode}
            onChange={e => handlePincodeChange(e.target.value)}
            onBlur={() => onBlur?.('pincode')}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {pincodeStatus === 'loading' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {pincodeStatus === 'ok' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
            {(pincodeStatus === 'error' || pincodeStatus === 'mismatch') && <XCircle className="h-4 w-4 text-destructive" />}
          </div>
        </div>
        {pincodeInfo && (
          <p className={cn(
            'text-xs flex items-center gap-1',
            pincodeStatus === 'ok' ? 'text-emerald-600' : 'text-amber-600'
          )}>
            {pincodeStatus === 'ok' ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
            {pincodeInfo}
          </p>
        )}
        {hasError('pincode') && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />{errors.pincode}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Enter 6-digit pincode — city/state will auto-validate</p>
      </div>
    </div>
  );
}
