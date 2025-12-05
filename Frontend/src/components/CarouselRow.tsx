import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentCard from "./ContentCard";

// ... Interface tanýmlarý ayný kalabilir ...
interface ContentItem {
    id: string | number;
    title: string;
    coverImageUrl?: string;
    averageRating?: number;
    genres?: string;
    releaseYear?: number;
    rank?: number;
    type?: number;
    mediaType?: string;
}

interface CarouselRowProps {
    title: string;
    items: ContentItem[];
}

export default function CarouselRow({ title, items }: CarouselRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = items.length > 0 ? 400 : 0; // Ýsteðe baðlý: Kart geniþliðine (200px) göre tam katý (örn: 200 veya 400) yapabilirsin.
        scrollRef.current.scrollBy({
            left: direction === "right" ? scrollAmount : -scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <div className="relative mb-12 w-full group/row">
            {/* Baþlýk */}
            <h2 className="text-white mb-4 font-semibold text-xl pl-1">{title}</h2>

            <div className="relative">
                {/* --- SOL OK (DÜZELTÝLDÝ) --- */}
                {/* z-40 yerine z-50 yapýldý. Garanti olsun diye z-[60] da yapabilirsin */}
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-[60]
                     w-10 h-10 bg-black/50 hover:bg-black/80 border border-white/30 
                     backdrop-blur-sm rounded-full flex items-center justify-center 
                     text-white transition-all duration-300 hover:scale-110 shadow-lg"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>

                {/* --- SCROLL ALANI --- */}
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-hide px-1 py-2"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="shrink-0 transition-transform duration-300 hover:z-10"
                            style={{
                                width: '200px',
                                minWidth: '200px'
                            }}
                        >
                            <ContentCard item={item} />
                        </div>
                    ))}
                </div>

                {/* --- SAÐ OK --- */}
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-50 
                     w-10 h-10 bg-black/50 hover:bg-black/80 border border-white/30 
                     backdrop-blur-sm rounded-full flex items-center justify-center 
                     text-white transition-all duration-300 hover:scale-110 shadow-lg"
                >
                    <ChevronRight className="h-6 w-6" />
                </button>
            
            </div>
        </div>
    );
}