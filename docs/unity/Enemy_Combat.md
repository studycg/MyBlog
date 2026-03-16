# 敌人攻击

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Enemy_Combat : MonoBehaviour
{
    public int damage = 1;
    public Transform attckPoint;
    public float weaponRange;
    public float knockbackForce;
    public float stunTime;
    public LayerMask playerLayer;

    //敌人能攻击了 一碰就受伤注释了
    /*private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.tag == "Player")
        { collision.gameObject.GetComponent<PlayerHealth>().changeHealth(-damage); }
    }*/

    public void Attack()
    {
        Collider2D[] hits = Physics2D.OverlapCircleAll(attckPoint.position, weaponRange, playerLayer);
        if (hits.Length > 0)
        {
            hits[0].GetComponent<PlayerHealth>().changeHealth(-damage);
            hits[0].GetComponent<Playermovement>().Knockback(transform, knockbackForce, stunTime);
        }
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.red;
        Gizmos.DrawWireSphere(attckPoint.position, weaponRange);
    }
}
```

### 攻击方式的进化（从 Collision 到 Overlap）

代码中被注释掉的部分 `OnCollisionEnter2D` 是初学者常用的“碰一下就扣血”。而你现在使用的是 `Attack()` 方法配合 `Physics2D.OverlapCircleAll`。

- **技术细节**：这意味着怪物的攻击不再是随时的，而是受 **动画驱动** 的。只有当怪物的攻击动画播放到特定帧，触发了 `Attack()` 动画事件时，系统才会去检测 `attckPoint` 圆圈范围内是否有玩家。
- **打击反馈**：一旦判定成功，它会同时调用玩家的两个组件：
  1. `PlayerHealth.changeHealth(-damage)`：扣除血量。
  2. `Playermovement.Knockback(...)`：给玩家施加物理位移，产生受击硬直。

### 攻击范围的可视化

你保留了和玩家攻击脚本一样的 `OnDrawGizmosSelected` 习惯。

- **作用**：在 Scene 窗口中，你会看到怪物前方有一个红色的线框圆圈。这极大地方便了你调整怪物的攻击距离（`weaponRange`），确保怪物的攻击范围与它的动画表现（比如挥爪或劈砍）相匹配。

### 玩家受击逻辑

当怪物的 `Attack()` 命中时，它调用了 `Playermovement.Knockback`。

- **回忆细节**：结合你最开始提供的 `Playermovement` 脚本，玩家在被怪物击退时，`isKnotedBack` 会被设为 `true`。这意味着玩家在那一小段时间内**无法通过键盘控制移动**。这增加了游戏的挑战性，让玩家必须学会躲避怪物的攻击动作。