import { NextResponse } from 'next/server';

// Liste des routes protégées (accessibles aux utilisateurs connectés)
const protectedRoutes = ['/Dashboard', '/Employes', '/Departements', '/Zones', '/Appareils', '/Change-password', '/Conge', '/Etat-ponctualite', '/Planning', '/Postes', '/Rapports', '/Retard', '/Settings'];

// Routes accessibles uniquement aux administrateurs
const adminOnlyRoutes = ['/Companies', '/Users'];

// Routes publiques (accessibles sans être connecté)
const publicRoutes = ['/', '/login', '/Forget-password', '/api'];

export function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Vérifier si l'URL est une route protégée ou réservée aux admins
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isAdminRoute = adminOnlyRoutes.some(route => path.startsWith(route));
  
  // Si ce n'est ni une route protégée ni une route admin, continuer normalement
  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Vérifier si l'utilisateur est connecté
  const userCookie = request.cookies.get('user');
  const userRoleCookie = request.cookies.get('userRole');
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!userCookie || !userRoleCookie) {
    // Rediriger vers la page de connexion avec un paramètre indiquant que la session a expiré
    return NextResponse.redirect(new URL('/?expired=true', request.url));
  }
  
  // Pour les routes admin, vérifier le rôle de l'utilisateur
  if (isAdminRoute && userRoleCookie.value !== 'admin') {
    // Rediriger vers une page d'accès refusé ou le tableau de bord
    return NextResponse.redirect(new URL('/Dashboard', request.url));
  }

  // Si tout est en ordre, continuer normalement
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
};