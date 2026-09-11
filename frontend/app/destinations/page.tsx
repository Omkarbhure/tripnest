"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { Destination, NominatimResult, WeatherData } from "@/lib/types";
import apiClient from "@/lib/apiClient";
import FadeIn from "@/components/ui/FadeIn";
import { StaggerList, StaggerItem } from "@/components/ui/StaggerList";
import { getDestinationImageUrl, DEFAULT_DESTINATION_IMAGE } from "@/lib/destinationImages";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
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
  Flame,
  Compass,
  ArrowRight,
  X,
  Star,
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
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

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
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await apiClient.get<NominatimResult[]>("/api/destinations/search", {
          params: { query: query.trim() },
        });
        const results = res.data;
        setSearchResults(results);
        results.forEach((result) => {
          apiClient
            .get<WeatherData>("/api/destinations/weather", {
              params: { lat: parseFloat(result.lat), lon: parseFloat(result.lon) },
            })
            .then((wRes) => {
              setWeather((prev) => ({ ...prev, [result.place_id]: wRes.data }));
            })
            .catch(() => {
              setWeatherErrors((prev) => ({ ...prev, [result.place_id]: "Weather unavailable." }));
            });
        });
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, [query]);

  // Curated Suggested Destinations (diversified picks from all destinations that aren't in popular top picks)
  const suggestedDestinations = useMemo(() => {
    const popularIds = new Set(popularDestinations.map((p) => p.id));
    const nonPopular = allDestinations.filter((d) => !popularIds.has(d.id));
    return nonPopular.slice(0, 3);
  }, [allDestinations, popularDestinations]);

  // Filtered All Destinations based on category pill
  const filteredCatalog = useMemo(() => {
    if (activeFilter === "POPULAR") return popularDestinations;
    if (activeFilter === "SUGGESTED") return suggestedDestinations;
    if (activeFilter === "INDIA") return allDestinations.filter((d) => d.country?.toLowerCase() === "india");
    if (activeFilter === "GLOBAL") return allDestinations.filter((d) => d.country?.toLowerCase() !== "india");
    return allDestinations;
  }, [activeFilter, allDestinations, popularDestinations, suggestedDestinations]);

  const showSearch = query.trim().length > 0;

  return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar />

      <main className="glass-content relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Banner Header */}
        <FadeIn direction="down">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/15 via-amber-500/15 to-rose-500/15 border border-orange-500/30 text-xs font-semibold text-orange-400 mb-4 backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Explore Curated Global Destinations</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Discover Your Next <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">Adventure</span>
            </h1>
            <p className="text-sm sm:text-base text-white/70 mt-3 max-w-2xl mx-auto leading-relaxed">
              Explore handpicked paradises, live weather forecasts, and top tourist attractions, or search any location across the globe.
            </p>
          </div>
        </FadeIn>

        {/* Global Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative flex items-center group">
            <Search className="absolute left-4 w-5 h-5 text-white/40 group-focus-within:text-orange-400 transition-colors pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search any city, country, monument, or place..."
              className="w-full pl-12 pr-12 py-3.5 bg-white/[0.06] hover:bg-white/[0.08] focus:bg-white/[0.10] border border-white/15 focus:border-orange-500/60 rounded-2xl text-white placeholder-white/40 text-sm shadow-lg backdrop-blur-xl transition-all outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tags (Shown when not searching) */}
          {!showSearch && (
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {[
                { id: "ALL", label: "All Spots", icon: Globe },
                { id: "POPULAR", label: "Popular", icon: Flame },
                { id: "SUGGESTED", label: "Suggested", icon: Compass },
                { id: "INDIA", label: "India Escapes", icon: MapPin },
                { id: "GLOBAL", label: "International", icon: Star },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFilter(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-orange-500 text-white shadow-md shadow-orange-500/25 border border-orange-400"
                        : "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/10"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-white/50"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Search Results View */}
        {showSearch && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-orange-400" />
                <span>Search Results</span>
                {!searching && searchResults.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    {searchResults.length} found
                  </span>
                )}
              </h2>
            </div>

            {searching && (
              <div className="glass-card p-12 text-center rounded-2xl">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-orange-400 border-t-transparent mx-auto mb-3" />
                <p className="text-white/80 font-medium text-sm">Searching OpenStreetMap & Live Weather…</p>
              </div>
            )}

            {!searching && searchResults.length === 0 && (
              <div className="glass-card p-12 text-center rounded-2xl">
                <MapPin className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-white/70 text-sm font-semibold">No locations found for &ldquo;{query}&rdquo;</p>
                <p className="text-white/40 text-xs mt-1">Try checking for typos or search a broader city/country name.</p>
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
                      <div className="glass-card-md p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2.5 rounded-xl bg-orange-500/15 border border-orange-500/25 text-orange-400 shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-base">
                              {result.name ?? result.display_name.split(",")[0]}
                            </h3>
                            <p className="text-sm text-white/60 mt-0.5 line-clamp-1">{result.display_name}</p>
                            <div className="flex gap-4 mt-1.5 text-xs text-white/40 font-mono">
                              <span>Lat: {parseFloat(result.lat).toFixed(4)}</span>
                              <span>Lon: {parseFloat(result.lon).toFixed(4)}</span>
                            </div>
                          </div>
                        </div>

                        {isLoadingW && !wErr && (
                          <div className="flex items-center gap-2 text-sm text-white/60 bg-white/[0.03] rounded-xl px-4 py-3 border border-white/5">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                            Fetching real-time weather…
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
                              <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent rounded-xl px-4 py-3 mb-3 border border-orange-500/20 backdrop-blur-md">
                                {w.weather[0].icon && (
                                  <img
                                    src={`https://openweathermap.org/img/wn/${w.weather[0].icon}.png`}
                                    alt=""
                                    className="w-10 h-10 drop-shadow"
                                  />
                                )}
                                <div>
                                  <p className="font-extrabold text-white text-lg">
                                    {w.main?.temp != null ? `${w.main.temp.toFixed(1)}°C` : "N/A"}
                                  </p>
                                  <p className="text-xs text-white/70 capitalize font-medium">{w.weather[0].description}</p>
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

        {/* Non-Search Browsing Views */}
        {!showSearch && (
          <div className="space-y-16">
            {/* Error Banner with Retry */}
            {dbError && (
              <div className="glass-banner glass-banner--error flex items-center justify-between gap-3 p-4 rounded-xl">
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
            )}

            {/* SECTION 1: POPULAR DESTINATIONS */}
            {(activeFilter === "ALL" || activeFilter === "POPULAR") && (
              <section>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                      <Flame className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Popular Destinations</h2>
                      <p className="text-xs sm:text-sm text-white/60">Top trending spots with high traveler bookings & ratings</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-amber-400/90 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    🔥 Most Visited
                  </span>
                </div>

                {loadingDB ? (
                  <LoadingGrid count={3} />
                ) : popularDestinations.length === 0 ? (
                  <EmptyState message="No popular destinations currently available." />
                ) : (
                  <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {popularDestinations.map((d) => (
                      <StaggerItem key={d.id}>
                        <DestCard destination={d} badge="🔥 Popular" badgeColor="amber" />
                      </StaggerItem>
                    ))}
                  </StaggerList>
                )}
              </section>
            )}

            {/* SECTION 2: SUGGESTED DESTINATIONS */}
            {(activeFilter === "ALL" || activeFilter === "SUGGESTED") && suggestedDestinations.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
                      <Compass className="w-5 h-5 text-sky-400" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Suggested For You</h2>
                      <p className="text-xs sm:text-sm text-white/60">Handpicked scenic landscapes, cultural icons, and hidden gems</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-sky-400/90 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                    💡 Handpicked
                  </span>
                </div>

                {loadingDB ? (
                  <LoadingGrid count={3} />
                ) : (
                  <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {suggestedDestinations.map((d) => (
                      <StaggerItem key={d.id}>
                        <DestCard destination={d} badge="✨ Suggested" badgeColor="sky" />
                      </StaggerItem>
                    ))}
                  </StaggerList>
                )}
              </section>
            )}

            {/* SECTION 3: ALL / FILTERED CATALOG */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
                    <Globe className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {activeFilter === "INDIA"
                        ? "India Escapes"
                        : activeFilter === "GLOBAL"
                        ? "International Destinations"
                        : "All Destinations"}
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60">
                      Browse all {filteredCatalog.length} curated destinations in our platform catalog
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/80 border border-white/15">
                  {filteredCatalog.length} Destinations
                </span>
              </div>

              {loadingDB ? (
                <LoadingGrid count={6} />
              ) : filteredCatalog.length === 0 ? (
                <EmptyState message="No destinations match this filter." />
              ) : (
                <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCatalog.map((d) => (
                    <StaggerItem key={d.id}>
                      <DestCard destination={d} />
                    </StaggerItem>
                  ))}
                </StaggerList>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function DestCard({
  destination,
  badge,
  badgeColor = "amber",
}: {
  destination: Destination;
  badge?: string;
  badgeColor?: "amber" | "sky" | "orange";
}) {
  const initialUrl = getDestinationImageUrl(destination.name, destination.imageUrl);
  const [currentSrc, setCurrentSrc] = useState(initialUrl);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(getDestinationImageUrl(destination.name, destination.imageUrl));
    setImgLoaded(false);
    setHasError(false);
  }, [destination.name, destination.imageUrl]);

  const badgeStyles = {
    amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    sky: "bg-sky-500/20 text-sky-300 border-sky-500/30",
    orange: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  }[badgeColor];

  const handleImageError = () => {
    if (currentSrc !== DEFAULT_DESTINATION_IMAGE) {
      setCurrentSrc(DEFAULT_DESTINATION_IMAGE);
    } else {
      setHasError(true);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="glass-card-md overflow-hidden flex flex-col group border border-white/10 hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10 rounded-2xl transition-all duration-300"
    >
      {/* Image Container with Badges */}
      <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border-b border-white/10">
        {!imgLoaded && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 animate-pulse" />
        )}
        {!hasError ? (
          <img
            src={currentSrc}
            alt={destination.name}
            loading="lazy"
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out
                        ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30 bg-slate-900">
            <Globe className="w-10 h-10 mb-1" />
            <span className="text-xs">No image available</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-black/30 pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          {badge ? (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-md shadow-sm ${badgeStyles}`}>
              {badge}
            </span>
          ) : (
            <span />
          )}
          {destination.country && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-black/50 text-white/90 border border-white/20 backdrop-blur-md shadow-sm">
              {destination.country}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 bg-white/[0.02]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors tracking-tight">
              {destination.name}
            </h3>
            <p className="text-xs font-medium text-white/60 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-orange-400/80 shrink-0" />
              <span>
                {destination.city}
                {destination.city && destination.country ? ", " : ""}
                {destination.country}
              </span>
            </p>
          </div>
        </div>

        {destination.description && (
          <p className="text-xs text-white/70 mt-3 line-clamp-2 leading-relaxed flex-1 font-normal">
            {destination.description}
          </p>
        )}

        <Link
          href={`/destinations/${destination.id}`}
          className="mt-5 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-orange-500 hover:text-white text-white/90 text-xs font-bold border border-white/10 hover:border-orange-400 transition-all duration-200 group/btn shadow-sm"
        >
          <span>View Details & Weather</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}

function WeatherCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-card-md p-3 text-center rounded-xl bg-white/[0.04] border border-white/10">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-[11px] text-white/60 font-medium">{label}</p>
      <p className="text-xs font-bold text-white mt-0.5">{value}</p>
    </div>
  );
}

function LoadingGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card-md overflow-hidden flex flex-col animate-pulse rounded-2xl">
          <div className="w-full h-48 bg-white/10" />
          <div className="p-5 space-y-3 flex-1">
            <div className="h-5 bg-white/15 rounded w-2/3" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
            <div className="h-3 bg-white/5 rounded w-full mt-2" />
            <div className="h-9 bg-white/10 rounded-xl mt-5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="glass-card p-12 text-center rounded-2xl border border-white/10">
      <Globe className="w-10 h-10 text-white/30 mx-auto mb-2" />
      <p className="text-white/70 text-sm font-semibold">{message}</p>
      <p className="text-white/40 text-xs mt-1">Check back later or search any destination globally above.</p>
    </div>
  );
}

export default function DestinationsPage() {
  return (
    <ProtectedRoute>
      <DestinationsContent />
    </ProtectedRoute>
  );
}
