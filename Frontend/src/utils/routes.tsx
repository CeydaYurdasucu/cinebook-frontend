import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Search from "../pages/Search";
import ContentDetail from "../pages/ContentDetail";
import Profile from "../pages/Profile";
import EditProfile from "../pages/EditProfile";

import RequireAuth from "../components/RequireAuth";

export const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "/forgot-password", element: <ForgotPassword /> },
    {
        element: <RequireAuth />,
        children: [
            {
                path: "/",
                element: <Layout />,
                children: [
                    { index: true, element: <Home /> },
                    { path: "search", element: <Search /> },
                    { path: "content/:id", element: <ContentDetail /> },
                    { path: "profile/:username", element: <Profile /> },
                    { path: "profile/:username/edit", element: <EditProfile /> },
                ],
            },
        ],
    },
]);
