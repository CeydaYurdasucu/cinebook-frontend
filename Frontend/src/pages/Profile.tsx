
import { useParams } from "react-router";
import { Settings, UserPlus, UserMinus, Plus, Star, X, List } from "lucide-react";
import { useState } from "react";
import { mockUsers, mockContent, mockActivities } from "../utils/mockData";
import { Link } from "react-router";

export default function Profile() {
    const { username } = useParams();
    const user = mockUsers.find((u) => u.username === username) || mockUsers[0];
    const isOwnProfile = user.isCurrentUser;

    // --- STATE'LER ---
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState("watched");

    // Liste Oluşturma Modalı için State'ler
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");

    const [customLists, setCustomLists] = useState([
        { title: "Favoriler", count: 12, covers: mockContent.slice(0, 3) },
        { title: "Kış 2024 İzlenecekler", count: 8, covers: mockContent.slice(2, 4) },
        { title: "Bilim Kurgu Klasikleri", count: 15, covers: mockContent.slice(1, 3) },
        { title: "Gizli Cevherler", count: 4, covers: [mockContent[0]] },
        { title: "İyi Hissettiren Filmler", count: 22, covers: mockContent.slice(0, 3) }
    ]);

    // Sekme İsimleri
    const tabs = [
        { id: "watched", label: "İzlediklerim", count: 47 },
        { id: "watchlist", label: "İzlenecekler", count: 23 },
        { id: "read", label: "Okuduklarım", count: 31 },
        { id: "toread", label: "Okunacaklar", count: 18 },
        { id: "lists", label: "Özel Listeler", count: customLists.length },
    ];

    const userActivities = mockActivities.filter((a) => a.user.username === username);

    // Yeni Liste Oluşturma Fonksiyonu
    const handleCreateList = () => {
        if (newListName.trim()) {
            const newList = {
                title: newListName,
                count: 0,
                covers: [] // Boş liste
            };
            setCustomLists([newList, ...customLists]); // Başa ekle
            setNewListName("");
            setShowCreateModal(false);
            setActiveTab("lists"); // Otomatik olarak listeler sekmesine geç
        }
    };

    return (
        <div className="min-h-screen bg-[#050B12]">
            {/* Profil Başlığı (Header) */}
            <div className="relative">
                {/* Kapak Görseli (Banner) */}
                <div className="h-80 overflow-hidden relative">
                    <img
                        src="https://images.unsplash.com/photo-1705147651064-36aedc005020?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1920"
                        alt="Banner"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050B12] via-[#050B12]/60 to-transparent" />
                </div>

                {/* Profil Bilgileri */}
                <div className="container mx-auto px-4 relative">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-24">
                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={user.avatar}
                                alt={user.displayName}
                                className="w-40 h-40 rounded-3xl object-cover border-4 border-[#050B12] shadow-2xl"
                            />
                        </div>

                        {/* Kullanıcı Detayları */}
                        <div className="flex-1 pb-2">
                            <h2 className="text-white mb-1">{user.displayName}</h2>
                            <p className="text-[#3DD9B4] mb-3">@{user.username}</p>
                            <p className="text-gray-300 mb-4 max-w-2xl">{user.bio}</p>
                            <div className="flex gap-6 text-gray-300">
                                <div>
                                    <span className="text-white">{user.followers.toLocaleString()}</span>{" "}
                                    <span className="text-gray-500">Takipçi</span>
                                </div>
                                <div>
                                    <span className="text-white">{user.following.toLocaleString()}</span>{" "}
                                    <span className="text-gray-500">Takip Edilen</span>
                                </div>
                            </div>
                        </div>

                        {/* Aksiyon Butonları */}
                        <div className="flex gap-3 pb-2">
                            {isOwnProfile ? (
                                <>
                                    <Link to={`/profile/${user.username}/edit`}>
                                        <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0A1A2F] text-gray-300 hover:bg-[#3DD9B4]/10 hover:text-[#3DD9B4] border border-[#0A1A2F] hover:border-[#3DD9B4]/30 transition-all">
                                            <Settings className="w-5 h-5" />
                                            Profili Düzenle
                                        </button>
                                    </Link>

                                    {/* LİSTE OLUŞTUR BUTONU */}
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all shadow-lg transform active:scale-95"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Liste Oluştur
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsFollowing(!isFollowing)}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${isFollowing
                                            ? "bg-[#0A1A2F] text-gray-300 hover:bg-red-500/10 hover:text-red-400 border border-[#0A1A2F] hover:border-red-400/30"
                                            : "bg-[#3DD9B4] text-[#050B12] hover:bg-[#2FC9A4]"
                                        }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserMinus className="w-5 h-5" />
                                            Takipten Çık
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            Takip Et
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Sekmeler (Tabs) */}
            <div className="border-b border-[#0A1A2F] sticky top-[72px] bg-[#050B12]/95 backdrop-blur-lg z-40 mt-8">
                <div className="container mx-auto px-4">
                    <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-4 transition-all whitespace-nowrap border-b-2 ${activeTab === tab.id
                                        ? "text-[#3DD9B4] border-[#3DD9B4]"
                                        : "text-gray-400 border-transparent hover:text-white"
                                    }`}
                            >
                                {tab.label}{" "}
                                <span className="text-gray-600 text-sm ml-1">({tab.count})</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sekme İçeriği */}
            <div className="container mx-auto px-4 py-12">
                {activeTab === "lists" ? (
                    <div className="max-w-4xl space-y-4 animate-in fade-in duration-300">
                        {customLists.map((list, idx) => (
                            <div
                                key={idx}
                                className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-6 border border-[#0A1A2F] hover:border-[#3DD9B4]/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-white mb-1 group-hover:text-[#3DD9B4] transition-colors">{list.title}</h4>
                                        <p className="text-gray-400 text-sm">
                                            {list.count} öğe
                                        </p>
                                    </div>
                                    <div className="flex -space-x-3">
                                        {list.covers.length > 0 ? (
                                            list.covers.map((item, i) => (
                                                <img
                                                    key={i}
                                                    src={item.poster}
                                                    alt=""
                                                    className="w-12 h-16 rounded-lg object-cover border-2 border-[#050B12] transform group-hover:scale-110 transition-transform"
                                                    style={{ zIndex: 10 - i }}
                                                />
                                            ))
                                        ) : (
                                            // Boş liste için ikon
                                            <div className="w-12 h-16 rounded-lg bg-[#0A1A2F] border-2 border-[#050B12] flex items-center justify-center">
                                                <List className="w-6 h-6 text-gray-600" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // Diğer sekmeler (İzlediklerim, Okuduklarım vb.)
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6 animate-in fade-in duration-300">
                        {mockContent.map((item) => (
                            <Link key={item.id} to={`/content/${item.id}`}>
                                <div className="group cursor-pointer">
                                    <div className="relative mb-3 overflow-hidden rounded-2xl">
                                        <img
                                            src={item.poster}
                                            alt={item.title}
                                            className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#050B12]/90 backdrop-blur-sm rounded-lg flex items-center gap-1">
                                            <Star className="w-4 h-4 text-[#FFD65A] fill-[#FFD65A]" />
                                            <span className="text-white text-sm">{item.rating}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-white text-sm mb-1 group-hover:text-[#3DD9B4] transition-colors truncate">
                                        {item.title}
                                    </h4>
                                    <p className="text-gray-400 text-xs">{item.year}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Son Aktiviteler Bölümü */}
                {activeTab === "watched" && userActivities.length > 0 && (
                    <div className="mt-16">
                        <h3 className="text-white mb-6">Son Aktiviteler</h3>
                        <div className="max-w-3xl space-y-6">
                            {userActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-6 border border-[#0A1A2F]"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-gray-400 text-sm">{activity.timestamp}</span>
                                        <span className="text-gray-600">•</span>
                                        <span className="text-gray-400 text-sm">{activity.action}</span>
                                    </div>
                                    <Link to={`/content/${activity.content.id}`}>
                                        <div className="flex gap-4">
                                            <img
                                                src={activity.content.poster}
                                                alt={activity.content.title}
                                                className="w-20 h-28 rounded-2xl object-cover"
                                            />
                                            <div className="flex-1">
                                                <h4 className="text-white mb-2">{activity.content.title}</h4>
                                                {activity.rating && (
                                                    <div className="flex items-center gap-1 mb-3">
                                                        <Star className="w-4 h-4 text-[#FFD65A] fill-[#FFD65A]" />
                                                        <span className="text-[#FFD65A]">{activity.rating}/10</span>
                                                    </div>
                                                )}
                                                {activity.review && (
                                                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                                                        {activity.review}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- YENİ LİSTE OLUŞTUR PENCERESİ (MODAL) --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    {/* Dışarı tıklayınca kapat */}
                    <div className="absolute inset-0" onClick={() => setShowCreateModal(false)} />

                    <div className="bg-[#0A1A2F] rounded-3xl p-8 max-w-md w-full border border-[#3DD9B4]/30 relative z-10 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white text-xl font-semibold">Yeni Liste Oluştur</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Liste Adı</label>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Örn: En İyi Korku Filmleri"
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                                    className="w-full bg-[#050B12] border border-gray-700 focus:border-[#3DD9B4] rounded-xl px-4 py-3 text-white focus:outline-none transition-colors"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleCreateList}
                                    disabled={!newListName.trim()}
                                    className="flex-1 py-3 rounded-xl bg-[#3DD9B4] text-[#050B12] font-semibold hover:bg-[#2FC9A4] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Oluştur
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}