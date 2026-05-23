import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import type { User } from 'firebase/auth';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Customers = React.lazy(() => import('./pages/Customers'));
const Products = React.lazy(() => import('./pages/Products'));
const ProductCategories = React.lazy(() => import('./pages/ProductCategories'));
const Ingredients = React.lazy(() => import('./pages/Ingredients'));
const IngredientCategories = React.lazy(() => import('./pages/IngredientCategories'));
const Supply = React.lazy(() => import('./pages/Supply'));
const Suppliers = React.lazy(() => import('./pages/Suppliers'));
const Contacts = React.lazy(() => import('./pages/Contacts'));
const Billing = React.lazy(() => import('./pages/Billing'));

type AppRouterProps = {
  admin: User;
  onLogout: () => void;
};

export const AppRouter: React.FC<AppRouterProps> = ({ admin, onLogout }) => (
  <Routes>
    <Route element={<AppLayout admin={admin} onLogout={onLogout} />}>
      <Route index element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/products" element={<Products />} />
      <Route path="/product-categories" element={<ProductCategories />} />
      <Route path="/ingredients" element={<Ingredients />} />
      <Route path="/ingredient-categories" element={<IngredientCategories />} />
      <Route path="/supply" element={<Supply />} />
      <Route path="/suppliers" element={<Suppliers />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="/billing" element={<Billing />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>
);
