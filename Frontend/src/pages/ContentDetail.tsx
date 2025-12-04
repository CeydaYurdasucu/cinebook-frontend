import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Clock, Users, BookOpen, Eye, Plus, Bookmark, Check, X } from "lucide-react";
import RatingWidget from "../components/RatingWidget";
import CommentSection from "../components/CommentSection";
import { api } from "../services/api";
import { toast } from "sonner";

export default function ContentDetail() {
    const { id } = useParams();
    const [content, setContent] = useState<any | null>(null);

    const [userRating, setUserRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [existingRatingId, setExistingRatingId] = useState<number | null>(null);
    const [existingReviewId, setExistingReviewId] = useState<number | null>(null);

    const [isWatched, setIsWatched] = useState(false);
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [showListModal, setShowListModal] = useState(false);

    // List Modal State
    const [myLists, setMyLists] = useState(["Favoriler", "Kış 2024 İzlenecekler", "Mutlaka İzle"]);
    const [selectedLists, setSelectedLists] = useState<string[]>([]);
    const [newListName, setNewListName] = useState("");
    const [isCreatingList, setIsCreatingList] = useState(false);

    const mediaId = Number(id) || 1; // ID yoksa mock data için 1 kullan

    // --- SAYFA AÇILIRKEN: MediaItem + Kullanıcının rating/review'u ---
    useEffect(() => {
        const load = async () => {
            try {
                // Promise.all ile tüm gerekli verileri aynı anda çekiyoruz
                const [media, userRatingDto, userReviewDto] = await Promise.all([
                    api.getMediaItemById(mediaId),
                    api.getUserRatingForMedia(mediaId),
                    api.getUserReviewForMedia(mediaId),
                ]);

                setContent(media || { title: "Yüklenemedi", description: "Veri yok" });

                // Kullanıcının Puanını İşle
                if (userRatingDto && userRatingDto.score > 0) {
                    setUserRating(userRatingDto.score);
                    setExistingRatingId(userRatingDto.id);
                } else {
                    setUserRating(0);
                    setExistingRatingId(null);
                }

                // Kullanıcının İncelemesini İşle
                if (userReviewDto) {
                    setReviewText(userReviewDto.content);
                    setExistingReviewId(userReviewDto.id);
                } else {
                    setReviewText("");
                    setExistingReviewId(null);
                }

            } catch (err: any) {
                console.error(err);
                toast.error("İçerik yüklenirken bir hata oluştu.");
            }
        };

        load();
    }, [mediaId]);

    if (!content) {
        return (
            <div className="min-h-screen bg-[#050B12] flex items-center justify-center text-white">
                Yükleniyor...
            </div>
        );
    }

    const isMovie = content.type === 2 || content.mediaType === "Movie";
    const genreList = content.genres ? content.genres.split(",") : ["Dram", "Bilim Kurgu"];

    // Backend verisi null gelebileceği için güvenli erişim
    const averageRating: number = content.averageRating ?? 0;
    const reviewCount: number = content.reviewCount ?? 0;

    // --- PUAN + İNCELEME GÖNDERME / GÜNCELLEME ---
    const handleSendReview = async () => {
        if (!content) return;

        try {
            let ratingId = existingRatingId;
            let reviewId = existingReviewId;
            let updated = false;

            // 1) PUAN İŞLEMİ
            if (userRating > 0) {
                if (ratingId) {
                    // Güncelle
                    await api.updateRating(ratingId, userRating);
                } else {
                    // Yeni Ekle
                    const res = await api.addRating(content.id, userRating);
                    // Dönen yanıttan ID'yi almayı dene, alamazsan null kalır
                    if (res && res.id) {
                        ratingId = res.id;
                        setExistingRatingId(res.id);
                    }
                }
                updated = true;
            }

            // 2) İNCELEME İŞLEMİ
            if (reviewText.trim().length > 0) {
                if (reviewId) {
                    // Güncelle
                    await api.updateReview(reviewId, reviewText);
                } else {
                    // Yeni Ekle
                    const res = await api.addReview(content.id, reviewText);
                    if (res && res.id) {
                        reviewId = res.id;
                        setExistingReviewId(res.id);
                    }
                }
                updated = true;
            }

            if (updated) {
                // 3) GÜVENLİ GÜNCELLEME: 
                // Sadece içeriği değil, kullanıcının kendi rating/review verisini de tekrar çekiyoruz.
                // Böylece "existingRatingId" kesinlikle backend'deki ID ile eşleşir ve 
                // bir sonraki tıklama "Ekle" değil "Güncelle" olarak çalışır.
                const [refreshedMedia, refreshedUserRating, refreshedUserReview] = await Promise.all([
                    api.getMediaItemById(content.id),
                    api.getUserRatingForMedia(content.id),
                    api.getUserReviewForMedia(content.id),
                ]);

                setContent(refreshedMedia);

                if (refreshedUserRating) {
                    setExistingRatingId(refreshedUserRating.id);
                }
                if (refreshedUserReview) {
                    setExistingReviewId(refreshedUserReview.id);
                }

                toast.success("Değerlendirmeniz kaydedildi.");
            } else {
                toast.info("Kaydedilecek bir değişiklik yapmadınız.");
            }

        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Kaydedilirken bir hata oluştu.");
        }
    };

    const toggleList = (listName: string) => {
        if (selectedLists.includes(listName)) {
            setSelectedLists(selectedLists.filter((l) => l !== listName));
        } else {
            setSelectedLists([...selectedLists, listName]);
        }
    };

    const createNewList = () => {
        if (newListName.trim()) {
            setMyLists([...myLists, newListName]);
            setSelectedLists([...selectedLists, newListName]);
            setNewListName("");
            setIsCreatingList(false);
        }
    };

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
                                    <RatingWidget currentRating={userRating} onRate={setUserRating} />
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
                            <CommentSection />
                        </section>
                    </div>

                    {/* SAĞ SIDEBAR */}
                    <div className="space-y-6">
                        <div className="bg-[#0A1A2F]/70 p-6 rounded-3xl border border-[#0A1A2F] space-y-3 sticky top-24">
                            <h4 className="text-white mb-4 font-semibold">Kütüphaneye Ekle</h4>

                            <button
                                onClick={() => {
                                    setIsWatched(!isWatched);
                                    if (!isWatched) setIsWatchlist(false);
                                }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-medium ${isWatched
                                    ? "bg-[#3DD9B4] text-[#050B12]"
                                    : "bg-[#050B12] text-gray-300 hover:bg-[#1E293B]"
                                    }`}
                            >
                                <Eye className="w-5 h-5" />
                                {isMovie ? "İzledim" : "Okudum"}
                            </button>

                            <button
                                onClick={() => {
                                    setIsWatchlist(!isWatchlist);
                                    if (!isWatchlist) setIsWatched(false);
                                }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all font-medium ${isWatchlist
                                    ? "bg-[#FFD65A] text-[#050B12]"
                                    : "bg-[#050B12] text-gray-300 hover:bg-[#1E293B]"
                                    }`}
                            >
                                <Bookmark className="w-5 h-5" />
                                {isMovie ? "İzlenecek" : "Okunacak"}
                            </button>

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
                            {myLists.map((list) => {
                                const isSelected = selectedLists.includes(list);
                                return (
                                    <button
                                        key={list}
                                        onClick={() => toggleList(list)}
                                        className={`w-full px-4 py-4 rounded-2xl border flex justify-between items-center transition-all ${isSelected
                                            ? "bg-[#3DD9B4]/10 border-[#3DD9B4] text-[#3DD9B4]"
                                            : "bg-[#050B12] border-[#1E293B] text-gray-300 hover:border-gray-500"
                                            }`}
                                    >
                                        <span>{list}</span>
                                        {isSelected && <Check className="w-5 h-5" />}
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
                                    onChange={(e) => setNewListName(e.target.value)}
                                    autoFocus
                                />
                                <button onClick={createNewList} className="bg-[#3DD9B4] px-4 text-[#050B12] rounded-xl font-medium">
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