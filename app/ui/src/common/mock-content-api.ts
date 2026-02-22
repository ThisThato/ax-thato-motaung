import { getSession } from "./session";
import type { BlogCard, BlogDetail, CommentItem } from "../types";
import { seedArticles, toBlogCard, type MockArticle } from "../mocks/articles";

const STORAGE_KEY = "apex_blog_mock_articles_v2";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const normalizeArticle = (article: MockArticle): MockArticle => ({
    ...article,
    images: Array.isArray(article.images) ? article.images : [],
    codeSnippets: Array.isArray(article.codeSnippets) ? article.codeSnippets : []
});

const read = (): MockArticle[] => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        const seeded = clone(seedArticles);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
    }

    try {
        const parsed = JSON.parse(raw) as MockArticle[];
        return parsed.map(normalizeArticle);
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

    async createBlog(input: {
        title: string;
        description: string;
        content: string;
        banner: string;
        images: string[];
        codeSnippets: { language: string; code: string }[];
        tags: string[];
        draft: boolean;
    }): Promise<void> {
        const session = getSession();
        const author = {
            fullName: session?.user.fullName || "Apex Admin",
            username: session?.user.username || "apex-owner",
            profileImage: session?.user.profileImage || "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=apex-owner"
        };

        const tags = input.tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
        const slug = `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString().slice(-5)}`;

        const article: MockArticle = {
            blogId: slug || `article-${Date.now()}`,
            title: input.title,
            description: input.description,
            content: input.content,
            banner: input.banner,
            images: input.images,
            codeSnippets: input.codeSnippets,
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
    }
};
