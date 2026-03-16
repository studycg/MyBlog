# 敌人移动

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR;

public class Enemy_Movement : MonoBehaviour
{
    public float attackRange = 2;
    public float speed;
    public float attackCooldown = 2;

    public float PlayerDetectRange = 10;
    public Transform detectionPoint;
    public LayerMask playerLayer;

    private float attackCooldownTimer;

    private Rigidbody2D rb;
    private Transform player;
    private int facingDirection = -1;
    private Animator anim;
    private EnemyState enemyState;
    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        anim = GetComponent<Animator>();
        ChangeState(EnemyState.Idle);
    }

    void Update()
    {
        if (enemyState != EnemyState.Knockback)
        {
            CheckForPlayer();
            if (attackCooldownTimer > 0)
            {
                attackCooldownTimer -= Time.deltaTime;
            }

            if (enemyState == EnemyState.Chasing)
            {
                Chase();
            }
            else if (enemyState == EnemyState.Attack)
            {
                rb.velocity = Vector2.zero;
            }
        }
    }


    void Chase()
    {
        if (player.position.x > transform.position.x && facingDirection == -1 ||
                      player.position.x < transform.position.x && facingDirection == 1)
        {
            flip();
        }
        Vector2 direction = (player.position - transform.position).normalized;
        rb.velocity = direction * speed;
    }

    //OnTriggerEnter改为OntriggerStay
    private void CheckForPlayer()
    {
        Collider2D[] hits = Physics2D.OverlapCircleAll(detectionPoint.position, PlayerDetectRange, playerLayer);
        if (hits.Length > 0)
        {
            player = hits[0].transform;
            //如果视野内有玩家并在攻击范围内
            if (Vector2.Distance(transform.position, player.position) < attackRange && attackCooldownTimer <= 0)
            {
                attackCooldownTimer = attackCooldown;
                ChangeState(EnemyState.Attack);
            }
            else if (Vector2.Distance(transform.position, player.position) > attackRange && enemyState != EnemyState.Attack)
            {
                ChangeState(EnemyState.Chasing);
            }
        }
        else
        {
            rb.velocity = Vector2.zero;
            ChangeState(EnemyState.Idle);
        }
    }

    private void flip()
    {
        facingDirection *= -1;
        transform.localScale = new Vector3(-1 * transform.localScale.x, transform.localScale.y, transform.localScale.z);
    }

    public void ChangeState(EnemyState newState)
    {
        //退出当前动画
        if (enemyState == EnemyState.Idle)
        {
            anim.SetBool("isIdle", false);
        }
        else if (enemyState == EnemyState.Chasing)
        {
            anim.SetBool("isChasing", false);
        }
        else if (enemyState == EnemyState.Attack)
        {
            anim.SetBool("isAttacking", false);
        }
        enemyState = newState;
        //更新当前动画
        if (enemyState == EnemyState.Idle)
        {
            anim.SetBool("isIdle", true);
        }
        else if (enemyState == EnemyState.Chasing)
        {
            anim.SetBool("isChasing", true);
        }
        else if (enemyState == EnemyState.Attack)
        {
            anim.SetBool("isAttacking", true);
        }
    }
}

public enum EnemyState
{
    Idle,
    Chasing,
    Attack,
    Knockback
}
```

### 有限状态机 (FSM) 架构

你定义了一个 `EnemyState` 枚举，将怪物的行为拆解为四种状态。通过 `ChangeState` 方法，你确保了状态切换时动画的平滑过渡：

- **Idle (闲置)**：玩家不在探测范围内，怪物原地待命。
- **Chasing (追逐)**：发现玩家，计算方向向量并赋予 `rb.velocity`。
- **Attack (攻击)**：进入攻击距离且冷却结束。注意你在这里执行了 `rb.velocity = Vector2.zero`，这意味着怪物在攻击时会**停下脚步**，这为玩家留出了躲避空间。
- **Knockback (击退)**：受击状态。在 `Update` 的最顶层有一个判断 `if (enemyState != EnemyState.Knockback)`，这保证了怪物在被击退时**失去 AI 控制权**，无法反击或移动。

### 玩家探测机制

你使用了 `Physics2D.OverlapCircleAll` 配合 `PlayerDetectRange`：

- **逻辑流**：先搜索指定层级 (`playerLayer`)。如果搜到了，就锁定第一个目标 (`hits[0]`)。
- **距离判定**：
  - 距离 $<$ `attackRange` $\rightarrow$ 攻击。
  - 距离 $>$ `attackRange` $\rightarrow$ 继续追逐。
- **性能考量**：你在 `Update` 中每帧调用 `CheckForPlayer`。对于少量的怪物这是没问题的，如果场景里怪物极多，以后可以考虑用协同程序 (`Coroutine`) 每 0.2 秒检测一次来优化性能。

### 物理位移与转向

- **Chase 逻辑**：使用 `(player.position - transform.position).normalized` 算出标准化的方向向量。这确保了怪物无论距离远近，移动速度都保持恒定的 `speed`。
- **自动翻转 (Flip)**：通过比较玩家与怪物的 X 轴坐标，实时调整 `localScale.x`。这保证了怪物始终“正对着”玩家进行追逐。

### 攻击冷却系统

- 使用了 `attackCooldownTimer`。
- 逻辑：在 `CheckForPlayer` 判定进入攻击范围后，只有当计时器 $\le 0$ 时才会切入 `Attack` 状态。切入后立即重置计时器。这防止了怪物紧贴玩家时造成高频连续伤害。