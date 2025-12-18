
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, ChevronRight, RotateCcw, Medal, Star, X, RefreshCw, Wifi, Clock, Calendar, MapPin, Users, Shirt, Activity, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { GROUPS, TEAMS as INITIAL_TEAMS, INITIAL_GROUP_MATCHES } from './constants';
import { Match, TeamStats, Team } from './types';
import { calculateGroupStats, getQualifiedTeams, getKnockoutFixtures, assignMatchMetadata } from './utils';
import { fetchTournamentData, fetchTeamPlayers } from './api';

// --- Components ---

const Countdown = () => (
  <div className="flex items-center gap-2 text-xs font-mono font-bold bg-black/20 px-3 py-1.5 rounded-lg text-white border border-white/20 shadow-inner">
    <Clock className="w-3.5 h-3.5 text-maroc-gold animate-pulse" />
    <span className="tracking-widest uppercase">Coup d'envoi: 21 Déc. 2025</span>
  </div>
);

const Navbar = ({ 
  reset, 
  isOnline
}: { 
  reset: () => void, 
  isOnline: boolean
}) => (
  <nav className="bg-gradient-to-r from-maroc-red to-maroc-green text-white p-4 sticky top-0 z-50 shadow-2xl border-b-4 border-maroc-gold">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-white p-1 rounded-xl shadow-lg border-2 border-maroc-gold relative group">
          <img 
            src="https://media.api-sports.io/football/leagues/6.png" 
            alt="CAN 2025 Logo" 
            className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
          />
          {isOnline && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-maroc-red rounded-full animate-pulse"></span>}
        </div>
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight uppercase leading-none flex items-center gap-2 drop-shadow-md">
            CAN 2025
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-maroc-gold tracking-[0.3em] uppercase">Simulateur Officiel</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Countdown />
        <button onClick={reset} className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-white/10 hover:border-white/30 backdrop-blur-sm">
          <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" /> 
          <span>Réinitialiser</span>
        </button>
      </div>
    </div>
  </nav>
);

interface MatchCardProps {
  match: Match;
  onChange: (id: string, home: number | null, away: number | null) => void;
  teams: Record<string, Team>;
  onTeamClick: (id: string) => void;
  variant?: 'group' | 'knockout';
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onChange, teams, onTeamClick, variant = 'group' }) => {
  const home = match.homeTeamId ? teams[match.homeTeamId] : null;
  const away = match.awayTeamId ? teams[match.awayTeamId] : null;

  if (!home || !away) return (
    <div className="bg-gray-50/50 border border-gray-200 p-4 rounded-xl text-center text-gray-400 text-xs font-medium uppercase tracking-wide">
      En attente des qualifiés
    </div>
  );

  const handleScoreInput = (team: 'home' | 'away', val: string) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    const intVal = cleanVal === '' ? null : parseInt(cleanVal, 10);
    if (team === 'home') onChange(match.id, intVal, match.awayScore);
    else onChange(match.id, match.homeScore, intVal);
  };

  return (
    <div className={`
      relative overflow-hidden transition-all duration-300 flex flex-col
      ${variant === 'knockout' ? 'bg-white shadow-xl border-l-4 border-maroc-red' : 'bg-white border border-gray-100 hover:border-maroc-green/30 hover:shadow-md'}
      rounded-xl group
    `}>
      <div className="flex justify-between items-center bg-gray-50/80 px-3 py-1.5 border-b border-gray-100 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-maroc-gold" /> {match.date}
          </div>
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2">
            <Clock className="w-3 h-3 text-maroc-red" /> {match.time}
          </div>
        </div>
        <div className="flex items-center gap-1 text-right max-w-[140px] truncate">
          <MapPin className="w-3 h-3 text-maroc-green shrink-0" /> {match.venue?.split('(')[0]}
        </div>
      </div>

      <div className="p-4 flex items-center justify-between gap-2">
        <div className="flex flex-col items-center flex-1 cursor-pointer group/team" onClick={() => onTeamClick(home.id)}>
          <div className="w-12 h-12 mb-1 flex items-center justify-center transition-transform group-hover/team:scale-110 duration-300 drop-shadow-sm">
            {home.badge ? <img src={home.badge} className="max-w-full max-h-full object-contain" /> : <span className="text-3xl">{home.flag}</span>}
          </div>
          <span className="text-[11px] font-black font-display text-gray-800 text-center uppercase tracking-tight leading-tight group-hover/team:text-maroc-red transition-colors">{home.name}</span>
        </div>
        
        <div className="flex items-center gap-1 bg-black p-2 rounded-xl shadow-2xl border-2 border-gray-800 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl"></div>
          <input 
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-10 bg-transparent text-center font-mono font-bold text-3xl text-maroc-gold focus:text-white outline-none appearance-none placeholder-gray-900 scoreboard-text transition-colors"
            value={match.homeScore ?? ''} 
            placeholder="0"
            onChange={(e) => handleScoreInput('home', e.target.value)}
          />
          <div className="flex flex-col gap-1.5 px-1 opacity-50">
             <div className="w-1 h-1 rounded-full bg-maroc-red animate-pulse"></div>
             <div className="w-1 h-1 rounded-full bg-maroc-red animate-pulse"></div>
          </div>
          <input 
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-10 bg-transparent text-center font-mono font-bold text-3xl text-maroc-gold focus:text-white outline-none appearance-none placeholder-gray-900 scoreboard-text transition-colors"
            value={match.awayScore ?? ''} 
            placeholder="0"
            onChange={(e) => handleScoreInput('away', e.target.value)}
          />
        </div>

        <div className="flex flex-col items-center flex-1 cursor-pointer group/team" onClick={() => onTeamClick(away.id)}>
          <div className="w-12 h-12 mb-1 flex items-center justify-center transition-transform group-hover/team:scale-110 duration-300 drop-shadow-sm">
            {away.badge ? <img src={away.badge} className="max-w-full max-h-full object-contain" /> : <span className="text-3xl">{away.flag}</span>}
          </div>
          <span className="text-[11px] font-black font-display text-gray-800 text-center uppercase tracking-tight leading-tight group-hover/team:text-maroc-red transition-colors">{away.name}</span>
        </div>
      </div>
    </div>
  );
};

