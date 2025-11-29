import { useParams } from 'src/routes/hooks';

import { _tours } from 'src/_mock/_tour';
import { CONFIG } from 'src/global-config';

import { TourDetailsView } from 'src/sections/tour/view';

// ----------------------------------------------------------------------

const metadata = { title: `Tour details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const currentTour = _tours.find((tour) => tour.id === id);

  return (
    <>
      <title>{metadata.title}</title>

      <TourDetailsView tour={currentTour} />
    </>
  );
}
