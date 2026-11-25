import { getAuth } from "@clerk/express";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  sql,
} from "drizzle-orm";
import { Router, type Request, type RequestHandler } from "express";
import { z } from "zod/v4";
import {
  db,
  fieldfameCommentMentions,
  fieldfameComments,
  fieldfameFollows,
  fieldfameLikes,
  fieldfamePosts,
  fieldfameProfiles,
  fieldfameTournamentRegistrations,
  fieldfameTournaments,
} from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const storage = new ObjectStorageService();
const sports = ["Calcio", "Basket", "Pallavolo", "Padel"] as const;
const sportSchema = z.enum(sports);
const maxVideoBytes = 100 * 1024 * 1024;

const requireAuth: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Accedi per usare la community." });
    return;
  }
  next();
};

function userIdFromRequest(req: Request) {
  const userId = getAuth(req).userId;
  if (!userId) throw new Error("Missing authenticated user");
  return userId;
}

function invalidBody(res: import("express").Response, error: z.ZodError) {
  res.status(400).json({
    error: error.issues.map((issue) => issue.message).join(" "),
  });
}

async function profileWithCounts(userId: string) {
  const [profile] = await db
    .select()
    .from(fieldfameProfiles)
    .where(eq(fieldfameProfiles.userId, userId))
    .limit(1);
  if (!profile) return null;

  const [[followers], [following], [posts]] = await Promise.all([
    db
      .select({ value: count() })
      .from(fieldfameFollows)
      .where(eq(fieldfameFollows.followeeId, userId)),
    db
      .select({ value: count() })
      .from(fieldfameFollows)
      .where(eq(fieldfameFollows.followerId, userId)),
    db
      .select({ value: count() })
      .from(fieldfamePosts)
      .where(eq(fieldfamePosts.authorId, userId)),
  ]);

  return {
    ...profile,
    followersCount: followers?.value ?? 0,
    followingCount: following?.value ?? 0,
    postsCount: posts?.value ?? 0,
  };
}

const profileUpdateSchema = z.object({
  username: z.string().trim().min(3).max(32).regex(/^[a-z0-9._]+$/),
  displayName: z.string().trim().min(2).max(80),
  city: z.string().trim().max(100),
  sport: sportSchema,
  position: z.string().trim().max(50),
  number: z.number().int().min(0).max(99),
  bio: z.string().trim().max(240),
  avatarUrl: z.string().url().nullable().optional(),
});

router.get("/community/profile", requireAuth, async (req, res) => {
  const profile = await profileWithCounts(userIdFromRequest(req));
  if (!profile) {
    res.status(404).json({ error: "Completa il profilo per entrare nella community." });
    return;
  }
  res.json(profile);
});

router.put("/community/profile", requireAuth, async (req, res) => {
  const parsed = profileUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    invalidBody(res, parsed.error);
    return;
  }
  const userId = userIdFromRequest(req);
  try {
    await db
      .insert(fieldfameProfiles)
      .values({
        userId,
        ...parsed.data,
        avatarUrl: parsed.data.avatarUrl ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: fieldfameProfiles.userId,
        set: { ...parsed.data, updatedAt: new Date() },
      });
    res.json(await profileWithCounts(userId));
  } catch (error) {
    req.log.error({ err: error }, "Unable to save community profile");
    res.status(409).json({ error: "Username già utilizzato. Scegline un altro." });
  }
});

