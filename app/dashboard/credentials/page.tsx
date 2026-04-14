"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Mail, MessageCircle, Mic, ExternalLink, Copy, Eye, EyeOff, ShieldCheck, Wallet, Phone, BarChart3, Settings, Smartphone } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { useData } from "@/context/DataContext";

export default function CredentialsPage() {
    const { calls, voiceBalance, didlogicBalance, loadingBalances } = useData();

    const vapiAgentUsed = React.useMemo(() => {
        if (!calls || !Array.isArray(calls)) return 0;
        return calls.filter((c: any) => c.source === 'vapi').reduce((acc: number, call: any) => acc + (call.breakdown?.agent || 0), 0);
    }, [calls]);

    const telephonyUsed = React.useMemo(() => {
        if (!calls || !Array.isArray(calls)) return 0;
        return calls.reduce((acc: number, call: any) => acc + (call.breakdown?.telephony || 0), 0);
    }, [calls]);



    const [senderEmails, setSenderEmails] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    React.useEffect(() => {
        const fetchEmails = async () => {
            try {
                const res = await fetch('/api/email/warmup-analytics', { method: 'POST' });
                if (!res.ok) throw new Error("Failed to fetch analytics");
                const data = await res.json();

                // Extract emails from the warmup account objects
                if (Array.isArray(data)) {
                    const emails = data.map((account: any) => account.email);
                    setSenderEmails(emails);
                }
            } catch (err) {
                console.error("Error fetching sender emails:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEmails();
    }, []);

    const vapiDetails = voiceBalance?.vapi;

    return (
        <div className="space-y-8 pb-10 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Credentials Management</h1>
                    <p className="text-slate-500">View your active integrations and manageable accounts.</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Email Section */}
                <CredentialSection
                    title="Email Integration"
                    description="Active sender accounts detected from your campaigns."
                    icon={Mail}
                    iconColor="text-rose-600"
                    iconBg="bg-rose-50"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        {loading ? (
                            <div className="md:col-span-2 text-slate-400 text-sm animate-pulse">Detecting active email accounts...</div>
                        ) : senderEmails.length > 0 ? (
                            senderEmails.map((email, idx) => (
                                <ReadOnlyField key={idx} label={`Project Email ${idx + 1}`} value={email} />
                            ))
                        ) : (
                            <ReadOnlyField label="Connected Email" value="No active emails detected" />
                        )}
                    </div>
                </CredentialSection>

                {/* WhatsApp Section */}
                <CredentialSection
                    title="WhatsApp Business API"
                    description="Meta Business API credentials for WhatsApp CRM."
                    icon={MessageCircle}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                >
                    <div className="grid gap-6 md:grid-cols-2">
                        <ReadOnlyField label="WhatsApp Account 1 " value="No number added" />
                        <ReadOnlyField label="WhatsApp Account 2" value="No number added" />
                    </div>
                </CredentialSection>

                {/* Provisioned Numbers Section */}
                <CredentialSection
                    title="Provisioned Phone Numbers"
                    description="Active telephony lines for Voice and WhatsApp."
                    icon={Phone}
                    iconColor="text-cyan-600"
                    iconBg="bg-cyan-50"
                >
                    <div className="grid gap-8 md:grid-cols-1">
                        {/* UK Section */}
                        <div className="space-y-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                            <ReadOnlyField label="Didlogic (UK)" value="+44 (20) 8097 8341" />
                            <ReadOnlyField label="Provisioned ID" value="682cf6ae-23fd-44f3-a4a3-756998cd62c1" />
                        </div>
 
                       


                    </div>
                </CredentialSection>

                {/* Didlogic Telephony Section */}
                <CredentialSection
                    title="Didlogic Telephony"
                    description="Telephony carrier management and balance overview."
                    icon={Smartphone}
                    iconColor="text-rose-600"
                    iconBg="bg-rose-50"
                    action={
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => window.open('https://didlogic.com/portal', '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                            Didlogic Portal
                        </Button>
                    }
                >
                    <div className="space-y-4">
                        <div className="bg-rose-50/50 rounded-lg p-4 border border-rose-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-md border border-rose-200">
                                    <Smartphone className="h-5 w-5 text-rose-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Didlogic Account</p>
                                    <p className="text-xs text-slate-500 font-mono italic">Carrier Status: {didlogicBalance?.status === 'active' ? 'Active' : 'Pending'}</p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Used</p>
                                    <p className="text-xl font-black text-rose-600">
                                        ${telephonyUsed.toFixed(2)}
                                    </p>
                                </div>
                                <div className="w-[1px] h-10 bg-rose-200 hidden sm:block"></div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Available Balance</p>
                                    <p className="text-2xl font-black text-emerald-600">
                                        {didlogicBalance?.balance !== undefined ? `$${didlogicBalance.balance.toFixed(2)}` : 'Live Sync Pending'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CredentialSection>
 
                {/* Voice Section */}
                <CredentialSection
                    title="Voice Agent (Vapi)"
                    description="AI Voice configuration and wallet balances."
                    icon={Mic}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-50"
                    action={
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 gap-2" onClick={() => router.push('/dashboard/voice/logs')}>
                                <BarChart3 className="h-4 w-4" />
                                Detailed Cost Analysis
                            </Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => window.open('https://dashboard.vapi.ai/login', '_blank')}>
                                <Wallet className="h-4 w-4" />
                                Vapi Wallet
                            </Button>
                        </div>
                    }
                >
                    <div className="grid gap-6">
                        {/* Vapi Details */}
                        <div className="bg-blue-50/50 rounded-lg p-5 border border-blue-100 flex flex-col gap-4">
                            <div className="flex flex-col text-center bg-white p-8 rounded-lg border border-blue-100 shadow-sm">
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Vapi Credits Used</span>
                                <span className="text-5xl font-black text-blue-600">
                                    ${vapiAgentUsed.toFixed(2)}
                                </span>
                                <p className="text-[10px] text-blue-500 mt-4 font-semibold bg-blue-50 px-3 py-1 rounded-full self-center border border-blue-100 italic">
                                    Total Lifetime Consumption
                                </p>
                            </div>
                        </div>


                    </div>
                </CredentialSection>




            </div>
        </div>
    );
}

function CredentialSection({ title, description, icon: Icon, iconColor, iconBg, children, action }: any) {
    return (
        <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-slate-900">{title}</CardTitle>
                            <CardDescription className="mt-1">{description}</CardDescription>
                        </div>
                    </div>
                    {action && <div>{action}</div>}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {children}
            </CardContent>
        </Card>
    );
}

function ReadOnlyField({ label, value, isPassword }: { label: string, value: string, isPassword?: boolean }) {
    const [show, setShow] = useState(false);

    // Simple masking logic
    const displayValue = isPassword && !show
        ? "••••••••••••••••••••••••"
        : value;

    return (
        <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</Label>
            <div className="relative group">
                <div className="flex items-center w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-sm">
                    <span className={`flex-1 truncate ${isPassword && !show ? 'font-mono tracking-widest' : 'font-sans'}`}>
                        {displayValue}
                    </span>
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isPassword && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-slate-600" onClick={() => setShow(!show)}>
                                {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-slate-600"
                            onClick={() => navigator.clipboard.writeText(value)}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
