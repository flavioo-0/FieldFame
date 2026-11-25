import * as FileSystem from "expo-file-system/legacy";
import { customFetch, setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import type {
  CommunityAthlete,
  CommunityComment,
  CommunityPost,
  CommunityProfile,
  CommunityTournament,
  Sport as ApiSport,
  VideoUploadResponse,
} from "@workspace/api-client-react";
import { useAuth, useUser } from "@clerk/expo";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";
import type { HighlightPost, Sport } from "@/constants/demo-data";

const apiDomain = process.env.EXPO_PUBLIC_DOMAIN;
if (apiDomain) {
  setBaseUrl(apiDomain.startsWith("http") ? apiDomain : `https://${apiDomain}`);
}

type FeedMode = "popular" | "following";
type CommunityContextValue = {
  isSignedIn: boolean;
  isReady: boolean;
  userId: string | null;
  profile: CommunityProfile | null;
  profileError: string | null;
  feedPosts: HighlightPost[];
  refreshFeed: (mode?: FeedMode, sport?: Sport) => Promise<HighlightPost[]>;
  updateProfile: (input: Omit<CommunityProfile, "userId" | "followersCount" | "followingCount" | "postsCount">) => Promise<CommunityProfile>;
  publishPost: (input: {
    caption: string;
    sport: Sport;
    category: string;
    videoUri: string;
    fileName: string;
    fileSize?: number;
    contentType: string;
    duration: number | null;
  }) => Promise<void>;
  toggleLike: (postId: string) => Promise<void>;
  searchAthletes: (query: string, sport?: Sport) => Promise<CommunityAthlete[]>;
  toggleFollow: (athleteId: string) => Promise<boolean>;
  getComments: (postId: string) => Promise<CommunityComment[]>;
  addComment: (postId: string, body: string) => Promise<CommunityComment>;
  getTournaments: () => Promise<CommunityTournament[]>;
  createTournament: (input: Record<string, unknown>) => Promise<CommunityTournament>;
  toggleTournamentJoin: (tournamentId: string) => Promise<{ joined: boolean; registeredCount: number }>;
  certifyTournamentWinner: (tournamentId: string, winnerAthleteId: string) => Promise<CommunityTournament>;
  signOut: () => Promise<void>;
};

const CommunityContext = createContext<CommunityContextValue | null>(null);

function timeAgo(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "ora";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h fa`;
  return `${Math.floor(hours / 24)} g fa`;
}

function toHighlight(post: CommunityPost): HighlightPost {
  return {
    id: post.id,
    athleteId: post.athleteId,
    athleteName: post.athleteName,
    username: post.username,
    city: post.city,
    sport: post.sport as Sport,
    position: post.position,
    timeAgo: timeAgo(post.createdAt),
    category: post.category as HighlightPost["category"],
    caption: post.caption,
    likes: post.likes,
    comments: post.comments,
    likedByMe: post.likedByMe,
    isShared: true,
    image: null,
    videoUri: post.mediaUrl,
    duration: post.duration,
    createdAt: post.createdAt,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function CommunityProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [feedPosts, setFeedPosts] = useState<HighlightPost[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setAuthTokenGetter(() => (isSignedIn ? getToken() : null));
    return () => setAuthTokenGetter(null);
  }, [getToken, isSignedIn]);

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}) => {
      if (!apiDomain) {
        throw new Error("Il server FieldFame non è configurato in questo ambiente.");
      }
      return customFetch<T>(`/api${path}`, init);
    },
    [],
  );

  const refreshFeed = useCallback(
    async (mode: FeedMode = "popular", sport?: Sport) => {
      if (!isSignedIn) return [];
      const params = new URLSearchParams({ mode, limit: "40" });
      if (sport) params.set("sport", sport as ApiSport);
      const response = await request<{ posts: CommunityPost[] }>(
        `/community/feed?${params.toString()}`,
      );
      const posts = response.posts.map(toHighlight);
      setFeedPosts(posts);
      return posts;
    },
    [isSignedIn, request],
  );

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      setProfile(null);
      setFeedPosts([]);
      setProfileError(null);
      setIsReady(true);
      return;
    }
    let cancelled = false;
    setIsReady(false);
    setProfileError(null);
    void (async () => {
      try {
        let remoteProfile: CommunityProfile;
        try {
          remoteProfile = await request<CommunityProfile>("/community/profile");
        } catch (error) {
          if ((error as { status?: number }).status !== 404) throw error;
          const email = user.primaryEmailAddress?.emailAddress ?? "";
          const fallbackName = email.split("@")[0] || "Atleta FieldFame";
          const rawUsername = user.username || email.split("@")[0] || `ff${user.id.slice(-12)}`;
          const username =
            rawUsername.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 32) ||
            `ff${user.id.slice(-12)}`;
          remoteProfile = await request<CommunityProfile>("/community/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: username.length >= 3 ? username : `ff${user.id.slice(-12)}`,
              displayName: user.fullName || fallbackName,
              city: "",
              sport: "Calcio",
              position: "Atleta",
              number: 0,
              bio: "",
              avatarUrl: user.imageUrl || null,
            }),
          });
        }
        if (!cancelled) setProfile(remoteProfile);
      } catch (error) {
        if (!cancelled) {
          setProfileError(
            getErrorMessage(error, "Impossibile collegare il profilo alla community."),
          );
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, request, user]);

  const updateProfile = useCallback(
    async (
      input: Omit<
        CommunityProfile,
        "userId" | "followersCount" | "followingCount" | "postsCount"
      >,
    ) => {
      const result = await request<CommunityProfile>("/community/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      setProfile(result);
      return result;
    },
    [request],
  );

  const publishPost = useCallback(
    async (input: {
      caption: string;
      sport: Sport;
      category: string;
      videoUri: string;
      fileName: string;
      fileSize?: number;
      contentType: string;
      duration: number | null;
    }) => {
      if (!profile) throw new Error("Completa il profilo prima di pubblicare.");
      const fileInfo = await FileSystem.getInfoAsync(input.videoUri);
      const size = input.fileSize ?? (fileInfo.exists ? fileInfo.size : null);
      if (!size || size > 100 * 1024 * 1024) {
        throw new Error("Il video deve pesare meno di 100 MB.");
      }
      const contentType = [
        "video/mp4",
        "video/quicktime",
        "video/webm",
      ].includes(input.contentType)
        ? input.contentType
        : "video/mp4";
      const upload = await request<VideoUploadResponse>(
        "/community/uploads/request-url",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: input.fileName,
            size,
            contentType,
          }),
        },
      );
      let uploaded = false;
      if (Platform.OS === "web") {
        const file = await fetch(input.videoUri);
        const blob = await file.blob();
        const response = await fetch(upload.uploadURL, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: blob,
        });
        uploaded = response.ok;
      } else {
        const response = await FileSystem.uploadAsync(upload.uploadURL, input.videoUri, {
          httpMethod: "PUT",
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: { "Content-Type": contentType },
        });
        uploaded = response.status >= 200 && response.status < 300;
      }
      if (!uploaded) throw new Error("Upload video non riuscito. Riprova.");
      await request("/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: input.caption,
          sport: input.sport,
          category: input.category,
          mediaPath: upload.objectPath,
          duration: input.duration,
        }),
      });
      await refreshFeed("popular");
    },
    [profile, refreshFeed, request],
  );

  const toggleLike = useCallback(
    async (postId: string) => {
      const result = await request<{ liked: boolean; likes: number }>(
        `/community/posts/${postId}/like`,
        { method: "POST" },
      );
      setFeedPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? { ...post, likedByMe: result.liked, likes: result.likes }
            : post,
        ),
      );
    },
    [request],
  );

  const searchAthletes = useCallback(
    async (query: string, sport?: Sport) => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("query", query.trim());
      if (sport) params.set("sport", sport);
      const result = await request<{ athletes: CommunityAthlete[] }>(
        `/community/athletes?${params.toString()}`,
      );
      return result.athletes;
    },
    [request],
  );

  const toggleFollow = useCallback(
    async (athleteId: string) => {
      const result = await request<{ following: boolean }>(
        `/community/athletes/${encodeURIComponent(athleteId)}/follow`,
        { method: "POST" },
      );
      return result.following;
    },
    [request],
  );

  const getComments = useCallback(
    async (postId: string) => {
      const result = await request<{ comments: CommunityComment[] }>(
        `/community/posts/${postId}/comments`,
      );
      return result.comments;
    },
    [request],
  );

  const addComment = useCallback(
    async (postId: string, body: string) =>
      request<CommunityComment>(`/community/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    [request],
  );

  const getTournaments = useCallback(async () => {
    const result = await request<{ tournaments: CommunityTournament[] }>(
      "/community/tournaments",
    );
    return result.tournaments;
  }, [request]);

  const createTournament = useCallback(
    (input: Record<string, unknown>) =>
      request<CommunityTournament>("/community/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    [request],
  );

  const toggleTournamentJoin = useCallback(
    (tournamentId: string) =>
      request<{ joined: boolean; registeredCount: number }>(
        `/community/tournaments/${tournamentId}/join`,
        { method: "POST" },
      ),
    [request],
  );

  const certifyTournamentWinner = useCallback(
    (tournamentId: string, winnerAthleteId: string) =>
      request<CommunityTournament>(
        `/community/tournaments/${tournamentId}/winner`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ winnerAthleteId }),
        },
      ),
    [request],
  );

  const value = useMemo<CommunityContextValue>(
    () => ({
      isSignedIn: Boolean(isSignedIn),
      isReady: isLoaded && isReady,
      userId: user?.id ?? null,
      profile,
      profileError,
      feedPosts,
      refreshFeed,
      updateProfile,
      publishPost,
      toggleLike,
      searchAthletes,
      toggleFollow,
      getComments,
      addComment,
      getTournaments,
      createTournament,
      toggleTournamentJoin,
      certifyTournamentWinner,
      signOut,
    }),
    [
      isSignedIn,
      isLoaded,
      isReady,
      user?.id,
      profile,
      profileError,
      feedPosts,
      refreshFeed,
      updateProfile,
      publishPost,
      toggleLike,
      searchAthletes,
      toggleFollow,
      getComments,
      addComment,
      getTournaments,
      createTournament,
      toggleTournamentJoin,
      certifyTournamentWinner,
      signOut,
    ],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity() {
  const value = useContext(CommunityContext);
  if (!value) throw new Error("useCommunity deve essere usato dentro CommunityProvider.");
  return value;
}