router.get("/community/feed", requireAuth, async (req, res) => {
  const userId = userIdFromRequest(req);
  const mode = req.query.mode === "following" ? "following" : "popular";
  const parsedSport = sportSchema.safeParse(req.query.sport);
  const limitParsed = z.coerce.number().int().min(1).max(50).safeParse(req.query.limit ?? 30);
  const conditions = [];
  if (req.query.sport) {
    if (!parsedSport.success) {
      invalidBody(res, parsedSport.error);
      return;
    }
    conditions.push(eq(fieldfamePosts.sport, parsedSport.data));
  }

  if (mode === "following") {
    const followed = await db
      .select({ userId: fieldfameFollows.followeeId })
      .from(fieldfameFollows)
      .where(eq(fieldfameFollows.followerId, userId));
    const followedIds = followed.map((row) => row.userId);
    if (followedIds.length === 0) {
      res.json({ posts: [] });
      return;
    }
    conditions.push(inArray(fieldfamePosts.authorId, followedIds));
  }

  const rows = await db
    .select({
      id: fieldfamePosts.id,
      athleteId: fieldfameProfiles.userId,
      athleteName: fieldfameProfiles.displayName,
      username: fieldfameProfiles.username,
      city: fieldfameProfiles.city,
      sport: fieldfamePosts.sport,
      position: fieldfameProfiles.position,
      category: fieldfamePosts.category,
      caption: fieldfamePosts.caption,
      mediaPath: fieldfamePosts.mediaPath,
      duration: fieldfamePosts.durationSeconds,
      createdAt: fieldfamePosts.createdAt,
      likes: count(fieldfameLikes.userId),
      comments: count(fieldfameComments.id),
    })
    .from(fieldfamePosts)
    .innerJoin(fieldfameProfiles, eq(fieldfameProfiles.userId, fieldfamePosts.authorId))
    .leftJoin(fieldfameLikes, eq(fieldfameLikes.postId, fieldfamePosts.id))
    .leftJoin(fieldfameComments, eq(fieldfameComments.postId, fieldfamePosts.id))
    .where(and(...conditions))
    .groupBy(fieldfamePosts.id, fieldfameProfiles.userId)
    .orderBy(
      mode === "popular"
        ? desc(count(fieldfameLikes.userId))
        : desc(fieldfamePosts.createdAt),
      desc(fieldfamePosts.createdAt),
    )
    .limit(limitParsed.success ? limitParsed.data : 30);

  const postIds = rows.map((post) => post.id);
  const likedRows = postIds.length
    ? await db
        .select({ postId: fieldfameLikes.postId })
        .from(fieldfameLikes)
        .where(and(eq(fieldfameLikes.userId, userId), inArray(fieldfameLikes.postId, postIds)))
    : [];
  const liked = new Set(likedRows.map((row) => row.postId));
  const posts = await Promise.all(
    rows.map(async (post) => ({
      id: post.id,
      athleteId: post.athleteId,
      athleteName: post.athleteName,
      username: post.username,
      city: post.city,
      sport: post.sport,
      position: post.position,
      category: post.category,
      caption: post.caption,
      mediaUrl: await storage.getReadURL(post.mediaPath),
      duration: post.duration,
      createdAt: post.createdAt,
      likes: Number(post.likes),
      comments: Number(post.comments),
      likedByMe: liked.has(post.id),
    })),
  );
  res.json({ posts });
});

const uploadSchema = z.object({
  name: z.string().trim().min(1).max(255),
  size: z.number().int().min(1).max(maxVideoBytes),
  contentType: z.enum(["video/mp4", "video/quicktime", "video/webm"]),
});

router.post("/community/uploads/request-url", requireAuth, async (req, res) => {
  const parsed = uploadSchema.safeParse(req.body);
  if (!parsed.success) {
    invalidBody(res, parsed.error);
    return;
  }
  try {
    const result = await storage.createUpload(userIdFromRequest(req));
    res.json(result);
  } catch (error) {
    req.log.error({ err: error }, "Unable to create video upload URL");
    res.status(503).json({ error: "Caricamento non disponibile. Riprova tra poco." });
  }
});

const postCreateSchema = z.object({
  caption: z.string().trim().min(1).max(300),
  sport: sportSchema,
  category: z.string().trim().min(1).max(32),
  mediaPath: z.string().startsWith("/objects/"),
  duration: z.number().int().min(1).max(60).nullable().optional(),
});

