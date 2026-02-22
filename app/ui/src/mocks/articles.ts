import type { BlogCard, BlogDetail, CommentItem } from "../types";

export interface MockArticle extends BlogDetail {
    totalReads: number;
    comments: CommentItem[];
    reactions: Record<string, number>;
    userReactions: Record<string, string[]>;
}

const now = new Date();

const makeDate = (daysAgo: number) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

export const seedArticles: MockArticle[] = [
    {
        blogId: "solid-principles-csharp-101",
        title: "SOLID Principles in C# with Practical Examples",
        description: "A practical walk-through of SOLID principles using small C# code examples you can apply in real projects.",
        content: "SOLID is a set of design principles that helps make software easier to maintain and evolve.\n\n- Single Responsibility Principle\n- Open/Closed Principle\n- Liskov Substitution Principle\n- Interface Segregation Principle\n- Dependency Inversion Principle\n\nIn C#, these principles usually become visible in how we shape interfaces, services, and dependency injection boundaries.",
        banner: "",
        images: [
            "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
            "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1400&q=80"
        ],
        codeSnippets: [
            {
                language: "csharp",
                code: "public interface INotifier\n{\n    Task SendAsync(string message);\n}\n\npublic sealed class OrderService\n{\n    private readonly INotifier _notifier;\n\n    public OrderService(INotifier notifier)\n    {\n        _notifier = notifier;\n    }\n}"
            }
        ],
        tags: ["c#", "architecture", "backend"],
        publishedAt: makeDate(1),
        totalComments: 2,
        totalReactions: 12,
        reads: 94,
        totalReads: 94,
        author: {
            fullName: "Apex Admin",
            username: "apex-owner",
            profileImage: "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=apex-owner"
        },
        comments: [
            {
                id: "c1",
                comment: "Great explanation of DIP.",
                commentedAt: makeDate(0),
                user: {
                    fullName: "Thabo M",
                    username: "thabo",
                    profileImage: "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=thabo"
                }
            },
            {
                id: "c2",
                comment: "Would love a follow-up on clean architecture.",
                commentedAt: makeDate(0),
                user: {
                    fullName: "Neo K",
                    username: "neo",
                    profileImage: "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=neo"
                }
            }
        ],
        reactions: { "👍": 6, "🔥": 4, "👏": 2 },
        userReactions: {}
    },
    {
        blogId: "cloud-deployment-azure-dotnet",
        title: "Deploying .NET APIs to the Cloud: Practical Checklist",
        description: "A concise deployment checklist for shipping reliable .NET APIs in cloud environments.",
        content: "Cloud deployment succeeds when you design for observability, failure, and repeatability.\n\nStart with health checks, centralized logs, config separation, and CI/CD pipelines.\n\nThen validate scaling and graceful shutdown behavior before production rollout.",
        banner: "",
        images: [
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80"
        ],
        codeSnippets: [
            {
                language: "yaml",
                code: "healthChecks:\n  - path: /health\n    intervalSeconds: 30\n\nresources:\n  requests:\n    cpu: \"250m\"\n    memory: \"256Mi\""
            }
        ],
        tags: ["cloud", "devops", "c#"],
        publishedAt: makeDate(3),
        totalComments: 1,
        totalReactions: 8,
        reads: 76,
        totalReads: 76,
        author: {
            fullName: "Apex Admin",
            username: "apex-owner",
            profileImage: "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=apex-owner"
        },
        comments: [
            {
                id: "c3",
                comment: "This helped us fix readiness probes.",
                commentedAt: makeDate(1),
                user: {
                    fullName: "Lele M",
                    username: "lele",
                    profileImage: "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=lele"
                }
            }
        ],
        reactions: { "🎉": 3, "👍": 5 },
        userReactions: {}
    },
    {
        blogId: "frontend-performance-react-patterns",
        title: "React Performance Patterns That Actually Matter",
        description: "Focus on measurable React optimizations: rendering boundaries, memoization, and payload control.",
        content: "Optimize where users feel latency first: route transitions, large lists, and expensive client transforms.\n\nMeasure before and after each change using browser profiling.",
        banner: "",
        images: [
            "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80"
        ],
        codeSnippets: [
            {
                language: "tsx",
                code: "const Chart = React.memo(function Chart({ points }: { points: number[] }) {\n  return <canvas data-points={points.length} />;\n});"
            }
        ],
        tags: ["react", "frontend", "performance"],
        publishedAt: makeDate(5),
        totalComments: 0,
        totalReactions: 5,
        reads: 58,
        totalReads: 58,
        author: {
            fullName: "Apex Admin",
            username: "apex-owner",
            profileImage: "https://api.dicebear.com/6.x/notionists-neutral/svg?seed=apex-owner"
        },
        comments: [],
        reactions: { "👏": 2, "❤️": 3 },
        userReactions: {}
    }
];

export const toBlogCard = (article: MockArticle): BlogCard => ({
    blogId: article.blogId,
    title: article.title,
    description: article.description,
    tags: article.tags,
    authorName: article.author.fullName,
    authorUsername: article.author.username,
    authorImage: article.author.profileImage,
    publishedAt: article.publishedAt,
    totalComments: article.comments.length,
    totalReactions: Object.values(article.reactions).reduce((sum, count) => sum + count, 0),
    totalReads: article.totalReads
});
