import { CONFIG } from 'src/global-config';

import { FormValidationView } from 'src/sections/_examples/extra/form-validation-view';

// ----------------------------------------------------------------------

const metadata = { title: `Form validation | Components - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <FormValidationView />
    </>
  );
}
