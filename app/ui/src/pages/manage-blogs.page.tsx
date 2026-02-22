import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../common/api";
import type { BlogCard } from "../types";
import Loader from "../components/loader.component";
import BackNav from "../components/back-nav.component";

const ManageBlogsPage = () => {
    const [blogs, setBlogs] = useState<BlogCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get<{ blogs: BlogCard[] }>("/blogs/mine");
            setBlogs(data.blogs || []);
        } catch (requestError: unknown) {
            const message = (requestError as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || (requestError instanceof Error ? requestError.message : "Failed to load blogs");
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const onDelete = async (blogId: string) => {
        const accepted = window.confirm("Delete this article?");
        if (!accepted) return;
        try {
            await api.delete(`/blogs/${blogId}`);
            await load();
        } catch (requestError: unknown) {
            const message = (requestError as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || (requestError instanceof Error ? requestError.message : "Failed to delete blog");
            setError(message);
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <section className="max-w-[1600px] mx-auto">
            <BackNav />
            <h1 className="text-3xl md:text-4xl font-gelasio mb-6">Manage Blogs</h1>
            {error ? <p className="text-red mb-4">{error}</p> : null}

            {blogs.length === 0 ? (
                <p className="text-dark-grey">No blogs available yet.</p>
            ) : (
                <div className="grid gap-4">
                    {blogs.map((blog) => (
                        <article key={blog.blogId} className="border border-grey rounded-xl p-4 md:p-6">
                            <h2 className="text-xl md:text-2xl font-medium mb-2">{blog.title}</h2>
                            <p className="text-dark-grey mb-4">{blog.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {blog.tags.map((tag) => (
                                    <span key={`${blog.blogId}-${tag}`} className="tag text-sm">{tag}</span>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Link className="btn-light !text-base !px-4" to={`/editor?edit=${blog.blogId}`}>Edit</Link>
                                <button className="btn-light !text-base !px-4" onClick={() => void onDelete(blog.blogId)}>Delete</button>
                                <Link className="btn-dark !text-base !px-4" to={`/blogs/${blog.blogId}`}>Open</Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
};

export default ManageBlogsPage;
