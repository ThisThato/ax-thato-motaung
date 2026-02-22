# Apex Blog — Session Work Log + API Cross-Reference

## Scope of This Document

This document captures:

- What was implemented in this session (primarily UI + mock-mode behavior)
- What the current ASP.NET + PostgreSQL API already supports
- What still needs to be implemented/changed in API contracts so UI can move from mock storage to real backend persistence

---

## 1) Work Completed in This Session (UI/Mock Layer)

### A. Home/Discovery Experience

- Reworked home into a modern discovery layout:
  - Featured article section
  - Search + topic chips
  - Feed tabs (`Latest`, `Trending`, `Editor's Picks`)
  - Curated feed batching + `Load more`
- Added hybrid all-results behavior:
  - `View all results (N)` shows all matching posts
  - `Back to curated feed` returns to batched mode
  - URL-backed state (`tab`, `q`, `tag`, `view`) for shareable navigation

### B. Theme + Navigation

- Implemented global night mode with persistence
- Set night mode as default for first-time users
- Added navbar theme toggle
- Synced navbar search input with URL query (`q`) so it reflects active filter state

### C. Auth/Role UX Rules

- Added logged-in user view page (`/me`) for admin users
- Enforced role behavior in UI:
  - Non-admin users are read/comment/react/share only
  - Admin-only routes: editor/manage/me
- Added non-admin `Reader mode` badge in navbar

### D. Article Authoring + Reading

- Implemented proper block-based content model in UI:
  - `paragraph` block
  - `image` block
  - `code` block
- Editor supports block insertion/reordering/removal and inline image upload per block
- Blog rendering now follows ordered blocks (images/code can appear anywhere in post)
- Legacy content auto-normalization introduced in mock API
- Added interleaving migration logic so old posts do not force images to the end

### E. Interaction UX

- Added toast feedback for:
  - reaction toggle
  - posting comments
  - sharing/copy-link actions
- Added `Copy` button on every code snippet block with success/failure feedback
- Adjusted snippet code typography to IDE-like monospace and smaller size (~12px)

### F. Reading Comfort Updates

- Reduced visual intensity on blog detail page
- Narrowed reading column and softened typography for book-like readability

### G. Metrics Visibility

- Hid reads/comments/reactions counts from UI surfaces (temporarily)
- Data still exists in mock/API models; only presentation removed

---

## 2) Current API Surface (Observed)

### Existing endpoints (implemented)

- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `GET /api/auth/me`
- `GET /api/blogs`
- `GET /api/blogs/{blogId}`
- `POST /api/blogs` (admin)
- `PUT /api/blogs/{blogId}` (admin)
- `DELETE /api/blogs/{blogId}` (admin)
- `GET /api/blogs/{blogId}/comments`
- `POST /api/blogs/{blogId}/comments` (auth)
- `GET /api/blogs/{blogId}/reactions`
- `POST /api/blogs/{blogId}/reactions` (auth)

### Current limitations relative to UI

- Blog contracts currently store/surface `Content` as string, not structured `contentBlocks`
- Blog contracts do not expose inline `images` and `codeSnippets` arrays as UI now expects
- No endpoint for “my blogs” manage view (`/manage-blogs` parity)
- Similar posts payload in `GET /api/blogs/{id}` is not full `BlogCard` shape expected by UI
- Update/Delete endpoints enforce `IsAdmin` but do **not** enforce ownership (`AuthorId == current user`) yet

---

## 3) Feature-to-API Cross-Reference

## Legend

- UI Status: `Done (Mock)` means implemented in frontend with local/mock data
- API Status: `Ready`, `Partial`, or `Missing`

