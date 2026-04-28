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
      { text: 'C++基础', link: '/cpp/intro' },
      { text: 'C++进阶', link: '/morecpp/morecpp_01' },
      { text: 'C++多线程', link: '/cpp_multithreading/basement' },
      // { text: 'C#', link: '/csharp/csharp_00' },
      { text: '408复习', link: '/408_review/CN_01' },
      { text: 'Hot100', link: '/hot100/questions1' },
      { text: '计算机图形学', link: '/graphics/games101_1' },
      { text: 'Unity', link: '/unity/Summary' },
      { text: '其它疑问', link: '/other/random_algorithm' },
      // { text: 'OpenGL', link: '/opengl/opengl_1' },
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
            { text: '简历相关问题', link: '/interview/resume' },
            { text: '手撕智能指针', link: '/interview/some_byhands' },
            { text: '单例模式', link: '/interview/singleton' },
            { text: '性能统计脚本', link : '/interview/frida' },
            { text: 'Agent', link: '/interview/agent' },
            { text: '面试被问过的问题', link: '/interview/questions' },
          ]
        }
      ],
      '/morecpp/': [
        {
          text: 'C++八股',
          collapsed: false,
          items: [
            { text: '基础补充', link: '/morecpp/morecpp_01' },
            { text: 'static总结', link: '/morecpp/static' },
            { text: 'const总结', link: '/morecpp/const' },
            { text: '类和对象', link: '/morecpp/morecpp_02' },
            { text: '内存管理', link: '/morecpp/morecpp_03' },
            { text: '模板编程', link: '/morecpp/morecpp_04' },
            { text: "继承", link: '/morecpp/morecpp_06' },
            { text: '多态', link: '/morecpp/morecpp_07' },
            // { text: 'C++11', link: '/morecpp/morecpp_08' },
            { text: '异常', link: '/morecpp/morecpp_08' },
            { text: '智能指针', link: '/morecpp/morecpp_10' },
            { text: '特殊类设计', link: '/morecpp/morecpp_11' },
            { text: 'C++类型转换', link: '/morecpp/morecpp_12' },
            // { text: 'STL', link: '/morecpp/morecpp_13' }
          ]
        },
        {
            text: 'C++11详细',
            collapsed: false,
            items: [
              { text: '入门基础', link: '/morecpp/cpp11_01' },
              { text: '右值引用和移动语义', link: '/morecpp/cpp11_02' },
              { text: '类的新功能', link: '/morecpp/cpp11_03' },
              { text: '可变参数模板', link: '/morecpp/cpp11_04' }, 
              { text: 'lambda表达式', link: '/morecpp/cpp11_05' },
              { text: '包装器', link: '/morecpp/cpp11_06' },
              { text: '线程库', link: '/morecpp/cpp11_07' }
            ]
        },
        {
          text:"STL详细",
          collapsed: false,
          items: [
            { text: 'string', link: '/morecpp/stl_00' },
            { text: 'vector', link: '/morecpp/stl_01' },
            { text: 'list', link: '/morecpp/stl_02' },
            { text: 'stack和queue', link: '/morecpp/stl_03' },
            { text: 'priority_queue', link: '/morecpp/stl_04' },
            { text: 'set和map', link: '/morecpp/stl_05' },
            { text: 'unordered_map和unordered_set', link: '/morecpp/stl_06' },
            { text: 'bitset', link: '/morecpp/stl_07' },
            { text: 'deque', link: '/morecpp/stl_08' },
            { text: 'emplace/allocator', link: '/morecpp/stl_09' }
          ]
        },        
        {
          text: '其它知识',
          collapsed: false,
          items: [
            { text: '预处理编译汇编链接过程', link: '/morecpp/other_01' },
            { text: '手撕STL', link: '/morecpp/other_02' },

          ]
        }
      ],
      '/cpp_multithreading/': [
        {
          text: 'C++多线程',
          collapsed: false,
          items: [
            { text: '基础', link: '/cpp_multithreading/basement' },
            { text: '线程同步', link: '/cpp_multithreading/synchronization' },
            { text: '条件变量', link: '/cpp_multithreading/condition_variable' },
            { text: '信号量', link: '/cpp_multithreading/semaphore' }, 
            { text: '原子操作', link: '/cpp_multithreading/atomic' },
            { text: '协程', link: '/cpp_multithreading/coroutine' },
            { text: '异步编程', link: '/cpp_multithreading/asynchronous'},
            { text: '线程池', link: '/cpp_multithreading/threadpool' }
          ]
        }
      ],
      '/graphics/': [
        {
          text: '图形学基础GAMES101',
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
            { text: 'Ray Tracing4', link: '/graphics/games101_15' },
            { text: 'Material and Appearance', link: '/graphics/games101_16' }
          ]
        },
        {
          text:'实时渲染GAMES202',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/graphics/games202_01' },
            { text: 'Recap of CG basics', link: '/graphics/games202_02' },
            { text: 'Real-Time Shadows', link: '/graphics/games202_03' },
            { text: 'Real-Time Shadows2', link: '/graphics/games202_04' },            
          ]
        },
        {
          text: '准备面试',
          collapsed: false,
          items:[
            { text: '回顾', link: '/graphics/summary'},
            { text: 'DrawCall', link: '/graphics/DrawCall' },
            { text: '四元数', link: '/graphics/quaternion' },
            { text: '反走样', link: '/graphics/antialiasing' },            
          ]
        }
      ],
      '/hot100/': [
        {
          text: '刷算法题',
          collapsed: true,
          items: [
            { text: '刷题总结', link: '/hot100/summary' },
            { text: '哈希', link: '/hot100/questions1' },
            { text: '双指针', link: '/hot100/questions2' },
            { text: '滑动窗口', link: '/hot100/questions3' },
            { text: '子串', link: '/hot100/questions4' },
            { text: '普通数组', link: '/hot100/questions5' },
            { text: '矩阵', link: '/hot100/questions6' },
            { text: '链表', link: '/hot100/questions7' },
            { text: '二叉树', link: '/hot100/questions8' },
            { text: '图论', link: '/hot100/questions9' },
            { text: '回溯', link: '/hot100/questions10' },
            { text: '二分查找', link: '/hot100/questions11' },
            { text: '栈', link: '/hot100/questions12' },
            { text: '堆', link: '/hot100/questions13' },
            { text: '贪心', link: '/hot100/questions14' },
            { text: '动态规划', link: '/hot100/questions15' },
            { text: '多维动态规划', link: '/hot100/questions16' },
            { text: '技巧', link: '/hot100/questions17' },
            { text: '其它手撕代码', link: '/hot100/handcode' }       
          ]
        }
      ],
      '/other/': [
        {
          text: '其它疑问',
          collapsed: false,
          items: [
            { text: '随机数算法', link: '/other/random_algorithm' },
            { text: '寻路算法', link: '/other/pathfinding_algorithm' },
          ]
        }
      ],
      'unity/': [        
        { text: 'Demo回顾', link: '/unity/Summary' },
        { text: '游戏相关知识', link: '/unity/OtherKnowledge' },
        // { text: '状态同步与帧同步', link: '/unity/FrameStateSync' },
        { text: '玩家移动', link: '/unity/Player_Movement' },
        { text: '玩家攻击', link: '/unity/Player_Combat' },
        { text: '玩家射击', link: '/unity/Player_Bow' },
        { text: '玩家生命值', link: '/unity/Player_Health' },
        { text: '怪物移动', link: '/unity/Enemy_Movement' },
        { text: '怪物攻击', link: '/unity/Enemy_Combat' },
        { text: '怪物击退', link: '/unity/Enemy_KnockBack' },
        { text: '怪物刷新', link: '/unity/Enemy_Spawner' },
        { text: '怪物生命值', link: '/unity/Enemy_Health' },
        { text: 'Bow', link: '/unity/Bow' },
        { text: '技能', link: '/unity/Skill' },
        { text: '状态UI', link: '/unity/StatsUI' },
        { text: '状态管理', link: '/unity/StatsManager' },
      ],
      '408_review/': [
        { text: '函数调用/访问网站', link: '/408_review/CS_N' },
        { text: 'UDP', link: '/408_review/CN_01' },
        { text: 'TCP的握手挥手', link: '/408_review/CN_02' },
        { text: 'TCP的重传', link: '/408_review/CN_03' },
        { text: 'HTTP', link: '/408_review/CN_04' },
        { text: 'DNS', link: '/408_review/CN_05' },
        { text: '进程与线程', link: '/408_review/OS_01' },
        { text: '进程调度', link: '/408_review/OS_02' },
        { text: '进程通信', link: '/408_review/OS_03' },
        { text: '同步互斥', link: '/408_review/OS_04' },
        { text: '虚拟内存', link: '/408_review/OS_05' },
        { text: '文件管理', link: '/408_review/OS_06' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/studycg' }
    ]
  }
})