import { Link } from "react-router";
import { Film, BookOpen, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitted(true);
    };

    return (
        <>
            <div className="min-h-screen flex">
                {/* Sol taraf - Form */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10 bg-[#050B12]">
                    <div className="w-full max-w-md space-y-8">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3DD9B4] to-[#2FC9A4] flex items-center justify-center">
                                <Film className="w-8 h-8 text-[#050B12]" />
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFD65A] to-[#FFC940] flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-[#050B12]" />
                            </div>
                        </div>

                        {!isSubmitted ? (
                            <>
                                {/* Ba�l�k */}
                                <div className="text-center">
                                    <h2 className="text-white">Şifrenizi mi unuttunuz?</h2>
                                    <p className="text-gray-400 mt-2">
                                        Endişelenmeyin! E-posta adresinizi girin, size bir sıfırlama linki göndereceğiz.
                                    </p>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className="block text-sm text-gray-300 mb-2">
                                            E-posta adresi
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ornek@ornek.com"
                                            required
                                            className="w-full px-4 py-3 rounded-2xl bg-[#0A1A2F] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all transform hover:scale-[1.02] shadow-lg"
                                    >
                                        Sıfırlama linki gönder
                                    </button>
                                </form>

                                {/* Girişe dön */}
                                <p className="text-center text-gray-400">
                                    Şifrenizi hatırladınız mı?{" "}
                                    <Link to="/login" className="text-[#3DD9B4] hover:text-[#2FC9A4] transition-colors">
                                        Girişe dön
                                    </Link>
                                </p>
                            </>
                        ) : (
                            <>
                                {/* Onay Mesajı*/}
                                <div className="text-center space-y-6">
                                    <div className="flex justify-center">
                                        <div className="w-20 h-20 rounded-full bg-[#3DD9B4]/20 flex items-center justify-center">
                                            <CheckCircle2 className="w-12 h-12 text-[#3DD9B4]" />
                                        </div>
                                    </div>
                                    <div>
                                        <h2 className="text-white mb-3">E-postanızı kontrol edin</h2>
                                        <p className="text-gray-400">
                                            Şifre sıfırlama linki gönderildi:
                                        </p>
                                        <p className="text-[#3DD9B4] mt-2">{email}</p>
                                    </div>
                                    <div className="bg-[#0A1A2F] rounded-2xl p-4 text-sm text-gray-400">
                                        <p>
                                            E-postayı almadınız mı? Spam klasörünüzü kontrol edin veya{" "}
                                            <button
                                                onClick={() => setIsSubmitted(false)}
                                                className="text-[#3DD9B4] hover:text-[#2FC9A4]"
                                            >
                                                tekrar deneyin
                                            </button>
                                        </p>
                                    </div>
                                    <Link to="/login">
                                        <button className="w-full py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all">
                                            Girişe dön
                                        </button>
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Sa� taraf - Arka plan */}
                <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent to-[#050B12] z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1593940256067-fb4acd831804?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaW5lbWElMjB0aGVhdGVyJTIwc2VhdHN8ZW58MXx8fHwxNzYzOTAwNzg4fDA&ixlib=rb-4.1.0&q=80&w=1080"
                        alt="Cinema"
                        className="w-full h-full object-cover blur-sm"
                    />
                    <div className="absolute inset-0 bg-[#0A1A2F] opacity-40" />
                </div>
            </div>
        </>
    );
}
