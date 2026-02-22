import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Loader from "../components/loader.component";
import type { BlogCard } from "../types";
import { mockContentApi } from "../common/mock-content-api";
import AboutMe from "../components/about-me.component";

type FeedTab = "latest" | "trending" | "picks";

const FEED_BATCH_SIZE = 6;

const tabLabels: Record<FeedTab, string> = {
    latest: "Latest",
    trending: "Trending",
    picks: "Editor's Picks"
};

const isFeedTab = (value: string | null): value is FeedTab => value === "latest" || value === "trending" || value === "picks";

const formatDate = (dateText: string) => new Date(dateText).toLocaleDateString();

const computeScore = (blog: BlogCard) => (blog.totalReads * 2) + (blog.totalComments * 3) + (blog.totalReactions * 4);

const sortForTab = (blogs: BlogCard[], tab: FeedTab): BlogCard[] => {
    if (tab === "latest") {
        return [...blogs].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
    }

    if (tab === "trending") {
        const ordered = [...blogs].sort((a, b) => computeScore(b) - computeScore(a));
        const latest = [...blogs].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
        const classic = latest[Math.min(6, Math.max(latest.length - 1, 0))];
        if (!classic) {
            return ordered;
        }

        const withoutClassic = ordered.filter((item) => item.blogId !== classic.blogId);
        const top = withoutClassic.slice(0, 2);
        return [...top, classic, ...withoutClassic.slice(2)];
    }

    return [...blogs].sort((a, b) => {
        if (b.totalComments !== a.totalComments) {
            return b.totalComments - a.totalComments;
        }
        return b.totalReactions - a.totalReactions;
    });
};

