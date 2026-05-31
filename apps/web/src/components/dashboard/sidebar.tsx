"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Route } from "next";
import { useEffect, useState } from "react";
import {
    House,
    MapPin,
    BarChart2,
    Sparkles,
    Route as RouteIcon,
    FileText,
    Bookmark,
    BookOpen,
    Pencil,
    Settings,
    ChevronRight,
    CircleHelp,
} from "lucide-react";
import { Logo } from "../logo";
import { ModeToggle } from "../mode-toggle";
import { env } from "@kursa/env/web";
import { api } from "@/lib/api";

interface SidebarProps {
    user: { name: string; email: string; createdAt: string };
    attentionCount?: number;
    applicationCount?: number;
}

const WORKSPACE_NAV: Array<{ href: Route; label: string; Icon: React.ElementType; key: string }> = [
    { href: "/dashboard" as Route, label: "Home", Icon: House, key: "home" },
    { href: "/dashboard/career-path" as Route, label: "Career path", Icon: MapPin, key: "career" },
    { href: "/dashboard/skills" as Route, label: "Skills", Icon: BarChart2, key: "skills" },
    { href: "/dashboard/aria" as Route, label: "Aria", Icon: Sparkles, key: "aria" },
];

const JOB_SEARCH_NAV: Array<{ href: Route; label: string; Icon: React.ElementType; key: string }> = [
    { href: "/dashboard/roadmap" as Route, label: "Roadmap", Icon: RouteIcon, key: "roadmap" },
    { href: "/dashboard/resume" as Route, label: "Resume studio", Icon: FileText, key: "resume" },
    { href: "/dashboard/shortlist" as Route, label: "Shortlist", Icon: Bookmark, key: "shortlist" },
    { href: "/dashboard/journal" as Route, label: "Journal", Icon: BookOpen, key: "journal" },
];

function Badge({ children }: { children: React.ReactNode }) {
    return (
        <span
            className="mono ml-auto"
            style={{
                fontSize: 9,
                color: "var(--mute)",
                background: "var(--bg-sub-2)",
                border: "1px solid var(--line)",
                borderRadius: 999,
                padding: "0.1rem 0.4rem",
                lineHeight: 1.5,
                letterSpacing: "0.02em",
            }}
        >
            {children}
        </span>
    );
}

function NavItem({
    href,
    label,
    Icon,
    isActive,
    badge,
    rightSlot,
}: {
    href: Route;
    label: string;
    Icon: React.ElementType;
    isActive: boolean;
    badge?: React.ReactNode;
    rightSlot?: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors group"
            style={{
                fontSize: "var(--text-xs)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "var(--tracking-mono)",
                color: isActive ? "var(--ink)" : "var(--mute)",
                background: isActive ? "var(--bg-sub-2)" : "transparent",
                border: isActive ? "1px solid var(--line-2)" : "1px solid transparent",
                textDecoration: "none",
            }}
        >
            <Icon
                size={13}
                style={{
                    color: isActive ? "var(--accent)" : "var(--mute-2)",
                    flexShrink: 0,
                }}
            />
            <span className="flex-1 truncate">{label}</span>
            {badge}
            {rightSlot}
        </Link>
    );
}

