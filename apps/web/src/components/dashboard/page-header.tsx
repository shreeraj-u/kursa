"use client";

import { ChevronDown } from "lucide-react";

interface PageHeaderProps {
    pageTitle: string;
    breadcrumb?: string;
}

export default function PageHeader({
    pageTitle,
    breadcrumb = "Workspace",
}: PageHeaderProps) {
    return (
        <header
            className="sticky top-0 z-10 flex items-center justify-between px-8"
            style={{
                height: 44,
                borderBottom: "1px solid var(--line)",
                background: "var(--bg)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
            }}
        >
            {/* Left: breadcrumb */}
            <div
                className="mono flex items-center gap-1"
                style={{ fontSize: "var(--text-xs)" }}
            >
                <span style={{ color: "var(--mute)" }}>{breadcrumb}</span>
                <span style={{ color: "var(--mute-3)" }}>/</span>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{pageTitle}</span>
            </div>

            {/* Right: Aria status + Ask Aria button */}
            <div className="flex items-center gap-3">
                {/* Aria synced status */}
                <div
                    className="mono flex items-center gap-1.5"
                    style={{ fontSize: "var(--text-xs)", color: "var(--mute-2)" }}
                >
                    <span
                        style={{
                            display: "inline-block",
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "var(--accent)",
                            flexShrink: 0,
                        }}
                    />
                    aria · synced 2 min ago
                </div>

                {/* Ask Aria button */}
                <button
                    className="mono flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors"
                    style={{
                        fontSize: "var(--text-xs)",
                        color: "var(--ink)",
                        border: "1px solid var(--line-2)",
                        background: "var(--bg)",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-sub)";
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--bg)";
                    }}
                >
                    Ask Aria
                    <ChevronDown size={11} style={{ color: "var(--mute-2)" }} />
                </button>
            </div>
        </header>
    );
}
