import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { REGIONS, getRegionDisplay } from '@/lib/regions';

interface RegionPickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  showAll?: boolean;
}

export function RegionPicker({ value, onChange, placeholder, showAll = true }: RegionPickerProps) {
  const { t, i18n } = useTranslation();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <SelectValue placeholder={placeholder ?? t('search.region')} />
        </div>
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value="all">{t('search.allRegions')}</SelectItem>}
        {REGIONS.map((r) => (
          <SelectItem key={r.code} value={r.code}>
            {getRegionDisplay(r, i18n.language)} — {r.capital}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
