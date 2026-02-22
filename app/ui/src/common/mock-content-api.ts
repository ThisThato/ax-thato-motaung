import { getSession } from "./session";
import type { BlogCard, BlogDetail, BlogEditorPayload, CommentItem, ContentBlock, CodeSnippet } from "../types";
import { seedArticles, toBlogCard, type MockArticle } from "../mocks/articles";

const STORAGE_KEY = "apex_blog_mock_articles_v2";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const toBlockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const interleaveBlocks = (
    paragraphs: Extract<ContentBlock, { type: "paragraph" }>[],
    images: Extract<ContentBlock, { type: "image" }>[],
    codes: Extract<ContentBlock, { type: "code" }>[]
): ContentBlock[] => {
    if (paragraphs.length === 0) {
        return [...images, ...codes];
    }

    const output: ContentBlock[] = [];
    let imageIndex = 0;

    paragraphs.forEach((paragraph) => {
        output.push(paragraph);

        if (imageIndex < images.length) {
            output.push(images[imageIndex]);
            imageIndex += 1;
        }
    });

    while (imageIndex < images.length) {
        output.push(images[imageIndex]);
        imageIndex += 1;
    }

    output.push(...codes);
    return output;
};

const blocksFromLegacy = (content: string, images: string[], codeSnippets: CodeSnippet[]): ContentBlock[] => {
    const paragraphBlocks = content
        .split("\n\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map<ContentBlock>((text) => ({ id: toBlockId(), type: "paragraph", text }));

    const imageBlocks = images.map<ContentBlock>((src) => ({
        id: toBlockId(),
        type: "image",
        src,
        alt: "Article image"
    }));

    const codeBlocks = codeSnippets.map<ContentBlock>((snippet) => ({
        id: toBlockId(),
        type: "code",
        language: snippet.language,
        code: snippet.code
    }));

    return interleaveBlocks(
        paragraphBlocks as Extract<ContentBlock, { type: "paragraph" }>[],
        imageBlocks as Extract<ContentBlock, { type: "image" }>[],
        codeBlocks as Extract<ContentBlock, { type: "code" }>[]
    );
};

const isLegacyTailMediaLayout = (blocks: ContentBlock[]) => {
    const firstNonParagraphIndex = blocks.findIndex((block) => block.type !== "paragraph");
    if (firstNonParagraphIndex === -1) {
        return false;
    }

    const tail = blocks.slice(firstNonParagraphIndex);
    const hasImageInTail = tail.some((block) => block.type === "image");
    const hasParagraphAfterMedia = tail.some((block) => block.type === "paragraph");

    return hasImageInTail && !hasParagraphAfterMedia;
};

const rebalanceLegacyTailMedia = (blocks: ContentBlock[]): ContentBlock[] => {
    const paragraphs = blocks.filter((block): block is Extract<ContentBlock, { type: "paragraph" }> => block.type === "paragraph");
    const images = blocks.filter((block): block is Extract<ContentBlock, { type: "image" }> => block.type === "image");
    const codes = blocks.filter((block): block is Extract<ContentBlock, { type: "code" }> => block.type === "code");

    return interleaveBlocks(paragraphs, images, codes);
};

const toLegacyContent = (blocks: ContentBlock[]) => {
    const paragraphText = blocks
        .filter((block): block is Extract<ContentBlock, { type: "paragraph" }> => block.type === "paragraph")
        .map((block) => block.text.trim())
        .filter(Boolean)
        .join("\n\n");

    const images = blocks
        .filter((block): block is Extract<ContentBlock, { type: "image" }> => block.type === "image")
        .map((block) => block.src)
        .filter(Boolean);

    const codeSnippets = blocks
        .filter((block): block is Extract<ContentBlock, { type: "code" }> => block.type === "code")
        .map<CodeSnippet>((block) => ({ language: block.language, code: block.code }))
        .filter((block) => block.code.trim());

    return {
        content: paragraphText,
        images,
        codeSnippets
    };
};

const normalizeArticle = (article: MockArticle): MockArticle => {
    const normalizedImages = Array.isArray(article.images) ? article.images : [];
    const normalizedSnippets = Array.isArray(article.codeSnippets) ? article.codeSnippets : [];

    const initialBlocks = Array.isArray(article.contentBlocks)
        ? article.contentBlocks
        : blocksFromLegacy(article.content, normalizedImages, normalizedSnippets);

    const normalizedBlocks = isLegacyTailMediaLayout(initialBlocks)
        ? rebalanceLegacyTailMedia(initialBlocks)
        : initialBlocks;

    return {
        ...article,
        images: normalizedImages,
        codeSnippets: normalizedSnippets,
        contentBlocks: normalizedBlocks
    };
};

const read = (): MockArticle[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const seeded = clone(seedArticles);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
    }

    try {
        const parsed = JSON.parse(raw) as MockArticle[];
        const normalized = parsed.map(normalizeArticle);
        if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }
        return normalized;
    } catch {
        const seeded = clone(seedArticles);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
    }
};

