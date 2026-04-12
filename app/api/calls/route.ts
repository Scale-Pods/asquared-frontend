import { NextResponse } from 'next/server';
import crypto from 'crypto';
import RATES_DATA from '../../../context/rates.json';



// --- Improved Helper: Number Normalization ---
function cleanPhoneNumber(num: any): string {
    if (!num) return "Unknown";
    const str = String(num).replace(/\s+/g, '').replace(/\+/g, '').replace(/\D/g, '');
    // Standard phone numbers are between 5 and 20 digits to accommodate all international formats.
    if (!str || str.length < 5 || str.length > 22) return "Unknown";
    return str;
}

// --- Improved Helper: Longest Prefix Matching ---
function getRateInfo(phoneNumber: string) {
    const cleaned = cleanPhoneNumber(phoneNumber);
    if (cleaned === "Unknown") return null;

    // Sort prefixes by length desc for priority
    const matches = RATES_DATA.filter(r => cleaned.startsWith(String(r.Prefix)));
    if (matches.length === 0) return null;
    matches.sort((a, b) => String(b.Prefix).length - String(a.Prefix).length);
    return matches[0];
}

function calculateTelephonyCost(durationSecs: number, phoneNumber: string, isInbound: boolean, providerNumber?: string) {
    if (isInbound) return durationSecs > 0 ? 0.02 : 0;
    if (!durationSecs || durationSecs <= 0) return 0;

    const pClean = (providerNumber || "").replace(/\D/g, '');
    const tClean = (phoneNumber || "").replace(/\D/g, '');

    const botIsUS = pClean.startsWith('1');
    const botIsUK = pClean.startsWith('44');
    const targetIsUAE = tClean.startsWith('971');
    const targetIsUS = tClean.startsWith('1');
    const targetIsUK = tClean.startsWith('44');

    // 🚀 Custom Twilio Partner Rates (Manual Overrides)
    if (botIsUS || botIsUK) {
        // US/UK call to UAE
        if (targetIsUAE) return (durationSecs / 60) * 0.2426;

        // US to US local
        if (botIsUS && targetIsUS) return (durationSecs / 60) * 0.013;

        // UK to UK local
        if (botIsUK && targetIsUK) return (durationSecs / 60) * 0.0305;

        // Fallback for Twilio international calls if no specific rule above is matched
        return (durationSecs / 60) * 0.05;
    }

    // Default rate lookup from rates.json for other regions/providers
    const rate = getRateInfo(tClean);
    return (durationSecs / 60) * (rate?.Rate ?? 0);
}

function calculateCostValue(durationSecs: number, phoneNumber: string, isInbound: boolean) {
    return calculateTelephonyCost(durationSecs, phoneNumber, isInbound);
}



// --- 1. Leads Cache (Supabase) ---
async function fetchLeadsCache() {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    const secretKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (!supabaseUrl || !secretKey) return new Map();

    const baseUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
    const headers = { "apikey": secretKey, "Authorization": `Bearer ${secretKey}` };
    const leadsMap = new Map<string, { name: string; status: any }>();

    try {
        const tables = ["nr_wf", "followup", "nurture", "master_leads"];
        const results = await Promise.all(tables.map(t => 
            fetch(`${baseUrl}/${t}?select=name,phone,Phone,phoneNumber,phonenumber,customer_number,lead_status`, { headers })
                .then(r => r.json())
                .catch(() => [])
        ));

        results.forEach(data => {
            if (Array.isArray(data)) {
                data.forEach(l => {
                    const phoneRaw = l.phone || l.phoneNumber || l.phonenumber || l.customer_number || "";
                    const clean = cleanPhoneNumber(phoneRaw);
                    if (clean !== "Unknown" && (l.name || l.lead_status)) {
                        // Priority: merge if already exists, but master_leads info should take precedence if status exists
                        const existing = leadsMap.get(clean);
                        leadsMap.set(clean, { 
                            name: l.name || existing?.name || "Guest", 
                            status: l.lead_status || existing?.status || null 
                        });
                    }
                });
            }
        });
    } catch (e) { console.error("Leads cache error:", e); }
    return leadsMap;
}

// --- 1.5. Evaluations Cache (Supabase) ---
async function fetchLlmEvaluationsCache() {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
    const secretKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
    if (!supabaseUrl || !secretKey) return new Map();

    const baseUrl = `${supabaseUrl.replace(/\/$/, "")}/rest/v1`;
    const headers = { "apikey": secretKey, "Authorization": `Bearer ${secretKey}` };
    const evalMap = new Map<string, string>();

    try {
        const res = await fetch(`${baseUrl}/call_evaluations?select=id,intent`, { headers });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                data.forEach(e => evalMap.set(e.id, e.intent));
            }
        }
    } catch (e) {} // Silent fail if table doesn't exist yet
    return evalMap;
}

