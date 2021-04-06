# 如何设计 VNode
一个组件的产出是`VNode`，渲染器(`Renderer`)的渲染目标也是`VNode`。可见`VNode`在框架设计的整个环节中都非常重要，甚至**设计 VNode 本身就是在设计框架**，`VNode`的设计还会对后续算法的性能产生影响。本章我们就着手对`VNode`进行一定的设计，尝试用`VNode`描述各类渲染内容。

## 用 VNode 描述真实 DOM
### 描述dom
我们使用 tag 属性来存储标签的名字，用 data 属性来存储该标签的附加信息，比如 style、class、事件等，通常我们把一个 VNode 对象的 data 属性称为 VNodeData。
```js
const elementVNode = {
  tag: 'div',
  data: {
    style: {
      width: '100px',
      height: '100px',
      backgroundColor: 'red'
    }
  }
}
```
### 描述有子字节点的dom
我们使用 tag 属性来存储标签的名字，用 data 属性来存储该标签的附加信息，比如 style、class、事件等，通常我们把一个 VNode 对象的 data 属性称为 VNodeData。
```js
const elementVNode = {
  tag: 'div',
  data: null,
  children: {
    tag: 'span',
    data: null
  }
}
```
若有多个子节点，则可以把 children 属性设计为一个数组：
```js
const elementVNode = {
  tag: 'div',
  data: null,
  children: [
    {
      tag: 'h1',
      data: null
    },
    {
      tag: 'p',
      data: null
    }
  ]
}
```
除了标签元素之外，DOM 中还有文本节点，我们可以用如下 VNode 对象来描述一个文本节点：
```js
const textVNode = {
  tag: null,
  data: null,
  children: '文本内容'
}
```
上面也可以加一个text来专门放文本，这取决于你如何设计，但是**尽可能的在保证语义能够说得通的情况下复用属性，会使 VNode 对象更加轻量**，所以我们采取使用 children 属性来存储文本内容的方案。

### 用 VNode 描述抽象内容
什么是抽象内容呢？组件就属于抽象内容，比如你在 模板 或 jsx 中使用了一个组件，如下：
```html
<div>
  <MyComponent />
</div>
```
你的意图并不是要在页面中渲染一个名为 MyComponent 的标签元素，而是要渲染 MyComponent 组件所产出的内容。

但我们仍然需要使用 VNode 来描述 <MyComponent/>，并给此类用来描述组件的 VNode 添加一个标识，以便在挂载的时候有办法区分一个 VNode 到底是普通的 html 标签还是组件。

我们可以使用如下 VNode 对象来描述上面的模板：
```js
const elementVNode = {
  tag: 'div',
  data: null,
  children: {
    tag: MyComponent,
    data: null
  }
}
```
如上，用来描述组件的 VNode 其 tag 属性值引用的就是组件类(或函数)本身，而不是标签名称字符串。所以理论上：我们可以通过检查 tag 属性值是否是字符串来确定一个 VNode 是否是普通标签。

除了组件之外，还有两种抽象的内容需要描述，即 Fragment 和 Portal。我们先来了解一下什么是 Fragment 以及它所解决的问题。

```js
const Fragment = Symbol()
const fragmentVNode = {
  // tag 属性值是一个唯一标识
  tag: Fragment,
  data: null,
  children: [
    {
      tag: 'td',
      data: null
    },
    {
      tag: 'td',
      data: null
    },
    {
      tag: 'td',
      data: null
    }
  ]
}
```
如上，我们把所有 td 标签都作为 fragmentVNode 的子节点，根元素并不是一个实实在在的真实 DOM，而是一个抽象的标识，即 Fragment。

当渲染器在渲染 VNode 时，如果发现该 VNode 的类型是 Fragment，就只需要把该 VNode 的子节点渲染到页面。

> TIP  
>在上面的代码中 fragmentVNode.tag 属性的值是一个通过 Symbol 创建的唯一标识，但实际上我们更倾向于给 VNode 对象添加一个 flags 属性，用来代表该 VNode 的类型，这样更直观。

什么是 Portal 呢？  
一句话：它允许你把内容渲染到任何地方。其应用场景是，假设你要实现一个蒙层组件 <Mask/>，要求是该组件的 z-index 的层级最高，这样无论在哪里使用都希望它能够遮住全部内容，你可能会将其用在任何你需要蒙层的地方。
```html
<template>
  <div id="box" style="z-index: -1;">
    <Overlay />
  </div>
</template>
```
如上，不幸的事情发生了，在没有 Portal 的情况下，上面的 <Mask/> 组件的内容只能渲染到 id="box" 的 div 标签下，这就会导致蒙层的层级失效甚至布局都可能会受到影响。

其实解决办法也很简单，假如 <Mask/> 组件要渲染的内容不受 DOM 层级关系限制，即可以渲染到任何位置，该问题将迎刃而解。

