---
# https://vitepress.dev/reference/default-theme-home-page

# 布局模式
layout: home

# 1. Hero 区域：第一眼看到的视觉中心
hero:
  name: "Geom & Code"
  text: "学习记录"
  # tagline: "C++ / C# / Unity / CG / Render / OpenGL"
  
  # 给大标题加个渐变色，看起来更有科技感
  # image:
  #   src: /logo.png # 这里之后建议换成一张炫酷的 3D 线框图
  #   alt: Logo

  # image:
  #   src: /logo2.png
  #   alt: Logo
  
  actions:
    - theme: brand
      text: "🚀 开始探索 C++"
      link: /cpp/intro
    - theme: alt
      text: "🧊 图形学"
      link: /graphics/games101_3
    - theme: alt
      text: "关于我"
      link: /resume

# 2. 特性网格：这里做成“导航卡片”
features:
  - title: 🛠️ 核心技术栈
    details: 深入钻研 C++17/20 标准，掌握 STL、模板元编程与内存管理艺术。
    link: /morecpp/morecpp_01
  
  - title: 💎 规划
    details: 学习计划
    link: /plane
    
  - title: 📑 简历
    details: 个人经历和技能。
    link: /resume

  - title: 🎮 游戏
    details: 从小到大玩过的游戏。
    link: /games

  - title: ⚙️ 功能测试
    details: 测试vitepress markdown公式显示是否正常。
    link: /test


# features:
#   - title: Feature A
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
#   - title: Feature B
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
#   - title: Feature C
#     details: Lorem ipsum dolor sit amet, consectetur adipiscing elit
# ---

