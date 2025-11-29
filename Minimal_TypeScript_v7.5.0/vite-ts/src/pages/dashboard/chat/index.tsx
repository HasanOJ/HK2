import { CONFIG } from 'src/global-config';

import { ChatView } from 'src/sections/chat/view';

// ----------------------------------------------------------------------

const metadata = { title: `Chat | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <ChatView />
    </>
  );
}