router.post("/community/posts", requireAuth, async (req, res) => {
  const parsed = postCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    invalidBody(res, parsed.error);
    return;
  }
  const userId = userIdFromRequest(req);
  if (!parsed.data.mediaPath.startsWith(`/objects/${userId}/uploads/`)) {
    res.status(403).json({ error: "Il video non appartiene a questo account." });
    return;
  }
  try {
    const metadata = await storage.getMetadata(parsed.data.mediaPath);
    if (!String(metadata.contentType ?? "").startsWith("video/") || Number(metadata.size) > maxVideoBytes) {
      res.status(400).json({ error: "Il file caricato non è un video valido." });
      return;
    }
    const [profile] = await db
      .select({ userId: fieldfameProfiles.userId })
      .from(fieldfameProfiles)
      .where(eq(fieldfameProfiles.userId, userId))
      .limit(1);
    if (!profile) {
      res.status(409).json({ error: "Completa prima il profilo." });
      return;
    }
    const [post] = await db
      .insert(fieldfamePosts)
      .values({
        authorId: userId,
        caption: parsed.data.caption,
        sport: parsed.data.sport,
        category: parsed.data.category,
        mediaPath: parsed.data.mediaPath,
        durationSeconds: parsed.data.duration ?? null,
      })
      .returning({ id: fieldfamePosts.id });
    res.status(201).json({ id: post.id });
  } catch (error) {
    req.log.error({ err: error }, "Unable to publish community video");
    res.status(503).json({ error: "Impossibile pubblicare il video. Riprova." });
  }
});

router.post("/community/posts/:postId/like", requireAuth, async (req, res) => {
  const postId = z.string().uuid().safeParse(req.params.postId);
  if (!postId.success) {
    res.status(400).json({ error: "Post non valido." });
    return;
  }
  const userId = userIdFromRequest(req);
  const existing = await db
    .select({ postId: fieldfameLikes.postId })
    .from(fieldfameLikes)
    .where(and(eq(fieldfameLikes.postId, postId.data), eq(fieldfameLikes.userId, userId)))
    .limit(1);
  let liked: boolean;
  if (existing.length) {
    await db
      .delete(fieldfameLikes)
      .where(and(eq(fieldfameLikes.postId, postId.data), eq(fieldfameLikes.userId, userId)));
    liked = false;
  } else {
    await db.insert(fieldfameLikes).values({ postId: postId.data, userId }).onConflictDoNothing();
    liked = true;
  }
  const [total] = await db
    .select({ value: count() })
    .from(fieldfameLikes)
    .where(eq(fieldfameLikes.postId, postId.data));
  res.json({ liked, likes: total?.value ?? 0 });
});

router.get("/community/athletes", requireAuth, async (req, res) => {
  const userId = userIdFromRequest(req);
  const query = z.string().trim().max(80).safeParse(req.query.query ?? "");
  const sport = req.query.sport ? sportSchema.safeParse(req.query.sport) : null;
  if (!query.success || (sport && !sport.success)) {
    res.status(400).json({ error: "Filtro non valido." });
    return;
  }
  const conditions = [sql`${fieldfameProfiles.userId} <> ${userId}`];
  if (query.data) {
    const pattern = `%${query.data}%`;
    conditions.push(
      sql`(${fieldfameProfiles.displayName} ILIKE ${pattern} OR ${fieldfameProfiles.username} ILIKE ${pattern} OR ${fieldfameProfiles.city} ILIKE ${pattern})`,
    );
  }
  if (sport?.success) conditions.push(eq(fieldfameProfiles.sport, sport.data));

  const profiles = await db
    .select({
      userId: fieldfameProfiles.userId,
      username: fieldfameProfiles.username,
      displayName: fieldfameProfiles.displayName,
      city: fieldfameProfiles.city,
      sport: fieldfameProfiles.sport,
      position: fieldfameProfiles.position,
      number: fieldfameProfiles.number,
      bio: fieldfameProfiles.bio,
      avatarUrl: fieldfameProfiles.avatarUrl,
    })
    .from(fieldfameProfiles)
    .where(and(...conditions))
    .orderBy(desc(fieldfameProfiles.updatedAt))
    .limit(40);
  const ids = profiles.map((profile) => profile.userId);
  const followingRows = ids.length
    ? await db
        .select({ id: fieldfameFollows.followeeId })
        .from(fieldfameFollows)
        .where(and(eq(fieldfameFollows.followerId, userId), inArray(fieldfameFollows.followeeId, ids)))
    : [];
  const following = new Set(followingRows.map((row) => row.id));
  res.json({
    athletes: profiles.map((profile) => ({
      ...profile,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isFollowing: following.has(profile.userId),
    })),
  });
});

