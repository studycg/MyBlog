# 委托与事件

## 委托

**原理：** 委托本质上是一个**类型安全的函数指针**。它定义了一个方法的“形状”（参数类型和返回值类型）。

- **C++ 类比**：类似于 `typedef void (*Callback)(int);`。
- **它的能力**：它可以指向一个方法，也可以指向一组方法（多播委托）。

在Demo的`Enemy_Health`代码中：

```c#
public delegate void MonsterDefeated(int exp); // 定义“形状”：无返回值，带一个int参数
```

## 事件

**原理：** 事件是委托的一个**安全包裹**。它基于委托，但增加了访问限制：**只有定义事件的类内部才能触发（Invoke）它，外部只能订阅（+=）或取消订阅（-=）。**

- **C++ 类比**：委托像是一个 `public` 的成员变量（谁都能改），而事件就像是一个带有 `public` 访问器（Add/Remove）但 `private` 触发权限的成员。

```c#
public static event MonsterDefeated OnMonsterDefeated;
```

## 委托与事件三部曲

**定义**

```c#
public delegate void MyAction(string message);
```

**发布**

在类里声明一个事件

```c#
public class Boss {
    public static event MyAction OnBossDead;

    public void Die() {
        // ?. 表示如果没有人订阅，就不执行，防止空指针
        OnBossDead?.Invoke("Boss被击败了！"); 
    }
}
```

**订阅**

```c#
public class AchievementSystem {
    void OnEnable() {
        Boss.OnBossDead += ShowAchievement; // 订阅：用 +=
    }

    void OnDisable() {
        Boss.OnBossDead -= ShowAchievement; // 取消订阅：用 -= (C++程序员务必注意防止内存泄漏)
    }

    void ShowAchievement(string msg) {
        Debug.Log("成就解锁: " + msg);
    }
}
```

## Action和Func

在现代 C# 和 Unity 开发中，我们很少自己写 `delegate` 关键字，因为系统已经帮我们定义好了两个万能模板：

1. **`Action`**：专门给**没有返回值**的函数用。
   - `Action` $\rightarrow$ `void Fun()`
   - `Action<int>` $\rightarrow$ `void Fun(int x)`
   - **`ExpManager` 里的写法**：`public static event Action<int> OnLevelUp;` 这其实就是省去了定义 `delegate` 的步骤。
2. **`Func`**：专门给**有返回值**的函数用。
   - `Func<int, string>` $\rightarrow$ 输入 int，返回 string。

## 可能导致内存泄漏

在 C++ 中，如果对象销毁了，指针没处理好会变野指针。 在 C# 中，**如果你在一个脚本里订阅（+=）了一个静态事件，但在脚本销毁时没有取消订阅（-=），那个静态事件会一直持有该脚本对象的引用，导致 GC（垃圾回收）无法回收这个对象，造成内存泄漏。**

## 走一遍流程

`Enemy_Health.cs`中定义了一个委托和事件

```c#
// 1. 定义委托 (相当于 C++ 的函数指针定义)
public delegate void MonsterDefeated(int exp); 

// 2. 声明事件 (基于该指针定义的“广播站”)
public static event MonsterDefeated OnMonsterDefeated;

public void ChangeHealth(int amount) {
    // ... 扣血逻辑
    if (currentHealth <= 0) {
        // 3. 触发事件 (广播：有人订阅就发信号，没订阅就不发)
        OnMonsterDefeated?.Invoke(ExpReward); 
        Destroy(gameObject);
    }
}
```

`ExpManager.cs` 既是一个**订阅者**（听怪物死的信号），也是一个**发布者**（发升级的信号）。

```c#
public static event Action<int> OnLevelUp;

private void OnEnable() {
    // 订阅：把自己的 GainExperience 函数“挂”到怪物的死亡事件上
    // 相当于：当 OnMonsterDefeated 广播时，请顺便执行我的 GainExperience(int)
    Enemy_Health.OnMonsterDefeated += GainExperience; 
}

public void GainExperience(int amount) {
    currentExp += amount;
    if (currentExp >= expToLevel) {
        LevelUp();
    }
}

private void LevelUp() {
    // ... 升级逻辑
    // 再次发出新信号：玩家升级了！
    OnLevelUp?.Invoke(1); 
}
```

`SkillTreeManager.cs` 就在终点等着升级信号，来给玩家发点数。

```c#
private void OnEnable() {
    // 订阅升级事件
    ExpManager.OnLevelUp += UPdateAbilityPoints;
}

public void UPdateAbilityPoints(int amount) {
    availablePoints += amount; // 增加可用技能点
    pointsText.text = "Points:" + availablePoints; // 更新 UI
}
```

## +=发生了什么

当你写下 `Enemy_Health.OnMonsterDefeated += GainExperience;` 时：

编译器会立刻检查 `GainExperience` 函数的签名。因为 `MonsterDefeated` 委托要求的是 `(int)`，所以你的 `GainExperience` 必须也是 `(int)`。如果参数不匹配（比如是 `float`），C++ 会在链接或运行时报错，而 C# 在**编译期**就会拦截。

**注册回调**：这行代码实际上是将 `GainExperience` 这个函数的**地址**（引用）添加到了 `OnMonsterDefeated` 事件内部维护的一个**调用列表**中。

它是如何把 `ExpReward` 传进去的？内部的伪代码逻辑大概如下

```c#
// OnMonsterDefeated?.Invoke(ExpReward) 的内部底层逻辑
if (OnMonsterDefeated != null) 
{
    // 遍历所有订阅了该事件的方法
    foreach (var subscriber in OnMonsterDefeated.GetInvocationList()) 
    {
        // 依次调用它们，并把 ExpReward 作为参数塞进去
        // 这就是为什么 GainExperience 能够“自动”拿到那个 int
        subscriber.DynamicInvoke(ExpReward); 
    }
}
```

# 协程

在`Enemy_knockback`中有协程写法

```c#
public void Knockback(Transform forcetransform, float knockbackForce, float knockbackTime, float stunTime)
{
    enemy_movement.ChangeState(EnemyState.Knockback);
    //这里
    StartCoroutine(StunTimer(knockbackTime, stunTime));
    Vector2 direction = (transform.position - forcetransform.position).normalized;
    rb.velocity = direction * knockbackForce;

}

IEnumerator StunTimer(float knockbackTime, float stuntime)
{
    // 1. 此时函数执行到这里，怪物已经获得了击退速度
    // [暂停点 A]：告诉 Unity：“我先歇会儿，knockbackTime 秒后再叫我”
    yield return new WaitForSeconds(knockbackTime);

    // 2. 时间到了！Unity 自动回到这里继续跑下一行
    rb.velocity = Vector2.zero; // 停下来

    // [暂停点 B]：告诉 Unity：“我再歇会儿，stuntime 秒后再叫我”
    yield return new WaitForSeconds(stuntime);

    // 3. 时间又到了！最后执行恢复逻辑
    enemy_movement.ChangeState(EnemyState.Idle);
}
```

