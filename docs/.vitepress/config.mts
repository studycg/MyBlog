import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3' // 用来在 Markdown 中支持 LaTeX 公式

// 这是一个 TypeScript 配置文件
// 哪怕不懂 TS 语法，只修改文字内容也是没问题的
export default defineConfig({
  title: "我的知识库",
  description: "记录 C++ 与编程学习",
  
  // 开启 Markdown 扩展配置
  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },

  // 这里的 themeConfig 就是控制页面长相的核心
  themeConfig: {
    // 1. 顶部导航栏
    nav: [
      { text: '首页', link: '/' },
      { text: 'C++笔记', link: '/cpp/intro' },
      { text: '随笔', link: '/misc/diary' }
    ],

    // 2. 左侧侧边栏 (这里最重要，决定了你的目录结构)
    sidebar: {
      // 当你进入 /cpp/ 目录下的文章时，显示这个侧边栏
      '/cpp/': [
        {
          text: 'C++ 基础篇',
          collapsed: false, // 是否默认折叠
          items: [
            // link 对应的是文件名，不要加 .md 后缀
            { text: '01. 简介', link: '/cpp/intro' },
            { text: '02. 命名空间', link: '/cpp/namespace' } 
          ]
        }
      ]
    },

    // 3. 右侧大纲 (显示 h2-h6 标题)
    outline: {
      level: 'deep',
      label: '本页目录'
    },

    // 社交链接
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ]
  }
})