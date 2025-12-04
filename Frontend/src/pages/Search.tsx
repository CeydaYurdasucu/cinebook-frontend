import { useState, useEffect, useMemo } from "react"; // useMemo eklendi
import { Search as SearchIcon, Filter, Star, X, BookOpen, Film, Frown, RotateCcw, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import Spinner from "../components/ui/Spinner";
import { api } from "../services/api";

export default function Search() {
    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState(""); // YENİ: Gecikmeli arama için
    const [showFilters, setShowFilters] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeGenres, setActiveGenres] = useState<string[]>([]);

    const [minYear, setMinYear] = useState("");
    const [maxYear, setMaxYear] = useState("");

    // filteredContent state'ini sildik, yerine useMemo kullanacağız.
    // isSearching state'ini basitleştirdik.
    const [allItems, setAllItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true); // Veri çekme loading'i

    // --- TÜR LİSTELERİ ---
    const movieGenres = [
        "Aksiyon", "Macera", "Animasyon", "Komedi", "Suç",
        "Belgesel", "Dram", "Aile", "Fantastik", "Tarih",
        "Korku", "Müzik", "Gizem", "Romantik", "Bilim Kurgu",
        "TV Filmi", "Gerilim", "Savaş", "Vahşi Batı"
    ];

    const bookGenres = [
        "Fiction", "Technology", "Science", "History", "Romance",
        "Fantasy", "Medicine", "Computers", "Children", "Art"
    ];

    // useMemo ile gereksiz hesaplamayı engelle
    const displayedGenres = useMemo(() => {
        return activeCategory === "movie"
            ? movieGenres
            : activeCategory === "book"
                ? bookGenres
                : Array.from(new Set([...movieGenres, ...bookGenres]));
    }, [activeCategory]);

    // --- DEBOUNCE MANTIĞI (Input gecikmesini çözer) ---
    // Kullanıcı yazmayı bitirdikten 300ms sonra filtreleme yapar.
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // --- Kategori değişince türleri temizle ---
    useEffect(() => {
        setActiveGenres([]);
    }, [activeCategory]);

    // --- TÜM VERİYİ ÇEK ---
    useEffect(() => {
        setIsLoading(true);
        api.search("").then(data => {
            const safeData = Array.isArray(data) ? data : [];
            setAllItems(safeData);
        }).catch(err => {
            console.error("Hata:", err);
            setAllItems([]);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    // --- OPTİMİZE EDİLMİŞ FİLTRELEME (useMemo) ---
    // Bu kısım sadece ilgili değişkenler değiştiğinde çalışır, her render'da çalışmaz.
    const filteredContent = useMemo(() => {
        if (allItems.length === 0) return [];

        return allItems.filter((item: any) => {
            // 1. Kategori Filtresi
            if (activeCategory === "movie" && !(item.type === 2 || item.mediaType === "Movie")) return false;
            if (activeCategory === "book" && !(item.type === 1 || item.mediaType === "Book")) return false;

            // 2. Yıl Filtresi
            if (item.releaseYear) {
                const year = parseInt(String(item.releaseYear));
                const min = minYear ? parseInt(minYear) : 0;
                const max = maxYear ? parseInt(maxYear) : 9999;
                if (year < min || year > max) return false;
            } else if (minYear || maxYear) {
                // Yılı olmayanları filtre varsa ele
                return false;
            }

            // 3. Tür Filtresi
            if (activeGenres.length > 0) {
                if (!item.genres) return false;
                const itemGenresLower = item.genres.toLowerCase();
                const matchesGenre = activeGenres.every(g =>
                    itemGenresLower.includes(g.toLowerCase().split('/')[0].trim())
                );
                if (!matchesGenre) return false;
            }

            // 4. Metin Arama (Debounced Query kullanıyoruz)
            if (debouncedQuery.trim() !== "") {
                const lowerQuery = debouncedQuery.toLowerCase();
                const titleMatch = item.title?.toLowerCase().includes(lowerQuery);
                const descMatch = item.description?.toLowerCase().includes(lowerQuery);
                const creatorMatch = item.creator?.toLowerCase().includes(lowerQuery);

                if (!titleMatch && !descMatch && !creatorMatch) return false;
            }

            return true;
        });
    }, [allItems, activeCategory, activeGenres, minYear, maxYear, debouncedQuery]); // searchQuery yerine debouncedQuery

    // Top Rated listesini de useMemo ile hesapla
    const topRated = useMemo(() => {
        return [...allItems]
            .sort((a: any, b: any) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
            .slice(0, 10);
    }, [allItems]);

    const resetFilters = () => {
        setActiveCategory("all");
        setActiveGenres([]);
        setSearchQuery(""); // Inputu temizle
        setDebouncedQuery(""); // Filtreyi temizle
        setMinYear("");
        setMaxYear("");
    };

    const isSearchActive =
        debouncedQuery.trim() !== "" || activeCategory !== "all" || activeGenres.length > 0 || minYear !== "" || maxYear !== "";

    return (
        <div className="min-h-screen bg-[#050B12]">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto mb-12 relative">
                    <h2 className="text-white mb-6 font-bold text-3xl">Keşfet</h2>

                    {showFilters && (
                        <div className="fixed inset-0 z-40" onClick={() => setShowFilters(false)} />
                    )}

                    {/* SEARCH BAR */}
                    <div className="relative z-50">
                        <div className="flex items-center w-full bg-[#0A1A2F] border-2 border-[#0A1A2F] rounded-2xl shadow-lg focus-within:border-[#3DD9B4] transition-all">
                            <div className="pl-4">
                                <SearchIcon className="w-5 h-5 text-gray-400" />
                            </div>

                            <input
                                type="text"
                                placeholder="Film, kitap, yazar veya yönetmen ara..."
                                value={searchQuery}
                                // Input değişimi artık sadece string state'i günceller, ağır işlem yapmaz
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
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${showFilters || isSearchActive
                                        ? "bg-[#3DD9B4] text-[#050B12] font-semibold"
                                        : "text-gray-400 hover:bg-gray-800"
                                        }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="hidden sm:block">Filtreler</span>
                                </button>
                            </div>
                        </div>

                        {/* FILTER PANEL - (Burada değişiklik yok, aynı kalabilir) */}
                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-full md:w-[500px] p-6 bg-[#0A1A2F] rounded-3xl border border-[#3DD9B4]/20 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                                {/* ... FİLTRE İÇERİĞİ AYNI KALACAK ... */}
                                {/* Kod kalabalığı olmaması için bu arayı kısaltıyorum, senin kodunun aynısı buraya gelecek */}
                                <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
                                    <h4 className="text-white font-medium">Filtre Seçenekleri</h4>
                                    {isSearchActive && (
                                        <button onClick={resetFilters} className="text-red-400 text-sm flex items-center gap-1 hover:text-red-300 transition-colors">
                                            <RotateCcw className="w-3 h-3" /> Sıfırla
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">
                                    {/* KATEGORİ BUTONLARI */}
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
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${activeCategory === cat.id
                                                        ? "bg-[#3DD9B4] text-[#050B12] border-[#3DD9B4] font-semibold"
                                                        : "bg-[#050B12] text-gray-400 border-[#1E293B] hover:bg-gray-800"
                                                        }`}
                                                >
                                                    {cat.icon && <cat.icon className="w-4 h-4" />}
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* YIL INPUTLARI */}
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-3 block">Yıl Aralığı</label>
                                        <div className="flex items-center gap-3">
                                            <input type="number" placeholder="Min" value={minYear} onChange={(e) => setMinYear(e.target.value)} className="w-full bg-[#050B12] border border-[#1E293B] text-white rounded-xl px-4 py-2 text-sm focus:border-[#3DD9B4] outline-none" />
                                            <span className="text-gray-500">-</span>
                                            <input type="number" placeholder="Max" value={maxYear} onChange={(e) => setMaxYear(e.target.value)} className="w-full bg-[#050B12] border border-[#1E293B] text-white rounded-xl px-4 py-2 text-sm focus:border-[#3DD9B4] outline-none" />
                                        </div>
                                    </div>

                                    {/* TÜR SEÇİMİ */}
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-gray-500 text-xs font-bold uppercase block">Tür</label>
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                            {displayedGenres.map((g) => (
                                                <button
                                                    key={g}
                                                    onClick={() => setActiveGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${activeGenres.includes(g)
                                                        ? "bg-[#3DD9B4] text-[#050B12] border-[#3DD9B4]"
                                                        : "bg-[#050B12] text-gray-400 border-[#1E293B] hover:bg-gray-800"
                                                        }`}
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
                </div>

                {/* RESULTS */}
                <div className="max-w-6xl mx-auto pb-20 relative z-10">
                    {isLoading ? (
                        <div className="flex justify-center py-20"><Spinner /></div>
                    ) : isSearchActive ? (
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
                        <div className="space-y-16 animate-in fade-in duration-500">
                            <section>
                                <h3 className="text-white mb-6 flex items-center gap-2 text-xl font-bold">
                                    <TrendingUp className="w-5 h-5 text-[#3DD9B4]" /> En Yüksek Puanlılar
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {topRated.map((item: any) => (
                                        <ContentCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ContentCard componentin aynı kalabilir, sadece React.memo ile sarabilirsin ekstra performans için
const ContentCard = ({ item }: { item: any }) => {
    // ... içeriğin aynısı ...
    const isMovie = item.type === 2 || item.mediaType === "Movie";
    return (
        <Link to={`/content/${item.id}`}>
            <div className="group cursor-pointer h-full relative">
                {/* ... Resim ve diğer alanlar ... */}
                <div className="relative mb-3 overflow-hidden rounded-2xl aspect-[2/3] shadow-lg bg-[#0A1A2F]">
                    <img
                        src={item.coverImageUrl || "https://via.placeholder.com/300x450"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                    {/* ... diğer overlay divleri ... */}
                </div>
                <h4 className="text-white text-sm font-medium mb-1 group-hover:text-[#3DD9B4] line-clamp-1">{item.title}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.releaseYear}</span>
                </div>
            </div>
        </Link>
    )
}