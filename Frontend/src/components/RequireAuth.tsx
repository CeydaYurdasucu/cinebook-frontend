import { Navigate, Outlet, useLocation } from "react-router-dom";

const RequireAuth = () => {
    const location = useLocation();

    
    const token = localStorage.getItem("authToken");

    // Token yoksa Login sayfasýna yönlendir
    if (!token) {
        // state={{ from: location }} sayesinde kullanýcý giriþ yapýnca kaldýðý sayfaya geri dönebilir.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};

export default RequireAuth;