import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isStudentPage = request.nextUrl.pathname.startsWith("/student");

  // Redirect to login if unauthenticated user tries to access protected routes
  if (!user && (isAdminPage || isStudentPage)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // If user is authenticated
  if (user) {
    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      // We need to know their role to redirect them correctly
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      const role = profile?.role || "student";
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin" : "/student";
      return NextResponse.redirect(url);
    }

    // Role-based protection
    if (isAdminPage || isStudentPage) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
      const role = profile?.role || "student";

      // If a student tries to access admin pages
      if (isAdminPage && role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/student";
        return NextResponse.redirect(url);
      }

      // If an admin tries to access student pages (optional, but good for separation)
      if (isStudentPage && role !== "student") {
         // You might want admins to see student pages, so you could omit this block.
         // But let's keep them separated for now.
         const url = request.nextUrl.clone();
         url.pathname = "/admin";
         return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
