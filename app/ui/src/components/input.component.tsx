import { useState } from "react";

interface InputBoxProps {
    name: string;
    type: "text" | "email" | "password" | "textarea";
    id?: string;
    value: string;
    placeholder: string;
    icon?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputBox = ({ name, type, id, value, placeholder, icon, onChange }: InputBoxProps) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
        <div className="relative w-[100%] mb-4">
            <input
                name={name}
                type={type === "password" ? (passwordVisible ? "text" : "password") : type}
                placeholder={placeholder}
                value={value}
                id={id}
                onChange={onChange}
                className="input-box"
            />
            {icon ? <i className={`fi ${icon} input-icon`} /> : null}
            {type === "password" ? (
                <i
                    className={`fi fi-rr-eye${!passwordVisible ? "-crossed" : ""} input-icon left-[auto] right-4 cursor-pointer`}
                    onClick={() => setPasswordVisible((current) => !current)}
                />
            ) : null}
        </div>
    );
};

export default InputBox;
