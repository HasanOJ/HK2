import { CONFIG } from 'src/global-config';

import { FirebaseSignUpView } from 'src/auth/view/firebase';

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Firebase - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FirebaseSignUpView />
    </>
  );
}
