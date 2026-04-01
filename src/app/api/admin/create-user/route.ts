import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrlEnv) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set.");
}

const supabaseUrl = supabaseUrlEnv;

export async function POST(req: NextRequest) {
  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY on server." }, { status: 500 });
  }

  const { full_name, email, password, role, department_id } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create auth user
  const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: role || "faculty" },
  });

  if (createError || !userData?.user?.id) {
    return NextResponse.json({ error: createError?.message || "Unable to create auth user." }, { status: 500 });
  }

  // Ensure the JWT carries role in app_metadata for policies
  const targetRole = role || "faculty";
  const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    app_metadata: { role: targetRole },
  });

  if (metaError) {
    return NextResponse.json({ error: metaError.message }, { status: 500 });
  }

  // Create profile row with the new auth user id
  const { error: profileError } = await supabaseAdmin.from("profiles").insert([
    {
      id: userData.user.id,
      full_name: full_name || null,
      email,
      role: targetRole,
      department_id: department_id || null,
    },
  ]);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId: userData.user.id });
}
