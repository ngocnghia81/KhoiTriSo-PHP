// Temporarily disabled i18n middleware to fix routing issues
// TODO: Re-enable after restructuring app directory with [locale] folders

// import createMiddleware from 'next-intl/middleware';
// import {routing} from './i18n/routing';
 
// export default createMiddleware(routing);

import { NextResponse } from 'next/server';

export function middleware() {
  return NextResponse.next();
}
 
export const config = {
  // Match all pathnames except static files and api routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
