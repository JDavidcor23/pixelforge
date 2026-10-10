import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/config/env'

export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey())
