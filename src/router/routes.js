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
      { path: '/admin/login', component: () => import('pages/admin/AdminLoginPage.vue') },
    ],
  },
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '/admin/dashboard',
        component: () => import('pages/admin/AdminDashboardPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: '/admin/korisnik',
        component: () => import('pages/admin/AdminKorisniciPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: '/admin/artikl',
        component: () => import('pages/admin/AdminArtikliPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: '/admin/tip_artikla',
        component: () => import('pages/admin/AdminTipoviArtiklaPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: '/admin/lokacija',
        component: () => import('pages/admin/AdminLokacijaPage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: '/admin/narudzba',
        component: () => import('pages/admin/AdminNarudzbePage.vue'),
        meta: { requiresAdmin: true },
      },
      {
        path: '/admin/uplata',
        component: () => import('pages/admin/AdminUplatePage.vue'),
        meta: { requiresAdmin: true },
      },
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
