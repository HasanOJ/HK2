import { CONFIG } from 'src/global-config';
import { useGetProducts } from 'src/actions/product';

import { ProductShopView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

const metadata = { title: `Product shop - ${CONFIG.appName}` };

export default function Page() {
  const { products, productsLoading } = useGetProducts();

  return (
    <>
      <title>{metadata.title}</title>

      <ProductShopView products={products} loading={productsLoading} />
    </>
  );
}
