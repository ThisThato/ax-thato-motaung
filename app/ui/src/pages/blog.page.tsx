import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/loader.component";
import { AuthContext } from "../App";
import type { BlogCard, BlogDetail, CommentItem } from "../types";
import { mockContentApi } from "../common/mock-content-api";

const EMOJIS = ["👍", "❤️", "😂", "🎉", "🔥", "👏"];

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

    const totalReactions = useMemo(() => Object.values(counts).reduce((sum, count) => sum + count, 0), [counts]);

    useEffect(() => {
        if (!blogId) return;

        const run = async () => {
            try {
                const [blogRes, commentRes, reactionRes] = await Promise.all([
                    mockContentApi.getBlog(blogId),
                    mockContentApi.getComments(blogId),
                    mockContentApi.getReactions(blogId)
                ]);

                setBlog(blogRes.blog);
                setSimilarBlogs(blogRes.similarBlogs);
                setComments(commentRes);
                setCounts(reactionRes.counts || {});
                setUserEmojis(reactionRes.userEmojis || []);
            } finally {
                setLoading(false);
            }
        };

        void run();
    }, [blogId]);

    const onToggleReaction = async (emoji: string) => {
        if (!blogId || !authUser) return;
        const data = await mockContentApi.toggleReaction(blogId, emoji);
        setCounts(data.counts || {});

        setUserEmojis((current) => (
            current.includes(emoji)
                ? current.filter((item) => item !== emoji)
                : [...current, emoji]
        ));
    };

    const onSubmitComment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!blogId || !commentText.trim()) return;

        await mockContentApi.addComment(blogId, commentText);
        const data = await mockContentApi.getComments(blogId);
        setComments(data);
        setCommentText("");
    };

    if (loading || !blog) {
        return <Loader />;
    }

    return (
        <section className="max-w-[1600px] mx-auto">
            <h1 className="text-4xl md:text-5xl font-gelasio leading-tight mb-6">{blog.title}</h1>

            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-dark-grey mb-8">
                <img src={blog.author.profileImage} className="w-10 h-10 rounded-full" alt={blog.author.fullName} />
                <p>{blog.author.fullName}</p>
                <span>·</span>
                <p>{new Date(blog.publishedAt).toLocaleDateString()}</p>
            </div>

            {blog.banner ? <img src={blog.banner} className="rounded-xl mb-8" alt={blog.title} /> : null}
            {blog.images.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 mb-8">
                    {blog.images.map((image, index) => (
                        <img key={`${image.slice(0, 20)}-${index}`} src={image} className="rounded-xl" alt={`${blog.title} visual ${index + 1}`} />
                    ))}
                </div>
            ) : null}
            <p className="text-xl md:text-2xl leading-8 md:leading-10 mb-6">{blog.description}</p>
            {blog.codeSnippets.length > 0 ? (
                <div className="grid gap-4 mb-8">
                    {blog.codeSnippets.map((snippet, index) => (
                        <div key={`${snippet.language}-${index}`} className="border border-grey rounded-lg overflow-hidden">
                            <div className="bg-grey px-4 py-2 text-dark-grey text-sm">{snippet.language}</div>
                            <pre className="p-4 overflow-auto text-sm bg-black text-white"><code>{snippet.code}</code></pre>
                        </div>
                    ))}
                </div>
            ) : null}
            <article className="blog-page-content whitespace-pre-wrap mb-10">{blog.content}</article>

            <div className="flex flex-wrap gap-2 mb-8">
                {blog.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
            </div>

            <div className="border-y border-grey py-5 mb-8">
                <p className="text-dark-grey mb-3">React with emojis ({totalReactions})</p>
                <div className="flex flex-wrap gap-2">
                    {EMOJIS.map((emoji) => (
                        <button
                            key={emoji}
                            className={`px-3 py-2 rounded-full border ${userEmojis.includes(emoji) ? "bg-grey border-black" : "border-grey"}`}
                            onClick={() => void onToggleReaction(emoji)}
                            disabled={!authUser}
                        >
                            {emoji} {counts[emoji] || 0}
                        </button>
                    ))}
                </div>
                {!authUser ? <p className="text-dark-grey mt-2">Sign in to react.</p> : null}
            </div>

            <div className="mb-10">
                <h3 className="text-2xl md:text-3xl mb-4">Comments ({comments.length})</h3>
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

            <div>
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
