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
      { text: 'C++学习', link: '/cpp/intro' },
      { text: 'C++八股', link: '/morecpp/morecpp_01' },
      { text: 'C++多线程', link: '/cpp_multithreading/01basement' },
      { text: 'Hot100', link: '/hot100/questions1' },
      { text: '计算机图形学', link: '/graphics/games101_1' },
      { text: 'OpenGL', link: '/opengl/opengl_1' },
      { text: '图书馆', link: '/library/' },
      { text: '面试', link: '/interview/some_byhands' }
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
            { text: '处理数据', link: '/cpp/data' },
            { text: '函数', link: '/cpp/function' },
            { text: '深入函数', link: '/cpp/deepfunction' },
            { text: '命名空间', link: '/cpp/namespace' },
            { text: '类与对象', link: '/cpp/class' },
            { text: '类和动态内存', link: '/cpp/memory' },
            { text: '类继承', link: '/cpp/inheritance' },
            { text: '代码重用与模板', link: '/cpp/reusing' },
            { text: '友元和异常', link: '/cpp/friend' },
            { text: 'STL', link: '/cpp/stringSTL'},
            { text: 'C++11', link: '/cpp/C++new'}
          ]
        },
        {
          text: 'C++多线程',
          collapsed: false,
          items: [
            { text: '基础', link: '/cpp_multithreading/01basement' },
            { text: '线程同步', link: '/cpp_multithreading/02synchronization' },
            { text: '死锁与锁管理, link', link: '/cpp_multithreading/03deadlock' },
            { text: '异步编程', link: '/cpp_multithreading/04asynchronous' },
            { text: '条件变量', link: '/cpp_multithreading/05condition_variable' },
            { text: '原子操作', link: '/cpp_multithreading/06atomic' },
            { text: 'C++20新特性', link: '/cpp_multithreading/07C++20' }
          ]
        }
      ],
      '/interview/': [
        {
          text: '面试',
          collapsed: false,
          items: [
            { text: '一些手撕', link: '/interview/some_byhands' },
            { text: '单例模式', link: '/interview/singleton' }
          ]
        }
      ],
      '/morecpp/': [
        {
          text: 'C++八股',
          collapsed: false,
          items: [
            { text: '基础补充', link: '/morecpp/morecpp_01' },
            { text: '类和对象', link: '/morecpp/morecpp_02' },
            { text: '内存管理', link: '/morecpp/morecpp_03' },
            { text: '模板编程', link: '/morecpp/morecpp_04' },
            { text: "继承", link: '/morecpp/morecpp_06' },
            { text: '多态', link: '/morecpp/morecpp_07' },
            { text: 'C++11', link: '/morecpp/morecpp_08' },
            { text: '异常', link: '/morecpp/morecpp_09' },
            { text: '智能指针', link: '/morecpp/morecpp_10' },
            { text: '特殊类设计', link: '/morecpp/morecpp_11' },
            { text: 'C++类型转换', link: '/morecpp/morecpp_12' },
            { text: 'STL', link: '/morecpp/morecpp_13' }
          ]
        }
      ],


      '/cpp_multithreading/': [
        {
          text: 'C++多线程',
          collapsed: false,
          items: [
            { text: '基础', link: '/cpp_multithreading/01basement' },
            { text: '线程同步', link: '/cpp_multithreading/02synchronization' },
            { text: '死锁与锁管理', link: '/cpp_multithreading/03deadlock' },
            { text: '异步编程', link: '/cpp_multithreading/04asynchronous' },
            { text: '条件变量', link: '/cpp_multithreading/05condition_variable' },
            { text: '原子操作', link: '/cpp_multithreading/06atomic' },
            { text: 'C++20新特性', link: '/cpp_multithreading/07C++20' },
            { text: '线程池', link: '/cpp_multithreading/08threadpool' }
          ]
        }
      ],
      '/graphics/': [
        {
          text: '计算机图形学',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/graphics/games101_1' },
            { text: 'Review of Linear Algebra', link: '/graphics/games101_2' },
            { text: 'Transformations', link: '/graphics/games101_3' },
            { text: 'Transformations2', link: '/graphics/games101_4' },
            { text: 'Rasterization', link: '/graphics/games101_5' },
            { text: 'Rasterization2', link: '/graphics/games101_6' },
            { text: 'Shading', link: '/graphics/games101_7' },
            { text: 'Shading2', link: '/graphics/games101_8' },
            { text: 'Geometry1', link: '/graphics/games101_9' },
            { text: 'Geometry2', link: '/graphics/games101_10' },
            { text: 'Geometry3', link: '/graphics/games101_11' },
            { text: 'Ray Tracing1', link: '/graphics/games101_12' },
            { text: 'Ray Tracing2', link: '/graphics/games101_13' },
            { text: 'Ray Tracing3', link: '/graphics/games101_14' },
            { text: 'Ray Tracing4', link: '/graphics/games101_15' }
          ]
        }
      ],

      '/hot100/': [
        {
          text: '刷算法题',
          items: [
            { text: '哈希', link: '/hot100/questions1' },
            { text: '双指针', link: '/hot100/questions2' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/studycg' }
    ]
  }
})