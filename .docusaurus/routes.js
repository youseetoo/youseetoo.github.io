import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog',
    component: ComponentCreator('/blog', '080'),
    exact: true
  },
  {
    path: '/blog/archive',
    component: ComponentCreator('/blog/archive', '2a2'),
    exact: true
  },
  {
    path: '/blog/Flashing',
    component: ComponentCreator('/blog/Flashing', 'dd3'),
    exact: true
  },
  {
    path: '/blog/tags',
    component: ComponentCreator('/blog/tags', '4e8'),
    exact: true
  },
  {
    path: '/blog/tags/esp-32-cam',
    component: ComponentCreator('/blog/tags/esp-32-cam', '5f6'),
    exact: true
  },
  {
    path: '/blog/tags/web-serial',
    component: ComponentCreator('/blog/tags/web-serial', 'a41'),
    exact: true
  },
  {
    path: '/markdown-page',
    component: ComponentCreator('/markdown-page', '20b'),
    exact: true
  },
  {
    path: '/docs',
    component: ComponentCreator('/docs', '11e'),
    routes: [
      {
        path: '/docs/Anglerfish',
        component: ComponentCreator('/docs/Anglerfish', '9c9'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/ESPectrometer',
        component: ComponentCreator('/docs/ESPectrometer', 'ef2'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/FlashTheCode',
        component: ComponentCreator('/docs/FlashTheCode', '74f'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/Fluidiscope',
        component: ComponentCreator('/docs/Fluidiscope', '302'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/intro',
        component: ComponentCreator('/docs/intro', 'aed'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/Matchboxscope',
        component: ComponentCreator('/docs/Matchboxscope', 'dc8'),
        exact: true,
        sidebar: "tutorialSidebar"
      },
      {
        path: '/docs/WebSERIAL',
        component: ComponentCreator('/docs/WebSERIAL', 'e42'),
        exact: true,
        sidebar: "tutorialSidebar"
      }
    ]
  },
  {
    path: '/',
    component: ComponentCreator('/', '1ed'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
