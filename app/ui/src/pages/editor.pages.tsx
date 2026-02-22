import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockContentApi } from "../common/mock-content-api";
import type { CodeSnippet } from "../types";

interface LocalEditorArticle {
    id: string;
    title: string;
    description: string;
    content: string;
    banner: string;
    images: string[];
    codeSnippets: CodeSnippet[];
    tags: string;
    createdAt: string;
}

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
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [banner, setBanner] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([]);
    const [snippetLanguage, setSnippetLanguage] = useState("csharp");
    const [snippetCode, setSnippetCode] = useState("");
    const [tags, setTags] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [localEditorArticles, setLocalEditorArticles] = useState<LocalEditorArticle[]>([]);

    const onSelectImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
        const encoded = await Promise.all(selected.map(readFileAsDataUrl));
        setImages((current) => [...current, ...encoded].slice(0, 8));
        event.target.value = "";
    };

    const addSnippet = () => {
        if (!snippetCode.trim()) return;
        setCodeSnippets((current) => [
            ...current,
            { language: snippetLanguage.trim().toLowerCase(), code: snippetCode }
        ]);
        setSnippetCode("");
    };

    const submit = async (draft: boolean) => {
        setError("");
        setLoading(true);
        try {
            await mockContentApi.createBlog({
                title,
                description,
                content,
                banner,
                images,
                codeSnippets,
                tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
                draft
            });
            navigate("/");
        } catch (requestError: unknown) {
            const message = (requestError as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || "Failed to save blog";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const addToEditorSection = () => {
        if (!title.trim() && !content.trim()) {
            setError("Add at least a title or content before adding to editor section");
            return;
        }

        const item: LocalEditorArticle = {
            id: `local-${Date.now()}`,
            title,
            description,
            content,
            banner,
            images,
            codeSnippets,
            tags,
            createdAt: new Date().toISOString()
        };

        setLocalEditorArticles((current) => [item, ...current]);
        setError("");
    };

    const loadEditorArticle = (article: LocalEditorArticle) => {
        setTitle(article.title);
        setDescription(article.description);
        setContent(article.content);
        setBanner(article.banner);
        setImages(article.images);
        setCodeSnippets(article.codeSnippets);
        setTags(article.tags);
    };

    const removeEditorArticle = (id: string) => {
        setLocalEditorArticles((current) => current.filter((item) => item.id !== id));
    };

    return (
        <section className="max-w-[1600px] mx-auto">
            <h1 className="text-3xl md:text-4xl font-gelasio mb-6 md:mb-8">Write a new article</h1>

            <input className="input-box mb-4 !pl-4" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Blog title" />
            <input className="input-box mb-4 !pl-4" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Short description" />
            <input className="input-box mb-4 !pl-4" value={banner} onChange={(event) => setBanner(event.target.value)} placeholder="Banner URL (optional)" />
            <div className="mb-4">
                <label className="block mb-2 text-dark-grey">Add article pictures</label>
                <input type="file" accept="image/*" multiple onChange={onSelectImages} className="w-full" />
            </div>
            {images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {images.map((src, index) => (
                        <div key={`${src.slice(0, 20)}-${index}`} className="border border-grey rounded-lg p-2">
                            <img src={src} alt={`Upload ${index + 1}`} className="rounded-md h-28" />
                            <button
                                className="btn-light w-full mt-2 !text-sm !py-2"
                                onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}
            <input className="input-box mb-4 !pl-4" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Tags (comma separated): c#, cloud" />

            <div className="border border-grey rounded-lg p-4 mb-4">
                <h3 className="text-2xl mb-3">Code Snippets</h3>
                <div className="flex gap-3 mb-3">
                    <select
                        className="input-box !pl-4"
                        value={snippetLanguage}
                        onChange={(event) => setSnippetLanguage(event.target.value)}
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
                </div>
                <textarea
                    value={snippetCode}
                    onChange={(event) => setSnippetCode(event.target.value)}
                    className="input-box min-h-40 !pl-4 !font-mono"
                    placeholder="Paste your code snippet"
                />
                <button className="btn-light mt-3 !text-base !px-4" onClick={addSnippet}>Add Snippet</button>

                {codeSnippets.length > 0 ? (
                    <div className="grid gap-3 mt-4">
                        {codeSnippets.map((snippet, index) => (
                            <div key={`${snippet.language}-${index}`} className="border border-grey rounded-lg p-3">
                                <p className="text-dark-grey mb-2">Language: {snippet.language}</p>
                                <pre className="bg-grey p-3 rounded-md overflow-auto text-sm"><code>{snippet.code}</code></pre>
                                <button
                                    className="btn-light mt-2 !text-sm !py-2"
                                    onClick={() => setCodeSnippets((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="input-box min-h-72 !pl-4"
                placeholder="Write your article content"
            />

            {error ? <p className="text-red mt-3">{error}</p> : null}

            <div className="flex flex-wrap gap-3 mt-5">
                <button className="btn-light !text-base !px-4" onClick={addToEditorSection} disabled={loading}>Add To Editor Section</button>
                <button className="btn-light !text-base !px-4" onClick={() => void submit(true)} disabled={loading}>Save Draft</button>
                <button className="btn-dark !text-base !px-4" onClick={() => void submit(false)} disabled={loading}>Publish</button>
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
                                    {item.images.length} image(s) • {item.codeSnippets.length} snippet(s)
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
