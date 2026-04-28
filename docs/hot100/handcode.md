想到了当年考研经典名言：选艾希快堆攻速下路不稳

选：选择排序

希：希尔排序

快：快速排序

堆：堆排序

# 快速排序

Hoare写法

```c++
#include <vector>
using namespace std;

void quickSort(vector<int>& nums, int left, int right) {
    if (left >= right) return;

    int i = left, j = right;
    int pivot = nums[left];  // 选最左作为基准

    while (i < j) {
        // 1. 从右往左找 < pivot 的
        while (i < j && nums[j] >= pivot) j--;
        // 2. 从左往右找 > pivot 的
        while (i < j && nums[i] <= pivot) i++;

        if (i < j) {
            swap(nums[i], nums[j]);
        }
    }

    // 3. 把 pivot 放到正确位置
    swap(nums[left], nums[i]);

    // 4. 递归左右
    quickSort(nums, left, i - 1);
    quickSort(nums, i + 1, right);
}
```

**情况 A：`j` 撞上了 `i`** 由于 `i` 在上一轮交换后，指向的是一个刚刚从右边换过来的、**小于 `pivot`** 的数。当 `j` 移动并撞上 `i` 时，相遇点的值自然是小于 `pivot` 的。

**情况 B：`i` 撞上了 `j`** 因为是 `j` 先走，`j` 已经停在了一个**小于 `pivot`** 的数上。此时 `i` 向右移动撞上 `j`，相遇点的值依然是小于 `pivot` 的。

所以当`i=j`时，这个点一定是比pivot小的。

扩展：

**右指针 `j` 先走**：保证了相遇点 $\le pivot$。

**左指针 `i` 先走**：保证了相遇点 $\ge pivot$。

所以选left当pivot，那么先动j。选right当pivot，那么先动i。

这是关于快速排序swap的写法。

其实关于快速排序还有以填坑为比喻来理解的

```c++
#include <iostream>
#include <vector>

using namespace std;

void quickSort(vector<int>& nums, int left, int right) {
    if (left >= right) return;

    int i = left, j = right;
    // 取第一个数为基准，此时 nums[i] 就是第一个“坑”
    int pivot = nums[i]; 

    while (i < j) {
        // 从右向左找第一个小于 pivot 的数
        while (i < j && nums[j] >= pivot) j--;
        if (i < j) nums[i] = nums[j]; // 填左边的坑，j 变成新坑

        // 从左向右找第一个大于 pivot 的数
        while (i < j && nums[i] <= pivot) i++;
        if (i < j) nums[j] = nums[i]; // 填右边的坑，i 变成新坑
    }

    // 循环结束时 i == j，把基准值填回最后的坑
    nums[i] = pivot;

    // 递归处理左右两部分
    quickSort(nums, left, i - 1);
    quickSort(nums, i + 1, right);
}
```

如果担心每次选最左侧，造成快排时间退化成n方，那么：

```c++
void quickSort(vector<int>& nums, int left, int right) {
    if (left >= right) return;

    // 1. 优化：取中间值作为基准
    int mid = left + (right - left) / 2;
    // 2. 秘密武器：把中间的基准值换到最左边
    swap(nums[left], nums[mid]); 
    
    // 3. 现在可以愉快地开始“挖坑”了，坑就在 left 处
    int i = left, j = right;
    int pivot = nums[i]; 

    while (i < j) {
        while (i < j && nums[j] >= pivot) j--;
        if (i < j) nums[i] = nums[j];

        while (i < j && nums[i] <= pivot) i++;
        if (i < j) nums[j] = nums[i];
    }

    nums[i] = pivot;

    quickSort(nums, left, i - 1);
    quickSort(nums, i + 1, right);
}
```

# 快速选择

这就是经典的TopK问题不用小根堆做

```c++
// 寻找第 k 小的元素 (k 从 0 开始计算)
int quickSelect(vector<int>& nums, int left, int right, int k) {
    if (left == right) return nums[left];

    // 优化：取中间作为基准，换到开头
    int mid = left + (right - left) / 2;
    swap(nums[left], nums[mid]);

    int i = left, j = right;
    int pivot = nums[i];

    // 标准挖坑法
    while (i < j) {
        while (i < j && nums[j] >= pivot) j--;
        if (i < j) nums[i] = nums[j];
        while (i < j && nums[i] <= pivot) i++;
        if (i < j) nums[j] = nums[i];
    }
    nums[i] = pivot; // 此时 i 就是 pivot 的最终位置

    // 关键判断：
    if (i == k) {
        return nums[i]; // 运气好，直接找到了
    } else if (i > k) {
        return quickSelect(nums, left, i - 1, k); // 只需要去左边找
    } else {
        return quickSelect(nums, i + 1, right, k); // 只需要去右边找
    }
}
```

