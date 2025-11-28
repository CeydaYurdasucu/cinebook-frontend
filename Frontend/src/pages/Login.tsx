import { Link, useNavigate } from "react-router-dom";
import { Film, BookOpen, AlertCircle } from "lucide-react";
import { useState } from "react";
import { api } from "../services/api";
import { toast } from "sonner";

export default function Login() {
    const navigate = useNavigate();

    // Form State'leri
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Hata mesajını ekranda göstermek için state
    const [errorMsg, setErrorMsg] = useState("");

    // --- GİRİŞ İŞLEMİ ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(""); // Önceki hataları temizle

        try {
            // API'ye giriş isteği gönder
            await api.login(username, password);

            toast.success("Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz.");

            // Token'ın localStorage'a yazıldığından emin olmak için kısa bir gecikme ve yönlendirme
            setTimeout(() => {
                navigate("/");
            }, 500);

        } catch (error) {
            console.error("Giriş hatası detayı:", error);

            let message = "Giriş başarısız.";

            // Backend'den gelen JSON hatasını parse etmeye çalış (Daha akıllı hata yönetimi)
            if (error instanceof Error) {
                try {
                    // Hata mesajı bir JSON string ise parse et
                    const errObj = JSON.parse(error.message);

                    // Backend "title" dönüyorsa onu al
                    if (errObj.title) message = errObj.title;
                    // Validation hatası varsa detayları al
                    else if (errObj.errors) message = Object.values(errObj.errors).flat().join(", ");
                } catch {
                    // JSON değilse düz mesajı kullan (örn: "Failed to fetch")
                    message = error.message;
                }
            }

            // Genel kullanıcı/şifre hataları için kullanıcı dostu mesaj
            if (message.includes("400") || message.includes("401") || message.includes("One or more validation")) {
                message = "Kullanıcı adı veya şifre hatalı.";
            }

            // 500 Hatası (Veritabanı duplicate sorunu vb.)
            if (message.includes("Sequence contains more than one element")) {
                message = "Sistem hatası: Aynı kullanıcıdan birden fazla kayıt var. Lütfen veritabanını temizleyin.";
            }

            setErrorMsg(message);
            toast.error(message);

        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Sol taraf - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 bg-[#050B12]">
                <div className="w-full max-w-md space-y-8">

                    {/* Logo ve İkonlar */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3DD9B4] to-[#2FC9A4] flex items-center justify-center shadow-lg">
                            <Film className="w-8 h-8 text-[#050B12]" />
                        </div>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD65A] to-[#FFC940] flex items-center justify-center shadow-lg">
                            <BookOpen className="w-8 h-8 text-[#050B12]" />
                        </div>
                    </div>

                    {/* Başlık */}
                    <div className="text-center">
                        <h2 className="text-white">Tekrar hoş geldiniz</h2>
                        <p className="text-gray-400 mt-2">Yolculuğunuza devam etmek için giriş yapın</p>
                    </div>

                    {/* Hata Mesajı Kutusu (Hata varsa görünür) */}
                    {errorMsg && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm font-medium">{errorMsg}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="username" className="block text-sm text-gray-300 mb-2">
                                Kullanıcı Adı
                            </label>
                            <input
                                id="username"
                                name="username" // Tarayıcı otomatik doldurma için gerekli
                                autoComplete="username"
                                type="text"
                                placeholder="kullanıcı adınız"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
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
                                name="password" // Tarayıcı otomatik doldurma için gerekli
                                autoComplete="current-password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-2xl bg-[#0A1A2F] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-600 bg-[#0A1A2F]" />
                                <span className="text-sm text-gray-400">Beni hatırla</span>
                            </label>
                            <Link to="/forgot-password" className="text-sm text-[#3DD9B4] hover:text-[#2FC9A4] transition-colors">
                                Şifreni mi unuttun?
                            </Link>
                        </div>

                        {/* Giriş Butonu */}
                        <button
                            type="submit"
                            disabled={loading || !username || !password}
                            className="w-full py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all transform hover:scale-[1.02] shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                        >
                            {loading ? "Giriş Yapılıyor..." : "Giriş yap"}
                        </button>
                    </form>

                    {/* Kayıt Linki */}
                    <p className="text-center text-gray-400">
                        Hesabınız yok mu?{" "}
                        <Link to="/register" className="text-[#3DD9B4] hover:text-[#2FC9A4] transition-colors font-medium">
                            Hesap oluştur
                        </Link>
                    </p>
                </div>
            </div>

            {/* Sağ taraf - Arka Plan Görseli */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050B12] z-10" />
                <img
                    src="https://images.unsplash.com/photo-1593940256067-fb4acd831804?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxjaW5lbWElMjB0aGVhdGVyJTIwc2VhdHN8ZW58MXx8fHwxNzYzOTAwNzg4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Sinema"
                    className="w-full h-full object-cover blur-sm"
                />
                <div className="absolute inset-0 bg-[#0A1A2F] opacity-40" />
            </div>
        </div>
    );
}