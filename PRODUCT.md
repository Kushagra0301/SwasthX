# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People who want a concrete diet or workout plan without signing up for anything. They arrive
with a goal (lose weight, gain muscle, maintain) and a rough sense of their own numbers, and
they want something they can act on the same day. They are not clinicians and not athletes
under a coach; they are ordinary people who have bounced off apps that demand an account
before showing anything.

## Product Purpose

SwasthX turns a handful of body and lifestyle inputs into a personalized daily diet plan or
weekly workout schedule, computed in seconds and downloadable as a PDF. Success is a visitor
who lands, answers a short form, and leaves with a plan file on their device.

## Positioning

No login, no OTP, no email capture, no paywall. The plan is generated from the visitor's own
numbers via TDEE calculation, and the entire path from landing page to downloaded PDF happens
in one session with nothing stored server-side about who they are.

## Operating Context

Two independent flows sharing one shell:

- `/questionnaires/diet` collects age, gender, weight, height, activity level, goal, and diet
  preference, then returns calorie/macro targets plus a per-meal menu.
- `/questionnaires/workout` collects gender, fitness level, goal, location, days per week, and
  preferred workout types, then returns a weekly schedule with warm-up, exercises, and cooldown.

Each generated plan is written to `localStorage` (`dietPlan`, `workoutPlan`). When both exist,
the PDF export combines them. A disclaimer modal gates first entry into either questionnaire.

## Capabilities and Constraints

- Next.js 16 App Router, React 19, Tailwind CSS v4, Prisma, framer-motion 13, react-icons.
- Validation is Zod schemas in `lib/schemas.ts` consumed by react-hook-form; the API routes
  validate the same schemas. Form field names and enum values are part of the API contract and
  must not be renamed.
- `localStorage` keys `dietPlan` and `workoutPlan` are read by `lib/pdf.ts`; their shape is a
  contract between the forms and the PDF exporter.
- Routes `/`, `/questionnaires/diet`, `/questionnaires/workout` are fixed.
- PDF export runs client-side via jsPDF and html2canvas.

## Brand Commitments

Name: SwasthX. Attribution line "Made by Kushagra" appears in the footer. No logo asset exists;
the wordmark and any mark are open to design. No other binding identity constraints.

## Evidence on Hand

None. There are no real customers, testimonials, usage numbers, press mentions, or partner
logos. Future work must not invent any. The only truthful proof points are properties of the
product itself: free, no account, PDF output, instant generation.

## Product Principles

1. Nothing is asked for that the plan does not need. Every field must earn its place.
2. The plan is the product; the interface exists to get out of its way and hand it over.
3. Never imply medical authority. Guidance is informational and the disclaimer is load-bearing.
4. The visitor owns their data. Nothing leaves the device that does not have to.
5. Honest proof only. No fabricated social proof, counts, or credentials.

## Accessibility & Inclusion

WCAG AA contrast for all text. Full keyboard operation of forms, nav, and the disclaimer modal
(focus trap, Escape to close, focus restoration). All motion honors `prefers-reduced-motion`.
