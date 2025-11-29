import { CONFIG } from 'src/global-config';

import { KanbanView } from 'src/sections/kanban/view';

// ----------------------------------------------------------------------

const metadata = { title: `Kanban | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <KanbanView />
    </>
  );
}
