import { CONFIG } from 'src/global-config';

import { SplitResetPasswordView } from 'src/auth/view/auth-demo/split';

// ----------------------------------------------------------------------

const metadata = { title: `Reset password | Layout split - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SplitResetPasswordView />
    </>
  );
}
