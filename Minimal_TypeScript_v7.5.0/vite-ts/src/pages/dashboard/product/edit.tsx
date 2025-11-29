import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { useGetProduct } from 'src/actions/product';

import { ProductEditView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Product edit | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const { product } = useGetProduct(id);

  return (
    <>
      <title>{metadata.title}</title>

      <ProductEditView product={product} />
    </>
  );
}
