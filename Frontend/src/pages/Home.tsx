import { useState, useEffect } from "react";
import ActivityCard from "../components/ActivityCard";
import { api } from "../services/api"; // Servisimizi import ettik
import Spinner from "../components/ui/Spinner"; // Spinner import ettik
import { Sparkles, Loader2 } from "lucide-react";

export default function Home() {
    const [activities, setActivities] = useState<any[]>([]); // Aktiviteleri tutar
    const [loading, setLoading] = useState(true); // Sayfa ilk a  l   y kleniyor mu?
    const [loadingMore, setLoadingMore] = useState(false); // "Daha fazla y kle" d n yor mu?
    const [page, setPage] = useState(1); // Hangi sayfaday z?

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const data = await api.getFeed(1);
                setActivities(data);
            } catch (error) {
                console.error("Feed yüklenirken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // 2. "Daha Fazla Y kle" Butonuna Bas nca  al   r
    const handleLoadMore = async () => {
        setLoadingMore(true);
        const nextPage = page + 1;

        try {
            const newActivities = await api.getFeed(nextPage);
            setActivities((prev) => [...prev, ...newActivities]);
            setPage(nextPage);
        } catch (error) {
            console.error("Daha fazla veri yüklenemedi:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    // E er sayfa ilk kez y kleniyorsa sadece Spinner g ster
    if (loading) {
        return (
            <div className="min-h-screen bg-[#050B12] flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050B12]">
            <div className="container mx-auto px-4 py-8 max-w-3xl">
                {/* Sayfa Ba l    */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-6 h-6 text-[#3DD9B4]" />
                        <h2 className="text-white">Akışınız</h2>
                    </div>
                    <p className="text-gray-400">Arkadaşlarınızın aktivitelerini görün</p>
                </div>
                {/* Aktivite Akış */}

                <div className="space-y-6">
                    {activities.map((activity, index) => (
                        // activity.id veya activity.activityId yoksa index kullanılır (Hata önleyici)
                        <ActivityCard
                            key={activity.activityId || activity.id || index}
                            activity={activity}
                        />
                    ))}
                </div>
                {/* Daha Fazla Yükle Butonu */}
                <div className="mt-8 text-center pb-12">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-8 py-3 rounded-2xl bg-[#0A1A2F] text-[#3DD9B4] border-2 border-[#0A1A2F] hover:border-[#3DD9B4] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Yükleniyor...
                            </>
                        ) : (
                            "Daha fazla yükle"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
