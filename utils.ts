
import { Match, TeamStats, Group, Team } from './types';

export const calculateGroupStats = (groupId: string, matches: Match[], teamIds: string[]): TeamStats[] => {
  const stats: Record<string, TeamStats> = {};
  teamIds.forEach(id => {
    stats[id] = { teamId: id, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
  });

  matches.forEach(match => {
    if (teamIds.includes(match.homeTeamId) && match.homeScore !== null && match.awayScore !== null) {
      const h = match.homeScore;
      const a = match.awayScore;
      const home = match.homeTeamId;
      const away = match.awayTeamId;

      if (stats[home] && stats[away]) {
        stats[home].played++;
        stats[away].played++;
        stats[home].gf += h;
        stats[away].gf += a;
        stats[home].ga += a;
        stats[away].ga += h;
        stats[home].gd = stats[home].gf - stats[home].ga;
        stats[away].gd = stats[away].gf - stats[away].ga;

        if (h > a) { stats[home].won++; stats[home].points += 3; stats[away].lost++; }
        else if (h < a) { stats[away].won++; stats[away].points += 3; stats[home].lost++; }
        else { stats[home].drawn++; stats[home].points += 1; stats[away].drawn++; stats[away].points += 1; }
      }
    }
  });

  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
};

export const getQualifiedTeams = (allGroupStats: Record<string, TeamStats[]>) => {
  const qualified: any[] = [];
  const thirdPlaceTeams: any[] = [];

  Object.entries(allGroupStats).forEach(([groupId, stats]) => {
    if (stats.length >= 1) qualified.push({ teamId: stats[0].teamId, group: groupId, position: 1, stats: stats[0] });
    if (stats.length >= 2) qualified.push({ teamId: stats[1].teamId, group: groupId, position: 2, stats: stats[1] });
    if (stats.length >= 3) thirdPlaceTeams.push({ teamId: stats[2].teamId, group: groupId, stats: stats[2] });
  });

  thirdPlaceTeams.sort((a, b) => (b.stats.points !== a.stats.points) ? b.stats.points - a.stats.points : b.stats.gd - a.stats.gd);
  const bestThirds = thirdPlaceTeams.slice(0, 4);
  bestThirds.forEach(t => qualified.push({ teamId: t.teamId, group: t.group, position: 3, stats: t.stats }));

  return { qualified, bestThirds };
};

export const getKnockoutFixtures = (qualified: any[], bestThirds: any[]) => {
  const getTeam = (group: string, pos: number) => qualified.find(q => q.group === group && q.position === pos)?.teamId || null;
  const thirdsMap = bestThirds.map(t => t.group);
  
  return [
    { id: 'r16_1', homeTeamId: getTeam('A', 2), awayTeamId: getTeam('C', 2), round: 'r16' as const },
    { id: 'r16_2', homeTeamId: getTeam('D', 1), awayTeamId: getTeam(thirdsMap[0], 3), round: 'r16' as const },
    { id: 'r16_3', homeTeamId: getTeam('B', 1), awayTeamId: getTeam(thirdsMap[1], 3), round: 'r16' as const },
    { id: 'r16_4', homeTeamId: getTeam('F', 1), awayTeamId: getTeam('E', 2), round: 'r16' as const },
    { id: 'r16_5', homeTeamId: getTeam('E', 1), awayTeamId: getTeam('D', 2), round: 'r16' as const },
    { id: 'r16_6', homeTeamId: getTeam('C', 1), awayTeamId: getTeam(thirdsMap[2], 3), round: 'r16' as const },
    { id: 'r16_7', homeTeamId: getTeam('A', 1), awayTeamId: getTeam(thirdsMap[3], 3), round: 'r16' as const },
    { id: 'r16_8', homeTeamId: getTeam('B', 2), awayTeamId: getTeam('F', 2), round: 'r16' as const },
  ];
};

export const assignMatchMetadata = (matches: Match[], teams: Record<string, Team>): Match[] => {
  const venues = ["Casablanca", "Rabat", "Tanger", "Marrakech", "Agadir", "Fes"];
  const times = ["17:00", "20:00"];

  return matches.map((match, index) => {
    // Si la date ou le stade existe déjà dans le JSON, on les garde !
    return {
      ...match,
      date: match.date || `Jour ${Math.floor(index/3) + 1}`,
      time: match.time || times[index % 2],
      venue: match.venue || venues[index % venues.length]
    };
  });
};
