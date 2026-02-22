import { createContext, useMemo, useState } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/navbar.component.tsx";
import UserAuthForm from "./pages/userAuthForm.page.tsx";
import HomePage from "./pages/home.page.tsx";
import BlogPage from "./pages/blog.page.tsx";
import EditorPage from "./pages/editor.pages.tsx";
import NotFoundPage from "./pages/404.page.tsx";
import { clearSession, getSession, setSession } from "./common/session";
import type { AuthSession, User } from "./types";

interface AuthContextValue {
    authUser: User | null;
    signIn: (session: AuthSession) => void;
    signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
    authUser: null,
    signIn: () => undefined,
    signOut: () => undefined
});

const App = () => {
    const [authUser, setAuthUser] = useState<User | null>(getSession()?.user ?? null);

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

    return (
        <AuthContext.Provider value={authValue}>
            <Routes>
                <Route path="/" element={<Navbar />}>
                    <Route index element={<HomePage />} />
                    <Route path="blogs/:blogId" element={<BlogPage />} />
                    <Route path="editor" element={<EditorPage />} />
                    <Route path="signin" element={<UserAuthForm type="sign-in" />} />
                    <Route path="signup" element={<UserAuthForm type="sign-up" />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </AuthContext.Provider>
    );
};

export default App;
