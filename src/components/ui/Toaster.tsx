"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
    return (
        <Sonner
            theme="dark"
            className="toaster group"
            toastOptions={{
                classNames: {
                    toast:
                        "group toast group-[.toaster]:bg-ocean-deep/95 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-white group-[.toaster]:border group-[.toaster]:border-white/10 group-[.toaster]:shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-[.toaster]:rounded-xl font-sans tracking-wide overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r before:from-tongan/10 before:to-lagoon/10 before:opacity-0 group-[.toaster]:hover:before:opacity-100 before:transition-opacity before:duration-500",
                    description: "group-[.toast]:text-slate-300 font-normal",
                    actionButton:
                        "group-[.toast]:bg-tongan group-[.toast]:text-white group-[.toast]:font-bold group-[.toast]:shadow-[0_0_15px_rgba(200,16,46,0.3)] group-[.toast]:hover:bg-red-700 transition-all",
                    cancelButton:
                        "group-[.toast]:bg-white/10 group-[.toast]:text-slate-300 group-[.toast]:hover:bg-white/20 transition-all",
                    success:
                        "group-[.toaster]:!border-lagoon/50 group-[.toaster]:shadow-[0_0_30px_rgba(102,252,241,0.15)] group-[.toaster]:!bg-gradient-to-br group-[.toaster]:from-ocean-deep group-[.toaster]:to-lagoon/10 text-lagoon-100",
                    error:
                        "group-[.toaster]:!border-tongan/50 group-[.toaster]:shadow-[0_0_30px_rgba(200,16,46,0.15)] group-[.toaster]:!bg-gradient-to-br group-[.toaster]:from-ocean-deep group-[.toaster]:to-tongan/10 text-red-100",
                },
            }}
            {...props}
        />
    );
}
