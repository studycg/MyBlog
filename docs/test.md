# 此页面为测试页

这是初始化测试效果的页面

## 公式显示测试

行内公式：$E=mc^2$

块级公式（贝塞尔曲线）：
$$
B(t) = \sum_{i=0}^{n} \binom{n}{i} (1-t)^{n-i} t^i P_i, \quad t \in [0,1]
$$

## 代码块显示测试

```c++
int main(){
    std::cout << "Hello World" << std::endl;
    return 0;
}
```

## 图片显示测试Typora

![image-20251124224526728](./assets/image-20251124224526728.png)

## 图片显示测试Visual Studio Code

![img_2025-11-24-23-17-39.png](./assets/img_2025-11-24-23-17-39.png)

## 提示块测试

普通文本...

::: info 知识点
这是一个【信息块】，适合写概念定义。
:::

::: tip 技巧
这是一个【提示块】，适合写 Best Practice (最佳实践)。
比如：尽量使用 `std::make_shared` 而不是 `new`。
:::

::: warning 注意
这是一个【警告块】。
注意：`using namespace std;` 在头文件中是危险操作！
:::

::: danger 错误
这是一个红色的【危险块】。
`Segmentation Fault (Core Dumped) `
:::

::: details 这是一个折叠块
这里是可以折叠的内容。
你可以在这里放长代码，默认不显示，点开才能看。

```cpp
int main() {
    return 0;
}
```
:::

## 警告框

> [!NOTE]

> [!TIP]

> [!IMPORTANT]

> [!WARNING]

> [!CAUTION]

## 表格

| 表头 | 表头 | 表头 |
| ---- | ---- | ---- |
| 内容 | 内容 | 内容 |
| 内容 | 内容 | 内容 |

## 有序列表

1. 第一行
2. 第二行

## 无序列表

- 第一行
- 第二行

## 任务列表

- [ ] 第一行
- [ ] 第二行

## 引用

> 机会都是留给有准备的人的