router.post("/community/athletes/:athleteId/follow", requireAuth, async (req, res) => {
  const userId = userIdFromRequest(req);
  const athleteId = z.string().min(1).max(255).safeParse(req.params.athleteId);
  if (!athleteId.success || athleteId.data === userId) {
    res.status(400).json({ error: "Atleta non valido." });
    return;
  }
  const [target] = await db
    .select({ userId: fieldfameProfiles.userId })
    .from(fieldfameProfiles)
    .where(eq(fieldfameProfiles.userId, athleteId.data))
    .limit(1);
  if (!target) {
    res.status(404).json({ error: "Atleta non trovato." });
    return;
  }
  const existing = await db
    .select({ id: fieldfameFollows.followeeId })
    .from(fieldfameFollows)
    .where(and(eq(fieldfameFollows.followerId, userId), eq(fieldfameFollows.followeeId, athleteId.data)))
    .limit(1);
  if (existing.length) {
    await db
      .delete(fieldfameFollows)
      .where(and(eq(fieldfameFollows.followerId, userId), eq(fieldfameFollows.followeeId, athleteId.data)));
    res.json({ following: false });
  } else {
    await db.insert(fieldfameFollows).values({ followerId: userId, followeeId: athleteId.data }).onConflictDoNothing();
    res.json({ following: true });
  }
});

const commentSchema = z.object({ body: z.string().trim().min(1).max(500) });

router.get("/community/posts/:postId/comments", requireAuth, async (req, res) => {
  const postId = z.string().uuid().safeParse(req.params.postId);
  if (!postId.success) {
    res.status(400).json({ error: "Post non valido." });
    return;
  }
  const rows = await db
    .select({
      id: fieldfameComments.id,
      postId: fieldfameComments.postId,
      authorId: fieldfameProfiles.userId,
      authorName: fieldfameProfiles.displayName,
      username: fieldfameProfiles.username,
      body: fieldfameComments.body,
      createdAt: fieldfameComments.createdAt,
    })
    .from(fieldfameComments)
    .innerJoin(fieldfameProfiles, eq(fieldfameProfiles.userId, fieldfameComments.authorId))
    .where(eq(fieldfameComments.postId, postId.data))
    .orderBy(fieldfameComments.createdAt)
    .limit(100);
  const commentIds = rows.map((row) => row.id);
  const mentionRows = commentIds.length
    ? await db
        .select({
          commentId: fieldfameCommentMentions.commentId,
          userId: fieldfameProfiles.userId,
          username: fieldfameProfiles.username,
          displayName: fieldfameProfiles.displayName,
        })
        .from(fieldfameCommentMentions)
        .innerJoin(fieldfameProfiles, eq(fieldfameProfiles.userId, fieldfameCommentMentions.mentionedUserId))
        .where(inArray(fieldfameCommentMentions.commentId, commentIds))
    : [];
  res.json({
    comments: rows.map((comment) => ({
      ...comment,
      mentions: mentionRows
        .filter((mention) => mention.commentId === comment.id)
        .map(({ userId: mentionedId, username, displayName }) => ({
          userId: mentionedId,
          username,
          displayName,
        })),
    })),
  });
});

