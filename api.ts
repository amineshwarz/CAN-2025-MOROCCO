
import { Team, Player, Group, Match } from './types';

// Nouvelle URL fournie par l'utilisateur
const DATA_URL = 'https://gist.githubusercontent.com/amineshwarz/d63845aee3e66e9a19d9d032698e9a1e/raw/9fda9ad7cf16a4358c6e762fbd94e875021773fd/can2025.json';
const PLAYERS_API_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export interface TournamentData {
  teams: Record<string, Team>;
  groups: Group[];
  matches: Match[];
}

export const fetchTournamentData = async (): Promise<TournamentData> => {
  try {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Erreur Gist");
    const data = await response.json();

    const teams: Record<string, Team> = {};
    const groups: Group[] = [];
    
    // 1. Mapping des Groupes et Équipes
    data.groups.forEach((g: any) => {
      const teamIds: string[] = [];
      g.teams.forEach((t: any) => {
        teamIds.push(t.id);
        teams[t.id] = {
          id: t.id,
          apiId: t.apiId || t.id,
          name: t.name,
          badge: t.badge,
          flag: t.flag || '🌍',
          players: [],
          stadium: t.stadium || 'Maroc 2025 Stadium'
        };
      });
      groups.push({ id: g.id, name: g.name, teamIds: teamIds });
    });

    // 2. Mapping robuste des Matchs (Date, Time, Venue)
    const matches: Match[] = (data.matches || []).map((m: any, idx: number) => ({
      id: m.id?.toString() || `match_${idx}`,
      homeTeamId: m.homeTeamId || m.homeId || m.home || m.team_home || m.home_id,
      awayTeamId: m.awayTeamId || m.awayId || m.away || m.team_away || m.away_id,
      homeScore: m.homeScore ?? m.score_home ?? m.home_score ?? null,
      awayScore: m.awayScore ?? m.score_away ?? m.away_score ?? null,
      date: m.date || null,
      time: m.time || null,
      venue: m.venue || m.stadium || m.location || null,
      round: m.round || 'group'
    }));

    return { teams, groups, matches };
  } catch (error) {
    console.error("Erreur API:", error);
    return { teams: {}, groups: [], matches: [] };
  }
};

export const fetchTeamPlayers = async (teamId: string, apiName?: string): Promise<Player[]> => {
  try {
    const query = apiName || teamId;
    const response = await fetch(`${PLAYERS_API_BASE}/searchplayers.php?t=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (data.player && Array.isArray(data.player)) {
      return data.player.map((p: any) => ({
        id: p.idPlayer,
        name: p.strPlayer,
        position: p.strPosition,
        thumb: p.strThumb,
        cutout: p.strCutout,
        number: p.strNumber
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
};
