import { useContext, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import logo from "../imgs/logo.png";
import { AuthContext, ThemeContext } from "../App";

const Navbar = () => {
    const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { authUser, signOut } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setSearchQuery(params.get("q") || "");
    }, [location.search]);

    const runSearch = () => {
        const query = searchQuery.trim();
        const params = new URLSearchParams();
        params.set("tab", "latest");
        if (query) {
            params.set("q", query);
        }

        navigate(`/?${params.toString()}`);
        setSearchBoxVisibility(false);
    };

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} className="w-full" alt="Apex Blog" />
                </Link>

                <div className={`${searchBoxVisibility ? "show" : "hide"} absolute bg-white w-full left-0 top-full mt-0.5 border-b border-grey py-4 px-[5vw] md:border-0 md:block md:relative md:inset-0 md:p-0 md:w-auto`}>
                    <input
                        type="text"
                        placeholder="search"
                        className="w-full md:w-auto bg-grey p-4 pr-[12%] md:pr-6 rounded-full placeholder:text-dark-grey md:pl-12"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                runSearch();
                            }
                        }}
                    />
                    <button
                        type="button"
                        className="absolute right-[10%] md:right-auto md:left-5 top-1/2 -translate-y-1/2 text-2xl tex-dark-grey"
                        onClick={runSearch}
                        aria-label="Search articles"
                    >
                        <i className="fi fi-rr-search" />
                    </button>
                </div>

                <div className="flex items-center gap-2 md:gap-6 ml-auto">
                    <button
                        className="md:hidden bg-grey w-12 h-12 rounded-full flex items-center justify-center"
                        onClick={() => setSearchBoxVisibility((current) => !current)}
                    >
                        <i className="fi fi-rr-search text text-xl" />
                    </button>

                    {authUser?.isAdmin ? (
                        <Link to="/editor" className="md:hidden bg-grey w-12 h-12 rounded-full flex items-center justify-center">
                            <i className="fi fi-rr-edit text-xl" />
                        </Link>
                    ) : null}

                    {authUser?.isAdmin ? (
                        <Link to="/me" className="md:hidden bg-grey w-12 h-12 rounded-full flex items-center justify-center" aria-label="My view">
                            <i className="fi fi-rr-user text-xl" />
                        </Link>
                    ) : null}

                    {authUser?.isAdmin ? (
                        <>
                            <Link to="/editor" className="hidden md:flex gap-2 link">
                                <i className="fi fi-rr-edit" />
                                <p>Write</p>
                            </Link>

                            <Link to="/manage-blogs" className="hidden md:flex gap-2 link">
                                <i className="fi fi-rr-document" />
                                <p>Manage</p>
                            </Link>

                            <Link to="/me" className="hidden md:flex gap-2 link">
                                <i className="fi fi-rr-user" />
                                <p>My View</p>
                            </Link>
                        </>
                    ) : null}

                    <button
                        type="button"
                        className="bg-grey w-12 h-12 rounded-full flex items-center justify-center"
                        onClick={toggleTheme}
                        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                        title={theme === "dark" ? "Light mode" : "Night mode"}
                    >
                        <i className={theme === "dark" ? "fi fi-rr-sun text-xl" : "fi fi-rr-moon-stars text-xl"} />
                    </button>

                    {authUser ? (
                        <>
                            {!authUser.isAdmin ? (
                                <span className="hidden md:block text-dark-grey border border-grey rounded-full px-3 py-1 text-sm">Reader mode</span>
                            ) : null}
                            <span className="text-dark-grey hidden md:block">@{authUser.username}</span>
                            <button className="btn-light py-2 !text-base !px-4" onClick={signOut}>Sign Out</button>
                        </>
                    ) : (
                        <>
                            <Link className="btn-dark py-2 !text-base !px-4" to="/signin">Sign In</Link>
                            <Link className="btn-light py-2 hidden md:block" to="/signup">Sign Up</Link>
                        </>
                    )}
                </div>
            </nav>

            <Outlet />
        </>
    );
};

export default Navbar;