使用 Portal 可以这样编写 <Mask/> 组件的模板：
```html
<template>
  <Portal target="#app-root">
    <div class="overlay"></div>
  </Portal>
</template>
```
其最终效果是，无论你在何处使用 <Overlay/> 组件，它都会把内容渲染到 id="app-root" 的元素下。由此可知，所谓 Portal 就是把子节点渲染到给定的目标，我们可以使用如下 VNode 对象来描述上面这段模板：
```js
const Portal = Symbol()
const portalVNode = {
  tag: Portal,
  data: {
    target: '#app-root'
  },
  children: {
    tag: 'div',
    data: {
      class: 'overlay'
    }
  }
}
```
Portal 类型的 VNode 与 Fragment 类型的 VNode 类似，都需要一个唯一的标识，来区分其类型，目的是告诉渲染器如何渲染该 VNode。

### VNode 的种类
当 VNode 描述不同的事物时，其属性的值也各不相同。比如一个 VNode 对象是 html 标签的描述，那么其 tag 属性值就是一个字符串，即标签的名字；如果是组件的描述，那么其 tag 属性值则引用组件类(或函数)本身；如果是文本节点的描述，那么其 tag 属性值为 null。

最终我们发现，不同类型的 VNode 拥有不同的设计，这些差异积少成多，所以我们完全可以将它们分门别类。

总的来说，我们可以把 VNode 分成五类，分别是：html/svg 元素、组件、纯文本、Fragment 以及 Portal：

**VNode 分类：**
  - html/svg标签
  - 组件
    - 有状态组件
      - 普通有状态组件
      - 需要被keep-alive的有状态组件
      - 已经被keep-alive的有状态组件
    - 函数式组件
  - 纯文本
  - Fragment
  - Portal  
  > 无论是普通的有状态组件还是 keepAlive 相关的有状态组件，它们都是有状态组件。所以我们在设计 VNode 时可以将它们作为一类看待。

  ### 使用 flags 作为 VNode 的标识
  既然 VNode 有类别之分，我们就有必要使用一个唯一的标识，来标明某一个 VNode 属于哪一类。同时给 VNode 添加 flags 也是 Virtual DOM 算法的优化手段之一。  

  比如在 Vue2 中区分 VNode 是 html 元素还是组件亦或是普通文本，是这样做的：
  1. 拿到 VNode 后先尝试把它当作组件去处理，如果成功地创建了组件，那说明该 VNode 就是组件的 VNode
  2. 如果没能成功地创建组件，则检查 vnode.tag 是否有定义，如果有定义则当作普通标签处理
  3. 如果 vnode.tag 没有定义则检查是否是注释节点
  4. 如果不是注释节点，则会把它当作文本节点对待  

以上这些判断都是在挂载(或patch)阶段进行的，换句话说，一个 VNode 到底描述的是什么是在挂载或 patch 的时候才知道的。这就带来了两个难题：**无法从 AOT 的层面优化、开发者无法手动优化。**  

为了解决这个问题，我们的思路是在 VNode 创建的时候就把该 VNode 的类型通过 flags 标明，这样在挂载或 patch 阶段通过 flags 可以直接避免掉很多消耗性能的判断，我们先提前感受一下渲染器的代码：
```js
if (flags & VNodeFlags.ELEMENT) {
  // VNode 是普通标签
  mountElement(/* ... */)
} else if (flags & VNodeFlags.COMPONENT) {
  // VNode 是组件
  mountComponent(/* ... */)
} else if (flags & VNodeFlags.TEXT) {
  // VNode 是纯文本
  mountText(/* ... */)
}
```
如上，采用了位运算，在一次挂载任务中如上判断很可能大量的进行，使用位运算在一定程度上再次拉升了运行时性能。  
**这就意味着我们在设计 VNode 对象时，应该包含 flags 字段**

