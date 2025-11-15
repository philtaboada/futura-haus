import { type RouteObject } from 'react-router';
import Home from '../pages/Home';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import Products from '../pages/Products';
import Customers from '../pages/Customers';
import { ProtectedRoute } from '../components/ProtectedRoute';
import Orders from '../pages/Orders';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/products',
    element: (
      <ProtectedRoute>
        <Products />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <ProtectedRoute>
        <Customers />
      </ProtectedRoute>
    ),
  },
  {
    path: '/orders',
    element: (
      <ProtectedRoute>
        <Orders />
      </ProtectedRoute>
    ),
  },
];

