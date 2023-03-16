// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Matchboxscope Documentation',
  tagline: 'The smallest and cheapest microscope you can find!',
  url: 'https://matchboxscope.github.io',
  baseUrl: '/',
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Matchboxscope', // Usually your GitHub org/user name.
  projectName: 'Matchboxscope Documentation', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          exclude: ['**/any/dir/**'],
        },
        blog: {
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Matchboxscope Documentation',
        logo: {
          alt: 'openUC2 Logo',
          src: 'img/Artboard4@4x.png',
        },
        items: [
          {
            type: 'doc',
            docId: 'intro',
            position: 'left',
            label: 'Tutorial',
          },
          {to: '/blog', label: 'Software', position: 'left'},
          {
            href: 'https://github.com/matchboxscope/',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Tutorial',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Discourse',
                href: 'https://openuc2.com',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/beniroquai',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Software',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/matchboxscope/',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Matchboxscope Developers.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
