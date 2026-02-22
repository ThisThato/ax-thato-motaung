import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/loader.component";
import type { BlogCard } from "../types";
import { mockContentApi } from "../common/mock-content-api";
import AboutMe from "../components/about-me.component";

const HomePage = () => {
    const [blogs, setBlogs] = useState<BlogCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            try {
                const data = await mockContentApi.listBlogs();
                setBlogs(data);
            } finally {
                setLoading(false);
            }
        };
        void run();
    }, []);

    if (loading) {
        return <Loader />;
    }

    return (
        <section className="max-w-[1600px] mx-auto">
            <h1 className="text-3xl md:text-4xl font-gelasio mb-6 md:mb-8">Latest Articles</h1>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
                <div className="grid gap-6">
                    {blogs.map((blog) => (
                        <article key={blog.blogId} className="border border-grey rounded-xl p-4 md:p-6">
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-dark-grey mb-3">
                                <img src={blog.authorImage} className="w-8 h-8 rounded-full" alt={blog.authorName} />
                                <span>{blog.authorName}</span>
                                <span>·</span>
                                <span>{new Date(blog.publishedAt).toLocaleDateString()}</span>
                            </div>

                            <Link to={`/blogs/${blog.blogId}`}>
                                <h2 className="blog-title mb-3 hover:opacity-80">{blog.title}</h2>
                            </Link>
                            <p className="text-dark-grey mb-4">{blog.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {blog.tags.map((tag) => (
                                    <span key={`${blog.blogId}-${tag}`} className="tag text-sm">{tag}</span>
                                ))}
                            </div>

                            <div className="text-dark-grey flex flex-wrap gap-3 md:gap-4 text-sm">
                                <span>{blog.totalReads} reads</span>
                                <span>{blog.totalComments} comments</span>
                                <span>{blog.totalReactions} reactions</span>
                            </div>
                        </article>
                    ))}
                </div>

                <AboutMe />
            </div>
        </section>
    );
};

export default HomePage;
