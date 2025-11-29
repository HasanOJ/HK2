import { CONFIG } from 'src/global-config';

import { FormWizardView } from 'src/sections/_examples/extra/form-wizard-view';

// ----------------------------------------------------------------------

const metadata = { title: `Form wizard | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FormWizardView />
    </>
  );
}
