import headshotThato from "../imgs/Headshot_thato.png";

export interface PortfolioProfile {
    fullName: string;
    headline: string;
    profilePhoto: string;
    location: string;
    currentRole: string;
    summary: string;
    skills: string[];
    highlights: string[];
    linkedIn: string;
    github: string;
}

const STORAGE_KEY = "apex_blog_portfolio_profile_v1";

const defaultProfilePhoto = (fullName: string): string => {
    return `https://api.dicebear.com/6.x/notionists-neutral/svg?seed=${encodeURIComponent(fullName || "thato")}`;
};

export const portfolioProfile: PortfolioProfile = {
    fullName: "Thato Kamogelo Motaung",
    headline: "Software Engineer at Investec",
    profilePhoto: headshotThato,
    location: "City of Johannesburg, Gauteng, South Africa",
    currentRole: "Software Engineer · Investec · Full-time (Aug 2024 - Present)",
    summary: "I am a Software Engineer at Investec, specializing in building bank-grade, high-availability systems. My focus sits at the intersection of full-stack engineering and cloud platform delivery across Azure and AWS. I help teams move from hoping systems work to knowing they do through automation, observability, and resilient architecture.",
    skills: ["C#", ".NET", "Azure", "AWS", "Bicep", "Dynatrace", "TeamCity", "Octopus Deploy", "Angular", "TypeScript", "WebSockets", "Docker", "PowerShell", "CI/CD", "Infrastructure as Code"],
    highlights: [
        "Own the Dynatrace monitoring stack for critical services with real-time health visibility and faster incident response.",
        "Develop and maintain mission-critical Azure infrastructure using Bicep for consistent and repeatable scaling.",
        "Build and maintain Azure DevOps delivery pipelines using YAML, PowerShell, and Docker.",
        "Engineer robust backend services in C#/.NET and modern web interfaces using Angular, TypeScript, NGXS, and WebSockets.",
        "Drive lower MTTR and higher uptime through proactive monitoring and operational automation."
    ],
    linkedIn: "https://www.linkedin.com/in/thato-motaung-3a727814a/?originalSubdomain=za",
    github: "https://github.com/ThisThato"
};

export const getPortfolioProfile = (): PortfolioProfile => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return portfolioProfile;
        const parsed = JSON.parse(raw) as Partial<PortfolioProfile>;
        return {
            ...portfolioProfile,
            ...parsed,
            profilePhoto: typeof parsed.profilePhoto === "string" && parsed.profilePhoto.trim()
                ? parsed.profilePhoto
                : defaultProfilePhoto((parsed.fullName as string) || portfolioProfile.fullName),
            skills: Array.isArray(parsed.skills) ? parsed.skills : portfolioProfile.skills,
            highlights: Array.isArray(parsed.highlights) ? parsed.highlights : portfolioProfile.highlights,
            github: typeof parsed.github === "string" && parsed.github.trim() ? parsed.github : portfolioProfile.github
        };
    } catch {
        return portfolioProfile;
    }
};

export const savePortfolioProfile = (profile: PortfolioProfile): void => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
};
