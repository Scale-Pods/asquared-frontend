"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw, Play, ChevronLeft, ChevronRight, User, Loader2, Download, ExternalLink, Search, Info, Activity, HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LMLoader } from "@/components/lm-loader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import React, { useState, useEffect } from "react";
import { CallDetailsModal } from "@/components/voice/call-details-modal";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format, parseISO, subDays } from "date-fns";
import { calculateDuration, formatDuration } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Progressive fetch for missing metadata (phone numbers/direction)
// Static cells that rely on pre-fetched and normalized data from the API
const DynamicRowCells = ({ call, leads }: { call: any, leads: any[] }) => {
    // RESOLVE: Prioritize backend names, then Leads database, then Vapi metadata
    let guestName = call.name || "Guest";
    const guestNum = call.phone || "Unknown";
    const realType = call.type || (call.isInbound ? "Inbound" : "Outbound");
    const isInboundState = call.isInbound;

    // Eagerly resolve name from our Leads database based on phone if Guest
    if ((!guestName || guestName === "Guest" || guestName === "Unknown") && call.phone && leads) {
        const targetPhone = call.phone.replace(/\D/g, '');
        if (targetPhone && targetPhone.length > 5) {
            const foundLead = leads.find((l: any) => l.phone && l.phone.replace(/\D/g, '') === targetPhone);
            if (foundLead && foundLead.name) {
                guestName = foundLead.name;
            }
        }
    }

    // Purely column based: use voice_call_status or the actual sentiment analysis (llmIntent)
    let voiceStatus = call.voice_call_status || call.llmIntent || "";
    let voiceNote = call.note || call.leadNote || "";

    if (!voiceStatus && call.phone && leads) {
        const targetPhone = call.phone.replace(/\D/g, '');
        if (targetPhone && targetPhone.length > 5) {
            // Check ALL matching leads for this number (handling duplicates)
            const matchingLeads = leads.filter((l: any) => l.phone && l.phone.replace(/\D/g, '') === targetPhone);
            
            // 1. Look for any matching record that has a voice_call_status
            const leadWithStatus = matchingLeads.find(l => l.voice_call_status && l.voice_call_status !== "-");
            if (leadWithStatus) {
                voiceStatus = leadWithStatus.voice_call_status;
            }
            
            // 2. Look for any matching record that has a note (if we don't have one yet)
            if (!voiceNote) {
                const leadWithNote = matchingLeads.find(l => l.note);
                if (leadWithNote) voiceNote = leadWithNote.note;
            }
        }
    }

    const hasData = !!voiceStatus;
    const displayStatus = voiceStatus || "Please hear the voice rec or read transcript unless you get sentiment analysis.";

    return (
        <>
            <TableCell className="font-semibold text-slate-900">
                <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {guestName}
                </div>
            </TableCell>
            <TableCell className="font-medium text-slate-800">
                {guestNum}
            </TableCell>
            <TableCell>
                <Badge variant={isInboundState ? "default" : "secondary"} className={`text-[10px] ${isInboundState ? 'bg-blue-600 outline-none border-none' : ''}`}>
                    {realType}
                </Badge>
            </TableCell>
            <TableCell>
                {voiceNote ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className={`font-medium cursor-help underline decoration-dotted decoration-slate-300 ${hasData ? 'text-slate-700' : 'text-slate-400 italic text-[10px]'}`}>
                                {displayStatus}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px] bg-slate-900 text-white border-none p-3 shadow-xl">
                            <p className="text-xs leading-relaxed">{voiceNote}</p>
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <span className={`${hasData ? 'text-slate-700 font-medium' : 'text-slate-400 italic text-[10px]'}`}>
                        {displayStatus}
                    </span>
                )}
            </TableCell>
            <TableCell className="text-slate-600 font-medium">{formatDuration(call.durationSeconds)}</TableCell>
            <TableCell className="text-slate-500 text-xs">{call.country || 'Unknown'}</TableCell>
            <TableCell className="font-bold text-emerald-600">
                <Popover>
                    <PopoverTrigger asChild>
                        <button
                            className="hover:underline flex items-center gap-1 cursor-help"
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            {call.cost}
                            <Info className="h-3 w-3 text-slate-300" />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-4 bg-white shadow-xl border-slate-200" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <h4 className="font-bold text-sm text-slate-900">Cost Breakdown</h4>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-[11px] text-slate-500">
                                    <span>Agent (Vapi/AI):</span>
                                    <span className="font-mono text-slate-700">${(call.breakdown?.agent || 0).toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-500">
                                    <span>Didlogic (Carrier):</span>
                                    <span className="font-mono text-slate-700">${(call.breakdown?.telephony || 0).toFixed(3)}</span>
                                </div>
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between text-xs font-bold text-slate-900">
                                <span>Total Estimated:</span>
                                <span className="text-emerald-600">{call.cost}</span>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </TableCell>
        </>
    );
};


