import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command, CommandList, CommandInput, CommandItem, CommandEmpty, CommandGroup,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { COUNTRIES, getCountry } from '@/lib/world/countries';
import { CURRENCIES, getCurrency } from '@/lib/world/currencies';

export function CountrySelect({ value, onChange, placeholder = 'Choisir un pays', className }) {
  const [open, setOpen] = useState(false);
  const cur = getCountry(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open}
          className={`w-full justify-between font-normal ${className || ''}`}>
          {cur ? <span className="flex items-center gap-2 truncate"><span className="text-base leading-none">{cur.flag}</span><span className="truncate">{cur.name}</span></span> : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[240px]" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un pays..." />
          <CommandList>
            <CommandEmpty>Aucun pays.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem key={c.code} value={`${c.name} ${c.code}`} onSelect={() => { onChange(c.code, c); setOpen(false); }}>
                  <span className="mr-2 text-base leading-none">{c.flag}</span>{c.name}
                  {value === c.code && <Check className="ml-auto w-4 h-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function CurrencySelect({ value, onChange, placeholder = 'Choisir une devise', className }) {
  const [open, setOpen] = useState(false);
  const cur = getCurrency(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" role="combobox" aria-expanded={open}
          className={`w-full justify-between font-normal ${className || ''}`}>
          {cur ? <span className="flex items-center gap-2"><span className="font-semibold w-10 text-left">{cur.code}</span><span className="truncate text-muted-foreground">{cur.name}</span></span> : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[240px]" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une devise..." />
          <CommandList>
            <CommandEmpty>Aucune devise.</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((c) => (
                <CommandItem key={c.code} value={`${c.code} ${c.name}`} onSelect={() => { onChange(c.code, c); setOpen(false); }}>
                  <span className="font-semibold w-12">{c.code}</span>{c.name}
                  {value === c.code && <Check className="ml-auto w-4 h-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Combined field: selecting a country automatically sets its currency + calling code.
export function CountryCurrencyField({ country, currency, callingCode, onChange }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">Pays</label>
        <CountrySelect value={country} onChange={(code, c) => onChange({ country: code, currency: c.currency, callingCode: c.calling_code })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">Devise</label>
          <CurrencySelect value={currency} onChange={(code) => onChange({ currency: code })} />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#6D7175] mb-1">Indicatif</label>
          <input value={callingCode || ''} onChange={(e) => onChange({ callingCode: e.target.value })} placeholder="+221"
            className="w-full px-2.5 py-1.5 border border-[#E1E1E1] rounded-md text-sm font-mono bg-white" />
        </div>
      </div>
    </div>
  );
}