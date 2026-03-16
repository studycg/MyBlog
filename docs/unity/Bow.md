# 弓箭脚本

```c#
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Arrow : MonoBehaviour
{
    public Rigidbody2D rb;
    public Vector2 direction = Vector2.right;
    public float lifeSpawn = 2;
    public float speed;

    public LayerMask enemyLayer;
    public LayerMask obstacleLayer;

    public SpriteRenderer sr;
    public Sprite buriedSprite;

    public int damage;
    public float knockbackForce;
    public float knockbackTime;
    public float stunTime;

    void Start()
    {
        rb.velocity = direction * speed;
        RotateArrow();
        Destroy(gameObject, lifeSpawn);
    }

    private void RotateArrow()
    {
        float angle = Mathf.Atan2(direction.y, direction.x) * Mathf.Rad2Deg;
        transform.rotation = Quaternion.Euler(new Vector3(0, 0, angle));
    }

    public void OnCollisionEnter2D(Collision2D collision)
    {
        if ((enemyLayer.value & (1 << collision.gameObject.layer)) > 0)
        {
            AttachToTarget(collision.gameObject.transform);
            collision.gameObject.GetComponent<Enemy_Health>().ChangeHealth(-damage);
            collision.gameObject.GetComponent<Enemy_Knockback>().Knockback(transform, knockbackForce, knockbackTime, stunTime);
        }
        else if ((obstacleLayer.value & (1 << collision.gameObject.layer)) > 0)
        {
            AttachToTarget(collision.gameObject.transform);

        }
    }

    private void AttachToTarget(Transform target)
    {
        sr.sprite = buriedSprite;
        rb.velocity = Vector2.zero;
        rb.isKinematic = true;//不再碰撞
        transform.SetParent(target);
    }

    // Update is called once per frame
    void Update()
    {
    }
}
```

### 飞行与转向逻辑 (Mathf.Atan2)

脚本在 `Start` 时完成了两件重要的事情：

- **速度赋予**：直接给 `Rigidbody2D` 设置速度。由于 `direction` 在实例化时已由 `Player_Bow` 传入并标准化，箭矢会笔直飞出。
- **角度修正 (`RotateArrow`)**：这是一个经典数学技巧。使用 `Mathf.Atan2(y, x)` 计算出向量的角度，并将其转换为角度制（Degree）。
  - **作用**：这保证了箭矢的图片总是“头朝前”飞行的。无论你向哪个方向射击，箭矢都会自动旋转到正确的角度。

### 独特的“钉入”机制 (AttachToTarget)

你实现了一个非常细腻的效果，让箭矢射中目标后看起来“插”在上面：

- **视觉切换**：将 `sr.sprite` 换成了 `buriedSprite`（埋入后的贴图）。这通常是一张更短、看起来只露出一截箭羽的图。
- **物理冻结**：
  - `rb.velocity = Vector2.zero`：瞬间停止移动。
  - `rb.isKinematic = true`：让箭矢脱离物理模拟，不再发生碰撞。
- **父子化 (Parenting)**：执行 `transform.SetParent(target)`。
  - **核心效果**：如果射中移动的敌人，箭矢会作为敌人的子物体，**跟着敌人一起移动**，增加了极强的代入感。

### 碰撞检测与位运算

你使用了更底层的 **LayerMask 位运算** 来判断撞击目标：

- **判断逻辑**：`(enemyLayer.value & (1 << collision.gameObject.layer)) > 0`。
  - 这种写法比 `CompareTag` 更高效，可以同时让一个物体属于多个层级或批量处理。
- **双重判定**：
  - 如果撞到 `enemyLayer`：先执行钉入，再调用敌人的 `ChangeHealth` 和 `Knockback`。
  - 如果撞到 `obstacleLayer`（如墙壁）：仅执行钉入逻辑，箭矢会插在墙上。

### 生命周期管理

- **`Destroy(gameObject, lifeSpawn)`**：你在 `Start` 里就给箭矢下达了“死期”。即使没射中任何东西，2秒后（`lifeSpawn`）它也会自动消失，防止场景里积压过多的无效物体（防止内存泄漏）。