# 玩家战斗功能

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerCombat : MonoBehaviour
{
    public Transform attackPoint;
    public LayerMask enemyLayer;

    public Animator anime;
    public float cooldown = 2;
    private float timer;

    private void Update()
    {
        if (timer > 0)
        {
            timer -= Time.deltaTime;
        }
    }
    public void Attack()
    {
        if (timer <= 0)
        {
            anime.SetBool("isAttacking", true);

            timer = cooldown;
        }

    }

    public void DealDamage()
    {
        Collider2D[] enemies = Physics2D.OverlapCircleAll(attackPoint.position, StatsManager.Instance.weaponRange, enemyLayer);
        if (enemies.Length > 0)
        {
            enemies[0].GetComponent<Enemy_Health>().ChangeHealth(-StatsManager.Instance.damage);
            enemies[0].GetComponent<Enemy_Knockback>().Knockback(transform, StatsManager.Instance.knockbackForce, StatsManager.Instance.knockbackTime, StatsManager.Instance.stunTime);
        }
    }

    public void FinishAttack()
    {
        anime.SetBool("isAttacking", false);
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(attackPoint.position, StatsManager.Instance.weaponRange);
    }
}
```

### 核心战斗流程：解耦与触发

这段代码最关键的技术细节在于：**攻击的动作和实际伤害判定是分离的**。

- **`Attack()` 方法**：仅负责开启冷却计时器（Cooldown）并触发动画状态机中的 `isAttacking` 布尔值。
- **`DealDamage()` 方法**：这是最核心的细节。它**没有在 `Update` 中被调用**，这意味着你当时在 Unity 的 **Animation 窗口**中，在攻击动画的特定帧（比如挥剑到最前方的时刻）添加了一个 **Animation Event（动画事件）** 来手动调用这个方法。
- **`FinishAttack()` 方法**：同样是通过动画事件（通常在动画最后一帧）调用的，用来重置动画状态，防止角色卡在攻击姿态。

### 伤害判定机制

你使用了 `Physics2D.OverlapCircleAll` 来检测敌人：

- **检测范围**：以 `attackPoint`（通常挂在武器尖端或角色前方的空物体）为圆心，半径取自 `StatsManager.Instance.weaponRange`。
- **图层过滤**：使用了 `enemyLayer`，这保证了攻击只对敌人生效，不会误伤自己或墙壁。
- **单体伤害逻辑**：虽然你获取了 `enemies` 数组，但代码中通过 `enemies[0]` 只对第一个检测到的敌人造成伤害。这意味着你的游戏当时被设计为**单体攻击**，而不是群体割草。

### 属性挂钩与反馈

这个脚本高度依赖 `StatsManager`（单例模式）：

- **数值同步**：伤害值 (`damage`)、攻击距离 (`weaponRange`)、击退力 (`knockbackForce`) 全部实时从全局管理器读取。
- **受击反馈**：成功命中后，同时调用了敌人的两个组件：
  1. `Enemy_Health`: 扣除血量。
  2. `Enemy_Knockback`: 执行击退。这与你 `PlayerMovement` 里的击退逻辑相呼应，形成了一套完整的动作反馈闭环。

### 调试可视化

- **`OnDrawGizmosSelected`**：这是一个非常专业且实用的习惯。它在 Unity 编辑器中绘制了一个红色的线框球（`DrawWireSphere`）。这样你在调整 `StatsManager` 里的攻击距离时，不需要运行游戏就能在 Scene 窗口直观看到攻击范围。