const HomePage = () => {
    const [blogs, setBlogs] = useState<BlogCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(FEED_BATCH_SIZE);
    const [searchParams, setSearchParams] = useSearchParams();
    const location = useLocation();

    const selectedTab: FeedTab = isFeedTab(searchParams.get("tab")) ? (searchParams.get("tab") as FeedTab) : "latest";
    const query = (searchParams.get("q") || "").trim();
    const activeTag = (searchParams.get("tag") || "").trim().toLowerCase();
    const isAllResultsMode = searchParams.get("view") === "all";

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

    useEffect(() => {
        const restoreY = (location.state as { scrollY?: number } | null)?.scrollY;
        if (typeof restoreY === "number") {
            requestAnimationFrame(() => {
                window.scrollTo({ top: restoreY });
            });
        }
    }, [location.key, location.state]);

    useEffect(() => {
        setVisibleCount(FEED_BATCH_SIZE);
    }, [selectedTab, query, activeTag]);

    const allTags = useMemo(() => {
        const unique = new Set<string>();
        blogs.forEach((blog) => {
            blog.tags.forEach((tag) => unique.add(tag.toLowerCase()));
        });
        return [...unique].sort((a, b) => a.localeCompare(b));
    }, [blogs]);

    const featured = useMemo(() => {
        const sorted = sortForTab(blogs, "trending");
        return sorted[0] || null;
    }, [blogs]);

    const filtered = useMemo(() => {
        const sorted = sortForTab(blogs, selectedTab);

        return sorted.filter((blog) => {
            const matchesTag = !activeTag || blog.tags.some((tag) => tag.toLowerCase() === activeTag);
            const matchesQuery = !query
                || blog.title.toLowerCase().includes(query.toLowerCase())
                || blog.description.toLowerCase().includes(query.toLowerCase())
                || blog.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

            return matchesTag && matchesQuery;
        });
    }, [blogs, selectedTab, query, activeTag]);

    const visibleBlogs = isAllResultsMode ? filtered : filtered.slice(0, visibleCount);
    const canLoadMore = !isAllResultsMode && visibleCount < filtered.length;

    const showAllResults = () => {
        const current = new URLSearchParams(searchParams);
        current.set("view", "all");
        setSearchParams(current, { replace: true });
    };

    const showCuratedFeed = () => {
        const current = new URLSearchParams(searchParams);
        current.delete("view");
        setSearchParams(current, { replace: true });
        setVisibleCount(FEED_BATCH_SIZE);
    };

    const updateParams = (next: { tab?: FeedTab; q?: string; tag?: string }) => {
        const current = new URLSearchParams(searchParams);

        if (typeof next.tab !== "undefined") {
            current.set("tab", next.tab);
        }
        if (typeof next.q !== "undefined") {
            if (next.q.trim()) {
                current.set("q", next.q.trim());
            } else {
                current.delete("q");
            }
        }
        if (typeof next.tag !== "undefined") {
            if (next.tag.trim()) {
                current.set("tag", next.tag.trim().toLowerCase());
            } else {
                current.delete("tag");
            }
        }

        setSearchParams(current, { replace: true });
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <section className="max-w-[1600px] mx-auto grid gap-6 md:gap-8">
            {featured ? (
                <header className="border border-grey rounded-xl p-5 md:p-7">
                    <article className="border border-grey rounded-xl p-4 md:p-5">
                        <p className="text-sm text-dark-grey mb-2">Featured Article</p>
                        <Link
                            to={`/blogs/${featured.blogId}`}
                            state={{ scrollY: window.scrollY }}
                            className="block"
                        >
                            <h2 className="text-2xl font-gelasio mb-2 hover:opacity-80">{featured.title}</h2>
                        </Link>
                        <p className="text-dark-grey mb-3">{featured.description}</p>
                        <div className="flex items-center gap-2 text-sm text-dark-grey">
                            <img src={featured.authorImage} className="w-7 h-7 rounded-full" alt={featured.authorName} />
                            <span>{featured.authorName}</span>
                            <span>·</span>
                            <span>{formatDate(featured.publishedAt)}</span>
                        </div>
                    </article>
                </header>
            ) : null}

            <section className="border border-grey rounded-xl p-4 md:p-5 grid gap-4" aria-label="Discover articles">
                <div className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <input
                        type="search"
                        className="input-box"
                        value={query}
                        onChange={(event) => updateParams({ q: event.target.value })}
                        placeholder="Search by title, description or topic"
                        aria-label="Search articles"
                    />
                    <div className="flex gap-2 overflow-x-auto">
                        {(Object.keys(tabLabels) as FeedTab[]).map((tab) => (
                            <button
                                key={tab}
                                type="button"
                                className={selectedTab === tab ? "btn-dark px-4 py-2 whitespace-nowrap" : "btn-light px-4 py-2 whitespace-nowrap"}
                                onClick={() => updateParams({ tab })}
                            >
                                {tabLabels[tab]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => updateParams({ tag: "" })}
                        className={!activeTag ? "tag bg-black text-white" : "tag"}
                    >
                        All Topics
                    </button>
                    {allTags.map((tag) => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => updateParams({ tag })}
                            className={activeTag === tag ? "tag bg-black text-white" : "tag"}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </section>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start" id="home-feed">
                <div className="grid gap-5">
                    {visibleBlogs.length ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            {visibleBlogs.map((blog) => (
                                <article key={blog.blogId} className="border border-grey rounded-xl p-4 md:p-5 h-full">
                                    <div className="flex flex-wrap items-center gap-2 text-dark-grey mb-3 text-sm">
                                        <img src={blog.authorImage} className="w-7 h-7 rounded-full" alt={blog.authorName} />
                                        <span>{blog.authorName}</span>
                                        <span>·</span>
                                        <span>{formatDate(blog.publishedAt)}</span>
                                    </div>

                                    <Link to={`/blogs/${blog.blogId}`} state={{ scrollY: window.scrollY }}>
                                        <h2 className="blog-title mb-2 hover:opacity-80">{blog.title}</h2>
                                    </Link>
                                    <p className="text-dark-grey mb-3">{blog.description}</p>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {blog.tags.map((tag) => (
                                            <button
                                                key={`${blog.blogId}-${tag}`}
                                                type="button"
                                                className="tag text-sm"
                                                onClick={() => updateParams({ tag: tag.toLowerCase() })}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-grey rounded-xl p-5 md:p-6 text-center grid gap-3">
                            <h2 className="text-2xl font-gelasio">No articles match your filters</h2>
                            <p className="text-dark-grey">Try a different search or clear the topic and feed filters.</p>
                            <div>
                                <button
                                    type="button"
                                    className="btn-light px-4 py-2"
                                    onClick={() => {
                                        const next = new URLSearchParams();
                                        next.set("tab", "latest");
                                        setSearchParams(next, { replace: true });
                                    }}
                                >
                                    Clear filters
                                </button>
                            </div>
                        </div>
                    )}

                    {canLoadMore ? (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                className="btn-light px-6 py-2"
                                onClick={() => setVisibleCount((count) => count + FEED_BATCH_SIZE)}
                            >
                                Load more articles
                            </button>
                        </div>
                    ) : null}

                    <div className="border border-grey rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-3">
                        {isAllResultsMode ? (
                            <>
                                <p className="text-dark-grey">Showing all matching articles ({filtered.length})</p>
                                <button
                                    type="button"
                                    className="btn-light px-4 py-2"
                                    onClick={showCuratedFeed}
                                >
                                    Back to curated feed
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-dark-grey">Want everything in one place?</p>
                                <button
                                    type="button"
                                    className="btn-light px-4 py-2"
                                    onClick={showAllResults}
                                >
                                    View all results ({filtered.length})
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <AboutMe />
            </div>
        </section>
    );
};

export default HomePage;