router.post("/community/posts/:postId/comments", requireAuth, async (req, res) => {
  const postId = z.string().uuid().safeParse(req.params.postId);
  const parsed = commentSchema.safeParse(req.body);
  if (!postId.success || !parsed.success) {
    if (!parsed.success) invalidBody(res, parsed.error);
    else res.status(400).json({ error: "Post non valido." });
    return;
  }
  const userId = userIdFromRequest(req);
  const [post] = await db
    .select({ id: fieldfamePosts.id })
    .from(fieldfamePosts)
    .where(eq(fieldfamePosts.id, postId.data))
    .limit(1);
  if (!post) {
    res.status(404).json({ error: "Clip non trovata." });
    return;
  }
  const handles = [...new Set(
    [...parsed.data.body.matchAll(/@([a-z0-9._]{3,32})/gi)].map((match) => match[1].toLowerCase()),
  )].slice(0, 10);
  const mentionedProfiles = handles.length
    ? await db
        .select({
          userId: fieldfameProfiles.userId,
          username: fieldfameProfiles.username,
          displayName: fieldfameProfiles.displayName,
        })
        .from(fieldfameProfiles)
        .where(inArray(fieldfameProfiles.username, handles))
    : [];
  const comment = await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(fieldfameComments)
      .values({ postId: postId.data, authorId: userId, body: parsed.data.body })
      .returning();
    if (mentionedProfiles.length) {
      await transaction
        .insert(fieldfameCommentMentions)
        .values(mentionedProfiles.map((profile) => ({
          commentId: created.id,
          mentionedUserId: profile.userId,
        })))
        .onConflictDoNothing();
    }
    return created;
  });
  const [author] = await db
    .select({
      displayName: fieldfameProfiles.displayName,
      username: fieldfameProfiles.username,
    })
    .from(fieldfameProfiles)
    .where(eq(fieldfameProfiles.userId, userId))
    .limit(1);
  res.status(201).json({
    ...comment,
    authorId: userId,
    authorName: author?.displayName ?? "Atleta",
    username: author?.username ?? "",
    mentions: mentionedProfiles.map(({ userId: mentionedId, username, displayName }) => ({
      userId: mentionedId,
      username,
      displayName,
    })),
  });
});

const tournamentCreateSchema = z.object({
  title: z.string().trim().min(3).max(100),
  sport: sportSchema,
  city: z.string().trim().min(2).max(100),
  venue: z.string().trim().min(2).max(160),
  eventDate: z.string().datetime(),
  format: z.string().trim().min(2).max(40),
  teamCapacity: z.number().int().min(2).max(256),
  description: z.string().trim().max(300).optional().default(""),
});

