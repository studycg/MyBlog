---
# https://vitepress.dev/reference/default-theme-home-page

# 布局模式
layout: home

# 1. Hero 区域：第一眼看到的视觉中心
hero:
  name: "Geom & Code"
  text: "我真的喜欢图形学"
  tagline: "C++ / ACIS / 算法 / 渲染"
  
  # 给大标题加个渐变色，看起来更有科技感
  # image:
  #   src: /logo.png # 这里之后建议换成一张炫酷的 3D 线框图
  #   alt: Logo

  image:
    src: /logo2.png
    alt: Logo
  
  actions:
    - theme: brand
      text: "🚀 开始探索 C++"
      link: /cpp/intro
    - theme: alt
      text: "🐍 Python 可视化"
      link: /python/intro
    - theme: alt
      text: "关于我"
      link: /about

# 2. 特性网格：这里做成“导航卡片”
features:
  - title: 🛠️ 核心技术栈
    details: 深入钻研 C++17/20 标准，掌握 STL、模板元编程与内存管理艺术。
    link: /cpp/intro
  
  - title: 🧊 几何建模 (CAD)
    details: 基于 ACIS/OCCT 内核，研究 NURBS 曲线曲面拟合、布尔运算与拓扑重构。
    link: /cpp/point-cloud
    
  - title: 📊 数据可视化
    details: 使用 Python Plotly 与 Matplotlib 绘制高维数据，让算法结果可视可触。
    link: /python/intro

  - title: 📝 读书与随笔
    details: 技术之外的思考，记录日语学习心得与生活碎片。
    link: /misc/diary

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

