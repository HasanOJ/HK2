import { CONFIG } from 'src/global-config';

import { BlankView } from 'src/sections/blank/view';

// ----------------------------------------------------------------------

const metadata = {
  title: `Item match params | Dashboard - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <BlankView
        title="Match params"
        description="Active on matching path with dynamic parameters."
      />
    </>
  );
}
