import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async () => {
  let locale = 'en';

  if (process.env.NEXT_PUBLIC_CLOUDFLARE_DEPLOY !== 'true') {
    const pkg = ['next', 'headers'].join('/');
    const { headers: getHeaders } = require(pkg);
    const headerList = getHeaders();
    locale = (await headerList).get('x-next-intl-locale') || 'en';
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
