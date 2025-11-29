import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/global-config';
import { useGetProduct } from 'src/actions/product';

import { ProductDetailsView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Product details | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  const { id = '' } = useParams();

  const { product, productLoading, productError } = useGetProduct(id);

  return (
    <>
      <title>{metadata.title}</title>

      <ProductDetailsView product={product} loading={productLoading} error={productError} />
    </>
  );
}
