import React, { useEffect, useState } from "react";
import { Send, Trash2, Edit3, User as UserIcon } from "lucide-react";
import { api } from "../services/api";
import { toast } from "sonner";

interface CommentSectionProps {
    mediaId: number;
}

// Yorumun veritaban�ndan gelen yap�s�na uygun tip
interface CommentData {
    id: number;
    content: string;
    userId: number;
    createdDate?: string;
    // Backend User objesini include ediyorsa:
    user?: { 
        username: string;
        profilePictureUrl?: string;
    };
    // Backend include etmiyorsa username ayr�ca g�nderiliyor olabilir
    username?: string; 
}

export default function CommentSection({ mediaId }: CommentSectionProps) {
    const [comments, setComments] = useState<CommentData[]>([]);
    const [newComment, setNewComment] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [loading, setLoading] = useState(false);
    
    // �u anki kullan�c�n�n ID'sini al (Token'dan ��z�len)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);

    useEffect(() => {
        // 1. Kullan�c� ID'sini bul (D�zenle/Sil butonlar�n� g�stermek i�in)
        const token = localStorage.getItem("authToken");
        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const payload = JSON.parse(window.atob(base64));
                // Token claim isimlerine g�re ID'yi bul
                const uid = payload.sub || payload.nameid || payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
                setCurrentUserId(Number(uid));
            } catch (e) { console.error("Token decode error", e); }
        }

        // 2. Yorumlar� �ek
        fetchComments();
    }, [mediaId]);

    const fetchComments = async () => {
        if (!mediaId) return;
        setLoading(true);
        try {
            const data = await api.getReviewsByMediaId(mediaId);
            // Tarihe g�re yeniden eskiye s�rala (varsay�msal)
            // Backend zaten s�ral� g�nderiyorsa reverse gerekmez

            console.log("BACKEND REVIEW DATA:", data);

            setComments(Array.isArray(data) ? data.reverse() : []); 
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            await api.addReview(mediaId, newComment);
            setNewComment("");
            toast.success("Yorumunuz eklendi!");
            fetchComments(); // Listeyi yenile
        } catch (error: any) {
            toast.error("Yorum eklenirken hata oluştu.");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
        
        try {
            await api.deleteReview(id);
            setComments(comments.filter((c) => c.id !== id));
            toast.success("Yorum silindi.");
        } catch (error) {
            toast.error("Silme işlemi başarısız.");
        }
    };

    const handleEdit = (id: number, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const handleSaveEdit = async (id: number) => {
        try {
            await api.updateReview(id, editText);
            
            // UI'� g�ncelle
            setComments(comments.map((c) => (c.id === id ? { ...c, content: editText } : c)));
            
            setEditingId(null);
            setEditText("");
            toast.success("Yorum güncellendi.");
        } catch (error) {
            toast.error("Güncelleme başarısız.");
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-white text-xl font-bold flex items-center gap-2">
                Diğer Yorumlar
                <span className="text-sm font-normal text-gray-500">({comments.length})</span>
            </h3>

            {/* Yorum Ekleme Formu */}
            <form onSubmit={handleAddComment} className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#3DD9B4]/20 flex items-center justify-center text-[#3DD9B4]">
                     <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Bir yorum yaz..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-2xl bg-[#050B12] border border-[#1E293B] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-xl text-[#3DD9B4] hover:bg-[#3DD9B4]/10 disabled:text-gray-600 disabled:hover:bg-transparent transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>

            {/* Yorum Listesi */}
            <div className="space-y-4">
                {loading ? (
                    <p className="text-gray-500 text-sm">Yorumlar yükleniyor...</p>
                ) : comments.length === 0 ? (
                    <p className="text-gray-500 text-sm">Henüz yorum yapılmamış. ilk yorumu sen yap!</p>
                ) : (
                    comments.map((comment) => {
                        // Yorumun sahibi ben miyim?
                        const isMyComment = currentUserId === comment.userId;
                        
                        // Kullan�c� ad� ve avatar (Backend'den gelen veriye g�re ayarlanmal�)
                        // Backend user objesi yolluyorsa comment.user.username, yoksa fallback
                        const displayName = comment.user?.username || comment.username || `Kullanıcı #${comment.userId}`;
                        const avatarUrl = comment.user?.profilePictureUrl;

                        return (
                            <div key={comment.id} className="flex gap-3">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#1E293B] flex items-center justify-center text-gray-400">
                                        <span className="text-xs font-bold">{displayName.substring(0,2).toUpperCase()}</span>
                                    </div>
                                )}
                                
                                <div className="flex-1">
                                    <div className="bg-[#050B12] rounded-2xl px-4 py-3 border border-[#1E293B]">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-white font-medium text-sm">{displayName}</span>
                                            <div className="flex items-center gap-2">
                                                {/* Tarih varsa formatla */}
                                                <span className="text-xs text-gray-500">
                                                    {comment.createdDate ? new Date(comment.createdDate).toLocaleDateString() : ""}
                                                </span>
                                                
                                                {/* Sadece KEND� yorumunsa D�zenle/Sil g�ster */}
                                                {isMyComment && (
                                                    <>
                                                        {editingId === comment.id ? (
                                                            <button
                                                                onClick={() => handleSaveEdit(comment.id)}
                                                                className="text-[#3DD9B4] hover:text-[#2FC9A4] text-xs font-bold"
                                                            >
                                                                Kaydet
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(comment.id, comment.content)}
                                                                    className="text-gray-500 hover:text-[#3DD9B4] transition-colors"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(comment.id)}
                                                                    className="text-gray-500 hover:text-red-400 transition-colors"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {editingId === comment.id ? (
                                            <input
                                                type="text"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full bg-[#0A1A2F] px-3 py-2 rounded-xl text-white border border-[#3DD9B4] focus:outline-none text-sm"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveEdit(comment.id);
                                                    if (e.key === "Escape") setEditingId(null);
                                                }}
                                            />
                                        ) : (
                                            <p className="text-gray-300 text-sm">{comment.content}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}