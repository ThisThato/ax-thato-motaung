import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import InputBox from "../components/input.component";
import GoogleIcon from "../imgs/google.png";
import AnimationWrapper from "../common/page-animation";
import api from "../common/api";
import { AuthContext } from "../App";
import type { AuthSession } from "../types";

interface UserAuthFormProps {
    type: "sign-in" | "sign-up";
}

const UserAuthForm = ({ type }: UserAuthFormProps) => {
    const [form, setForm] = useState({ fullName: "", email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate();
    const { signIn } = useContext(AuthContext);
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        const idToken = credentialResponse.credential;
        if (!idToken) {
            setError("Google sign-in did not return a token");
            return;
        }

        setError("");
        setGoogleLoading(true);
        try {
            const { data } = await api.post<AuthSession>("/auth/google", { idToken });
            signIn(data);
            navigate("/");
        } catch (requestError: unknown) {
            const message = (requestError as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || "Google authentication failed";
            setError(message);
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);
        try {
            const endpoint = type === "sign-in" ? "/auth/signin" : "/auth/signup";
            const payload = type === "sign-in"
                ? { email: form.email, password: form.password }
                : { fullName: form.fullName, email: form.email, password: form.password };

            const { data } = await api.post<AuthSession>(endpoint, payload);
            signIn(data);
            navigate("/");
        } catch (requestError: unknown) {
            const message = (requestError as { response?: { data?: { error?: string } } })
                ?.response?.data?.error || "Authentication failed";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimationWrapper keyValue={type}>
            <section className="h-cover flex items-center justify-center">
                <form className="w-[80%] max-w-[420px]" onSubmit={handleSubmit}>
                    <h1 className="tex-4xl font-gelasio capitalize text-center mb-12">
                        {type === "sign-in" ? "Welcome back" : "Join us today"}
                    </h1>

                    {type !== "sign-in" ? (
                        <InputBox
                            name="fullName"
                            type="text"
                            placeholder="Full name"
                            icon="fi-rr-user"
                            value={form.fullName}
                            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                        />
                    ) : null}

                    <InputBox
                        name="email"
                        type="email"
                        placeholder="Email"
                        icon="fi-rr-envelope"
                        value={form.email}
                        onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    />

                    <InputBox
                        name="password"
                        type="password"
                        placeholder="Password"
                        icon="fi-rr-key"
                        value={form.password}
                        onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    />

                    <button className="btn-dark center text-center mt-10" type="submit" disabled={loading}>
                        {loading ? "Please wait..." : type.replace("-", " ")}
                    </button>
                    {error ? <p className="text-red text-center mt-4">{error}</p> : null}

                    <div className="relative w-full items-center flex gap-2 my-10 opacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black" />
                        <p>or</p>
                        <hr className="w-1/2 border-black" />
                    </div>

                    {type === "sign-in" ? (
                        googleClientId ? (
                            <div className="w-[90%] center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError("Google authentication failed")}
                                    shape="pill"
                                    width="100%"
                                    text="signin_with"
                                />
                                {googleLoading ? <p className="text-dark-grey text-sm text-center mt-2">Signing you in with Google...</p> : null}
                            </div>
                        ) : (
                            <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center" type="button" disabled>
                                <img src={GoogleIcon} className="w-5" alt="Google" />
                                continue with google
                            </button>
                        )
                    ) : null}

                    {type === "sign-in" ? (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Don&apos;t have an account ?
                            <Link to="/signup" className="underline text-black text-xl ml-1">Join Us today</Link>
                        </p>
                    ) : (
                        <p className="mt-6 text-dark-grey text-xl text-center">
                            Already a member ?
                            <Link to="/signin" className="underline text-black text-xl ml-1">Sign in here</Link>
                        </p>
                    )}
                </form>
            </section>
        </AnimationWrapper>
    );
};

export default UserAuthForm;