export default function VoiceLogsPage() {
    const { calls: globalCalls, loadingCalls, refreshCalls, leads, loadingLeads } = useData();
    const [allCallsMapped, setAllCallsMapped] = useState<any[]>([]);
    const [calls, setCalls] = useState<any[]>([]);
    const [loadingLocal, setLoadingLocal] = useState(false);
    const loading = loadingCalls || loadingLocal;
    const [selectedCall, setSelectedCall] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [dateRange, setDateRange] = useState<any>({
        from: subDays(new Date(), 7),
        to: new Date(),
    });
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [providerFilter, setProviderFilter] = useState("vapi");
    const [phoneFilter, setPhoneFilter] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [costModalOpen, setCostModalOpen] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        if (loadingCalls || loadingLeads || !globalCalls) return;

        const mappedCalls = globalCalls.map((c: any) => {
            const isInbound = c.isInbound === true;

            // Eagerly resolve name from our Leads database based on phone
            let resolvedName = c.name;
            if ((!resolvedName || resolvedName === "Guest" || resolvedName === "Unknown") && c.phone && leads) {
                const targetPhone = c.phone.replace(/\D/g, '');
                if (targetPhone && targetPhone.length > 5) {
                    const foundLead = leads.find((l: any) => l.phone && l.phone.replace(/\D/g, '') === targetPhone);
                    if (foundLead && foundLead.name) {
                        resolvedName = foundLead.name;
                    }
                }
            }

            return {
                ...c,
                name: resolvedName,
                displayDate: c.startedAt ? format(new Date(c.startedAt), 'PPp') : 'N/A',
                displayDuration: formatDuration(c.durationSeconds || 0),
            };
        });

        setAllCallsMapped(mappedCalls);
    }, [globalCalls, loadingCalls, leads, loadingLeads]);

    // SYNC: Fetch real data from Vapi when date range changes
    useEffect(() => {
        const fetchRealData = async () => {
            if (!dateRange?.from) return;
            setLoadingLocal(true);
            try {
                const params: Record<string, string> = {
                    from: dateRange.from.toISOString(),
                };
                if (dateRange.to) {
                    params.to = dateRange.to.toISOString();
                }
                await refreshCalls(params);
            } finally {
                setLoadingLocal(false);
            }
        };

        fetchRealData();
        setCurrentPage(1);
    }, [dateRange, providerFilter, typeFilter, statusFilter, phoneFilter, sortBy]);

    // Re-apply filtering whenever data or filters change (no page reset here).
    useEffect(() => {
        const filteredCalls = allCallsMapped.filter((call: any) => {
            // Priority 1: Provider Filter
            if (providerFilter !== "all" && call.source !== providerFilter) return false;

            if (dateRange?.from) {
                if (!call.startedAt) return false;
                const callDate = new Date(call.startedAt);
                const from = new Date(dateRange.from);
                from.setHours(0, 0, 0, 0);
                const to = new Date(dateRange.to || dateRange.from);
                to.setHours(23, 59, 59, 999);
                if (callDate < from || callDate > to) return false;
            }

            if (statusFilter !== "all" && call.status !== statusFilter) return false;
            if (typeFilter !== "all" && call.type?.toLowerCase() !== typeFilter.toLowerCase()) return false;

            if (phoneFilter) {
                const searchStr = phoneFilter.toLowerCase().trim();
                const phoneSearch = searchStr.replace(/\D/g, '');
                const phoneTarget = (call.phone || "").replace(/\D/g, '');

                const matchesPhone = phoneSearch && phoneTarget.includes(phoneSearch);
                const matchesName = (call.name || "Guest").toLowerCase().includes(searchStr);

                if (!matchesPhone && !matchesName) return false;
            }

            return true;
        });

        // Apply Sorting
        const sortedCalls = [...filteredCalls].sort((a, b) => {
            if (sortBy === "longest") return (b.durationSeconds || 0) - (a.durationSeconds || 0);
            if (sortBy === "shortest") return (a.durationSeconds || 0) - (b.durationSeconds || 0);
            if (sortBy === "oldest") {
                const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
                const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
                return dateA - dateB;
            }
            // default: newest
            const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
            const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
            return dateB - dateA;
        });

        setCalls(sortedCalls);
    }, [allCallsMapped, dateRange, statusFilter, typeFilter, providerFilter, phoneFilter, sortBy]);

    // SILENT FILL: Periodically refresh recent calls that are missing sentiment/status
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            // Check if any call from the last 15 minutes is missing its sentiment/status
            const hasRecentMissingData = calls.some(c => {
                const isMissing = !c.voice_call_status && !c.llmIntent;
                if (!isMissing) return false;
                
                const startedAt = c.startedAt ? new Date(c.startedAt) : null;
                if (!startedAt) return false;
                
                const ageMinutes = (now.getTime() - startedAt.getTime()) / (1000 * 60);
                return ageMinutes >= 0 && ageMinutes < 15; // 15 min window for AI processing
            });

            if (hasRecentMissingData && !loading && dateRange.from) {
                const params: Record<string, string> = {
                    from: dateRange.from.toISOString(),
                };
                if (dateRange.to) params.to = dateRange.to.toISOString();
                refreshCalls(params);
            }
        }, 20000); // Check every 20 seconds for a "silent" live update feel

        return () => clearInterval(interval);
    }, [calls, loading, dateRange, refreshCalls]);

    const handleRefresh = () => {
        const fetchRealData = async () => {
            if (!dateRange?.from) return;
            setLoadingLocal(true);
            try {
                const params: Record<string, string> = {
                    from: dateRange.from.toISOString(),
                };
                if (dateRange.to) {
                    params.to = dateRange.to.toISOString();
                }
                await refreshCalls(params);
            } finally {
                setLoadingLocal(false);
            }
        };
        fetchRealData();
    };

    const handleRowClick = (call: any) => {
        setSelectedCall(call);
        setModalOpen(true);
    };

    const paginatedCalls = calls.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <TooltipProvider>
            <div className="space-y-6 pb-10 relative min-h-[500px]">
            {loading && allCallsMapped.length === 0 && <LMLoader />}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Call Logs</h1>
                        <p className="text-slate-500">Comprehensive history of Vapi voice calls.</p>
                    </div>
                    <div className="flex items-center gap-3">

                        <DateRangePicker onUpdate={(values) => setDateRange(values.range)} />
                        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-[220px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search name or phone..."
                            className="pl-9 h-9"
                            value={phoneFilter}
                            onChange={(e) => setPhoneFilter(e.target.value)}
                        />
                    </div>

                    <Select value={providerFilter} onValueChange={setProviderFilter}>
                        <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Provider" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="vapi">Vapi</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Inbound">Inbound</SelectItem>
                            <SelectItem value="Outbound">Outbound</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="answered">Answered / Done</SelectItem>
                            <SelectItem value="failed">Failed / Error</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Sort By" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="longest">Longest Duration</SelectItem>
                            <SelectItem value="shortest">Shortest Duration</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-slate-200 overflow-hidden shadow-sm bg-white">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                                <TableHead className="w-[150px]">Name</TableHead>
                                <TableHead>Guest Number</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>
                                    <div className="flex items-center gap-1.5">
                                        Sentiment & Status
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button className="text-slate-400 hover:text-slate-600">
                                                    <HelpCircle className="h-3.5 w-3.5" />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-slate-900 text-white border-none p-2 text-[10px] max-w-[200px]">
                                                From the last contacted time wait for 10 mins to see the sentiment and reload.
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Country</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[200px]">Date & Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && calls.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="h-24 text-center">Loading calls...</TableCell></TableRow>
                            ) : calls.length === 0 ? (
                                <TableRow><TableCell colSpan={9} className="h-24 text-center text-slate-500">No calls matching filters.</TableCell></TableRow>
                            ) : (
                                (paginatedCalls as any[]).map((call) => (
                                    <TableRow
                                        key={call.id}
                                        className="cursor-pointer hover:bg-slate-50/50 transition-colors"
                                        onClick={() => handleRowClick(call)}
                                    >
                                        <DynamicRowCells call={call} leads={leads} />
                                        <TableCell>
                                            <Badge variant="outline" className={`text-[10px] uppercase border-${call.status === 'answered' ? 'emerald' : 'slate'}-200 text-${call.status === 'answered' ? 'emerald' : 'slate'}-600`}>
                                                {call.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-xs">{call.displayDate}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-bold text-slate-900">{calls.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, calls.length)}</span> of {calls.length} calls
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-medium px-3 py-1">Page {currentPage}</span>
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setCurrentPage(p => Math.min(Math.ceil(calls.length / itemsPerPage), p + 1))} disabled={currentPage >= Math.ceil(calls.length / itemsPerPage)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            <CallDetailsModal open={modalOpen} onOpenChange={setModalOpen} call={selectedCall} />
        </div>
        </TooltipProvider>
    );
}
