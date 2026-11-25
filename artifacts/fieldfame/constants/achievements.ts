import { ATHLETES } from '@/constants/demo-data';
import type { AppState, HighlightPost } from '@/constants/demo-data';

export type AchievementIcon =
  | 'award'
  | 'calendar'
  | 'target'
  | 'users'
  | 'video'
  | 'zap';

export type AchievementBadge = {
  id: string;
  title: string;
  description: string;
  icon: AchievementIcon;
  level: 'Bronzo' | 'Argento' | 'Oro' | 'Certificato';
  unlocked: boolean;
  verified: boolean;
  progress?: {
    value: number;
    target: number;
    note?: string;
  };
};

function countPosts(posts: HighlightPost[], category?: string) {
  return posts.filter(
    (post) =>
      post.sport === 'Calcio' &&
      (!category || post.category === category),
  ).length;
}

export function getAchievementBadges(state: AppState): AchievementBadge[] {
  const ownPosts = state.myPosts.filter((post) => post.athleteId === 'me');
  const ownGoals = countPosts(ownPosts, 'Gol');
  const highestSampleScore = Math.max(
    ...ATHLETES.filter((athlete) => athlete.sport === 'Calcio').map(
      (athlete) => athlete.goals,
    ),
    0,
  );
  const goalsToLead = highestSampleScore + 1;
  const certifiedWin = state.tournaments.some(
    (tournament) =>
      tournament.winnerAthleteId === 'me' &&
      Boolean(tournament.winnerCertifiedAt),
  );

  return [
    {
      id: 'first-highlight',
      title: 'Prima clip',
      description: 'Pubblica il tuo primo highlight.',
      icon: 'video',
      level: 'Bronzo',
      unlocked: ownPosts.length >= 1,
      verified: false,
      progress: {
        value: Math.min(ownPosts.length, 1),
        target: 1,
      },
    },
    {
      id: 'highlight-creator',
      title: 'Sempre in campo',
      description: 'Pubblica 5 highlight sul tuo profilo.',
      icon: 'zap',
      level: 'Argento',
      unlocked: ownPosts.length >= 5,
      verified: false,
      progress: {
        value: Math.min(ownPosts.length, 5),
        target: 5,
      },
    },
    {
      id: 'ranking-leader',
      title: 'Primo nel ranking',
      description: 'Supera il miglior marcatore della classifica Calcio.',
      icon: 'target',
      level: 'Oro',
      unlocked: state.profile.sport === 'Calcio' && ownGoals >= goalsToLead,
      verified: false,
      progress: {
        value: Math.min(ownGoals, goalsToLead),
        target: goalsToLead,
        note:
          state.profile.sport === 'Calcio'
            ? `${ownGoals} gol · servono ${goalsToLead} per il primo posto`
            : 'Richiede il profilo Calcio e i gol pubblicati',
      },
    },
    {
      id: 'tournament-debut',
      title: 'In campo insieme',
      description: 'Iscriviti al tuo primo torneo.',
      icon: 'calendar',
      level: 'Bronzo',
      unlocked: state.joinedTournamentIds.length > 0,
      verified: false,
      progress: {
        value: Math.min(state.joinedTournamentIds.length, 1),
        target: 1,
      },
    },
    {
      id: 'community-scout',
      title: 'Occhio da scout',
      description: 'Segui 5 atleti della community.',
      icon: 'users',
      level: 'Argento',
      unlocked: state.followingIds.length >= 5,
      verified: false,
      progress: {
        value: Math.min(state.followingIds.length, 5),
        target: 5,
      },
    },
    {
      id: 'certified-champion',
      title: 'Campione certificato',
      description: 'Vinci un torneo con il risultato registrato dall’organizzatore.',
      icon: 'award',
      level: 'Certificato',
      unlocked: certifiedWin,
      verified: certifiedWin,
    },
  ];
}
