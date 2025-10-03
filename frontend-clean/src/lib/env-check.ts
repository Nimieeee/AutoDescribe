// Environment configuration check utility
export const isEnvironmentConfigured = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return !!(supabaseUrl && 
           supabaseKey && 
           supabaseUrl !== 'https://placeholder.supabase.co' && 
           supabaseKey !== 'placeholder-key');
};

export const getEnvironmentStatus = () => {
  if (typeof window === 'undefined') {
    // During build time, return configured to allow static generation
    return { configured: true, message: 'Build time - environment check skipped' };
  }
  
  const configured = isEnvironmentConfigured();
  
  if (!configured) {
    return {
      configured: false,
      message: 'Environment variables not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your deployment settings.'
    };
  }
  
  return { configured: true, message: 'Environment configured correctly' };
};