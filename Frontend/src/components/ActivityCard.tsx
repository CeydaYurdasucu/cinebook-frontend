import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    Heart,
    MessageCircle,
    Star,
    Send,
    Loader2,
    AlertTriangle,
} from "lucide-react";
import { api } from "../services/api";

export default function ActivityCard({ activity }: { activity: any }) {
    // --- GÜVENLİ VERİ OKUMA (Fail-Safe Logic) ---
    console.log("ACTIVITY:", activity);

    // 1. ID KONTROLÜ
    const safeId = activity?.activityId ?? activity?.id;

    // 2. TYPE KONTROLÜ
    let safeType = activity?.type ?? activity?.Type;
    if (!safeType) {
        safeType =
            activity?.ratingScore > 0 || activity?.rating > 0 ? "Rating" : "Review";
    }

    // 3. SAYISAL DEĞERLER
    const likeCount = Number(activity?.likeCount ?? activity?.likes ?? 0);
    const [commentTotal, setCommentTotal] = useState(activity?.comments ?? 0);

    const ratingScore = Number(activity?.ratingScore ?? activity?.rating ?? 0);

    // 4. METİN VE OBJELER
    const user = activity?.user || {};
    const content = activity?.content || {};

    const username = user.username ?? user.displayName ?? "Kullanıcı";
    const avatarUrl =
        user.avatarUrl ?? user.avatar ?? "https://via.placeholder.com/150";
    const contentId = content.contentId ?? content.id;
    const contentTitle = content.title ?? "İsimsiz İçerik";
    const posterUrl =
        content.posterUrl ?? content.poster ?? "https://via.placeholder.com/150";
    const actionText =
        activity?.actionText ?? activity?.action ?? "bir işlem yaptı";
    const [comments, setComments] = useState<any[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    // Tarih formatlama
    let displayDate = "";
    try {
        const dateStr =
            activity?.createdAt ?? activity?.timestamp ?? new Date().toISOString();
        displayDate = new Date(dateStr).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (e) {
        displayDate = "Tarih yok";
    }

    // --- LOCAL STORAGE KEY ---
    // Her aktivite için benzersiz bir anahtar oluşturuyoruz
    const storageKey = `liked_status_${safeId}`;

    // --- STATE ---
    const [likes, setLikes] = useState(likeCount);

    // BAŞLANGIÇ DURUMU (ÖNEMLİ GÜNCELLEME):
    // Sayfa yüklendiğinde önce LocalStorage'a bak (Tarayıcı hafızası),
    // Eğer orada kayıt yoksa Backend'den gelen veriyi kullan.
    const [isLiked, setIsLiked] = useState(() => {
        const storedValue = localStorage.getItem(storageKey);
        if (storedValue !== null) {
            return storedValue === "true"; // Hafızada "true" ise true dön
        }
        // Hafızada yoksa Backend verisine güven (şimdilik false geliyor olsa bile)
        return !!(activity?.isLikedByCurrentUser ?? activity?.isLiked);
    });

    const [showComments, setShowComments] = useState(false);
    const [localComments, setLocalComments] = useState<string[]>([]);
    const [commentText, setCommentText] = useState("");
    const [isSendingComment, setIsSendingComment] = useState(false);
    const loadComments = async () => {
        if (!safeId) return;

        setLoadingComments(true);
        try {
            const data = await api.getComments(safeId, safeType);
            setComments(data);

            // ⭐ En doğru sayıyı güncelle
            setCommentTotal(data.length);
        } catch (err) {
            console.error("Yorumlar yüklenemedi:", err);
        } finally {
            setLoadingComments(false);
        }
    };
    useEffect(() => {
        setCommentTotal(activity?.comments ?? 0);
    }, [activity]);

    useEffect(() => {
        if (showComments) loadComments();
    }, [showComments]);
    // --- SENKRONİZASYON ---
    // Backend'den veri güncellenirse ve LocalStorage boşsa state'i güncelle
    useEffect(() => {
        const backendState = !!(
            activity?.isLikedByCurrentUser ?? activity?.isLiked
        );
        // Sadece LocalStorage'da veri YOKSA backend'i dinle
        // (Böylece backend 'false' gönderse bile bizim 'true' kaydımız bozulmaz)
        if (localStorage.getItem(storageKey) === null) {
            setIsLiked(backendState);
        }
    }, [activity?.isLikedByCurrentUser, activity?.isLiked, safeId, storageKey]);

    // --- AKSİYONLAR ---
    const handleLike = async () => {
        if (!safeId) {
            console.warn("Like işlemi iptal edildi: ID bulunamadı.", activity);
            return;
        }

        const previousLikes = likes;
        const previousIsLiked = isLiked;

        // Yeni durumu hesapla
        const newIsLiked = !isLiked;

        // 1. UI Güncelle (Anında Tepki)
        setIsLiked(newIsLiked);
        setLikes(newIsLiked ? likes + 1 : likes - 1);

        // 2. Tarayıcı Hafızasına Kaydet (Sayfa yenilenince hatırlasın diye)
        localStorage.setItem(storageKey, String(newIsLiked));

        // 3. API İsteği Gönder
        try {
            await api.toggleLike(safeId, safeType);
        } catch (error) {
            console.error("Beğeni hatası:", error);
            // Hata olursa her şeyi geri al
            setIsLiked(previousIsLiked);
            setLikes(previousLikes);
            localStorage.setItem(storageKey, String(previousIsLiked));
        }
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        if (!safeId) {
            alert("Hata: İçerik ID'si yüklenemediği için yorum yapılamıyor.");
            return;
        }

        setIsSendingComment(true);
        try {
            await api.postComment(safeId, commentText, safeType);

            setLocalComments([...localComments, commentText]);
            setCommentText("");
        } catch (error) {
            console.error("Yorum gönderilemedi:", error);
        } finally {
            setIsSendingComment(false);
        }
    };

    // --- RENDER ---
    if (!activity) return null;

    return (
        <div className="bg-[#0A1A2F]/50 backdrop-blur-sm rounded-3xl p-6 border border-[#0A1A2F] hover:border-[#3DD9B4]/30 transition-all shadow-lg mb-6">
            {/* Üst Kısım: Avatar ve İsim */}
            <div className="flex items-center gap-3 mb-4">
                <Link to={`/profile/${username}`}>
                    <img
                        src={avatarUrl}
                        alt={username}
                        className="w-12 h-12 rounded-full border border-[#3DD9B4]/20 object-cover"
                    />
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <Link
                            to={`/profile/${username}`}
                            className="text-white font-medium hover:text-[#3DD9B4] transition-colors"
                        >
                            {username}
                        </Link>
                        <span className="text-gray-500 text-xs">• {displayDate}</span>
                    </div>
                    <div className="text-gray-400 text-sm">{actionText}</div>
                </div>
            </div>

            {/* İçerik Kısımı */}
            <Link to={contentId ? `/content/${contentId}` : "#"}>
                <div className="flex gap-4 mb-4 group">
                    <img
                        src={posterUrl}
                        alt={contentTitle}
                        className="w-24 h-36 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1">
                        <h3 className="text-white font-medium text-lg group-hover:text-[#3DD9B4] transition-colors">
                            {contentTitle}
                        </h3>

                        {ratingScore > 0 && (
                            <div className="flex items-center gap-1 bg-[#3DD9B4]/10 w-fit px-2 py-1 rounded-lg mt-2 border border-[#3DD9B4]/20">
                                <Star size={14} className="text-[#FFD65A] fill-[#FFD65A]" />
                                <span className="text-[#FFD65A] font-bold text-sm">
                                    {ratingScore}/10
                                </span>
                            </div>
                        )}

                        {(activity.reviewExcerpt || activity.review) && (
                            <p className="text-gray-300 text-sm mt-3 line-clamp-3 leading-relaxed">
                                {activity.reviewExcerpt || activity.review}
                            </p>
                        )}
                    </div>
                </div>
            </Link>

            {/* Alt Butonlar */}
            <div className="flex items-center gap-6 pt-4 border-t border-[#0A1A2F]">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-all ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                        }`}
                >
                    <Heart
                        size={20}
                        fill={isLiked ? "currentColor" : "none"}
                        className={isLiked ? "scale-110" : ""}
                    />
                    <span className="font-medium">{likes}</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 transition-all ${showComments
                            ? "text-[#3DD9B4]"
                            : "text-gray-400 hover:text-[#3DD9B4]"
                        }`}
                >
                    <MessageCircle size={20} />
                    <span className="font-medium">
                        {commentTotal + localComments.length}
                    </span>
                </button>
            </div>

            {/* Yorum Yapma Alanı */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-[#0A1A2F] animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {/* 🔥 1) Backend'den gelen yorumlar */}
                        {comments.map((c: any) => (
                            <div key={c.id} className="flex gap-2">
                                <img
                                    src={c.avatarUrl ?? "https://via.placeholder.com/50"}
                                    className="w-8 h-8 rounded-full"
                                />
                                <div className="flex-1 bg-[#0A1A2F] rounded-xl p-3 border border-[#3DD9B4]/20">
                                    <p className="text-white text-sm font-medium">{c.username}</p>
                                    <p className="text-gray-300 text-xs">{c.commentText}</p>
                                </div>
                            </div>
                        ))}

                        {/* 🔥 2) Yeni eklenen local yorumlar */}
                        {localComments.map((comment, idx) => (
                            <div key={idx} className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#3DD9B4]/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-[#3DD9B4] text-xs font-bold">SEN</span>
                                </div>
                                <div className="flex-1 bg-[#0A1A2F] rounded-xl p-3 border border-[#3DD9B4]/20">
                                    <p className="text-white text-sm font-medium mb-1">Sen</p>
                                    <p className="text-gray-300 text-xs">{comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                        <input
                            className="flex-1 bg-[#050B12] text-white p-2.5 rounded-xl border border-gray-700 focus:border-[#3DD9B4] focus:outline-none transition-colors text-sm"
                            placeholder="Bir yorum yaz..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={isSendingComment || !commentText.trim()}
                            className="bg-[#3DD9B4] px-4 rounded-xl text-[#050B12] hover:bg-[#2FC9A4] disabled:opacity-50 transition-colors flex items-center justify-center"
                        >
                            {isSendingComment ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
