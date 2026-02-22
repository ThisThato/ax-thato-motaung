import { createContext, useEffect, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/navbar.component.tsx";
import UserAuthForm from "./pages/userAuthForm.page.tsx";
import HomePage from "./pages/home.page.tsx";
import BlogPage from "./pages/blog.page.tsx";
import EditorPage from "./pages/editor.pages.tsx";
import ManageBlogsPage from "./pages/manage-blogs.page.tsx";
import MePage from "./pages/me.page.tsx";
import NotFoundPage from "./pages/404.page.tsx";
import AdminOnlyRoute from "./components/admin-only-route.component.tsx";
import { clearSession, getSession, setSession } from "./common/session";
import { applyTheme, getPreferredTheme, persistTheme, type ThemeMode } from "./common/theme";
import type { AuthSession, User } from "./types";

interface AuthContextValue {
    authUser: User | null;
    signIn: (session: AuthSession) => void;
    signOut: () => void;
}

interface ThemeContextValue {
    theme: ThemeMode;
    toggleTheme: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
    authUser: null,
    signIn: () => undefined,
    signOut: () => undefined
});

export const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    toggleTheme: () => undefined
});

const App = () => {
    const [authUser, setAuthUser] = useState<User | null>(getSession()?.user ?? null);
    const [theme, setTheme] = useState<ThemeMode>(() => getPreferredTheme());

    useEffect(() => {
        applyTheme(theme);
        persistTheme(theme);
    }, [theme]);

    const authValue = useMemo<AuthContextValue>(() => ({
        authUser,
        signIn: (session) => {
            setSession(session);
            setAuthUser(session.user);
        },
        signOut: () => {
            clearSession();
            setAuthUser(null);
        }
    }), [authUser]);

    const themeValue = useMemo<ThemeContextValue>(() => ({
        theme,
        toggleTheme: () => {
            setTheme((current) => (current === "light" ? "dark" : "light"));
        }
    }), [theme]);

    return (
        <ThemeContext.Provider value={themeValue}>
            <AuthContext.Provider value={authValue}>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: theme === "dark" ? "#1a1a1d" : "#ffffff",
                            color: theme === "dark" ? "#f3f3f3" : "#242424",
                            border: theme === "dark" ? "1px solid #2d2d30" : "1px solid #e9e9e9"
                        }
                    }}
                />
                <Routes>
                    <Route path="/" element={<Navbar />}>
                        <Route index element={<HomePage />} />
                        <Route path="blogs/:blogId" element={<BlogPage />} />
                        <Route path="editor" element={<AdminOnlyRoute><EditorPage /></AdminOnlyRoute>} />
                        <Route path="manage-blogs" element={<AdminOnlyRoute><ManageBlogsPage /></AdminOnlyRoute>} />
                        <Route path="me" element={<AdminOnlyRoute><MePage /></AdminOnlyRoute>} />
                        <Route path="signin" element={<UserAuthForm type="sign-in" />} />
                        <Route path="signup" element={<UserAuthForm type="sign-up" />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </AuthContext.Provider>
        </ThemeContext.Provider>
    );
};

export default App;
