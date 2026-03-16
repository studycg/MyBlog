# 玩家移动功能

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEditor.Tilemaps;
using UnityEngine;

public class Playermovement : MonoBehaviour
{

    public Rigidbody2D rb;
    public Animator anim;
    public int facedirection = 1;

    public PlayerCombat player_combat;
    private bool isKnotedBack;
    public bool isShooting;


    private void Update()
    {
        if (Input.GetButtonDown("Slash") && player_combat.enabled == true)
        {
            player_combat.Attack();
        }
    }

    //实现玩家移动
    void FixedUpdate()
    {
        if (isShooting == true)
        {
            rb.velocity = Vector2.zero;
        }
        else if (isKnotedBack == false)
        {
            float horizontal = Input.GetAxis("Horizontal");
            float vertical = Input.GetAxis("Vertical");

            if (horizontal > 0 && transform.localScale.x < 0 ||
                horizontal < 0 && transform.localScale.x > 0)
            {
                Flip();
            }

            anim.SetFloat("horizontal", Mathf.Abs(horizontal));
            anim.SetFloat("vertical", Mathf.Abs(vertical));

            rb.velocity = new Vector2(horizontal, vertical) * StatsManager.Instance.speed;
        }
    }
	
    //实现角色翻转
    void Flip()
    {
        facedirection *= -1;
        transform.localScale = new Vector3(-1 * transform.localScale.x, transform.localScale.y, transform.localScale.z);
    }
	
    //计算敌人指向玩家的方向向量
    public void Knockback(Transform enemy, float force, float stunTime)
    {
        isKnotedBack = true;
        Vector2 direction = (transform.position - enemy.position).normalized;
        rb.velocity = direction * force;
        StartCoroutine(KnockbackCounter(stunTime));
    }
	
    //协程实现计时器
    IEnumerator KnockbackCounter(float stumTime)
    {
        yield return new WaitForSeconds(stumTime);
        rb.velocity = Vector2.zero;
        isKnotedBack = false;
    }
}
```

### 移动逻辑与输入处理

你的移动逻辑放在了 `FixedUpdate` 中，这非常符合物理更新的规范（因为你操作的是 `Rigidbody2D`）。

- **八方向移动**：通过 `Input.GetAxis` 获取水平和垂直输入。由于直接将 `(horizontal, vertical)` 赋值给 `rb.velocity`，这通常用于**俯视角（Top-down）**游戏。
- **速度管理**：你使用了 **单例模式 (`StatsManager.Instance.speed`)** 来控制速度。这意味着玩家的速度是由一个全局的状态管理器统一控制的，方便实现后期升级速度或减速 Buff。
- **动作锁定**：脚本中存在状态优先级判定。如果 `isShooting`（射击中）为真，角色会强制静止（速度归零）；如果 `isKnotedBack`（击退中），则屏蔽玩家的输入控制。

### 角色翻转

你使用了一种简单高效的缩放（Scale）翻转法：

- 通过将 `transform.localScale.x` 乘以 `-1` 来实现镜像。
- 同时维护了一个 `facedirection` 变量（1 或 -1），这个变量通常会被其他脚本（如射击脚本）引用，用来决定子弹发射的方向。

### 击退系统

这是一个典型的受击反馈实现：

- **向量计算**：使用 `(transform.position - enemy.position).normalized` 计算从敌人指向玩家的方向向量。
- **协程处理（Coroutine）**：使用了 `KnockbackCounter` 协程。当玩家被击退时，开启一个计时器，在 `stunTime`（眩晕时间）结束后重置速度并交还移动控制权。

### 动画与战斗衔接

- **动画参数**：脚本通过 `anim.SetFloat` 向 Animator 传参。注意这里使用了 `Mathf.Abs()`，这意味着无论向左还是向右走，Animator 接收到的都是正数，你可能在动画机里设置了基于 `Speed > 0.1` 的转换条件。
- **输入监听**：在 `Update` 中监听 `"Slash"`（斩击）输入。这体现了 Unity 的最佳实践：**在 `Update` 捕捉瞬时按键点击，在 `FixedUpdate` 处理持续的物理位移**。