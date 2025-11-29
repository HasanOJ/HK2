import { CONFIG } from 'src/global-config';

import { SupabaseSignUpView } from 'src/auth/view/supabase';

// ----------------------------------------------------------------------

const metadata = { title: `Sign up | Supabase - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SupabaseSignUpView />
    </>
  );
}
