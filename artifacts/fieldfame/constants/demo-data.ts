import type { ImageSourcePropType } from 'react-native';

export const SPORTS = ['Calcio', 'Basket', 'Pallavolo', 'Padel'] as const;
export type Sport = (typeof SPORTS)[number];

export type HighlightCategory =
  | 'Gol'
  | 'Assist'
  | 'Dribbling'
  | 'Parata'
  | 'Canestro'
  | 'Schiacciata'
  | 'Recupero'
  | 'Attacco'
  | 'Ace'
  | 'Muro'
  | 'Difesa'
  | 'Punto'
  | 'Smash'
  | 'Bandeja'
  | 'Scambio';

export const SPORT_CATEGORIES: Record<Sport, HighlightCategory[]> = {
  Calcio: ['Gol', 'Assist', 'Dribbling', 'Parata'],
  Basket: ['Canestro', 'Assist', 'Schiacciata', 'Recupero'],
  Pallavolo: ['Attacco', 'Ace', 'Muro', 'Difesa'],
  Padel: ['Punto', 'Smash', 'Bandeja', 'Scambio'],
};

export type Athlete = {
  id: string;
  name: string;
  username: string;
  city: string;
  sport: Sport;
  position: string;
  number: number;
  goals: number;
  assists: number;
  saves: number;
  weeklyGoals: number;
  weeklyAssists: number;
  weeklySaves: number;
  highlights: number;
  initials: string;
};

export type HighlightPost = {
  id: string;
  athleteId: string;
  athleteName: string;
  username: string;
  city: string;
  sport: Sport;
  position: string;
  timeAgo: string;
  category: HighlightCategory;
  caption: string;
  likes: number;
  comments?: number;
  likedByMe?: boolean;
  isShared?: boolean;
  image: ImageSourcePropType | null;
  videoUri: string | null;
  duration: number | null;
  createdAt?: string;
};

export type AthleteProfile = {
  name: string;
  username: string;
  city: string;
  sport: Sport;
  position: string;
  number: number;
};

export type FeedPreferences = {
  sports: Sport[];
  followingOnly: boolean;
  localOnly: boolean;
};

export type Tournament = {
  id: string;
  name: string;
  sport: Sport;
  city: string;
  venue: string;
  date: string;
  format: string;
  teamCapacity: number;
  registeredCount: number;
  organizer: string;
  organizerId?: string;
  winnerAthleteId?: string;
  winnerName?: string;
  winnerCertifiedAt?: string;
  winnerCertifiedBy?: string;
};

export type AppState = {
  profile: AthleteProfile;
  likedPostIds: string[];
  savedPostIds: string[];
  followingIds: string[];
  myPosts: HighlightPost[];
  feedPreferences: FeedPreferences;
  tournaments: Tournament[];
  joinedTournamentIds: string[];
};

