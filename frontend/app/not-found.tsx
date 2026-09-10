import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100">
            <div className="max-w-md w-full p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Compass className="w-8 h-8 animate-spin-slow" />
                </div>

                <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        404 &bull; Page Not Found
                    </span>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white mt-2">
                        Lost in Adventure?
                    </h2>
                    <p className="text-sm text-slate-400">
                        The destination or page you are looking for doesn&apos;t exist or has moved.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Home className="w-4 h-4" />
                        Explore Trips
                    </Link>
                    <Link
                        href="/destinations"
                        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-medium transition-all border border-white/10 active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Destinations
                    </Link>
                </div>
            </div>
        </div>
    );
}
