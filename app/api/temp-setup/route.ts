import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth-utils';

export async function GET() {
    try {
        const users = [
            { email: 'akarshrarora@gmail.com', password: 'Asquared@123', full_name: 'Akarsh Arora' },
            { email: 'info@scalepods.co', password: 'ScalePods@123', full_name: 'ScalePods Admin' }
        ];

        const results = [];

        for (const u of users) {
            console.log(`Updating user: ${u.email}...`);
            const password_hash = await hashPassword(u.password);

            const { data, error } = await supabaseAdmin
                .from('users')
                .upsert({ 
                    email: u.email, 
                    password_hash, 
                    full_name: u.full_name
                }, { onConflict: 'email' });

            if (error) {
                results.push({ email: u.email, status: 'error', error });
            } else {
                results.push({ email: u.email, status: 'success' });
            }
        }

        return NextResponse.json({ results });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
