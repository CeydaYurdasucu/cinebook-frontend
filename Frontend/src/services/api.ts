import { mockActivities, mockContent, mockUsers } from "../utils/mockData";
import { toast } from "sonner";

// Backend'den beklenen DTO'lar için Typescript tipleri
interface UserDTO { id: number; username: string; email: string; bio?: string; }
interface ReviewDTO { id: number; content: string; mediaItemId: number; userId: number; }
interface RatingDTO { id: number; score: number; mediaItemId: number; userId: number; }
interface LibraryEntryDTO { id: number; status: number; mediaItemId: number; userId: number; }
interface CustomListDTO { id: number; name: string; userId: number; }
interface CustomListItemDTO { id: number; customListId: number; mediaItemId: number; }
interface UserFollowDTO { id: number; followerId: number; followingId: number; }
interface ActivityCommentDTO { id: number; commentText: string; userId: number; }
interface ActivityLikeDTO { id: number; userId: number; }

const API_BASE_URL: string = (import.meta as any).env.VITE_API_BASE_URL || "https://localhost:7255/api";

// JWT Payload'unu Base64 decode ederek ID'yi çözmeye yarayan fonksiyon
const decodeJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        // .NET Identity genellikle kullanıcı adını bu uzun anahtarla saklar:
        const nameKey = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
        const idKey = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

        const userId = payload[idKey] || payload.nameid || payload.sub;
        const username = payload[nameKey] || payload.unique_name || payload.name;

        return { id: parseInt(String(userId), 10), username: String(username) };
    } catch (e) {
        console.error("JWT Decode Error:", e);
        return null;
    }
};

// İstek başlıklarını Authorization ile birlikte oluşturur
const getAuthHeaders = (contentType: string = "application/json") => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = { "Content-Type": contentType };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};

// Response işleme ve hata fırlatma
async function handleResponse(response: Response, mockFallback: any = null) {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    let data;

    try {
        data = isJson && response.status !== 204 ? await response.json() : await response.text();
    } catch {
        data = { error: response.statusText || "Sunucudan beklenmeyen yanıt." };
    }

    if (!response.ok) {
        const errorMsg = (data && typeof data === 'object' && data.error) || data || response.statusText;

        if (mockFallback) {
            console.error("API çağrısı başarısız, Mock verisi kullanılıyor:", errorMsg);
            return mockFallback;
        }

        // Hata mesajını düzgün fırlat
        if (typeof data === 'string') throw new Error(data);
        if (typeof errorMsg === 'string') throw new Error(errorMsg);
        throw new Error(JSON.stringify(errorMsg));
    }
    if (response.status === 204) return {};
    return data;
}

// Kullanıcının ID'sini (Token'dan çözülmüş) veya null döndürür
const getUserIdFromToken = (): number | null => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;

    const userPayload = decodeJwt(token);
    return userPayload && !isNaN(userPayload.id) ? userPayload.id : null;
};

