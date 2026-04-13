"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Phone,
    BarChart3,
    ArrowLeft,
    Mail,
    MessageCircle,
    Mic,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const voiceSidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard/voice",
        icon: LayoutDashboard,
    },
    {
        title: "Call Logs",
        href: "/dashboard/voice/logs",
        icon: Phone,
    },
    {
        title: "Analytics",
        href: "/dashboard/voice/analytics",
        icon: BarChart3,
    },
];

export default function VoiceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 text-slate-900">
            <aside className="w-72 flex-col bg-[#000000] border-r border-zinc-800 hidden md:flex font-sans">
                {/* Logo Section - Flush to top with brand background */}
                <div className="p-8 flex justify-center bg-[#000000] relative overflow-hidden">
                    <div className="relative w-full h-16 transition-transform hover:scale-105 duration-300">
                        <Image
                            src="/ASquared Logo White-01.png"
                            alt="Asquared Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>

                <div className="px-6 py-6">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-between bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 h-11 shadow-sm px-4 rounded-xl"
                            >
                                <span className="flex items-center gap-3">
                                    <div className="p-1.5 rounded-lg bg-zinc-800">
                                        <LayoutDashboard className="h-4 w-4 text-cyan-400" />
                                    </div>
                                    <span className="font-semibold text-sm truncate uppercase tracking-wider">Voice Agent</span>
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[240px] p-2 rounded-xl shadow-2xl bg-zinc-900 border-zinc-800 text-zinc-300">
                            <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400">
                                <Link href="/dashboard" className="w-full flex items-center">
                                    <LayoutDashboard className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">Master Overview</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400">
                                <Link href="/dashboard/email" className="w-full flex items-center">
                                    <Mail className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">Email Marketing</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400">
                                <Link href="/dashboard/whatsapp" className="w-full flex items-center">
                                    <MessageCircle className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">WhatsApp CRM</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400">
                                <Link href="/dashboard/voice" className="w-full flex items-center">
                                    <Mic className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">Voice Agent</span>
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="px-4 py-2">
                    <div className="h-[1px] w-full bg-zinc-100"></div>
                </div>

                <nav className="flex-1 overflow-auto px-4 space-y-1.5 mt-2">
                    {voiceSidebarItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${isActive
                                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/20"
                                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                                    }`}
                            >
                                <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400 transition-colors"}`} />
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto p-4 mb-4">
                    {/* Switcher moved to top */}
                </div>
            </aside>

            <main className="flex-1 overflow-auto bg-zinc-50 p-6">
                {children}
            </main>
        </div>
    );
}
