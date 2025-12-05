import { Link } from "react-router-dom";

export default function ContentCard({ item }) {
    return (
        <Link
            to={`/content/${item.id}`}
            //  shrink-0 ve geniþlik ayarlarýný
            // "block" ekledik ki div gibi davransýn.
            className="min-w-[160px] w-[160px] md:min-w-[200px] md:w-[200px] shrink-0 block"
        >
            <div className="group cursor-pointer h-full relative">

                <div className="relative mb-3 overflow-hidden rounded-2xl aspect-[2/3] shadow-lg bg-[#0A1A2F]">
                    <img
                        src={item.coverImageUrl || "https://via.placeholder.com/300x450"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                    />
                </div>

                <h4 className="text-white text-sm font-medium mb-1 group-hover:text-[#3DD9B4] line-clamp-1">
                    {item.title}
                </h4>

                <div className="text-xs text-gray-500">{item.releaseYear}</div>
            </div>
        </Link>
    );
}

