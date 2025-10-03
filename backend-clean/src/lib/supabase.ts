import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create supabase client only if environment variables are available
export const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null
}

// Log Supabase status
if (supabase) {
  console.log('✅ Supabase client initialized')
} else {
  console.log('⚠️  Supabase not configured - running without database features')
}