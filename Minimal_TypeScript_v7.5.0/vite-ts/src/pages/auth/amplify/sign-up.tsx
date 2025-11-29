import { CONFIG } from 'src/global-config';

import { AmplifySignUpView } from 'src/auth/view/amplify';

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Amplify - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AmplifySignUpView />
    </>
  );
}
