import { useContext, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { AuthContext } from "../App";
import Loader from "../components/loader.component";
import BackNav from "../components/back-nav.component";
import { mockContentApi } from "../common/mock-content-api";
import type { BlogCard } from "../types";

const MePage = () => {
    const { authUser } = useContext(AuthContext);
    const [blogs, setBlogs] = useState<BlogCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            try {
                const mine = await mockContentApi.listManageBlogs();
                setBlogs(mine);
            } finally {
                setLoading(false);
            }
        };

        if (authUser) {
            void run();
        }
    }, [authUser]);

    if (!authUser) {
        return <Navigate to="/signin" replace />;
    }

    if (loading) {
        return <Loader />;
    }

    return (
        <section className="max-w-[1200px] mx-auto">
            <BackNav />

            <div className="border border-grey rounded-xl p-5 md:p-6 mb-6">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                    <img src={authUser.profileImage} alt={authUser.fullName} className="w-12 h-12 rounded-full" />
                    <div>
                        <h1 className="text-3xl font-gelasio">Welcome, {authUser.fullName}</h1>
                        <p className="text-dark-grey">@{authUser.username}</p>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    <div className="border border-grey rounded-lg p-4">
                        <p className="text-dark-grey text-sm">Articles</p>
                        <p className="text-2xl font-medium">{blogs.length}</p>
                    </div>
                </div>
            </div>

            <div className="border border-grey rounded-xl p-5 md:p-6">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                    <h2 className="text-2xl font-gelasio">Your recent articles</h2>
                    <div className="flex gap-2">
                        <Link className="btn-light !text-base !px-4" to="/manage-blogs">Manage</Link>
                        <Link className="btn-dark !text-base !px-4" to="/editor">Write new</Link>
                    </div>
                </div>

                {blogs.length === 0 ? (
                    <div className="border border-grey rounded-lg p-4">
                        <p className="text-dark-grey mb-3">You have not published an article yet.</p>
                        <Link className="btn-dark !text-base !px-4" to="/editor">Create first article</Link>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {blogs.slice(0, 5).map((blog) => (
                            <article key={blog.blogId} className="border border-grey rounded-lg p-4">
                                <Link to={`/blogs/${blog.blogId}`}>
                                    <h3 className="text-xl font-medium mb-2 hover:opacity-80">{blog.title}</h3>
                                </Link>
                                <p className="text-dark-grey mb-3">{blog.description}</p>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default MePage;
