import { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../components/loader.component";
import BackNav from "../components/back-nav.component";
import CodeSnippetBlock from "../components/code-snippet-block.component";
import { AuthContext } from "../App";
import type { BlogCard, BlogDetail, CommentItem } from "../types";
import api from "../common/api";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

interface BlogDetailResponse {
    blog: BlogDetail;
    similarBlogs: Array<Partial<BlogCard> & { blogId: string; title: string; description: string; tags?: string[]; publishedAt: string }>;
}

const BlogPage = () => {
    const { blogId } = useParams();
    const { authUser } = useContext(AuthContext);

    const [blog, setBlog] = useState<BlogDetail | null>(null);
    const [similarBlogs, setSimilarBlogs] = useState<BlogCard[]>([]);
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [userEmojis, setUserEmojis] = useState<string[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loading, setLoading] = useState(true);
    const [copyStatus, setCopyStatus] = useState("");

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = blog ? `${blog.title} — by ${blog.author.fullName}` : "";

    useEffect(() => {
        if (!blogId) return;

        const run = async () => {
            try {
                const [blogRes, commentRes, reactionRes] = await Promise.all([
                    api.get<BlogDetailResponse>(`/blogs/${blogId}`),
                    api.get<{ comments: CommentItem[] }>(`/blogs/${blogId}/comments`),
                    api.get<{ counts: Record<string, number>; userEmojis: string[] }>(`/blogs/${blogId}/reactions`)
                ]);

                setBlog(blogRes.data.blog);
                setSimilarBlogs((blogRes.data.similarBlogs || []).map((item) => ({
                    blogId: item.blogId,
                    title: item.title,
                    description: item.description,
                    tags: item.tags || [],
                    authorName: item.authorName || "",
                    authorUsername: item.authorUsername || "",
                    authorImage: item.authorImage || "",
                    publishedAt: item.publishedAt,
                    totalComments: item.totalComments || 0,
                    totalReactions: item.totalReactions || 0,
                    totalReads: item.totalReads || 0
                })));
                setComments(commentRes.data.comments || []);
                setCounts(reactionRes.data.counts || {});
                setUserEmojis(reactionRes.data.userEmojis || []);
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [blogId]);

    const onToggleReaction = async (emoji: string) => {
        if (!blogId || !authUser) {
            toast.error("Sign in to react to articles");
            return;
        }

        try {
            const { data } = await api.post<{ counts: Record<string, number> }>(`/blogs/${blogId}/reactions`, { emoji });
            const wasActive = userEmojis.includes(emoji);
            setCounts(data.counts || {});

            setUserEmojis((current) => (
                current.includes(emoji)
                    ? current.filter((item) => item !== emoji)
                    : [...current, emoji]
            ));

            toast.success(wasActive ? "Reaction removed" : "Reaction added");
        } catch {
            toast.error("Could not update reaction");
        }
    };

    const onSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!blogId || !commentText.trim()) return;
        if (!authUser) {
            toast.error("Sign in to comment");
            return;
        }

        try {
            await api.post(`/blogs/${blogId}/comments`, { comment: commentText });
            const { data } = await api.get<{ comments: CommentItem[] }>(`/blogs/${blogId}/comments`);
            setComments(data.comments || []);
            setCommentText("");
            toast.success("Comment posted");
        } catch {
            toast.error("Could not post comment");
        }
    };

    if (loading || !blog) {
        return <Loader />;
    }

    const onCopyLink = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopyStatus("Link copied");
            toast.success("Link copied");
            setTimeout(() => setCopyStatus(""), 1800);
        } catch {
            toast.error("Unable to copy link");
        }
    };

    const onNativeShare = async () => {
        if (!("share" in navigator)) return;
        try {
            await navigator.share({ title: blog.title, text: shareText, url: shareUrl });
            toast.success("Shared successfully");
        } catch {
            toast.error("Share was cancelled");
        }
    };

    return (
        <section className="max-w-[1600px] mx-auto">
            <BackNav />
            <div className="max-w-[860px] mx-auto">
                <h1 className="text-3xl md:text-4xl font-gelasio leading-tight mb-5">{blog.title}</h1>

                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-dark-grey mb-8 text-sm md:text-base">
                    <img src={blog.author.profileImage} className="w-10 h-10 rounded-full" alt={blog.author.fullName} />
                    <p>{blog.author.fullName}</p>
                    <span>·</span>
                    <p>{new Date(blog.publishedAt).toLocaleDateString()}</p>
                </div>

                {blog.banner ? <img src={blog.banner} className="rounded-xl mb-8" alt={blog.title} /> : null}
                <p className="text-lg md:text-xl leading-8 mb-6 text-dark-grey">{blog.description}</p>

                <article className="blog-page-content mb-10 grid gap-6">
                    {blog.contentBlocks.length > 0 ? (
                        blog.contentBlocks.map((block) => {
                            if (block.type === "paragraph") {
                                return <p key={block.id} className="whitespace-pre-wrap text-lg leading-8 text-dark-grey">{block.text}</p>;
                            }

                            if (block.type === "image") {
                                return (
                                    <figure key={block.id}>
                                        <img src={block.src} className="rounded-xl" alt={block.alt || blog.title} />
                                    </figure>
                                );
                            }

                            return <CodeSnippetBlock key={block.id} language={block.language} code={block.code} />;
                        })
                    ) : (
                        <p className="whitespace-pre-wrap text-lg leading-8 text-dark-grey">{blog.content}</p>
                    )}
                </article>

                <div className="flex flex-wrap gap-2 mb-8">
                    {blog.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                </div>
            </div>

            <div className="border-y border-grey py-5 mb-8 max-w-[860px] mx-auto">
                <p className="text-dark-grey mb-3">React with emojis</p>
                <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            className={`px-3 py-2 rounded-full border ${userEmojis.includes(emoji) ? "bg-grey border-black" : "border-grey"}`}
                            onClick={() => void onToggleReaction(emoji)}
                            disabled={!authUser}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
                {!authUser ? <p className="text-dark-grey mt-2">Sign in to react.</p> : null}
            </div>

            <div className="border-y border-grey py-5 mb-8 max-w-[860px] mx-auto">
                <p className="text-dark-grey mb-3">Share this article</p>
                <div className="flex flex-wrap gap-2">
                    <button className="btn-light !text-base !px-4" onClick={() => void onCopyLink()}>Copy Link</button>
                    {"share" in navigator ? (
                        <button className="btn-light !text-base !px-4" onClick={() => void onNativeShare()}>Share</button>
                    ) : null}
                    <a
                        className="btn-light !text-base !px-4"
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        LinkedIn
                    </a>
                    <a
                        className="btn-light !text-base !px-4"
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                        target="_blank"
                        rel="noreferrer"
                    >
                        X
                    </a>
                    <a
                        className="btn-light !text-base !px-4"
                        href={`mailto:?subject=${encodeURIComponent(blog.title)}&body=${encodeURIComponent(shareUrl)}`}
                    >
                        Email
                    </a>
                </div>
                {copyStatus ? <p className="text-dark-grey mt-2">{copyStatus}</p> : null}
            </div>

            <div className="mb-10 max-w-[860px] mx-auto">
                <h3 className="text-2xl md:text-3xl mb-4">Comments</h3>
                <form onSubmit={onSubmitComment} className="mb-5">
                    <textarea
                        value={commentText}
                        onChange={(event) => setCommentText(event.target.value)}
                        className="input-box min-h-28 !pl-4"
                        placeholder={authUser ? "Write a comment..." : "Sign in to comment"}
                        disabled={!authUser}
                    />
                    <button type="submit" className="btn-dark mt-3" disabled={!authUser}>Post Comment</button>
                </form>

                <div className="grid gap-4">
                    {comments.map((comment) => (
                        <div key={comment.id} className="border border-grey rounded-lg p-4">
                            <p className="text-dark-grey text-sm mb-2">
                                {comment.user.fullName} · {new Date(comment.commentedAt).toLocaleString()}
                            </p>
                            <p>{comment.comment}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="max-w-[860px] mx-auto">
                <h3 className="text-2xl md:text-3xl mb-4">Similar Topics</h3>
                <div className="grid gap-4">
                    {similarBlogs.map((item) => (
                        <Link key={item.blogId} to={`/blogs/${item.blogId}`} className="border border-grey rounded-lg p-4 block hover:bg-grey/50">
                            <p className="font-medium text-lg md:text-xl">{item.title}</p>
                            <p className="text-dark-grey">{item.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BlogPage;