// --- 2. Vapi Phone Cache ---
async function fetchVapiPhonesCache(vapiPrivKey: string) {
    const phoneMap = new Map<string, string>();

    // 🚀 Manual Overrides (User Provided)
    phoneMap.set('4a7e7a31-0bbc-4fde-831e-2489119ee226', '17624000439');
    phoneMap.set('e66fe46b-9fe2-4628-a32b-08ced680bc04', '97144396291');
    phoneMap.set('4baf3613-ba3d-4860-9ea1-62156686b6f1', '447462179309');
    phoneMap.set('66dff692-d2a5-47d4-bbe0-245509dc7404', '14782159151');
    phoneMap.set('d91ba874-2522-4d62-adf6-681f2a0bf4fe', '97148714150');

    if (!vapiPrivKey) return phoneMap;

    try {
        const res = await fetch('https://api.vapi.ai/phone-number', {
            headers: { 'Authorization': `Bearer ${vapiPrivKey}` }
        });
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.data || []);
            list.forEach((p: any) => {
                if (p.id && (p.number || p.phoneNumber)) {
                    const clean = cleanPhoneNumber(p.number || p.phoneNumber);
                    if (clean !== "Unknown") phoneMap.set(p.id, clean);
                }
            });
        }
    } catch (e) { console.error("Vapi phone cache error:", e); }
    return phoneMap;
}

