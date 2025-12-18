
import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, RotateCcw, Medal, X, RefreshCw, Wifi, Clock, Calendar, MapPin, Users, Activity, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Match, TeamStats, Team, Group } from './types';
import { calculateGroupStats, getQualifiedTeams, getKnockoutFixtures, assignMatchMetadata } from './utils';
import { fetchTournamentData, fetchTeamPlayers } from './api';

// --- Composants Internes ---

const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const targetDate = new Date('2025-12-21T20:00:00').getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) {
        setTimeLeft('TOURNOI EN COURS');
        return;
      }
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`J-${days} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs font-mono font-bold bg-black/20 px-3 py-1.5 rounded-lg text-white border border-white/20 shadow-inner min-w-[140px] justify-center">
      <Clock className="w-3.5 h-3.5 text-maroc-gold animate-pulse" />
      <span className="tracking-widest uppercase whitespace-nowrap">{timeLeft || 'Chargement...'}</span>
    </div>
  );
};

const Navbar = ({ reset, isOnline }: { reset: () => void, isOnline: boolean }) => (
  <nav className="bg-gradient-to-r from-maroc-red to-maroc-green text-white p-4 sticky top-0 z-50 shadow-2xl border-b-4 border-maroc-gold">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 relative shadow-lg">
          <Trophy className="w-6 h-6 text-maroc-gold drop-shadow-md" />
          {isOnline && <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-maroc-red rounded-full animate-pulse shadow-[0_0_10px_#4ade80]"></span>}
        </div>
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight uppercase leading-none drop-shadow-md">CAN 2025</h1>
          <span className="text-[10px] font-bold text-maroc-gold tracking-[0.3em] uppercase">Royaume du Maroc</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Countdown />
        <button onClick={reset} className="group flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border border-white/10">
          <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-180 transition-transform duration-500" /> 
          <span>Reset</span>
        </button>
      </div>
    </div>
  </nav>
);

const MatchCard = ({ match, onChange, teams, onTeamClick, variant = 'group' }: { match: Match, onChange: any, teams: Record<string, Team>, onTeamClick: any, variant?: 'group' | 'knockout' }) => {
  const home = match.homeTeamId ? teams[match.homeTeamId] : null;
  const away = match.awayTeamId ? teams[match.awayTeamId] : null;

  if (!home || !away) return <div className="bg-gray-50 p-4 rounded-xl text-center text-[10px] font-bold text-gray-400 uppercase">En attente</div>;

  return (
    <div className={`relative overflow-hidden transition-all duration-300 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md ${variant === 'knockout' ? 'border-l-4 border-maroc-red' : ''}`}>
      {/* Top Info Bar: Date & Time */}
      <div className="flex justify-between items-center bg-gray-50/80 px-3 py-2 border-b border-gray-100 text-[9px] text-gray-500 font-bold uppercase tracking-widest">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3 h-3 text-maroc-red" /> 
          {match.date || 'TBD'}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-maroc-gold" /> 
          {match.time || '20:00'}
        </div>
      </div>

      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex flex-col items-center flex-1 cursor-pointer group/team" onClick={() => onTeamClick(home.id)}>
          <img src={home.badge} className="w-12 h-12 object-contain mb-2 transition-transform group-hover/team:scale-110" alt="" />
          <span className="text-[11px] font-black text-gray-800 text-center uppercase truncate w-full">{home.name}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-maroc-dark p-2 rounded-xl border-2 border-gray-800 shadow-inner">
          <input type="number" min="0" className="w-8 bg-transparent text-center font-mono font-bold text-xl text-maroc-gold outline-none" value={match.homeScore ?? ''} placeholder="0" onChange={(e) => onChange(match.id, e.target.value === '' ? null : parseInt(e.target.value), match.awayScore)} />
          <span className="text-maroc-red font-black text-sm">:</span>
          <input type="number" min="0" className="w-8 bg-transparent text-center font-mono font-bold text-xl text-maroc-gold outline-none" value={match.awayScore ?? ''} placeholder="0" onChange={(e) => onChange(match.id, match.homeScore, e.target.value === '' ? null : parseInt(e.target.value))} />
        </div>

        <div className="flex flex-col items-center flex-1 cursor-pointer group/team" onClick={() => onTeamClick(away.id)}>
          <img src={away.badge} className="w-12 h-12 object-contain mb-2 transition-transform group-hover/team:scale-110" alt="" />
          <span className="text-[11px] font-black text-gray-800 text-center uppercase truncate w-full">{away.name}</span>
        </div>
      </div>

      {/* Bottom Info Bar: Stadium / Venue */}
      <div className="px-3 py-1.5 bg-gray-50/30 border-t border-gray-100/50 flex items-center gap-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-tight">
        <MapPin className="w-3 h-3 text-maroc-green shrink-0" />
        <span className="truncate">{match.venue || 'Maroc 2025'}</span>
      </div>
    </div>
  );
};

const StandingsTable = ({ stats, teams, onTeamClick }: { stats: TeamStats[], teams: Record<string, Team>, onTeamClick: any }) => (
  <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
    <table className="w-full text-left">
      <thead className="bg-gray-50 text-gray-400 font-bold text-[9px] uppercase tracking-widest border-b">
        <tr>
          <th className="px-3 py-2">Équipe</th>
          <th className="px-1 py-2 text-center">J</th>
          <th className="px-1 py-2 text-center">DG</th>
          <th className="px-3 py-2 text-center text-maroc-red">Pts</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {stats.map((s, idx) => {
          const team = teams[s.teamId];
          const isQualifying = idx < 2;
          return (
            <tr key={s.teamId} className={`hover:bg-gray-50 transition-colors ${isQualifying ? 'bg-green-50/20' : ''}`}>
              <td className="px-3 py-2 flex items-center gap-2 cursor-pointer" onClick={() => onTeamClick(s.teamId)}>
                <span className={`text-[10px] font-mono w-3 ${isQualifying ? 'text-maroc-green' : 'text-gray-300'}`}>{idx + 1}</span>
                <img src={team?.badge} className="w-5 h-5 object-contain" alt="" />
                <span className="text-[10px] font-bold uppercase truncate max-w-[90px]">{team?.name}</span>
              </td>
              <td className="px-1 py-2 text-center text-[10px] font-mono text-gray-500">{s.played}</td>
              <td className="px-1 py-2 text-center text-[10px] font-mono text-gray-400">{s.gd > 0 ? `+${s.gd}` : s.gd}</td>
              <td className="px-3 py-2 text-center text-[10px] font-black font-mono bg-gray-50/50">{s.points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const GroupAccordion = ({ group, stats, matches, teams, onTeamClick, onScoreChange, isExpanded, onToggle, idx }: any) => {
  const headerColor = idx % 2 === 0 ? 'from-maroc-red to-red-700' : 'from-maroc-green to-emerald-800';
  return (
    <div className="glass-panel rounded-2xl overflow-hidden mb-6 shadow-md border border-white/50">
      <button onClick={onToggle} className={`w-full bg-gradient-to-r ${headerColor} p-4 flex justify-between items-center text-white relative transition-all active:scale-[0.98]`}>
        <div className="flex items-center gap-4 relative z-10">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
             <Activity className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl font-display font-black uppercase tracking-widest">{group.name}</h3>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          {isExpanded ? <ChevronUp className="w-5 h-5 text-maroc-gold" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>
      <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="p-4 sm:p-6 bg-white/40 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
             <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">Classement Live <div className="h-px bg-gray-200 flex-1"></div></h4>
             <StandingsTable stats={stats} teams={teams} onTeamClick={onTeamClick} />
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">Matchs du Groupe <div className="h-px bg-gray-200 flex-1"></div></h4>
            <div className="grid grid-cols-1 gap-4">
              {matches.map((m: Match) => (
                <div key={m.id}>
                  <MatchCard match={m} onChange={onScoreChange} teams={teams} onTeamClick={onTeamClick} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'groups' | 'knockout'>('groups');
  const [teams, setTeams] = useState<Record<string, Team>>({});
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const init = async () => {
    setLoading(true);
    try {
      const data = await fetchTournamentData();
      setTeams(data.teams);
      setGroups(data.groups);
      const m = data.matches?.length ? data.matches : [];
      setMatches(assignMatchMetadata(m, data.teams));
      setExpandedGroupId(data.groups[0]?.id || null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { init(); }, []);

  const groupStats = useMemo(() => {
    const stats: Record<string, TeamStats[]> = {};
    groups.forEach(g => { stats[g.id] = calculateGroupStats(g.id, matches, g.teamIds); });
    return stats;
  }, [matches, groups]);

  const handleScoreChange = (id: string, homeScore: number | null, awayScore: number | null) => {
    setMatches(prev => prev.map(m => m.id === id ? { ...m, homeScore, awayScore } : m));
  };

  const generateBracket = () => {
    const { qualified, bestThirds } = getQualifiedTeams(groupStats);
    const r16Fixtures = getKnockoutFixtures(qualified, bestThirds);
    setKnockoutMatches(assignMatchMetadata(r16Fixtures.map(f => ({ ...f, homeScore: null, awayScore: null } as Match)), teams));
    setActiveTab('knockout');
  };

  const handleKnockoutScore = (id: string, homeScore: number | null, awayScore: number | null) => {
    const updated = knockoutMatches.map(m => m.id === id ? { ...m, homeScore, awayScore } : m);
    setKnockoutMatches(updated);
    const getWinner = (mid: string) => {
      const m = updated.find(x => x.id === mid);
      if (!m || m.homeScore === null || m.awayScore === null) return null;
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
    const generated = [...updated.filter(m => m.round === 'r16')];
    nextRoundMap.forEach(round => {
       const existing = updated.find(m => m.id === round.id);
       const homeId = getWinner(round.h);
       const awayId = getWinner(round.a);
       if (homeId || awayId) {
         generated.push({ id: round.id, round: round.r as any, homeTeamId: homeId || '', awayTeamId: awayId || '', homeScore: existing?.homeScore ?? null, awayScore: existing?.awayScore ?? null, date: existing?.date || 'TBD', venue: existing?.venue || 'Maroc', time: existing?.time || '20:00' });
       }
    });
    setKnockoutMatches(generated);
  };

  const champion = (() => {
    const final = knockoutMatches.find(m => m.round === 'final');
    if (!final || final.homeScore === null || final.awayScore === null) return null;
    return final.homeScore > final.awayScore ? teams[final.homeTeamId] : teams[final.awayTeamId];
  })();

  if (loading) return (
    <div className="fixed inset-0 bg-maroc-sand z-50 flex flex-col items-center justify-center">
      <RefreshCw className="w-12 h-12 text-maroc-red animate-spin mb-4" />
      <p className="text-[10px] font-black uppercase tracking-widest text-maroc-dark">Synchronisation Gist...</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-12 bg-maroc-sand font-sans">
      <Navbar isOnline={true} reset={() => { if(confirm('Réinitialiser les scores ?')) init(); }} />
      <main className="max-w-7xl mx-auto px-4 pt-10">
        <div className="text-center mb-10">
          <span className="inline-block py-1 px-3 rounded-full bg-white shadow-sm text-maroc-green text-[10px] font-black uppercase tracking-widest mb-4">Live Tournament Predictor</span>
          <h2 className="text-4xl md:text-5xl font-display font-black text-maroc-dark mb-4 tracking-tighter uppercase">
            Simulateur <span className="text-maroc-red">CAN 2025</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm font-medium">Suivez le tournoi au Maroc. Entrez vos scores pour voir le classement évoluer en temps réel.</p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur p-1 rounded-2xl shadow-lg border border-gray-100 flex gap-2">
            <button onClick={() => setActiveTab('groups')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'groups' ? 'bg-maroc-dark text-white shadow-md' : 'text-gray-400'}`}>Phase de Groupes</button>
            <button onClick={() => { if(!knockoutMatches.length) generateBracket(); setActiveTab('knockout'); }} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'knockout' ? 'bg-maroc-red text-white shadow-md' : 'text-gray-400'}`}>Tableau Final</button>
          </div>
        </div>
        {activeTab === 'groups' ? (
          <div className="max-w-5xl mx-auto space-y-4">
            {groups.map((group, idx) => (
              <GroupAccordion 
                key={group.id}
                idx={idx}
                group={group}
                stats={groupStats[group.id] || []}
                matches={matches.filter(m => group.teamIds.includes(m.homeTeamId) || group.teamIds.includes(m.awayTeamId))}
                teams={teams}
                onTeamClick={setSelectedTeamId}
                onScoreChange={handleScoreChange}
                isExpanded={expandedGroupId === group.id}
                onToggle={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
              />
            ))}
            <div className="flex justify-center pt-8">
              <button onClick={() => { generateBracket(); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="px-10 py-5 bg-maroc-dark text-white rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 shadow-xl hover:scale-105 transition-all">
                Voir les Qualifiés <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {champion && (
               <div className="glass-panel p-8 rounded-3xl shadow-xl text-center mb-8 bg-white/70 border border-maroc-gold/30">
                  <h3 className="text-[10px] font-black text-maroc-gold uppercase tracking-[0.4em] mb-4">Vainqueur Final</h3>
                  <div className="flex flex-col items-center">
                    <img src={champion.badge} className="w-24 h-24 object-contain mb-4 drop-shadow-xl" alt="" />
                    <div className="text-4xl font-display font-black text-maroc-dark uppercase tracking-tighter">{champion.name}</div>
                  </div>
               </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {knockoutMatches.map(m => (
                <div key={m.id}>
                  <MatchCard match={m} onChange={handleKnockoutScore} teams={teams} onTeamClick={setSelectedTeamId} variant="knockout" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <TeamDetailModal 
        isOpen={!!selectedTeamId} 
        onClose={() => setSelectedTeamId(null)} 
        team={selectedTeamId ? teams[selectedTeamId] : null}
        updateTeamPlayers={(id, players) => setTeams(prev => ({ ...prev, [id]: { ...prev[id], players } }))}
      />
    </div>
  );
}

const TeamDetailModal = ({ isOpen, onClose, team, updateTeamPlayers }: any) => {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isOpen && team && (!team.players || team.players.length === 0)) {
      setLoading(true);
      fetchTeamPlayers(team.id, team.name).then((p: any) => {
        updateTeamPlayers(team.id, p);
        setLoading(false);
      });
    }
  }, [isOpen, team?.id]);
  if (!isOpen || !team) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-maroc-dark/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl relative z-10 overflow-hidden border border-white/50">
        <div className="h-24 bg-gradient-to-r from-maroc-red to-maroc-green"></div>
        <div className="px-8 pb-8">
          <div className="flex items-end gap-4 -mt-10 mb-6">
            <div className="bg-white p-2 rounded-2xl shadow-xl w-20 h-20 border-4 border-white">
              <img src={team.badge} className="w-full h-full object-contain" alt="" />
            </div>
            <h2 className="text-3xl font-display font-black uppercase text-maroc-dark tracking-tighter">{team.name}</h2>
          </div>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2">Effectif (TheSportsDB)</h3>
            {loading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto my-4 text-maroc-red" /> : (
              <div className="grid grid-cols-2 gap-2">
                {team.players?.length ? team.players.map((p: any) => (
                  <div key={p.id} className="p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[8px] font-bold">{p.position?.[0]}</div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold truncate text-maroc-dark">{p.name}</p>
                      <p className="text-[8px] font-bold text-maroc-green uppercase">{p.position}</p>
                    </div>
                  </div>
                )) : <p className="text-center py-4 text-[10px] text-gray-400">Aucun joueur trouvé</p>}
              </div>
            )}
          </div>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
};
