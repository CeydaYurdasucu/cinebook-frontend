import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api"; // Servis yolun doğru olmalı
import { Trash, Plus, BookOpen, Film, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function ListDetail() {
  const { id } = useParams();

  // --- MEVCUT STATE'LER ---
  const [list, setList] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- YENİ EKLENEN ARAMA STATE'LERİ ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [allMediaItems, setAllMediaItems] = useState<any[]>([]); // Arama havuzu
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // --- SAYFA YÜKLENİRKEN ---
  const load = async () => {
    try {
      // Listeyi ve içeriklerini çek
      const listData = await api.getCustomList(id);
      const itemData = await api.getCustomListItems(id);
      setList(listData);
      setItems(itemData);
    } catch (err) {
      console.error(err);
      toast.error("Liste yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  // --- TÜM MEDYALARI ÇEK (Arama yapmak için) ---
  const fetchAllMediaForSearch = async () => {
    try {
      const allData = await api.getAllMediaItems();
      setAllMediaItems(allData);
    } catch (err) {
      console.error("Medya havuzu çekilemedi", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    fetchAllMediaForSearch(); // Sayfa açılınca arama havuzunu da hazırla
  }, [id]);

  // --- SİLME İŞLEMİ ---
  const handleDelete = async (itemId: number) => {
    if (!confirm("Bu içeriği listeden kaldırmak istiyor musunuz?")) return;

    try {
      await api.deleteCustomListItem(itemId);
      setItems(items.filter((x) => x.id !== itemId));
      toast.success("İçerik kaldırıldı!");
    } catch {
      toast.error("Silme başarısız.");
    }
  };

  // --- ARAMA İŞLEMİ (Mixed Mode) ---
  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setSearchLoading(true);

    try {
      const lowered = searchTerm.toLowerCase();

      // Custom List olduğu için hem KİTAP hem FİLM getiriyoruz
      const filtered = allMediaItems.filter((m) => {
        const title = m.title?.toLowerCase() || "";
        // Tip kontrolü (Veri tabanından gelen yapıya göre numeric veya string olabilir)
        const typeName = m.typeName?.toLowerCase() || "";
        const numeric = m.type;

        // Film mi? (0 veya 2 veya "movie")
        const isMovie = typeName === "movie" || numeric === 0 || numeric === 2;
        // Kitap mı? (1 veya "book")
        const isBook = typeName === "book" || numeric === 1;

        // İkisinden biri ise ve başlık uyuşuyorsa getir
        return (isMovie || isBook) && title.includes(lowered);
      });

      setSearchResults(filtered);
    } finally {
      setSearchLoading(false);
    }
  };

  // --- LİSTEYE EKLEME İŞLEMİ ---
  const handleAddToList = async (mediaId: number) => {
    try {
      await api.addMediaToCustomList(id, mediaId);
      toast.success("Listeye eklendi!");
      setShowAddModal(false);

      // Listeyi güncelle ki yeni eklenen görünsün
      load();

      // Modal temizliği
      setSearchTerm("");
      setSearchResults([]);
    } catch (error) {
      console.error(error);
      toast.error("Ekleme başarısız.");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#050B12] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3DD9B4] animate-spin" />
      </div>
    );

  if (!list)
    return (
      <div className="text-center text-white mt-20">Liste bulunamadı.</div>
    );

  return (
    <div className="container mx-auto px-4 py-12 text-white min-h-screen bg-[#050B12]">
      {/* BAŞLIK ALANI */}
      <h1 className="text-4xl font-bold mb-2">{list.name}</h1>
      <p className="text-gray-400 mb-10">
        Bu listede toplam <b className="text-[#3DD9B4]">{items.length}</b>{" "}
        içerik var.
      </p>

      {/* EKLE BUTONU */}
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 bg-[#3DD9B4] text-[#050B12] rounded-xl flex items-center gap-2 font-bold hover:bg-[#34bc9b] transition"
        >
          <Plus className="w-5 h-5" />
          İçerik Ekle
        </button>
      </div>

      {/* LİSTE İÇERİĞİ - SPOTIFY STYLE */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-gray-500 text-center py-10 border border-dashed border-gray-800 rounded-2xl">
            Bu liste henüz boş. Yukarıdan içerik ekleyebilirsin.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-4 bg-[#0A1A2F]/40 hover:bg-[#0A1A2F]/70 border border-[#0A1A2F] hover:border-[#3DD9B4]/20 rounded-2xl p-3 transition-all"
            >
              {/* KAPAK */}
              <img
                src={
                  item.mediaCoverImageUrl || "https://via.placeholder.com/150"
                }
                className="w-14 h-20 object-cover rounded-xl bg-gray-900"
              />

              {/* ORTA ALAN */}
              <div className="flex-1">
                <div className="font-semibold text-sm text-gray-200 group-hover:text-[#3DD9B4] transition-colors">
                  {item.mediaTitle}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.mediaCreator}
                </div>
              </div>

              {/* YIL + TYPE */}
              <div className="text-right mr-4 text-xs text-gray-400 flex flex-col items-end">
                <span>{item.releaseYear}</span>
                <span className="flex items-center gap-1 mt-1 bg-[#050B12] px-2 py-1 rounded-md">
                  {item.mediaType === "Book" ? (
                    <BookOpen className="w-3 h-3 text-blue-400" />
                  ) : (
                    <Film className="w-3 h-3 text-red-400" />
                  )}
                  {item.mediaType === "Book" ? "Kitap" : "Film"}
                </span>
              </div>

              {/* SİL BUTTON */}
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* --- EKLEME MODALI --- */}
      {/* --- TASARIMI GÜNCELLENMİŞ MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#0A1A2F] rounded-3xl w-full max-w-lg border border-[#3DD9B4]/30 flex flex-col shadow-2xl overflow-hidden">
            {/* ÜST KISIM (BAŞLIK + ARAMA) */}
            <div className="p-6 pb-2 flex-shrink-0">
              <h3 className="text-white text-xl mb-4 font-bold">
                Listeye İçerik Ekle
              </h3>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Film veya kitap ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 bg-[#050B12] border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-[#3DD9B4]"
                />

                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-[#3DD9B4] text-[#050B12] rounded-xl font-bold text-sm hover:bg-[#34bc9b] transition"
                >
                  {searchLoading ? "..." : "Ara"}
                </button>
              </div>
            </div>

            {/* ORTA KISIM (SCROLL EDİLEBİLİR SONUÇLAR) */}
            <div
              className="px-6 py-3 space-y-3 overflow-y-auto"
              style={{ maxHeight: "50vh" }}
            >
              {searchLoading && (
                <div className="text-gray-400 text-center py-4 text-sm">
                  Aranıyor...
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && searchTerm && (
                <div className="text-gray-500 text-center py-4 text-sm">
                  Sonuç yok.
                </div>
              )}

              {!searchLoading && searchResults.length === 0 && !searchTerm && (
                <div className="text-gray-600 text-center py-4 text-sm">
                  Arama yaparak başlayın.
                </div>
              )}

              {!searchLoading &&
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleAddToList(item.id)}
                    className="flex items-center gap-3 bg-[#050B12] p-3 rounded-xl border border-[#0A1A2F] cursor-pointer hover:border-[#3DD9B4] transition-all group"
                  >
                    {/* Görsel */}

                    <img
                      src={
                        item.posterUrl ||
                        item.coverImageUrl ||
                        "https://placehold.co/100x150?text=No+Image" // Yeni, çalışan placeholder servisi
                      }
                      className="w-10 h-14 rounded-lg object-cover bg-gray-800"
                      onError={(e) => {
                        // Eğer resim yüklenirken hata olursa (kırık link vs), otomatik olarak gri kutu göster
                        e.currentTarget.src =
                          "https://placehold.co/100x150?text=Error";
                      }}
                    />
                    {/* Yazı Alanı */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate group-hover:text-[#3DD9B4] transition-colors">
                        {item.title}
                      </p>
                      <p className="text-gray-500 text-xs flex items-center gap-2">
                        <span>{item.releaseYear || "-"}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span>
                          {item.typeName === "Book" || item.type === 1
                            ? "Kitap"
                            : "Film"}
                        </span>
                      </p>
                    </div>
                    {/* Ekle Butonu İkonu */}
                    <div className="w-8 h-8 rounded-full bg-[#0A1A2F] flex items-center justify-center group-hover:bg-[#3DD9B4] transition">
                      <Plus className="w-4 h-4 text-gray-400 group-hover:text-[#050B12]" />
                    </div>
                  </div>
                ))}
            </div>

            {/* ALT KISIM (KAPAT BUTONU) */}
            <div className="p-6 pt-2 flex-shrink-0 bg-[#0A1A2F]">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full py-2.5 rounded-xl border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