| Feature                             | UI Status      | API Status | API Work Required                                                                       |
| ----------------------------------- | -------------- | ---------- | --------------------------------------------------------------------------------------- |
| Home feed + tabs + filters          | Done (Mock)    | Partial    | Add query support on `GET /api/blogs` for `q`, `tag`, `sort`, pagination.               |
| Featured + similar topics           | Done (Mock)    | Partial    | Return similar posts in full card shape (author/date/tag metadata) and rank by overlap. |
| Blog detail reading                 | Done (Mock)    | Partial    | Extend detail response to include `contentBlocks`, inline image/code data.              |
| Block-based editor (image anywhere) | Done (Mock)    | Missing    | Extend create/update contracts to accept `contentBlocks[]`; persist JSON in DB.         |
| Manage own posts                    | Done (Mock)    | Missing    | Add `GET /api/blogs/mine` (auth) with owner/admin constraints.                          |
| Edit existing post load             | Done (Mock)    | Missing    | Add `GET /api/blogs/{blogId}/edit` or equivalent owner/admin-safe detail endpoint.      |
| Comments                            | Done (Mock)    | Ready      | Wire UI to existing comments endpoints.                                                 |
| Reactions                           | Done (Mock)    | Ready      | Wire UI to existing reactions endpoints.                                                |
| Share actions                       | Done (UI)      | N/A        | No API dependency required.                                                             |
| Role restrictions (reader/admin)    | Done (UI+Mock) | Partial    | Return proper `403` payloads and enforce owner checks server-side.                      |
| Copy code snippet                   | Done (UI)      | N/A        | No API dependency required.                                                             |

---

## 4) Required API Contract Changes (Priority)

## P0 — Required for current editor/reader parity

1. **Create/Update blog contracts must support block content**
   - Add `contentBlocks` field
   - Store as JSON in DB (or normalize into child table)

   Proposed shape:

   ```json
   {
     "title": "...",
     "description": "...",
     "banner": "...",
     "tags": ["c#", "cloud"],
     "draft": false,
     "contentBlocks": [
       { "id": "b1", "type": "paragraph", "text": "..." },
       { "id": "b2", "type": "image", "src": "...", "alt": "..." },
       { "id": "b3", "type": "code", "language": "csharp", "code": "..." }
     ]
   }
   ```

2. **Blog detail must return block content**
   - `GET /api/blogs/{blogId}` should include `contentBlocks`
   - Keep temporary fallback `content` only if backward compatibility is needed

3. **Manage endpoint for owner/admin flows**
   - Add `GET /api/blogs/mine`
   - Return same card shape used by home list

## P1 — Required for secure ownership behavior

4. **Owner enforcement on update/delete**
   - Admin check alone is insufficient
   - Enforce `blog.AuthorId == currentUser.Id` for mutate actions

5. **Edit load endpoint parity**
   - Add endpoint for editor prefill with full blog payload including blocks

## P2 — Quality/performance for scale

6. Add search/sort/pagination query params to `GET /api/blogs`
7. Improve similar-topic ranking by shared tag count + recency

---

## 5) Suggested API Endpoints for UI Integration

- `GET /api/blogs?tab=latest|trending|picks&q=&tag=&limit=&offset=`
- `GET /api/blogs/{blogId}` (full detail incl. `contentBlocks`)
- `GET /api/blogs/{blogId}/similar?limit=6` (optional split)
- `GET /api/blogs/mine` (auth)
- `GET /api/blogs/{blogId}/edit` (auth + ownership)
- `POST /api/blogs` (auth + admin + owner)
- `PUT /api/blogs/{blogId}` (auth + admin + owner)
- `DELETE /api/blogs/{blogId}` (auth + admin + owner)
- `GET/POST /api/blogs/{blogId}/comments`
- `GET/POST /api/blogs/{blogId}/reactions`

---

## 6) Recommended Backend Implementation Order

1. Add `contentBlocks` support to contracts + persistence
2. Update detail response shape for reader page parity
3. Add `/blogs/mine` and edit-prefill endpoint
4. Add ownership checks on update/delete
5. Wire UI data layer from mock API to ASP.NET endpoints
6. Add search/sort/pagination and similar-ranking improvements

---

## 7) Migration Note

Current UI still works in mock mode with legacy fallback behavior. Once API contract parity is complete, swap `mockContentApi` calls to real `api` calls in:

- home page
- blog page
- editor page
- manage blogs page

No major UI rewrite is needed after API parity; most remaining work is data source wiring + payload mapping.
