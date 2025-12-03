import { useState, useEffect } from "react";
import { Search as SearchIcon, Filter, Star, X, BookOpen, Film, Frown, RotateCcw, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import Spinner from "../components/ui/Spinner";
import { api } from "../services/api";

export default function Search() {
    // --- STATE ---
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [activeCategory, setActiveCategory] = useState("all");
    const [activeGenres, setActiveGenres] = useState<string[]>([]);
    const [filteredContent, setFilteredContent] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [topRated, setTopRated] = useState<any[]>([]);

    //  Tek backend çağrısı — sonsuza kadar buradan filtrelenecek
    const [allItems, setAllItems] = useState<any[]>([]);

    //  TÜM TÜRLER
    const genres = [
        "Bilim-Kurgu", "Dram", "Gerilim", "Komedi",
        "Fantastik", "Korku", "Aile", "Belgesel", "Müzik"
    ];

    // --- TÜM VERİYİ TEK SEFERDE ÇEK (HIZLI)
    useEffect(() => {
        api.search("").then(data => {
            setAllItems(data);

            // TOP RATED hesapla
            const sorted = [...data]
                .sort((a: any, b: any) => (b.rating ?? 0) - (a.rating ?? 0))
                .slice(0, 10);

            setTopRated(sorted);
        });
    }, []);

    // --- SEARCH + FİLTRE ---
    useEffect(() => {
        if (allItems.length === 0) return;

        setIsSearching(true);

        let result = [...allItems];

        // Kategori filtresi
        if (activeCategory !== "all") {
            result = result.filter((item: any) =>
                activeCategory === "movie" ? item.type === 2 : item.type === 1
            );
        }

      
        // Tür filtreleme (çoklu seçim, AND mantığı)
        if (activeGenres.length > 0) {
            result = result.filter((item: any) =>
                activeGenres.every(g =>
                    item.genres?.toLowerCase().includes(g.toLowerCase())
                )
            );
        }


        // Arama
        if (searchQuery.trim() !== "") {
            result = result.filter((item: any) =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredContent(result);
        setIsSearching(false);
    }, [searchQuery, activeCategory, activeGenres, allItems]); // 🔥 allItems eklendi

    const resetFilters = () => {
        setActiveCategory("all");
        setActiveGenres([]);
        setSearchQuery("");
    };

    const isSearchActive =
        searchQuery.trim() !== "" || activeCategory !== "all" || activeGenres.length > 0;

    return (
        <div className="min-h-screen bg-[#050B12]">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto mb-12 relative">
                    <h2 className="text-white mb-6">Keşfet</h2>

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
                                placeholder="Film, kitap veya kişi ara..."
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
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${showFilters || isSearchActive
                                            ? "bg-[#3DD9B4] text-[#050B12]"
                                            : "text-gray-400 hover:bg-gray-800"
                                        }`}
                                >
                                    <Filter className="w-4 h-4" />
                                    <span className="hidden sm:block">Filtreler</span>
                                </button>
                            </div>
                        </div>

                        {/* FILTER PANEL */}
                        {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-full md:w-[500px] p-6 bg-[#0A1A2F] rounded-3xl border border-[#3DD9B4]/20 shadow-2xl z-50">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
                                    <h4 className="text-white font-medium">Filtre Seçenekleri</h4>
                                    {isSearchActive && (
                                        <button onClick={resetFilters} className="text-red-400 text-sm flex items-center gap-1 hover:text-red-300">
                                            <RotateCcw className="w-3 h-3" /> Sıfırla
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-6">

                                    {/* CATEGORY */}
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-3 block">Kategori</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[{ id: "all", label: "Tümü" },
                                            { id: "movie", label: "Filmler", icon: Film },
                                            { id: "book", label: "Kitaplar", icon: BookOpen }
                                            ].map((cat) => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setActiveCategory(cat.id)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${activeCategory === cat.id
                                                            ? "bg-[#3DD9B4] text-[#050B12]"
                                                            : "bg-[#050B12] text-gray-400 hover:bg-gray-800"
                                                        }`}
                                                >
                                                    {cat.icon && <cat.icon className="w-4 h-4" />}
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GENRES — Çoklu seçim */}
                                    <div>
                                        <label className="text-gray-500 text-xs font-bold uppercase mb-3 block">Tür</label>
                                        <div className="flex flex-wrap gap-2">
                                            {genres.map((g) => (
                                                <button
                                                    key={g}
                                                    onClick={() =>
                                                        setActiveGenres(prev =>
                                                            prev.includes(g)
                                                                ? prev.filter(x => x !== g)
                                                                : [...prev, g]
                                                        )
                                                    }
                                                    className={`px-3 py-2 rounded-lg text-sm border transition-all ${activeGenres.includes(g)
                                                            ? "bg-[#3DD9B4] text-[#050B12]"
                                                            : "bg-[#050B12] text-gray-400 hover:bg-gray-800"
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
                    {isSearching ? (
                        <Spinner />
                    ) : isSearchActive ? (
                        <section className="animate-in fade-in duration-300">
                            <h3 className="text-white mb-6">
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
                                    <button onClick={resetFilters} className="text-[#3DD9B4] hover:underline">
                                        Tüm filtreleri temizle
                                    </button>
                                </div>
                            )}
                        </section>
                    ) : (
                        // --- DEFAULT (TOP RATED) ---
                        <div className="space-y-16 animate-in fade-in duration-500">
                            <section>
                                <h3 className="text-white mb-6 flex items-center gap-2">
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

// ------- CARD COMPONENT -------
function ContentCard({ item }: { item: any }) {
    return (
        <Link to={`/content/${item.id}`}>
            <div className="group cursor-pointer h-full relative">
                <div className="relative mb-3 overflow-hidden rounded-2xl aspect-[2/3] shadow-lg bg-[#0A1A2F]">
                    <img
                        src={item.coverImageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#050B12] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 rounded-lg flex items-center gap-1 border border-white/10">
                        <Star className="w-3 h-3 text-[#FFD65A] fill-[#FFD65A]" />
                        <span className="text-white text-xs font-bold">{item.rating ?? "0"}</span>
                    </div>

                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#3DD9B4] text-[#050B12] text-[10px] font-bold uppercase rounded-md">
                        {item.type === 2 ? "movie" : "book"}
                    </div>
                </div>

                <h4 className="text-white text-sm font-medium mb-1 group-hover:text-[#3DD9B4] transition-colors line-clamp-1">
                    {item.title}
                </h4>

                <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{item.releaseYear}</span>
                    <span className="truncate max-w-[60%]">{item.genres?.split(",")[0]}</span>
                </div>
            </div>
        </Link>
    );
}
