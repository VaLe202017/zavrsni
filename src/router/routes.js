const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/main' },
      { path: '/dashboard', component: () => import('pages/UserDashboardPage.vue') },
      { path: '/artikli', component: () => import('pages/ItemsPage.vue') },
      { path: '/kosarica', component: () => import('pages/KošaricaPage.vue') },
    ],
  },
  {
    path: '/main',
    component: () => import('layouts/IndexPageLayout.vue'),
    children: [
      { path: '/main', component: () => import('pages/IndexPage.vue') },
      { path: '/main/login', component: () => import('pages/LoginPage.vue') },
      { path: '/main/register', component: () => import('pages/RegisterPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
