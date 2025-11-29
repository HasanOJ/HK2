import { CONFIG } from 'src/global-config';

import { SupabaseSignInView } from 'src/auth/view/supabase';

// ----------------------------------------------------------------------

const metadata = { title: `Sign in | Supabase - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <SupabaseSignInView />
    </>
  );
}
