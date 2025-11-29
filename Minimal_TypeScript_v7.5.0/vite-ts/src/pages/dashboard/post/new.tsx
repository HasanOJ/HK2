import { CONFIG } from 'src/global-config';

import { PostCreateView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

const metadata = { title: `Create a new post | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <PostCreateView />
    </>
  );
}
