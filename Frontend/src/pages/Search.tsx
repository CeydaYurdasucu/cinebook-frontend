import { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, Filter, X, BookOpen, Film, Frown, RotateCcw } from "lucide-react";
import Spinner from "../components/ui/Spinner";
import { api } from "../services/api";

// --- BİLEŞENLER ---
import CarouselRow from "../components/CarouselRow";
import ContentCard from "../components/ContentCard";

export default function Search() {
    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeGenres, setActiveGenres] = useState<string[]>([]);
    const [minYear, setMinYear] = useState("");
    const [maxYear, setMaxYear] = useState("");
    const [allItems, setAllItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // --- TÜR LİSTELERİ ---
    const movieGenres = ["Aksiyon", "Macera", "Animasyon", "Komedi", "Suç", "Belgesel", "Dram", "Aile", "Fantastik", "Tarih", "Korku", "Müzik", "Gizem", "Romantik", "Bilim Kurgu", "TV Filmi", "Gerilim", "Savaş", "Vahşi Batı"];
    const bookGenres = ["Fiction", "Technology", "Science", "History", "Romance", "Fantasy", "Medicine", "Computers", "Children", "Art"];

    const displayedGenres = useMemo(() => {
        return activeCategory === "movie" ? movieGenres : activeCategory === "book" ? bookGenres : Array.from(new Set([...movieGenres, ...bookGenres]));
    }, [activeCategory]);

    // --- DEBOUNCE ---
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => { setActiveGenres([]); }, [activeCategory]);

    // --- VERİ ÇEKME ---
    useEffect(() => {
        setIsLoading(true);
        api.search("").then(data => {
            const safeData = Array.isArray(data) ? data : [];
            setAllItems(safeData);
        }).catch(err => {
            console.error("Hata:", err);
            setAllItems([]);
        }).finally(() => setIsLoading(false));
    }, []);

    // --- FİLTRELEME MANTIĞI ---
    const filteredContent = useMemo(() => {
        if (allItems.length === 0) return [];

        return allItems.filter((item: any) => {
            // Kategori
            if (activeCategory === "movie" && !(item.type === 2 || item.mediaType === "Movie")) return false;
            if (activeCategory === "book" && !(item.type === 1 || item.mediaType === "Book")) return false;

            // Yıl
            if (item.releaseYear) {
                const year = parseInt(String(item.releaseYear));
                const min = minYear ? parseInt(minYear) : 0;
                const max = maxYear ? parseInt(maxYear) : 9999;
                if (year < min || year > max) return false;
            } else if (minYear || maxYear) return false;

            // Tür
            if (activeGenres.length > 0) {
                if (!item.genres) return false;
                const itemGenresLower = typeof item.genres === 'string'
                    ? item.genres.toLowerCase()
                    : (Array.isArray(item.genres) ? item.genres.join(" ").toLowerCase() : "");

                const matchesGenre = activeGenres.every(g =>
                    itemGenresLower.includes(g.toLowerCase().split('/')[0].trim())
                );
                if (!matchesGenre) return false;
            }

            // Metin Arama
            if (debouncedQuery.trim() !== "") {
                const lowerQuery = debouncedQuery.toLowerCase();
                const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
                const descMatch = item.description?.toLowerCase().includes(lowerQuery);
                const creatorMatch = item.creator?.toLowerCase().includes(lowerQuery);
                if (!titleMatch && !descMatch && !creatorMatch) return false;
            }
            return true;
        });
    }, [allItems, activeCategory, activeGenres, minYear, maxYear, debouncedQuery]);

    // --- POPÜLERLİK HESAPLAMA FONKSİYONU ---
    // voteCount (Oy) -> reviewCount (Yorum) -> popularity (Skor) sırasına göre puan döndürür
    const getPopularityScore = (item: any) => {
        return item.voteCount ?? item.reviewCount ?? item.commentCount ?? item.popularity ?? 0;
    };

    // --- VİTRİN LİSTELERİ ---

    // 1. En Popüler Filmler (Oy veya Yorum Sayısına Göre)
    const popularMovies = useMemo(() => {
        return allItems
            .filter((item: any) => item.type === 2 || item.mediaType === "Movie")
            .sort((a: any, b: any) => getPopularityScore(b) - getPopularityScore(a)) // Puanı yüksek olan başa
            .slice(0, 10);
    }, [allItems]);

    // 2. En Popüler Kitaplar (Oy veya Yorum Sayısına Göre)
    const popularBooks = useMemo(() => {
        return allItems
            .filter((item: any) => item.type === 1 || item.mediaType === "Book")
            .sort((a: any, b: any) => getPopularityScore(b) - getPopularityScore(a)) // Puanı yüksek olan başa
            .slice(0, 10);
    }, [allItems]);

    // 3. En Yüksek Puanlı Filmler (Yıldıza Göre)
    const topMovies = useMemo(() => {
        return allItems
            .filter((item: any) => item.type === 2 || item.mediaType === "Movie")
            .sort((a: any, b: any) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
            .slice(0, 10);
    }, [allItems]);

    // 4. En Yüksek Puanlı Kitaplar (Yıldıza Göre)
    const topBooks = useMemo(() => {
        return allItems
            .filter((item: any) => item.type === 1 || item.mediaType === "Book")
            .sort((a: any, b: any) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
            .slice(0, 10);
    }, [allItems]);

    const resetFilters = () => {
        setActiveCategory("all"); setActiveGenres([]); setSearchQuery(""); setDebouncedQuery(""); setMinYear(""); setMaxYear("");
    };

    const isSearchActive = debouncedQuery.trim() !== "" || activeCategory !== "all" || activeGenres.length > 0 || minYear !== "" || maxYear !== "";

    return (
        <div className="min-h-screen bg-[#050B12]">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto mb-12 relative">
                    <h2 className="text-white mb-6 font-bold text-3xl">Keşfet</h2>

                    {showFilters && <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />}

                    {/* SEARCH BAR & FILTERS */}
                    <div className="relative z-50 mb-8">
                        <div className="flex items-center w-full bg-[#0A1A2F] border-2 border-[#0A1A2F] rounded-2xl shadow-lg focus-within:border-[#3DD9B4] transition-all">
                            <div className="pl-4"><SearchIcon className="w-5 h-5 text-gray-400" /></div>
                            <input
                                type="text"
                                placeholder="Film, kitap, yazar veya yönetmen ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent border-none text-white placeholder-gray-500 focus:outline-none px-4 py-4"
                            />
                            <div className="flex items-center pr-2 gap-2">
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery("")} className="p-2 hover:bg-gray-700 rounded-full text-gray-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <div className="w-[1px] h-6 bg-gray-700 mx-1" />
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${showFilters || isSearchActive ? "bg-[#3DD9B4] text-[#050B12] font-semibold" : "text-gray-400 hover:bg-gray-800"}`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="hidden sm:block">Filtreler</span>
                                </button>
                            </div>
                        </div>

                        {/* FILTER PANEL */}
                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-full md:w-[500px] p-6 bg-[#0A1A2F] rounded-3xl border border-[#3DD9B4]/20 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                {/* ... Filtreler Aynı ... */}
                                <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
                                    <h4 className="text-white font-medium">Filtre Seçenekleri</h4>
                                    {isSearchActive && (
                                        <button onClick={resetFilters} className="text-red-400 text-sm flex items-center gap-1 hover:text-red-300 transition-colors">
                                            <RotateCcw className="w-3 h-3" /> Sıfırla
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* Kategori */}
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-3 block">Kategori</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { id: "all", label: "Tümü" },
                                                { id: "movie", label: "Filmler", icon: Film },
                                                { id: "book", label: "Kitaplar", icon: BookOpen }
                                            ].map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setActiveCategory(cat.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${activeCategory === cat.id ? "bg-[#3DD9B4] text-[#050B12] border-[#3DD9B4] font-semibold" : "bg-[#050B12] text-gray-400 border-[#1E293B] hover:bg-gray-800"}`}
                                                >
                                                    {cat.icon && <cat.icon className="w-4 h-4" />}
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Yıl */}
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-3 block">Yıl Aralığı</label>
                                        <div className="flex items-center gap-3">
                                            <input type="number" placeholder="Min" value={minYear} onChange={(e) => setMinYear(e.target.value)} className="w-full bg-[#050B12] border border-[#1E293B] text-white rounded-xl px-4 py-2 text-sm focus:border-[#3DD9B4] outline-none" />
                                            <span className="text-gray-500">-</span>
                                            <input type="number" placeholder="Max" value={maxYear} onChange={(e) => setMaxYear(e.target.value)} className="w-full bg-[#050B12] border border-[#1E293B] text-white rounded-xl px-4 py-2 text-sm focus:border-[#3DD9B4] outline-none" />
                                        </div>
                                    </div>

                                    {/* Türler */}
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-3 block">Tür</label>
                                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                            {displayedGenres.map((g) => (
                                                <button
                                                    key={g}
                                                    onClick={() => setActiveGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${activeGenres.includes(g) ? "bg-[#3DD9B4] text-[#050B12] border-[#3DD9B4]" : "bg-[#050B12] text-gray-400 border-[#1E293B] hover:bg-gray-800"}`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RESULTS OR SLIDER */}
                    <div className="pb-20 relative z-10">
                        {isLoading ? (
                            <div className="flex justify-center py-20"><Spinner /></div>
                        ) : isSearchActive ? (
                            // DURUM 1: ARAMA AKTİF -> GRID GÖRÜNÜM
                            <section className="animate-in fade-in duration-300">
                                <h3 className="text-white mb-6 text-xl">
                                    {filteredContent.length > 0 ? `${filteredContent.length} sonuç bulundu` : "Sonuç bulunamadı"}
                                </h3>
                                {filteredContent.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                        {filteredContent.map((item: any) => (
                                            <ContentCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-[#0A1A2F]/50 rounded-3xl border border-dashed border-gray-700">
                                        <Frown className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                        <h3 className="text-white mb-2">Eşleşen içerik yok</h3>
                                        <button onClick={resetFilters} className="text-[#3DD9B4] hover:underline">Filtreleri temizle</button>
                                    </div>
                                )}
                            </section>
                        ) : (
                            // DURUM 2: VİTRİN GÖRÜNÜMÜ
                            <div className="space-y-16 animate-in fade-in duration-500">

                                {/* 1. En Popüler Filmler */}
                                {popularMovies.length > 0 && (
                                    <section>
                                        <CarouselRow title="En Popüler Filmler" items={popularMovies} />
                                    </section>
                                )}

                                        {/* 3. En Yüksek Puanlı Filmler */}
                                        {topMovies.length > 0 && (
                                            <section>
                                                <CarouselRow title="En Yüksek Puanlı Filmler" items={topMovies} />
                                            </section>
                                        )}

                                {/* 2. En Popüler Kitaplar */}
                                {popularBooks.length > 0 && (
                                    <section>
                                        <CarouselRow title="En Popüler Kitaplar" items={popularBooks} />
                                    </section>
                                )}

                               
                                {/* 4. En Yüksek Puanlı Kitaplar */}
                                {topBooks.length > 0 && (
                                    <section>
                                        <CarouselRow title="En Yüksek Puanlı Kitaplar" items={topBooks} />
                                    </section>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}