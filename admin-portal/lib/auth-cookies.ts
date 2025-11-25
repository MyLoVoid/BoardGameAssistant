import type { Session } from '@supabase/supabase-js';

const ACCESS_COOKIE = 'sb-access-token';
const REFRESH_COOKIE = 'sb-refresh-token';
const ONE_WEEK_IN_SECONDS = 60 * 60 * 24 * 7;

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const cookieSuffix = () => {
  if (!isBrowser()) {
    return '';
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  return `; Path=/; SameSite=Lax${secure}`;
};

export function persistAuthCookies(session: Session) {
  if (!isBrowser()) {
    return;
  }

  const accessMaxAge = session.expires_in ?? 3600;
  document.cookie = `${ACCESS_COOKIE}=${session.access_token}${cookieSuffix()}; Max-Age=${accessMaxAge}`;
  document.cookie = `${REFRESH_COOKIE}=${session.refresh_token}${cookieSuffix()}; Max-Age=${ONE_WEEK_IN_SECONDS}`;
}

export function clearAuthCookies() {
  if (!isBrowser()) {
    return;
  }

  const suffix = cookieSuffix();
  const expires = '; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `${ACCESS_COOKIE}=${suffix}${expires}`;
  document.cookie = `${REFRESH_COOKIE}=${suffix}${expires}`;
}
