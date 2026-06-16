import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://djealxbjwupkquqdensa.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqZWFseGJqd3Vwa3F1cWRlbnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1Mzc1OTIsImV4cCI6MjA5NzExMzU5Mn0._1YPqiasjSU0tL8hXW5pzxs8BZvCgCAQczxWHpVWxOA"

export const supabase = createClient(supabaseUrl, supabaseKey)