import React from "react";
import { useParams } from "react-router-dom";
import { Star, Clock, Users, BookOpen, Eye, Plus, Bookmark, Check, X } from "lucide-react";
import { useState } from "react";
import RatingWidget from "../components/RatingWidget";
import CommentSection from "../components/CommentSection";
import { mockContent } from "../utils/mockData";

export default function ContentDetail() {
    const { id } = useParams();
    const content = mockContent.find((item) => item.id === id);

    const [userRating, setUserRating] = useState(0);
    const [isWatched, setIsWatched] = useState(false);
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [showListModal, setShowListModal] = useState(false);

    // Türkçe Liste İsimleri
    const [myLists, setMyLists] = useState(["Favoriler", "Kış 2024 İzlenecekler", "Mutlaka İzle"]);
    const [selectedLists, setSelectedLists] = useState<string[]>([]);
    const [newListName, setNewListName] = useState("");
    const [isCreatingList, setIsCreatingList] = useState(false);

    if (!content) {
        return <div className="min-h-screen bg-[#050B12] flex items-center justify-center text-white">İçerik bulunamadı</div>;
    }

    const isMovie = content.type === "movie";

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
            {/* Hero Section */}
            <div className="relative h-[60vh] overflow-hidden">
                <img
                    src={content.poster}
                    alt={content.title}
                    className="w-full h-full object-cover blur-2xl opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B12] via-[#050B12]/80 to-transparent" />

                <div className="absolute inset-0 container mx-auto px-4 flex items-end pb-12">
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                        <img
                            src={content.poster}
                            alt={content.title}
                            className="w-56 h-80 rounded-3xl object-cover shadow-2xl"
                        />
                        <div className="flex-1 pb-4">
                            <h1 className="text-white mb-2">{content.title}</h1>
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <span className="text-gray-400">{content.year}</span>
                                <span className="text-gray-600">•</span>
                                {isMovie ? (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        <span>{content.duration}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{content.pages}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {content.genres.map((genre) => (
                                    <span
                                        key={genre}
                                        className="px-4 py-1.5 bg-[#3DD9B4]/20 text-[#3DD9B4] rounded-xl border border-[#3DD9B4]/30"
                                    >
                                        {genre}
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <Star className="w-6 h-6 text-[#FFD65A] fill-[#FFD65A]" />
                                <span className="text-white">{content.rating}/10</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">{content.totalRatings.toLocaleString()} oy</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Details */}
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* About */}
                        <section>
                            <h3 className="text-white mb-4">Hakkında</h3>
                            <p className="text-gray-300 leading-relaxed mb-6">{content.summary}</p>
                            <div className="space-y-2 text-gray-300">
                                <p><span className="text-gray-500">{isMovie ? "Yönetmen" : "Yazar"}:</span> {isMovie ? content.director : content.author}</p>
                                <p><span className="text-gray-500">Yayın Tarihi:</span> {content.year}</p>
                            </div>
                        </section>

                        {/* Your Rating */}
                        <section className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                            <h3 className="text-white mb-4">Puan Ver: {isMovie ? "Bu Film" : "Bu Kitap"}</h3>
                            <RatingWidget currentRating={userRating} onRate={setUserRating} />
                            {userRating > 0 && (
                                <div className="mt-6">
                                    <textarea
                                        placeholder="İncelemenizi yazın (isteğe bağlı)..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border-2 border-[#0A1A2F] text-white placeholder-gray-500 focus:border-[#3DD9B4] focus:outline-none transition-colors resize-none"
                                    />
                                    <button className="mt-3 px-6 py-3 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all">
                                        İncelemeyi Gönder
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* Comments */}
                        <section className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                            <CommentSection />
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Library Actions */}
                        <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-6 border border-[#0A1A2F] space-y-3">
                            <h4 className="text-white mb-4">Kütüphaneye Ekle</h4>

                            <button
                                onClick={() => { setIsWatched(!isWatched); if (!isWatched) setIsWatchlist(false); }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all ${isWatched
                                        ? "bg-[#3DD9B4] text-[#050B12]"
                                        : "bg-[#0A1A2F] text-gray-300 hover:bg-[#3DD9B4]/10 hover:text-[#3DD9B4] border border-[#0A1A2F] hover:border-[#3DD9B4]/30"
                                    }`}
                            >
                                <Eye className="w-5 h-5" />
                                {isMovie ? "İzledim" : "Okudum"}
                            </button>

                            <button
                                onClick={() => { setIsWatchlist(!isWatchlist); if (!isWatchlist) setIsWatched(false); }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all ${isWatchlist
                                        ? "bg-[#FFD65A] text-[#050B12]"
                                        : "bg-[#0A1A2F] text-gray-300 hover:bg-[#FFD65A]/10 hover:text-[#FFD65A] border border-[#0A1A2F] hover:border-[#FFD65A]/30"
                                    }`}
                            >
                                <Bookmark className="w-5 h-5" />
                                {isMovie ? "İzlenecek" : "Okunacak"}
                            </button>

                            <button
                                onClick={() => setShowListModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#0A1A2F] text-gray-300 hover:bg-[#3DD9B4]/10 hover:text-[#3DD9B4] border border-[#0A1A2F] hover:border-[#3DD9B4]/30 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                Özel Listeye Ekle
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-6 border border-[#0A1A2F]">
                            <h4 className="text-white mb-4">İstatistikler</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-gray-300">
                                    <div className="flex items-center gap-2"><Users className="w-5 h-5 text-[#3DD9B4]" /><span>Oy Sayısı</span></div>
                                    <span>{content.totalRatings.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-gray-300">
                                    <div className="flex items-center gap-2"><Eye className="w-5 h-5 text-[#3DD9B4]" /><span>{isMovie ? "İzlenme" : "Okunma"}</span></div>
                                    <span>{Math.floor(content.totalRatings * 0.8).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- YENİLENEN MODAL KISMI --- */}
            {showListModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    {/* Modal Dışı Tıklama ile Kapatma */}
                    <div className="absolute inset-0" onClick={() => setShowListModal(false)} />

                    <div className="bg-[#0A1A2F] rounded-3xl p-8 max-w-md w-full border border-[#3DD9B4]/30 relative z-10 shadow-2xl">

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-white text-xl font-semibold">Listeye Ekle</h3>
                            <button onClick={() => setShowListModal(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Liste Seçenekleri */}
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {myLists.map((list) => {
                                const isSelected = selectedLists.includes(list);
                                return (
                                    <button
                                        key={list}
                                        onClick={() => toggleList(list)}
                                        className={`w-full px-4 py-4 rounded-2xl border transition-all flex items-center justify-between group ${isSelected
                                                ? "bg-[#3DD9B4]/20 border-[#3DD9B4] text-[#3DD9B4]"
                                                : "bg-[#050B12] border-[#0A1A2F] text-gray-300 hover:border-gray-600"
                                            }`}
                                    >
                                        <span className="font-medium">{list}</span>
                                        {isSelected && <Check className="w-5 h-5" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Yeni Liste Oluşturma Alanı */}
                        {isCreatingList ? (
                            <div className="flex gap-2 mb-6 animate-in fade-in slide-in-from-left-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Liste adı..."
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    className="flex-1 bg-[#050B12] border border-[#3DD9B4] rounded-xl px-4 py-3 text-white focus:outline-none"
                                    onKeyDown={(e) => e.key === "Enter" && createNewList()}
                                />
                                <button
                                    onClick={createNewList}
                                    className="bg-[#3DD9B4] text-[#050B12] px-4 rounded-xl font-medium hover:bg-[#2FC9A4]"
                                >
                                    Ekle
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsCreatingList(true)}
                                className="w-full flex items-center gap-2 px-4 py-3 mb-6 text-gray-400 hover:text-white transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Yeni liste oluştur
                            </button>
                        )}

                        {/* Kaydet Butonu */}
                        <button
                            onClick={() => setShowListModal(false)}
                            className="w-full px-6 py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] hover:bg-[#FFC940] transition-all font-semibold text-lg shadow-lg transform active:scale-[0.98]"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}