export async function GET(req: Request) {
    try {
        const vapiPrivKey = process.env.VAPI_PRIVATE_KEY || "";
        const [leadsCache, vapiPhoneCache, evalCache] = await Promise.all([
            fetchLeadsCache(),
            fetchVapiPhonesCache(vapiPrivKey),
            fetchLlmEvaluationsCache()
        ]);

        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');
        const fromDate = fromParam ? new Date(fromParam) : null;
        const toDate = toParam ? new Date(toParam) : null;





        // --- 1.2. Twilio Telephony Aggregation ---
        // Fetch real-time billing data from Twilio (BYOC carrier)
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        let twilioLookup: Map<string, any> = new Map();

        try {
            if (twilioSid && twilioToken) {
                console.log(`[TwilioSync] Syncing billing for account: ${twilioSid}`);
                const twRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json?PageSize=100`, {
                    headers: {
                        'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
                    }
                });
                if (twRes.ok) {
                    const twData = await twRes.json();
                    const callArray = twData.calls || [];
                    console.log(`[TwilioSync] Successfully fetched ${callArray.length} billing records`);
                    callArray.forEach((c: any) => {
                        const to = cleanPhoneNumber(c.to);
                        const from = cleanPhoneNumber(c.from);
                        const key = `${to}_${from}_${new Date(c.start_time).getTime().toString().substring(0, 7)}`;
                        twilioLookup.set(key, c);
                    });
                } else {
                    console.error(`[TwilioSync] Failed: ${twRes.status} ${twRes.statusText}`);
                }
            }
        } catch (e) {
            console.error("Twilio fetch fail:", e);
        }

        // --- 1.5. Vapi Aggregation ---
        let vapiNormalized: any[] = [];
        try {
            const vapiPrivKey = process.env.VAPI_PRIVATE_KEY;
            if (vapiPrivKey) {
                let allVapiCalls: any[] = [];
                let hasMoreVapi = true;
                let lastCreatedAt = null;
                const batchSize = 1000;

                // Fetch up to 5000 calls for lifetime view (adjust if needed)
                let batchedFetched = 0;
                while (hasMoreVapi && batchedFetched < 5) {
                    let vapiListUrl = `https://api.vapi.ai/call?limit=${batchSize}`;
                    if (lastCreatedAt) {
                        // Vapi uses createdAtLe for pagination moving backwards
                        vapiListUrl += `&createdAtLe=${lastCreatedAt}`;
                    }

                    const vapiRes = await fetch(vapiListUrl, {
                        headers: { 'Authorization': `Bearer ${vapiPrivKey}`, 'Content-Type': 'application/json' }
                    });

                    if (!vapiRes.ok) break;
                    const vapiListData = await vapiRes.json();
                    const list = Array.isArray(vapiListData) ? vapiListData : (vapiListData.data || []);

                    if (list.length === 0) break;

                    // Filter out duplicates if any
                    const newList = list.filter((c: any) => !allVapiCalls.find((existing: any) => existing.id === c.id));
                    if (newList.length === 0) break;

                    allVapiCalls = [...allVapiCalls, ...newList];

                    // Update cursor: use the createdAt of the last item minus 1ms to get older items
                    const oldestCall = list[list.length - 1];
                    lastCreatedAt = oldestCall.createdAt;

                    if (list.length < batchSize) hasMoreVapi = false;
                    batchedFetched++;
                }

                vapiNormalized = allVapiCalls.map((vc: any) => {
                    const isInbound = vc.type === 'inbound';
                    const customer = vc.customer || {};
                    const phoneRaw = cleanPhoneNumber(customer.number);
                    const durationPref = vc.durationSeconds ?? vc.duration ?? 0;
                    if (!vc.startedAt) return null;
                    const startedAt = vc.startedAt;
                    const endedAt = vc.endedAt;

                    let safeDuration = durationPref;
                    if (safeDuration === 0 && endedAt && startedAt) {
                        safeDuration = (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000;
                    }

                    const rateEntry: any = getRateInfo(phoneRaw);
                    const agentCost = vc.cost || 0;

                    const assistantNumRaw = vc.phoneNumber?.number || vapiPhoneCache.get(vc.phoneNumberId) || vc.phoneNumberId || vc.phoneCallProviderId || "Unknown";
                    let vapiAssistantNum = cleanPhoneNumber(assistantNumRaw);

                    if (vapiAssistantNum === "Unknown" && (vc.phoneNumberId || vc.phoneCallProviderId)) {
                        vapiAssistantNum = "Internal-Line";
                    }

                    const vapiTimeKey = `${phoneRaw}_${vapiAssistantNum}_${new Date(startedAt).getTime().toString().substring(0, 7)}`;
                    const twMatched = twilioLookup.get(vapiTimeKey);

                    let vapiTelephonyCost = 0;
                    if (twMatched) {
                        vapiTelephonyCost = Math.abs(parseFloat(twMatched.price || 0));
                        if (isNaN(vapiTelephonyCost)) vapiTelephonyCost = 0;
                    }

                    // Always calculate fallback if we don't have a Twilio match
                    if (vapiTelephonyCost === 0) {
                        vapiTelephonyCost = calculateTelephonyCost(safeDuration, phoneRaw, isInbound, vapiAssistantNum);
                    }

                    // Sum both Vapi's reported cost and our calculated telephony cost
                    // Vapi (Platform/AI) + Telephony (Carrier) = Total Unified Cost
                    const vapiTotalCost = agentCost + vapiTelephonyCost;

                    let vapiName = customer.name || "Guest";
                    if (vapiName === "Guest" || !vapiName || (vapiName && /^\d+$/.test(vapiName.replace(/\D/g, '')) && vapiName.length > 5)) {
                        const metadata = vc.metadata || {};
                        const overrides = vc.assistantOverrides?.variableValues || {};
                        vapiName = metadata.customerName || metadata.name || overrides.customerName || overrides.name || "Guest";
                    }

                    const resolvedFromLead = leadsCache.get(phoneRaw);
                    if (resolvedFromLead) {
                        vapiName = resolvedFromLead.name || vapiName;
                        (vc as any).leadStatus = resolvedFromLead.status;
                    }

                    if (vapiName && /^\d+$/.test(vapiName.replace(/\D/g, '')) && vapiName.length > 5) {
                        vapiName = "Guest";
                    }

                    // --- Extract Vapi Structured Output (Call Summary) ---
                    // Vapi stores structured outputs as an object keyed by UUID:
                    // { "<uuid>": { name: "Call Summary", result: "..text.." } }
                    let callSummary = "";
                    const structuredData = vc.analysis?.structuredData || {};
                    for (const key of Object.keys(structuredData)) {
                        const entry = structuredData[key];
                        if (entry && (entry.name === "Call Summary" || entry.name?.toLowerCase().includes("summary"))) {
                            callSummary = entry.result || entry.value || "";
                            break;
                        }
                    }
                    // Also try top-level analysis.summary as fallback
                    if (!callSummary) {
                        callSummary = vc.analysis?.summary || "";
                    }

                    return {
                        id: vc.id,
                        name: vapiName,
                        startedAt: startedAt,
                        durationSeconds: safeDuration,
                        cost: vapiTotalCost > 0 ? `$${vapiTotalCost.toFixed(3)}` : "$0.00",
                        costValue: vapiTotalCost,
                        breakdown: {
                            agent: agentCost,
                            telephony: vapiTelephonyCost,
                            total: vapiTotalCost
                        },
                        type: isInbound ? "Inbound" : "Outbound",
                        isInbound,
                        phone: phoneRaw !== "Unknown" ? `+${phoneRaw}` : "Unknown",
                        country: rateEntry?.Country || "Unknown",
                        source: 'vapi',
                        status: vc.status === 'completed' ? 'answered' : (vc.status || 'answered'),
                        phoneNumber: vapiAssistantNum,
                        customer_number: phoneRaw !== "Unknown" ? `+${phoneRaw}` : "Unknown",
                        // Funnel fields surfaced from Vapi analysis
                        callSummary,
                        successEvaluation: vc.analysis?.successEvaluation,
                        llmIntent: evalCache.get(vc.id) || null,
                        leadStatus: (vc as any).leadStatus || null,
                        endedReason: vc.endedReason || null,
                        raw: vc
                    };
                }).filter(Boolean);
            }
        } catch (e) {
            console.error("Vapi aggregation fail:", e);
        }



        // --- 3. Final Aggregation ---
        const final = [...vapiNormalized].sort((a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );

        return NextResponse.json(final);

    } catch (globalErr) {
        console.error("Global calls API error:", globalErr);
        return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
    }
}
