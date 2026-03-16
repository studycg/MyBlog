# 可脚本化技能SkillSO

```c++
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[CreateAssetMenu(fileName = "newSkill", menuName = "SkillTree/Skill")]
public class SkillSO : ScriptableObject
{
    public string skillName;
    public int maxLevel;
    public Sprite skillIcon;
}
```

# 技能槽SkillSlot

```c++
using System.Collections;
using System.Collections.Generic;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System;

public class SkillSlot : MonoBehaviour
{
    public List<SkillSlot> prerequisiteSkillSlots;
    public int currentLevel;
    public bool isUnlocked;
    public TMP_Text skillLevelText;
    public Button skillButton;

    public SkillSO skillSO;
    public Image skillIcon;

    public static event Action<SkillSlot> OnAbilityPointSpent;
    public static event Action<SkillSlot> OnSkillMaxed;

    private void OnValidate()
    {
        if (skillSO != null && skillLevelText != null)
        {
            updateUI();
        }
    }

    public void TryUpgradeSkill()
    {
        if (isUnlocked && currentLevel < skillSO.maxLevel)
        {
            currentLevel++;
            //将这个特定的技能槽传递给所有正在监听的脚本
            //传入的是this所以管理器知道哪个技能槽在发送消息
            OnAbilityPointSpent?.Invoke(this);
            if (currentLevel >= skillSO.maxLevel)
            {
                OnSkillMaxed?.Invoke(this);
            }
            updateUI();
        }
    }

    public bool CanUnlockSkill()
    {
        foreach (SkillSlot slot in prerequisiteSkillSlots)
        {
            if (!slot.isUnlocked || slot.currentLevel < slot.skillSO.maxLevel)
            {
                return false;
            }
        }

        return true;
    }

    public void Unlock()
    {
        isUnlocked = true;
        updateUI();
    }

    private void updateUI()
    {
        skillIcon.sprite = skillSO.skillIcon;
        if (isUnlocked)
        {
            skillButton.interactable = true;
            skillLevelText.text = currentLevel.ToString() + "/" + skillSO.maxLevel.ToString();
            skillIcon.color = Color.white;
        }
        else
        {
            skillButton.interactable = false;
            skillLevelText.text = "Locked";
            skillIcon.color = Color.grey;

        }
    }
}
```

### 递归式的“前置要求”检查

- **`List<SkillSlot> prerequisiteSkillSlots`**：每个技能槽都持有它上方“前置技能”的列表。
- **`CanUnlockSkill()`**：这个方法会遍历所有前置技能。只有当前置技能**全部解锁**且**全部满级**时，该技能才具备解锁资格。
- **技术价值**：这种设计允许你创建非常复杂的技能网（例如：必须学满“力量”和“敏捷”才能学“剑术”）。

### 编辑器实时预览

这是一个非常贴心的开发小技巧：

- **`OnValidate()`**：这是一个 Unity 生命周期钩子。当你还在编辑器（Editor）里往这个脚本里拖放 `SkillSO` 或修改初始等级时，UI（图标、文字）会**立刻自动刷新**。
- **好处**：你不需要运行游戏就能看到技能面板长什么样，极大提高了调整 UI 的效率。

### 事件驱动的升级反馈

你使用了 `static event Action<SkillSlot>`，这和你之前的 `ExpManager` 风格一致：

- **`OnAbilityPointSpent`**：当点击升级按钮时，它会告诉“技能点管理器”（通常是你的 `SkillTreeManager`）：“嘿，我花掉了一点！”
- **`OnSkillMaxed`**：当等级达到 `skillSO.maxLevel` 时发出的信号。这可以用来解锁它下方的所有后继技能。
- **参数传递 `(this)`**：你通过传递 `this`（当前技能槽对象），让监听者知道到底是哪个技能发生了变化。

# 技能树管理SkillTreeManager

```c#
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;

public class SkillTreeManager : MonoBehaviour
{
    public SkillSlot[] skillSlots;
    public TMP_Text pointsText;

    public int availablePoints;

    private void OnEnable()
    {
        //每当监听到这个消息时候就调用handle方法
        SkillSlot.OnAbilityPointSpent += HandleAbilityPointsSpent;
        SkillSlot.OnSkillMaxed += HandleSkillMaxed;
        ExpManager.OnLevelUp += UPdateAbilityPoints;
    }
    private void OnDisable()
    {
        SkillSlot.OnAbilityPointSpent -= HandleAbilityPointsSpent;
        SkillSlot.OnSkillMaxed -= HandleSkillMaxed;
        ExpManager.OnLevelUp -= UPdateAbilityPoints;
    }

    private void HandleAbilityPointsSpent(SkillSlot skillSlot)
    {
        if (availablePoints > 0)
        {
            UPdateAbilityPoints(-1);
        }

    }

    private void HandleSkillMaxed(SkillSlot skillSlot)
    {
        foreach (SkillSlot slot in skillSlots)
        {
            if (!slot.isUnlocked && slot.CanUnlockSkill())
            {
                slot.Unlock();
            }
        }
    }

    private void Start()
    {
        foreach (SkillSlot slot in skillSlots)
        {
            //如果点击按钮 那么应该告诉对应的特定槽位 尝试升级其技能
            slot.skillButton.onClick.AddListener(() => CheckAvailablePoints(slot));
        }
        UPdateAbilityPoints(7);
    }

    private void CheckAvailablePoints(SkillSlot slot)
    {
        if (availablePoints > 0)
        {
            slot.TryUpgradeSkill();
        }
    }

    public void UPdateAbilityPoints(int amount)
    {
        availablePoints += amount;
        pointsText.text = "Points:" + availablePoints.ToString();
    }
}
```

### 事件驱动的资源管理

这是你架构中最亮眼的地方：它通过**订阅机制**实现了完全的解耦。

- **技能点来源**：它监听了 `ExpManager.OnLevelUp`。每当玩家升级，该脚本会自动调用 `UPdateAbilityPoints` 增加点数。
- **技能点消耗**：它监听了 `SkillSlot.OnAbilityPointSpent`。每当一个技能槽位成功升级，该脚本会自动扣除点数并更新 UI。
- **这种设计的精妙之处**：`ExpManager` 不需要知道技能树的存在，它只管发“我升级了”的消息，而 `SkillTreeManager` 默默听着并加点。

### 动态 UI 绑定

在 `Start()` 方法中，你使用了一个非常灵活的处理方式：

- **匿名函数 (Lambda)**：通过 `() => ...`，你不需要为每个按钮单独写代码。脚本会遍历 `skillSlots` 数组，给每个按钮自动绑定“检查点数并尝试升级”的逻辑。
- **安全性检查**：`CheckAvailablePoints` 确保了即使玩家疯狂点击按钮，只要 `availablePoints` 为 0，就绝不会触发 `TryUpgradeSkill`。

### 技能树的“连锁反应”

这是实现“树状结构”的关键：

- **`HandleSkillMaxed`**：当某一个技能升满级时，它会触发此方法。
- **全量扫描**：它会遍历**所有**的技能槽位（`foreach (SkillSlot slot in skillSlots)`），并询问：“现在由于刚才那个技能满了，你（新槽位）符合解锁条件了吗？”
- **解锁传播**：一旦某个新槽位的 `CanUnlockSkill()` 返回 true，它就会被 `Unlock()`。这实现了“点满 A，B 变亮”的视觉和逻辑反馈。