# 冒泡排序

```c++
void bubblesort(vector<int>& nums) {
    int n = nums.size() - 1;
    for (int i = 0; i < n - 1; i++) {
        bool swap_flag = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (nums[j] > nums[j + 1]) {
                swap(nums[j], nums[j + 1]);
                swap_flag = true;
            }
        }
        if (!swap_flag) break;
    }

}
```

外层为什么是`0到n-1`：因为共有n各元素，最多需要确定n-1个元素位置。

内层为什么是`0到n-i-1`：

1. n-1是因为：j和j+1的原因
2. -i是因为：每一轮结束最后i个元素已排好序

# 选择排序

每一轮从未排序的部分找到最小或者最大的部分放入已排序的末尾

```c++
void selectionSort(vector<int>& nums) {
    int n = nums.size();
    for (int i = 0; i < n - 1; ++i) {
        int minIndex = i; // 假设当前未排序区的第一个是最小的
        for (int j = i + 1; j < n; ++j) {
            if (nums[j] < nums[minIndex]) {
                minIndex = j; // 找到更小的，记录下标
            }
        }
        // 将找到的最小值与未排序区的首位交换
        swap(nums[i], nums[minIndex]);
    }
}
```

**稳定性**：**不稳定**。例如 `[5, 8, 5, 2]`，第一轮 5 和 2 交换后，原先两个 5 的相对顺序就变了。

**特点**：交换次数最少（最多 $n-1$ 次），如果交换元素的代价很高，选择排序有一定优势。

# 插入排序

将数组分为“已排序”和“未排序”两部分。每次取未排序部分的第一个元素，**像打扑克牌一样**，将其插入到已排序部分的正确位置。

```c++
void insertionSort(vector<int>& nums) {
    int n = nums.size();
    for (int i = 1; i < n; ++i) {
        int key = nums[i]; // 当前待插入的“牌”
        int j = i - 1;
        
        // 将比 key 大的元素都向后挪一个位置
        while (j >= 0 && nums[j] > key) {
            nums[j + 1] = nums[j];
            j--;
        }
        // 找到空位，放下 key
        nums[j + 1] = key;
    }
}
```

**稳定性**：**稳定**。由于 `nums[j] > key` 才移动，相等的元素不会互相跨越。

**性能黑马**：在**几乎有序**的情况下，效率极高，接近 $O(n)$。

# 归并排序

快排是“自顶向下”的分治

归并就是**自底向上**的合并。

它是**稳定排序**的代表，也是处理**链表排序**的首选。

```c++
void merge(vector<int>& nums, int left, int mid, int right) {
    vector<int> temp(right - left + 1);
    int i = left, j = mid + 1；
    int k = 0;

    while (i <= mid && j <= right) {
        temp[k++] = (nums[i] <= nums[j]) ? nums[i++] : nums[j++];
    }
    while (i <= mid) temp[k++] = nums[i++];
    while (j <= right) temp[k++] = nums[j++];

    for (int p = 0; p < k; ++p) nums[left + p] = temp[p];
}

void mergeSort(vector<int>& nums, int left, int right) {
    if (left >= right) return;
    int mid = left + (right - left) / 2;
    mergeSort(nums, left, mid);
    mergeSort(nums, mid + 1, right);
    merge(nums, left, mid, right);
}
```

# 堆排序

建堆的时间复杂度

插入建堆是O(nlogn)

从底向上是O(n)

查找的时间复杂度



# C++中的排序

**sort切换到堆排序**

**做法**：初始使用快速排序。但 `std::sort` 会记录递归的深度。如果递归深度超过了某个阈值（通常是 $2 \log n$），它会认为当前的基准值选择策略失效，导致快排可能退化为 $O(n^2)$。

**切换**：此时它会立即切换为**堆排序**。

**原因**：堆排序在最坏情况下也能稳定保持 $O(n \log n)$，这相当于给快排加了一个“保底”保险。

**切换到插入排序**

**做法**：当子序列的长度非常小（通常小于 16 或 32）时，算法停止递归。

**切换**：转而使用**插入排序**。

**原因**：

- **常数项小**：在小规模数据上，插入排序的简单逻辑比快排的递归开销和分区逻辑更快。
- **缓存友好**：插入排序对内存缓存（Cache）非常友好。

虽然从大 $O$ 复杂度看，$O(n^2)$ 远逊于 $O(n \log n)$，但在数据量极小时（如 $n < 16$），**常数项 **起到了决定性作用。

