import { useState } from "react";
import { ArrowLeft, Upload, Camera } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function EditProfile() {
    const [username, setUsername] = useState("johndoe");
    const [bio, setBio] = useState("Film tutkunu & kitap kurdu. O sinematik anlar i�in ya��yorum.");
    const [avatar, setAvatar] = useState(
        "https://images.unsplash.com/photo-1582836985321-7a3f82fb6f3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
    );
    const [banner, setBanner] = useState(
        "https://images.unsplash.com/photo-1705147651064-36aedc005020?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920"
    );

    const handleSave = () => {
        toast.success("Profil başarıyla güncellendi!");
    };

    return (
        <div className="min-h-screen bg-[#050B12]">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Ba�l�k */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/profile/johndoe"
                        className="p-2 rounded-xl hover:bg-[#0A1A2F] transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h2 className="text-white">Profili Düzenle</h2>
                </div>

                <div className="space-y-8">
                    {/* Kapak Foto�raf� Y�kleme */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                        <h3 className="text-white mb-4">Kapak Fotoğrafı</h3>
                        <div className="relative h-48 rounded-2xl overflow-hidden group">
                            <img src={banner} alt="Banner" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#3DD9B4] text-[#050B12] hover:bg-[#2FC9A4] transition-all">
                                    <Camera className="w-5 h-5" />
                                    Kapağı Değiştir
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm mt-3">
                            önerilen boyut: 1920x400px. Maksimum dosya boyutu: 5MB
                        </p>
                    </div>

                    {/* Profil Foto�raf� Y�kleme */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                        <h3 className="text-white mb-4">Profil Fotoğrafı</h3>
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <img
                                    src={avatar}
                                    alt="Avatar"
                                    className="w-32 h-32 rounded-3xl object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center">
                                    <button className="p-3 rounded-full bg-[#3DD9B4] text-[#050B12] hover:bg-[#2FC9A4] transition-all">
                                        <Upload className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1">
                                <p className="text-gray-300 mb-2">Yeni bir avatar yüklemek için tıklayın</p>
                                <p className="text-gray-500 text-sm">
                                    Kare görsel önerilir. Maksimum dosya boyutu: 2MB
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Kullan�c� Ad� */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                        <label htmlFor="username" className="block text-white mb-3">
                            Kullanıcı Adı
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors"
                        />
                        <p className="text-gray-400 text-sm mt-2">
                            Benzersiz kullanıcı adınız. 3-20 karakter arasında olmalıdır.
                        </p>
                    </div>

                    {/* Biyografi */}
                    <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                        <label htmlFor="bio" className="block text-white mb-3">
                            Biyografi
                        </label>
                        <textarea
                            id="bio"
                            rows={4}
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            maxLength={200}
                            className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors resize-none"
                        />
                        <div className="flex justify-between items-center mt-2">
                            <p className="text-gray-400 text-sm">Kendinizden bahsedin</p>
                            <p className="text-gray-500 text-sm">{bio.length}/200</p>
                        </div>
                    </div>

                    {/* Aksiyon Butonlar� */}
                    <div className="flex gap-4">
                        <Link to="/profile/johndoe" className="flex-1">
                            <button className="w-full px-6 py-4 rounded-2xl bg-[#0A1A2F] text-gray-300 hover:bg-[#0A1A2F]/70 border border-[#0A1A2F] hover:border-gray-600 transition-all">
                                iptal
                            </button>
                        </Link>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-6 py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all transform hover:scale-[1.02] shadow-lg"
                        >
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}