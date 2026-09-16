import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { ALL_COUNTRIES } from '../lib/constants';
import { DIAL_CODES } from '../lib/dial-codes';

interface PhoneInputProps {
  countryCode: string;   // ISO alpha-2, e.g. 'CI'
  number: string;        // local number, digits only (no dial code)
  onCountryChange: (iso: string) => void;
  onNumberChange: (number: string) => void;
  required?: boolean;
  label?: string;
}

/**
 * Real phone number field for Auth/Onboarding — a searchable country
 * selector (flag + dial code, all 193 countries in ALL_COUNTRIES) paired
 * with the local number field, matching how Shopify/BigCommerce collect
 * a phone number internationally instead of assuming one country's
 * format. `onCountryChange`/`onNumberChange` let the caller store the
 * ISO code and local digits separately — reassemble as
 * `${DIAL_CODES[countryCode]}${number}` for the value actually sent to
 * the backend.
 */
export function PhoneInput({ countryCode, number, onCountryChange, onNumberChange, required, label }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const selected = ALL_COUNTRIES.find(c => c.code === countryCode);
  const dialCode = countryCode ? DIAL_CODES[countryCode] : '';

  const filtered = ALL_COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    (DIAL_CODES[c.code] || '').includes(search)
  );

  return (
    <div ref={wrapRef}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="flex gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            className="h-full flex items-center gap-1.5 px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 min-w-[92px]"
          >
            <span>{selected?.flag || '🌍'}</span>
            <span className="text-sm text-gray-700">{dialCode || 'Indicatif'}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          {open && (
            <div className="absolute z-50 left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-xl">
              <div className="p-2 border-b border-gray-100 relative">
                <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un pays ou indicatif…"
                  className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-3 text-xs text-gray-400 text-center">Aucun pays trouvé</div>
                ) : (
                  filtered.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => { onCountryChange(c.code); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-3 py-2 hover:bg-brand-50 text-xs flex items-center gap-2 ${c.code === countryCode ? 'bg-brand-50' : ''}`}
                    >
                      <span>{c.flag}</span>
                      <span className="flex-1 text-gray-800">{c.name}</span>
                      <span className="text-gray-400">{DIAL_CODES[c.code]}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <input
          type="tel"
          required={required}
          value={number}
          onChange={e => onNumberChange(e.target.value.replace(/[^\d\s]/g, ''))}
          placeholder="07 00 00 00 00"
          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}
