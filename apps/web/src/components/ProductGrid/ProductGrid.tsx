import type { Product } from '@catalogue/shared';
import { ProductTile } from '../ProductTile/ProductTile';
import styles from './ProductGrid.module.css';

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className={styles.grid}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductTile product={product} />
        </li>
      ))}
    </ul>
  );
}
