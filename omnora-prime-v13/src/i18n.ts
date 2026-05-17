import {getRequestConfig} from 'next-intl/server';
import {headers} from 'next/headers';

export default getRequestConfig(async () => {
  // Use the 'NOXIS_LOCALE' cookie or header to determine the locale
  // In a cookie-based approach without URL prefixes, we read from headers
  const headerList = headers();
  const locale = (await headerList).get('x-next-intl-locale') || 'en';

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
