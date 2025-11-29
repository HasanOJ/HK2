import { CONFIG } from 'src/global-config';

import { FirebaseResetPasswordView } from 'src/auth/view/firebase';

// ----------------------------------------------------------------------

const metadata = { title: `Reset password | Firebase - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FirebaseResetPasswordView />
    </>
  );
}
