"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Destination, WeatherData } from "@/lib/types";
import apiClient from "@/lib/apiClient";
import FadeIn from "@/components/ui/FadeIn";
import { StaggerList, StaggerItem } from "@/components/ui/StaggerList";

function Orbs() {
  return (
    <div className="glass-orbs pointer-events-none">
      <motion.div
        className="glass-orb glass-orb--orange"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="glass-orb glass-orb--violet"
        animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="glass-orb glass-orb--cyan"
        animate={{ x: [0, 20, 0], y: [0, 25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

function DestinationDetailContent() {
  const params = useParams();
  const id = Number(params.id);

  const [destination, setDestination] = useState<Destination | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [error, setError] = useState("");
  const [weatherError, setWeatherError] = useState("");

  const loadWeather = async (destId: number) => {
    setWeatherLoading(true);
    setWeatherError("");
    try {
      const wRes = await apiClient.get<WeatherData>(`/api/destinations/${destId}/weather`);
      setWeather(wRes.data);
    } catch (e: unknown) {
      const axiosErr = e as {response?: {status?: number; data?: {message?: string; error?: string}}; message?: string};
      const status = axiosErr?.response?.status;
      const msg = axiosErr?.response?.data?.message
               || axiosErr?.response?.data?.error
               || axiosErr?.message
               || "Live weather unavailable.";
      setWeatherError(`Weather error (${status ?? "network"}): ${msg}`);
    } finally {
      setWeatherLoading(false);
    }
  };

  const load = async () => {
    if (isNaN(id)) { setError("Invalid destination ID."); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const destRes = await apiClient.get<Destination>(`/api/destinations/${id}`);
      setDestination(destRes.data);
      loadWeather(id);
    } catch {
      setError("Destination could not be found or loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar backHref="/destinations" backLabel="Destinations" />
      <div className="glass-content relative max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="glass-card overflow-hidden animate-pulse">
          <div className="w-full h-72 bg-white/10" />
          <div className="p-7 sm:p-8 space-y-4">
            <div className="h-8 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/5 rounded w-1/4" />
            <div className="h-4 bg-white/5 rounded w-full mt-4" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-5 space-y-2 animate-pulse">
              <div className="h-3 bg-white/10 rounded w-1/3" />
              <div className="h-5 bg-white/10 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (error || !destination) return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar backHref="/destinations" backLabel="Destinations" />
      <div className="glass-content relative max-w-lg mx-auto px-6 py-20 text-center">
        <div className="glass-card p-8 space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Destination Error</h2>
          <p className="text-white/60 text-sm">{error || "Destination not found."}</p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Catalog</span>
            </Link>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-semibold text-white shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar backHref="/destinations" backLabel="Destinations" />

      <FadeIn>
        <main className="glass-content relative max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

          <div className="glass-card overflow-hidden">
            <div className="relative w-full h-72 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-rose-500/10 border-b border-white/10">
              {destination.imageUrl && (
                <HeroImage src={destination.imageUrl} alt={destination.name} />
              )}
              {!destination.imageUrl && (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon name="globe" className="h-20 w-20 text-white/70" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/95 via-[#0f172a]/20 to-transparent pointer-events-none" />
            </div>

            <div className="p-7 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug">{destination.name}</h1>
                  <p className="text-white/60 mt-1 text-base sm:text-lg">
                    {destination.city}{destination.city && destination.country ? ", " : ""}{destination.country}
                  </p>
                </div>
                <Link
                  href={`/trips/create?destinationId=${destination.id}`}
                  className="glass-btn-primary inline-flex items-center justify-center px-5 py-2.5 shrink-0"
                >
                  Create Trip
                </Link>
              </div>
              {destination.description && (
                <div className="mt-6">
                  <div className="glass-icon-chip mb-3">
                    <Icon name="book" className="h-4 w-4 text-orange-300" />
                    <span className="text-sm font-semibold text-white/90">About {destination.name}</span>
                  </div>
                  <p className="text-white/80 leading-relaxed text-sm sm:text-base">{destination.description}</p>
                </div>
              )}
            </div>
          </div>

          <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StaggerItem>
              <InfoCard icon="city" label="City" value={destination.city || "—"} />
            </StaggerItem>
            <StaggerItem>
              <InfoCard icon="globe" label="Country" value={destination.country || "—"} />
            </StaggerItem>
            <StaggerItem>
              <InfoCard icon="id" label="Destination ID" value={`#${destination.id}`} />
            </StaggerItem>
          </StaggerList>

          <div className="glass-card p-7 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="glass-icon-chip">
                <Icon name="cloud" className="h-5 w-5 text-sky-300" />
                <div>
                  <h2 className="text-lg font-bold text-white">Live Weather</h2>
                  <p className="text-sm text-white/60">Current conditions in {destination.city || destination.name}</p>
                </div>
              </div>
            </div>

            {weatherLoading && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-[3px] border-orange-400 border-t-transparent" />
                <p className="text-white/60 text-sm">Fetching live weather data…</p>
              </div>
            )}

            {!weatherLoading && weatherError && (
              <div className="glass-banner glass-banner--error">
                <Icon name="warning" className="h-4 w-4 shrink-0" />
                <span>{weatherError}</span>
              </div>
            )}

            {!weatherLoading && !weatherError && weather && (
              <div>
                {weather.weather?.[0] && (
                  <div className="flex items-center gap-4 mb-6 p-5 bg-gradient-to-r from-orange-500/15 to-amber-500/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                    {weather.weather[0].icon && (
                      <img
                        src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                        alt="" className="w-16 h-16"
                      />
                    )}
                    <div>
                      <p className="text-3xl font-bold text-white">
                        {weather.main?.temp != null ? `${weather.main.temp.toFixed(1)}°C` : "N/A"}
                      </p>
                      <p className="text-white/70 capitalize mt-0.5 text-sm">{weather.weather[0].description}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <WeatherCard icon="temperature" label="Temperature" value={weather.main?.temp != null ? `${weather.main.temp.toFixed(1)}°C` : "N/A"} />
                  <WeatherCard icon="feelsLike" label="Feels Like" value={weather.main?.feels_like != null ? `${weather.main.feels_like.toFixed(1)}°C` : "N/A"} />
                  <WeatherCard icon="humidity" label="Humidity" value={weather.main?.humidity != null ? `${weather.main.humidity}%` : "N/A"} />
                  <WeatherCard icon="wind" label="Wind Speed" value={weather.wind?.speed != null ? `${weather.wind.speed} m/s` : "N/A"} />
                </div>

                {weather.name && (
                  <p className="text-xs text-white/40 mt-4 text-center">Weather data for: {weather.name}</p>
                )}
              </div>
            )}
          </div>
        </main>
      </FadeIn>
    </div>
  );
}

type IconName = "book" | "city" | "cloud" | "feelsLike" | "globe" | "humidity" | "id" | "temperature" | "warning" | "wind";

function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5v15M8 7h8M8 11h8" /></>,
    city: <><path d="M4 21h16M6 21V8l6-4 6 4v13M9 10h1M14 10h1M9 14h1M14 14h1M11 21v-4h2v4" /></>,
    cloud: <><path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.1 8.8 4.5 4.5 0 0 0 7 18Z" /></>,
    feelsLike: <><path d="M12 3a3 3 0 0 0-3 3v7.1a5 5 0 1 0 6 0V6a3 3 0 0 0-3-3Z" /><path d="M12 8v7M10 17h4" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
    humidity: <><path d="M12 3.5S6.5 10 6.5 14.5a5.5 5.5 0 0 0 11 0C17.5 10 12 3.5 12 3.5Z" /></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8" cy="12" r="2" /><path d="M13 10h5M13 14h4" /></>,
    temperature: <><path d="M14 14.8V6a2 2 0 1 0-4 0v8.8a4 4 0 1 0 4 0Z" /><path d="M12 10v7" /></>,
    warning: <><path d="m12 3 9 16H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></>,
    wind: <><path d="M3 8h11a2 2 0 1 0-2-2M3 12h15a2 2 0 1 1-2 2M3 16h8" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{paths[name]}</svg>;
}

function InfoCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="glass-card-md p-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-white/10 flex items-center justify-center shrink-0">
        <Icon name={icon} className="h-5 w-5 text-orange-200" />
      </div>
      <div>
        <p className="glass-label">{label}</p>
        <p className="font-semibold text-white mt-0.5 text-sm">{value}</p>
      </div>
    </div>
  );
}

function WeatherCard({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="glass-card-md p-4 text-center">
      <Icon name={icon} className="mx-auto h-6 w-6 text-sky-200" />
      <p className="text-xs text-white/60 mt-1.5 font-medium">{label}</p>
      <p className="text-base font-bold text-white mt-1">{value}</p>
    </div>
  );
}

function HeroImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  return (
    <>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/[0.02] to-white/5 animate-pulse" />
      )}
      {!error ? (
        <img
          src={src} alt={alt} loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Icon name="globe" className="h-20 w-20 text-white/70" />
        </div>
      )}
    </>
  );
}

export default function DestinationDetailPage() {
  return <ProtectedRoute><DestinationDetailContent /></ProtectedRoute>;
}
