import { CONFIG } from 'src/global-config';

import { AccordionView } from 'src/sections/_examples/mui/accordion-view';

// ----------------------------------------------------------------------

const metadata = { title: `Accordion | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AccordionView />
    </>
  );
}