### 枚举值 VNodeFlags
那么一个 VNode 对象的 flags 可以是哪些值呢？那就看 VNode 有哪些种类就好了，每一个 VNode 种类我们都为其分配一个 flags 值即可，我们把它设计成一个枚举值并取名为 VNodeFlags，在 javascript 里就用一个对象来表示即可：
```js

// 枚举的各个值采用位运算的左移以配合判断时的位与运算
const VNodeFlags = {
  // html 标签
  ELEMENT_HTML: 1,
  // SVG 标签
  ELEMENT_SVG: 1 << 1,

  // 普通有状态组件
  COMPONENT_STATEFUL_NORMAL: 1 << 2,
  // 需要被keepAlive的有状态组件
  COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE: 1 << 3,
  // 已经被keepAlive的有状态组件
  COMPONENT_STATEFUL_KEPT_ALIVE: 1 << 4,
  // 函数式组件
  COMPONENT_FUNCTIONAL: 1 << 5,

  // 纯文本
  TEXT: 1 << 6,
  // Fragment
  FRAGMENT: 1 << 7,
  // Portal
  PORTAL: 1 << 8
}
```
我们注意到，这些枚举属性的值基本都是通过将十进制数字 1 左移不同的位数得来的。根据这些基本的枚举属性值，我们还可以派生出额外的三个标识：
```js
// html 和 svg 都是标签元素，可以用 ELEMENT 表示
VNodeFlags.ELEMENT = VNodeFlags.ELEMENT_HTML | VNodeFlags.ELEMENT_SVG
// 普通有状态组件、需要被keepAlive的有状态组件、已经被keepAlice的有状态组件 都是“有状态组件”，统一用 COMPONENT_STATEFUL 表示
VNodeFlags.COMPONENT_STATEFUL =
  VNodeFlags.COMPONENT_STATEFUL_NORMAL |
  VNodeFlags.COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE |
  VNodeFlags.COMPONENT_STATEFUL_KEPT_ALIVE
// 有状态组件 和  函数式组件都是“组件”，用 COMPONENT 表示
VNodeFlags.COMPONENT = VNodeFlags.COMPONENT_STATEFUL | VNodeFlags.COMPONENT_FUNCTIONAL
```
其中 VNodeFlags.ELEMENT、VNodeFlags.COMPONENT_STATEFUL 以及 VNodeFlags.COMPONENT 是由基本标识通过按位或(|)运算得到的，这三个派生值将用于辅助判断。  
有了这些 flags 之后，我们在创建 VNode 的时候就可以预先为其打上 flags，以标明该 VNode 的类型：

```js
// html 元素节点
const htmlVnode = {
  flags: VNodeFlags.ELEMENT_HTML,
  tag: 'div',
  data: null
}

// svg 元素节点
const svgVnode = {
  flags: VNodeFlags.ELEMENT_SVG,
  tag: 'svg',
  data: null
}

// 函数式组件
const functionalComponentVnode = {
  flags: VNodeFlags.COMPONENT_FUNCTIONAL,
  tag: MyFunctionalComponent
}

// 普通的有状态组件
const normalComponentVnode = {
  flags: VNodeFlags.COMPONENT_STATEFUL_NORMAL,
  tag: MyStatefulComponent
}

// Fragment
const fragmentVnode = {
  flags: VNodeFlags.FRAGMENT,
  // 注意，由于 flags 的存在，我们已经不需要使用 tag 属性来存储唯一标识
  tag: null
}

// Portal
const portalVnode = {
  flags: VNodeFlags.PORTAL,
  // 注意，由于 flags 的存在，我们已经不需要使用 tag 属性来存储唯一标识，tag 属性用来存储 Portal 的 target
  tag: target
}
```
如下是利用 VNodeFlags 判断 VNode 类型的例子，比如判断一个 VNode 是否是组件：  
```js
// 使用按位与(&)运算
functionalComponentVnode.flags & VNodeFlags.COMPONENT // 真
normalComponentVnode.flags & VNodeFlags.COMPONENT // 真
htmlVnode.flags & VNodeFlags.COMPONENT // 假
```
熟悉位运算的话，理解起来很简单。这实际上是多种位运算技巧中的一个小技巧。我们可以列一个表格：

|**VNodeFlags**|**左移运算**|**32位的bit序列(出于简略，只用 9 位表示)**|
|----|----|---|
|ELEMENT_HTML|无|00000000`1`|
|ELEMENT_SVG|`1 << 1`|0000000`1`0|
|COMPONENT_STATEFUL_NORMAL|`1 << 2`|000000`1`00|
|COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE|`1 << 3`|00000`1`000|
|COMPONENT_STATEFUL_KEPT_ALIVE|`1 << 4`|0000`1`0000|
|COMPONENT_FUNCTIONAL|`1 << 5`|000`1`00000|
|TEXT|`1 << 6`|00`1`000000|
|FRAGMENT|`1 << 7`|0`1`0000000|
|PORTAL|`1 << 8`|`1`00000000|

根据上表展示的基本 flags 值可以很容易地得出下表：

|**VNodeFlags**|**位运算**|**32位的bit序列(出于简略，只用 9 位表示)**|
|----|----|----|
|ELEMENT|`(1 << 1) \| 1`|0000000`11`|
|COMPONENT_STATEFUL|`(1 << 2) \| (1 << 3) \| (1 << 4)`|0000`111`00|
|COMPONENT|`(1 << 2) \| (1 << 3) \| (1 << 4) \| (1 << 5)`|000`1111`00|

所以很自然的，只有 VNodeFlags.ELEMENT_HTML 和 VNodeFlags.ELEMENT_SVG 与 VNodeFlags.ELEMENT 进行按位与(&)运算才会得到非零值，即为真。