const StandingsTable = ({ 
  stats, teams, onTeamClick 
}: { 
  stats: TeamStats[], teams: Record<string, Team>, onTeamClick: (id: string) => void
}) => (
  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <table className="w-full text-sm text-left">
      <thead className="bg-gray-50 text-gray-400 font-bold text-[9px] uppercase tracking-[0.2em] font-display border-b border-gray-100">
        <tr>
          <th className="px-3 py-2">Équipe</th>
          <th className="px-1 py-2 text-center">J</th>
          <th className="px-1 py-2 text-center">Diff</th>
          <th className="px-3 py-2 text-center text-maroc-red">Pts</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {stats.map((s, idx) => {
          const team = teams[s.teamId];
          const isQualifying = idx < 2; 
          return (
            <tr key={s.teamId} className={`transition-colors hover:bg-gray-50 ${isQualifying ? 'bg-green-50/30' : ''}`}>
              <td className="px-3 py-2 font-bold text-gray-800 flex items-center gap-2">
                <span className={`text-[10px] w-3 font-mono ${isQualifying ? 'text-maroc-green' : 'text-gray-400'}`}>{idx + 1}</span> 
                <div onClick={() => onTeamClick(s.teamId)} className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:text-maroc-red transition-colors group">
                   {team.badge ? <img src={team.badge} className="w-5 h-5 object-contain" /> : <span className="text-base">{team.flag}</span>}
                  <span className="truncate text-[11px] font-display font-bold uppercase tracking-wide">{team.name}</span>
                </div>
              </td>
              <td className="px-1 py-2 text-center text-gray-500 font-mono text-[10px]">{s.played}</td>
              <td className="px-1 py-2 text-center text-gray-400 font-mono text-[10px]">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
              <td className="px-3 py-2 text-center font-bold font-mono text-gray-900 bg-gray-50/50">{s.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const GroupAccordion = ({ 
  group, stats, matches, teams, onTeamClick, onScoreChange, isExpanded, onToggle, idx 
}: { 
  group: any, stats: TeamStats[], matches: Match[], teams: Record<string, Team>, onTeamClick: (id: string) => void, onScoreChange: any, isExpanded: boolean, onToggle: () => void, idx: number 
}) => {
  const headerColor = idx % 2 === 0 ? 'from-maroc-red to-red-700' : 'from-maroc-green to-emerald-800';
  
  return (
    <div className="glass-panel rounded-2xl overflow-hidden mb-6 transition-all duration-300 shadow-md hover:shadow-xl border border-white/50">
      <button 
        onClick={onToggle}
        className={`w-full bg-gradient-to-r ${headerColor} p-4 flex justify-between items-center text-white relative transition-all active:scale-[0.98]`}
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm border border-white/10 text-white font-black text-xl w-10 h-10 flex items-center justify-center">
             {group.id}
          </div>
          <h3 className="text-xl font-display font-black uppercase tracking-widest">{group.name}</h3>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest hidden sm:block">Classement & Matchs</span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-maroc-gold" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-4 sm:p-6 bg-white/40 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Classement Direct <div className="h-px bg-gray-200 flex-1"></div>
             </h4>
             <StandingsTable stats={stats} teams={teams} onTeamClick={onTeamClick} />
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
               Calendrier du Groupe <div className="h-px bg-gray-200 flex-1"></div>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
              {matches.map(match => (
                <MatchCard key={match.id} match={match} onChange={onScoreChange} teams={teams} onTeamClick={onTeamClick} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KnockoutBracketWithTeams = ({ 
  matches, teams, onScoreChange, onTeamClick 
}: { 
  matches: Match[], teams: Record<string, Team>, onScoreChange: (id: string, home: number | null, away: number | null) => void, onTeamClick: (id: string) => void
}) => {
  const rounds = [
    { id: 'r16', label: 'Huitièmes de Finale' },
    { id: 'qf', label: 'Quarts de Finale' },
    { id: 'sf', label: 'Demi-Finales' },
    { id: 'final', label: 'Grande Finale' },
  ];

  return (
    <div className="space-y-12">
      {rounds.map(round => {
        const roundMatches = matches.filter(m => m.round === round.id);
        if (roundMatches.length === 0) return null;
        return (
          <div key={round.id} className="animate-fade-in-up">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] flex items-center gap-4 mb-6 px-2">
               <span className="shrink-0">{round.label}</span> 
               <div className="h-px bg-gradient-to-r from-gray-200 to-transparent flex-1"></div>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roundMatches.map(m => (
                <MatchCard 
                  key={m.id} 
                  match={m} 
                  onChange={onScoreChange} 
                  teams={teams} 
                  onTeamClick={onTeamClick} 
                  variant="knockout" 
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TeamDetailModal = ({ 
  isOpen, onClose, team, updateTeamPlayers 
}: { 
  isOpen: boolean, onClose: () => void, team: Team | null, updateTeamPlayers: (id: string, players: any[]) => void 
}) => {
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    if (isOpen && team && (!team.players || team.players.length === 0)) {
      setLoadingPlayers(true);
      fetchTeamPlayers(team.id, team.apiId).then(players => {
        updateTeamPlayers(team.id, players);
        setLoadingPlayers(false);
      });
    }
  }, [isOpen, team?.id]);

  if (!isOpen || !team) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-maroc-dark/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-[#f8f5f2] rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 animate-fade-in-up overflow-hidden max-h-[90vh] flex flex-col border border-white/50">
        <div className="h-32 bg-gray-200 relative">
          {team.banner ? <img src={team.banner} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-r from-maroc-red to-maroc-green opacity-90"></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8f5f2] to-transparent"></div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full border border-white/20"><X className="w-5 h-5" /></button>
          <div className="absolute -bottom-8 left-8 flex items-end gap-4">
            <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-xl border-2 border-white transform -rotate-3">
               {team.badge ? <img src={team.badge} className="w-full h-full object-contain" /> : <span className="text-5xl">{team.flag}</span>}
            </div>
            <div className="mb-8 text-gray-900">
              <h2 className="text-3xl font-display font-black uppercase tracking-tight">{team.name}</h2>
            </div>
          </div>
        </div>
        <div className="mt-10 p-6 overflow-y-auto custom-scrollbar">
           <div className="space-y-4">
            <h3 className="font-display font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-200 pb-2 text-xs">
              <Users className="w-4 h-4 text-maroc-gold" /> Effectif Officiel
            </h3>
            {loadingPlayers ? (
              <div className="py-8 text-center text-gray-400 flex flex-col items-center">
                 <RefreshCw className="w-6 h-6 animate-spin mb-2 text-maroc-red" />
                 <span className="font-mono text-[10px]">Mise à jour depuis API-Sports...</span>
              </div>
            ) : team.players && team.players.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {team.players.map(player => (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-gray-100 hover:border-maroc-gold/50 transition-all group">
                    <div className="w-8 h-8 bg-gray-100 rounded-full overflow-hidden shrink-0">
                      {player.thumb || player.cutout ? <img src={player.thumb || player.cutout} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-[8px] font-bold">{player.position?.substring(0,2)}</div>}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-gray-800 truncate">{player.name}</div>
                      <div className="text-[8px] text-maroc-green font-bold uppercase">{player.position}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-6 text-xs text-gray-500 font-mono">Données indisponibles hors-ligne.</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="fixed inset-0 bg-[#f8f5f2] z-[100] flex flex-col items-center justify-center text-gray-800">
    <div className="relative mb-6">
       <div className="w-16 h-16 border-4 border-gray-100 rounded-full"></div>
       <div className="w-16 h-16 border-4 border-maroc-red border-t-maroc-green rounded-full animate-spin absolute top-0 left-0"></div>
       <Trophy className="w-6 h-6 text-maroc-gold absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
    </div>
    <h2 className="text-2xl font-display font-black uppercase tracking-widest text-maroc-dark">CAN 2025</h2>
    <div className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
       <Wifi className="w-3 h-3 text-maroc-green animate-pulse" />
       <p className="text-[10px] font-mono font-bold text-gray-400 uppercase">Synchronisation API-Sports...</p>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups');
  const [teams, setTeams] = useState<Record<string, Team>>(INITIAL_TEAMS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_GROUP_MATCHES);
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>('A');

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await fetchTournamentData();
      setTeams(data);
      setMatches(prev => assignMatchMetadata(prev, data));
      setLoading(false);
    };
    init();
  }, []);

  const groupStats = useMemo(() => {
    const stats: Record<string, TeamStats[]> = {};
    GROUPS.forEach(group => {
      stats[group.id] = calculateGroupStats(group.id, matches, group.teamIds);
    });
    return stats;
  }, [matches]);

  const handleScoreChange = (id: string, homeScore: number | null, awayScore: number | null) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, homeScore, awayScore } : m));
  };

  const generateBracket = () => {
    const { qualified, bestThirds } = getQualifiedTeams(groupStats);
    const r16Fixtures = getKnockoutFixtures(qualified, bestThirds);
    const timedFixtures = assignMatchMetadata(r16Fixtures.map(f => ({ ...f, homeScore: null, awayScore: null } as Match)), teams);
    setKnockoutMatches(timedFixtures);
    setActiveTab('knockout');
  };

  const handleKnockoutScore = (id: string, homeScore: number | null, awayScore: number | null) => {
    const updatedMatches = knockoutMatches.map(m => m.id === id ? { ...m, homeScore, awayScore } : m);
    setKnockoutMatches(updatedMatches);
    
    const getWinner = (matchId: string): string | null => {
      const m = updatedMatches.find(x => x.id === matchId);
      if (!m || m.homeScore === null || m.awayScore === null) return null;
      if (m.homeScore === m.awayScore) return m.homeTeamId; // Simple fallback
      return m.homeScore > m.awayScore ? m.homeTeamId : m.awayTeamId; 
    };

    const nextRoundMap = [
      { id: 'qf_1', h: 'r16_1', a: 'r16_2', r: 'qf' },
      { id: 'qf_2', h: 'r16_3', a: 'r16_4', r: 'qf' },
      { id: 'qf_3', h: 'r16_5', a: 'r16_6', r: 'qf' },
      { id: 'qf_4', h: 'r16_7', a: 'r16_8', r: 'qf' },
      { id: 'sf_1', h: 'qf_1', a: 'qf_2', r: 'sf' },
      { id: 'sf_2', h: 'qf_3', a: 'qf_4', r: 'sf' },
      { id: 'final', h: 'sf_1', a: 'sf_2', r: 'final' },
    ];

    const generated = [...updatedMatches.filter(m => m.round === 'r16')];
    nextRoundMap.forEach(round => {
       const existing = updatedMatches.find(m => m.id === round.id);
       const homeId = getWinner(round.h);
       const awayId = getWinner(round.a);
       if (homeId || awayId) {
         generated.push({ id: round.id, round: round.r as any, homeTeamId: homeId || '', awayTeamId: awayId || '', homeScore: existing?.homeScore ?? null, awayScore: existing?.awayScore ?? null, date: existing?.date || 'TBD', venue: existing?.venue || 'TBD', time: existing?.time || '20:00' });
       }
    });
    setKnockoutMatches(generated);
  };

  const champion = (() => {
    const final = knockoutMatches.find(m => m.round === 'final');
    if (!final || final.homeScore === null || final.awayScore === null) return null;
    return final.homeScore > final.awayScore ? teams[final.homeTeamId] : teams[final.awayTeamId];
  })();

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen pb-12 font-sans selection:bg-maroc-red selection:text-white">
      <Navbar isOnline={!loading} reset={() => { if(confirm('Réinitialiser tous les scores ?')) { setMatches(assignMatchMetadata(INITIAL_GROUP_MATCHES, teams)); setKnockoutMatches([]); setActiveTab('groups'); setExpandedGroupId('A'); } }} />

      <main className="max-w-7xl mx-auto px-4 pt-10">
        <div className="text-center mb-12 relative animate-fade-in">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-maroc-red/10 rounded-full blur-3xl"></div>
          <span className="inline-block py-1.5 px-4 rounded-full bg-white/50 backdrop-blur text-maroc-green text-[10px] font-bold tracking-[0.2em] uppercase mb-4 border border-white shadow-sm">
            Road to Morocco 2025
          </span>
          <h2 className="text-5xl md:text-6xl font-display font-black text-maroc-dark mb-4 tracking-tighter drop-shadow-sm uppercase text-balance">
            VOTRE <span className="text-transparent bg-clip-text bg-gradient-to-r from-maroc-red to-maroc-green">CLASSEMENT</span> CAN
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg leading-relaxed font-medium">
             Saisissez vos pronostics et voyez qui soulèvera le trophée au Royaume du Maroc.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-white/60 backdrop-blur p-1.5 rounded-2xl shadow-lg border border-white/50 inline-flex relative z-10">
            <button onClick={() => setActiveTab('groups')} className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 font-display ${activeTab === 'groups' ? 'bg-maroc-dark text-white shadow-lg transform scale-105' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}>Phase de Groupes</button>
            <button onClick={() => { if (knockoutMatches.length === 0) generateBracket(); setActiveTab('knockout'); }} className={`px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 font-display ${activeTab === 'knockout' ? 'bg-maroc-red text-white shadow-lg transform scale-105' : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'}`}>Phase Finale {knockoutMatches.length === 0 && <span className="w-2 h-2 rounded-full bg-maroc-red animate-pulse"></span>}</button>
          </div>
        </div>

        <div className="animate-fade-in pb-20">
          {activeTab === 'groups' ? (
            <div className="space-y-4 max-w-6xl mx-auto">
              {GROUPS.map((group, idx) => (
                <GroupAccordion 
                  key={group.id}
                  idx={idx}
                  group={group}
                  stats={groupStats[group.id]}
                  matches={matches.filter(m => group.teamIds.includes(m.homeTeamId))}
                  teams={teams}
                  onTeamClick={setSelectedTeamId}
                  onScoreChange={handleScoreChange}
                  isExpanded={expandedGroupId === group.id}
                  onToggle={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                />
              ))}
              
              <div className="flex justify-center pt-8">
                <button onClick={() => { generateBracket(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="group relative px-10 py-5 bg-maroc-dark text-white font-black font-display text-lg rounded-2xl shadow-2xl hover:shadow-maroc-red/50 hover:scale-105 transition-all overflow-hidden tracking-widest uppercase">
                  <div className="absolute inset-0 bg-gradient-to-r from-maroc-red to-maroc-green opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative flex items-center gap-3 z-10">Générer la Phase Finale <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {knockoutMatches.length > 0 ? (
                <>
                  <div className="glass-panel p-8 rounded-3xl shadow-xl border border-white text-center mb-8 relative overflow-hidden bg-white/60">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-maroc-red via-maroc-gold to-maroc-green"></div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.4em] mb-4">Champion Pronostiqué</h3>
                    {champion ? (
                      <div className="flex flex-col items-center animate-bounce-short">
                        <div className="relative mb-6">
                          <div className="absolute -inset-6 bg-maroc-gold/20 rounded-full blur-xl animate-pulse"></div>
                          {champion.badge ? <img src={champion.badge} className="w-32 h-32 object-contain filter drop-shadow-xl relative z-10" /> : <div className="text-8xl">{champion.flag}</div>}
                        </div>
                        <div className="text-6xl font-display font-black text-maroc-dark mb-2 tracking-tighter uppercase">{champion.name}</div>
                        <div className="flex items-center gap-2 text-white bg-maroc-gold px-6 py-2 rounded-full shadow-lg">
                          <Medal className="w-5 h-5 fill-current" /> <span className="font-bold text-xs uppercase tracking-widest">Vainqueur CAN 2025</span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-4"><Trophy className="w-20 h-20 opacity-20" /><p className="text-xs font-bold uppercase tracking-widest">Saisissez les scores des matchs</p></div>
                    )}
                  </div>
                  <KnockoutBracketWithTeams 
                    matches={knockoutMatches}
                    teams={teams}
                    onScoreChange={handleKnockoutScore}
                    onTeamClick={setSelectedTeamId}
                  />
                </>
              ) : (
                <div className="text-center py-24 glass-panel rounded-3xl border-2 border-dashed border-gray-300 mx-auto max-w-2xl bg-white/50">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 shadow-sm"><Trophy className="w-8 h-8" /></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Phase Finale Non Générée</h3>
                  <button onClick={() => setActiveTab('groups')} className="text-maroc-red font-bold hover:underline uppercase text-[10px] tracking-widest">Retournez à la phase de groupes</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <TeamDetailModal 
        isOpen={!!selectedTeamId} 
        onClose={() => setSelectedTeamId(null)} 
        team={selectedTeamId ? teams[selectedTeamId] : null} 
        updateTeamPlayers={(id, players) => setTeams(prev => ({ ...prev, [id]: { ...prev[id], players } }))}
      />

      <footer className="mt-10 border-t border-gray-200/50 bg-white/60 backdrop-blur-sm py-10 text-center">
        <img 
            src="https://media.api-sports.io/football/leagues/6.png" 
            alt="CAN Logo" 
            className="w-8 h-8 object-contain mx-auto mb-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer"
        />
        <p className="text-gray-400 font-bold text-[9px] uppercase tracking-widest">CAN 2025 Maroc • Propulsé par API-Football • Simulation Fan</p>
      </footer>
    </div>
  );
}
