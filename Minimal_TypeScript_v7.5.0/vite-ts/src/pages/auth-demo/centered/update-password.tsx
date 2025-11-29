import { CONFIG } from 'src/global-config';

import { CenteredUpdatePasswordView } from 'src/auth/view/auth-demo/centered';

// ----------------------------------------------------------------------

const metadata = { title: `Update password | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CenteredUpdatePasswordView />
    </>
  );
}