`yield return` 就像是函数执行过程中的“书签”。它不是退出了函数，而是**交还了 CPU 控制权**给 Unity 渲染下一帧，等条件满足了再回来。

## 协程的本质：迭代器 (Iterator)

你注意到了它的返回值是 `IEnumerator`。作为 C++ 程序员，你肯定熟悉 `std::vector::iterator`。

C# 的协程本质上是一个**状态机迭代器**：

1. 当你执行 `StartCoroutine()` 时，Unity 拿到了这个迭代器。
2. Unity 在每一帧的生命周期中都会问一下这些协程：“你那个书签的条件满足了吗？”（比如时间到了吗？或者这一帧结束了吗？）
3. 如果满足了，就调用 `MoveNext()`，代码就跑到了下一个 `yield` 之前。

## 常见的 `yield` 指令（你的“控制杠杆”）

在协程里，你可以根据 `yield` 后的内容决定暂停多久：

- `yield return null;`：暂停，**下一帧**继续。（常用于逐帧更新的动画，如渐变色）
- `yield return new WaitForSeconds(2f);`：暂停，**2秒后**继续。（受 `Time.timeScale` 影响）
- `yield return new WaitForFixedUpdate();`：暂停，等到下一次**物理计算循环**。
- `yield return new WaitUntil(() => currentHealth > 10);`：暂停，直到**条件为真**再继续。

## 协程与对象池的“生死冲突”

**在 C++ 中，对象销毁了，函数肯定不跑了。但在 Unity 中：**

- 如果你 `Destroy(gameObject)`，挂在上面的协程会**自动停止**。
- **但是**，如果你使用**对象池**（执行 `SetActive(false)`），协程**不一定会自动停止**（取决于 Unity 版本和具体写法），或者当你再次 `SetActive(true)` 时，旧的协程可能还在残留运行。

在对象池的 `OnDespawn`（回收）逻辑里，一定要加上：

```c#
StopAllCoroutines(); // 强行清理掉所有正在跑的“书签”，防止怪物“复活”后逻辑错乱
```

## 协程与主线程是并发的

协程不是并行（Parallel），而是并发（Concurrent）。它完全运行在主线程上。

Unity 的主循环（Game Loop）每一帧都会跑一次。协程其实只是这个大循环里的一个**特定环节**。

1. **Update 执行**：主线程先跑完所有脚本的 `Update`。
2. **协程检查**：Unity 扫描所有处于“挂起”状态的协程。
3. **恢复执行**：如果 `yield` 后的条件满足（比如时间到了），Unity 就让这个函数**接着跑**，直到遇到下一个 `yield`。
4. **渲染**：所有代码跑完了，才去画这一帧的图像。

### 如果协程里死循环会怎样？

这是证明“协程在主线程”最好的例子：

- **线程**：如果你在一个子线程写 `while(true)`，主界面（主线程）依然流畅，只是 CPU 占用率高。
- **协程**：如果你在协程里写 `while(true)` 且中间没有 `yield return`，**你的游戏画面会瞬间卡死（画面冻结）**。因为主线程被困在这个协程里出不来了，无法去跑渲染逻辑。

### 为什么协程看起来像“并行”？

因为它利用了 **“分时复用”**。

在你的击退逻辑中：

- **第 1 帧**：协程运行到 `yield return new WaitForSeconds(knockbackTime)`，停下，记录书签。主线程去干别的（比如处理输入、物理计算）。
- **第 2 到 N 帧**：主线程每帧路过这个协程都会问：“0.5秒到了吗？”。没到，就跳过。
- **第 N+1 帧**：时间到了。主线程进入协程，执行 `rb.velocity = Vector2.zero`。

这种**“暂停 -> 交出控制权 -> 等待 -> 拿回控制权”**的循环，让你在视觉上感觉它和游戏主逻辑是“同时”发生的。

### 性能问题

**不要在协程里做重度计算**：比如在协程里算一个复杂的 A* 寻路。这会直接导致那一帧的耗时激增，造成掉帧。

**轻量级首选**：对于Demo 里的“延时硬直”、“文字逐字显示”、“技能冷却”，协程是完美的选择，因为它不需要昂贵的线程上下文切换。

## 总结协程

协程是 **“伪异步”**。它本质上是把一个长函数拆成了很多个碎片，分摊到很多帧里去执行。

# 可脚本化对象

**Prefab 是“房子”**：它包含墙壁、窗户、家具（组件：Mesh, Rigidbody, Scripts）。它是实实在在能放进场景里、有坐标、能被渲染的**实体**。

**SO 是“蓝图上的数值”**：它只是一张纸，记录了房子的各种参数（比如：房子的造价、墙的颜色代码、最大抗风等级）。它**不属于场景**，它只是存在于你的资源文件夹里的一份**纯数据**。

## 为什么要用 ScriptableObject？（解决 C++ 的冗余问题）

在你的 Demo 中，假设你有 100 个小怪，每个小怪都有 100 点血。

**如果你只用 Prefab：**

每个小怪实例都会在内存中拷贝一份自己的 `maxHealth = 100`。虽然这在 2D 游戏中不算什么，但如果你有成千上万个对象，每个对象都存一份重复的配置数据，就会造成巨大的**内存冗余**。

**如果你用 SO：**

你创建一个 `EnemyConfig.asset` 文件（它是 SO），里面写上 `maxHealth = 100`。所有的 100 个小怪 Prefab 都持有一个指向这个 SO 的**指针**（引用）。

- **内存表现**：无论你有多少个小怪，内存中永远只有一份 `maxHealth` 的数据。
- **C++ 类比**：这相当于把所有实例的共同配置提取出来，做成了一个 `static const` 或者是单例模式下的配置表。

## SO 的原理：静态数据序列化

在 C++ 中，如果你想在不重启程序的情况下修改配置，你可能会读取 `JSON` 或 `XML`。

**ScriptableObject 实际上是 Unity 自带的“可视化 JSON”：**

