import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

async function updateCredentials() {
    const users = [
        { email: 'akarshrarora@gmail.com', password: 'Asquared@123', full_name: 'Akarsh Arora' },
        { email: 'info@scalepods.co', password: 'ScalePods@123', full_name: 'ScalePods Admin' }
    ];

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
            console.error(`Error updating ${u.email}:`, error);
        } else {
            console.log(`Successfully updated ${u.email}`);
        }
    }
}

updateCredentials();
