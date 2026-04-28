> [!NOTE]
>
> 旋转与MVP变换
$$
R_{\theta}=\begin{pmatrix}
\cos\theta & -\sin\theta \\
\sin\theta & \cos\theta
\end{pmatrix}
$$

$$
R_{-\theta}=\begin{pmatrix}
\cos\theta & \sin\theta \\
-\sin\theta & \cos\theta
\end{pmatrix}=R_{\theta}^{\top}
$$

$$
R_{-\theta}=R_{\theta}^{-1} \quad \text{(by definition)}
$$

**通过定义来看 旋转矩阵的转置就是旋转矩阵的逆 所以旋转矩阵是一个正交矩阵**

**通过4x4矩阵来表示三维变化**
$$
\left(\begin{array}{c}
x^{\prime} \\
y^{\prime} \\
z^{\prime} \\
1
\end{array}\right)
=
\left(\begin{array}{cccc}
a & b & c & t_{x} \\
d & e & f & t_{y} \\
g & h & i & t_{z} \\
0 & 0 & 0 & 1
\end{array}\right)
\cdot
\left(\begin{array}{c}
x \\
y \\
z \\
1
\end{array}\right)
$$
当然也是先旋转再平移

# 三维空间中的绕轴旋转

$$
\mathbf{R}_{x}(\alpha) = 
\begin{pmatrix}
1 & 0 & 0 & 0 \\
0 & \cos\alpha & -\sin\alpha & 0 \\
0 & \sin\alpha & \cos\alpha & 0 \\
0 & 0 & 0 & 1
\end{pmatrix}
$$

$$
\mathbf{R}_{y}(\alpha) = 
\begin{pmatrix}
\cos\alpha & 0 & \sin\alpha & 0 \\
0 & 1 & 0 & 0 \\
-\sin\alpha & 0 & \cos\alpha & 0 \\
0 & 0 & 0 & 1
\end{pmatrix}
$$

$$
\mathbf{R}_{z}(\alpha) = 
\begin{pmatrix}
\cos\alpha & -\sin\alpha & 0 & 0 \\
\sin\alpha & \cos\alpha & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{pmatrix}
$$

## 为什么关于y轴的不一样？

**因为叉乘：**

- 对于x轴：y叉乘z得到x
- 对于z轴：x叉乘y得到z
- 但对于y轴：z叉乘x得到y

# 罗德里格斯旋转公式

绕任意单位轴 **n** 旋转角度 **α** 的旋转矩阵公式：

$$
\mathbf{R}(\mathbf{n},\alpha) = 
\cos (\alpha) \, \mathbf{I} 
+ (1-\cos (\alpha)) \, \mathbf{n} \mathbf{n}^{T} 
+ \sin (\alpha) \, 
\underbrace{
\begin{bmatrix}
0 & -n_{z} & n_{y} \\
n_{z} & 0 & -n_{x} \\
-n_{y} & n_{x} & 0
\end{bmatrix}
}_{\mathbf{N}}
$$

四元数的乘法法则为什么是这样？
四元数作用于向量旋转时 非常像相似矩阵的形式 假设P-1AP=B 我们会说A和B相似 P可能是基变化 而放在四元素旋转中 旋转后的向量和原来的向量仍然是相似的？只不过变化矩阵不再是基变化 而是到虚数空间 再到实数空间的变化？

# 四元数

看四元数那篇文章

# View/Camera Transformation

![image-20251223184956127](./assets/image-20251223184956127.png)

![image-20251224094452257](./assets/image-20251224094452257.png)

![image-20251224094510952](./assets/image-20251224094510952.png)

![image-20251224094518536](./assets/image-20251224094518536.png)

$$R_{view}^{-1}$$

非常好写，而旋转矩阵的逆矩阵等于它的转置，所以将相机旋转回原点也非常好写。

# Projection Transformation

![image-20251224095046866](./assets/image-20251224095046866.png)

正交投影并不会带来近大远小的情况

## 正交投影

![image-20251224100812971](./assets/image-20251224100812971.png)

因为坐标系的问题 越远的地方z坐标值越小

## 透视投影

在齐次坐标中$(x,y,z,1)$和$(kx,ky,kz,k*k)$表示的是同一个点，所以$(zx,zy,zz,z!=0)$表示的也是这个点。

<img src="./assets/image-20251224101456555.png" alt="image-20251224101456555" style="zoom:50%;" />

看为把远平面的四个点挤压变小

在**挤压**的过程中规定：近平面永远不变，远处平面的z值不变。远平面的中心点也不会发生变化。

如何挤压呢？

假设从侧面看向frustum

<img src="./assets/image-20260414031645628.png" alt="image-20260414031645628" style="zoom:50%;" />

$(x,y,z)$挤压之后的坐标式什么？
$$
\frac{x'}{x} = \frac{n}{z} \Rightarrow x' = \frac{nx}{z}
$$

$$
\frac{y'}{y} = \frac{n}{z} \Rightarrow y' = \frac{ny}{z}
$$

对于z呢？既然在齐次坐标中它们都表示同一个点

都乘以z

![image-20260414032039406](./assets/image-20260414032039406.png)

既然乘以一个矩阵后 有三个坐标已经知道了 那么

![image-20260414032130437](./assets/image-20260414032130437.png)

在近的平面上和远的屏幕上z不变

对于近平面上的点，乘上矩阵后一定等于他自己

![image-20260414032615053](./assets/image-20260414032615053.png)

既然n乘以矩阵第三行是n的平方，那么第三行的前两个数一定是0。

![image-20260414032803389](./assets/image-20260414032803389.png)

对于远平面上的点，远平面的中心点(0,0,f,1)位置不会发生变化。

![image-20260414033122275](./assets/image-20260414033122275.png)

n和f都已知了

![image-20260414033342554](./assets/image-20260414033342554.png)

$$M_{p \rightarrow o} = \begin{bmatrix} n & 0 & 0 & 0 \\ 0 & n & 0 & 0 \\ 0 & 0 & A & B \\ 0 & 0 & -1 & 0 \end{bmatrix}$$

$$M_{p \rightarrow o} = \begin{bmatrix} n & 0 & 0 & 0 \\ 0 & n & 0 & 0 \\ 0 & 0 & n+f & -nf \\ 0 & 0 & -1 & 0 \end{bmatrix}$$

虽然近平面和远平面处不变，但是

在透视投影后，中间平面的深度值（$z$ 值）在 NDC 空间中会看起来更“远”了。