1. **序列化**：当你定义了 `SkillSO` 并在编辑器里填好数值时，Unity 会把这些数据序列化成一个二进制文件（.asset）。
2. **内存唯一性**：当你运行游戏时，这个 .asset 文件被加载进内存。所有引用它的脚本，拿到的都是**同一个内存地址**。

## 什么时候用SO？

**用 Prefab 的情况**：

- 这个东西需要在场景里移动、碰撞、渲染（怪物、子弹、玩家）。
- 你需要在这个物体上挂载 `MonoBehaviour` 脚本。

**用 SO 的情况**：

- 你需要存储配置信息（武器数值、关卡配置、技能说明）。
- 你需要实现“数据共享”，减少内存消耗。
- **架构解耦**：你想让“数据”和“逻辑”分开。

## 用SO的一个例子

### 第一步：定义武器的数据“模具” (WeaponSO)

```c#
using UnityEngine;

[CreateAssetMenu(fileName = "New Weapon", menuName = "Combat/Weapon Data")]
public class WeaponSO : ScriptableObject
{
    [Header("基础信息")]
    public string weaponName;
    public Sprite weaponIcon;

    [Header("战斗数值")]
    public int damage;
    public float attackRange;
    public float knockbackForce;
    public float attackCooldown;

    [Header("视觉反馈")]
    public Color trailColor = Color.white; // 攻击拖尾颜色
}
```

### 第二步：在编辑器中“生产”武器（不写代码）

现在，你不需要写任何 C# 代码，只需要在 Unity 的 Project 窗口右键：

1. **Create -> Combat -> Weapon Data**。
2. 创建一个叫 `RustySword`（生锈长剑）的文件：设置 Damage=5, Range=1.5。
3. 再创建一个叫 `DragonSlayer`（屠龙宝刀）的文件：设置 Damage=999, Range=3.0, Color=Red。

### 第三步：让玩家脚本“读取”数据

修改你的 `PlayerCombat` 或类似的脚本，让它不再存死数值，而是持有一个 SO 的引用。

```c#
public class PlayerCombat : MonoBehaviour
{
    // 只需要拖入不同的 SO 文件，玩家的属性就变了
    public WeaponSO currentWeapon; 

    public void Attack()
    {
        // 所有的数值都从 SO 中读取
        int finalDamage = currentWeapon.damage + StatsManager.Instance.strength;
        Debug.Log($"使用 {currentWeapon.weaponName} 攻击，造成 {finalDamage} 伤害！");

        // 检测范围也使用 SO 的配置
        Collider2D[] hits = Physics2D.OverlapCircleAll(transform.position, currentWeapon.attackRange);
        
        // 还可以改变特效颜色
        // effect.color = currentWeapon.trailColor;
    }
}
```

### 第四步：运行时“秒切”武器

这是最酷的地方。如果你想实现切换武器，你不需要销毁旧物体、创建新物体（Prefab 的做法），你只需要**更换一个指针地址**：

```c#
public void SwitchWeapon(WeaponSO newWeapon)
{
    currentWeapon = newWeapon;
    // 自动更新 UI 图标
    UI_Manager.Instance.UpdateWeaponIcon(currentWeapon.weaponIcon);
}
```

# C#的GC

## 核心机制：标记-压缩算法

C# 的 GC 并不是 C++ 智能指针那种“引用计数”机制（引用计数无法解决循环引用问题），它使用的是**可达性分析**。

**标记**：GC 从一组称为 **GC Roots**（如静态变量、当前线程栈上的局部变量、寄存器等）出发，像走迷宫一样遍历所有引用到的对象。凡是能走到的对象，都被标记为“活着的”。

**清除：那些没有被标记的对象，就被判定为垃圾。

**压缩：这是 C# GC 的高明之处。为了防止碎片化（C++ 手动管理内存最头疼的问题），GC 会把活着的对象挪到一起，让内存地址变得连续，然后更新所有指向这些对象的指针。

## 分代回收

为了提高效率，C# 把内存中的对象分成了三个“代”，基于一个假设：**越新的对象死得越快（如局部变量），越老的对象活得越久（如全局 Manager）。**

- **第 0 代 (Gen 0)**：新分配的对象。容量小，回收极其频繁（毫秒级）。
- **第 1 代 (Gen 1)**：在 Gen 0 回收中幸存下来的对象。它是 Gen 0 和 Gen 2 之间的缓冲区。
- **第 2 代 (Gen 2)**：长寿对象（如 `StatsManager`）。容量大，回收频率很低。

**性能影响**：当 Gen 0 满时，只回收 Gen 0，速度极快。只有当 Gen 2 也满时，才会触发 **Full GC**，这时会产生明显的“掉帧”，因为 GC 需要挂起所有线程来挪动内存。

# Unity的预制体

**Prefab (预制体)** $\approx$ **二进制化的类定义**。它存储了该物体所有组件的初始状态和参数。

**GameObject (对象实例)** $\approx$ **`new` 出来的实例**。当你调用 `Instantiate(prefab)` 时，Unity 实际上是在内存中根据 Prefab 的“图纸”快速克隆了一个实例。

## 预制体的特性

**A. 预制体变体 —— 类似 C++ 继承**

假设你有一个“基础敌人”预制体。你想做一个“精英敌人”：

- 在 C++ 中，你会写 `class EliteEnemy : public Enemy`。
- 在 Unity 中，你可以创建一个 **Prefab Variant**。它链接到基础预制体，但你可以只修改血量和颜色。如果以后你修改了基础预制体的 AI 脚本，精英敌人也会自动同步更新。

**B. 嵌套预制体 —— 类似 C++ 组合**

一个“玩家”预制体内部可以包含一个“弓箭”预制体。

- 如果你修改了外部的“弓箭”预制体，所有包含弓箭的玩家预制体都会同步更新。这非常符合 C++ 的组合原则。

## 预制体的用法

**批量修改**

在你的 Demo 中，如果你在场景里手动摆放了 100 个怪物（不是用预制体，而是直接复制物体），当你发现怪物速度太快需要调低时，你需要改 100 次。 如果是预制体，你只需要在资源文件夹里修改一次 Prefab，场景中所有的 100 个实例会**瞬间同步**。

**动态生成**

这是你代码中频繁出现的操作。`Instantiate(enemyPrefab, position, rotation)` 的本质是：

