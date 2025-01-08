import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://riozprysdzfxbenklcij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpb3pwcnlzZHpmeGJlbmtsY2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQyNDY2NDgsImV4cCI6MjAzOTgyMjY0OH0.IZ4A6rtmfFkOkY6E3o6MSNG7Uu9dU-oVXmC68jmaSBo';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    headers: {
      'Accept': 'application/json',
    },
  });

