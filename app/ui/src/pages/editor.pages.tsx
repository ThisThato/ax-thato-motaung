import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../common/api";
import type { BlogEditorPayload, CodeSnippet, ContentBlock } from "../types";
import BackNav from "../components/back-nav.component";
import CodeSnippetBlock from "../components/code-snippet-block.component";

interface LocalEditorArticle {
    id: string;
    title: string;
    description: string;
    contentBlocks: ContentBlock[];
    banner: string;
    tags: string;
    createdAt: string;
}

interface EditBlogResponse {
    blog: {
        blogId: string;
        title: string;
        description: string;
        content: string;
        contentBlocks: ContentBlock[];
        banner: string;
        tags: string[];
    };
}

const blockId = () => `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const paragraphBlock = (text = ""): ContentBlock => ({
    id: blockId(),
    type: "paragraph",
    text
});

const imageBlock = (src = "", alt = ""): ContentBlock => ({
    id: blockId(),
    type: "image",
    src,
    alt
});

const codeBlock = (language = "csharp", code = ""): ContentBlock => ({
    id: blockId(),
    type: "code",
    language,
    code
});

const fromLegacyContent = (content: string): ContentBlock[] => {
    const paragraphs = content
        .split("\n\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((text) => paragraphBlock(text));

    return paragraphs.length > 0 ? paragraphs : [paragraphBlock("")];
};

const toLegacyFields = (blocks: ContentBlock[]): { content: string; images: string[]; codeSnippets: CodeSnippet[] } => ({
    content: blocks
        .filter((block): block is Extract<ContentBlock, { type: "paragraph" }> => block.type === "paragraph")
        .map((block) => block.text.trim())
        .filter(Boolean)
        .join("\n\n"),
    images: blocks
        .filter((block): block is Extract<ContentBlock, { type: "image" }> => block.type === "image")
        .map((block) => block.src.trim())
        .filter(Boolean),
    codeSnippets: blocks
        .filter((block): block is Extract<ContentBlock, { type: "code" }> => block.type === "code")
        .map((block) => ({ language: block.language.trim().toLowerCase(), code: block.code }))
        .filter((block) => block.code.trim().length > 0)
});

const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
    });
};

const EditorPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editBlogId = searchParams.get("edit");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([paragraphBlock("")]);
    const [banner, setBanner] = useState("");
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [localEditorArticles, setLocalEditorArticles] = useState<LocalEditorArticle[]>([]);

    useEffect(() => {
        const run = async () => {
            if (!editBlogId) return;
            try {
                const { data } = await api.get<EditBlogResponse>(`/blogs/${editBlogId}/edit`);
                const item = data.blog;
                setTitle(item.title);
                setDescription(item.description);
                setContentBlocks(item.contentBlocks.length ? item.contentBlocks : fromLegacyContent(item.content));
                setBanner(item.banner);
                setTags(item.tags.join(", "));
            } catch (requestError: unknown) {
                const message = (requestError as { response?: { data?: { error?: string } } })
                    ?.response?.data?.error || "Unable to load blog for editing";
                setError(message);
            }
        };
        void run();
    }, [editBlogId]);

    const onSelectInlineImage = async (event: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith("image/")) {
            event.target.value = "";
            return;
        }

        const encoded = await readFileAsDataUrl(file);
        setContentBlocks((current) => current.map((block) => {
            if (block.id !== id || block.type !== "image") {
                return block;
            }
            return {
                ...block,
                src: encoded
            };
        }));
        event.target.value = "";
    };

    const updateBlock = (id: string, updater: (block: ContentBlock) => ContentBlock) => {
        setContentBlocks((current) => current.map((block) => (block.id === id ? updater(block) : block)));
    };

    const removeBlock = (id: string) => {
        setContentBlocks((current) => {
            const next = current.filter((block) => block.id !== id);
            return next.length ? next : [paragraphBlock("")];
        });
    };

    const moveBlock = (index: number, direction: -1 | 1) => {
        setContentBlocks((current) => {
            const target = index + direction;
            if (target < 0 || target >= current.length) return current;

            const next = [...current];
            const hold = next[index];
            next[index] = next[target];
            next[target] = hold;
            return next;
        });
    };

    const insertBlock = (index: number, type: ContentBlock["type"]) => {
        const block = type === "paragraph" ? paragraphBlock("") : type === "image" ? imageBlock() : codeBlock();
        setContentBlocks((current) => {
            const next = [...current];
            next.splice(index + 1, 0, block);
            return next;
        });
    };

    const submit = async (draft: boolean) => {
        setError("");
        setLoading(true);
        try {
            const cleanedBlocks = contentBlocks.filter((block) => {
                if (block.type === "paragraph") return block.text.trim().length > 0;
                if (block.type === "image") return block.src.trim().length > 0;
                return block.code.trim().length > 0;
            });

            if (!title.trim()) {
                setError("Add a title before saving");
                setLoading(false);
                return;
            }

            if (cleanedBlocks.length === 0) {
                setError("Add at least one content block before saving");
                setLoading(false);
                return;
            }

            const legacy = toLegacyFields(cleanedBlocks);
            const payload: BlogEditorPayload = {
                title,
                description,
                content: legacy.content,
                contentBlocks: cleanedBlocks,
                banner,
                images: legacy.images,
                codeSnippets: legacy.codeSnippets,
                tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
                draft
            };

            if (editBlogId) {
                await api.put(`/blogs/${editBlogId}`, payload);
            } else {
                await api.post("/blogs", payload);
            }
            navigate("/");
        } catch (requestError: unknown) {
            const directMessage = requestError instanceof Error ? requestError.message : "";
            const message = (requestError as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || directMessage || "Failed to save blog";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const addToEditorSection = () => {
        if (!title.trim() && contentBlocks.every((item) => item.type === "paragraph" && !item.text.trim())) {
            setError("Add at least a title or content before adding to editor section");
            return;
        }

        const item: LocalEditorArticle = {
            id: `local-${Date.now()}`,
            title,
            description,
            contentBlocks,
            banner,
            tags,
            createdAt: new Date().toISOString()
        };

        setLocalEditorArticles((current) => [item, ...current]);
        setError("");
    };

    const loadEditorArticle = (article: LocalEditorArticle) => {
        setTitle(article.title);
        setDescription(article.description);
        setContentBlocks(article.contentBlocks);
        setBanner(article.banner);
        setTags(article.tags);
    };

    const removeEditorArticle = (id: string) => {
        setLocalEditorArticles((current) => current.filter((item) => item.id !== id));
    };

    return (
        <section className="max-w-[1600px] mx-auto">
            <BackNav />
            <h1 className="text-3xl md:text-4xl font-gelasio mb-6 md:mb-8">{editBlogId ? "Edit article" : "Write a new article"}</h1>

            <input className="input-box mb-4 !pl-4" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Blog title" />
            <input className="input-box mb-4 !pl-4" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" />
            <input className="input-box mb-4 !pl-4" value={banner} onChange={(event) => setBanner(event.target.value)} placeholder="Banner URL (optional)" />
            <input className="input-box mb-4 !pl-4" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated): c#, cloud" />

            <div className="border border-grey rounded-lg p-4 mb-4">
                <h3 className="text-2xl mb-2">Article Blocks</h3>
                <p className="text-dark-grey mb-4">Add paragraphs, images, and code blocks in any order.</p>

                <div className="grid gap-4">
                    {contentBlocks.map((block, index) => (
                        <div key={block.id} className="border border-grey rounded-lg p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                <p className="text-sm text-dark-grey capitalize">{block.type} block</p>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="btn-light !text-sm !py-2 !px-3"
                                        onClick={() => moveBlock(index, -1)}
                                        disabled={index === 0}
                                    >
                                        Up
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-light !text-sm !py-2 !px-3"
                                        onClick={() => moveBlock(index, 1)}
                                        disabled={index === contentBlocks.length - 1}
                                    >
                                        Down
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-light !text-sm !py-2 !px-3"
                                        onClick={() => removeBlock(block.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            {block.type === "paragraph" ? (
                                <textarea
                                    value={block.text}
                                    onChange={(event) => updateBlock(block.id, () => ({ ...block, text: event.target.value }))}
                                    className="input-box min-h-40 !pl-4"
                                    placeholder="Write paragraph content"
                                />
                            ) : null}

                            {block.type === "image" ? (
                                <div className="grid gap-3">
                                    <input
                                        className="input-box !pl-4"
                                        value={block.src}
                                        onChange={(event) => updateBlock(block.id, () => ({ ...block, src: event.target.value }))}
                                        placeholder="Image URL"
                                    />
                                    <input
                                        className="input-box !pl-4"
                                        value={block.alt}
                                        onChange={(event) => updateBlock(block.id, () => ({ ...block, alt: event.target.value }))}
                                        placeholder="Image alt text"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => void onSelectInlineImage(event, block.id)}
                                        className="w-full"
                                    />
                                    {block.src ? <img src={block.src} alt={block.alt || "Article image"} className="rounded-lg max-h-72" /> : null}
                                </div>
                            ) : null}

                            {block.type === "code" ? (
                                <div className="grid gap-3">
                                    <select
                                        className="input-box !pl-4"
                                        value={block.language}
                                        onChange={(event) => updateBlock(block.id, () => ({ ...block, language: event.target.value }))}
                                    >
                                        <option value="csharp">C#</option>
                                        <option value="ts">TypeScript</option>
                                        <option value="tsx">TSX</option>
                                        <option value="js">JavaScript</option>
                                        <option value="python">Python</option>
                                        <option value="sql">SQL</option>
                                        <option value="json">JSON</option>
                                        <option value="yaml">YAML</option>
                                        <option value="bash">Bash</option>
                                    </select>
                                    <textarea
                                        value={block.code}
                                        onChange={(event) => updateBlock(block.id, () => ({ ...block, code: event.target.value }))}
                                        className="input-box min-h-48 !pl-4 !font-mono"
                                        placeholder="Paste your code"
                                    />
                                    {block.code.trim() ? <CodeSnippetBlock language={block.language} code={block.code} /> : null}
                                </div>
                            ) : null}

                            <div className="flex flex-wrap gap-2 mt-4">
                                <button type="button" className="btn-light !text-sm !py-2 !px-3" onClick={() => insertBlock(index, "paragraph")}>+ Paragraph</button>
                                <button type="button" className="btn-light !text-sm !py-2 !px-3" onClick={() => insertBlock(index, "image")}>+ Image</button>
                                <button type="button" className="btn-light !text-sm !py-2 !px-3" onClick={() => insertBlock(index, "code")}>+ Code</button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    <button type="button" className="btn-light !text-base !px-4" onClick={() => insertBlock(contentBlocks.length - 1, "paragraph")}>Add paragraph block</button>
                    <button type="button" className="btn-light !text-base !px-4" onClick={() => insertBlock(contentBlocks.length - 1, "image")}>Add image block</button>
                    <button type="button" className="btn-light !text-base !px-4" onClick={() => insertBlock(contentBlocks.length - 1, "code")}>Add code block</button>
                </div>
            </div>

            {error ? <p className="text-red mt-3">{error}</p> : null}

            <div className="flex flex-wrap gap-3 mt-5">
                <button className="btn-light !text-base !px-4" onClick={addToEditorSection} disabled={loading}>Add To Editor Section</button>
                <button className="btn-light !text-base !px-4" onClick={() => void submit(true)} disabled={loading}>Save Draft</button>
                <button className="btn-dark !text-base !px-4" onClick={() => void submit(false)} disabled={loading}>{editBlogId ? "Update" : "Publish"}</button>
            </div>

            <div className="mt-10 border border-grey rounded-xl p-5">
                <h2 className="text-3xl mb-2">Editor Section</h2>
                <p className="text-dark-grey mb-4">Temporary article entries for UI work. These are not saved to storage or server.</p>

                {localEditorArticles.length === 0 ? (
                    <p className="text-dark-grey">No temporary articles yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {localEditorArticles.map((item) => (
                            <div key={item.id} className="border border-grey rounded-lg p-4">
                                <p className="text-dark-grey text-sm mb-2">{new Date(item.createdAt).toLocaleString()}</p>
                                <h3 className="text-2xl font-medium mb-2">{item.title || "Untitled"}</h3>
                                <p className="text-dark-grey mb-2">{item.description || "No description"}</p>
                                <p className="text-dark-grey text-sm mb-3">
                                    {item.contentBlocks.filter((block) => block.type === "image").length} image block(s) • {item.contentBlocks.filter((block) => block.type === "code").length} code block(s)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button className="btn-light !py-2 !text-base !px-4" onClick={() => loadEditorArticle(item)}>Load To Editor</button>
                                    <button className="btn-light !py-2 !text-base !px-4" onClick={() => removeEditorArticle(item.id)}>Remove</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default EditorPage;
