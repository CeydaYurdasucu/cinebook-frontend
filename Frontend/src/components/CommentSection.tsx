import { useState } from "react";
import { Send, Trash2, Edit3 } from "lucide-react";
import { mockComments } from "../utils/mockData";

export default function CommentSection() {
    const [comments, setComments] = useState(mockComments);
    const [newComment, setNewComment] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            const comment = {
                id: Date.now().toString(),
                user: {
                    id: "1",
                    username: "johndoe",
                    displayName: "John Doe",
                    avatar: "https://images.unsplash.com/photo-1582836985321-7a3f82fb6f3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                    // --- TypeScript Hatasýný Çözen Eksik Alanlar ---
                    bio: "Film tutkunu",
                    followers: 0,
                    following: 0,
                    isCurrentUser: true,
                },
                text: newComment,
                timestamp: "Az önce",
            };
            setComments([comment, ...comments]);
            setNewComment("");
        }
    };

    const handleDelete = (id: string) => {
        setComments(comments.filter((c) => c.id !== id));
    };

    const handleEdit = (id: string, text: string) => {
        setEditingId(id);
        setEditText(text);
    };

    const handleSaveEdit = (id: string) => {
        setComments(
            comments.map((c) => (c.id === id ? { ...c, text: editText } : c))
        );
        setEditingId(null);
        setEditText("");
    };

    return (
        <div className="space-y-6">
            <h3 className="text-white">Yorumlar</h3>

            {/* Yorum Ekleme Formu */}
            <form onSubmit={handleAddComment} className="flex gap-3">
                <img
                    src="https://images.unsplash.com/photo-1582836985321-7a3f82fb6f3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
                    alt="Sen"
                    className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Bir yorum yaz..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full px-4 py-3 pr-12 rounded-2xl bg-[#0A1A2F] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors"
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
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <img
                            src={comment.user.avatar}
                            alt={comment.user.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                            <div className="bg-[#0A1A2F] rounded-2xl px-4 py-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-white">{comment.user.displayName}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                                        {/* Kendi yorumunsa Düzenle/Sil butonlarý */}
                                        {comment.user.username === "johndoe" && (
                                            <>
                                                {editingId === comment.id ? (
                                                    <button
                                                        onClick={() => handleSaveEdit(comment.id)}
                                                        className="text-[#3DD9B4] hover:text-[#2FC9A4] text-xs"
                                                    >
                                                        Kaydet
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(comment.id, comment.text)}
                                                            className="text-gray-500 hover:text-[#3DD9B4] transition-colors"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(comment.id)}
                                                            className="text-gray-500 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
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
                                        className="w-full bg-[#050B12] px-3 py-2 rounded-xl text-white border border-[#3DD9B4] focus:outline-none"
                                    />
                                ) : (
                                    <p className="text-gray-300 text-sm">{comment.text}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}