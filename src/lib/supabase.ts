import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gyqneffgffrflqjbhbqu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cW5lZmZnZmZyZmxxamJoYnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NTU3MTMsImV4cCI6MjA5MjUzMTcxM30.CY-KYiiWhGwH7Bmg5oiarERW86YzdKAWlIaGDXZ5SkY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