export const api = {

    // --- AUTH ---
    register: async (username: string, email: string, password: string, bio: string = "", profilePictureUrl: string | null = null): Promise<UserDTO> => {
        const registerDto = { username, email, password, bio, profilePictureUrl };
        const response = await fetch(`${API_BASE_URL}/User`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(registerDto),
        });
        return handleResponse(response);
    },

    login: async (username: string, password: string): Promise<{ token: string }> => {
        const loginDto = { username, password };
        const response = await fetch(`${API_BASE_URL}/User/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginDto),
        });

        const data = await handleResponse(response);

        if (!data || typeof data !== "object" || typeof (data as any).token !== "string") {
            throw new Error("Login yanıtında token bulunamadı.");
        }

        const token = (data as any).token;
        localStorage.setItem("authToken", token);

        // Token içinden ID ve Username'i alıp storage'a atalım (Kolay erişim için)
        const userInfo = decodeJwt(token);
        if (userInfo) {
            if (userInfo.id) localStorage.setItem("userId", userInfo.id.toString());
            if (userInfo.username) localStorage.setItem("username", userInfo.username);
        }

        return { token };
    },

    logout: async (): Promise<void> => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userId");
        localStorage.removeItem("username");
        const response = await fetch(`${API_BASE_URL}/User/logout`, {
            method: "POST",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    forgotPassword: async (email: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/User/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        return handleResponse(response);
    },


    // --- USER PROFILE & EDIT ---

    // Genel profil çekme (Public)
    getUserProfile: async (id: number): Promise<UserDTO> => {
        const mockFallback = mockUsers.find((u: any) => String(u.id) === String(id)) || null;
        const response = await fetch(`${API_BASE_URL}/User/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response, mockFallback);
    },

    // EditProfile.tsx için gerekli (get)
    getUser: async (id: number) => {
        const response = await fetch(`${API_BASE_URL}/User/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // EditProfile.tsx için gerekli (update)
    updateUser: async (id: number, userData: any) => {
        const response = await fetch(`${API_BASE_URL}/User/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }
        return true;
    },

    // Profile.tsx routing için gerekli
    getUserByUsername: async (username: string): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/User/by-username/${username}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Profile.tsx -> Özel listeler sekmesi için
    getUserCustomLists: async (userId: number): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/CustomList/user/${userId}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Profile.tsx -> İzlediklerim, Okuduklarım sekmeleri için
    getUserLibrary: async (userId: number, status?: number): Promise<any[]> => {
        // status parametresi varsa query string olarak ekle
        const url = status
            ? `${API_BASE_URL}/LibraryEntry/user/${userId}?status=${status}`
            : `${API_BASE_URL}/LibraryEntry/user/${userId}`;

        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Profile.tsx -> Son aktiviteler için
    getUserActivities: async (userId: number): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/Timeline/user/${userId}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // --- LIST DETAILS ---

    getCustomList: async (listId: string | number) => {
        const response = await fetch(`${API_BASE_URL}/CustomList/${listId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    getCustomListItems: async (listId: string | number) => {
        const response = await fetch(`${API_BASE_URL}/CustomListItem/list/${listId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        return handleResponse(response);
    },

    // ListDetail.tsx'deki "addMediaToCustomList" çağrısı için
    addMediaToCustomList: async (listId: string | number, mediaItemId: number): Promise<any> => {
        // Backend'de bu işlem CustomListItem POST isteği ile yapılır
        // Ancak ListDetail.tsx bunu bekliyor, o yüzden wrapper yazıyoruz.
        const itemDto = { customListId: Number(listId), mediaItemId };
        const response = await fetch(`${API_BASE_URL}/CustomListItem`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(itemDto),
        });
        return handleResponse(response);
    },

    // --- MEDIA ---

    // Arama modalları için tüm medyayı çekme (Profile ve ListDetail)
    getAllMediaItems: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/MediaItem`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Frontend Search (Search.tsx)
    search: async (query: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/MediaItem`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        const allItems = await response.json();
        return allItems.filter((item: any) =>
            item.title.toLowerCase().includes(query.toLowerCase())
        );
    },

    getMediaItemById: async (id: number): Promise<any> => {
        const response = await fetch(`${API_BASE_URL}/MediaItem/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getTopRated: async () => {
        const response = await fetch(`${API_BASE_URL}/MediaItem`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        const allItems = await response.json();
        return allItems
            .filter((item: any) => item.averageRating != null)
            .sort((a: any, b: any) => b.averageRating - a.averageRating)
            .slice(0, 10);
    },

    fetchExternalMedia: async (externalId: string, mediaType: string): Promise<any> => {
        const requestDto = { externalId, mediaType };
        const response = await fetch(`${API_BASE_URL}/MediaItem/fetch`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(requestDto),
        });
        return handleResponse(response);
    },

    // --- LIBRARY & RATINGS & REVIEWS ---

    // Profile.tsx'deki "addToUserLibrary" çağrısı için wrapper
    addToUserLibrary: async (mediaItemId: number, status: number) => {
        const response = await fetch(`${API_BASE_URL}/LibraryEntry`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ mediaItemId, status }),
        });
        return handleResponse(response);
    },

    addLibraryEntry: async (mediaItemId: number, status: number, completedDate: Date | null = null): Promise<LibraryEntryDTO> => {
        const entryDto = { mediaItemId, status, completedDate };
        const response = await fetch(`${API_BASE_URL}/LibraryEntry`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(entryDto),
        });
        return handleResponse(response);
    },

    updateLibraryEntry: async (id: number, status: number, completedDate: Date | null = null): Promise<void> => {
        const updateDto = { id, status, completedDate };
        const response = await fetch(`${API_BASE_URL}/LibraryEntry/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateDto),
        });
        return handleResponse(response);
    },

    deleteLibraryEntry: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/LibraryEntry/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    // Ratings
    addRating: async (mediaItemId: number, score: number): Promise<RatingDTO> => {
        const ratingDto = { mediaItemId, score };
        const response = await fetch(`${API_BASE_URL}/Rating`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(ratingDto),
        });
        return handleResponse(response);
    },

    updateRating: async (id: number, score: number): Promise<void> => {
        const updateDto = { id, score };
        const response = await fetch(`${API_BASE_URL}/Rating/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateDto),
        });
        return handleResponse(response);
    },

    deleteRating: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/Rating/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getUserRatingForMedia: async (mediaItemId: number): Promise<RatingDTO | null> => {
        const response = await fetch(`${API_BASE_URL}/Rating/user/${mediaItemId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (response.status === 404) return null;
        return handleResponse(response);
    },

    // Reviews
    addReview: async (mediaItemId: number, content: string): Promise<ReviewDTO> => {
        const reviewDto = { mediaItemId, content };
        const response = await fetch(`${API_BASE_URL}/Review`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(reviewDto),
        });
        return handleResponse(response);
    },

    updateReview: async (id: number, content: string): Promise<void> => {
        const updateDto = { id, content };
        const response = await fetch(`${API_BASE_URL}/Review/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateDto),
        });
        return handleResponse(response);
    },

    deleteReview: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/Review/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    getUserReviewForMedia: async (mediaItemId: number): Promise<ReviewDTO | null> => {
        const response = await fetch(`${API_BASE_URL}/Review/user/${mediaItemId}`, {
            method: "GET",
            headers: getAuthHeaders()
        });
        if (response.status === 404) return null;
        return handleResponse(response);
    },

    getReviewsByMediaId: async (mediaItemId: number): Promise<any[]> => {
        const response = await fetch(`${API_BASE_URL}/Review/media/${mediaItemId}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        if (!response.ok) return [];
        return await response.json();
    },

    // --- SOCIAL (FOLLOW & ACTIVITY) ---

    followUser: async (followingId: number): Promise<UserFollowDTO> => {
        const followerId = getUserIdFromToken();
        if (!followerId) throw new Error("İşlem için oturum açmalısınız.");

        const followDto = { followingUserId: followingId };

        const response = await fetch(`${API_BASE_URL}/UserFollow`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(followDto),
        });

        return handleResponse(response);
    },

    unfollowUser: async (followingUserId: number): Promise<void> => {
        const response = await fetch(
            `${API_BASE_URL}/UserFollow/unfollow/${followingUserId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            }
        );

        return handleResponse(response);
    },


    // services/api.ts içinde GÜNCELLE

    // AKTİVİTE AKIŞI (Feed)
    getFeed: async (page: number = 1): Promise<any[]> => {
        const mockFallback = mockActivities.map((a) => ({
            ...a,
            id: `${a.id}-${Math.random()}`,
        }));

        const response = await fetch(`${API_BASE_URL}/Timeline?page=${page}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const raw = await handleResponse(response, mockFallback);

        const formatted = raw.map((a: any) => ({
            id: a.activityId,
            user: {
                id: a.user.userId,
                username: a.user.username,
                displayName: a.user.username,
                avatar: a.user.avatarUrl,
            },
            action: a.actionText,
            content: {
                id: a.content.contentId,
                type: a.content.category,
                title: a.content.title,
                poster: a.content.posterUrl,
            },
            rating: a.ratingScore,
            review: a.reviewExcerpt,
            likes: a.likeCount,

            // ⭐ DOĞRU ALAN
            comments: a.commentCount ?? 0,

            timestamp: a.createdAt,
        }));

        return formatted;
    },

    addLike: async (ratingId: number | null, reviewId: number | null): Promise<ActivityLikeDTO> => {
        const likeDto = { ratingId: ratingId || null, reviewId: reviewId || null };
        const response = await fetch(`${API_BASE_URL}/ActivityLike`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(likeDto),
        });
        return handleResponse(response);
    },

    removeLike: async (likeId: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/ActivityLike/${likeId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    addActivityComment: async (text: string, ratingId: number | null, reviewId: number | null): Promise<ActivityCommentDTO> => {
        const commentDto = { commentText: text, ratingId: ratingId || null, reviewId: reviewId || null };
        const response = await fetch(`${API_BASE_URL}/ActivityComment`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(commentDto),
        });
        return handleResponse(response);
    },

    updateActivityComment: async (id: number, newText: string): Promise<void> => {
        const updateDto = { id, commentText: newText };
        const response = await fetch(`${API_BASE_URL}/ActivityComment/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateDto),
        });
        return handleResponse(response);
    },

    // --- CUSTOM LISTS (BASIC CRUD) ---

    addCustomList: async (name: string, description: string = ""): Promise<CustomListDTO> => {
        const listDto = { name, description };
        const response = await fetch(`${API_BASE_URL}/CustomList`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(listDto),
        });
        return handleResponse(response);
    },

    updateCustomList: async (id: number, name: string, description: string = ""): Promise<void> => {
        const updateDto = { id, name, description };
        const response = await fetch(`${API_BASE_URL}/CustomList/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateDto),
        });
        return handleResponse(response);
    },

    deleteCustomList: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/CustomList/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    addCustomListItem: async (customListId: number, mediaItemId: number): Promise<CustomListItemDTO> => {
        const itemDto = { customListId, mediaItemId };
        const response = await fetch(`${API_BASE_URL}/CustomListItem`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(itemDto),
        });
        return handleResponse(response);
    },

    deleteCustomListItem: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/CustomListItem/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    toggleLike: async (activityId: number, type: string) => {
        const response = await fetch(
            `${API_BASE_URL}/Timeline/${activityId}/like?type=${type}`,
            {
                method: "POST",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Like Hatası:", errorText);
            throw new Error("Beğeni işlemi başarısız");
        }

        return response.json();
    },

    // services/api.ts içine ekle/değiştir

    // ActivityCard tarafından kullanılan: Yorum gönderir
    postComment: async (
        activityId: number | string,
        text: string,
        type: string
    ) => {
        const numericId = Number(activityId);

        // Review mi Rating mi olduğunu güvenle belirliyoruz
        const isReview = type === "Review";
        const isRating = type === "Rating";

        // Geçersiz tip durumunda engelle
        if (!isReview && !isRating) {
            throw new Error("Geçersiz aktivite tipi: Review veya Rating olmalı.");
        }

        const response = await fetch(`${API_BASE_URL}/ActivityComment`, {
            method: "POST",
            headers: {
                ...getAuthHeaders(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                ReviewId: isReview ? numericId : null,
                RatingId: isRating ? numericId : null,
                CommentText: text,
            }),
        });

        // --- HATA YAKALAMA ---
        if (!response.ok) {
            let errorMessage = "Yorum gönderilemedi";

            try {
                // Backend JSON döndürüyorsa parse edelim
                const errorBody = await response.json();

                if (errorBody?.error) {
                    errorMessage = errorBody.error;
                } else if (response.status === 400 && errorBody?.errors) {
                    // ModelState Errors
                    errorMessage =
                        "Giriş hatası: " + Object.values(errorBody.errors).flat().join(" ");
                } else if (response.status === 500) {
                    errorMessage = "Sunucu hatası (500). Backend loglarını kontrol edin.";
                }
            } catch (err) {
                const errorText = await response.text();
                errorMessage = `${errorMessage} — Sunucu yanıtı: ${errorText}`;
            }

            throw new Error(errorMessage);
        }

        return response.json();
    },


    // services/api.ts içine ekle

    // ActivityCard tarafından kullanılan: Yorumları getirir
    // Bir aktivitenin tüm yorumlarını getirir.
    // Hem Review hem Rating için çalışır.
    getComments: async (activityId: number | string, type: string) => {
        const numericId = Number(activityId);

        const response = await fetch(
            `${API_BASE_URL}/Timeline/${numericId}/comments?type=${type}`,
            {
                method: "GET",
                headers: {
                    ...getAuthHeaders(),
                },
            }
        );

        // ❗ HATA YAKALAMA — body'yi SADECE 1 KEZ oku
        if (!response.ok) {
            const errorText = await response.text(); // 🔥 Sadece 1 defa oku
            throw new Error("Yorumlar getirilemedi: " + errorText);
        }

        // ❗ Burada JSON güvenle okunabilir
        return response.json();
    },
};