export interface AnnouncementItem {
  id: number;
  modul?: string | null;
  naslov: string;
  opis: string;
  kategorija?: string | null;
  priority?: number | null;
  pinned?: boolean;
  datum_vrijeme?: string | null;
}

export interface DiscountItem {
  id: number;
  naslov: string;
  opis: string;
  kategorija?: string | null;
  vrijednost?: string | null;
  kod?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  lokacija?: string | null;
  image_url?: string | null;
  partner_naziv?: string | null;
  logo_url?: string | null;
  website?: string | null;
  aktivan?: boolean;
  created_at?: string | null;
}

export interface PartnerItem {
  id: number;
  naziv: string;
  logo_url?: string | null;
  website?: string | null;
}

export interface ScholarshipItem {
  id: number;
  naslov: string;
  institucija: string;
  tip: string;
  opis: string;
  iznos?: string | null;
  rok?: string | null;
  link?: string | null;
  aktivan?: boolean;
  created_at?: string | null;
}

export interface MenzaMealEntry {
  naziv: string;
  bonovi?: number | string | null;
  cijena?: string | null;
}

export interface MenzaMenuItem {
  id: number;
  datum: string;
  tip_obroka: "dorucak" | "rucak" | "vecera" | string;
  aktivan?: boolean;
  dorucak_stavke?: MenzaMealEntry[];
  glavna_jela?: string[];
  prilozi?: string[];
  salate?: string[];
  dodatno?: string[];
}

export interface MenzaBonovi {
  dorucak: number;
  rucak: number;
  vecera: number;
  updated_at?: string | null;
}

export interface NoticeItem {
  id: number;
  naslov: string;
  opis: string;
  kategorija?: string | null;
  datum_vrijeme?: string | null;
}

export interface DomObligation {
  id: number;
  user_id?: number;
  mjesec: string;
  godina?: number | string | null;
  iznos?: number | string | null;
  uplaceno?: number | string | null;
  status?: string | null;
  due_date?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CitaonaSeat {
  id: number;
  broj_mjesta: number;
  status?: string | null;
  zauzeto?: boolean;
}

export interface CitaonaReservation {
  id: number;
  kod: string;
  datum: string;
  vrijeme_od: string;
  vrijeme_do: string;
  status: string;
  broj_mjesta?: number;
  created_at?: string | null;
  checked_in_at?: string | null;
  expires_at?: string | null;
  tracking_enabled?: boolean;
  outside_since?: string | null;
  outside_warning_sent_at?: string | null;
  last_location_at?: string | null;
  last_distance_meters?: number | null;
  auto_cancelled_at?: string | null;
  cancellation_reason?: string | null;
  remaining_grace_minutes?: number | null;
}

export interface CitaonaTrackingWindow {
  vrijeme_od: string;
  vrijeme_do: string;
  full_day?: boolean;
}

export interface CitaonaTrackingConfig {
  enabled_by_preference: boolean;
  address: string;
  radius_meters: number;
  grace_minutes: number;
  reservation_mode: "daily_tracking" | "standard" | string;
  reservation_window: CitaonaTrackingWindow | null;
}

export interface CitaonaTrackingStatus {
  enabled_by_preference: boolean;
  location?: {
    address: string;
    radius_meters: number;
    grace_minutes: number;
  };
  reservation: CitaonaReservation | null;
  shouldTrack: boolean;
}

