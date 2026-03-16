# 敌人被击退

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Enemy_Knockback : MonoBehaviour
{
    private Rigidbody2D rb;
    private Enemy_Movement enemy_movement;

    private void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        enemy_movement = GetComponent<Enemy_Movement>();
    }
    public void Knockback(Transform forcetransform, float knockbackForce, float knockbackTime, float stunTime)
    {
        enemy_movement.ChangeState(EnemyState.Knockback);
        StartCoroutine(StunTimer(knockbackTime, stunTime));
        Vector2 direction = (transform.position - forcetransform.position).normalized;
        rb.velocity = direction * knockbackForce;

    }

    IEnumerator StunTimer(float knockbackTime, float stuntime)
    {
        yield return new WaitForSeconds(knockbackTime);
        rb.velocity = Vector2.zero;
        yield return new WaitForSeconds(stuntime);
        enemy_movement.ChangeState(EnemyState.Idle);
    }
}
```

### 状态锁死机制

这个脚本最关键的行为是调用了 `enemy_movement.ChangeState(EnemyState.Knockback)`。

- **逻辑回忆**：一旦进入 `Knockback` 状态，`Enemy_Movement` 的 `Update` 逻辑就会被屏蔽。这意味着怪物在被击退期间**不会**转向、**不会**追逐玩家、也**不会**发动攻击。这为玩家提供了宝贵的输出窗口。

### 双阶段协程逻辑

你巧妙地将受击反馈拆分成了两个阶段，这让战斗手感显得非常细腻：

- **阶段一：物理位移 (Knockback Time)**
  - 脚本给 `Rigidbody2D` 施加一个向后的力。
  - `yield return new WaitForSeconds(knockbackTime)`：在这段时间内，怪物会一直保持向后滑动的速度。
- **阶段二：原地硬直 (Stun Time)**
  - `rb.velocity = Vector2.zero`：滑动停止。
  - `yield return new WaitForSeconds(stuntime)`：怪物停在原地“发呆”，无法动弹。
- **恢复阶段**：
  - 调用 `ChangeState(EnemyState.Idle)`：将控制权交还给 AI 系统。此时 AI 会重新检测玩家位置并决定是继续发呆还是再次追人。

### 向量计算与通用性

- **方向判定**：使用 `(transform.position - forcetransform.position).normalized`。
  - 如果是**近战攻击**，`forcetransform` 就是玩家。
  - 如果是**远程攻击**，`forcetransform` 就是 `Arrow`（箭矢）。
- **通用性**：这种设计非常优秀，因为怪物只关心“谁”撞了我，然后朝着反方向飞出去，不需要针对不同武器写多套逻辑。