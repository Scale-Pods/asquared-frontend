"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { consolidateLeads, ConsolidatedLead } from "@/lib/leads-utils";
import { supabase } from "@/lib/supabase";

interface DataContextType {
    leads: ConsolidatedLead[];
    calls: any[];
    loadingLeads: boolean;
    loadingCalls: boolean;
    loadingBalances: boolean;
    voiceBalance: any;
    didlogicBalance: any;
    error: string | null;
    refreshLeads: () => Promise<void>;
    refreshCalls: (params?: Record<string, string>) => Promise<void>;
    refreshBalances: () => Promise<void>;
    refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [leads, setLeads] = useState<ConsolidatedLead[]>([]);
    const [calls, setCalls] = useState<any[]>([]);
    const [loadingLeads, setLoadingLeads] = useState(true);
    const [loadingCalls, setLoadingCalls] = useState(true);
    const [loadingBalances, setLoadingBalances] = useState(true);
    const [voiceBalance, setVoiceBalance] = useState<any>(null);
    const [didlogicBalance, setDidlogicBalance] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchLeads = useCallback(async () => {
        setLoadingLeads(true);
        try {
            const response = await fetch('/api/leads');
            if (!response.ok) throw new Error('Failed to fetch leads');
            const data = await response.json();
            const consolidated = consolidateLeads(data);
            setLeads(consolidated);
        } catch (err: any) {
            console.error('DataProvider leads fetch error:', err);
            setError(err.message);
        } finally {
            setLoadingLeads(false);
        }
    }, []);

    const fetchCalls = useCallback(async (params?: Record<string, string>) => {
        setLoadingCalls(true);
        try {
            const query = params ? '?' + new URLSearchParams(params).toString() : '';
            const response = await fetch('/api/calls' + query);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) setCalls(data);
            }
        } catch (err: any) {
            console.error('DataProvider calls fetch error:', err);
        } finally {
            setLoadingCalls(false);
        }
    }, []);

    const refreshBalances = useCallback(async () => {
        setLoadingBalances(true);
        try {
            const [vRes, dRes] = await Promise.all([
                fetch('/api/voice/balance'),
                fetch('/api/didlogic/balance')
            ]);
            
            if (vRes.ok) setVoiceBalance(await vRes.json());
            if (dRes.ok) setDidlogicBalance(await dRes.json());
        } catch (error) {
            console.error('Error refreshing balances:', error);
        } finally {
            setLoadingBalances(false);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        await Promise.all([fetchLeads(), fetchCalls(), refreshBalances()]);
    }, [fetchLeads, fetchCalls, refreshBalances]);

    useEffect(() => {
        refreshAll();
    }, []);

    return (
        <DataContext.Provider value={{
            leads,
            calls,
            loadingLeads,
            loadingCalls,
            loadingBalances,
            voiceBalance,
            didlogicBalance,
            error,
            refreshLeads: fetchLeads,
            refreshCalls: fetchCalls,
            refreshBalances: refreshBalances,
            refreshAll
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
