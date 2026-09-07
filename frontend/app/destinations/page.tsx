"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Destination, NominatimResult, WeatherData } from "@/lib/types";
import apiClient from "@/lib/apiClient";
import FadeIn from "@/components/ui/FadeIn";
import { StaggerList, StaggerItem } from "@/components/ui/StaggerList";
import {
  Search,
  MapPin,
  AlertTriangle,
  Thermometer,
  CloudSun,
  Droplets,
  Wind,
  Sparkles,
  Globe,
  RefreshCw,
} from "lucide-react";

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

function DestinationsContent() {
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [popularDestinations, setPopularDestinations] = useState<Destination[]>([]);
  const [loadingDB, setLoadingDB] = useState(true);
  const [dbError, setDbError] = useState("");

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [weather, setWeather] = useState<Record<number, WeatherData>>({});
  const [weatherErrors, setWeatherErrors] = useState<Record<number, string>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDestinations = () => {
    setLoadingDB(true);
    setDbError("");
    Promise.all([
      apiClient.get<Destination[]>("/api/destinations"),
      apiClient.get<Destination[]>("/api/destinations/popular"),
    ])
      .then(([all, popular]) => {
        setAllDestinations(all.data);
        setPopularDestinations(popular.data);
      })
      .catch(() => setDbError("Failed to load destinations."))
      .finally(() => setLoadingDB(false));
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await apiClient.get<NominatimResult[]>("/api/destinations/search", { params: { query: query.trim() } });
        const results = res.data;
        setSearchResults(results);
        results.forEach((result) => {
          apiClient.get<WeatherData>("/api/destinations/weather", {
            params: { lat: parseFloat(result.lat), lon: parseFloat(result.lon) },
          }).then((wRes) => {
            setWeather((prev) => ({ ...prev, [result.place_id]: wRes.data }));
          }).catch(() => {
            setWeatherErrors((prev) => ({ ...prev, [result.place_id]: "Weather unavailable." }));
          });
        });
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 500);
  }, [query]);

  async function loadWeather(result: NominatimResult) {
    setWeatherErrors((prev) => ({ ...prev, [result.place_id]: "" }));
    try {
      const res = await apiClient.get<WeatherData>("/api/destinations/weather", {
        params: { lat: parseFloat(result.lat), lon: parseFloat(result.lon) },
      });
      setWeather((prev) => ({ ...prev, [result.place_id]: res.data }));
    } catch {
      setWeatherErrors((prev) => ({ ...prev, [result.place_id]: "Unable to load weather for this location." }));
    }
  }

  void loadWeather;

  const showSearch = query.trim().length > 0;

  return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar />

      <main className="glass-content relative max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <FadeIn direction="down">
          <div className="mb-8">
            <h1 className="glass-h1">Destinations</h1>
            <p className="glass-sub mt-1">
              Browse our curated destinations or search anywhere in the world.
            </p>
          </div>
        </FadeIn>

        <div className="relative mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any city, country, or place…"
            className="glass-input pl-11 pr-5 py-3.5"
          />
        </div>

        {showSearch && (
          <section className="mb-12">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">
              Search Results{" "}
              {!searching && searchResults.length > 0 && (
                <span className="text-sm font-normal text-white/50 ml-1">({searchResults.length} found)</span>
              )}
            </h2>

            {searching && (
              <div className="glass-card p-10 text-center">
                <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-orange-400 border-t-transparent mx-auto mb-3" />
                <p className="text-white/60 text-sm">Searching OpenStreetMap…</p>
              </div>
            )}

            {!searching && searchResults.length === 0 && (
              <div className="glass-card p-10 text-center">
                <p className="text-white/40 text-sm">No locations found. Try a different search term.</p>
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <StaggerList className="space-y-4">
                {searchResults.map((result) => {
                  const w = weather[result.place_id];
                  const wErr = weatherErrors[result.place_id];
                  const isLoadingW = !w && !wErr;
                  return (
                    <StaggerItem key={result.place_id}>
                      <div className="glass-card-md p-6">
                        <div className="flex items-start gap-3 mb-4">
                          <MapPin className="w-5 h-5 text-orange-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white">
                              {result.name ?? result.display_name.split(",")[0]}
                            </h3>
                            <p className="text-sm text-white/60 mt-0.5 line-clamp-1">{result.display_name}</p>
                            <div className="flex gap-4 mt-1 text-xs text-white/40">
                              <span>Lat: {parseFloat(result.lat).toFixed(4)}</span>
                              <span>Lon: {parseFloat(result.lon).toFixed(4)}</span>
                            </div>
                          </div>
                        </div>

                        {isLoadingW && !wErr && (
                          <div className="flex items-center gap-2 text-sm text-white/50 glass-form-sheet px-4 py-3">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                            Loading weather…
                          </div>
                        )}

                        {wErr && (
                          <div className="glass-banner glass-banner--error text-xs">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{wErr}</span>
                          </div>
                        )}

                        {w && (
                          <div>
                            {w.weather?.[0] && (
                              <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/15 to-amber-500/10 rounded-xl px-4 py-3 mb-3 border border-white/10 backdrop-blur-sm">
                                {w.weather[0].icon && (
                                  <img src={`https://openweathermap.org/img/wn/${w.weather[0].icon}.png`} alt="" className="w-10 h-10" />
                                )}
                                <div>
                                  <p className="font-bold text-white text-lg">
                                    {w.main?.temp != null ? `${w.main.temp.toFixed(1)}°C` : "N/A"}
                                  </p>
                                  <p className="text-sm text-white/70 capitalize">{w.weather[0].description}</p>
                                </div>
                                <div className="ml-auto text-right text-xs text-white/60">
                                  <p>Humidity: {w.main?.humidity ?? "N/A"}%</p>
                                  <p>Wind: {w.wind?.speed ?? "N/A"} m/s</p>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <WeatherCard label="Temperature" value={w.main?.temp != null ? `${w.main.temp.toFixed(1)}°C` : "N/A"} icon={<Thermometer className="w-4 h-4 text-amber-400 mx-auto" />} />
                              <WeatherCard label="Feels Like" value={w.main?.feels_like != null ? `${w.main.feels_like.toFixed(1)}°C` : "N/A"} icon={<CloudSun className="w-4 h-4 text-orange-400 mx-auto" />} />
                              <WeatherCard label="Humidity" value={w.main?.humidity != null ? `${w.main.humidity}%` : "N/A"} icon={<Droplets className="w-4 h-4 text-sky-400 mx-auto" />} />
                              <WeatherCard label="Wind" value={w.wind?.speed != null ? `${w.wind.speed} m/s` : "N/A"} icon={<Wind className="w-4 h-4 text-teal-400 mx-auto" />} />
                            </div>
                          </div>
                        )}
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerList>
            )}
          </section>
        )}

        {!showSearch && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-5">
              <div className="glass-icon-chip">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-sm font-semibold text-white/90">Popular Destinations</span>
              </div>
            </div>
            {loadingDB ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card-md overflow-hidden flex flex-col animate-pulse">
                    <div className="w-full h-44 bg-white/10" />
                    <div className="p-5 space-y-3 flex-1">
                      <div className="h-5 bg-white/10 rounded w-2/3" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                      <div className="h-3 bg-white/5 rounded w-full mt-2" />
                      <div className="h-9 bg-white/10 rounded-xl mt-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : dbError ? (
              <div className="glass-banner glass-banner--error flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{dbError}</span>
                </div>
                <button
                  onClick={loadDestinations}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            ) : popularDestinations.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <Sparkles className="w-8 h-8 text-white/30 mx-auto mb-2" />
                <p className="text-white/60 text-sm font-semibold">No popular destinations yet</p>
                <p className="text-white/40 text-xs mt-0.5">Explore the full catalog or search for places above.</p>
              </div>
            ) : (
              <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {popularDestinations.map((d) => (
                  <StaggerItem key={d.id}>
                    <DestCard destination={d} />
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </section>
        )}

        <section>
          <div className="flex items-center gap-2 mb-5">
            <div className="glass-icon-chip">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-sm font-semibold text-white/90">
                {showSearch ? "Saved Destinations" : "All Destinations"}
              </span>
            </div>
          </div>
          {loadingDB ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card-md overflow-hidden flex flex-col animate-pulse">
                  <div className="w-full h-44 bg-white/10" />
                  <div className="p-5 space-y-3 flex-1">
                    <div className="h-5 bg-white/10 rounded w-2/3" />
                    <div className="h-3 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded w-full mt-2" />
                    <div className="h-9 bg-white/10 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : allDestinations.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <Globe className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-white/60 text-sm font-semibold">No destinations found</p>
              <p className="text-white/40 text-xs mt-0.5">Check back later or search any destination globally.</p>
            </div>
          ) : (
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {allDestinations.map((d) => (
                <StaggerItem key={d.id}>
                  <DestCard destination={d} />
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </section>
      </main>
    </div>
  );
}

function DestCard({ destination }: { destination: Destination }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="glass-card-md overflow-hidden flex flex-col group"
    >
      <div className="relative w-full h-44 overflow-hidden bg-gradient-to-br from-orange-500/15 to-amber-500/5 border-b border-white/10">
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/[0.02] to-white/5 animate-pulse" />
        )}
        {!imgError && destination.imageUrl ? (
          <img
            src={destination.imageUrl}
            alt={destination.name}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover group-hover:scale-[1.03] transition-all duration-500
                        ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-10 h-10 text-white/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/70 via-transparent to-transparent pointer-events-none" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">{destination.name}</h3>
        <p className="text-sm text-white/60 mt-0.5">
          {destination.city}{destination.city && destination.country ? ", " : ""}{destination.country}
        </p>
        {destination.description && (
          <p className="text-sm text-white/70 mt-3 line-clamp-2 flex-1 leading-relaxed">{destination.description}</p>
        )}
        <Link
          href={`/destinations/${destination.id}`}
          className="glass-btn-outline mt-4 px-4 py-2.5 text-sm font-semibold text-center"
        >
          View Details
        </Link>
      </div>
    </motion.div>
  );
}

function WeatherCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card-md p-3.5 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-xs text-white/60 font-medium">{label}</p>
      <p className="text-sm font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

export default function DestinationsPage() {
  return <ProtectedRoute><DestinationsContent /></ProtectedRoute>;
}
