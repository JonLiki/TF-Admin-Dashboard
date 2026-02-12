'use client';

import { useActionState } from 'react';
import { authenticate } from '@/actions/auth-actions';
import { Button } from '@/components/ui/Components';
import { TonganNgatu } from '@/components/ui/Patterns';
import { Loader2, LockKeyhole, ArrowRight, Waves } from 'lucide-react';

export default function LoginPage() {
    const [errorMessage, formAction, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-ocean-deep via-surface-ocean to-black overflow-hidden p-4">
            {/* Animated Tapa Pattern Overlay */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
                <TonganNgatu />
            </div>

            {/* Glowing Accent Orbs */}
            <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-lagoon/10 blur-[120px] animate-pulse pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-tongan/10 blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

            {/* Main Login Card Container */}
            <div className="w-full sm:w-[450px] shrink-0 relative z-10 flex flex-col">
                <div className="relative group w-full">
                    {/* Gradient Border Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-tongan via-lagoon to-tongan rounded-3xl opacity-20 blur-md group-hover:opacity-30 transition-opacity duration-500" />

                    {/* Glass Card */}
                    <div className="relative w-full bg-ocean-deep/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                        {/* Top Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lagoon to-transparent" />

                        {/* Card Content */}
                        <div className="p-8 sm:p-10 w-full">
                            {/* Header Section */}
                            <div className="text-center mb-8">
                                {/* Logo Badge */}
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-tongan to-red-900 rounded-2xl shadow-lg shadow-tongan/40 mb-6 transform rotate-3 border border-white/10 group-hover:rotate-6 transition-transform duration-500">
                                    <span className="text-3xl font-black text-white drop-shadow-md">TF</span>
                                </div>
                                {/* ... rest of content remains same ... */}

                                {/* Title */}
                                <h1 className="text-4xl font-black text-white tracking-tight mb-3">
                                    TO'A FATALONA
                                </h1>

                                {/* Subtitle */}
                                <div className="flex items-center justify-center gap-2 text-lagoon-100/70">
                                    <LockKeyhole className="w-3.5 h-3.5" />
                                    <p className="text-xs font-bold uppercase tracking-[0.25em]">Command Access</p>
                                </div>
                                <p className="text-slate-400 mt-2">Enter your credentials to access the To&apos;a Fatalona dashboard.</p>

                                {/* Decorative Divider */}
                                <div className="flex items-center justify-center gap-3 mt-6 mb-2">
                                    <div className="h-px w-12 bg-gradient-to-r from-transparent to-lagoon/30" />
                                    <Waves className="w-4 h-4 text-lagoon/40" />
                                    <div className="h-px w-12 bg-gradient-to-l from-transparent to-lagoon/30" />
                                </div>
                            </div>

                            {/* Login Form */}
                            <form action={formAction} className="space-y-5">
                                {/* Email Input */}
                                <div className="space-y-2">
                                    <label
                                        className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1"
                                        htmlFor="email"
                                    >
                                        Official Email
                                    </label>
                                    <div className="relative group/input">
                                        <input
                                            className="w-full bg-surface-deep/80 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-lagoon/50 focus:border-lagoon/50 outline-none transition-all placeholder:text-slate-600 text-sm shadow-inner group-hover/input:border-white/20 group-hover/input:bg-surface-deep"
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="admin@toafatalona.com"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                {/* Password Input */}
                                <div className="space-y-2">
                                    <label
                                        className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1"
                                        htmlFor="password"
                                    >
                                        Passcode
                                    </label>
                                    <div className="relative group/input">
                                        <input
                                            className="w-full bg-surface-deep/80 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3.5 text-white focus:ring-2 focus:ring-lagoon/50 focus:border-lagoon/50 outline-none transition-all placeholder:text-slate-600 text-sm shadow-inner group-hover/input:border-white/20 group-hover/input:bg-surface-deep"
                                            id="password"
                                            type="password"
                                            name="password"
                                            placeholder="••••••••"
                                            required
                                            minLength={6}
                                            autoComplete="current-password"
                                        />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {errorMessage && (
                                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-bold tracking-wide animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
                                        {errorMessage}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="w-full bg-gradient-to-r from-tongan to-red-800 hover:from-red-600 hover:to-red-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-tongan/30 hover:shadow-tongan/40 active:scale-[0.98] transition-all duration-200 mt-6 border border-white/10 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span className="flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
                                            Authenticate
                                            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </span>
                                    )}
                                </Button>
                            </form>
                        </div>

                        {/* Bottom Accent Line */}
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-[11px] text-slate-400 font-medium tracking-wide">
                        Authorized Personnel Only
                    </p>
                    <p className="text-slate-500 text-xs text-center mt-8">
                        &copy; 2026 To&apos;a Fatalona. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
