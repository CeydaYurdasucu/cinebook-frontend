
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MessageCircle, Star, Send, User } from "lucide-react";

interface ActivityCardProps {
    activity: {
        id: string;
        user: {
            id: string;
            username: string;
            displayName: string;
            avatar: string;
        };
        action: string;
        content: {
            id: string;
            type: string;
            title: string;
            poster: string;
        };
        rating?: number;
        timestamp: string;
        review?: string;
        likes: number;
        comments: number;
    };
}

export default function ActivityCard({ activity }: ActivityCardProps) {
    // --- STATE ---
    const [showFullReview, setShowFullReview] = useState(false);
    const [likes, setLikes] = useState(activity.likes);
    const [isLiked, setIsLiked] = useState(false);

    // Yorum Alanı
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [localComments, setLocalComments] = useState<string[]>([]);

    // --- ÇEVİRİLER ---
    const translateAction = (action: string) => {
        const map: Record<string, string> = {
            "rated a movie": "bir filmi puanladı",
            "rated a book": "bir kitabı puanladı",
            "reviewed a book": "bir kitabı inceledi",
            "reviewed a movie": "bir filmi inceledi",
            "added to watchlist": "izleme listesine ekledi",
            "added to custom list": "özel listeye ekledi",
        };
        return map[action] || action;
    };

    const translateTime = (time: string) => {
        return time
            .replace("hours ago", "saat önce")
            .replace("hour ago", "saat önce")
            .replace("days ago", "gün önce")
            .replace("day ago", "gün önce")
            .replace("Just now", "Az önce");
    };

    // --- AKSİYONLAR ---
    const handleLike = () => {
        if (isLiked) {
            setLikes(likes - 1);
        } else {
            setLikes(likes + 1);
        }
        setIsLiked(!isLiked);
    };

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (commentText.trim()) {
            setLocalComments([...localComments, commentText]);
            setCommentText("");
        }
    };

    const truncateReview = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.slice(0, maxLength) + "...";
    };

    return (
        <div className="bg-[#0A1A2F]/50 backdrop-blur-sm rounded-3xl p-6 border border-[#0A1A2F] hover:border-[#3DD9B4]/30 transition-all shadow-lg">
            {/* Kullanıcı Bilgisi */}
            <div className="flex items-center gap-3 mb-4">
                <Link to={`/profile/${activity.user.username}`}>
                    <img
                        src={activity.user.avatar}
                        alt={activity.user.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#3DD9B4]/20"
                    />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Link to={`/profile/${activity.user.username}`} className="text-white hover:text-[#3DD9B4] transition-colors font-medium">
                            {activity.user.displayName}
                        </Link>
                        <span className="text-gray-500 text-xs">• {translateTime(activity.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-400">{translateAction(activity.action)}</p>
                </div>
            </div>

            {/* İçerik Kartı */}
            <Link to={`/content/${activity.content.id}`}>
                <div className="flex gap-4 mb-4 group">
                    <img
                        src={activity.content.poster}
                        alt={activity.content.title}
                        className="w-24 h-36 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1">
                        <h4 className="text-white font-medium mb-2 group-hover:text-[#3DD9B4] transition-colors">{activity.content.title}</h4>
                        {activity.rating && (
                            <div className="flex items-center gap-2 mb-3">
                                <div className="flex items-center gap-1 px-2 py-1 bg-[#3DD9B4]/10 rounded-lg border border-[#3DD9B4]/20">
                                    <Star className="w-3.5 h-3.5 text-[#FFD65A] fill-[#FFD65A]" />
                                    <span className="text-[#FFD65A] text-sm font-bold">{activity.rating}/10</span>
                                </div>
                            </div>
                        )}
                        {activity.review && (
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {showFullReview ? activity.review : truncateReview(activity.review, 120)}
                                {activity.review.length > 120 && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowFullReview(!showFullReview);
                                        }}
                                        className="text-[#3DD9B4] ml-2 hover:text-[#2FC9A4] transition-colors text-xs"
                                    >
                                        {showFullReview ? "Küçült" : "Devamını oku"}
                                    </button>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </Link>

            {/* Butonlar */}
            <div className="flex items-center gap-6 pt-4 border-t border-[#0A1A2F]">

                {/* --- KALP BUTONU (DÜZELTİLEN KISIM) --- */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 transition-all group ${isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                        }`}
                >
                    <Heart
                        // BURASI DÜZELTİLDİ: currentColor yerine direkt Kırmızı Renk Kodu (#ef4444) verildi.
                        fill={isLiked ? "#ef4444" : "none"}
                        className={`w-5 h-5 transition-transform duration-200 ${isLiked ? "scale-110" : "group-hover:scale-110"
                            }`}
                    />
                    <span className="text-sm font-medium">{likes}</span>
                </button>

                {/* Yorum Butonu */}
                <button
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center gap-2 transition-colors group ${showComments ? "text-[#3DD9B4]" : "text-gray-400 hover:text-[#3DD9B4]"
                        }`}
                >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    <span className="text-sm font-medium">{activity.comments + localComments.length}</span>
                </button>
            </div>

            {/* Yorum Alanı */}
            {showComments && (
                <div className="mt-4 pt-4 border-t border-[#0A1A2F] animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
                        {/* Örnek Yorum */}
                        <div className="flex gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1 bg-[#0A1A2F] rounded-xl p-3">
                                <p className="text-white text-sm font-medium mb-1">FilmGuru23</p>
                                <p className="text-gray-400 text-xs">Bu filme bayılmıştım, kesinlikle katılıyorum!</p>
                            </div>
                        </div>

                        {/* Kullanıcı Yorumları */}
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
                            type="text"
                            placeholder="Bir yorum yaz..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className="flex-1 bg-[#0A1A2F] border border-gray-700 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-[#3DD9B4] transition-colors placeholder-gray-600"
                        />
                        <button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="p-2 bg-[#3DD9B4] text-[#050B12] rounded-xl hover:bg-[#2FC9A4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}