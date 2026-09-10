"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationResponse } from "@/lib/types";
import {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "@/lib/notificationApi";
import {
    Bell,
    Mail,
    Users,
    CheckCircle2,
    XCircle,
    Plane,
    Clock,
    AlertTriangle,
    RefreshCw,
    Inbox,
    Check,
    X,
    Calendar,
    ArrowRight,
} from "lucide-react";

function getNotificationIcon(type: string) {
    switch (type) {
        case "TRIP_INVITE":
            return <Mail className="w-4 h-4 text-sky-400" />;
        case "JOIN_REQUEST":
            return <Users className="w-4 h-4 text-purple-400" />;
        case "JOIN_APPROVED":
            return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
        case "JOIN_REJECTED":
            return <XCircle className="w-4 h-4 text-rose-400" />;
        case "TRIP_REMINDER":
            return <Plane className="w-4 h-4 text-orange-400" />;
        case "ACTIVITY_REMINDER":
            return <Clock className="w-4 h-4 text-amber-400" />;
        case "BUDGET_ALERT":
            return <AlertTriangle className="w-4 h-4 text-red-400" />;
        case "TRAVEL_UPDATE":
            return <RefreshCw className="w-4 h-4 text-teal-400" />;
        default:
            return <Bell className="w-4 h-4 text-orange-400" />;
    }
}


export default function NotificationBell() {
    const [mounted, setMounted] = useState(false);
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [selectedNotification, setSelectedNotification] = useState<NotificationResponse | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        loadUnreadCount();
        const interval = setInterval(loadUnreadCount, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    async function loadUnreadCount() {
        try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
        } catch {
            // Ignore if logged out
        }
    }

    async function fetchNotifications() {
        setLoading(true);
        setError("");
        try {
            const list = await getMyNotifications();
            setNotifications(list);
            setUnreadCount(list.filter((n) => !n.read).length);
        } catch {
            setError("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleOpen() {
        if (!open) {
            setOpen(true);
            fetchNotifications();
        } else {
            setOpen(false);
        }
    }

    async function handleMarkRead(id: number) {
        try {
            await markNotificationAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );
            if (selectedNotification && selectedNotification.id === id) {
                setSelectedNotification((prev) => (prev ? { ...prev, read: true } : null));
            }
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch {
            // Ignore
        }
    }

    async function handleMarkAllRead() {
        try {
            await markAllNotificationsAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch {
            // Ignore
        }
    }

    function handleOpenDetails(n: NotificationResponse) {
        if (!n.read) {
            handleMarkRead(n.id);
        }
        setSelectedNotification(n);
        setOpen(false);
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                type="button"
                onClick={handleToggleOpen}
                aria-label="Notifications"
                className="relative p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
                <Bell className="h-5 w-5" />

                {/* Unread Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-1 text-[10px] font-black text-white shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Popover */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-white/20 bg-[#0f172a]/95 backdrop-blur-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[28rem]"
                    >
                        {/* Header */}
                        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-orange-500/15 via-transparent to-transparent">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-[11px] font-medium text-orange-300 hover:text-orange-200 hover:underline transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="overflow-y-auto flex-1 divide-y divide-white/5 no-scrollbar">
                            {loading ? (
                                <div className="p-4 space-y-3">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-start gap-3 p-2 rounded-xl animate-pulse">
                                            <div className="w-8 h-8 rounded-xl bg-white/10 shrink-0" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3.5 bg-white/10 rounded w-3/4" />
                                                <div className="h-2.5 bg-white/5 rounded w-full" />
                                                <div className="h-2 bg-white/5 rounded w-1/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : error ? (
                                <div className="p-6 text-center space-y-2">
                                    <AlertTriangle className="w-6 h-6 text-rose-400 mx-auto" />
                                    <p className="text-xs text-rose-300 font-medium">{error}</p>
                                    <button
                                        onClick={fetchNotifications}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        <span>Retry</span>
                                    </button>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center space-y-1">
                                    <Inbox className="w-8 h-8 text-white/30 mx-auto mb-1" />
                                    <p className="text-xs font-semibold text-white">No notifications yet</p>
                                    <p className="text-[10px] text-white/40">You're all caught up!</p>
                                </div>
                            ) : (
                                notifications.map((n) => {
                                    const icon = getNotificationIcon(n.type);
                                    const timeStr = new Date(n.createdAt).toLocaleDateString("en-IN", {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    });

                                    return (
                                        <div
                                            key={n.id}
                                            onClick={() => handleOpenDetails(n)}
                                            className={`p-4 transition-colors flex items-start gap-3 text-left cursor-pointer ${
                                                !n.read
                                                    ? "bg-white/[0.04] hover:bg-white/[0.07]"
                                                    : "opacity-70 hover:opacity-100 hover:bg-white/[0.02]"
                                            }`}
                                        >
                                            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 shrink-0 mt-0.5">{icon}</div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1">
                                                    <p className="text-xs font-bold text-white truncate">
                                                        {n.title}
                                                    </p>
                                                    {!n.read && (
                                                        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                                                    )}
                                                </div>

                                                <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed line-clamp-2">
                                                    {n.message}
                                                </p>

                                                <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[10px] text-white/40">
                                                    <span>{timeStr}</span>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenDetails(n);
                                                            }}
                                                            className="text-orange-300 font-semibold hover:text-orange-200 hover:underline"
                                                        >
                                                            View Details &rarr;
                                                        </button>

                                                        {!n.read && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleMarkRead(n.id);
                                                                }}
                                                                className="hover:text-white transition-colors"
                                                            >
                                                                Mark read
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notification Details Modal */}
            {mounted && createPortal(
                <AnimatePresence>
                    {selectedNotification && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                            onClick={() => setSelectedNotification(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-lg rounded-3xl border border-white/20 bg-[#0f172a] shadow-2xl overflow-hidden p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto"
                            >
                                {/* Close Button */}
                                <button
                                    type="button"
                                    onClick={() => setSelectedNotification(null)}
                                    className="absolute top-5 right-5 p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Header Info */}
                                <div className="flex items-start gap-3.5 pr-8 mb-5">
                                    <div className="p-3 rounded-2xl bg-white/[0.08] border border-white/10 shrink-0">
                                        {getNotificationIcon(selectedNotification.type)}
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 uppercase tracking-wider">
                                                {selectedNotification.type.replace(/_/g, " ")}
                                            </span>
                                            <span className="text-xs text-white/40">
                                                {new Date(selectedNotification.createdAt).toLocaleString("en-IN", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white leading-snug">
                                            {selectedNotification.title}
                                        </h3>
                                    </div>
                                </div>

                                {/* Message Body */}
                                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 mb-6">
                                    <p className="text-sm sm:text-base text-white/85 leading-relaxed whitespace-pre-wrap">
                                        {selectedNotification.message}
                                    </p>
                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/10">
                                    {selectedNotification.relatedTripId ? (
                                        <Link
                                            href={`/trips/${selectedNotification.relatedTripId}`}
                                            onClick={() => setSelectedNotification(null)}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 shadow-md shadow-orange-500/20 transition-all"
                                        >
                                            <span>Go to Trip</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    ) : (
                                        <div />
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setSelectedNotification(null)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors ml-auto"
                                    >
                                        Close
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
