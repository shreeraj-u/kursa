"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import type { ObservationsResponse } from "@/types/profile";
import { env } from "@kursa/env/web";

interface AriaNoticedProps {
    initialObservations: ObservationsResponse | null;
    initialError?: string | null;
}

const emptyObservations: ObservationsResponse = {
    data: [],
    pagination: { total: 0, page: 1, limit: 4, totalPages: 1 },
    generationSource: "llm",
};

export default function AriaNoticed({ initialObservations, initialError = null }: AriaNoticedProps) {
    const [data, setData] = useState<ObservationsResponse>(
        initialObservations ?? emptyObservations,
    );
    const [isLoading, setIsLoading] = useState(initialObservations === null && !initialError);
    const [error, setError] = useState<string | null>(initialError);

    const observations = data.data || [];
    const newCount = data.pagination.total;

    const fetchPage = async (page: number) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${env.NEXT_PUBLIC_SERVER_URL}/api/v1/profile/me/observations?page=${page}&limit=4`, {
                credentials: "include",
            });
            const json = (await res.json()) as {
                success?: boolean;
                data?: ObservationsResponse;
                error?: { message?: string; code?: string };
            };

            if (res.ok && json.success && json.data) {
                setData(json.data);
            } else {
                setError(json.error?.message ?? `Observations unavailable (${res.status})`);
            }
        } catch {
            setError("Could not reach the server for observations");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (initialObservations === null && !initialError) {
            void fetchPage(1);
        }
    }, [initialObservations, initialError]);

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <span className="mono text-2xs text-mute-2">
                    aria noticed · {newCount} new · 0 dismissed
                    {data.generationSource === "llm" && newCount > 0 && (
                        <span className="text-accent"> · llm</span>
                    )}
                </span>
            </div>

            {error ? (
                <div
                    className="rounded-md border px-3 py-2.5"
                    style={{ borderColor: "var(--warn)", background: "oklch(0.6 0.1 60 / 0.08)" }}
                >
                    <p className="mono text-2xs text-warn mb-1">observations unavailable</p>
                    <p className="text-xs text-mute leading-relaxed">{error}</p>
                </div>
            ) : observations.length === 0 ? (
                <div className="flex flex-col gap-2 py-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="flex gap-2.5 items-center opacity-30">
                            <span className="rounded-full flex-shrink-0 w-[5px] h-[5px] bg-line-2" />
                            <div
                                className="h-2 rounded bg-border"
                                style={{ width: `${60 + i * 15}%` }}
                            />
                        </div>
                    ))}
                    <p className="mono mt-2 text-2xs text-mute-3">
                        {isLoading
                            ? "Aria is reading your latest career signals."
                            : "Aria is watching. Observations will surface as your profile grows."}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className={`flex flex-col gap-3 ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                        {observations.map((obs) => (
                            <div key={obs.text.slice(0, 48)} className="flex gap-2.5">
                                <span
                                    className={`mt-1.5 flex-shrink-0 rounded-full w-[5px] h-[5px] ${obs.type === "opportunity" ? "bg-accent" : "bg-warn"}`}
                                />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {obs.text}
                                    </p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="mono text-2xs text-mute-3">
                                            {obs.timeAgo}
                                            {obs.source === "llm" && " · llm"}
                                        </span>
                                        <Link
                                            href={`/dashboard/aria?prompt=${encodeURIComponent(obs.text)}` as Route}
                                            className="text-2xs text-accent hover:underline"
                                        >
                                            open
                                        </Link>
                                        <span className="text-2xs text-mute-3 cursor-pointer hover:underline">
                                            dis
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {data.pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
                            <button
                                onClick={() => fetchPage(data.pagination.page - 1)}
                                disabled={data.pagination.page <= 1 || isLoading}
                                className="mono text-2xs text-mute-3 hover:text-foreground disabled:opacity-30 disabled:hover:text-mute-3 transition-colors"
                            >
                                ← prev
                            </button>
                            <span className="mono text-2xs text-mute-2">
                                page {data.pagination.page} / {data.pagination.totalPages}
                            </span>
                            <button
                                onClick={() => fetchPage(data.pagination.page + 1)}
                                disabled={data.pagination.page >= data.pagination.totalPages || isLoading}
                                className="mono text-2xs text-mute-3 hover:text-foreground disabled:opacity-30 disabled:hover:text-mute-3 transition-colors"
                            >
                                next →
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
