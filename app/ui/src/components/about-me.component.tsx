import { useState } from "react";
import { getPortfolioProfile, savePortfolioProfile, type PortfolioProfile } from "../common/portfolio";

const AboutMe = () => {
    const [profile, setProfile] = useState<PortfolioProfile>(() => getPortfolioProfile());
    const [isEditing, setIsEditing] = useState(false);
    const [skillsText, setSkillsText] = useState(profile.skills.join(", "));
    const [highlightsText, setHighlightsText] = useState(profile.highlights.join("\n"));

    const onSave = () => {
        const updated: PortfolioProfile = {
            ...profile,
            skills: skillsText.split(",").map((item) => item.trim()).filter(Boolean),
            highlights: highlightsText.split("\n").map((item) => item.trim()).filter(Boolean)
        };
        setProfile(updated);
        savePortfolioProfile(updated);
        setIsEditing(false);
    };

    const onCancel = () => {
        const current = getPortfolioProfile();
        setProfile(current);
        setSkillsText(current.skills.join(", "));
        setHighlightsText(current.highlights.join("\n"));
        setIsEditing(false);
    };

    return (
        <aside className="border border-grey rounded-xl p-4 md:p-6 bg-white">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-2xl md:text-3xl font-gelasio">About Me</h2>
                {!isEditing ? (
                    <button className="btn-light !py-2 !text-base !px-4" onClick={() => setIsEditing(true)}>Edit</button>
                ) : null}
            </div>

            {isEditing ? (
                <div className="grid gap-3">
                    <input className="input-box !pl-4" value={profile.fullName} onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} placeholder="Full name" />
                    <input className="input-box !pl-4" value={profile.headline} onChange={(event) => setProfile((current) => ({ ...current, headline: event.target.value }))} placeholder="Headline" />
                    <input className="input-box !pl-4" value={profile.location} onChange={(event) => setProfile((current) => ({ ...current, location: event.target.value }))} placeholder="Location" />
                    <input className="input-box !pl-4" value={profile.currentRole} onChange={(event) => setProfile((current) => ({ ...current, currentRole: event.target.value }))} placeholder="Current role" />
                    <textarea className="input-box min-h-28 !pl-4" value={profile.summary} onChange={(event) => setProfile((current) => ({ ...current, summary: event.target.value }))} placeholder="Summary" />
                    <textarea className="input-box min-h-24 !pl-4" value={skillsText} onChange={(event) => setSkillsText(event.target.value)} placeholder="Skills (comma separated)" />
                    <textarea className="input-box min-h-32 !pl-4" value={highlightsText} onChange={(event) => setHighlightsText(event.target.value)} placeholder="Highlights (one per line)" />
                    <input className="input-box !pl-4" value={profile.linkedIn} onChange={(event) => setProfile((current) => ({ ...current, linkedIn: event.target.value }))} placeholder="LinkedIn URL" />
                    <input className="input-box !pl-4" value={profile.github} onChange={(event) => setProfile((current) => ({ ...current, github: event.target.value }))} placeholder="GitHub URL" />
                    <div className="flex flex-wrap gap-2">
                        <button className="btn-dark !py-2 !text-base !px-4" onClick={onSave}>Save</button>
                        <button className="btn-light !py-2 !text-base !px-4" onClick={onCancel}>Cancel</button>
                    </div>
                </div>
            ) : (
                <>
                    <h3 className="text-xl md:text-2xl font-medium mb-1">{profile.fullName}</h3>
                    <p className="text-dark-grey mb-1">{profile.headline}</p>
                    <p className="text-dark-grey mb-4">{profile.location}</p>
                    <p className="text-dark-grey mb-4">{profile.currentRole}</p>

                    <p className="mb-4 leading-8">{profile.summary}</p>

                    <div className="mb-4">
                        <h4 className="text-xl font-medium mb-2">What I Do</h4>
                        <ul className="grid gap-2 text-dark-grey">
                            {profile.highlights.map((item) => (
                                <li key={item}>• {item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                        {profile.skills.map((skill) => (
                            <span key={skill} className="tag text-sm">{skill}</span>
                        ))}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <a href={profile.linkedIn} target="_blank" rel="noreferrer" className="btn-dark inline-block !text-base !px-4">
                            View LinkedIn
                        </a>
                        {profile.github ? (
                            <a href={profile.github} target="_blank" rel="noreferrer" className="btn-light inline-block !text-base !px-4">
                                View GitHub
                            </a>
                        ) : null}
                    </div>
                </>
            )}
        </aside>
    );
};

export default AboutMe;
