import type { PropsWithChildren } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AnimationWrapperProps extends PropsWithChildren {
    keyValue?: string;
    className?: string;
}

const AnimationWrapper = ({ children, keyValue, className }: AnimationWrapperProps) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                key={keyValue}
                className={className}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default AnimationWrapper;
