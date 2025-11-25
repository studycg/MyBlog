import { defineConfig } from 'vitepress'
import mathjax3 from 'markdown-it-mathjax3'

export default defineConfig({
  title: "我的知识库",
  description: "C++ 与几何建模笔记",
  
  // 【新增】显示最后更新时间
  lastUpdated: true,

  markdown: {
    config: (md) => {
      md.use(mathjax3)
    }
  },

  themeConfig: {
    // 【新增】1. 开启本地搜索
    // 这样页面左上角会出现搜索框，支持快捷键呼出
    search: {
      provider: 'local' 
    },

    // 【新增】2. 界面汉化（把默认的英文提示改成中文）
    outline: {
      level: [1,6], // 显示一级到六级标题 'deep'为显示二到六级
      label: '目录', // 原本是 "On this page"
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    lastUpdatedText: '最后更新于',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',

    // 3. 顶部导航栏 (根据你的兴趣规划)
    nav: [
      { text: '首页', link: '/' },
      // 我们可以按你的技术栈把知识库分为几大块
      { text: 'C++与建模', link: '/cpp/intro' },
      { text: '计算机图形学', link: '/graphics/games101_1' },
      { text: 'Python可视化', link: '/python/intro' },
      { text: '杂谈', link: '/misc/intro' }
    ],

    aside: true, // 显示右侧边栏
    
    // 4. 多侧边栏配置 (核心功能)
    // 这种写法能让左侧菜单根据你所在的顶部栏自动切换
    sidebar: {
      // 当路径包含 /cpp/ 时，显示这个菜单
      '/cpp/': [
        {
          text: 'C++ 基础',
          collapsed: false,
          items: [
            { text: '简介', link: '/cpp/intro' },
            { text: '命名空间', link: '/cpp/namespace' },
            { text: '类与对象', link: '/cpp/class' }
          ]
        },
        {
          text: 'C++面向对象',
          collapsed: false,
          items: [
            { text: '类和对象', link: '/cpp/class' },
            { text: '多态与继承', link: '/cpp/inheritance' }
          ]
        }
      ],

      '/graphics/': [
        {
          text: '计算机图形学',
          collapsed: false,
          items: [
            { text: 'GAMES101第一课', link: '/graphics/games101_1' },
            { text: 'GAMES101第二课', link: '/graphics/games101_2' }
          ]
        }
      ],

      // 当路径包含 /python/ 时，显示这个菜单
      '/python/': [
        {
          text: '数据可视化',
          items: [
            { text: 'Matplotlib 基础', link: '/python/intro' },
            { text: 'Plotly 交互图表', link: '/python/plotly' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/studycg' }
    ]
  }
})