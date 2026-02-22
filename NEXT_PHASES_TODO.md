# Apex Blog — Next Phases TODO

## Current Status (Based on Implemented Work)

- [x] Phase 0 baseline (TSX app shell, routing, session, responsive foundations)
- [x] Phase 1 reading UX (home feed, article page, tags, similar-topic links)
- [~] Phase 2 lifecycle (create flow exists in mock UI; update/delete + backend integration pending)
- [~] Phase 4 interaction (comments + emoji reactions exist in mock/local mode; server persistence pending)
- [ ] Phase 3 sharing capability
- [ ] Phase 5 hardening and deployment quality gates

---

## Phase 2 — Complete Real Blog Lifecycle (Next)

### API + Database Integration

- [ ] Connect UI data layer from mock API to ASP.NET API endpoints
- [ ] Map article model parity: content, images, code snippets, tags, metadata
- [ ] Implement Update Blog endpoint wiring in UI
- [ ] Implement Delete Blog endpoint wiring in UI
- [ ] Add owner-only authorization checks end-to-end

### UI Work

- [ ] Add Manage Blogs page (list own posts)
- [ ] Add Edit action from Manage Blogs to Editor page
- [ ] Add Delete action with confirmation
- [ ] Add optimistic/error UI states for save/update/delete

### Exit Criteria

- [ ] Create, update, delete works with PostgreSQL persistence
- [ ] Unauthorized edit/delete returns 403 and is handled in UI

---

## Phase 3 — Sharing Capability

### Core Sharing

- [ ] Add Copy Link button on article page
- [ ] Add native Web Share fallback (`navigator.share`) when available
- [ ] Add social share links (LinkedIn, X, Facebook, WhatsApp, Email)

### UX

- [ ] Add success toast/feedback for copy/share actions
- [ ] Add share actions on both article page and feed cards

### Exit Criteria

- [ ] Users can share from mobile and desktop in <= 2 clicks

---

## Phase 4 — Move Interaction From Mock to API

### Comments

- [ ] Persist comments through ASP.NET API
- [ ] Keep current UI but switch data source from local storage to API
- [ ] Add loading/error empty states for comments section

### Reactions

- [ ] Persist emoji reaction toggles via API
- [ ] Sync per-user selected emojis from JWT-authenticated user state
- [ ] Keep counts consistent between page reloads

### Exit Criteria

- [ ] Reactions/comments survive refresh and new sessions

---

## Phase 5 — Hardening + Deploy Readiness

### Security & Stability

- [ ] Add request validation for all create/update/comment/reaction endpoints
- [ ] Add basic rate-limiting on write endpoints
- [ ] Add safe error boundaries and user-facing failure states
- [ ] Add audit logging for failed auth and write operations

### Performance & Accessibility

- [ ] Image size guardrails/compression strategy
- [ ] Lazy loading for article images
- [ ] Keyboard accessibility pass for editor and about section forms
- [ ] Mobile QA at 320px/375px/768px breakpoints

### CI/CD + Ops

- [ ] Add UI `.env.example` and API config example files
- [ ] Add build + typecheck + backend build pipeline
- [ ] Add production deploy config (domain, HTTPS, env vars)
- [ ] Add health checks and post-deploy smoke checklist

### Exit Criteria

- [ ] Repeatable deployment pipeline succeeds
- [ ] Core journeys validated in production-like environment

---

## Immediate Sprint Plan (Recommended Order)

1. [ ] Wire UI to API for create/read first (replace mock reads/writes)
2. [ ] Implement manage/edit/delete flows
3. [ ] Add sharing buttons and copy-link
4. [ ] Move comments/reactions to API persistence
5. [ ] Final hardening and deploy checklist run
