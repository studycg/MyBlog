# Scale

![image-20251219170233999](./assets/image-20251219170233999.png)

![image-20251219170436497](./assets/image-20251219170436497.png)


$$
x^{\prime}=s_xx
$$

$$
y^{\prime}=s_yy
$$

$$
\left[\begin{array}{l}
x^{\prime} \\
y^{\prime}
\end{array}\right] = 
\left[\begin{array}{ll}
s_x & 0 \\
0 & s_y
\end{array}\right]
\left[\begin{array}{l}
x \\
y
\end{array}\right]
$$

![image-20251219170455108](./assets/image-20251219170455108.png)
$$
x^{\prime}=-x\\
x^{\prime}=y\\

\left[\begin{array}{l}
x^{\prime} \\
y^{\prime}
\end{array}\right] = 
\left[\begin{array}{ll}
-1 & 0 \\
0 & 1
\end{array}\right]
\left[\begin{array}{l}
x \\
y
\end{array}\right]
$$

# Shear

![image-20251219170857902](./assets/image-20251219170857902.png)

y=0时所有点x的移动方向都是0

y=1时所有点x的移动方向都是a

y=0.5时所有点x的移动方向都是a/2

y方向的移动始终为0
$$
\left[\begin{array}{l}
x^{\prime} \\
y^{\prime}
\end{array}\right] = 
\left[\begin{array}{ll}
1 & a \\
0 & 1
\end{array}\right]
\left[\begin{array}{l}
x \\
y
\end{array}\right]
$$

# Rotate

二维旋转默认以原点为中心逆时针旋转

![image-20251219171538523](./assets/image-20251219171538523.png)

![image-20251219171957559](./assets/image-20251219171957559.png)

[1,0]旋转后是[conθ, sinθ]算出A和C

[0,1]旋转后是[-sinθ, cosθ]算出B和D

![image-20251222172429008](./assets/image-20251222172429008.png)

对于一个变化就使用一个矩阵

# 齐次坐标

对于平移变化，平移变化无法使用矩阵乘法表示

![image-20251222172654257](./assets/image-20251222172654257.png)

![image-20251222172741342](./assets/image-20251222172741342.png)

**为了把所有的变化都用矩阵表示**

![image-20251222173037317](./assets/image-20251222173037317.png)

![image-20251222173304750](./assets/image-20251222173304750.png)

![image-20251222201655609](./assets/image-20251222201655609.png)

**从矩阵表示线性变化的角度来看，矩阵不符合交换律**

![image-20251222211245201](./assets/image-20251222211245201.png)

这个知识点直接对应考研中的相似矩阵
$$
P^{-1}AP=B \quad A相似B
$$
相似矩阵是同一线性变化的不同表示

## 三维的齐次坐标是相同的道理

![image-20251222211659771](./assets/image-20251222211659771.png)

当然是先线性变化再平移