async function communityTournamentRows(userId: string) {
  const rows = await db
    .select({
      id: fieldfameTournaments.id,
      organizerId: fieldfameTournaments.organizerId,
      organizerName: fieldfameProfiles.displayName,
      title: fieldfameTournaments.title,
      sport: fieldfameTournaments.sport,
      city: fieldfameTournaments.city,
      venue: fieldfameTournaments.venue,
      eventDate: fieldfameTournaments.eventDate,
      format: fieldfameTournaments.format,
      teamCapacity: fieldfameTournaments.teamCapacity,
      winnerAthleteId: fieldfameTournaments.winnerAthleteId,
      winnerCertifiedAt: fieldfameTournaments.winnerCertifiedAt,
      registrations: count(fieldfameTournamentRegistrations.athleteId),
    })
    .from(fieldfameTournaments)
    .innerJoin(fieldfameProfiles, eq(fieldfameProfiles.userId, fieldfameTournaments.organizerId))
    .leftJoin(fieldfameTournamentRegistrations, eq(fieldfameTournamentRegistrations.tournamentId, fieldfameTournaments.id))
    .groupBy(fieldfameTournaments.id, fieldfameProfiles.userId)
    .orderBy(desc(fieldfameTournaments.eventDate))
    .limit(100);
  const tournamentIds = rows.map((row) => row.id);
  const athleteIds = rows.flatMap((row) => row.winnerAthleteId ? [row.winnerAthleteId] : []);
  const [registrationRows, participantRows, winnerProfiles] = await Promise.all([
    tournamentIds.length
      ? db
          .select({ tournamentId: fieldfameTournamentRegistrations.tournamentId })
          .from(fieldfameTournamentRegistrations)
          .where(and(
            eq(fieldfameTournamentRegistrations.athleteId, userId),
            inArray(fieldfameTournamentRegistrations.tournamentId, tournamentIds),
          ))
      : Promise.resolve([]),
    tournamentIds.length
      ? db
          .select({
            tournamentId: fieldfameTournamentRegistrations.tournamentId,
            userId: fieldfameProfiles.userId,
            username: fieldfameProfiles.username,
            displayName: fieldfameProfiles.displayName,
          })
          .from(fieldfameTournamentRegistrations)
          .innerJoin(
            fieldfameProfiles,
            eq(fieldfameProfiles.userId, fieldfameTournamentRegistrations.athleteId),
          )
          .where(inArray(fieldfameTournamentRegistrations.tournamentId, tournamentIds))
      : Promise.resolve([]),
    athleteIds.length
      ? db
          .select({
            userId: fieldfameProfiles.userId,
            displayName: fieldfameProfiles.displayName,
          })
          .from(fieldfameProfiles)
          .where(inArray(fieldfameProfiles.userId, athleteIds))
      : Promise.resolve([]),
  ]);
  const joined = new Set(registrationRows.map((row) => row.tournamentId));
  const winners = new Map(winnerProfiles.map((profile) => [profile.userId, profile.displayName]));
  const participants = new Map<string, Array<{ userId: string; username: string; displayName: string }>>();
  for (const participant of participantRows) {
    const existing = participants.get(participant.tournamentId) ?? [];
    existing.push({
      userId: participant.userId,
      username: participant.username,
      displayName: participant.displayName,
    });
    participants.set(participant.tournamentId, existing);
  }
  return rows.map((row) => ({
    ...row,
    registeredCount: Number(row.registrations),
    currentUserJoined: joined.has(row.id),
    isOrganizer: row.organizerId === userId,
    winnerName: row.winnerAthleteId ? winners.get(row.winnerAthleteId) ?? null : null,
    participants: participants.get(row.id) ?? [],
  }));
}

router.get("/community/tournaments", requireAuth, async (req, res) => {
  res.json({ tournaments: await communityTournamentRows(userIdFromRequest(req)) });
});

router.post("/community/tournaments", requireAuth, async (req, res) => {
  const parsed = tournamentCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    invalidBody(res, parsed.error);
    return;
  }
  const userId = userIdFromRequest(req);
  const profileExists = await db
    .select({ userId: fieldfameProfiles.userId })
    .from(fieldfameProfiles)
    .where(eq(fieldfameProfiles.userId, userId))
    .limit(1);
  if (!profileExists.length) {
    res.status(409).json({ error: "Completa prima il profilo." });
    return;
  }
  const [created] = await db.transaction(async (transaction) => {
    const [tournament] = await transaction
      .insert(fieldfameTournaments)
      .values({ ...parsed.data, eventDate: new Date(parsed.data.eventDate), organizerId: userId })
      .returning();
    await transaction
      .insert(fieldfameTournamentRegistrations)
      .values({ tournamentId: tournament.id, athleteId: userId })
      .onConflictDoNothing();
    return [tournament];
  });
  const rows = await communityTournamentRows(userId);
  res.status(201).json(rows.find((row) => row.id === created.id));
});

