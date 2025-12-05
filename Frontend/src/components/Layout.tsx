import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Film, Home, Search, User, Bell, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import { Toaster } from "./ui/toaster";

export default function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // 1. ADIM: Giriş yapmış kullanıcının adını al
    const currentUsername = localStorage.getItem("username");

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    // Çıkış Yapma Fonksiyonu
    const handleLogout = () => {
        // 2. ADIM: Tüm verileri temizle
        localStorage.removeItem("authToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        localStorage.removeItem("currentUser");

        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#050B12]">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-[#0A1A2F] bg-[#050B12]/95 backdrop-blur-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        {/* CineBook Logo */}
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#3DD9B4] to-[#2FC9A4] flex items-center justify-center">
                                <Film className="w-6 h-6 text-[#050B12]" />
                            </div>
                            <h3 className="text-[#3DD9B4] hidden sm:block">CineBook</h3>
                        </Link>

                        {/* MASAÜSTÜ MENÜ */}
                        <nav className="hidden md:flex items-center gap-8">
                            <Link
                                to="/"
                                className={`flex items-center gap-2 transition-colors ${isActive("/")
                                    ? "text-[#3DD9B4]"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Home className="w-5 h-5" />
                                <span>Ana Sayfa</span>
                            </Link>
                            <Link
                                to="/search"
                                className={`flex items-center gap-2 transition-colors ${isActive("/search")
                                    ? "text-[#3DD9B4]"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <Search className="w-5 h-5" />
                                <span>Arama</span>
                            </Link>

                            {/* DÜZELTİLDİ: Ters tırnaklar (backticks) eklendi */}
                            <Link
                                to={currentUsername ? `/profile/${currentUsername}` : "/login"}
                                className={`flex items-center gap-2 transition-colors ${location.pathname.startsWith("/profile")
                                    ? "text-[#3DD9B4]"
                                    : "text-gray-400 hover:text-white"
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                <span>Profilim</span>
                            </Link>
                        </nav>

                        {/* Sağ Taraftaki Butonlar */}
                        <div className="flex items-center gap-4">
                            {/* ÇIKIŞ BUTONU (Masaüstü) */}
                            <button
                                onClick={handleLogout}
                                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A1A2F] text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 transition-all text-sm font-medium cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Çıkış Yap
                            </button>

                            <button className="p-2 rounded-xl hover:bg-[#0A1A2F] transition-colors text-gray-400 hover:text-white">
                                <Bell className="w-5 h-5" />
                            </button>

                            {/* Mobil Menü Açma Butonu */}
                            <button
                                className="md:hidden p-2 rounded-xl hover:bg-[#0A1A2F] transition-colors text-gray-400 hover:text-white"
                                onClick={() => setShowMobileMenu(!showMobileMenu)}
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* MOBİL MENÜ */}
                    {showMobileMenu && (
                        <nav className="md:hidden mt-4 pt-4 border-t border-[#0A1A2F] space-y-2">
                            <Link
                                to="/"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${isActive("/")
                                    ? "bg-[#0A1A2F] text-[#3DD9B4]"
                                    : "text-gray-400 hover:bg-[#0A1A2F]"
                                    }`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <Home className="w-5 h-5" />
                                <span>Ana Sayfa</span>
                            </Link>
                            <Link
                                to="/search"
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${isActive("/search")
                                    ? "bg-[#0A1A2F] text-[#3DD9B4]"
                                    : "text-gray-400 hover:bg-[#0A1A2F]"
                                    }`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <Search className="w-5 h-5" />
                                <span>Arama</span>
                            </Link>

                            {/* DÜZELTİLDİ: Ters tırnaklar (backticks) eklendi */}
                            <Link
                                to={currentUsername ? `/profile/${currentUsername}` : "/login"}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${location.pathname.startsWith("/profile")
                                    ? "bg-[#0A1A2F] text-[#3DD9B4]"
                                    : "text-gray-400 hover:bg-[#0A1A2F]"
                                    }`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <User className="w-5 h-5" />
                                <span>Profilim</span>
                            </Link>

                            <button
                                onClick={() => {
                                    setShowMobileMenu(false);
                                    handleLogout();
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-[#0A1A2F] transition-colors text-left"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Çıkış Yap</span>
                            </button>
                        </nav>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main>
                <Outlet />
            </main>

            {/* Toast Notifications */}
            <Toaster />
        </div>
    );
}