- **递归开销**：快速排序是递归算法，每次函数调用都有压栈、出栈、保护现场的开销。对于只有十几个元素的数组，递归的额外开销甚至超过了排序本身的计算量。
- **逻辑复杂度**：快速排序需要计算 `mid`、移动左右双指针、进行多次条件判断。而插入排序的内层循环非常简单，编译器可以对其进行极佳的优化（如指令级并行）。

| **特性**       | **快速排序** | **堆排序**    | **插入排序** | **Introsort (C++ std::sort)** |
| -------------- | ------------ | ------------- | ------------ | ----------------------------- |
| **平均速度**   | 极快         | 较快          | 慢           | **极快**                      |
| **最坏情况**   | $O(n^2)$     | $O(n \log n)$ | $O(n^2)$     | **$O(n \log n)$**             |
| **小数据表现** | 一般         | 较差          | 极好         | **极好**                      |

# BFS

使用队列辅助，配合一个访问数组。

```c++
/**
 * BFS 模板函数
 * @param startNode 起始节点
 * @param adj 邻接表，adj[i] 存储了与节点 i 相邻的所有节点
 * @param visited 访问标记数组
 */
void bfs(int startNode, const vector<vector<int>>& adj, vector<bool>& visited) {
    // 1. 创建一个队列用于辅助遍历
    queue<int> q;

    // 2. 将起始节点入队，并标记为已访问
    q.push(startNode);
    visited[startNode] = true;

    while (!q.empty()) {
        // 3. 取出队首元素
        int curr = q.front();
        q.pop();

        // 在这里处理当前节点（例如打印或记录结果）
        cout << curr << " ";

        // 4. 遍历当前节点的所有邻居
        for (int neighbor : adj[curr]) {
            // 5. 如果邻居节点未被访问，则入队并标记
            if (!visited[neighbor]) {
                visited[neighbor] = true;
                q.push(neighbor);
            }
        }
    }
}
```

# Dijkstra

```c++
#include <iostream>
#include <vector>
#include <queue>

using namespace std;

// 边：包含目的地和权重
struct Edge {
    int to;
    int weight;
};

// 堆节点：存储从起点到当前节点的总距离
struct Node {
    int distance;
    int id;

    // 优先队列默认为大根堆，我们需要定义大于号来构建小根堆
    bool operator>(const Node& other) const {
        return distance > other.distance;
    }
};

void dijkstra(int start, const vector<vector<Edge>>& adj, int n) {
    const int INF = 1e9;
    vector<int> min_dist(n, INF);
    
    // 优先队列：每次弹出当前距离起点最近的节点
    priority_queue<Node, vector<Node>, greater<Node>> pq;

    // 初始化起点
    min_dist[start] = 0;
    pq.push({0, start});

    while (!pq.empty()) {
        Node current = pq.top();
        pq.pop();
        
        int curr_dist = current.distance;
        int curr_id = current.id;

        // 核心优化：如果弹出的距离已经大于已知的最短距离，则忽略（过期路径）
        if (curr_dist > min_dist[curr_id]) {
            continue;
        }

        // 遍历当前节点的所有邻居
        for (const auto& edge : adj[curr_id]) {
            int neighbor = edge.to;
            int edge_weight = edge.weight;
            
            // 松弛操作：如果通过当前点到达邻居的路径更短，则更新
            if (min_dist[curr_id] + edge_weight < min_dist[neighbor]) {
                min_dist[neighbor] = min_dist[curr_id] + edge_weight;
                pq.push({min_dist[neighbor], neighbor});
            }
        }
    }

    // 打印结果
    for (int i = 0; i < n; ++i) {
        cout << "Node " << i << " shortest distance: ";
        if (min_dist[i] == INF) cout << "Unreachable" << endl;
        else cout << min_dist[i] << endl;
    }
}
```



# DFS





# A*





# 拓扑排序



# 使用栈模拟队列

如果出栈为空，入栈的都放入出栈中。

```c++
class MyQueue {
private:
    stack<int> inStack;
    stack<int> outStack;

public:
    MyQueue() {}

    void push(int x) {
        inStack.push(x);
    }

    int pop() {
        if (outStack.empty()) {
            while (!inStack.empty()) {
                outStack.push(inStack.top());
                inStack.pop();
            }
        }
        int val = outStack.top();
        outStack.pop();
        return val;
    }

    int peek() {
        if (outStack.empty()) {
            while (!inStack.empty()) {
                outStack.push(inStack.top());
                inStack.pop();
            }
        }
        return outStack.top();
    }

    bool empty() {
        return inStack.empty() && outStack.empty();
    }
};
```

