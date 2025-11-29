import { CONFIG } from 'src/global-config';

import { AutocompleteView } from 'src/sections/_examples/mui/autocomplete-view';

// ----------------------------------------------------------------------

const metadata = { title: `Autocomplete | MUI - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <title>{metadata.title}</title>

      <AutocompleteView />
    </>
  );
}
