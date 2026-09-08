import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TripRequest,
    TripResponse,
    UserResponse,
    UpdateUserRequest,
    Destination,
    UserSummaryResponse,
    AdminStatsResponse,
} from "./types";
import { getUser } from "./auth";

const BASE_URL = "http://localhost:8081";

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {

    const user = getUser();

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
    };

    // Attach JWT token for protected backend APIs
    if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = res.status === 204 ? undefined : await res.json();

    if (!res.ok) {
        const msg =
            data?.message ||
            data?.error ||
            `Request failed with status ${res.status}`;

        throw new Error(msg);
    }

    return data as T;
}
export const authApi = {

    register: (body: RegisterRequest) =>
        request<AuthResponse>("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    login: (body: LoginRequest) =>
        request<AuthResponse>("/api/auth/login", {
            method: "POST",
            body: JSON.stringify(body),
        }),
};
// TRIP API

export const tripApi = {

    getAll: () =>
        request<TripResponse[]>("/api/trips", {
            method: "GET",
        }),

    getById: (id: number) =>
        request<TripResponse>(`/api/trips/${id}`, {
            method: "GET",
        }),

    create: (body: TripRequest) =>
        request<TripResponse>("/api/trips", {
            method: "POST",
            body: JSON.stringify(body),
        }),

    update: (id: number, body: TripRequest) =>
        request<TripResponse>(`/api/trips/${id}`, {
            method: "PUT",
            body: JSON.stringify(body),
        }),

    delete: (id: number) =>
        request<void>(`/api/trips/${id}`, {
            method: "DELETE",
        }),
};

export const userApi = {
    getProfile: () =>
        request<UserResponse>("/api/users/me", {
            method: "GET",
        }),

    updateProfile: (body: UpdateUserRequest) =>
        request<UserResponse>("/api/users/me", {
            method: "PUT",
            body: JSON.stringify(body),
        }),
};
// DESTINATION API
// DESTINATION API

export const destinationApi = {

    // GET /api/destinations
    // Get destinations stored in database
    getAll: () =>
        request<Destination[]>("/api/destinations", {
            method: "GET",
        }),

    // GET /api/destinations/popular
    // Get popular destinations
    getPopular: () =>
        request<Destination[]>("/api/destinations/popular", {
            method: "GET",
        }),

    // GET /api/destinations/{id}
    // Get destination stored in database
    getById: (id: number) =>
        request<Destination>(`/api/destinations/${id}`, {
            method: "GET",
        }),

    // GET /api/destinations/search?query=goa
    // Search destinations using OpenStreetMap / Nominatim
    search: (query: string) =>
        request<any[]>(
            `/api/destinations/search?query=${encodeURIComponent(query)}`,
            {
                method: "GET",
            }
        ),

    // GET /api/destinations/{id}/weather
    // Weather for a database destination
    getWeather: (id: number) =>
        request<Record<string, any>>(
            `/api/destinations/${id}/weather`,
            {
                method: "GET",
            }
        ),

    // Weather for an OpenStreetMap search result
    getWeatherByCoordinates: (
        latitude: number,
        longitude: number
    ) =>
        request<Record<string, any>>(
            `/api/destinations/weather?lat=${latitude}&lon=${longitude}`,
            {
                method: "GET",
            }
        ),
};
// DASHBOARD API
export const dashboardApi = {
    getTravelerDashboard: () =>
        request<import("./types").TravelerDashboardResponse>("/api/dashboard", {
            method: "GET",
        }),
};

export const adminApi = {
    getDashboard: () =>
        request<import("./types").AdminDashboardResponse>("/api/admin/dashboard", {
            method: "GET",
        }),

    getStats: () =>
        request<AdminStatsResponse>("/api/admin/stats", {
            method: "GET",
        }),

    getUsers: () =>
        request<UserSummaryResponse[]>("/api/admin/users", {
            method: "GET",
        }),

    updateUserRole: (id: number, roleName: string) =>
        request<UserSummaryResponse>(`/api/admin/users/${id}/role`, {
            method: "PUT",
            body: JSON.stringify({ roleName }),
        }),
};