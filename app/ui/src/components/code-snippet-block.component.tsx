import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import hljs from "highlight.js/lib/core";
import csharp from "highlight.js/lib/languages/csharp";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import yaml from "highlight.js/lib/languages/yaml";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";

hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("tsx", typescript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("html", xml);

interface CodeSnippetBlockProps {
    language: string;
    code: string;
    className?: string;
}

const toSupportedLanguage = (input: string): string => {
    const normalized = input.trim().toLowerCase();
    if (normalized === "c#") return "csharp";
    return normalized;
};

const CodeSnippetBlock = ({ language, code, className = "" }: CodeSnippetBlockProps) => {
    const [copied, setCopied] = useState(false);

    const renderedCode = useMemo(() => {
        const selectedLanguage = toSupportedLanguage(language);
        if (selectedLanguage && hljs.getLanguage(selectedLanguage)) {
            return hljs.highlight(code, { language: selectedLanguage }).value;
        }
        return hljs.highlightAuto(code).value;
    }, [language, code]);

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            toast.success("Code copied");
            setTimeout(() => setCopied(false), 1500);
        } catch {
            toast.error("Could not copy code");
        }
    };

    return (
        <div className={`border border-grey rounded-lg overflow-hidden ${className}`}>
            <div className="bg-grey px-4 py-2 text-dark-grey text-sm flex items-center justify-between gap-3">
                <span>{language}</span>
                <button
                    type="button"
                    className="btn-light !text-sm !py-1.5 !px-3"
                    onClick={() => void onCopy()}
                >
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            <pre className="p-4 overflow-auto text-xs font-mono leading-5 bg-black">
                <code className="hljs" dangerouslySetInnerHTML={{ __html: renderedCode }} />
            </pre>
        </div>
    );
};

export default CodeSnippetBlock;
