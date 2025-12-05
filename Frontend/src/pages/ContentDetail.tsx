import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Star,
    Clock,
    Users,
    BookOpen,
    Eye,
    Plus,
    Bookmark,
    Check,
    X,
    Loader2, // Loading ikonu eklendi
} from "lucide-react";
import RatingWidget from "../components/RatingWidget";
import CommentSection from "../components/CommentSection";
import { api } from "../services/api";
import { toast } from "sonner";

// Özel Liste Tipi Tanımı
interface CustomList {
    id: number;
    name: string;
}

// Yeni Kütüphane Status Kodları:
// 1 = Kitap/Okunacak (WantToRead)
// 2 = Kitap/Okudum (Read)
// 3 = Film/İzlenecek (WantToWatch)
// 4 = Film/İzledim (Watched)

export default function ContentDetail() {
    const { id } = useParams();
    const mediaId = Number(id) || 1;
    const [content, setContent] = useState<any | null>(null);

    // --- RATING & REVIEW STATE ---
    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [existingRatingId, setExistingRatingId] = useState<number | null>(null);
    const [existingReviewId, setExistingReviewId] = useState<number | null>(null);

    // --- KÜTÜPHANE STATE ---
    const [userId, setUserId] = useState<number | null>(null);
    const [loadingAction, setLoadingAction] = useState(false); // Loading state'i eklendi

    // Tamamlandı (Watched/Read) durumu ve ID'si
    const [isWatched, setIsWatched] = useState(false);
    const [watchedEntryId, setWatchedEntryId] = useState<number | null>(null);

    // Plan (WantToWatch/WantToRead) durumu ve ID'si
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [watchlistEntryId, setWatchlistEntryId] = useState<number | null>(null);

    // --- ÖZEL LİSTE MODAL STATE ---
    const [showListModal, setShowListModal] = useState(false);
    const [myLists, setMyLists] = useState<CustomList[]>([]); // API'den gelen liste tipi kullanıldı
    const [listMap, setListMap] = useState<Record<number, number>>({}); // {customListId: customListItemId}
    const [newListName, setNewListName] = useState("");
    const [isCreatingList, setIsCreatingList] = useState(false);

    // Medya türünü hızlı erişim için hesapla
    const isMovie = content?.type === 2 || content?.mediaType === "Movie";


    // --- YARDIMCI FONKSİYON: PUAN/YORUM SIFIRLAMA ---
    const deleteUserRatingAndReview = async () => {
        // Puanı sil
        if (existingRatingId) {
            await api.deleteRating(existingRatingId);
            setExistingRatingId(null);
            setUserRating(0);
        }

        // Yorumu sil
        if (existingReviewId) {
            await api.deleteReview(existingReviewId);
            setExistingReviewId(null);
            setReviewText("");
        }
    };


    // --- SAYFA YÜKLENİRKEN VERİ ÇEKME ---
    useEffect(() => {
        const storedUserId = localStorage.getItem("userId");
        const currentUserId = storedUserId ? parseInt(storedUserId) : null;
        setUserId(currentUserId);

        const load = async () => {
            try {
                // 1) Medya detayını çek
                const media = await api.getMediaItemById(mediaId);
                setContent(media || { title: "Yüklenemedi", description: "Veri yok" });



                if (currentUserId) {
                    const isMovieMedia = media?.type === 2 || media?.mediaType === "Movie";

                    // 2) Paralel veri: Rating, Review, Library
                    const [userRatingDto, userReviewDto, libraryEntries, customLists] =
                        await Promise.all([
                            api.getUserRatingForMedia(mediaId),
                            api.getUserReviewForMedia(mediaId),
                            api.getUserLibrary(currentUserId),
                            api.getUserCustomLists(currentUserId) // Custom listeleri çek
                        ]);

                    console.log("API → USER RATING DTO:", userRatingDto)

                    // --- Rating yükle ---
                    if (userRatingDto && userRatingDto.score > 0) {
                        setUserRating(userRatingDto.score);
                        setExistingRatingId(userRatingDto.id);
                    } 

                    // --- Review yükle ---
                    if (userReviewDto) {
                        setReviewText(userReviewDto.content);
                        setExistingReviewId(userReviewDto.id);
                    } else {
                        setReviewText("");
                        setExistingReviewId(null);
                    }

                    // --- Library durumu ---
                    const watchedStatus = isMovieMedia ? 4 : 2; // Filmse Watched(4), kitapsa Read(2)
                    const watchlistStatus = isMovieMedia ? 3 : 1; // Filmse WantToWatch(3), kitapsa WantToRead(1)

                    // Tamamlanan durum
                    const watchedEntry = libraryEntries.find(
                        (e: any) =>
                            e.mediaItemId === mediaId && e.status === watchedStatus
                    );
                    // Planlanan durum
                    const watchlistEntry = libraryEntries.find(
                        (e: any) =>
                            e.mediaItemId === mediaId && e.status === watchlistStatus
                    );

                    setIsWatched(!!watchedEntry);
                    setWatchedEntryId(watchedEntry?.id ?? null);
                    setIsWatchlist(!!watchlistEntry);
                    setWatchlistEntryId(watchlistEntry?.id ?? null);

                    // --- Custom Listeler ---
                    setMyLists(customLists || []);
                    // Detaylı liste kontrolü modal açılışında yapılacak (performans için)
                }
            } catch (err: any) {
                console.error(err);
                toast.error("İçerik yüklenirken bir hata oluştu.");
            }
        };

        load();
    }, [mediaId]);

    // --- ÖZEL LİSTE MODAL AÇILINCA LİSTELERİ ÇEK (API'ye göre güncel) ---
    useEffect(() => {
        if (showListModal && userId) {
            const fetchLists = async () => {
                try {
                    const lists = await api.getUserCustomLists(userId);
                    setMyLists(lists);

                    const mapping: Record<number, number> = {};
                    await Promise.all(
                        lists.map(async (list: any) => {
                            const items = await api.getCustomListItems(list.id);
                            const foundItem = items.find(
                                (i: any) => i.mediaItemId === mediaId
                            );
                            if (foundItem) {
                                mapping[list.id] = foundItem.id; // CustomListItem ID
                            }
                        })
                    );
                    setListMap(mapping);
                } catch (error) {
                    console.error(error);
                    toast.error("Listeler yüklenemedi.");
                }
            };
            fetchLists();
        }
    }, [showListModal, userId, mediaId]);

    // --- KÜTÜPHANE İŞLEMLERİ (EN ÖNEMLİ KISIM) ---
    /**
     * @param {'WATCHED' | 'WATCHLIST'} targetType - Hangi butona basıldığı
     */
    const handleLibraryAction = async (targetType: 'WATCHED' | 'WATCHLIST') => {
        if (!userId) {
            toast.error("Lütfen giriş yapın.");
            return;
        }

        setLoadingAction(true);
        try {
            // Tamamlanan durum mu? 
            const isTargetFinished = targetType === 'WATCHED';

            // Hangi state ve ID'yi kullanacağımızı belirle
            const currentEntryId = isTargetFinished ? watchedEntryId : watchlistEntryId;
            const currentState = isTargetFinished ? isWatched : isWatchlist;

            // Backend Status Kodları
            const status = isTargetFinished
                ? (isMovie ? 4 : 2) // Tamamlandı (Watched/Read)
                : (isMovie ? 3 : 1); // Planlandı (WantToWatch/WantToRead)

            // Toast Mesajları için dinamik metin oluşturma
            const actionName = isTargetFinished
                ? isMovie ? "İzlenenler" : "Okunanlar"
                : isMovie ? "İzlenecekler" : "Okunacaklar";

            if (currentState && currentEntryId) {
                // Zaten ekli -> SİL (DELETE)
                await api.deleteLibraryEntry(currentEntryId);

                let otherListActive = false;

                if (isTargetFinished) {
                    setIsWatched(false);
                    setWatchedEntryId(null);
                    // Diğer liste (Plan) aktif mi?
                    otherListActive = isWatchlist;
                } else {
                    setIsWatchlist(false);
                    setWatchlistEntryId(null);
                    // Diğer liste (Tamamlanan) aktif mi?
                    otherListActive = isWatched;
                }

                toast.success(`${actionName}'den çıkarıldı.`);

                // Eğer diğer listede DEĞİLSE (yani içerik kütüphaneden tamamen çıktıysa) değerlendirmeyi de sıfırla
                if (!otherListActive) {
                    await deleteUserRatingAndReview();
                    toast.info("Değerlendirmeniz de sıfırlandı."); // Ek bilgi mesajı
                }

            } else {
                // Ekli değil -> EKLE (POST)
                const res = await api.addLibraryEntry(
                    mediaId,
                    status,
                    isTargetFinished ? new Date() : null
                );

                if (isTargetFinished) {
                    setIsWatched(true);
                    setWatchedEntryId(res.id);
                    toast.success(`${actionName} listesine eklendi.`);

                    // Plan listesindeyse oradan çıkar
                    if (isWatchlist && watchlistEntryId) {
                        await api.deleteLibraryEntry(watchlistEntryId);
                        setIsWatchlist(false);
                        setWatchlistEntryId(null);
                    }
                } else {
                    setIsWatchlist(true);
                    setWatchlistEntryId(res.id);
                    toast.success(`${actionName} listesine eklendi.`);

                    // Tamamlananlardaysa oradan çıkar
                    if (isWatched && watchedEntryId) {
                        await api.deleteLibraryEntry(watchedEntryId);
                        setIsWatched(false);
                        setWatchedEntryId(null);
                    }
                }
            }
        } catch (error) {
            console.error(error);
            toast.error("İşlem başarısız.");
        } finally {
            setLoadingAction(false);
        }
    };

    // --- ÖZEL LİSTE İŞLEMLERİ ---
    const toggleList = async (listId: number) => {
        if (!userId) return;

        const existingItemId = listMap[listId]; // bu listede var mı?

        try {
            if (existingItemId) {
                // listeden çıkar
                await api.deleteCustomListItem(existingItemId);
                const newMap = { ...listMap };
                delete newMap[listId];
                setListMap(newMap);
                toast.success("Listeden kaldırıldı.");
            } else {
                // listeye ekle
                const res = await api.addCustomListItem(listId, mediaId);
                setListMap((prev) => ({ ...prev, [listId]: res.id }));
                toast.success("Listeye eklendi.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Liste güncellenemedi.");
        }
    };

    const createNewList = async () => {
        if (!newListName.trim() || !userId) return;
        try {
            const newList = await api.addCustomList(newListName, "");
            setMyLists((prev) => [...prev, newList]);

            // yeni oluşturulan listeye bu içeriği de ekle
            const itemRes = await api.addCustomListItem(newList.id, mediaId);
            setListMap((prev) => ({ ...prev, [newList.id]: itemRes.id }));

            setNewListName("");
            setIsCreatingList(false);
            toast.success("Liste oluşturuldu ve içerik eklendi.");
        } catch (error) {
            console.error(error);
            toast.error("Liste oluşturulamadı.");
        }
    };

    // --- REVIEW GÖNDERME (ESKİ KODUN GÜVENLİ VERSİYONU) ---
    const handleSendReview = async () => {
        if (!content) return;
        if (!userId) return toast.error("Lütfen giriş yapın.");

        try {
            let ratingId = existingRatingId;
            let reviewId = existingReviewId;
            let updated = false;
            let ratingChanged = false;
            let reviewChanged = false;

            // 1) PUAN İŞLEMİ
            if (userRating > 0) {
                if (ratingId) {
                    await api.updateRating(ratingId, userRating);
                    ratingChanged = true;
                } else {
                    const res = await api.addRating(content.id, userRating);
                    if (res && res.id) {
                        ratingId = res.id;
                        setExistingRatingId(res.id);
                    }
                    ratingChanged = true;
                }
                updated = true;
            }

            // 2) İNCELEME İŞLEMİ
            if (reviewText.trim().length > 0) {
                if (reviewId) {
                    await api.updateReview(reviewId, reviewText);
                    reviewChanged = true;
                } else {
                    const res = await api.addReview(content.id, reviewText);
                    if (res && res.id) {
                        reviewId = res.id;
                        setExistingReviewId(res.id);
                    }
                    reviewChanged = true;
                }
                updated = true;
            }

            if (updated) {
                // 3) GÜVENLİ GÜNCELLEME: Global content ve kendi rating/review ID'lerini güncelle
                const [refreshedMedia, refreshedUserRating, refreshedUserReview] = await Promise.all([
                    api.getMediaItemById(content.id),
                    ratingChanged ? api.getUserRatingForMedia(content.id) : Promise.resolve(null),
                    reviewChanged ? api.getUserReviewForMedia(content.id) : Promise.resolve(null),
                ]);

                setContent(refreshedMedia);

                if (refreshedUserRating) setExistingRatingId(refreshedUserRating.id);
                if (refreshedUserReview) setExistingReviewId(refreshedUserReview.id);

                toast.success("Değerlendirmeniz kaydedildi.");
            } else {
                toast.info("Kaydedilecek bir değişiklik yapmadınız.");
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Kaydedilirken bir hata oluştu.");
        }
    };

    if (!content) {
        return (
            <div className="min-h-screen bg-[#050B12] flex items-center justify-center text-white">
                Yükleniyor...
            </div>
        );
    }

    // isMovie'yi burada yeniden hesapla (content yüklendikten sonra)
    const genreList = content.genres
        ? content.genres.split(",")
        : ["Dram", "Bilim Kurgu"];
    const averageRating: number = content.averageRating ?? 0;
    const reviewCount: number = content.reviewCount ?? 0;

    return (
        <div className="min-h-screen bg-[#050B12]">
            {/* HERO */}
            <div className="relative h-[60vh] overflow-hidden">
                <img
                    src={content.coverImageUrl || "https://via.placeholder.com/1920x1080"}
                    alt={content.title}
                    className="w-full h-full object-cover blur-2xl opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B12] via-[#050B12]/80 to-transparent" />

                <div className="absolute inset-0 container mx-auto px-4 flex items-end pb-12">
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                        <img
                            src={content.coverImageUrl || "https://via.placeholder.com/300x450"}
                            alt={content.title}
                            className="w-56 h-80 rounded-3xl object-cover shadow-2xl"
                        />

                        <div className="flex-1 pb-4">
                            <h1 className="text-white mb-2 text-4xl font-bold">{content.title}</h1>

                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-gray-400">{content.releaseYear}</span>
                                <span className="text-gray-600">•</span>

                                {isMovie ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span>{content.durationOrPages ?? "-"} dakika</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{content.durationOrPages ?? "-"} sayfa</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {genreList.map((g: string) => (
                                    <span
                                        key={g}
                                        className="px-4 py-1.5 bg-[#3DD9B4]/20 text-[#3DD9B4] rounded-xl border border-[#3DD9B4]/30"
                                    >
                                        {g.trim()}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <Star className="w-6 h-6 text-[#FFD65A] fill-[#FFD65A]" />
                                <span className="text-white text-xl font-semibold">
                                    {averageRating.toFixed(1)}/10
                                </span>
                                <span className="text-gray-500 text-sm ml-2">({reviewCount} değerlendirme)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAY ALANI */}
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* SOL ANA İÇERİK */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* ABOUT */}
                        <section>
                            <h3 className="text-white mb-4 text-2xl font-bold">Hakkında</h3>
                            <p className="text-gray-300 leading-relaxed mb-6 text-lg">
                                {content.description || "Açıklama bulunmuyor."}
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <p className="text-gray-300">
                                    <span className="text-gray-500 block text-sm mb-1">{isMovie ? "Yönetmen" : "Yazar"}</span>
                                    <span className="text-white font-medium">{content.creator || "Bilinmiyor"}</span>
                                </p>

                                <p className="text-gray-300">
                                    <span className="text-gray-500 block text-sm mb-1">Yayın Tarihi</span>
                                    <span className="text-white font-medium">{content.releaseDate ? new Date(content.releaseDate).toLocaleDateString() : content.releaseYear}</span>
                                </p>
                            </div>
                        </section>

                        {/* PUAN & İNCELEME */}
                        <section className="bg-[#0A1A2F]/70 rounded-3xl p-8 border border-[#0A1A2F]">
                            <h3 className="text-white mb-6 text-xl font-bold flex items-center gap-2">
                                <Star className="w-5 h-5 text-[#FFD65A]" />
                                Değerlendir
                            </h3>

                            <div className="flex flex-col gap-6">
                                <div>
                                    <p className="text-gray-400 mb-3 text-sm">Puanınız:</p>
                                    <RatingWidget key={userRating} currentRating={userRating} onRate={setUserRating} />
                                </div>

                                <div className="mt-2">
                                    <textarea
                                        placeholder={`Bu ${isMovie ? "film" : "kitap"} hakkında ne düşünüyorsunuz?`}
                                        rows={4}
                                        value={reviewText}
                                        onChange={(e) => setReviewText(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border border-[#1E293B] text-white focus:border-[#3DD9B4] focus:outline-none transition-colors"
                                    />

                                    <div className="flex justify-end mt-4">
                                        <button
                                            onClick={handleSendReview}
                                            className="px-8 py-3 rounded-xl bg-[#3DD9B4] text-[#050B12] font-semibold hover:bg-[#34D399] transition-all shadow-lg shadow-[#3DD9B4]/20"
                                        >
                                            {existingRatingId || existingReviewId ? "Güncelle" : "Kaydet"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* COMMENTS */}
                        <section className="bg-[#0A1A2F]/70 rounded-3xl p-8 border border-[#0A1A2F]">
                            <CommentSection mediaId={mediaId} />
                        </section>
                    </div>

                    {/* SAĞ SIDEBAR - KÜTÜPHANE & LİSTELER */}
                    <div className="space-y-6">
                        <div className="bg-[#0A1A2F]/70 p-6 rounded-3xl border border-[#0A1A2F] space-y-3 sticky top-24">
                            <h4 className="text-white mb-4 font-semibold">Kütüphaneye Ekle</h4>

                            {/* TAMAMLANDI (Film: Watched(4), Kitap: Read(2)) */}
                            <button
                                onClick={() => handleLibraryAction('WATCHED')}
                                disabled={loadingAction}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-medium ${isWatched
                                    ? "bg-[#3DD9B4] text-[#050B12]"
                                    : "bg-[#050B12] text-gray-300 hover:bg-[#1E293B]"
                                    }`}
                            >
                                {loadingAction && isWatched ? <Loader2 className="w-5 h-5 animate-spin" /> : <Eye className="w-5 h-5" />}
                                {isMovie ? "İzledim" : "Okudum"}
                            </button>

                            {/* PLAN (Film: WantToWatch(3), Kitap: WantToRead(1)) */}
                            <button
                                onClick={() => handleLibraryAction('WATCHLIST')}
                                disabled={loadingAction}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-medium ${isWatchlist
                                    ? "bg-[#FFD65A] text-[#050B12]"
                                    : "bg-[#050B12] text-gray-300 hover:bg-[#1E293B]"
                                    }`}
                            >
                                {loadingAction && isWatchlist ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bookmark className="w-5 h-5" />}
                                {isWatchlist ? "Listede" : (isMovie ? "İzlenecek" : "Okunacak")}
                            </button>

                            {/* ÖZEL LİSTE BUTONU */}
                            <button
                                onClick={() => setShowListModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#050B12] text-gray-300 hover:bg-[#1E293B] transition-all font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                Özel Listeye Ekle
                            </button>

                            <div className="pt-6 mt-6 border-t border-[#1E293B]">
                                <h4 className="text-white mb-4 font-semibold">İstatistikler</h4>
                                <div className="flex justify-between text-gray-300 mb-2">
                                    <span className="flex items-center gap-2 text-sm">
                                        <Users className="w-4 h-4 text-[#3DD9B4]" />
                                        Değerlendirmeler
                                    </span>
                                    <span className="font-mono">{reviewCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LİSTE MODAL */}
            {showListModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={() => setShowListModal(false)} />
                    <div className="bg-[#0A1A2F] rounded-3xl p-8 max-w-md w-full border border-[#3DD9B4]/30 relative z-10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white text-xl font-semibold">Listeye Ekle</h3>
                            <button onClick={() => setShowListModal(false)}>
                                <X className="w-6 h-6 text-gray-400 hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {myLists.length === 0 && (
                                <p className="text-center text-gray-500 text-sm">
                                    Henüz bir listeniz yok.
                                </p>
                            )}

                            {myLists.map((list) => {
                                const isSelected = !!listMap[list.id];
                                return (
                                    <button
                                        key={list.id}
                                        onClick={() => toggleList(list.id)}
                                        className={`w-full px-4 py-4 rounded-2xl border flex justify-between items-center transition-all ${isSelected
                                            ? "bg-[#3DD9B4]/10 border-[#3DD9B4] text-[#3DD9B4]"
                                            : "bg-[#050B12] border-[#1E293B] text-gray-300 hover:border-gray-500"
                                            }`}
                                    >
                                        <span>{list.name}</span>
                                        {isSelected && (
                                            <Check className="w-5 h-5" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {isCreatingList ? (
                            <div className="flex gap-2 mb-6">
                                <input
                                    className="flex-1 bg-[#050B12] border border-[#3DD9B4] rounded-xl px-4 py-3 text-white focus:outline-none"
                                    placeholder="Liste adı..."
                                    value={newListName}
                                    onChange={(e) =>
                                        setNewListName(e.target.value)
                                    }
                                    autoFocus
                                />
                                <button
                                    onClick={createNewList}
                                    className="bg-[#3DD9B4] px-4 text-[#050B12] rounded-xl font-medium"
                                >
                                    Ekle
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreatingList(true)}
                                className="text-gray-400 hover:text-[#3DD9B4] mb-6 flex items-center gap-2 transition-colors"
                            >
                                <Plus className="w-5 h-5" /> Yeni liste oluştur
                            </button>
                        )}

                        <button
                            onClick={() => setShowListModal(false)}
                            className="w-full px-6 py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] text-lg font-bold hover:bg-[#FFC940] transition-colors"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}