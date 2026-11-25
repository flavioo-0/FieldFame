import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  AppState,
  AthleteProfile,
  FeedPreferences,
  HighlightCategory,
  HighlightPost,
  Sport,
  Tournament,
} from '@/constants/demo-data';
import {
  DEFAULT_APP_STATE,
  DEMO_TOURNAMENTS,
  SPORTS,
} from '@/constants/demo-data';

const STORAGE_KEY = 'fieldfame.app-state.v1';

type AppStoreValue = {
  state: AppState;
  isReady: boolean;
  persistenceError: string | null;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (athleteId: string) => void;
  updateProfile: (profile: AthleteProfile) => void;
  updateFeedPreferences: (preferences: FeedPreferences) => void;
  addPost: (
    caption: string,
    category: HighlightCategory,
    videoUri: string,
    duration: number | null,
  ) => void;
  addTournament: (tournament: Omit<Tournament, 'id' | 'registeredCount' | 'organizer'>) => void;
  toggleJoinTournament: (tournamentId: string) => void;
  certifyTournamentWinner: (
    tournamentId: string,
    winnerAthleteId: string,
    winnerName: string,
  ) => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

function isSport(value: unknown): value is Sport {
  return typeof value === 'string' && SPORTS.some((sport) => sport === value);
}

function migrateStoredState(value: unknown): AppState | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<AppState> & {
    profile?: Partial<AthleteProfile>;
  };
  if (
    typeof candidate.profile?.name !== 'string' ||
    typeof candidate.profile?.username !== 'string' ||
    typeof candidate.profile?.city !== 'string' ||
    typeof candidate.profile?.position !== 'string' ||
    typeof candidate.profile?.number !== 'number' ||
    !Array.isArray(candidate.likedPostIds) ||
    !Array.isArray(candidate.savedPostIds) ||
    !Array.isArray(candidate.followingIds) ||
    !Array.isArray(candidate.myPosts)
  ) {
    return null;
  }

  const profile: AthleteProfile = {
    ...DEFAULT_APP_STATE.profile,
    ...candidate.profile,
    sport: isSport(candidate.profile.sport)
      ? candidate.profile.sport
      : DEFAULT_APP_STATE.profile.sport,
  };
  const myPosts = candidate.myPosts.map((post) => {
    const oldPost = post as HighlightPost & { sport?: unknown };
    return {
      ...oldPost,
      sport: isSport(oldPost.sport) ? oldPost.sport : profile.sport,
    };
  });
  const storedPreferences = candidate.feedPreferences;
  const feedPreferences: FeedPreferences = {
    sports:
      storedPreferences &&
      Array.isArray(storedPreferences.sports) &&
      storedPreferences.sports.every(isSport)
        ? storedPreferences.sports
        : [],
    followingOnly: storedPreferences?.followingOnly === true,
    localOnly: storedPreferences?.localOnly === true,
  };

  return {
    profile,
    likedPostIds: candidate.likedPostIds as string[],
    savedPostIds: candidate.savedPostIds as string[],
    followingIds: candidate.followingIds as string[],
    myPosts,
    feedPreferences,
    tournaments: Array.isArray(candidate.tournaments)
      ? candidate.tournaments as Tournament[]
      : DEMO_TOURNAMENTS,
    joinedTournamentIds: Array.isArray(candidate.joinedTournamentIds)
      ? candidate.joinedTournamentIds as string[]
      : [],
  };
}

