import type { SourceProduct } from '../../src/ports/ProductSource';

const mens = { slug: 'mens-clothing', name: "Men's Clothing" };
const jewelery = { slug: 'jewelery', name: 'Jewelery' };
const electronics = { slug: 'electronics', name: 'Electronics' };

const p = (
  id: number,
  title: string,
  category: SourceProduct['category'],
  description: string,
) => ({
  id,
  title,
  price: id * 10 + 0.99,
  description,
  category,
  image: `https://images.example.test/${id}.jpg`,
});

/** 8 hand-written products across 3 categories. Tests never hit the network. */
export const testProducts: SourceProduct[] = [
  p(1, 'Classic Backpack', mens, 'Carries a 15 inch laptop.'),
  p(2, 'Slim Fit T-Shirt', mens, 'Soft cotton tee.'),
  p(3, 'Cotton Jacket', mens, 'Warm outerwear for spring.'),
  p(4, 'Gold Bracelet', jewelery, 'Plated with real gold.'),
  p(5, 'Silver Ring', jewelery, 'Sterling silver band.'),
  p(6, 'Portable Hard Drive', electronics, 'Fits in any backpack pocket.'),
  p(7, 'Gaming Monitor', electronics, 'Curved 49 inch display.'),
  p(8, 'SSD Drive', electronics, 'Fast internal storage.'),
];
