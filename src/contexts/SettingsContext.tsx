import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../utils/api';

export interface DayHours {
  open: boolean;
  from: string;
  to: string;
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type WeekSchedule = Record<DayKey, DayHours>;

export const DAY_LIST: { key: DayKey; label: string; short: string }[] = [
  { key: 'mon', label: 'Monday',    short: 'Mon' },
  { key: 'tue', label: 'Tuesday',   short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday',  short: 'Thu' },
  { key: 'fri', label: 'Friday',    short: 'Fri' },
  { key: 'sat', label: 'Saturday',  short: 'Sat' },
  { key: 'sun', label: 'Sunday',    short: 'Sun' },
];

export const DEFAULT_SCHEDULE: WeekSchedule = {
  mon: { open: true,  from: '09:00', to: '18:00' },
  tue: { open: true,  from: '09:00', to: '18:00' },
  wed: { open: true,  from: '09:00', to: '18:00' },
  thu: { open: true,  from: '09:00', to: '18:00' },
  fri: { open: true,  from: '09:00', to: '18:00' },
  sat: { open: true,  from: '10:00', to: '16:00' },
  sun: { open: false, from: '10:00', to: '16:00' },
};

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_pincode: string;
  address_country: string;
  currency: string;
  timezone: string;
  showBusinessHours: boolean;
  businessHoursSchedule: WeekSchedule;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refetch: () => void;
}

const DEFAULTS: SiteSettings = {
  siteName: 'Vembar Karupatti',
  siteDescription: 'Pure traditional jaggery and natural sweeteners from South India',
  contactEmail: 'support@vembarkarupatti.in',
  supportPhone: '+91 99940 90422',
  address_street: 'Vembar',
  address_city: 'Vembar',
  address_state: 'Tamil Nadu',
  address_pincode: '628501',
  address_country: 'India',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  showBusinessHours: true,
  businessHoursSchedule: DEFAULT_SCHEDULE,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULTS,
  loading: false,
  refetch: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings');
      if (response.data?.success && response.data?.data) {
        const d = response.data.data;
        // Public endpoint returns snake_case key; admin endpoint returns camelCase — handle both
        const rawSchedule = d.businessHoursSchedule ?? d.business_hours_schedule;
        setSettings({
          ...DEFAULTS,
          ...d,
          // Force boolean — backend may return the string "false" which JS evaluates as truthy
          showBusinessHours: d.showBusinessHours === true || d.showBusinessHours === 1 || d.showBusinessHours === 'true',
          businessHoursSchedule: rawSchedule
            ? { ...DEFAULT_SCHEDULE, ...rawSchedule }
            : DEFAULT_SCHEDULE,
        });
      }
    } catch {
      // keep defaults when API is unavailable
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSiteSettings = () => useContext(SettingsContext);

/** "09:00" → "9:00 AM",  "18:00" → "6:00 PM" */
export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Converts the week schedule into display lines, grouping consecutive days
 * that share the same hours.
 * e.g. ["Mon - Fri: 9:00 AM - 6:00 PM", "Sat: 10:00 AM - 4:00 PM", "Sun: Closed"]
 */
export function formatBusinessHours(schedule: WeekSchedule): string[] {
  const keys = DAY_LIST.map(d => d.key);
  const shorts: Record<DayKey, string> = Object.fromEntries(
    DAY_LIST.map(d => [d.key, d.short])
  ) as Record<DayKey, string>;

  const lines: string[] = [];
  let i = 0;

  while (i < keys.length) {
    const day = keys[i];
    const h = schedule[day];
    const isOpen = h.open;

    // Find how many consecutive days share same state + hours
    let j = i + 1;
    while (j < keys.length) {
      const next = schedule[keys[j]];
      const sameState = next.open === isOpen;
      const sameHours = !isOpen || (next.from === h.from && next.to === h.to);
      if (sameState && sameHours) j++;
      else break;
    }

    const rangeLabel = j - i > 1
      ? `${shorts[day]} - ${shorts[keys[j - 1]]}`
      : shorts[day];

    lines.push(
      isOpen
        ? `${rangeLabel}: ${formatTime(h.from)} - ${formatTime(h.to)}`
        : `${rangeLabel}: Closed`
    );

    i = j;
  }

  return lines;
}
