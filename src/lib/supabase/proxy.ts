import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { allowRequest, clientAddress } from "@/lib/rate-limit";
import { getSupabaseEnv } from "./env";

const PUBLIC_PATHS = new Set(["/login", "/auth/callback"]);
const TOKEN_API = new Set(["/api/gastos", "/api/categorias"]);

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname);
}

function isApi(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
}

function unauthorized(from?: NextResponse) {
  const response = NextResponse.json(
    { error: "No autorizado." },
    { status: 401, headers: { "cache-control": "no-store" } }
  );
  if (from) copyCookies(from, response);
  return response;
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const preview = process.env.NEXT_PUBLIC_SHAPE_PREVIEW === "1";

  if (pathname === "/auth/callback" || pathname === "/login") {
    const allowed = allowRequest(`auth:${clientAddress(request)}`, 40, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Esperá un momento." },
        { status: 429, headers: { "cache-control": "no-store", "retry-after": "60" } }
      );
    }
  }

  // El atajo autentica con bearer. La ruta valida el token y escribe solo en SHAPE_OWNER_USER_ID.
  if (TOKEN_API.has(pathname)) {
    return NextResponse.next();
  }

  const env = getSupabaseEnv();
  if (!env) {
    if (isApi(pathname)) return unauthorized();
    if (preview || isPublicPath(pathname)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  let user: { id: string } | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    user = null;
  }

  if (!user && isApi(pathname)) return unauthorized(supabaseResponse);

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirect = NextResponse.redirect(url);
    copyCookies(supabaseResponse, redirect);
    return redirect;
  }

  return supabaseResponse;
}
