# SwasthX

Generates a daily diet plan and a weekly workout plan from a short
questionnaire. Everything is computed per request; nothing about the visitor is
stored server-side.

## Running locally

```bash
npm install
cp .env.example .env   # if you have one; otherwise create .env by hand
npx prisma migrate deploy
npm run dev
```

`.env` needs `DATABASE_URL`. Without it the API routes return 500 and the forms
report that the plan did not come back.

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | `prisma generate` then a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config, `next/core-web-vitals`) |
| `npm run seed` | Seeds the demo user only; refuses to run with `NODE_ENV=production` |

**The meal and exercise tables have no seed script in this repo.** Until they
are populated, `/api/generate-diet` answers "We couldn't build a diet plan with
those preferences" and `/api/generate-workout` falls back or 404s.

## Layout

```
app/            routes; app/api/* are the two plan generators
components/     forms, nav, toast, disclaimer; components/ui/* are the primitives
lib/tdee.ts     calorie and macro maths, pure and shared by the API and the hero preview
lib/pdf.ts      client-side PDF export, reads localStorage `dietPlan` / `workoutPlan`
lib/rateLimit.ts  in-memory fixed-window limiter used by both API routes
prisma/         schema and migrations
```

`DESIGN.md` records the visual system and the contrast maths behind each colour
token. `PRODUCT.md` records what the product actually is and what it may not
claim.

## Rate limiting

Both API routes allow 10 requests per IP per minute and answer 429 with a
`Retry-After` header past that. Counters live in process memory, so a
multi-replica or serverless deployment gets one window per replica. Move to a
shared store (Redis, Upstash) if this ever needs to be a real quota.

## Notes

- Plans are informational. The disclaimer in `components/DisclaimerModal.tsx`
  gates entry to both questionnaires and is stated in full on the landing page.
- Form field names and enum values are part of the API contract; the UI may
  change shape but those names may not.
