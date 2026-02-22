# Apex Blog — Next Phases TODO (Synced)

Aligned with [SESSION_WORK_API_CROSS_REFERENCE.md](SESSION_WORK_API_CROSS_REFERENCE.md).

## Current Status

- [x] Phase 0 baseline (TSX shell, routes, session, responsive layout)
- [x] Phase 1 reading UX (modern home, featured, tabs, related topics)
- [~] Phase 2 lifecycle (UI complete in mock mode; API parity/wiring pending)
- [x] Phase 3 sharing UX (copy/native/social share actions + toasts)
- [~] Phase 4 interaction (comments/reactions UI complete; API wiring pending)
- [ ] Phase 5 hardening/deploy quality gates

---

## Completed in UI (Reference)

- [x] Block-based editor (`paragraph`, `image`, `code`) with inline image placement
- [x] Block-based article rendering on blog detail
- [x] Home hybrid mode: curated feed + `View all results`
- [x] Night mode default + toggle + persistence
- [x] Non-admin reader-mode restrictions in routes/nav
- [x] Code snippet copy button + toast
- [x] Metrics hidden from UI presentation (reads/comments/reactions)

---

## P0 — API Contract Parity (Do Next)

### Blog Content Model
- [ ] Extend `CreateBlogRequest` and `UpdateBlogRequest` to include `contentBlocks`
- [ ] Persist `contentBlocks` JSON (or normalized block table)
- [ ] Return `contentBlocks` from `GET /api/blogs/{blogId}`

### Manage/Edit APIs
- [ ] Add `GET /api/blogs/mine` for manage page (auth)
- [ ] Add editor-prefill endpoint parity (`GET /api/blogs/{blogId}/edit`) or equivalent secure detail

### Ownership Rules
- [ ] Enforce author ownership (`AuthorId == current user`) on update/delete (in addition to role)
- [ ] Return clear `403` error payloads consumed by UI

### Exit Criteria
- [ ] Editor + manage pages can run fully against API with no mock fallback

---

## P1 — UI Data Source Switch (Mock → API)

- [ ] Replace `mockContentApi.listBlogs/getBlog` with API calls in home/blog pages
- [ ] Replace editor create/update/get-for-edit flows with API
- [ ] Replace manage list/delete flows with API
- [ ] Keep current toasts/error states while swapping data source

### Exit Criteria
- [ ] Post create/edit/delete/read persists in PostgreSQL and survives refresh/restart

---

## P2 — Interaction Persistence via API

### Comments
- [ ] Wire blog comments section to `GET/POST /api/blogs/{blogId}/comments`
- [ ] Ensure UI handles loading/empty/error states from server responses

### Reactions
- [ ] Wire emoji reactions to `GET/POST /api/blogs/{blogId}/reactions`
- [ ] Keep per-user selection state synced from JWT-authenticated user

### Exit Criteria
- [ ] Comments/reactions persist across sessions and devices

---

## P3 — Feed Query/Ranking Improvements (API)

- [ ] Add query params to `GET /api/blogs` for `q`, `tag`, `sort`, pagination
- [ ] Improve similar-topic ranking by shared tag overlap + recency
- [ ] Keep card payload shape consistent with UI `BlogCard`

---

## P4 — Hardening & Deploy Readiness

### Security/Stability
- [ ] Add stronger request validation for blog/comment/reaction write endpoints
- [ ] Add write rate-limiting for abuse prevention
- [ ] Add consistent structured error responses

### Performance/Accessibility
- [ ] Add image size/compression guardrails
- [ ] Add lazy loading strategy for large article images
- [ ] Run keyboard + screen-reader checks on editor/blog pages

### CI/CD & Operations
- [ ] Add UI/API `.env.example` files
- [ ] Add CI pipeline: UI typecheck/build + API build/test
- [ ] Add deploy checklist + health verification flow

---

## Recommended Execution Order

1. [ ] API `contentBlocks` contract + detail response parity
2. [ ] `/blogs/mine` + owner-enforced update/delete
3. [ ] Switch UI data source from mock to API
4. [ ] Wire comments/reactions persistence
5. [ ] Add feed query/similar-ranking improvements
6. [ ] Hardening + deployment checklist
