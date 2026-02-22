import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../App";

interface AdminOnlyRouteProps {
    children: JSX.Element;
}

const AdminOnlyRoute = ({ children }: AdminOnlyRouteProps) => {
    const { authUser } = useContext(AuthContext);

    if (!authUser) {
        return <Navigate to="/signin" replace />;
    }

    if (!authUser.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminOnlyRoute;
