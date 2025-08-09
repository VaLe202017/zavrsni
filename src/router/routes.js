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
  {
    path: '/admin',
    component: () => import('layouts/AdminLayout.vue'),
    children: [
      { path: '/admin/', component: () => import('pages/admin/AdminDashboardPage.vue') },
      { path: '/admin/korisnik', component: () => import('pages/admin/AdminKorisniciPage.vue') },
      { path: '/admin/artikl', component: () => import('pages/admin/AdminArtikliPage.vue') },
      {
        path: '/admin/tip_artikla',
        component: () => import('pages/admin/AdminTipoviArtiklaPage.vue'),
      },
      { path: '/admin/lokacija', component: () => import('pages/admin/AdminLokacijaPage.vue') },
      { path: '/admin/narudzba', component: () => import('pages/admin/AdminNarudzbePage.vue') },
      { path: '/admin/uplata', component: () => import('pages/admin/AdminUplatePage.vue') },
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
