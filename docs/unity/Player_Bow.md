# 切换近战/远程攻击

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Change : MonoBehaviour
{
    public PlayerCombat combat;
    public Player_Bow bow;

    // Update is called once per frame
    void Update()
    {
        if (Input.GetButtonDown("ChangeEquipment"))
        {
            combat.enabled = !combat.enabled;
            bow.enabled = !bow.enabled;
        }
    }
}
```

### 开关切换逻辑

你使用了非常简洁的布尔值取反操作：`combat.enabled = !combat.enabled;`。

- **互斥效果**：由于这两个组件（近战和远程）在初始状态下应该是一个开启、一个关闭，按下 `ChangeEquipment` 键（通常映射为 `Tab` 或 `Q`）后，它们的状态会发生**反转**。
- **组件级控制**：注意你切换的是 `.enabled`（脚本组件的开关），而不是 `gameObject.SetActive`。这意味着 Player 对象依然存在，只是负责攻击的逻辑逻辑代码停止执行了。

### 2. 触发连锁反应

当你在这个脚本里切换 `bow.enabled` 时，会自动触发 `Player_Bow` 脚本里的两个生命周期函数：

- **`OnEnable` (切换到弓箭)**：自动把动画层权重设为远程层，角色进入持弓姿态。
- **`OnDisable` (切回近战)**：自动把动画层权重切回基础层，角色恢复空手或持剑姿态。

### 3. 性能与架构

- **引用依赖**：该脚本直接持有 `PlayerCombat` 和 `Player_Bow` 的引用。这是一种**硬链接**设计，虽然简单直接，但要求你在 Inspector 面板中手动拖入这两个脚本。
- **状态安全**：这种切换方式比销毁/实例化物体要高效得多（无内存抖动），非常适合频繁切换武器的游戏机制。

# 玩家射击

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Player_Bow : MonoBehaviour
{
    public Transform launchPoint;
    public GameObject arrowPrefab;
    private Vector2 aimDirection = Vector2.right;

    public float shootCoolDown = .5f;
    private float shootTimer;

    public Animator anime;
    public Playermovement playermove;

    void Update()
    {
        shootTimer -= Time.deltaTime;

        HandleAniming();
        if (Input.GetButtonDown("Shoot") && shootTimer <= 0)
        {
            playermove.isShooting = true;
            anime.SetBool("isShotting", true);
        }
    }

    private void OnEnable()
    {
        anime.SetLayerWeight(0, 0);
        anime.SetLayerWeight(1, 1);
    }
    private void OnDisable()
    {
        anime.SetLayerWeight(0, 1);
        anime.SetLayerWeight(1, 0);
    }

    private void HandleAniming()
    {
        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");
        if (horizontal != 0 || vertical != 0)
        {
            aimDirection = new Vector2(horizontal, vertical).normalized;
            anime.SetFloat("Aimx", aimDirection.x);
            anime.SetFloat("Aimy", aimDirection.y);
        }

    }

    public void Shoot()
    {
        if (shootTimer <= 0)
        {
            shootTimer = shootCoolDown;
            Arrow arrow = Instantiate(arrowPrefab, launchPoint.position, Quaternion.identity).GetComponent<Arrow>();
            arrow.direction = aimDirection;
        }
        anime.SetBool("isShotting", false);
        playermove.isShooting = false;
    }
}
```

### 动画层切换

这是脚本中最精妙的部分。通过 `OnEnable` 和 `OnDisable`，你实现了角色状态的彻底切换：

- **启用弓箭时**：将第 0 层（Base Layer，近战攻击）权重设为 0，将第 1 层（远程攻击）权重设为 1。
- **好处**：这允许你为“持弓”状态设计一套完全不同的动画，而不需要在基础状态机里连出无数条复杂的线。

### 8 方向瞄准系统

- **输入处理**：使用 `Input.GetAxisRaw`（无缓冲输入）获取水平和垂直值。
- **向量标准化**：通过 `.normalized` 确保无论你指向哪个方向，瞄准向量的长度始终为 1，防止对角线发射速度过快。
- **混合树 (Blend Tree)**：你将 `aimDirection.x` 和 `y` 传给了动画机的 `Aimx` 和 `Aimy` 参数。这暗示你在 Animator 里使用了一个 **2D Freeform Directional 混合树**，根据玩家的输入方向自动切换向上、下、左、右或斜向的瞄准动作。

### 动作锁定与同步

- **状态互斥**：在按下“Shoot”键后，你立刻设置了 `playermove.isShooting = true`。结合之前的 `PlayerMovement` 脚本，这会导致角色在射击瞬间**原地站住**，增加了射击的仪式感和风险。
- **动画事件驱动**：和近战脚本一样，实际的 `Shoot()` 方法（实例化箭矢）也是通过动画事件触发的。只有当动画播到“放弦”的那一帧，箭才会生成，并在执行完后将 `isShooting` 重置为 `false`，解开移动锁定。

### 箭矢实例化

- **生成逻辑**：在 `launchPoint`（发射点）生成 `arrowPrefab`。
- **数据传递**：生成后立即获取 `Arrow` 组件，并将计算好的 `aimDirection` 传给它。这意味着箭矢的飞向是完全由发射那一刻玩家的输入决定的。