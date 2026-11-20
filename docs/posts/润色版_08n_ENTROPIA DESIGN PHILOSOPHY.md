# ENTROPIA DESIGN PHILOSOPHY

> 首发日期：2026-09-10

> 润色说明：仅调整语言衔接和段落排版，观点与论证按原稿保留。

> Complexity within. Clarity without.

---

## 01. PURPOSE

Everything must have a reason. 不为装饰而设计，每一个元素都应该解决问题。

---

## 02. CLARITY

Make the important obvious. 重要的信息突出，不重要的信息退后。

---

## 03. INVISIBLE COMPLEXITY

Put complexity where it belongs. 系统承担复杂性，不要把复杂性转嫁给用户。

---

## 04. DIRECTNESS

Minimize the distance between intention and result. 优先：

```txt
Intention → Action → Result
```

而不是：

```txt
Intention → Menu → Setting → Action → Result
```

---

## 05. RESTRAINT

Never decorate what can be explained by design. 不为了"高级感"添加无意义渐变、阴影、玻璃、发光、动画。设计应该来自结构，而不是装饰。

---

## 06. PRECISION

Correctness before spectacle. 宁可简单而准确，不要华丽但错误。

---

## INTERFACE

### 07. CANVAS FIRST

Content is the space. Interface is a set of objects living within it. 内容应该拥有空间，UI 不应该用传统的边框、工具栏和面板包围内容。

### 08. FLOATING INTERFACE

主要工具采用 Floating Island。传统：

```txt
Top Bar
```

ENTROPIA：

```txt
Canvas
      +
Floating Command Island
```

工具应该存在于空间中，而不是成为窗口的固定边框。

### 09. INFORMATION COMPRESSION

信息拥有不同分辨率：

```txt
Invisible
   ↓
Circle
   ↓
Capsule
   ↓
Surface
```

简单状态保持安静，需要时再展开。

### 10. TRANSFORMATION

A does not disappear and B does not appear. A becomes B. 例如：

```txt
Circle
   ↓
Capsule
   ↓
Panel
```

界面状态应该连续变化，而不是不断弹出新的 UI。

### 11. MOTION

Motion is not decoration. Motion is explanation. 动画应该解释来源、去向、状态变化、因果关系。如果动画没有解释作用，就不需要存在。

---

## HARDWARE + SOFTWARE

### 12. ONE SYSTEM

Hardware and software are one system. 产品不是：

```txt
Hardware + Software
```

而是：

```txt
One System
├── Hardware
├── Software
├── Interaction
├── Motion
└── Feedback
```

### 13. HARDWARE FIRST WHEN APPROPRIATE

When hardware can do it better, software gets out of the way. 实体旋钮就不要模拟一个旋钮，实体按键就不要强迫用户打开菜单。物理结构已经提供的能力，软件不应该重复制造。

### 14. SOFTWARE FIRST WHEN APPROPRIATE

When software can do it better, hardware stays out of the way. 复杂信息、搜索、参数和动态内容交给软件，不要为了"硬件感"堆砌物理按钮。

### 15. SHARED STATE

Hardware state = Software state. 硬件与软件应该表达同一个系统状态。一次操作可以同时产生：

```txt
Physical
   +
Haptic
   +
Audio
   +
Visual
```

它们不是四个反馈，它们是一次交互。

### 16. PHYSICAL ↔ DIGITAL

硬件可以控制软件，软件也应该理解硬件。例如：

```txt
Physical Dial
     ↓
Parameter changes
     ↓
Capsule appears
     ↓
Value updates
     ↓
Capsule disappears
```

软件让硬件变得可理解，硬件让软件变得可触摸。

---

## DESIGN LANGUAGE

### 17. SHAPE

核心形态：

```txt
Circle
   ↓
Capsule
   ↓
Surface
```

形状本身表达信息状态。

### 18. SPACE

Space is part of information architecture. 位置、距离、大小和运动都应该表达关系。

### 19. ATTENTION

Attention is a limited resource. 动画、通知、颜色、声音都在消耗注意力。默认状态应该安静，系统只有在真正需要时才打扰用户。

### 20. CONSISTENCY

Everything belongs to one world. 软件、硬件、网页、PPT、文档、包装：不是长得一样，而是遵循同一套原则。

---

## FINAL

ENTROPIA 不追求"极简外观"。追求的是：

```txt
Complex System
      ↓
Simple Interaction
      ↓
Clear Result
```

系统内部可以极其复杂，用户不应该被迫理解这些复杂性。

---

> Complexity within.
>
> Clarity without.
>
> The interface is not the system.
>
> It is the visible expression of the system.

## 待作者核查

未新增核查项。