const write = (articles: MockArticle[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
};

const currentUserId = () => getSession()?.user.id || "anonymous";

export const mockContentApi = {
    async listBlogs(): Promise<BlogCard[]> {
        return read()
            .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
            .map(toBlogCard);
    },

    async getBlog(blogId: string): Promise<{ blog: BlogDetail; similarBlogs: BlogCard[] }> {
        const articles = read();
        const found = articles.find((item) => item.blogId === blogId);
        if (!found) throw new Error("Blog not found");

        found.totalReads += 1;
        found.reads = found.totalReads;
        write(articles);

        const similarBlogs = articles
            .filter((item) => item.blogId !== blogId && item.tags.some((tag) => found.tags.includes(tag)))
            .slice(0, 6)
            .map(toBlogCard);

        const { comments: _comments, reactions: _reactions, userReactions: _userReactions, totalReads: _totalReads, ...blog } = found;
        return { blog, similarBlogs };
    },

    async getBlogForEdit(blogId: string): Promise<BlogEditorPayload & { blogId: string }> {
        const session = getSession();
        if (!session?.user) {
            throw new Error("Sign in to edit articles");
        }
        if (!session.user.isAdmin) {
            throw new Error("Only administrators can edit articles");
        }

        const found = read().find((item) => item.blogId === blogId);
        if (!found) {
            throw new Error("Blog not found");
        }

        if (found.author.username !== session.user.username) {
            throw new Error("You can only edit your own articles");
        }

        return {
            blogId: found.blogId,
            title: found.title,
            description: found.description,
            content: found.content,
            contentBlocks: found.contentBlocks,
            banner: found.banner,
            images: found.images,
            codeSnippets: found.codeSnippets,
            tags: found.tags,
            draft: false
        };
    },

    async listManageBlogs(): Promise<BlogCard[]> {
        const session = getSession();
        const username = session?.user.username;
        if (!username) {
            return [];
        }
        if (!session.user.isAdmin) {
            return [];
        }
        const source = read();

        const filtered = source.filter((item) => item.author.username === username);

        return filtered
            .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
            .map(toBlogCard);
    },

    async getComments(blogId: string): Promise<CommentItem[]> {
        const found = read().find((item) => item.blogId === blogId);
        return found ? found.comments : [];
    },

    async addComment(blogId: string, comment: string): Promise<void> {
        const articles = read();
        const found = articles.find((item) => item.blogId === blogId);
        if (!found || !comment.trim()) return;

        const session = getSession();
        const displayName = session?.user.fullName || "Guest";
        const username = session?.user.username || "guest";
        const image = session?.user.profileImage || "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=guest";

        found.comments.unshift({
            id: `c-${Date.now()}`,
            comment: comment.trim(),
            commentedAt: new Date().toISOString(),
            user: {
                fullName: displayName,
                username,
                profileImage: image
            }
        });

        found.totalComments = found.comments.length;
        write(articles);
    },

    async getReactions(blogId: string): Promise<{ counts: Record<string, number>; userEmojis: string[] }> {
        const found = read().find((item) => item.blogId === blogId);
        if (!found) return { counts: {}, userEmojis: [] };

        const uid = currentUserId();
        return {
            counts: found.reactions,
            userEmojis: found.userReactions[uid] || []
        };
    },

    async toggleReaction(blogId: string, emoji: string): Promise<{ counts: Record<string, number> }> {
        const articles = read();
        const found = articles.find((item) => item.blogId === blogId);
        if (!found) return { counts: {} };

        const uid = currentUserId();
        const active = found.userReactions[uid] || [];
        const has = active.includes(emoji);

        if (has) {
            found.userReactions[uid] = active.filter((item) => item !== emoji);
            found.reactions[emoji] = Math.max((found.reactions[emoji] || 0) - 1, 0);
        } else {
            found.userReactions[uid] = [...active, emoji];
            found.reactions[emoji] = (found.reactions[emoji] || 0) + 1;
        }

        found.totalReactions = Object.values(found.reactions).reduce((sum, count) => sum + count, 0);
        write(articles);

        return { counts: found.reactions };
    },

    async createBlog(input: BlogEditorPayload): Promise<void> {
        const session = getSession();
        if (!session?.user) {
            throw new Error("Sign in to publish articles");
        }
        if (!session.user.isAdmin) {
            throw new Error("Only administrators can publish articles");
        }

        const author = {
            fullName: session.user.fullName,
            username: session.user.username,
            profileImage: session.user.profileImage
        };

        const tags = input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
        const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-5)}`;
        const normalizedBlocks = input.contentBlocks.filter((block) => {
            if (block.type === "paragraph") return block.text.trim().length > 0;
            if (block.type === "image") return block.src.trim().length > 0;
            return block.code.trim().length > 0;
        });
        const legacy = toLegacyContent(normalizedBlocks);

        const article: MockArticle = {
            blogId: slug || `article-${Date.now()}`,
            title: input.title,
            description: input.description,
            content: legacy.content,
            contentBlocks: normalizedBlocks,
            banner: input.banner,
            images: legacy.images,
            codeSnippets: legacy.codeSnippets,
            tags,
            publishedAt: new Date().toISOString(),
            totalComments: 0,
            totalReactions: 0,
            reads: 0,
            totalReads: 0,
            author,
            comments: [],
            reactions: {},
            userReactions: {}
        };

        const articles = read();
        articles.unshift(article);
        write(articles);
    },

    async updateBlog(blogId: string, input: BlogEditorPayload): Promise<void> {
        const session = getSession();
        if (!session?.user) {
            throw new Error("Sign in to update articles");
        }
        if (!session.user.isAdmin) {
            throw new Error("Only administrators can update articles");
        }

        const articles = read();
        const found = articles.find((item) => item.blogId === blogId);
        if (!found) {
            throw new Error("Blog not found");
        }

        if (found.author.username !== session.user.username) {
            throw new Error("You can only update your own articles");
        }

        const normalizedBlocks = input.contentBlocks.filter((block) => {
            if (block.type === "paragraph") return block.text.trim().length > 0;
            if (block.type === "image") return block.src.trim().length > 0;
            return block.code.trim().length > 0;
        });
        const legacy = toLegacyContent(normalizedBlocks);

        found.title = input.title;
        found.description = input.description;
        found.content = legacy.content;
        found.contentBlocks = normalizedBlocks;
        found.banner = input.banner;
        found.images = legacy.images;
        found.codeSnippets = legacy.codeSnippets;
        found.tags = input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);

        write(articles);
    },

    async deleteBlog(blogId: string): Promise<void> {
        const session = getSession();
        if (!session?.user) {
            throw new Error("Sign in to delete articles");
        }
        if (!session.user.isAdmin) {
            throw new Error("Only administrators can delete articles");
        }

        const articles = read();
        const found = articles.find((item) => item.blogId === blogId);
        if (!found) {
            throw new Error("Blog not found");
        }

        if (found.author.username !== session.user.username) {
            throw new Error("You can only delete your own articles");
        }

        const next = articles.filter((item) => item.blogId !== blogId);
        write(next);
    }
};
