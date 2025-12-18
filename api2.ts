
// API-Football integration probleme connu ( liste des groupe can2025 version free pas dispononible )


import { Team, Player, Group } from './types';

const API_BASE = 'https://v3.football.api-sports.io';
const LEAGUE_ID = 6;
const SEASON = 2023;
const API_KEY='7038b5375ee74f916fec70a16101177d'

/**
 * According to instructions, we must use process.env.API_KEY.
 * The host and key headers are set for the API-Sports direct endpoint.
 */
const getHeaders = () => ({
  'x-rapidapi-host': 'v3.football.api-sports.io',
  'x-rapidapi-key': API_KEY || ''
});

export interface TournamentData {
  teams: Record<string, Team>;
  groups: Group[];
}

export const fetchTournamentData = async (): Promise<TournamentData> => {
  try {
    console.log(`[API] Fetching standings for League ${LEAGUE_ID}, Season ${SEASON}...`);
    
    const response = await fetch(`${API_BASE}/standings?league=${LEAGUE_ID}&season=${SEASON}`, {
      method: 'GET',
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erreur réseau: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // API-Sports returns errors in an 'errors' object even with 200 OK
    if (data.errors && Object.keys(data.errors).length > 0) {
      const errorMsg = typeof data.errors === 'object' 
        ? Object.values(data.errors).join(', ') 
        : data.errors;
      throw new Error(errorMsg || "L'API a renvoyé une erreur.");
    }

    if (!data.response || data.response.length === 0 || !data.response[0].league || !data.response[0].league.standings) {
      throw new Error("Aucune donnée disponible pour cette compétition/saison.");
    }

    const apiGroups = data.response[0].league.standings;
    const teams: Record<string, Team> = {};
    const groups: Group[] = [];

    // apiGroups is usually an array of arrays (one per group)
    apiGroups.forEach((groupData: any[], index: number) => {
      const groupNameFromApi = groupData[0]?.group || `Groupe ${String.fromCharCode(65 + index)}`;
      const groupLetter = groupNameFromApi.split(' ').pop() || String.fromCharCode(65 + index);
      const teamIds: string[] = [];

      groupData.forEach((item: any) => {
        const t = item.team;
        const internalId = t.id.toString();
        teamIds.push(internalId);
        
        teams[internalId] = {
          id: internalId,
          apiId: internalId,
          name: t.name,
          flag: '', 
          badge: t.logo,
          stadium: 'Stade à déterminer',
          players: []
        };
      });

      groups.push({
        id: groupLetter,
        name: groupNameFromApi,
        teamIds: teamIds
      });
    });

    return { teams, groups };
  } catch (error: any) {
    console.error("[API ERROR]", error);
    throw new Error(error.message || "Impossible de se connecter à l'API Football.");
  }
};

export const fetchTeamPlayers = async (teamId: string): Promise<Player[]> => {
  try {
    const response = await fetch(`${API_BASE}/players/squads?team=${teamId}`, {
      method: 'GET',
      headers: getHeaders()
    });
    const data = await response.json();
    
    if (data.response && data.response[0]?.players) {
      return data.response[0].players.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        position: p.position,
        thumb: p.photo,
        number: p.number?.toString()
      }));
    }
    return [];
  } catch (error) {
    console.error(`[API ERROR] Players failed for team ${teamId}`, error);
    return [];
  }
};
