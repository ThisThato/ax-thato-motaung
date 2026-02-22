import { useNavigate } from "react-router-dom";

interface BackNavProps {
    fallbackPath?: string;
}

const BackNav = ({ fallbackPath = "/" }: BackNavProps) => {
    const navigate = useNavigate();

    const onBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
            return;
        }
        navigate(fallbackPath);
    };

    return (
        <button className="btn-light !py-2 !text-base !px-4 mb-4" onClick={onBack}>
            ← Back
        </button>
    );
};

export default BackNav;
