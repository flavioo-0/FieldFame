# FieldFame

A mobile community for amateur athletes to share highlight clips, build a sport profile, find tournaments, and get discovered through local scouting.

## Run & Operate

- Use the configured `artifacts/fieldfame: expo` workflow to run the mobile app.
- `pnpm --filter @workspace/fieldfame run typecheck` — typecheck the mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

The first mobile MVP uses local device storage and does not require a database or external service.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/fieldfame/app/` — Expo Router screens and tabs
- `artifacts/fieldfame/context/AppStore.tsx` — persisted profile, follows, likes, bookmarks, feed preferences, tournaments, and uploaded clip metadata
- `artifacts/fieldfame/constants/demo-data.ts` — local pilot athlete, sport, highlight, and tournament data
- `artifacts/fieldfame/assets/images/` — app icon and feed media
- `artifacts/fieldfame/constants/colors.ts` — mobile theme tokens

## Architecture decisions

- The first release is a local-first mobile MVP: profile changes, follows, reactions, bookmarks, feed preferences, tournaments, and created posts are stored in AsyncStorage.
- Demo athlete/ranking entries are illustrative Bari pilot data, not real accounts or measured pilot results.
- Selected videos stay on the user's device; this build does not upload media or expose profiles to a server.
- Popular clips and tournament registrations are local demo data and are not shared across devices.
- Achievement badges are calculated from saved highlights and tournament data. Tournament winners are recorded by the local organizer flow, not verified by a server or official body.

## Product

- Cross-sport social-scouting feed for football, basketball, volleyball, and padel.
- A global popular-clips feed plus customizable sport, following, and city filters.
- Athlete discovery across sports; local football leaderboards sortable by goals, assists, and saves.
- Tournament discovery, local registration, and event creation.
- Profile badges for publishing highlights, leading the football ranking, joining tournaments, and organizer-certified wins.
- Athlete profile editing and on-device highlight publishing.

## User preferences

Build the concept as a native mobile app with a Bari-first pilot.
Use orange as FieldFame's startup brand color.

## Gotchas

- The video picker and player require device media permissions. The web preview can select local files but does not represent native iOS/Android permission dialogs.
- Demo ranking figures are sample content, not measured pilot results.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
