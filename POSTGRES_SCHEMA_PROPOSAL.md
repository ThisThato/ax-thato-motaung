# Apex Blog — PostgreSQL Schema Proposal

## Goal

Design a schema that fits your current app structure and upcoming API parity needs:

- relational core (users, blogs, comments, reactions)
- flexible article body via `jsonb` (`content_blocks`)
- efficient discovery/search/similar-topic queries

---

## 1) Recommended Table Design

## `users`

- `id uuid primary key`
- `full_name varchar(160) not null`
- `email varchar(180) not null unique`
- `username varchar(80) not null unique`
- `password_hash text not null`
- `profile_image text not null`
- `is_admin boolean not null default false`
- `joined_at timestamptz not null default now()`

## `blogs`

- `id uuid primary key`
- `blog_id varchar(180) not null unique` (public slug/id)
- `author_id uuid not null references users(id) on delete cascade`
- `title varchar(240) not null`
- `description varchar(400) not null`
- `banner text not null default ''`
- `content text not null default ''` (legacy fallback during transition)
- `content_blocks jsonb not null default '[]'::jsonb` (source of truth)
- `tags text[] not null default '{}'::text[]`
- `draft boolean not null default false`
- `total_reads integer not null default 0`
- `total_comments integer not null default 0`
- `total_reactions integer not null default 0`
- `published_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## `comments`

- `id uuid primary key`
- `blog_post_id uuid not null references blogs(id) on delete cascade`
- `user_id uuid not null references users(id) on delete cascade`
- `content varchar(1000) not null`
- `commented_at timestamptz not null default now()`

## `reactions`

- `id uuid primary key`
- `blog_post_id uuid not null references blogs(id) on delete cascade`
- `user_id uuid not null references users(id) on delete cascade`
- `emoji varchar(8) not null`
- `created_at timestamptz not null default now()`
- `unique (blog_post_id, user_id, emoji)`

---

## 2) Index Strategy

## Core indexes

- `blogs(blog_id)` unique
- `blogs(author_id, published_at desc)` for `/blogs/mine`
- `blogs(draft, published_at desc)` for feed queries
- `comments(blog_post_id, commented_at desc)` for comment lists
- `reactions(blog_post_id)` for reaction aggregation

## Discovery/search indexes

- `gin(tags)` for tag filtering and overlap checks
- `gin(to_tsvector('english', title || ' ' || description))` for feed search
- optional: `gin(content_blocks jsonb_path_ops)` if you query inside blocks later

## Similar-topic query support

- `tags && :targetTags` plus sort by overlap size and recency.

---

## 3) `content_blocks` JSONB Shape

Use ordered block array:

```json
[
  { "id": "b1", "type": "paragraph", "text": "..." },
  { "id": "b2", "type": "image", "src": "...", "alt": "..." },
  { "id": "b3", "type": "code", "language": "csharp", "code": "..." }
]
```

Validation rules:

- `type` must be one of: `paragraph`, `image`, `code`
- paragraph requires non-empty `text`
- image requires non-empty `src`
- code requires non-empty `code`, optional `language`

---

## 4) SQL Blueprint (First Migration)

```sql
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key,
  full_name varchar(160) not null,
  email varchar(180) not null unique,
  username varchar(80) not null unique,
  password_hash text not null,
  profile_image text not null,
  is_admin boolean not null default false,
  joined_at timestamptz not null default now()
);

create table if not exists blogs (
  id uuid primary key,
  blog_id varchar(180) not null unique,
  author_id uuid not null references users(id) on delete cascade,
  title varchar(240) not null,
  description varchar(400) not null,
  banner text not null default '',
  content text not null default '',
  content_blocks jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}'::text[],
  draft boolean not null default false,
  total_reads integer not null default 0,
  total_comments integer not null default 0,
  total_reactions integer not null default 0,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key,
  blog_post_id uuid not null references blogs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content varchar(1000) not null,
  commented_at timestamptz not null default now()
);

create table if not exists reactions (
  id uuid primary key,
  blog_post_id uuid not null references blogs(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  emoji varchar(8) not null,
  created_at timestamptz not null default now(),
  unique (blog_post_id, user_id, emoji)
);

create index if not exists ix_blogs_author_published on blogs(author_id, published_at desc);
create index if not exists ix_blogs_draft_published on blogs(draft, published_at desc);
create index if not exists ix_blogs_tags_gin on blogs using gin(tags);
create index if not exists ix_comments_blog_commented on comments(blog_post_id, commented_at desc);
create index if not exists ix_reactions_blog on reactions(blog_post_id);
create index if not exists ix_blogs_search_tsv on blogs using gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'')));
```

---

## 5) API Contract Changes Needed

Map schema to API DTO/contracts:

1. `CreateBlogRequest` and `UpdateBlogRequest`
   - add `contentBlocks`
   - keep `content` temporarily for backward compatibility only

2. `GET /api/blogs/{blogId}` response
   - include `contentBlocks`
   - include `tags` from `text[]` directly

3. New endpoint: `GET /api/blogs/mine`
   - uses `author_id = current_user_id`
   - returns current `BlogCard` shape

4. Ownership enforcement
   - update/delete must enforce `blog.author_id == current_user_id`
   - still require admin role if that remains your product rule

---

## 6) Migration Plan from Current Model

1. Add columns: `content_blocks jsonb`, `tags text[]`
2. Backfill from current fields:
   - `tags = string_to_array(tags_csv, ',')`
   - `content_blocks` generated from existing `content` + legacy media/snippets
3. Switch API serialization to `content_blocks`
4. Keep fallback reads from `content` for one release
5. Remove `tags_csv` and legacy-only paths once all clients are updated

---

## 7) Why this is best for your app

- Keeps relational integrity for auth, ownership, comments, reactions
- Supports your new block editor without forcing a document DB
- Keeps queries for feed/search/similar topics efficient
- Minimizes rewrite risk in your current C# + EF Core backend
