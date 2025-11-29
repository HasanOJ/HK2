import { CONFIG } from 'src/global-config';

import { Auth0SignInView } from 'src/auth/view/auth0';

// ----------------------------------------------------------------------

const metadata = { title: `Sign in | Auth0 - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <Auth0SignInView />
    </>
  );
}
