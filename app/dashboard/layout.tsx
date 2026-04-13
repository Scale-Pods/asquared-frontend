"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Mail, MessageCircle, Mic, Settings, LogOut, ChevronDown, Wallet, BarChart2, Users, Send, Key, ExternalLink, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataProvider, useData } from "@/context/DataContext";
import { calculateDuration } from "@/lib/utils";
import { useMemo } from "react";
import { logout } from "@/app/actions/auth";

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Email Marketing",
        href: "/dashboard/email",
        icon: Mail,
    },
    {
        title: "WhatsApp",
        href: "/dashboard/whatsapp",
        icon: MessageCircle,
    },
    {
        title: "Voice Agent",
        href: "/dashboard/voice",
        icon: Mic,
    },
];

function WalletModal({ isOpen, onClose, type, details, calls }: { isOpen: boolean, onClose: () => void, type: 'vapi' | 'didlogic', details?: any, calls?: any[] }) {
    const { voiceBalance } = useData();
 
    const title = type === 'vapi' ? 'Vapi Wallet' : 'Didlogic Account';
    const icon = type === 'vapi' 
        ? <Mic className="h-5 w-5 text-blue-600" />
        : <Smartphone className="h-5 w-5 text-rose-600" />;

    const vapiAgentUsed = useMemo(() => {
        // Prioritize Vapi API's native 'used' value if available
        if (voiceBalance?.vapi?.used !== undefined && voiceBalance?.vapi?.used !== 0) {
            return voiceBalance.vapi.used;
        }
        if (!calls || !Array.isArray(calls)) return 0;
        // Fallback to summing 'agent' costs from logs specifically
        return calls.filter((c: any) => c.source === 'vapi').reduce((acc: number, call: any) => acc + (call.breakdown?.agent || 0), 0);
    }, [calls, voiceBalance]);

    const vapiDetails = voiceBalance?.vapi;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {icon}
                        <span>{title}</span>
                    </DialogTitle>
                </DialogHeader>
                <div className="py-2 space-y-6">
                    {type === 'vapi' && (
                        <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex flex-col gap-4">
                            <div className="flex flex-col text-center bg-white p-8 rounded-lg border border-blue-100 shadow-sm">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Vapi Credits Used</span>
                                <span className="text-5xl font-black text-blue-600">
                                    ${vapiAgentUsed.toFixed(2)}
                                </span>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-12" onClick={() => window.open('https://vapi.ai', '_blank')}>
                                <ExternalLink className="h-4 w-4" /> Add Funds to VAPI
                            </Button>
                        </div>
                    )}
 
                    {type === 'didlogic' && (
                        <div className="bg-rose-50/50 rounded-xl p-5 border border-rose-100 flex flex-col gap-4">
                            <div className="flex flex-col text-center bg-white p-6 rounded-lg border border-rose-100 shadow-sm">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Carrier Status</span>
                                <span className="text-4xl font-black text-rose-600">
                                    ACTIVE
                                </span>
                                <span className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-widest">Didlogic SIP Trunking</span>
                            </div>
                            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => window.open('https://didlogic.com/portal', '_blank')}>
                                <ExternalLink className="h-4 w-4" /> Go to Didlogic Portal
                            </Button>
                        </div>
                    )}


                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <DataProvider>
            <DashboardContent>
                {children}
            </DashboardContent>
        </DataProvider>
    );
}

function DashboardContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const dashboardConfig = {
        master: {
            label: "Master Overview",
            icon: LayoutDashboard,
            items: [
                { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
                { title: "Email Marketing", href: "/dashboard/email", icon: Mail },
                { title: "WhatsApp CRM", href: "/dashboard/whatsapp", icon: MessageCircle },
                { title: "Voice Agent", href: "/dashboard/voice", icon: Mic },
                { title: "Leads", href: "/dashboard/leads", icon: Users },
                { title: "Credentials", href: "/dashboard/credentials", icon: Key },
            ]
        },
        email: {
            label: "Email Marketing",
            icon: Mail,
            items: [
                { title: "Overview", href: "/dashboard/email", icon: LayoutDashboard },
                { title: "Analytics", href: "/dashboard/email/analytics", icon: BarChart2 },
            ]
        },
        whatsapp: {
            label: "WhatsApp CRM",
            icon: MessageCircle,
            items: [
                { title: "Overview", href: "/dashboard/whatsapp", icon: LayoutDashboard },
                { title: "Leads", href: "/dashboard/whatsapp/leads", icon: Users },
                { title: "Sent Messages", href: "/dashboard/whatsapp/sent", icon: Send },
            ]
        },
        voice: {
            label: "Voice Agent",
            icon: Mic,
            items: [
                { title: "Overview", href: "/dashboard/voice", icon: LayoutDashboard },
                { title: "Call Logs", href: "/dashboard/voice/logs", icon: Mic },
            ]
        }
    };

    // Determine current context
    let currentContext = "master";
    if (pathname.startsWith("/dashboard/email")) currentContext = "email";
    else if (pathname.startsWith("/dashboard/whatsapp")) currentContext = "whatsapp";
    else if (pathname.startsWith("/dashboard/voice")) currentContext = "voice";

    const activeConfig = (dashboardConfig as any)[currentContext];

    const {
        calls,
        voiceBalance,
        didlogicBalance,
        loadingBalances,
        loadingCalls
    } = useData();
    const vapiAgentUsed = useMemo(() => {
        // Prioritize Vapi API's native 'used' value if available
        if (voiceBalance?.vapi?.used !== undefined && voiceBalance?.vapi?.used !== 0) {
            return voiceBalance.vapi.used;
        }
        if (!calls || !Array.isArray(calls)) return 0;
        // Fallback to summing 'agent' costs from logs specifically
        return calls.filter((c: any) => c.source === 'vapi').reduce((acc: number, call: any) => acc + (call.breakdown?.agent || 0), 0);
    }, [calls, voiceBalance]);



    const [walletModal, setWalletModal] = useState<{ isOpen: boolean, type: 'vapi' | 'didlogic' }>({
        isOpen: false,
        type: 'vapi'
    });


    const content = (() => {
        if (pathname.startsWith("/dashboard/email") || pathname.startsWith("/dashboard/whatsapp") || pathname.startsWith("/dashboard/voice")) {
            return <>{children}</>;
        }

        return (
            <div className="flex h-screen overflow-hidden bg-zinc-50 text-slate-900">
                {/* Sidebar */}
                <aside className="hidden w-72 flex-col bg-[#000000] border-r border-zinc-800 md:flex font-sans">
                    {/* Logo Section - Flush to top with brand background */}
                    <div className="p-8 flex justify-center bg-[#000000] relative overflow-hidden">
                        <Link href="/" className="relative w-full h-16 block transition-all hover:scale-105 duration-300">
                            <Image
                                src="/ASquared Logo White-01.png"
                                alt="Asquared Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </Link>
                    </div>

                    <div className="px-6 py-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    suppressHydrationWarning
                                    variant="outline"
                                    className="w-full justify-between bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 h-11 shadow-sm px-4 rounded-xl"
                                >
                                    <span className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-zinc-800">
                                            <activeConfig.icon className="h-4 w-4 text-cyan-400" />
                                        </div>
                                        <span className="font-semibold text-sm truncate uppercase tracking-wider">{activeConfig.label}</span>
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-[240px] p-2 rounded-xl shadow-2xl bg-zinc-900 border-zinc-800 text-zinc-300">
                                <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400" onClick={() => router.push("/dashboard")}>
                                    <LayoutDashboard className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">Master Overview</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400" onClick={() => router.push("/dashboard/email")}>
                                    <Mail className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">Email Marketing</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400" onClick={() => router.push("/dashboard/whatsapp")}>
                                    <MessageCircle className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">WhatsApp CRM</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="rounded-lg py-2.5 cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-cyan-400" onClick={() => router.push("/dashboard/voice")}>
                                    <Mic className="mr-3 h-4 w-4 text-zinc-500" /> <span className="font-medium">Voice Agent</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="px-6 py-2">
                        <div className="h-[1px] w-full bg-zinc-800"></div>
                    </div>

                    <nav className="flex-1 overflow-auto px-4 space-y-1.5 mt-2">
                        {activeConfig.items.map((item: any, index: number) => {
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
                    <div className="mt-auto p-6 space-y-4">
                        <div className="h-[1px] w-full bg-zinc-800 mb-2"></div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors rounded-xl h-11 px-4"
                            onClick={async () => {
                                await logout();
                                window.location.href = '/';
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="font-medium">Logout</span>
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-6 lg:h-[60px]">
                        <div className="flex flex-1 items-center justify-between">
                            <h1 className="text-lg font-semibold text-slate-900">
                                {pathname === "/dashboard" ? "Master Overview" : activeConfig.items.find((item: any) => item.href === pathname)?.title || activeConfig.label}
                            </h1>

                            {currentContext === "master" && (
                                <div className="flex items-center gap-2">
                                    {/* Vapi Balance Button */}
                                    <Button
                                        variant="outline"
                                        className="h-10 px-3 border-blue-200 bg-blue-50/30 hover:bg-blue-50 text-blue-700 gap-2 flex items-center shadow-sm"
                                        onClick={() => setWalletModal({ isOpen: true, type: 'vapi' })}
                                    >
                                        <Mic className="h-3.5 w-3.5" />
                                        <div className="flex flex-col items-start leading-[1.1]">
                                            <span className="text-[9px] font-bold uppercase opacity-70">Vapi Used</span>
                                            <span className="text-xs font-bold">
                                                {loadingCalls ? "..." : `$${vapiAgentUsed.toFixed(2)}`}
                                            </span>
                                        </div>
                                    </Button>
 
                                    {/* Didlogic Button */}
                                    <Button
                                        variant="outline"
                                        className="h-10 px-3 border-rose-200 bg-rose-50/30 hover:bg-rose-50 text-rose-700 gap-2 flex items-center shadow-sm"
                                        onClick={() => setWalletModal({ isOpen: true, type: 'didlogic' })}
                                    >
                                        <Smartphone className="h-3.5 w-3.5" />
                                        <div className="flex flex-col items-start leading-[1.1]">
                                            <span className="text-[9px] font-bold uppercase opacity-70">Didlogic</span>
                                            <span className="text-xs font-bold">
                                                {loadingBalances ? "..." : (didlogicBalance?.balance !== undefined ? `$${didlogicBalance.balance.toFixed(2)}` : "Active")}
                                            </span>
                                        </div>
                                    </Button>







                                </div>
                            )}
                        </div>
                    </header>

                    <WalletModal
                        isOpen={walletModal.isOpen}
                        type={walletModal.type}
                        details={walletModal.type === 'vapi' ? voiceBalance?.vapi : didlogicBalance}
                        calls={calls}
                        onClose={() => setWalletModal({ ...walletModal, isOpen: false })}
                    />

                    <main className="flex-1 overflow-auto bg-zinc-50 p-6 relative">
                        {children}
                    </main>
                </div>
            </div>
        );
    })();

    return (
        <>{content}</>
    );
}
