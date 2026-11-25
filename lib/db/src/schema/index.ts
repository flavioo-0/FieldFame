import {
  integer,
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const fieldfameProfiles = pgTable(
  "fieldfame_profiles",
  {
    userId: varchar("user_id", { length: 255 }).primaryKey(),
    username: varchar("username", { length: 32 }).notNull(),
    displayName: varchar("display_name", { length: 80 }).notNull(),
    city: varchar("city", { length: 100 }).notNull().default(""),
    sport: varchar("sport", { length: 24 }).notNull().default("Calcio"),
    position: varchar("position", { length: 50 }).notNull().default("Atleta"),
    number: integer("number").notNull().default(0),
    bio: varchar("bio", { length: 240 }).notNull().default(""),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("fieldfame_profiles_username_idx").on(table.username)],
);

export const fieldfamePosts = pgTable(
  "fieldfame_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: varchar("author_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    caption: varchar("caption", { length: 300 }).notNull(),
    sport: varchar("sport", { length: 24 }).notNull(),
    category: varchar("category", { length: 32 }).notNull(),
    mediaPath: text("media_path").notNull(),
    durationSeconds: integer("duration_seconds"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("fieldfame_posts_media_path_idx").on(table.mediaPath),
    index("fieldfame_posts_author_created_idx").on(table.authorId, table.createdAt),
  ],
);

export const fieldfameLikes = pgTable(
  "fieldfame_likes",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => fieldfamePosts.id, { onDelete: "cascade" }),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.postId, table.userId] })],
);

export const fieldfameFollows = pgTable(
  "fieldfame_follows",
  {
    followerId: varchar("follower_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    followeeId: varchar("followee_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.followerId, table.followeeId] })],
);

export const fieldfameComments = pgTable(
  "fieldfame_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => fieldfamePosts.id, { onDelete: "cascade" }),
    authorId: varchar("author_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    body: varchar("body", { length: 500 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("fieldfame_comments_post_created_idx").on(table.postId, table.createdAt)],
);

export const fieldfameCommentMentions = pgTable(
  "fieldfame_comment_mentions",
  {
    commentId: uuid("comment_id")
      .notNull()
      .references(() => fieldfameComments.id, { onDelete: "cascade" }),
    mentionedUserId: varchar("mentioned_user_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.commentId, table.mentionedUserId] })],
);

export const fieldfameTournaments = pgTable(
  "fieldfame_tournaments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizerId: varchar("organizer_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    title: varchar("title", { length: 100 }).notNull(),
    sport: varchar("sport", { length: 24 }).notNull(),
    city: varchar("city", { length: 100 }).notNull(),
    venue: varchar("venue", { length: 160 }).notNull(),
    eventDate: timestamp("event_date", { withTimezone: true }).notNull(),
    format: varchar("format", { length: 40 }).notNull(),
    teamCapacity: integer("team_capacity").notNull(),
    description: varchar("description", { length: 300 }).notNull().default(""),
    winnerAthleteId: varchar("winner_athlete_id", { length: 255 }).references(
      () => fieldfameProfiles.userId,
      { onDelete: "set null" },
    ),
    winnerCertifiedAt: timestamp("winner_certified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("fieldfame_tournaments_date_idx").on(table.eventDate)],
);

export const fieldfameTournamentRegistrations = pgTable(
  "fieldfame_tournament_registrations",
  {
    tournamentId: uuid("tournament_id")
      .notNull()
      .references(() => fieldfameTournaments.id, { onDelete: "cascade" }),
    athleteId: varchar("athlete_id", { length: 255 })
      .notNull()
      .references(() => fieldfameProfiles.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.tournamentId, table.athleteId] })],
);