1. **查找图纸**：找到 `enemyPrefab` 存储的组件配置信息。
2. **分配内存**：在 **Native Heap (C++)** 申请物理/渲染内存，在 **Managed Heap (C#)** 申请脚本内存。
3. **反序列化**：把图纸上的参数（如 `speed=5`）填入新对象的内存中。

# 对象池

 在项目Demo中，实例化预制体有两个地方。

一个是玩家Shoot时会Instantiate一个arrowprefab的预制体。

一个是在Enemy_Spawner脚本中，当玩家进入了一个为trigger的碰撞范围时，会实例化很多怪物。

那么如果常见里有很多弓箭和很多怪物 可能就相当于C++在不断的new会非常卡顿。

用 C++ 的视角来看，频繁调用 `Instantiate` 和 `Destroy` 就像是在高频循环里不断执行 `new` 和 `delete`。

## 什么是对象池？

**核心思想：回收再利用。**

与其每次要用时“造新房子（new）”，不用时“拆掉房子（delete）”，不如造一个“仓库（池子）”。

- **需要时**：先去仓库看有没有空闲的旧房子，有就搬出来用，没有再造新的。
- **不用时**：不拆掉，而是把房子打扫干净（重置状态），关灯关门（SetActive(false)），放回仓库。

## 对象池的底层工作流程

**普通方式：**

1. **玩家按键**：`new Arrow` -> 分配内存 -> 初始化组件 -> 运行。
2. **箭飞远了**：`delete Arrow` -> 释放底层内存 -> 产生内存碎片 -> **触发 GC 扫描** -> 游戏卡顿。

**对象池方式：**

1. **玩家按键**：询问池子：“有空闲的箭吗？”
2. **取出**：如果有，拿出一支，执行 `arrow.SetActive(true)`，重置它的坐标。
3. **箭飞远了**：不销毁！执行 `arrow.SetActive(false)`，把它“放回”池子的 `Queue` 或 `List` 中。

在Demo中实现一个简单的对象池：

对象池本质上就是一个 `std::queue` 或 `std::vector`。

## 箭矢对象池

```c#
using System.Collections.Generic;
using UnityEngine;

public class ObjectPool : MonoBehaviour
{
    public static ObjectPool Instance; // 单例，方便全局调用
	
    //SerializeField的作用是让private字段在Inspector面板中可见并编辑
    //为了拖入arrowPrefab
	//为了输入池子大小
    [SerializeField] private GameObject arrowPrefab;
    [SerializeField] private int poolSize = 10;

    // 仓库：存储所有生成的箭
    private Queue<GameObject> arrowPool = new Queue<GameObject>();

    private void Awake() { Instance = this; }

    private void Start()
    {
        // 预载：游戏开始先 new 10支箭备用（摊平开销）
        for (int i = 0; i < poolSize; i++)
        {
            GameObject obj = Instantiate(arrowPrefab);
            obj.SetActive(false); // 关掉
            arrowPool.Enqueue(obj); // 进仓库
        }
    }

    // 相当于“取出”
    public GameObject GetArrow()
    {
        if (arrowPool.Count > 0)
        {
            GameObject obj = arrowPool.Dequeue();
            obj.SetActive(true);
            return obj;
        }
        else
        {
            // 如果仓库空了，再临时造一个（扩容）
            return Instantiate(arrowPrefab);
        }
    }

    // 相当于“放回”
    public void ReturnArrow(GameObject obj)
    {
        obj.SetActive(false);
        arrowPool.Enqueue(obj);
    }
}
```

改动的地方：

在`Instantiate(arrowPrefab)`处改为

```c#
GameObject arrow = ObjectPool.Instance.GetArrow();
arrow.transform.position = shotPoint.position;
arrow.transform.rotation = shotPoint.rotation;
```

在`Destroy(gameObject)`处改为

```c#
// 不要销毁自己，而是把自己还给池子
ObjectPool.Instance.ReturnArrow(this.gameObject);
```

**避免内存碎片**：对象在内存中的位置是相对固定的，池子的大小趋于稳定。

**摊平 CPU 开销**：大量的 `Instantiate` 发生在游戏加载时（`Start`），而不是激烈的战斗中。

**零 GC 压力**：因为没有对象被真正销毁，垃圾回收器（GC）不会被频繁触发，游戏帧率会非常平稳。

## 怪物对象池

箭矢的对象池很简单，因为箭矢的状态单一。但**怪物**的对象池会复杂一些，因为怪物死后：

- 它的**血量**必须重置为满。
- 它的**AI状态**必须重置为 `Idle`。
- 它的**死亡事件订阅**（delegate/event）必须处理好，防止重复订阅。

为了让对象池能够通用，我们通常定义一个接口。这在 C++ 中相当于一个**纯虚基类**。

```c++
public interface IPoolable
{
    void OnSpawn();  // 从池子里出来时调用（相当于构造/初始化）
    void OnDespawn(); // 回到池子里时调用（相当于析构/清理）
}
```

需要让怪物脚本实现这个接口，确保它在“复活”时状态是对的。

`Enemy_Health.cs`

```c++
public class Enemy_Health : MonoBehaviour, IPoolable
{
    public void OnSpawn() 
    {
        currentHealth = maxHealth; // 关键：血量回满
        // 这里不需要重新订阅事件，因为事件是静态的
    }

    public void OnDespawn() 
    {
        // 如果有非静态事件，在这里取消订阅
    }

    public void ChangeHealth(int amount)
    {
        currentHealth += amount;
        if (currentHealth <= 0)
        {
            OnMonsterDefeated?.Invoke(ExpReward);
            // Destroy(gameObject); // 删掉这行！改为还给池子
            EnemyPool.Instance.ReturnEnemy(this.gameObject);
        }
    }
}
```

`Enemy_Movement.cs`

```c++
public class Enemy_Movement : MonoBehaviour, IPoolable
{
    public void OnSpawn()
    {
        ChangeState(EnemyState.Idle); // 关键：状态重置为闲置
        attackCooldownTimer = 0;      // 冷却重置
    }

    public void OnDespawn()
    {
        rb.velocity = Vector2.zero;   // 停止所有物理运动
    }
}
```

`EnemyPool.cs`

```c#
public class EnemyPool : MonoBehaviour
{
    public static EnemyPool Instance;
    public GameObject enemyPrefab;
    private Queue<GameObject> pool = new Queue<GameObject>();

    private void Awake() => Instance = this;

    public GameObject GetEnemy(Vector3 position)
    {
        GameObject obj;
        if (pool.Count > 0)
        {
            obj = pool.Dequeue();
        }
        else
        {
            obj = Instantiate(enemyPrefab);
        }

        obj.transform.position = position;
        obj.SetActive(true);

        // 关键：通知怪物身上所有的脚本“你复活了”
        foreach (var item in obj.GetComponents<IPoolable>())
        {
            item.OnSpawn();
        }
        return obj;
    }

    public void ReturnEnemy(GameObject obj)
    {
        // 关键：通知怪物身上所有的脚本“你要回仓库了”
        foreach (var item in obj.GetComponents<IPoolable>())
        {
            item.OnDespawn();
        }
        obj.SetActive(false);
        pool.Enqueue(obj);
    }
}
```

**A. 物理引擎的“残留”**

在 Unity (底层是 PhysX) 中，当你 `SetActive(false)` 一个物体时，它的物理状态（如速度、受力）会冻结。如果不手动清空 `rb.velocity`，下一次它从池子里出来时，可能会带着上次死亡时的惯性直接飞出去。

**B. 协程 (Coroutine) 的处理**

你的 `Enemy_Knockback` 用到了协程。

- **坑点**：如果怪物死的时候还在执行击退协程，直接关掉物体会导致协程中断，但如果不处理，下次出来可能会逻辑错乱。
- **对策**：在 `OnDespawn` 时调用 `StopAllCoroutines()`。

**C. 事件订阅的重复**

你在 `ExpManager` 里订阅了 `Enemy_Health.OnMonsterDefeated`。

- **好消息**：因为这个事件是 **static** 的，它订阅的是类（Class），而不是实例（Object）。所以怪物进出池子完全不影响经验系统的运作。这也是你代码架构优秀的地方——**静态事件天生兼容对象池**。

## 什么时候释放对象池

在 C++ 中，我们习惯于“谁申请，谁释放”。但在对象池（Object Pooling）模式下，**释放的时机**从“对象不再使用时”变成了**“池子不再需要时”**。

**1. 场景切换时（最常用的自动释放）**

如果你的 `ObjectPool` 挂载在场景中的某个 GameObject 上，且没有设置为 `DontDestroyOnLoad`：

- **原理**：当玩家过关、进入新地图或回到主菜单时，Unity 会销毁当前场景的所有对象。
- **内存表现**：此时，池子（`Queue`）本身被销毁，池子里存放的所有“非激活状态”的预制体实例也会被一并从**托管堆（C#）**和**原生内存（C++）**中抹除。
- **类比 C++**：这相当于一个 `std::vector` 变量超出了它的作用域（Scope），触发了其析构函数，清空了内部存储的所有指针。

**2. 动态修剪：为了防止“内存虚高”**

假设玩家在某一关遇到了“万箭齐发”的效果，池子瞬间扩充到了 1000 支箭。但后续关卡只需要 10 支。那多出来的 990 支箭会一直占用内存。

为了优化，你可以给池子增加**“定时清理”**或**“上限保护”**逻辑：

**3. 手动释放：调用垃圾回收**

如果你确定一段很长时间内不需要这些对象了（比如从“战斗场景”切换到了“对话剧情”），你可以手动清空池子。

# 动画驱动的战斗系统

在游戏Demo中，不论是怪物还是玩家攻击都是给动画控制器一个布尔值，在动画控制器的关键帧触发造成伤害的函数。那么主流的3D游戏也是这样判定的吗？

目前采用的这种做法被称为 **“动画驱动型战斗系统”**。

结论是：**这种做法在现在的主流游戏（无论是 2D 独立游戏还是 3D 3A 大作）中依然是核心主流，但它会配合其他辅助系统来实现更好的打击感和精准度。**

在 Unreal Engine（虚幻引擎）或 Unity 的高级插件中，开发者不只是用一个“点”触发函数，而是用一个“时间段”（称为 Notify State）。

- **[Start]**：开启碰撞检测，开始消耗体力。
- **[Active]**：剑刃处于致命区域，伤害生效。
- **[End]**：关闭碰撞检测，进入收招硬直（Recovery）。

在Demo中用的是`Physics2D.OverlapCircle`圆圈检测，但是在3D游戏中判定更加复杂：

**A. 射线检测 (Raycasting) —— 常用于子弹**

对于射击游戏（FPS/TPS），子弹通常**不是**物理实体，而是射线。

- **原理**：开火瞬间，从枪口沿前方射出一条无限长的线。如果线穿过了敌人的 Head 碰撞体，直接执行 `TakeDamage`。
- **优点**：极速、精准、不会穿墙，且不需要处理复杂的物理运动。

**B. 触发器检测 (Trigger/Overlap) —— 常用于近战**

类似于你的 `OverlapCircle`，3D 近战会使用 **Box** 或 **Sphere** 触发器。

- **做法**：在剑的模型上挂一个 `BoxCollider`。当动画播放到“伤害帧”时，开启这个 Collider 的 `isTrigger`。如果它碰到了敌人的 `Layer`，就触发伤害。

**C. 剑痕检测 (Weapon Trailing) —— 高端动作游戏**

对于像《鬼泣》这种动作极快的游戏，单纯的帧检测可能会因为速度太快导致“漏帧”（剑划过了敌人，但刚好那一帧检测还没到）。

- **工业级方案**：在每一帧记录剑刃上个位置和当前位置，连成一个三角形或四边形面片（Physics Shape Cast），只要敌人和这个面片有任何重叠，就算命中。

**子弹也用关键帧吗？**

- **如果是慢速子弹**（如《守望先锋》中法老之鹰的火箭弹）：**是**。在动画的发射帧 `Instantiate` 一个预制体，然后预制体自己带物理脚本飞行。
- **如果是快速子弹**（如《使命召唤》）：**不完全是**。按下按键的一瞬间就执行射线检测，但会在对应的动画帧播放枪口火光（Muzzle Flash）和后坐力动画，给玩家一种“我等子弹飞出去”的视觉错觉。

> 如果子弹是实体的话 如果子弹飞行的非常快 或者武器挥动的很快 在一帧之前它还在敌人的一侧 一帧后就到了另一侧了 这种情况下如何具体判断是否造成了伤害呢？

**1.射线检测 这种情况下不发射子弹**

**原理：** 从摄像机（或枪口）位置向正前方发射一条无限细的“激光”，返回它碰撞到的第一个物体信息。

用简单的C#代码来模拟：

```c++
public void Shoot()
{
    // 获取枪口位置和方向
    Vector3 origin = firePoint.position;
    Vector3 direction = firePoint.forward;

    // 声明一个存放碰撞信息的结构体（类似 C++ 的 struct）
    RaycastHit hit;

    // 发射射线，最大距离 100 米，只检测敌人层
    if (Physics.Raycast(origin, direction, out hit, 100f, enemyLayer))
    {
        // hit.point 是碰撞发生的空间坐标
        // hit.collider 是撞到的那个物体
        Debug.Log("击中了: " + hit.collider.name);

        // 产生击中特效（如火花）
        Instantiate(hitEffect, hit.point, Quaternion.LookRotation(hit.normal));

        // 造成伤害
        if (hit.collider.TryGetComponent<EnemyHealth>(out var health))
        {
            health.TakeDamage(damage);
        }
    }
}
```

**2.高速物体的隧道效应**

“前一帧在左边，后一帧在右边”的问题，在物理引擎中被称为 **隧道效应**。这是离散物理模拟的致命伤。

**解决方案 A：连续碰撞检测 (CCD - Continuous Collision Detection)**

Unity 的 Rigidbody 组件提供了一个选项：`Collision Detection`。

- **离散 (Discrete)**：默认值，只看每一帧的位置。快了就会“穿模”。
- **连续 (Continuous / Continuous Dynamic)**：开启后，物理引擎会在这一帧的路径上进行“扫掠”计算。
- **原理**：它不再只看点 A 和点 B，而是计算从 A 到 B 形成的一根“胶囊体”线段是否与物体相交。
- **代价**：性能开销比离散模式大得多。

**解决方案 B：厚度补偿 (Expanding Colliders)**

如果你不想开 CCD，可以将敌人的碰撞体（Hitbox）做厚一点，或者给子弹做一个很长的拖尾碰撞体。但这只是一种“偏方”，不够精准。

**3.高速近战挥砍：形状扫掠 (Shape Casting)**

对于你提到的“武器挥动过快”导致的漏判定，主流动作游戏（如《只狼》）通常不使用简单的 `OnTriggerEnter`，而是使用 **SphereCast** 或 **BoxCast**。

**原理：** 在每一帧，记录武器剑刃上个位置（上一帧）和当前位置。在它们之间做一个“空间填充”。

**逻辑流程：**

1. **记录上一帧位置**：`Vector3 lastPos`。
2. **获取当前位置**：`Vector3 currentPos`。

```c++
// 从上一帧位置向当前位置发射一个“球形射线”
float distance = Vector3.Distance(lastPos, currentPos);
Vector3 direction = (currentPos - lastPos).normalized;

// 只要这根“球管”覆盖范围内有敌人，就算命中
RaycastHit[] hits = Physics.SphereCastAll(lastPos, weaponRadius, direction, distance, enemyLayer);
```

**4. 终极方案：基于帧的射线采样 (Frame-based Sampling)**

很多 3A 级的近战系统（比如《怪物猎人》）会在剑刃上均匀分布 3-5 个“检测点”。

- 每帧计算这几个点从 `LastFramePosition` 到 `CurrentFramePosition` 的位移线段。
- 对每一根线段执行 `Raycast`。
- **优点**：计算量极小（比 CCD 快），且能完美覆盖挥砍轨迹，不会漏掉任何一个敌人。

总结：

**简单远程**：用 `Physics.Raycast`（射线）。

**实体子弹/高速物体**：开启 `Rigidbody` 的 `Continuous` 碰撞检测。

**高速近战**：不要依赖碰撞事件，改用每一帧的 `SphereCast` 或线段采样。

## 动画融合

给动画设置“布尔值”的做法，在 3D 游戏中会遇到一个巨大的挑战：**动画融合 (Animation Blending)**。

- **你的 Demo**：通常是完全替换。走就是走，打就是打。
- **3D 游戏（如《神秘海域》）**：玩家可以一边跑一边挥手，或者一边跑一边射击。
  - **技术实现**：使用 **动画混合树 (Blend Trees)** 和 **分层动画 (Layering)**。
  - **原理**：下半身跑下半身的动画，上半身根据瞄准方向进行混合叠加。

# 寻路

## A* 算法的核心原理

A* 算法本质上是在地图上寻找一条总成本最低的路径。它的核心公式是：

$$f(n) = g(n) + h(n)$$

- $g(n)$：从**起点**到当前格子的实际代价（走过的路）。
- $h(n)$：从**当前格子**到**终点**的预估代价（启发式函数，通常用曼哈顿距离或欧几里得距离）。
- $f(n)$：总期望代价。算法每次都会选择 $f$ 值最小的格子进行探索。

## 在你的 Demo 中实现 A* 的步骤

要给 `Enemy_Movement` 添加 A*，你需要三个核心组件：

#### A. 网格系统 (Grid System)

你需要将 Tilemap 区域抽象成一个二维数组，标识哪些格子是“可通行的”，哪些是“障碍物”。

#### B. A* 逻辑脚本 (Pathfinder)

这个脚本负责计算路径并返回一个坐标列表 `List<Vector3>`。

#### C. 修改 `Enemy_Movement`

怪物不再直接追玩家，而是改为：

1. 定期请求路径。
2. 沿着路径点逐个移动。

## 使用NavMesh2D实现寻路

**步骤一：配置 NavMesh**

1. 给你的 Tilemap 添加 `NavMeshModifier`。
2. 在窗口中点击 **Bake**（烘焙），生成绿色的可行走区域。

**步骤二：修改 `Enemy_Movement`**

你需要引入 `UnityEngine.AI` 命名空间，并使用 `NavMeshAgent` 组件。

```c#
using UnityEngine;
using UnityEngine.AI; // 必须引入

public class Enemy_Movement : MonoBehaviour
{
    private NavMeshAgent agent;
    private Transform player;
    // ... 原有的变量

    void Start()
    {
        agent = GetComponent<NavMeshAgent>();
        // 2D 游戏需要禁用旋转，因为 Agent 默认按 3D 逻辑旋转
        agent.updateRotation = false;
        agent.updateUpAxis = false;
        
        // 保持原有的逻辑
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        if (enemyState == EnemyState.Chasing && player != null)
        {
            // A* 寻路的核心：不再手动算速度，而是设置目标点
            agent.SetDestination(player.position);
            
            // 为了配合你原有的 Flip 逻辑，我们需要手动判断移动方向
            UpdateFacingDirection();
        }
        else
        {
            agent.ResetPath(); // 停止寻路
        }
    }

    void UpdateFacingDirection()
    {
        // 检查 agent 的期望速度 (desiredVelocity) 来判断翻转
        if (agent.desiredVelocity.x > 0 && facingDirection == -1) flip();
        else if (agent.desiredVelocity.x < 0 && facingDirection == 1) flip();
    }
}
```

# 数据持久化

常见储存格式

| **格式**            | **优点**                       | **缺点**                   | **场景**               |
| ------------------- | ------------------------------ | -------------------------- | ---------------------- |
| **PlayerPrefs**     | 极其简单，类似注册表           | 只能存简单键值对，易被篡改 | 存音量、亮度等设置     |
| **JSON**            | **最推荐**。可读性强，易于调试 | 文件体积比二进制略大       | 存背包、等级、任务进度 |
| **Binary (字节流)** | 体积小、解析快、难以直接修改   | 调试困难，版本兼容性差     | 大型 RPG 的复杂存档    |

在Demo中实现

```c#
public static void SavePlayer(StatsManager stats) {
    // 1. 将 StatsManager 的数据转成 JSON 字符串
    string json = JsonUtility.ToJson(stats);
    // 2. 写入本地文件
    File.WriteAllText(Application.persistentDataPath + "/save.json", json);
}
```

## 何时与数据库交互

**交互时机：什么时候发数据？**

你猜对了一半：**确实是在单例或管理器中收集，但绝不是“随改随发”，也不是“退出才发”。**

**A. 关键节点实时同步（最安全）**

当发生**不可逆**的重要事件时，必须立即与服务器通信：

- **获得极品装备**：掉落瞬间发包给服务器。
- **消耗代币/充值**：必须实时验证并扣除。
- **任务完成**：实时发放奖励并记录。

**B. 增量定时同步（平衡性能）**

对于像“当前血量”、“坐标”或者“普通经验值”这种高频变动但不那么致命的数据：

- 每隔 30 秒或 1 分钟，由 `StatsManager` 这样的单例整理好一份“增量包”，一次性同步给服务器。
- 这样可以减轻服务器压力，避免每一帧都去写数据库（IO 是很慢的）。

**C. 退出/场景切换（兜底机制）**

当玩家点击“退出游戏”或切换地图时，强制执行一次完整的全量同步。

在联网架构中，`StatsManager` 的职责会发生转变：

1. **作为“本地影子”**：它不再是真理的来源，而是**服务器数据的缓存**。
2. **数据流转**：
   - **Load**: 登录时，`StatsManager` 向服务器发请求 $\rightarrow$ 服务器查库 $\rightarrow$ 返回 JSON $\rightarrow$ `StatsManager` 解析并初始化 UI。
   - **Update**: 玩家升级 $\rightarrow$ `StatsManager` 本地先变数值（为了让 UI 瞬间响应，这叫**客户端预判**） $\rightarrow$ 异步发包给服务器 $\rightarrow$ 如果服务器校验失败（如发现是外挂），强制把 `StatsManager` 的数值拉回正确状态。

总结：

**单机版**：追求**简单可靠**。你可以把整个 `StatsManager` 的类直接序列化存本地。

**联网版**：追求**安全可验**。`StatsManager` 只是一个中间层，真正的持久化发生在服务器。

## 场景切换时的数据持久化

**方案 A：`DontDestroyOnLoad` (最常用的“内存保留”法)**

这是你在 Demo 中最容易实现的方案。你可以告诉 Unity：“这个对象（比如你的 `StatsManager`）是特殊的，换场景时不要销毁它。”

**代码实现：** 在你的单例脚本中添加这一行：

```c#
private void Awake()
{
    if (Instance == null)
    {
        Instance = this;
        // 关键：确保切换场景时，这个 GameObject 不会被自动删除
        DontDestroyOnLoad(gameObject); 
    }
    else
    {
        Destroy(gameObject); // 防止场景反复加载产生多个实例
    }
}
```

- **原理**：Unity 内部维护了一个特殊的“永恒场景”（DontDestroyOnLoad 场景）。调用该方法后，对象会从当前场景移入此场景。
- **缺点**：如果管理不当，容易造成内存中堆积太多不再需要的旧对象。

**方案 B：ScriptableObject (数据与表现分离)**

因为 SO 是存在于资源文件夹里的“资源文件”，它**不属于任何场景**。

**操作逻辑：**

1. 创建一个 `PlayerStatsSO`。
2. 玩家脚本在场景 A 修改这个 SO 里的数值。
3. 加载场景 B。
4. 场景 B 的 UI 脚本或玩家脚本直接读取同一个 `PlayerStatsSO`。

- **优点**：非常优雅。即使玩家物体在切换场景时被销毁了，存放在 SO 里的数据依然在内存中。这相当于 C++ 中的 **Static Data 段**。

**方案 C：即时存读档 (最稳健的“物理保留”法)**

这是处理**跨场景大规模数据**（如整个地牢的状态、掉落物位置）最稳健的方法。

**逻辑流程：**

1. **场景 A 即将退出**：触发一个 `SaveToDisk()`。将当前所有数据序列化为 JSON 存入硬盘。
2. **加载新场景**。
3. **场景 B 初始化**：触发 `LoadFromDisk()`。读取刚才那个 JSON 文件，重新恢复数值。

- **优点**：即使游戏意外崩溃，进度也不会丢失。
- **缺点**：频繁的磁盘 IO 会造成短暂的卡顿。

### 单例的自杀逻辑

你在场景 1 有个 `StatsManager`（已设置 `DontDestroyOnLoad`）。

你进入了场景 2。

**重点**：如果场景 2 的层级面板里也预先放了一个 `StatsManager`，那么此时内存里会有**两个**实例！

```c++
void Awake() {
    if (Instance != null && Instance != this) {
        Destroy(gameObject); // 发现已有旧的大佬，新的直接自毁
        return;
    }
    // ... 其余逻辑
```

| **需求场景**              | **推荐方案**                     |
| ------------------------- | -------------------------------- |
| **基础数值 (等级/金钱)**  | **DontDestroyOnLoad** 配合单例。 |
| **配置数据 (武器属性)**   | **ScriptableObject**。           |
| **关卡状态 (哪些怪死了)** | **即时存读档 (JSON)**。          |

# 状态机

Demo 中使用的 `EnemyState` 枚举配上 `switch` 或 `if-else`，其实就是最基础的 **有限状态机 **。

### 现在的状态机（动画驱动）：

你目前是“动画带逻辑”。

- **缺点**：逻辑被“锁”在了动画里。如果我想做一个“怪物被致盲了，虽然在播放攻击动画但不能产生伤害”的功能，你得去改动画事件，非常麻烦。

### 专业的状态机（逻辑驱动）：

在 3A 游戏中，通常是**“逻辑带动画”**。

- 每一个状态（Idle, Chase, Attack）都是一个独立的 **类 (Class)**。
- 状态类里有 `OnEnter()` (进入状态要做什么), `OnUpdate()` (每一帧做什么), `OnExit()` (离开时清理什么)。
- **这种做法的好处**：解耦。你可以轻松地给怪物增加一个“混乱”状态，只需新建一个类，而不需要动原来的代码。

# 行为树

**行为树是一种“决策系统”。** 从根节点开始，每帧从上往下、从左往右扫描，最终决定怪物这一秒该执行哪个动作。

状态机在处理“多任务切换”时会产生“连线地狱”。比如：怪物既要追玩家，又要躲子弹，还要在血低时找血包。用状态机连线会把人绕晕，而行为树通过**优先级**完美解决。

行为树的节点分为三类：**控制节点**、**条件节点**、**动作节点**。

**A. 顺序（序列）节点 (Sequence) —— “全部成功才算成功”**

- **逻辑**：从左到右执行子节点。只要有一个失败，整个节点立刻失败。
- **场景**：**潜行背刺**。顺序是：[检测到背后的玩家] $\rightarrow$ [靠近玩家] $\rightarrow$ [播放暗杀动画]。如果第一步没检测到，后面两步都不会走。

**B. 选择节点 (Selector) —— “只要有一个成功就算成功”**

- **逻辑**：从左到右执行。只要有一个成功，立刻停止扫描并返回成功。
- **场景**：**紧急避险**。选择是：[我有血瓶吗？吃一个] **OR** [我能逃跑吗？溜了] **OR** [实在不行就原地反击]。如果第一个“有血瓶”成功了，怪就不会逃跑。

**C. 条件节点 (Condition / Decorator) —— “我可以做吗？”**

- **逻辑**：返回 true 或 false 的叶子节点。
- **例子**：`IsPlayerInRange?`, `IsHealthLow?`。

**D. 动作节点 (Action) —— “具体的执行者”**

- **逻辑**：真正干活的。返回“正在运行”、“成功”或“失败”。
- **例子**：`MoveToPlayer`, `PlayAnimation`, `Shoot`。

假设我们要给你的 Demo 怪物做一个复杂的 AI：

1. **优先：** 如果血量低于 20%，去找血包。
2. **其次：** 如果看到玩家，去攻击。
3. **最后：** 如果啥也没有，就巡逻。

**Root (根节点)**

- **Selector (选择器)**
  - **Sequence (找血序列)**
    - Condition: `IsHealthLow?`
    - Action: `PathFindToHealthPack`
  - **Sequence (攻击序列)**
    - Condition: `CanSeePlayer?`
    - Action: `ChaseAndAttack`
  - **Action (兜底动作)**
    - Action: `Patrol`

每帧从根节点往下扫。如果血不低，第一个 Sequence 失败；接着看第二个，看到玩家了，执行追击。这样怪物看起来就非常“聪明”，且逻辑条理清晰。

可以把**行为树（Behavior Tree）看作是一个“带状态反馈的递归决策树”**。

在行为树中，每个节点执行完都会向父节点返回三个状态之一：**Success（成功）**、**Failure（失败）**、或 **Running（正在运行）**。

## 案例场景：一个“聪明”的巡逻弩兵 AI

### 巡逻兵的行为树

想让这个弩兵实现以下逻辑优先级：

1. **最高优先级**：如果没箭了，去弹药箱补给。
2. **次高优先级**：如果看到玩家，射击。
3. **最低优先级**：如果以上都没发生，就在两个点之间巡逻。

### 行为树结构示意

```c++
graph TD
    Root((Root)) --> Sel[Selector: 决策中心]
    
    Sel --> Seq1[Sequence: 补给逻辑]
    Seq1 --> Cond1{条件: 没箭了?}
    Seq1 --> Act1[动作: 移动到弹药箱]
    
    Sel --> Seq2[Sequence: 进攻逻辑]
    Seq2 --> Cond2{条件: 看到玩家?}
    Seq2 --> Act2[动作: 射击]
    
    Sel --> Act3[动作: 基础巡逻]
```

### 核心结点示意

**A. Selector (选择器) —— 逻辑“或”**

只要有一个子节点成功，它就停止并返回成功。常用于**优先级排队**。

```c#
// Selector 的底层逻辑
public Status Update() {
    foreach (var child in children) {
        var status = child.Update();
        if (status != Status.Failure) 
            return status; // 只要不是失败（成功或运行中），就向上汇报
    }
    return Status.Failure; // 全都失败了，才算失败
}
```

**B. Sequence (顺序器) —— 逻辑“与”**

必须所有子节点都成功，它才算成功。常用于**步骤拆解**。

```c#
// Sequence 的底层逻辑
public Status Update() {
    foreach (var child in children) {
        var status = child.Update();
        if (status != Status.Success) 
            return status; // 只要有一个没成功，就卡在这里或返回失败
    }
    return Status.Success; // 全都走完了，才算大功告成
}
```

### 运行模拟

假设现在**玩家出现了**，且**弩兵有箭**：

1. **Root** 询问 **Selector**。
2. **Selector** 检查第一个孩子（**补给 Sequence**）：
   - `IsAmmoEmpty?` 返回 **Failure**。
   - 补给 Sequence 立即停止并向 Selector 汇报 **Failure**。
3. **Selector** 发现第一个孩子失败了，转向第二个孩子（**进攻 Sequence**）：
   - `CanSeePlayer?` 返回 **Success**。
   - 接着执行 `ShootAction`。如果正在拉弓，返回 **Running**。
4. **Selector** 收到 **Running**，立即向 Root 汇报：“我正在忙（进攻中）”，且**不再执行**后面的“巡逻”节点。

**总结：**

- **状态机**：我在哪个状态？（状态是平级的，适合动作切换）。
- **行为树**：我该做什么？（逻辑是有优先级的，适合复杂决策）。

| 行为树         | 状态机       |
| -------------- | ------------ |
| 结构清晰       | 状态爆炸     |
| 易扩展         | 逻辑容易乱   |
| 条件和行为分离 | 状态切换复杂 |