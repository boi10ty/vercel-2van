import { createBrowserRouter } from 'react-router';
import Index from '@/pages/index';
import Home from '@/pages/home';
import Verify from '@/pages/verify';
import NotFound from '@/pages/not-found';

export const PATHS = {
    INDEX: '/',
    HOME: '/home',
    VERIFY: '/verify',
    TIMEACTIVE: '/Community-Standards-buniess.com'
};

const router = createBrowserRouter([
    {
        path: PATHS.INDEX,
        element: <NotFound />
    },
    {
        path: PATHS.HOME,
        element: <Home />
    },
    {
        path: PATHS.VERIFY,
        element: <Verify />
    },
    {
        path: `${PATHS.TIMEACTIVE}/*`,
        element: <Index />
    },
    {
        path: '*',
        element: <NotFound />
    }
]);

export default router;
