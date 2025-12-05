import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Camera, AlertCircle, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../services/api";

export default function EditProfile() {
    const navigate = useNavigate();

    // --- STATES ---
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");

    const [avatar, setAvatar] = useState("");
    const [banner, setBanner] = useState("");

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const userId = localStorage.getItem("userId");

    // --- ImgBB Upload Function ---
    const uploadToImgBB = async (file: File) => {
        const formData = new FormData();
        formData.append("image", file);

        const API_KEY = "3e0b6077be211876ea303cd7f29fc0b3"; // önemli

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
            method: "POST",
            body: formData,
        });

        const json = await res.json();

        console.log("IMGBB RESPONSE:", json); // 🔥 Hata anında tam çıktıyı göreceksin

        // Başarısız ise hemen error fırlat → undefined dönmez
        if (!json.success) {
            throw new Error(json.error?.message || "ImgBB upload failed");
        }

        // URL her zaman buradadır, undefined OLAMAZ
        return json.data.url;
    };

    // --- FETCH USER DATA ---
    useEffect(() => {
        if (!userId) {
            toast.error("Oturum süresi dolmuş.");
            navigate("/login");
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await api.getUser(parseInt(userId));

                setUsername(data.username);
                setEmail(data.email || "");
                setBio(data.bio || "");

                setAvatar(
                    data.profilePictureUrl ||
                    "https://images.unsplash.com/photo-1582836985321-7a3f82fb6f3f?w=400"
                );

                setBanner(
                    data.bannerUrl ||
                    "https://images.unsplash.com/photo-1705147651064-36aedc005020?w=1920"
                );
            } catch (error: any) {
                toast.error("Profil bilgileri yüklenemedi.");
                if (error.message === "Unauthorized") navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId, navigate]);

    // --- SAVE PROFILE ---
    const handleSave = async () => {
        setSaving(true);
        setErrorMsg("");

        try {
            let uploadedAvatarUrl = avatar;
            let uploadedBannerUrl = banner;

            // Avatar Yükleme
            if (avatarFile) {
                uploadedAvatarUrl = await uploadToImgBB(avatarFile);
            }

            // Banner Yükleme
            if (bannerFile) {
                uploadedBannerUrl = await uploadToImgBB(bannerFile);
            }

            // Kullanıcı Güncelle
            const updateData = {
                id: parseInt(userId || "0"),
                username,
                email,
                bio,
                profilePictureUrl: uploadedAvatarUrl,
                bannerUrl: uploadedBannerUrl,
            };

            await api.updateUser(parseInt(userId || "0"), updateData);
            toast.success("Profil başarıyla güncellendi!");
        } catch (error: any) {
            let message = "Güncelleme başarısız.";

            try {
                const errObj = JSON.parse(error.message);
                if (errObj.errors)
                    message = Object.values(errObj.errors).flat().join(", ");
                else if (errObj.title) message = errObj.title;
            } catch {
                if (error.message) message = error.message;
            }

            setErrorMsg(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    // --- LOADING SCREEN ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#050B12] text-white flex items-center justify-center">
                <div className="animate-pulse">Profil Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050B12]">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to={`/profile/${userId}`}
                        className="p-2 rounded-xl hover:bg-[#0A1A2F] transition text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-white">Profili Düzenle</h2>
                </div>

                {/* Error Message */}
                {errorMsg && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-pulse">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-medium">{errorMsg}</p>
                    </div>
                )}

                <div className="space-y-8">
                    {/* Banner Upload */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 p-8 rounded-3xl border border-[#0A1A2F]">
                        <h3 className="text-white mb-4">Kapak Fotoğrafı</h3>

                        <div className="relative h-48 rounded-2xl overflow-hidden group">
                            <img src={banner} className="w-full h-full object-cover" />

                            <input
                                id="bannerInput"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        const file = e.target.files[0];
                                        setBannerFile(file);
                                        setBanner(URL.createObjectURL(file));
                                    }
                                }}
                            />

                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                <button
                                    onClick={() =>
                                        document.getElementById("bannerInput")?.click()
                                    }
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3DD9B4] text-[#050B12]"
                                >
                                    <Camera className="w-5 h-5" />
                                    Kapağı Değiştir
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Avatar Upload */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 p-8 rounded-3xl border border-[#0A1A2F]">
                        <h3 className="text-white mb-4">Profil Fotoğrafı</h3>

                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <img
                                    src={avatar}
                                    className="w-32 h-32 rounded-3xl object-cover"
                                />

                                <input
                                    id="avatarInput"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            const file = e.target.files[0];
                                            setAvatarFile(file);
                                            setAvatar(URL.createObjectURL(file));
                                        }
                                    }}
                                />

                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-3xl flex items-center justify-center">
                                    <button
                                        onClick={() =>
                                            document.getElementById("avatarInput")?.click()
                                        }
                                        className="p-3 rounded-full bg-[#3DD9B4] text-[#050B12]"
                                    >
                                        <Upload className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 text-gray-300">
                                Kare fotoğraf önerilir.
                            </div>
                        </div>
                    </div>

                    {/* Username */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 p-8 rounded-3xl border border-[#0A1A2F]">
                        <label className="block text-white mb-3">Kullanıcı Adı</label>
                        <input
                            className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border-2 border-[#0A1A2F] text-white focus:border-[#3DD9B4]"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    {/* Email */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 p-8 rounded-3xl border border-[#0A1A2F]">
                        <label className="block text-white mb-3 flex items-center gap-2">
                            <Mail className="w-4 h-4" /> E-posta Adresi
                        </label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border-2 border-[#0A1A2F] text-white focus:border-[#3DD9B4]"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    {/* Bio */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 p-8 rounded-3xl border border-[#0A1A2F]">
                        <label className="block text-white mb-3">Biyografi</label>
                        <textarea
                            rows={4}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border-2 border-[#0A1A2F] text-white resize-none focus:border-[#3DD9B4]"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-400">
                            <span>Kendinizden bahsedin</span>
                            <span>{bio.length}/200</span>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-4">
                        <Link to={`/profile/${userId}`} className="flex-1">
                            <button className="w-full px-6 py-4 rounded-2xl bg-[#0A1A2F] text-gray-300 hover:bg-[#0A1A2F]/70 border border-[#0A1A2F]">
                                İptal
                            </button>
                        </Link>

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-6 py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] shadow-lg disabled:opacity-50"
                        >
                            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
