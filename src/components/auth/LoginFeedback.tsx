"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginFeedback() {
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get("verified") === "true") {
            toast.success("Access Granted", {
                description: "Welcome back to the Command Center.",
                duration: 4000,
            });

            // Remove the query param without refreshing the page
            const newUrl = window.location.pathname;
            window.history.replaceState({}, "", newUrl);
            router.replace(newUrl);
        }
    }, [searchParams, router]);

    return null;
}
