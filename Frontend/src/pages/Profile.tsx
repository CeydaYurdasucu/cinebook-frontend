import { useParams, Link, useNavigate } from "react-router-dom";
import {
    Settings,
    UserPlus,
    UserMinus,
    Plus,
    Star,
    X,
    List,
    Loader2,
    Film,
    BookOpen,
    MoreVertical,
    Edit,
    Trash,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "../services/api";

export default function Profile() {
    const { username } = useParams();
    const navigate = useNavigate();
    const API_BASE_URL = "https://localhost:7255";
    // --- STATE'LER ---
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState("watched");

    // --- İÇERİK STATE'LERİ ---
    const [customLists, setCustomLists] = useState<any[]>([]);
    const [userActivities, setUserActivities] = useState<any[]>([]);

    // 4 Farklı Kategori
    const [watchedMovies, setWatchedMovies] = useState<any[]>([]);
    const [watchlistMovies, setWatchlistMovies] = useState<any[]>([]);
    const [readBooks, setReadBooks] = useState<any[]>([]);
    const [toreadBooks, setToreadBooks] = useState<any[]>([]);

    // Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newListName, setNewListName] = useState("");

    // Yeni eklenen state'ler:
    const [openMenu, setOpenMenu] = useState<number | null>(null);

    const [renameModal, setRenameModal] = useState({
        open: false,
        list: null as any,
    }); // --- YENİ EKLEMELER: İÇERİK EKLEME MODALI ---
    // Yeni eklenen state'ler:

    const [showAddContentModal, setShowAddContentModal] = useState(false);
    const [searchType, setSearchType] = useState<"movie" | "book" | null>(null); // Hangi türde arama yapılacağını tutar
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [libraryTypeToAdd, setLibraryTypeToAdd] = useState<number | null>(null); // Hangi kütüphane türüne eklenecek (1, 2, 3, 4)
    const [allMediaItems, setAllMediaItems] = useState<any[]>([]);

    const currentUserId = localStorage.getItem("userId");
    const isOwnProfile =
        user && currentUserId && String(user.id) === String(currentUserId);

    // --- FRONTEND SEARCH ---
    const handleSearch = () => {
        if (!searchTerm.trim()) return;

        setSearchLoading(true);

        try {
            const lowered = searchTerm.toLowerCase();

            let filtered = allMediaItems.filter((m) => {
                const title = m.title?.toLowerCase() || "";

                // 1) typeName varsa onu al
                const typeName = m.typeName?.toLowerCase() || "";

                // 2) type numeric ise onu da Book/Movie olarak ele al
                const numeric = m.type; // 0 = movie, 1 = book gibi

                const isMovie = typeName === "movie" || numeric === 0 || numeric === 2;
                // (TMDb filmleri 2 olarak da geliyor olabilir)

                const isBook = typeName === "book" || numeric === 1;

                if (searchType === "movie") {
                    return isMovie && title.includes(lowered);
                }

                if (searchType === "book") {
                    return isBook && title.includes(lowered);
                }

                return false;
            });

            setSearchResults(filtered);
        } finally {
            setSearchLoading(false);
        }
    };
    const handleAddContent = async (mediaId: number) => {
        if (!libraryTypeToAdd) return;

        try {
            // libraryTypeToAdd, senin Enum değerlerini taşıyor (1, 2, 3 veya 4)
            await api.addToUserLibrary(mediaId, libraryTypeToAdd);

            toast.success("Kütüphaneye eklendi!");
            setShowAddContentModal(false);
            setSearchTerm("");
            setSearchResults([]);

            // Listeleri güncelle
            fetchProfileData();
        } catch (error) {
            console.error(error);
            toast.error("Ekleme başarısız.");
        }
    };
    const fetchProfileData = async () => {
        // Sayfa ilk açılıyorsa veya yenileniyorsa loading true yapılabilir
        // setLoading(true);

        try {
            if (!username) return;

            // 1. Kullanıcı bilgilerini çek
            const userData = await api.getUserByUsername(username);
            setUser(userData);

            // Takip durumunu güncelle
            if (userData.isFollowing !== undefined) {
                setIsFollowing(userData.isFollowing);
            }

            const uId = userData.id;

            // 2. Tüm listeleri PARALEL olarak çek
            // DİKKAT: Buradaki sıralama Promise.all dizisindeki sıraya göre olmalı!
            const [
                lists, // Özel Listeler
                activities, // Son Aktiviteler
                fetchedWatched, // Enum 4: Watched (İzlediklerim)
                fetchedWatchlist, // Enum 3: WantToWatch (İzlenecekler)
                fetchedRead, // Enum 2: Read (Okuduklarım)
                fetchedToread, // Enum 1: WantToRead (Okunacaklar)
            ] = await Promise.all([
                api.getUserCustomLists(uId).catch(() => []),
                api.getUserActivities(uId).catch(() => []),

                // C# Enum ID'lerine göre istek atıyoruz:
                api.getUserLibrary(uId, 4).catch(() => []), // 4 -> İzlediklerim
                api.getUserLibrary(uId, 3).catch(() => []), // 3 -> İzlenecekler
                api.getUserLibrary(uId, 2).catch(() => []), // 2 -> Okuduklarım
                api.getUserLibrary(uId, 1).catch(() => []), // 1 -> Okunacaklar
            ]);

            // 3. State'leri Güncelle
            setCustomLists(lists || []);
            setUserActivities(activities || []);

            setWatchedMovies(fetchedWatched || []);
            setWatchlistMovies(fetchedWatchlist || []);
            setReadBooks(fetchedRead || []); // JSON'da "status: 2" olanlar buraya düşecek
            setToreadBooks(fetchedToread || []); // JSON'da "status: 1" olanlar buraya düşecek
        } catch (error) {
            console.error("Profil yüklenemedi:", error);
            toast.error("Profil verileri alınamadı.");
        } finally {
            setLoading(false);
        }
    };
    // --- 1. VERİLERİ ÇEKME ---
    // --- USE EFFECT ---
    useEffect(() => {
        // 1. Arama havuzunu doldur (Modal içinde arama yapabilmek için tüm listeyi çeker)
        const fetchAll = async () => {
            try {
                const items = await api.getAllMediaItems();
                setAllMediaItems(items);
            } catch (err) {
                console.error("MediaItem çekilemedi", err);
            }
        };

        // 2. Fonksiyonları Çalıştır
        fetchAll();

        setLoading(true);
        fetchProfileData();

        // Bağımlılık dizisi: Sadece 'username' değiştiğinde (başka bir profile geçince) tekrar çalışır.
    }, [username, navigate]);
    // --- KÜTÜPHANEDEN SİLME İŞLEMİ ---
    const handleRemoveFromLibrary = async (entryId: number) => {
        if (
            !window.confirm(
                "Bu içeriği kütüphanenden kaldırmak istediğine emin misin?"
            )
        )
            return;

        try {
            // API'de bu fonksiyon yoksa services/api.ts'e eklemelisin (aşağıda örneği var)
            await api.deleteLibraryEntry(entryId);

            toast.success("İçerik kaldırıldı.");

            // Listeyi yenile ki silinen ekrandan gitsin
            fetchProfileData();
        } catch (error) {
            console.error(error);
            toast.error("Silme işlemi başarısız.");
        }
    };
    // --- TAKİP İŞLEMİ ---
    const handleFollowToggle = async () => {
        console.log("TAKİP EDİLEN USER ID:", user.id);

        if (!currentUserId) {
            toast.error("Giriş yapmalısınız.");
            return;
        }

        const oldStatus = isFollowing;
        setIsFollowing(!isFollowing);

        try {
            if (oldStatus) {
                await api.unfollowUser(user.id);
                toast.success(`@${user.username} takipten çıkarıldı.`);
            } else {
                await api.followUser(user.id);
                toast.success(`@${user.username} takip ediliyor!`);
            }
        } catch (error) {
            setIsFollowing(oldStatus);
            toast.error("İşlem başarısız oldu.");
        }
    };

    // --- LİSTE OLUŞTURMA ---
    const handleCreateList = async () => {
        if (!newListName.trim()) return;

        try {
            const newList = await api.addCustomList(newListName);
            const listWithVisuals = { ...newList, covers: [] };

            setCustomLists([listWithVisuals, ...customLists]);

            setNewListName("");
            setShowCreateModal(false);
            setActiveTab("lists");

            toast.success("Liste oluşturuldu!");
        } catch (error) {
            toast.error("Liste oluşturulamadı.");
        }
    };

    // --- LİSTE SİLME ---
    const handleDeleteList = async (id: number) => {
        if (!window.confirm("Bu listeyi silmek istediğine emin misin?")) return;

        try {
            await api.deleteCustomList(id);
            setCustomLists(customLists.filter((l) => l.id !== id));
            toast.success("Liste silindi!");
        } catch {
            toast.error("Liste silinemedi.");
        }
    };

    // --- LİSTE ADI DÜZENLEME ---
    const handleRenameListSave = async () => {
        try {
            await api.updateCustomList(
                renameModal.list.id,
                renameModal.list.name,
                "" // description boş geçilebilir
            );

            setCustomLists((prev) =>
                prev.map((l) =>
                    l.id === renameModal.list.id
                        ? { ...l, name: renameModal.list.name }
                        : l
                )
            );

            toast.success("Liste güncellendi!");
            setRenameModal({ open: false, list: null });
        } catch {
            toast.error("Güncelleme başarısız.");
        }
    };

    // --- KART BİLEŞENİ ---
    // --- KART BİLEŞENİ (SİLME BUTONLU) ---
    const ContentCard = ({
        item,
        type = "movie",
    }: {
        item: any;
        type?: "movie" | "book";
    }) => {
        // Veri normalizasyonu: item backend'den gelen LibraryEntry ise 'mediaItem' içindedir.
        const content = item.mediaItem || item.content || item;

        const poster =
            content.coverImageUrl ||
            content.posterUrl ||
            content.imageUrl ||
            content.poster ||
            "https://placehold.co/100x150?text=No+Image";

        const title = content.title || content.name;
        const rating = content.rating || content.averageRating || 0;
        const year = content.releaseYear || content.year || "";

        // Kütüphaneden silmek için 'LibraryEntry' tablosundaki ID'ye ihtiyacımız var (item.id)
        const entryId = item.id;

        const isBook =
            type === "book" || content.typeName === "Book" || content.type === 1;

        return (
            <div className="relative group">
                {" "}
                {/* group: hover efekti için kapsayıcı */}
                <Link to={`/content/${content.id}`}>
                    <div className="cursor-pointer">
                        <div className="relative mb-3 overflow-hidden rounded-2xl bg-[#0A1A2F] aspect-[2/3] border border-[#0A1A2F] group-hover:border-[#3DD9B4]/30 transition-all">
                            {/* Poster */}
                            <img
                                src={poster}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                    e.currentTarget.src =
                                        "https://placehold.co/100x150?text=Error";
                                }}
                            />

                            {/* Poster Yoksa İkon Göster */}
                            {!poster.includes("http") && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 gap-2 bg-[#0A1A2F]">
                                    {isBook ? (
                                        <BookOpen className="w-10 h-10" />
                                    ) : (
                                        <Film className="w-10 h-10" />
                                    )}
                                    <span className="text-xs">Görsel Yok</span>
                                </div>
                            )}

                            {/* Puan Rozeti */}
                            {rating > 0 && (
                                <div className="absolute top-3 right-3 px-2.5 py-1 bg-[#050B12]/90 rounded-lg flex items-center gap-1">
                                    <Star className="w-4 h-4 text-[#FFD65A] fill-[#FFD65A]" />
                                    <span className="text-white text-sm">{rating}</span>
                                </div>
                            )}
                        </div>

                        {/* Başlık ve Yıl */}
                        <h4 className="text-white text-sm mb-1 group-hover:text-[#3DD9B4] truncate">
                            {title}
                        </h4>
                        <p className="text-gray-400 text-xs">{year}</p>
                    </div>
                </Link>
                {/* --- SİLME BUTONU (HOVER İLE GÖRÜNÜR) --- */}
                {/* Sadece kendi profilimse VE bu bir kütüphane öğesiyse (mediaItem varsa) göster */}
                {isOwnProfile && item.mediaItem && (
                    <button
                        onClick={(e) => {
                            e.preventDefault(); // Linke gitmeyi engelle
                            e.stopPropagation(); // Tıklama olayının yayılmasını engelle
                            handleRemoveFromLibrary(entryId);
                        }}
                        className="absolute top-2 left-2 p-2 bg-red-600/90 rounded-xl text-white 
                       opacity-0 group-hover:opacity-100 transition-all duration-300 
                       hover:bg-red-700 hover:scale-110 shadow-lg z-20"
                        title="Kütüphaneden Kaldır"
                    >
                        <Trash className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    };

    // --- LOADING ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#050B12] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#3DD9B4] animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-[#050B12] flex items-center justify-center text-white">
                <div>
                    <h2 className="text-xl">Kullanıcı Bulunamadı 😕</h2>
                    <Link to="/" className="text-[#3DD9B4] mt-4 block">
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    // --- TABS ---
    const tabs = [
        { id: "watched", label: "İzlediklerim", count: watchedMovies.length },
        { id: "watchlist", label: "İzlenecekler", count: watchlistMovies.length },
        { id: "read", label: "Okuduklarım", count: readBooks.length },
        { id: "toread", label: "Okunacaklar", count: toreadBooks.length },
        { id: "lists", label: "Özel Listeler", count: customLists.length },
    ];

    return (
        <div className="min-h-screen bg-[#050B12]">
            {/* --- HEADER --- */}
            <div className="relative">
                <div className="h-80 bg-[#050B12]"></div>

                <div className="container mx-auto px-4 relative">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-24">
                        <img
                            src={
                                user.profilePictureUrl
                                    ? user.profilePictureUrl.startsWith("http")
                                        ? user.profilePictureUrl // Eğer Google/Link ise olduğu gibi kullan
                                        : `${API_BASE_URL}/${user.profilePictureUrl}` // Eğer dosya ise başına localhost ekle
                                    : "https://placehold.co/400x400?text=No+Image" // Veri yoksa varsayılan
                            }
                            className="w-40 h-40 rounded-3xl object-cover border-4 border-[#050B12] bg-[#0A1A2F]"
                            onError={(e) => {
                                // Resim yüklenemezse (kırık link) gri kutu göster
                                e.currentTarget.src = "https://placehold.co/400x400?text=Hata";
                            }}
                        />

                        <div className="flex-1 pb-2">
                            <h2 className="text-white text-2xl font-bold">{user.username}</h2>
                            <p className="text-[#3DD9B4]">@{user.username}</p>
                            <p className="text-gray-300 max-w-2xl mt-3">
                                {user.bio || "Henüz bir biyografi eklenmemiş."}
                            </p>

                            <div className="flex gap-6 text-gray-300 mt-4">
                                <div>
                                    <span className="text-white font-bold">
                                        {user.followersCount || 0}
                                    </span>{" "}
                                    Takipçi
                                </div>

                                <div>
                                    <span className="text-white font-bold">
                                        {user.followingCount || 0}
                                    </span>{" "}
                                    Takip Edilen
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {isOwnProfile ? (
                                <>
                                    <Link to={`/profile/${user.username}/edit`}>
                                        <button className="px-6 py-3 bg-[#0A1A2F] text-gray-300 rounded-2xl border border-[#0A1A2F] hover:bg-[#3DD9B4]/10 hover:text-[#3DD9B4]">
                                            <Settings className="w-5 h-5 inline-block" /> Profili
                                            Düzenle
                                        </button>
                                    </Link>

                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="px-6 py-3 rounded-2xl bg-[#FFD65A] text-[#050B12]"
                                    >
                                        <Plus className="w-5 h-5 inline-block" /> Liste Oluştur
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={handleFollowToggle}
                                    className={`px-6 py-3 rounded-2xl ${isFollowing
                                            ? "bg-[#0A1A2F] text-gray-300"
                                            : "bg-[#3DD9B4] text-[#050B12]"
                                        }`}
                                >
                                    {isFollowing ? (
                                        <>
                                            <UserMinus className="w-5 h-5 inline-block" /> Takipten
                                            Çık
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5 inline-block" /> Takip Et
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TABS --- */}
            <div className="border-b border-[#0A1A2F] sticky top-[72px] bg-[#050B12]/95 backdrop-blur-lg z-40 mt-8">
                <div className="container mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-4 border-b-2 whitespace-nowrap ${activeTab === tab.id
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

            {/* --- İÇERİK ALANI --- */}
            <div className="container mx-auto px-4 py-12">
                {/* --- ÖZEL LİSTELER --- */}
                {activeTab === "lists" && (
                    <div className="max-w-4xl space-y-4">
                        {customLists.length > 0 ? (
                            customLists.map((list, idx) => (
                                <div
                                    key={list.id || idx}
                                    className="relative bg-[#0A1A2F]/70 hover:bg-[#0A1A2F]/80 backdrop-blur-lg 
          rounded-3xl p-6 border border-[#0A1A2F] hover:border-[#3DD9B4]/30 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        {/* SOL TARAF — TIKLANABİLİR ALAN */}
                                        <Link to={`/list/${list.id}`} className="block flex-1">
                                            <h4 className="text-white mb-1 group-hover:text-[#3DD9B4] transition-colors cursor-pointer">
                                                {list.name || list.title}
                                            </h4>
                                            <p className="text-gray-400 text-sm">
                                                {list.count || 0} öğe
                                            </p>
                                        </Link>

                                        {/* SAĞ TARAF — Menü + cover, tıklamayı engeller */}
                                        <div
                                            className="flex items-center gap-4"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            {/* Covers */}
                                            <div className="flex -space-x-3">
                                                {list.covers?.length > 0 ? (
                                                    list.covers.map((item: any, i: number) => (
                                                        <img
                                                            key={i}
                                                            src={item.poster}
                                                            className="w-12 h-16 rounded-lg object-cover border-2 border-[#050B12]"
                                                            style={{ zIndex: 10 - i }}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="w-12 h-16 bg-[#0A1A2F] border border-[#050B12] flex items-center justify-center rounded-lg">
                                                        <List className="w-6 h-6 text-gray-500" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Menü */}
                                            {isOwnProfile && (
                                                <div className="relative z-50">
                                                    <button
                                                        onClick={() =>
                                                            setOpenMenu(openMenu === list.id ? null : list.id)
                                                        }
                                                        className="p-2 rounded-xl hover:bg-[#3DD9B4]/10"
                                                    >
                                                        <MoreVertical className="w-5 h-5 text-gray-300" />
                                                    </button>

                                                    {openMenu === list.id && (
                                                        <div
                                                            className="absolute right-0 mt-2 w-40 bg-[#0A1A2F] 
          border border-[#0A1A2F] rounded-xl shadow-xl z-50"
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setRenameModal({ open: true, list });
                                                                    setOpenMenu(null);
                                                                }}
                                                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-[#3DD9B4]/10 text-gray-300"
                                                            >
                                                                <Edit className="w-4 h-4" /> Düzenle
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteList(list.id)}
                                                                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-red-500/10 text-red-400"
                                                            >
                                                                <Trash className="w-4 h-4" /> Sil
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-gray-500 text-center py-12">
                                Henüz liste oluşturulmamış.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "watched" && (
                    <>
                        {isOwnProfile && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => {
                                        setSearchType("movie");
                                        setLibraryTypeToAdd(4);
                                        setShowAddContentModal(true);
                                    }}
                                    className="px-4 py-2 bg-[#3DD9B4] text-[#050B12] rounded-xl"
                                >
                                    + Ekle
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {watchedMovies.map((item, idx) => (
                                <ContentCard key={idx} item={item} type="movie" />
                            ))}
                        </div>
                    </>
                )}
                {activeTab === "watchlist" && (
                    <>
                        {isOwnProfile && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => {
                                        setSearchType("movie");
                                        setLibraryTypeToAdd(3);
                                        setShowAddContentModal(true);
                                    }}
                                    className="px-4 py-2 bg-[#3DD9B4] text-[#050B12] rounded-xl"
                                >
                                    + Ekle
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {watchlistMovies.map((item, idx) => (
                                <ContentCard key={idx} item={item} type="movie" />
                            ))}
                        </div>
                    </>
                )}

                {activeTab === "read" && (
                    <>
                        {isOwnProfile && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => {
                                        setSearchType("book");
                                        setLibraryTypeToAdd(2);
                                        setShowAddContentModal(true);
                                    }}
                                    className="px-4 py-2 bg-[#3DD9B4] text-[#050B12] rounded-xl"
                                >
                                    + Ekle
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {readBooks.map((item, idx) => (
                                <ContentCard key={idx} item={item} type="book" />
                            ))}
                        </div>
                    </>
                )}

                {activeTab === "toread" && (
                    <>
                        {isOwnProfile && (
                            <div className="flex justify-end mb-6">
                                <button
                                    onClick={() => {
                                        setSearchType("book");
                                        setLibraryTypeToAdd(1);
                                        setShowAddContentModal(true);
                                    }}
                                    className="px-4 py-2 bg-[#3DD9B4] text-[#050B12] rounded-xl"
                                >
                                    + Ekle
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {toreadBooks.map((item, idx) => (
                                <ContentCard key={idx} item={item} type="book" />
                            ))}
                        </div>
                    </>
                )}
            </div>
            {/* --- SON AKTİVİTELER (Her zaman en altta görünsün) --- */}
            {userActivities.length > 0 && (
                <div className="container mx-auto px-4 mb-20 mt-16">
                    <h3 className="text-white mb-6 text-xl font-bold">Son Aktiviteler</h3>

                    <div className="max-w-3xl space-y-6">
                        {userActivities.map((activity) => (
                            <div
                                key={activity.activityId}
                                className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 
          backdrop-blur-lg rounded-3xl p-6 border border-[#0A1A2F]"
                            >
                                {/* Üst Bilgi */}
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-gray-400 text-sm">
                                        {new Date(activity.createdAt).toLocaleDateString("tr-TR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })}
                                    </span>

                                    <span className="text-gray-600">•</span>

                                    <span className="text-gray-400 text-sm">
                                        {activity.actionText}
                                    </span>
                                </div>

                                {/* İçerik Kartı */}
                                <Link to={`/content/${activity.content.contentId}`}>
                                    <div className="flex gap-4">
                                        <img
                                            src={activity.content.posterUrl}
                                            alt={activity.content.title}
                                            className="w-20 h-28 rounded-2xl object-cover"
                                        />

                                        <div className="flex-1">
                                            <h4 className="text-white mb-2">
                                                {activity.content.title}
                                            </h4>

                                            {/* Rating varsa göster */}
                                            {activity.type === 2 && (
                                                <div className="flex items-center gap-1 mb-3">
                                                    <Star className="w-4 h-4 text-[#FFD65A] fill-[#FFD65A]" />
                                                    <span className="text-[#FFD65A]">
                                                        {activity.ratingScore}/10
                                                    </span>
                                                </div>
                                            )}

                                            {/* Review varsa göster */}
                                            {activity.reviewExcerpt && (
                                                <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                                                    {activity.reviewExcerpt}
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

            {/* --- LİSTE OLUŞTURMA MODALI --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0"
                        onClick={() => setShowCreateModal(false)}
                    />

                    <div className="bg-[#0A1A2F] rounded-3xl p-8 max-w-md w-full border border-[#3DD9B4]/30 relative z-10">
                        <h3 className="text-white text-xl mb-6">Yeni Liste Oluştur</h3>

                        <input
                            type="text"
                            placeholder="Liste Adı"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="w-full bg-[#050B12] border border-gray-700 rounded-xl px-4 py-3 text-white mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300"
                            >
                                İptal
                            </button>

                            <button
                                onClick={handleCreateList}
                                className="flex-1 py-3 rounded-xl bg-[#3DD9B4] text-[#050B12]"
                            >
                                Oluştur
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- LİSTE DÜZENLEME MODALI --- */}
            {renameModal.open && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0"
                        onClick={() => setRenameModal({ open: false, list: null })}
                    />

                    <div className="bg-[#0A1A2F] rounded-3xl p-8 max-w-md w-full border border-[#3DD9B4]/30 relative z-10">
                        <h3 className="text-white text-xl mb-6">Liste Adını Düzenle</h3>

                        <input
                            type="text"
                            value={renameModal.list?.name || ""}
                            onChange={(e) =>
                                setRenameModal({
                                    ...renameModal,
                                    list: { ...renameModal.list, name: e.target.value },
                                })
                            }
                            className="w-full bg-[#050B12] border border-gray-700 rounded-xl px-4 py-3 text-white mb-4"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRenameModal({ open: false, list: null })}
                                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-300"
                            >
                                İptal
                            </button>

                            <button
                                onClick={handleRenameListSave}
                                className="flex-1 py-3 rounded-xl bg-[#3DD9B4] text-[#050B12]"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- İÇERİK EKLEME MODALI (GÜNCELLENMİŞ HALİ) --- */}
            {/* --- GÜNCELLENMİŞ İÇERİK EKLEME MODALI --- */}
            {/* --- İÇERİK EKLEME MODALI (SCROLL FIXED) --- */}
            {showAddContentModal && isOwnProfile && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div
                        className="bg-[#0A1A2F] rounded-3xl w-full max-w-lg border border-[#3DD9B4]/30 
                    flex flex-col shadow-2xl overflow-hidden"
                    >
                        {/* ÜST KISIM */}
                        <div className="p-6 pb-2 flex-shrink-0">
                            <h3 className="text-white text-xl mb-4 font-bold">
                                {searchType === "movie" ? "Film Ekle" : "Kitap Ekle"}
                            </h3>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-[#050B12] border border-gray-700 rounded-xl px-4 py-2 
                   text-white text-sm focus:outline-none focus:border-[#3DD9B4]"
                                />

                                <button
                                    onClick={handleSearch}
                                    className="px-4 py-2 bg-[#3DD9B4] text-[#050B12] rounded-xl font-bold text-sm"
                                >
                                    Ara
                                </button>
                            </div>
                        </div>

                        {/* SCROLL OLAN KISIM */}
                        <div
                            className="px-6 py-3 space-y-3 overflow-y-auto"
                            style={{ maxHeight: "50vh" }}
                        >
                            {searchLoading && (
                                <div className="text-gray-400 text-center py-4 text-sm">
                                    Aranıyor...
                                </div>
                            )}

                            {!searchLoading && searchResults.length === 0 && searchTerm && (
                                <div className="text-gray-500 text-center py-4 text-sm">
                                    Sonuç yok.
                                </div>
                            )}

                            {!searchLoading &&
                                searchResults.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={async () => {
                                            await api.addToUserLibrary(item.id, libraryTypeToAdd);
                                            toast.success("Eklendi!");
                                            setShowAddContentModal(false);
                                        }}
                                        className="flex items-center gap-3 bg-[#050B12] p-3 rounded-xl border border-[#0A1A2F]
                     cursor-pointer hover:border-[#3DD9B4] transition-all"
                                    >
                                        <img
                                            src={item.posterUrl || item.coverImageUrl}
                                            className="w-10 h-14 rounded-lg object-cover bg-gray-800"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {item.releaseYear || "-"}
                                            </p>
                                        </div>

                                        <div
                                            className="w-8 h-8 rounded-full bg-[#0A1A2F] flex items-center justify-center 
                          hover:bg-[#3DD9B4] transition"
                                        >
                                            <Plus className="w-4 h-4 text-gray-400 hover:text-[#050B12]" />
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* ALT KAPAT BUTONU */}
                        <div className="p-6 pt-2 flex-shrink-0 bg-[#0A1A2F]">
                            <button
                                onClick={() => setShowAddContentModal(false)}
                                className="w-full py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
