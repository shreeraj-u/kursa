"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function CheckinPrompt() {
    const [due, setDue] = useState(false);
    const [type, setType] = useState<"checkin_weekly" | "checkin_monthly" | null>(null);

    useEffect(() => {
        void api.checkins.next().then((next) => {
            if (next.due) {
                setDue(true);
                setType(next.type);
            }
        }).catch(() => null);
    }, []);

    if (!due) return null;

    const label = type === "checkin_monthly" ? "monthly check-in" : "weekly check-in";

    return (
        <div
            className="rounded-lg px-4 py-3 flex items-center justify-between border"
            style={{
                borderColor: "color-mix(in srgb, var(--accent) 30%, var(--line))",
                background: "color-mix(in srgb, var(--accent) 6%, var(--surface))",
            }}
        >
            <div className="flex items-center gap-2.5">
                <span
                    className="inline-block rounded-full flex-shrink-0"
                    style={{ width: 6, height: 6, background: "var(--accent)" }}
                />
                <span className="text-xs text-ink">Your {label} is ready.</span>
            </div>
            <Link href="/dashboard/journal" className="mono text-2xs text-accent hover:underline flex-shrink-0">
                take it →
            </Link>
        </div>
    );
}
