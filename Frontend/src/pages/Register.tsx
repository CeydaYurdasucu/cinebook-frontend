import { Link, useNavigate } from "react-router-dom";
import { Film, BookOpen, AlertCircle } from "lucide-react";
import { useState } from "react";
import { api } from "../services/api"; // API istemcisini içeri aktar
import { toast } from "sonner"; // Bildirimler için

export default function Register() {
    const navigate = useNavigate();

    // --- FORM STATE'LERİ ---
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // --- HATA STATE'LERİ ---
    const [passwordError, setPasswordError] = useState("");

    // --- Şifre Eşleştirme Kontrolü ---
    const checkPasswordMatch = (p1: string, p2: string) => {
        if (p1 && p2 && p1 !== p2) {
            setPasswordError("Şifreler eşleşmiyor.");
            return false;
        }
        setPasswordError("");
        return true;
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        checkPasswordMatch(value, confirmPassword);
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        checkPasswordMatch(password, value);
    };

    // --- KAYIT İŞLEMİ (API CALL) ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Frontend Doğrulama
        if (!checkPasswordMatch(password, confirmPassword)) {
            toast.error("Lütfen şifrelerin eşleştiğinden emin olun.");
            return;
        }
        if (!termsAccepted) {
            toast.error("Kullanım koşullarını kabul etmelisiniz.");
            return;
        }

        setLoading(true);

        try {
            // AddUserDTO'ya uygun veriyi gönderiyoruz (bio ve profilePictureUrl boş bırakıldı)
            await api.register(username, email, password, "", null);

            toast.success("Kayıt başarılı! Şimdi giriş yapabilirsiniz.");
            navigate("/login"); // Başarılı kayıt sonrası giriş ekranına yönlendir

        } catch (error) {
            console.error("Kayıt hatası:", error);
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";

            // Backend'den gelen spesifik hataları (örn: "Bu e-posta zaten kullanımda") göster
            toast.error(`Kayıt Başarısız: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const isFormValid = username && email && password && confirmPassword && !passwordError && termsAccepted;

    return (
        <div className="min-h-screen flex">
            {/* Sol taraf - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 bg-[#050B12]">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo ve Film/Kitap İkonları */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3DD9B4] to-[#2FC9A4] flex items-center justify-center shadow-lg">
                            <Film className="w-8 h-8 text-[#050B12]" />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD65A] to-[#FFC940] flex items-center justify-center shadow-lg">
                            <BookOpen className="w-8 h-8 text-[#050B12]" />
                        </div>
                    </div>

                    {/* Hoşgeldiniz Metni */}
                    <div className="text-center">
                        <h2 className="text-white">Hesap oluştur</h2>
                        <p className="text-gray-400 mt-2">Film ve kitap tutkunları topluluğuna katılın</p>
                    </div>

                    {/* Form - API bağlantısı burada */}
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm text-gray-300 mb-2">
                                Kullanıcı adı
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="cinephile123"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-2xl bg-[#0A1A2F] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                                E-posta adresi
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="ornek@eposta.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-2xl bg-[#0A1A2F] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm text-gray-300 mb-2">
                                Şifre
                            </label>
                            <input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                required
                                className={`w-full px-4 py-3 rounded-2xl bg-[#0A1A2F] border-2 text-white placeholder-gray-500 focus:outline-none transition-colors ${passwordError ? "border-red-500 focus:border-red-500" : "border-[#0A1A2F] focus:border-[#3DD9B4]"
                                    }`}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm text-gray-300 mb-2">
                                Şifreyi tekrar gir
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                required
                                className={`w-full px-4 py-3 rounded-2xl bg-[#0A1A2F] border-2 text-white placeholder-gray-500 focus:outline-none transition-colors ${passwordError ? "border-red-500 focus:border-red-500" : "border-[#0A1A2F] focus:border-[#3DD9B4]"
                                    }`}
                            />
                            {passwordError && (
                                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{passwordError}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-600 bg-[#0A1A2F] mt-1"
                                checked={termsAccepted}
                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                required
                            />
                            <span className="text-sm text-gray-400">
                                <a href="#" className="text-[#3DD9B4] hover:text-[#2FC9A4]">
                                    Kullanım koşullarını
                                </a>{" "}
                                ve{" "}
                                <a href="#" className="text-[#3DD9B4] hover:text-[#2FC9A4]">
                                    Gizlilik politikasını
                                </a>{" "}
                                kabul ediyorum
                            </span>
                        </div>

                        {/* Hesap Oluştur Butonu */}
                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className="w-full py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Hesap oluşturuluyor..." : "Hesap oluştur"}
                        </button>
                    </form>

                    {/* Giriş linki */}
                    <p className="text-center text-gray-400">
                        Zaten bir hesabınız var mı?{" "}
                        <Link to="/login" className="text-[#3DD9B4] hover:text-[#2FC9A4] transition-colors">
                            Giriş yap
                        </Link>
                    </p>
                </div>
            </div>

            {/* Sağ taraf - Arka plan görseli */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050B12] z-10" />
                <img
                    src="https://images.unsplash.com/photo-1661343320593-127da7a9cc13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpZSUyMGZpbG0lMjByZWVsfGVufDF8fHx8MTc2Mzk4OTIwNXww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Film Şeridi"
                    className="w-full h-full object-cover blur-sm"
                />
                <div className="absolute inset-0 bg-[#0A1A2F] opacity-40" />
            </div>
        </div>
    );
}