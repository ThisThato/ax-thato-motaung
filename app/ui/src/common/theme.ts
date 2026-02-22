export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "apex_blog_theme";

const isThemeMode = (value: string | null): value is ThemeMode => value === "light" || value === "dark";

export const getStoredTheme = (): ThemeMode | null => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeMode(stored) ? stored : null;
};

export const getPreferredTheme = (): ThemeMode => {
    const stored = getStoredTheme();
    if (stored) {
        return stored;
    }

    return "dark";
};

export const persistTheme = (theme: ThemeMode) => {
    localStorage.setItem(STORAGE_KEY, theme);
};

export const applyTheme = (theme: ThemeMode) => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
    document.documentElement.classList.toggle("theme-light", theme === "light");
};
