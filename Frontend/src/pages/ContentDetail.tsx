import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star, Clock, Users, BookOpen, Eye, Plus, Bookmark, Check, X } from "lucide-react";
import RatingWidget from "../components/RatingWidget";
import CommentSection from "../components/CommentSection";
import { api } from "../services/api";

export default function ContentDetail() {
    const { id } = useParams();
    const [content, setContent] = useState<any | null>(null);

    const [userRating, setUserRating] = useState(0);
    const [isWatched, setIsWatched] = useState(false);
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [showListModal, setShowListModal] = useState(false);

    // List Modal State
    const [myLists, setMyLists] = useState(["Favoriler", "Kış 2024 İzlenecekler", "Mutlaka İzle"]);
    const [selectedLists, setSelectedLists] = useState<string[]>([]);
    const [newListName, setNewListName] = useState("");
    const [isCreatingList, setIsCreatingList] = useState(false);

    // --- BACKEND'DEN MEDIA ITEM GETİR ---
    useEffect(() => {
        const load = async () => {
            const data = await fetch(`https://localhost:7255/api/MediaItem/${id}`);
            const json = await data.json();
            setContent(json);
        };
        load();
    }, [id]);

    if (!content) {
        return (
            <div className="min-h-screen bg-[#050B12] flex items-center justify-center text-white">
                Yükleniyor...
            </div>
        );
    }

    const isMovie = content.type === 2; // 1=book, 2=movie

    // Genres string → array
    const genreList = content.genres ? content.genres.split(",") : [];

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
                    src={content.coverImageUrl}
                    alt={content.title}
                    className="w-full h-full object-cover blur-2xl opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050B12] via-[#050B12]/80 to-transparent" />

                <div className="absolute inset-0 container mx-auto px-4 flex items-end pb-12">
                    <div className="flex flex-col md:flex-row gap-8 items-end">
                        <img
                            src={content.coverImageUrl}
                            alt={content.title}
                            className="w-56 h-80 rounded-3xl object-cover shadow-2xl"
                        />

                        <div className="flex-1 pb-4">
                            <h1 className="text-white mb-2">{content.title}</h1>

                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <span className="text-gray-400">{content.releaseYear}</span>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {genreList.map((genre) => (
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
                                <span className="text-white">{content.rating ?? 0}/10</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT DETAILS */}
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* MAIN CONTENT */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* ABOUT */}
                        <section>
                            <h3 className="text-white mb-4">Hakkında</h3>

                            <p className="text-gray-300 leading-relaxed mb-6">
                                {content.description || "Açıklama bulunmuyor."}
                            </p>

                            <div className="space-y-2 text-gray-300">
                                <p>
                                    <span className="text-gray-500">{isMovie ? "Yönetmen" : "Yazar"}:</span>
                                    {content.creator}
                                </p>

                                <p>
                                    <span className="text-gray-500">Yayın Tarihi:</span>
                                    {content.releaseYear}
                                </p>
                            </div>
                        </section>


                        {/* USER RATING */}
                        <section className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                            <h3 className="text-white mb-4">
                                Puan Ver: {isMovie ? "Bu Film" : "Bu Kitap"}
                            </h3>
                            <RatingWidget currentRating={userRating} onRate={setUserRating} />

                            {userRating > 0 && (
                                <div className="mt-6">
                                    <textarea
                                        placeholder="İncelemenizi yazın..."
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-2xl bg-[#050B12] border-2 border-[#0A1A2F] text-white placeholder-gray-500"
                                    />
                                    <button className="mt-3 px-6 py-3 rounded-2xl bg-[#FFD65A] text-[#050B12]">
                                        İncelemeyi Gönder
                                    </button>
                                </div>
                            )}
                        </section>

                        {/* COMMENTS */}
                        <section className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 backdrop-blur-lg rounded-3xl p-8 border border-[#0A1A2F]">
                            <CommentSection />
                        </section>
                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-6">
                        {/* WATCH / READ */}
                        <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 p-6 rounded-3xl border border-[#0A1A2F] space-y-3">
                            <h4 className="text-white mb-4">Kütüphaneye Ekle</h4>

                            <button
                                onClick={() => { setIsWatched(!isWatched); if (!isWatched) setIsWatchlist(false); }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all ${isWatched
                                        ? "bg-[#3DD9B4] text-[#050B12]"
                                        : "bg-[#0A1A2F] text-gray-300 border border-[#0A1A2F]"
                                    }`}
                            >
                                <Eye className="w-5 h-5" />
                                {isMovie ? "İzledim" : "Okudum"}
                            </button>

                            <button
                                onClick={() => { setIsWatchlist(!isWatchlist); if (!isWatchlist) setIsWatched(false); }}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all ${isWatchlist
                                        ? "bg-[#FFD65A] text-[#050B12]"
                                        : "bg-[#0A1A2F] text-gray-300 border border-[#0A1A2F]"
                                    }`}
                            >
                                <Bookmark className="w-5 h-5" />
                                {isMovie ? "İzlenecek" : "Okunacak"}
                            </button>

                            <button
                                onClick={() => setShowListModal(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#0A1A2F] text-gray-300 border border-[#0A1A2F]"
                            >
                                <Plus className="w-5 h-5" />
                                Özel Listeye Ekle
                            </button>
                        </div>

                        {/* STATS */}
                        <div className="bg-gradient-to-br from-[#0A1A2F]/70 to-[#0A1A2F]/40 p-6 rounded-3xl border border-[#0A1A2F]">
                            <h4 className="text-white mb-4">İstatistikler</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-gray-300">
                                    <span className="flex items-center gap-2">
                                        <Users className="w-5 h-5 text-[#3DD9B4]" /> Oy Sayısı
                                    </span>
                                    <span>{content.totalRatings ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST MODAL (AYNEN BIRAKILDI) */}
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

                        {/* LIST OPTIONS */}
                        <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                            {myLists.map((list) => {
                                const isSelected = selectedLists.includes(list);
                                return (
                                    <button
                                        key={list}
                                        onClick={() => toggleList(list)}
                                        className={`w-full px-4 py-4 rounded-2xl border flex justify-between ${isSelected
                                                ? "bg-[#3DD9B4]/20 border-[#3DD9B4] text-[#3DD9B4]"
                                                : "bg-[#050B12] border-[#0A1A2F] text-gray-300"
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
                                    className="flex-1 bg-[#050B12] border border-[#3DD9B4] rounded-xl px-4 py-3 text-white"
                                    placeholder="Liste adı..."
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                />
                                <button onClick={createNewList} className="bg-[#3DD9B4] px-4 text-[#050B12] rounded-xl">
                                    Ekle
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsCreatingList(true)} className="text-gray-400 hover:text-white mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5" /> Yeni liste oluştur
                            </button>
                        )}

                        {/* SAVE BUTTON */}
                        <button
                            onClick={() => setShowListModal(false)}
                            className="w-full px-6 py-4 rounded-2xl bg-[#FFD65A] text-[#050B12] text-lg font-semibold"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