export default function Sidebar({ user, attentionCount, applicationCount }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [journalBadge, setJournalBadge] = useState<number>(0);

    useEffect(() => {
        let count = 0;
        const lastVisit = localStorage.getItem("kursa-journal-last-visit");

        void api.checkins.next().then((next) => {
            if (next.due) count += 1;

            void fetch(
                `${env.NEXT_PUBLIC_SERVER_URL}/api/v1/profile/me/observations?page=1&limit=1`,
                { credentials: "include" },
            )
                .then((r) => (r.ok ? r.json() : null))
                .then((json: { data?: { data?: Array<{ createdAt: string }> } } | null) => {
                    const latest = json?.data?.data?.[0]?.createdAt;
                    if (latest && lastVisit && new Date(latest) > new Date(lastVisit)) {
                        count += 1;
                    }
                    setJournalBadge(count);
                })
                .catch(() => setJournalBadge(count));
        }).catch(() => null);
    }, [pathname]);

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    function isActive(href: Route) {
        const h = href as string;
        if (h === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(h);
    }

    return (
        <aside
            className="flex flex-col h-full select-none"
            style={{
                width: 204,
                minWidth: 204,
                borderRight: "1px solid var(--line)",
                background: "var(--bg-sub)",
            }}
        >
            {/* ── Logo zone ───────────────────────────────────── */}
            <div
                className="flex items-center gap-2 px-3 py-3 justify-between"
                style={{ borderBottom: "1px solid var(--line)" }}
            >
                <Logo size="sm" />
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Link
                        href={"/dashboard/settings" as Route}
                        className="ml-auto flex items-center justify-center rounded transition-colors"
                        style={{ color: "var(--mute-2)", padding: 2 }}
                        title="Settings"
                    >
                        <Settings size={13} />
                    </Link>
                </div>
            </div>

            {/* ── Workspace nav ───────────────────────────────── */}
            <div className="px-2 pt-1">
                <div
                    className="eyebrow px-1 mb-1"
                    style={{ fontSize: 9, letterSpacing: "0.06em" }}
                >
                    workspace
                </div>
                <div className="flex flex-col gap-0.5">
                    {WORKSPACE_NAV.map(({ href, label, Icon, key }) => (
                        <NavItem
                            key={key}
                            href={href}
                            label={label}
                            Icon={Icon}
                            isActive={isActive(href)}
                            badge={
                                key === "home" && attentionCount && attentionCount > 0
                                    ? <Badge>{attentionCount}</Badge>
                                    : undefined
                            }
                            rightSlot={
                                key === "aria" ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/dashboard/aria" as Route); }}
                                        className="flex items-center justify-center rounded"
                                        style={{
                                            color: "var(--mute-3)",
                                            padding: 1,
                                            background: "transparent",
                                            border: "none",
                                            cursor: "pointer",
                                        }}
                                        title="Edit Aria"
                                    >
                                        <Pencil size={10} />
                                    </button>
                                ) : undefined
                            }
                        />
                    ))}
                </div>
            </div>

            {/* ── Job search nav ──────────────────────────────── */}
            <div className="px-2 pt-3">
                <div
                    className="eyebrow px-1 mb-1"
                    style={{ fontSize: 9, letterSpacing: "0.06em" }}
                >
                    job search
                </div>
                <div className="flex flex-col gap-0.5">
                    {JOB_SEARCH_NAV.map(({ href, label, Icon, key }) => (
                        <NavItem
                            key={key}
                            href={href}
                            label={label}
                            Icon={Icon}
                            isActive={isActive(href)}
                            badge={
                                key === "shortlist" &&
                                    applicationCount !== undefined &&
                                    applicationCount > 0 ? (
                                    <Badge>{applicationCount}</Badge>
                                ) : key === "journal" && journalBadge > 0 ? (
                                    <Badge>{journalBadge}</Badge>
                                ) : undefined
                            }
                        />
                    ))}
                </div>
            </div>


            {/* ── User footer ─────────────────────────────────── */}
            <Link
                href="/dashboard/settings"
                className="flex items-center justify-between gap-2 px-3 py-3 mt-auto"
                style={{ borderTop: "1px solid var(--line)" }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                            width: 26,
                            height: 26,
                            background: "var(--accent-soft)",
                            border: "1px solid var(--accent-line)",
                        }}
                    >
                        <span
                            className="mono font-semibold"
                            style={{ fontSize: 8, color: "var(--accent)", letterSpacing: "0.03em" }}
                        >
                            {initials}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div
                            className="truncate font-medium"
                            style={{ fontSize: "var(--text-xs)", color: "var(--ink)", lineHeight: 1.3 }}
                        >
                            {user.name}
                        </div>
                        <div
                            className="truncate mono"
                            style={{ fontSize: 9, color: "var(--mute-2)", lineHeight: 1.3 }}
                        >
                            kursa member
                        </div>
                    </div>
                </div>

                <ChevronRight size={12} style={{ color: "var(--mute-3)" }} />
            </Link>
        </aside>
    );
}
