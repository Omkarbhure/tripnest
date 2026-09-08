import apiClient from "./apiClient";
import {
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    TripRequest,
    TripResponse,
    Destination,
    AuthUser,
} from "./types";
export interface SearchDestination {
    place_id: number;
    lat: string;
    lon: string;
    display_name: string;
    name?: string;
    type?: string;
    class?: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        country?: string;
        country_code?: string;
    };
}
// WEATHER

export interface WeatherInfo {
    name?: string;

    main?: {
        temp: number;
        feels_like?: number;
        humidity: number;
        pressure?: number;
    };

    weather?: {
        id?: number;
        main?: string;
        description?: string;
        icon?: string;
    }[];

    wind?: {
        speed?: number;
    };
}
export async function getPopularDestinations(): Promise<Destination[]> {

    const response = await apiClient.get<Destination[]>(
        "/api/destinations/popular"
    );

    return response.data;
}
export async function getDestinationById(
    id: number
): Promise<Destination> {

    const response = await apiClient.get<Destination>(
        `/api/destinations/${id}`
    );

    return response.data;
}
// SEARCH DESTINATIONS
// OPENSTREETMAP / NOMINATIM

export async function searchDestinations(
    query: string
): Promise<SearchDestination[]> {

    const response = await apiClient.get<SearchDestination[]>(
        "/api/destinations/search",
        {
            params: {
                query: query
            }
        }
    );

    return response.data;
}
// DESTINATION

export async function getDestinationWeather(
    id: number
): Promise<WeatherInfo> {

    const response = await apiClient.get<WeatherInfo>(
        `/api/destinations/${id}/weather`
    );

    return response.data;
}
export const userApi = {
    getCurrentUser: async (): Promise<AuthUser> => {
        const response = await apiClient.get<AuthUser>("/api/users/me");
        return response.data;
    },
};
// SEARCH RESULT

export async function getWeatherByCoordinates(
    latitude: number,
    longitude: number
): Promise<WeatherInfo> {

    const response = await apiClient.get<WeatherInfo>(
        "/api/destinations/weather",
        {
            params: {
                lat: latitude,
                lon: longitude
            }
        }
    );

    return response.data;
}