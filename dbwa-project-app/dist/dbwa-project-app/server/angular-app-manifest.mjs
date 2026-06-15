
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 0,
    "route": "/"
  },
  {
    "renderMode": 0,
    "route": "/auth"
  },
  {
    "renderMode": 0,
    "route": "/search"
  },
  {
    "renderMode": 0,
    "route": "/watchlist"
  },
  {
    "renderMode": 0,
    "route": "/profile"
  },
  {
    "renderMode": 0,
    "route": "/user/*"
  },
  {
    "renderMode": 0,
    "route": "/admin/users"
  },
  {
    "renderMode": 0,
    "route": "/impressum"
  },
  {
    "renderMode": 0,
    "route": "/agb"
  },
  {
    "renderMode": 0,
    "route": "/datenschutz"
  },
  {
    "renderMode": 0,
    "route": "/support"
  },
  {
    "renderMode": 0,
    "route": "/details/tv/*/season/*"
  },
  {
    "renderMode": 0,
    "route": "/details/*/*"
  },
  {
    "renderMode": 0,
    "redirectTo": "/movie/details/movie/:id",
    "route": "/movie/*"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 12482, hash: '7515f8622fd28cc9dbf3b09639005c0793ed459b7a94e08b6930ae5688b1ab80', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1577, hash: '07e19b74728a0a426b00807791defe5cc1279079db086c0df86ae96e891002fe', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-7JAOKROW.css': {size: 14584, hash: 'GJDX8HzvnrE', text: () => import('./assets-chunks/styles-7JAOKROW_css.mjs').then(m => m.default)}
  },
};
