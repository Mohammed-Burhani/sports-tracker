# Product

## Register

product

## Users

Tournament organizers running competitive sports events across multiple disciplines (table tennis, tennis, badminton, cricket, football, pickleball). They work inside an organization with roles (admin, staff, viewer) and coordinate events, sessions, teams, and participants. Their dominant context is **planning ahead**: setting up events, scheduling sessions, choosing formats (tournament, league, open play, training, friendly, championship), assigning venues, and managing registrations before anyone steps on court. Day-of operations (check-ins, counts, results) exist but the primary job to be done is getting a well-structured schedule in place quickly and confidently.

## Product Purpose

Sports Tracker is a mobile-first (Expo / React Native) operations app for organizing multi-sport competitive events. It exists to replace spreadsheets and group chats with a single, structured place to plan events and sessions, configure format-specific rules, track teams and participants, and see what's happening at a glance via the dashboard. Success looks like an organizer creating a fully configured event in a couple of minutes, trusting the data, and never being unsure what's scheduled or who's registered.

## Brand Personality

Modern, premium, minimal. The voice is composed and precise, never loud or salesy. It should feel like a best-in-class consumer app that organizers are proud to use, not an internal admin tool. Confidence comes from restraint and craft: clear hierarchy, calm surfaces, and decisive interactions, with the sport itself supplying moments of color and identity rather than chrome or decoration.

## Anti-references

- **Generic SaaS dashboards.** No navy-and-blue corporate cliche, no hero-metric template (giant number + small label + gradient accent), no endless identical icon+heading+text card grids.
- **Sportsbook / betting aesthetics.** No garish neon greens, loud odds-board energy, or casino flash.
- **Visual indecision.** The codebase currently carries a tension (warm cream design tokens vs. a dark-mode declaration with a navy icon in `app.json`). The product should commit to one coherent identity rather than mixing both. (Resolved direction belongs in DESIGN.md; the strategic rule is: pick one and be consistent.)

## Design Principles

1. **Planning is the hero.** Optimize first for creating and scheduling events/sessions. Flows for setup should be the fastest, clearest paths in the app.
2. **Calm under structure.** This is dense, structured data (formats, rules, rosters). Earn trust through clear hierarchy and breathing room, not density for its own sake.
3. **The sport carries the color.** Identity and accent come from the sport being managed, used purposefully for recognition and wayfinding, not decoration sprayed across the UI.
4. **Premium through restraint.** Match the polish of best-in-class consumer apps by removing, not adding. Familiar affordances done impeccably beat invented ones.
5. **Never ambiguous.** Status, counts, schedules, and results must always read at a glance. No guessing what state something is in.

## Accessibility & Inclusion

- Target **WCAG AA**: body text ≥4.5:1 contrast, large text ≥3:1. Audit muted text on tinted surfaces specifically (a known risk in the current warm palette).
- **Reduced motion**: honor `prefers-reduced-motion`; motion conveys state only and never blocks completing a task.
- Touch targets sized for on-the-floor mobile use; legible at arm's length in variable lighting (gyms, courtside, outdoors).
