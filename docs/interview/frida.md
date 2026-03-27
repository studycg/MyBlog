# 脚本功能

脚本对`xxx.dll`里的所有函数做Hook，统计：

- 调用次数
- 调用栈
- 时间
- 内存分配情况

# 脚本架构

**Python+Frida**双端协作

```c++
Python 主控端
    ↓ 注入 JS
Frida JS（运行在目标进程中）
    ↓ send()
Python 收数据
    ↓
CSV 输出
```

注入的是exe对应的进程

## spawn模式与attach模式

### spawn

```c++
pid = device.spawn([EXE_PATH])
session = device.attach(pid)
```

启动exe之后就拿到它的PID，立刻attach进去。此时JS程序在刚启动就注入进去。

### attach

```c++
session = device.attach(ATTACH_TARGET)
```

目标程序已经在运行，直接附加进去。

## 关于Hook

Hook的是dll的函数地址：

1. 先找到DLL：获取基址、大小、导出函数表
2. 枚举函数：枚举dll中的函数
3. 对每个函数Hook：hook的是dll中函数的内存地址

注入的是exe为什么可以hook dll？因为dll也是加载在这个进程里的

JS运行在目标进程内部，dll也在进程里，可以直接拿到函数地址。

**hook的本质**

```c++
把函数入口改写为：

call hook_onEnter
执行原函数
call hook_onLeave
```

把函数入口地址改写为跳转到自己的代码

```c++
Func:
    push rbp
    mov rbp, rsp
    ...
```

变为了

```c++
Func:
    jmp hook_stub
```

```c++
hook_stub:
    调用 onEnter
    执行原函数（或 trampoline）
    调用 onLeave
    返回
```

## 等待dll加载

因为程序刚开始运行的时候dll可能不会被加载

```c++
1. EXE 启动
2. JS 注入成功
3. DLL 还没 LoadLibrary
4. Hook 会失败
```

## Python与JS通信方式

**JS->Python**

```c++
send({ type: 'stats', payload: ... })
```

**Python接收**

```c++
script.on("message", on_message)
```

本质是进程间通信IPC，因为Python和目标进程exe进程是两个不同的进程

JS是注入到exe进程中的

```c++
[ Python进程 ]
    |
    |  (Frida RPC / IPC)
    ↓
[ 目标进程 ]
    |
    ├── 原EXE代码
    ├── DLL
    └── Frida Agent
            └── JS Runtime
                    └── Hook 逻辑
```

# 调用栈

想统计完整的调用路径，但是Frida只会统计`onEnter`和`onLeave`，没有一个现成的调用栈。所以必须维护一个影子调用栈。

```c++
{
    funcId,           // 函数ID
    rsp,              // 进入函数时的栈指针
    enterTicks,       // 进入时间
    pathId,           // 调用路径ID
    childTicks,       // 子函数耗时
    childEnterTicks   // 子函数进入时间
}
```

并且调用栈是线程私有的

再Debug模式下，OnEnter/OnLeave：

```c++
onEnter:
    push(当前函数)
```

```c++
onLeave:
    pop(当前函数)
```

Release模式因为返回值优化，所以onLeave丢失。时间统计会错误，调用栈也会爆炸。

所以此时就需要**RSP机制**登场：

- 函数调用：RSP变小
- 函数返回：RSP变小

如果$RSP_{current}≥RSP_{某函数进入时的RSP}$，那这个函数一定返回了。

Debug模式：onEnter + onLeave → 维护栈

Release模式：onEnter + RSP → 重建返回行为

## 关于RSP

**RSP:Register Stack Pointer**栈指针寄存器。

CPU的寄存器，用来表示**栈顶**的内存地址。

```c++
高地址
│
│   ← 栈底
│
│
│
│   ← RSP（栈顶）
│
低地址
```

再x86=中栈是”向下“增长的。

函数调用 → RSP 变小（向下）
函数返回 → RSP 变大（向上）

Frida通过

```c++
var currentRsp = this.context.sp;
```

读取RSP的地址。同时可以连续弹多个栈。

栈: `[A, B, C, D]`

RSP = A 的 RSP

说明：D 已返回、C 已返回、B 已返回。

因为RSP是CPU真实维护的，不依赖编译器和OnLeave等，所以很稳，可以支持Release。

# 调用路径

直观的做法是用字符串表示路径

如`"A->B->C"`但这会造成性能爆炸的问题

> 字符串比较 = O(d)
> 哈希 = O(d)
> 内存分配 = 很多
> 百万级调用 → 直接炸

所以采用pathID思想：用**整数ID**代替**字符串路径**

ROOT → A → B → C

pathId = 12345，并且Path ID是唯一的。

函数名使用funcID来代替 路径中使用funcID

**调用路径的缓存**



| 问题     | 解决     |
| -------- | -------- |
| 字符串慢 | 用整数   |
| 重复路径 | 用缓存   |
| 路径爆炸 | 用树结构 |
| 比较复杂 | O(1)     |

# 时间统计



# 内存统计



# 数据结构