router.post("/community/tournaments/:tournamentId/join", requireAuth, async (req, res) => {
  const tournamentId = z.string().uuid().safeParse(req.params.tournamentId);
  if (!tournamentId.success) {
    res.status(400).json({ error: "Torneo non valido." });
    return;
  }
  const userId = userIdFromRequest(req);
  const [tournament] = await db
    .select({
      id: fieldfameTournaments.id,
      teamCapacity: fieldfameTournaments.teamCapacity,
      organizerId: fieldfameTournaments.organizerId,
    })
    .from(fieldfameTournaments)
    .where(eq(fieldfameTournaments.id, tournamentId.data))
    .limit(1);
  if (!tournament) {
    res.status(404).json({ error: "Torneo non trovato." });
    return;
  }
  const existing = await db
    .select({ athleteId: fieldfameTournamentRegistrations.athleteId })
    .from(fieldfameTournamentRegistrations)
    .where(and(
      eq(fieldfameTournamentRegistrations.tournamentId, tournament.id),
      eq(fieldfameTournamentRegistrations.athleteId, userId),
    ))
    .limit(1);
  if (existing.length) {
    await db
      .delete(fieldfameTournamentRegistrations)
      .where(and(
        eq(fieldfameTournamentRegistrations.tournamentId, tournament.id),
        eq(fieldfameTournamentRegistrations.athleteId, userId),
      ));
  } else {
    const [registered] = await db
      .select({ value: count() })
      .from(fieldfameTournamentRegistrations)
      .where(eq(fieldfameTournamentRegistrations.tournamentId, tournament.id));
    if ((registered?.value ?? 0) >= tournament.teamCapacity) {
      res.status(409).json({ error: "Il torneo è al completo." });
      return;
    }
    await db
      .insert(fieldfameTournamentRegistrations)
      .values({ tournamentId: tournament.id, athleteId: userId })
      .onConflictDoNothing();
  }
  const [registered] = await db
    .select({ value: count() })
    .from(fieldfameTournamentRegistrations)
    .where(eq(fieldfameTournamentRegistrations.tournamentId, tournament.id));
  res.json({ joined: !existing.length, registeredCount: registered?.value ?? 0 });
});

router.post("/community/tournaments/:tournamentId/winner", requireAuth, async (req, res) => {
  const tournamentId = z.string().uuid().safeParse(req.params.tournamentId);
  const winnerId = z.string().min(1).max(255).safeParse(req.body?.winnerAthleteId);
  if (!tournamentId.success || !winnerId.success) {
    res.status(400).json({ error: "Dati del vincitore non validi." });
    return;
  }
  const userId = userIdFromRequest(req);
  const [tournament] = await db
    .select()
    .from(fieldfameTournaments)
    .where(eq(fieldfameTournaments.id, tournamentId.data))
    .limit(1);
  if (!tournament) {
    res.status(404).json({ error: "Torneo non trovato." });
    return;
  }
  if (tournament.organizerId !== userId) {
    res.status(403).json({ error: "Solo l’organizzatore può certificare il risultato." });
    return;
  }
  if (tournament.eventDate > new Date()) {
    res.status(409).json({ error: "Il vincitore si può certificare dopo la data del torneo." });
    return;
  }
  const [registration] = await db
    .select({ athleteId: fieldfameTournamentRegistrations.athleteId })
    .from(fieldfameTournamentRegistrations)
    .where(and(
      eq(fieldfameTournamentRegistrations.tournamentId, tournament.id),
      eq(fieldfameTournamentRegistrations.athleteId, winnerId.data),
    ))
    .limit(1);
  if (!registration) {
    res.status(400).json({ error: "Il vincitore deve risultare iscritto al torneo." });
    return;
  }
  await db
    .update(fieldfameTournaments)
    .set({ winnerAthleteId: winnerId.data, winnerCertifiedAt: new Date() })
    .where(eq(fieldfameTournaments.id, tournament.id));
  const rows = await communityTournamentRows(userId);
  res.json(rows.find((row) => row.id === tournament.id));
});

export default router;
