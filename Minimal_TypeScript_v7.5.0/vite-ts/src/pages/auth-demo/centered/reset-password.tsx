import { CONFIG } from 'src/global-config';

import { CenteredResetPasswordView } from 'src/auth/view/auth-demo/centered';

// ----------------------------------------------------------------------

const metadata = { title: `Reset password | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CenteredResetPasswordView />
    </>
  );
}
