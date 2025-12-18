export interface Player {
  id: string;
  name: string;
  position: string;
  thumb?: string;
  number?: string;
  cutout?: string;
}

export interface Team {
  id: string; // Internal ID (e.g., 'mar')
  apiId?: string; // TheSportsDB ID
  name: string;
  flag: string; // Emoji fallback
  badge?: string; // Real logo URL
  banner?: string; // Team banner/stadium art
  jersey?: string; // Team kit
  stadium?: string;
  stadiumThumb?: string;
  description?: string;
  players?: Player[]; // Roster
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  isKnockout?: boolean;
  round?: 'group' | 'r16' | 'qf' | 'sf' | 'final';
  winnerId?: string;
  
  // New metadata
  date?: string;
  time?: string;
  venue?: string;
}

export interface Group {
  id: string;
  name: string;
  teamIds: string[];
}

export interface TeamStats {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}