export const ATHLETES: Athlete[] = [
  {
    id: 'ath-01',
    name: 'Tommaso Leone',
    username: 'tommy.leone',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Ala',
    number: 11,
    goals: 18,
    assists: 9,
    saves: 0,
    weeklyGoals: 3,
    weeklyAssists: 2,
    weeklySaves: 0,
    highlights: 12,
    initials: 'TL',
  },
  {
    id: 'ath-02',
    name: 'Andrea Ferri',
    username: 'andrea.ferri',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Attaccante',
    number: 9,
    goals: 15,
    assists: 6,
    saves: 0,
    weeklyGoals: 2,
    weeklyAssists: 1,
    weeklySaves: 0,
    highlights: 10,
    initials: 'AF',
  },
  {
    id: 'ath-03',
    name: 'Samira Conti',
    username: 'samira.conti',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Centrocampo',
    number: 8,
    goals: 8,
    assists: 14,
    saves: 0,
    weeklyGoals: 1,
    weeklyAssists: 3,
    weeklySaves: 0,
    highlights: 15,
    initials: 'SC',
  },
  {
    id: 'ath-04',
    name: 'Nicolò De Luca',
    username: 'ndeluca',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Difensore',
    number: 5,
    goals: 3,
    assists: 5,
    saves: 0,
    weeklyGoals: 0,
    weeklyAssists: 1,
    weeklySaves: 0,
    highlights: 6,
    initials: 'ND',
  },
  {
    id: 'ath-05',
    name: 'Gabriele Russo',
    username: 'gabri.russo',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Portiere',
    number: 1,
    goals: 0,
    assists: 1,
    saves: 24,
    weeklyGoals: 0,
    weeklyAssists: 0,
    weeklySaves: 7,
    highlights: 9,
    initials: 'GR',
  },
  {
    id: 'ath-06',
    name: 'Elia Rinaldi',
    username: 'elia.rinaldi',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Ala',
    number: 7,
    goals: 12,
    assists: 11,
    saves: 0,
    weeklyGoals: 2,
    weeklyAssists: 2,
    weeklySaves: 0,
    highlights: 11,
    initials: 'ER',
  },
  {
    id: 'ath-07',
    name: 'Matteo Greco',
    username: 'matteo.greco',
    city: 'Bari',
    sport: 'Basket',
    position: 'Guardia',
    number: 23,
    goals: 0,
    assists: 0,
    saves: 0,
    weeklyGoals: 0,
    weeklyAssists: 0,
    weeklySaves: 0,
    highlights: 11,
    initials: 'MG',
  },
  {
    id: 'ath-08',
    name: 'Giulia Palmieri',
    username: 'giulia.palmieri',
    city: 'Bari',
    sport: 'Basket',
    position: 'Ala',
    number: 7,
    goals: 0,
    assists: 0,
    saves: 0,
    weeklyGoals: 0,
    weeklyAssists: 0,
    weeklySaves: 0,
    highlights: 8,
    initials: 'GP',
  },
  {
    id: 'ath-09',
    name: 'Simone Costa',
    username: 'simone.costa',
    city: 'Bari',
    sport: 'Pallavolo',
    position: 'Schiacciatore',
    number: 14,
    goals: 0,
    assists: 0,
    saves: 0,
    weeklyGoals: 0,
    weeklyAssists: 0,
    weeklySaves: 0,
    highlights: 13,
    initials: 'SC',
  },
  {
    id: 'ath-10',
    name: 'Elisa Greco',
    username: 'elisa.greco',
    city: 'Bari',
    sport: 'Pallavolo',
    position: 'Libero',
    number: 3,
    goals: 0,
    assists: 0,
    saves: 0,
    weeklyGoals: 0,
    weeklyAssists: 0,
    weeklySaves: 0,
    highlights: 7,
    initials: 'EG',
  },
  {
    id: 'ath-11',
    name: 'Davide Neri',
    username: 'davide.neri',
    city: 'Bari',
    sport: 'Padel',
    position: 'Destro',
    number: 4,
    goals: 0,
    assists: 0,
    saves: 0,
    weeklyGoals: 0,
    weeklyAssists: 0,
    weeklySaves: 0,
    highlights: 14,
    initials: 'DN',
  },
  {
    id: 'ath-12',
    name: 'Chiara Rizzi',
    username: 'chiara.rizzi',
    city: 'Bari',
    sport: 'Padel',
    position: 'Sinistra',
    number: 12,
    goals: 0,
    assists: 0,
    saves: 0,
    weeklyGoals: 0,
    weeklyAssists: 0,
    weeklySaves: 0,
    highlights: 9,
    initials: 'CR',
  },
];

