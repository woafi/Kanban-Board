import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip checking static files, next internals, and api requests
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.')
    ) {
        return NextResponse.next();
    }

    const cookieHeader = request.headers.get('cookie') || '';
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    let isAuthenticated = false;
    let userData = null;

    try {
        const response = await fetch(`${backendUrl}/api/auth/check/`, {
            method: "GET",
            headers: {
                "Cookie": cookieHeader,
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });
        if (response.status === 200) {
            const data = await response.json();
            isAuthenticated = true;
            userData = data.user;
        }
    } catch (error) {
        console.error("Auth check in proxy failed:", error);
    }

    if (!isAuthenticated) {
        if (pathname === '/tasks' || pathname === '/annotate' || pathname === '/') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        return NextResponse.next();
    }

    // User is authenticated
    if (pathname === '/' || pathname === '/login') {
        return NextResponse.redirect(new URL('/tasks', request.url));
    }

    // Forward user data downstream to the server components via headers
    const requestHeaders = new Headers(request.headers);
    if (userData) {
        requestHeaders.set('x-user-id', userData.id.toString());
        requestHeaders.set('x-user-email', userData.email);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
