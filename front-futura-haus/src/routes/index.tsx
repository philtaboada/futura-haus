import { useRoutes } from 'react-router';
import { routes } from './route';

export const AppRoutes = () => {
  return useRoutes(routes);
};

