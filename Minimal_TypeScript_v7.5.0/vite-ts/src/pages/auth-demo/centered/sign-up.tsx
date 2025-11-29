import { CONFIG } from 'src/global-config';

import { CenteredSignUpView } from 'src/auth/view/auth-demo/centered';

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Layout centered - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <CenteredSignUpView />
    </>
  );
}
