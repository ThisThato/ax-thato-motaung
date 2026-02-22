# Apex Blog — Phased Implementation Plan

## Goal Summary

Build a production-ready blog platform with:

1. A Medium-like reading and writing UI (inspired by the provided article layout)
2. Full blog post lifecycle (create, update, delete)
3. Blog sharing capability
4. User interaction features

---

## Product Constraints

- Keep one design system across all pages (typography, spacing, buttons, cards).
- Preserve current Tailwind token palette and existing app structure where possible.
- Enforce authoring permissions from backend (never UI-only restriction).
- Build iteratively so each phase is shippable.

---

## Phase 0 — Foundation & UX Baseline

### Objective

Establish stable app shell and layout primitives before feature expansion.

### Scope

- Define app-level route map: home, blog details, editor, profile/auth, 404.
- Introduce session management and API client wiring.
- Normalize responsive layout rules for:
  - Top navigation
  - Content width
  - Reading body width
  - Sidebar blocks

### Deliverables

- Working app navigation.
- Consistent global styles and spacing rules.
- Environment configuration template (`MONGODB_URI`, `JWT_SECRET`, `OWNER_EMAIL`, `VITE_API_URL`).

### Exit Criteria

- App runs cleanly locally (server + UI).
- All base routes render without runtime errors.

---

## Phase 1 — Medium-Style Reading Experience

### Objective

Match the interaction and content density of a modern Medium-like article page.

### Scope

- Home/feed with clean post cards (title, summary, tags, date, author).
- Article details page with:
  - Large readable title
  - Author/date row
  - Well-spaced article content
  - Tag strip
  - Reaction/comment/share actions
- “Similar posts” section based on overlapping tags.

### UI Direction (Inspired by reference)

- Minimal chrome; content-first layout.
- Strong typographic hierarchy:
  - Distinct title scale
  - Comfortable reading line-height
  - Clear section spacing
- Subtle interaction affordances (hover states, actionable icons/buttons).

### Deliverables

- Home feed and article page visually aligned to the target style direction.
- Similar-topic linking from each article.

### Exit Criteria

- Reader can browse feed → open post → discover related posts seamlessly.

---

## Phase 2 — Blog Lifecycle (Create / Update / Delete)

### Objective

Implement complete author workflow with secure permissions.

### Scope

- Backend APIs:
  - Create blog
  - Update blog
  - Delete blog
  - List own blogs (dashboard view)
- Frontend editor page:
  - Title, description, tags, content input
  - Publish/save actions
  - Edit existing post
  - Delete confirmation flow
- Permission model:
  - Owner/admin can create, update, delete
  - Non-owner users cannot mutate blog content

### Deliverables

- Fully functional CRUD for posts.
- Manage-blogs view for owner/editor.
- Server-side authorization middleware and validation.

### Exit Criteria

- Owner can create/edit/delete posts end-to-end.
- Unauthorized write attempts return `403`.

---

## Phase 3 — Sharing Capability

### Objective

Make every post easy to distribute externally.

### Scope

- Copy-link action for each post.
- Native Web Share API support when available.
- Fallback social share links (X/Twitter, LinkedIn, Facebook, WhatsApp, Email).
- Canonical post URL strategy based on `blog_id` slug.

### Deliverables

- Share controls on post detail and feed cards.
- Confirmed deep-linking to post detail route.

### Exit Criteria

- User can share a blog from desktop/mobile with one or two clicks.

---

## Phase 4 — User Interaction

### Objective

Enable meaningful reader engagement.

### Scope

- Comments:
  - Add comment
  - List comments
  - Optional threaded replies (post-MVP)
- Reactions:
  - Emoji reaction toggles
  - Per-emoji counts
- Engagement data:
  - Read count
  - Comment count
  - Reaction totals

### Deliverables

- Commenting and emoji reaction UX on article page.
- Interaction APIs with persistence and validation.

### Exit Criteria

- Reader can react and comment with immediate UI feedback and persisted state.

---

## Phase 5 — Hardening & Quality

### Objective

Stabilize for reliable usage.

### Scope

- Validation hardening (inputs, payload size, tags).
- Error UX and empty states.
- Rate-limit and abuse prevention for interaction endpoints.
- Accessibility and keyboard checks.
- Basic smoke/regression test pass.

### Deliverables

- Reduced runtime errors.
- Better resilience for malformed input.
- Deployment-ready checklist.

### Exit Criteria

- All core user journeys pass manual QA:
  - Auth
  - Browse/read
  - CRUD by owner
  - Share
  - Comment/react

---

## Implementation Order (Recommended)

1. Phase 0 (foundation)
2. Phase 1 (reading UX + related posts)
3. Phase 2 (CRUD lifecycle)
4. Phase 4 (interaction)
5. Phase 3 (sharing)
6. Phase 5 (hardening)

> Note: Sharing can be shipped before interaction if needed, but interaction usually provides better early engagement signal.

---

## MVP vs Next Iteration

### MVP

- Medium-like feed and article pages
- Owner-only CRUD
- Copy/share link
- Comments + emoji reactions
- Similar-topic links by tags

### Next Iteration

- Rich text editor (EditorJS block tooling)
- Draft/publish workflow and scheduling
- Notifications for new comments/reactions
- Search ranking and personalization

---

## Tracking Checklist

- [ ] Phase 0 complete
- [ ] Phase 1 complete
- [ ] Phase 2 complete
- [ ] Phase 3 complete
- [ ] Phase 4 complete
- [ ] Phase 5 complete
