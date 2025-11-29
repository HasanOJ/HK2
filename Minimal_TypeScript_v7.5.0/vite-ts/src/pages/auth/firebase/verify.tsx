import { CONFIG } from 'src/global-config';

import { FirebaseVerifyView } from 'src/auth/view/firebase';

// ----------------------------------------------------------------------

const metadata = { title: `Verify | Firebase - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FirebaseVerifyView />
    </>
  );
}