export const DEMO_POSTS: HighlightPost[] = [
  {
    id: 'post-01',
    athleteId: 'ath-01',
    athleteName: 'Tommaso Leone',
    username: 'tommy.leone',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Ala',
    timeAgo: '2 ore fa',
    category: 'Gol',
    caption: 'Uno-due al limite e palla sotto la traversa. Che partita.',
    likes: 248,
    image: require('../assets/images/highlight-bari.jpg'),
    videoUri: null,
    duration: 12,
  },
  {
    id: 'post-02',
    athleteId: 'ath-03',
    athleteName: 'Samira Conti',
    username: 'samira.conti',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Centrocampo',
    timeAgo: '5 ore fa',
    category: 'Assist',
    caption: 'Visione, tempo giusto e il pallone arriva dove deve.',
    likes: 179,
    image: require('../assets/images/highlight-strike.jpg'),
    videoUri: null,
    duration: 9,
  },
  {
    id: 'post-03',
    athleteId: 'ath-05',
    athleteName: 'Gabriele Russo',
    username: 'gabri.russo',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Portiere',
    timeAgo: 'ieri',
    category: 'Parata',
    caption: 'Ultimo minuto, una mano sola. Tre punti a casa.',
    likes: 136,
    image: require('../assets/images/highlight-bari.jpg'),
    videoUri: null,
    duration: 7,
  },
  {
    id: 'post-04',
    athleteId: 'ath-07',
    athleteName: 'Matteo Greco',
    username: 'matteo.greco',
    city: 'Bari',
    sport: 'Basket',
    position: 'Guardia',
    timeAgo: '3 ore fa',
    category: 'Canestro',
    caption: 'Ultimo possesso, parquet pieno e un tiro che vale la finale.',
    likes: 326,
    image: require('../assets/images/sport-basketball.jpg'),
    videoUri: null,
    duration: 14,
  },
  {
    id: 'post-05',
    athleteId: 'ath-09',
    athleteName: 'Simone Costa',
    username: 'simone.costa',
    city: 'Bari',
    sport: 'Pallavolo',
    position: 'Schiacciatore',
    timeAgo: '4 ore fa',
    category: 'Attacco',
    caption: 'Palleggio perfetto. Il punto decisivo lo chiudiamo insieme.',
    likes: 294,
    image: require('../assets/images/sport-volleyball.jpg'),
    videoUri: null,
    duration: 11,
  },
  {
    id: 'post-06',
    athleteId: 'ath-11',
    athleteName: 'Davide Neri',
    username: 'davide.neri',
    city: 'Bari',
    sport: 'Padel',
    position: 'Destro',
    timeAgo: '6 ore fa',
    category: 'Bandeja',
    caption: 'Cambio di ritmo e palla imprendibile sul vetro.',
    likes: 271,
    image: require('../assets/images/sport-padel.jpg'),
    videoUri: null,
    duration: 10,
  },
  {
    id: 'post-07',
    athleteId: 'ath-08',
    athleteName: 'Giulia Palmieri',
    username: 'giulia.palmieri',
    city: 'Bari',
    sport: 'Basket',
    position: 'Ala',
    timeAgo: 'ieri',
    category: 'Assist',
    caption: 'Uno sguardo, un passaggio e la difesa resta indietro.',
    likes: 208,
    image: require('../assets/images/sport-basketball.jpg'),
    videoUri: null,
    duration: 8,
  },
  {
    id: 'post-08',
    athleteId: 'ath-10',
    athleteName: 'Elisa Greco',
    username: 'elisa.greco',
    city: 'Bari',
    sport: 'Pallavolo',
    position: 'Libero',
    timeAgo: 'ieri',
    category: 'Difesa',
    caption: 'Palla ancora viva: in campo si corre fino all’ultimo.',
    likes: 151,
    image: require('../assets/images/sport-volleyball.jpg'),
    videoUri: null,
    duration: 9,
  },
];

export const DEMO_TOURNAMENTS: Tournament[] = [
  {
    id: 'tournament-01',
    name: 'Bari Five Cup',
    sport: 'Calcio',
    city: 'Bari',
    venue: 'Centro sportivo · Bari',
    date: '2026-11-08',
    format: '5 contro 5',
    teamCapacity: 16,
    registeredCount: 11,
    organizer: 'FieldFame Community',
  },
  {
    id: 'tournament-02',
    name: 'Basket 3x3 Night',
    sport: 'Basket',
    city: 'Bari',
    venue: 'Campo outdoor · Bari',
    date: '2026-11-14',
    format: '3 contro 3',
    teamCapacity: 12,
    registeredCount: 8,
    organizer: 'FieldFame Community',
  },
  {
    id: 'tournament-03',
    name: 'Puglia Padel Open',
    sport: 'Padel',
    city: 'Bari',
    venue: 'Club padel · Bari',
    date: '2026-11-22',
    format: 'Doppio',
    teamCapacity: 16,
    registeredCount: 6,
    organizer: 'FieldFame Community',
  },
  {
    id: 'tournament-04',
    name: 'Volley Weekend',
    sport: 'Pallavolo',
    city: 'Bari',
    venue: 'Palestra · Bari',
    date: '2026-11-29',
    format: '6 contro 6',
    teamCapacity: 8,
    registeredCount: 5,
    organizer: 'FieldFame Community',
  },
];

export const DEFAULT_APP_STATE: AppState = {
  profile: {
    name: 'Luca Moretti',
    username: 'luca.moretti',
    city: 'Bari',
    sport: 'Calcio',
    position: 'Ala',
    number: 10,
  },
  likedPostIds: [],
  savedPostIds: [],
  followingIds: ['ath-01', 'ath-03'],
  myPosts: [],
  feedPreferences: {
    sports: [],
    followingOnly: false,
    localOnly: false,
  },
  tournaments: DEMO_TOURNAMENTS,
  joinedTournamentIds: [],
};
