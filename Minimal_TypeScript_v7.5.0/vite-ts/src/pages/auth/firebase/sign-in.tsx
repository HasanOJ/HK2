import { CONFIG } from 'src/global-config';

import { FirebaseSignInView } from 'src/auth/view/firebase';

// ----------------------------------------------------------------------

const metadata = { title: `Sign in | Firebase - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FirebaseSignInView />
    </>
  );
}
