export interface User {
    id: string;
    fullName: string;
    username: string;
    email: string;
    isAdmin: boolean;
    profileImage: string;
}

export interface AuthSession {
    token: string;
    user: User;
}

export interface BlogCard {
    blogId: string;
    title: string;
    description: string;
    tags: string[];
    authorName: string;
    authorUsername: string;
    authorImage: string;
    publishedAt: string;
    totalComments: number;
    totalReactions: number;
    totalReads: number;
}

export interface CodeSnippet {
    language: string;
    code: string;
}

export type ContentBlock =
    | {
        id: string;
        type: "paragraph";
        text: string;
    }
    | {
        id: string;
        type: "image";
        src: string;
        alt: string;
    }
    | {
        id: string;
        type: "code";
        language: string;
        code: string;
    };

export interface BlogDetail {
    blogId: string;
    title: string;
    description: string;
    content: string;
    contentBlocks: ContentBlock[];
    banner: string;
    images: string[];
    codeSnippets: CodeSnippet[];
    tags: string[];
    publishedAt: string;
    totalComments: number;
    totalReactions: number;
    reads: number;
    author: {
        fullName: string;
        username: string;
        profileImage: string;
    };
}

export interface CommentItem {
    id: string;
    comment: string;
    commentedAt: string;
    user: {
        fullName: string;
        username: string;
        profileImage: string;
    };
}

export interface BlogEditorPayload {
    title: string;
    description: string;
    content: string;
    contentBlocks: ContentBlock[];
    banner: string;
    images: string[];
    codeSnippets: CodeSnippet[];
    tags: string[];
    draft: boolean;
}
