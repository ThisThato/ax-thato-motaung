import type { AuthSession } from "../types";

const SESSION_KEY = "apex_blog_auth";

export const getSession = (): AuthSession | null => {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
        return null;
    }
};

export const setSession = (session: AuthSession): void => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
    localStorage.removeItem(SESSION_KEY);
};