export function AppStoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AppState>(DEFAULT_APP_STATE);
  const [isReady, setIsReady] = useState(false);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function restore() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const parsed: unknown = JSON.parse(saved);
        const migrated = migrateStoredState(parsed);
        if (!migrated) throw new Error('Il profilo salvato non è leggibile.');
        if (isMounted) setState(migrated);
      } catch {
        if (isMounted) {
          setPersistenceError(
            'Non è stato possibile leggere i dati salvati su questo dispositivo.',
          );
        }
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    void restore();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {
      setPersistenceError(
        'Salvataggio non riuscito. Le modifiche resteranno visibili fino alla chiusura dell’app.',
      );
    });
  }, [isReady, state]);

  const toggleLike = useCallback((postId: string) => {
    setState((current) => ({
      ...current,
      likedPostIds: current.likedPostIds.includes(postId)
        ? current.likedPostIds.filter((id) => id !== postId)
        : [...current.likedPostIds, postId],
    }));
  }, []);

  const toggleSave = useCallback((postId: string) => {
    setState((current) => ({
      ...current,
      savedPostIds: current.savedPostIds.includes(postId)
        ? current.savedPostIds.filter((id) => id !== postId)
        : [...current.savedPostIds, postId],
    }));
  }, []);

  const toggleFollow = useCallback((athleteId: string) => {
    setState((current) => ({
      ...current,
      followingIds: current.followingIds.includes(athleteId)
        ? current.followingIds.filter((id) => id !== athleteId)
        : [...current.followingIds, athleteId],
    }));
  }, []);

  const updateProfile = useCallback((profile: AthleteProfile) => {
    setState((current) => ({ ...current, profile }));
  }, []);

  const updateFeedPreferences = useCallback(
    (feedPreferences: FeedPreferences) => {
      setState((current) => ({ ...current, feedPreferences }));
    },
    [],
  );

  const addPost = useCallback(
    (
      caption: string,
      category: HighlightCategory,
      videoUri: string,
      duration: number | null,
    ) => {
      setState((current) => {
        const post: HighlightPost = {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          athleteId: 'me',
          athleteName: current.profile.name,
          username: current.profile.username,
          city: current.profile.city,
          sport: current.profile.sport,
          position: current.profile.position,
          timeAgo: 'ora',
          category,
          caption: caption.trim(),
          likes: 0,
          image: null,
          videoUri,
          duration,
          createdAt: new Date().toISOString(),
        };
        return { ...current, myPosts: [post, ...current.myPosts] };
      });
    },
    [],
  );

  const addTournament = useCallback(
    (
      tournament: Omit<
        Tournament,
        'id' | 'registeredCount' | 'organizer' | 'organizerId'
      >,
    ) => {
      setState((current) => {
        const id = `local-tournament-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const created: Tournament = {
          ...tournament,
          id,
          registeredCount: 1,
          organizer: current.profile.name,
          organizerId: 'me',
        };
        return {
          ...current,
          tournaments: [created, ...current.tournaments],
          joinedTournamentIds: [...current.joinedTournamentIds, id],
        };
      });
    },
    [],
  );

  const toggleJoinTournament = useCallback((tournamentId: string) => {
    setState((current) => {
      const isJoined = current.joinedTournamentIds.includes(tournamentId);
      const tournament = current.tournaments.find(({ id }) => id === tournamentId);
      if (!tournament || tournament.organizer === current.profile.name && !isJoined) {
        return current;
      }
      if (!isJoined && tournament.registeredCount >= tournament.teamCapacity) {
        return current;
      }

      return {
        ...current,
        joinedTournamentIds: isJoined
          ? current.joinedTournamentIds.filter((id) => id !== tournamentId)
          : [...current.joinedTournamentIds, tournamentId],
        tournaments: current.tournaments.map((item) =>
          item.id === tournamentId
            ? {
                ...item,
                registeredCount: Math.max(
                  0,
                  item.registeredCount + (isJoined ? -1 : 1),
                ),
              }
            : item,
        ),
      };
    });
  }, []);

  const certifyTournamentWinner = useCallback(
    (tournamentId: string, winnerAthleteId: string, winnerName: string) => {
      setState((current) => ({
        ...current,
        tournaments: current.tournaments.map((tournament) => {
          const isOrganizer =
            tournament.organizerId === 'me' ||
            (!tournament.organizerId &&
              tournament.organizer === current.profile.name);
          if (tournament.id !== tournamentId || !isOrganizer) return tournament;
          return {
            ...tournament,
            winnerAthleteId,
            winnerName,
            winnerCertifiedAt: new Date().toISOString(),
            winnerCertifiedBy: current.profile.name,
          };
        }),
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      state,
      isReady,
      persistenceError,
      toggleLike,
      toggleSave,
      toggleFollow,
      updateProfile,
      updateFeedPreferences,
      addPost,
      addTournament,
      toggleJoinTournament,
      certifyTournamentWinner,
    }),
    [
      state,
      isReady,
      persistenceError,
      toggleLike,
      toggleSave,
      toggleFollow,
      updateProfile,
      updateFeedPreferences,
      addPost,
      addTournament,
      toggleJoinTournament,
      certifyTournamentWinner,
    ],
  );

  return (
    <AppStoreContext.Provider value={value}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) {
    throw new Error('useAppStore deve essere usato dentro AppStoreProvider.');
  }
  return value;
}
