import { Outlet, Route, Routes } from 'react-router';
import { Header } from './components/Header/Header';
import { CategoryPage } from './modules/category/CategoryPage';
import { HomePage } from './modules/home/HomePage';
import { NotFoundPage } from './modules/not-found/NotFoundPage';
import { ProductPage } from './modules/product/ProductPage';

function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
    </>
  );
}

/** Every route is declared here by hand. File names never create routes. */
export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
