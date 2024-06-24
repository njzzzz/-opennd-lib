import { sep } from 'node:path'
import { defineConfig } from 'vitepress'
import { globSync } from 'glob'

function genNavAndSidebar() {
  const pages = globSync('./docs/pages/*/**.md')
  return pages.reduce(
    (navAndSidebar, path) => {
      const [_0, _1, text, link] = path.split(sep)
      const _link = link.replace('.md', '')
      if (_link.startsWith('lib.'))
        return navAndSidebar
      // nav 只要第一层
      navAndSidebar.nav[text] = navAndSidebar.nav[text]
        ? navAndSidebar.nav[text]
        : _link
      // sidebar要所有层
      navAndSidebar.sidebar[text] = navAndSidebar.sidebar[text]
        ? [...navAndSidebar.sidebar[text], _link]
        : [_link]
      return navAndSidebar
    },
    { nav: {}, sidebar: {} },
  )
}

const navAndSidebar = genNavAndSidebar()

function genLink(text, name) {
  return `/pages/${text}/${name}`
}
// https://vitepress.dev/reference/site-config
export default defineConfig({
  markdown: {
    attrs: { disable: true },
  },
  title: 'Node Library',
  description: 'Node 常用工具函数合集',
  /* prettier-ignore */
  head: [
    ['link', { rel: 'icon', type: 'image/webp', href: '/logo.svg' }],
  ],
  themeConfig: {
    logo: { src: '/logo.svg', width: 24, height: 24 },

    // https://vitepress.dev/reference/default-theme-config
    nav: Object.keys(navAndSidebar.nav)
      .reverse()
      .map((text) => {
        return {
          text,
          link: genLink(text, navAndSidebar.nav[text]),
        }
      }),

    search: {
      provider: 'local',
    },

    sidebar: Object.keys(navAndSidebar.sidebar)
      .reverse()
      .map((text) => {
        return {
          text,
          collapsed: false,
          items: navAndSidebar.sidebar[text].map((name) => {
            return { text: name, link: genLink(text, name) }
          }),
        }
      }),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/njzzzz/-opennd-lib' },
    ],
  },
})
