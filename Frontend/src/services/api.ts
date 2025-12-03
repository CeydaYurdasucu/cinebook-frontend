import { mockActivities, mockContent, mockUsers } from "../utils/mockData";
import { toast } from "sonner";



// Backend'den beklenen DTO'lar için Typescript tipleri (Varsayımsal olarak tanımlandı)
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

// JWT Payload'unu Base64 decode ederek ID'yi çözmeye yarayan basit fonksiyon
const decodeJwt = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const userId = payload.sub || payload.nameid;
        const username = payload.unique_name || payload.name;

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

        throw new Error(errorMsg as string);
    }
    // Eğer 204 No Content ise ve data boşsa (genelde DELETE için), boş obje döndür.
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


    // AddUserDTO (Kayıt)
    register: async (username: string, email: string, password: string, bio: string = "", profilePictureUrl: string | null = null): Promise<UserDTO> => {
        // AddUserDTO'da UserId yok, BE token'dan çözer.
        const registerDto = { username, email, password, bio, profilePictureUrl };
        const response = await fetch(`${API_BASE_URL}/User`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(registerDto),
        });
        return handleResponse(response);
    },

    //deneme 
    login: async (username: string, password: string): Promise<{ token: string }> => {
        const loginDto = { username, password };

        const response = await fetch(`${API_BASE_URL}/User/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginDto),
        });

        const data = await handleResponse(response);

        console.log("LOGIN RESPONSE DATA:", data);

        if (!data || typeof data !== "object" || typeof (data as any).token !== "string") {
            throw new Error("Login yanıtında token bulunamadı.");
        }

        const token = (data as any).token;

        // TOKEN'I LOCALSTORAGE'A YAZ
        localStorage.setItem("authToken", token);

        return { token };
    },



    // Logout
    logout: async (): Promise<void> => {
        localStorage.removeItem("authToken");
        // Logout uç noktası: POST /api/User/logout
        const response = await fetch(`${API_BASE_URL}/User/logout`, {
            method: "POST",
            headers: getAuthHeaders(),
        });
        // Sadece başarılı yanıt bekler, içerik beklemez.
        return handleResponse(response);
    },

    // Profil Çekme
    getUserProfile: async (id: number): Promise<UserDTO> => {
        const mockFallback = mockUsers.find((u: any) => String(u.id) === String(id)) || null;
        const response = await fetch(`${API_BASE_URL}/User/${id}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response, mockFallback);
    },

    // Harici API Arama (Internal DB)
    /*search: async (query: string): Promise<any[]> => {
        const mockFallback = mockContent.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));
        const response = await fetch(`${API_BASE_URL}/MediaItem?query=${encodeURIComponent(query)}`, {
            method: "GET",
        });
        return handleResponse(response, mockFallback);
    },*/

    // Tüm MediaItem listesini backend'den çek ve FRONTEND tarafında filtrele
    search: async (query: string): Promise<any[]> => {
        // 1) Backend’den tüm medya verilerini çek
        const response = await fetch(`${API_BASE_URL}/MediaItem`, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        const allItems = await response.json();

        // 2) Frontend içinde filtrele
        const filtered = allItems.filter((item: any) =>
            item.title.toLowerCase().includes(query.toLowerCase())
        );

        return filtered;
    },

    //cntent detail için 
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
            .filter((item: any) => item.rating != null)
            .sort((a: any, b: any) => b.rating - a.rating)
            .slice(0, 10);
    },

    // Harici Medya Çekme (FetchMediaRequest DTO)
    fetchExternalMedia: async (externalId: string, mediaType: string): Promise<any> => {
        const requestDto = { externalId, mediaType };
        const response = await fetch(`${API_BASE_URL}/MediaItem/fetch`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(requestDto),
        });
        return handleResponse(response);
    },

    // AKTİVİTE AKIŞI (Feed) - Backend'de eksik olan uç nokta
    getFeed: async (page: number = 1): Promise<any[]> => {
        const mockFallback = mockActivities.map(a => ({ ...a, id: `${a.id}-${Math.random()}` }));
        const response = await fetch(`${API_BASE_URL}/Activity?page=${page}`, {
            method: "GET",
            headers: getAuthHeaders(),
        });
        return handleResponse(response, mockFallback); // BE açılana kadar Mock döner
    },

    // 4. PUANLAMA (Rating) İŞLEMLERİ - AddRatingDTO
    addRating: async (mediaItemId: number, score: number): Promise<RatingDTO> => {
        const userId = getUserIdFromToken();
        if (!userId) throw new Error("İşlem için oturum açmalısınız.");

        // AddRatingDTO'ya göre: UserId BE'de token'dan çözülür.
        const ratingDto = { mediaItemId, score };

        const response = await fetch(`${API_BASE_URL}/Rating`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(ratingDto),
        });
        return handleResponse(response);
    },

    // UpdateRatingDTO
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

    // 5. İNCELEME (Review) İŞLEMLERİ - AddReviewDTO
    addReview: async (mediaItemId: number, content: string): Promise<ReviewDTO> => {
        const userId = getUserIdFromToken();
        if (!userId) throw new Error("İşlem için oturum açmalısınız.");

        // AddReviewDTO'ya göre: UserId BE'de token'dan çözülür.
        const reviewDto = { mediaItemId, content };

        const response = await fetch(`${API_BASE_URL}/Review`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(reviewDto),
        });
        return handleResponse(response);
    },

    // UpdateReviewDTO
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

    // 6. KÜTÜPHANE GİRİŞİ (LibraryEntry) İŞLEMLERİ - AddLibraryEntryDTO
    addLibraryEntry: async (mediaItemId: number, status: number, completedDate: Date | null = null): Promise<LibraryEntryDTO> => {
        const userId = getUserIdFromToken();
        if (!userId) throw new Error("İşlem için oturum açmalısınız.");

        // AddLibraryEntryDTO'ya göre: UserId BE'de token'dan çözülür.
        const entryDto = { mediaItemId, status, completedDate };

        const response = await fetch(`${API_BASE_URL}/LibraryEntry`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(entryDto),
        });
        return handleResponse(response);
    },

    // UpdateLibraryEntryDTO
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


    followUser: async (followingId: number): Promise<UserFollowDTO> => {
        const followerId = getUserIdFromToken();
        if (!followerId) throw new Error("İşlem için oturum açmalısınız.");

        // AddUserFollowDTO'ya göre: FollowerId BE'de token'dan çözülür.
        const followDto = { followingId };

        const response = await fetch(`${API_BASE_URL}/UserFollow`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(followDto),
        });
        return handleResponse(response);
    },

    unfollowUser: async (followId: number): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/UserFollow/${followId}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });
        return handleResponse(response);
    },

    
    addCustomList: async (name: string, description: string = ""): Promise<CustomListDTO> => {
        const userId = getUserIdFromToken();
        if (!userId) throw new Error("İşlem için oturum açmalısınız.");

        // AddCustomListDTO'ya göre: UserId BE'de token'dan çözülür.
        const listDto = { name, description };

        const response = await fetch(`${API_BASE_URL}/CustomList`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(listDto),
        });
        return handleResponse(response);
    },

    // UpdateCustomListDTO
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
        const userId = getUserIdFromToken();
        if (!userId) throw new Error("İşlem için oturum açmalısınız.");

        // AddCustomListItemDTO'ya uygun.
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

    
    // AddActivityLikeDTO
    addLike: async (ratingId: number | null, reviewId: number | null): Promise<ActivityLikeDTO> => {
        const userId = getUserIdFromToken();
        if (!userId) throw new Error("İşlem için oturum açmalısınız.");

        // AddActivityLikeDTO'ya uygun. UserId BE'de çözülmeli.
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

    // AddActivityCommentDTO
    addActivityComment: async (text: string, ratingId: number | null, reviewId: number | null): Promise<ActivityCommentDTO> => {
        const userId = getUserIdFromToken();
        if (!userId) throw new Error("İşlem için oturum açmalısınız.");

        // AddActivityCommentDTO'ya uygun. UserId BE'de çözülmeli.
        const commentDto = { commentText: text, ratingId: ratingId || null, reviewId: reviewId || null };

        const response = await fetch(`${API_BASE_URL}/ActivityComment`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(commentDto),
        });
        return handleResponse(response);
    },

    // UpdateActivityCommentDTO
    updateActivityComment: async (id: number, newText: string): Promise<void> => {
        const updateDto = { id, commentText: newText };
        const response = await fetch(`${API_BASE_URL}/ActivityComment/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(updateDto),
        });
        return handleResponse(response);
    },
};