# 如何设计 VNode
一个组件的产出是`VNode`，渲染器(`Renderer`)的渲染目标也是`VNode`。可见`VNode`在框架设计的整个环节中都非常重要，甚至**设计 VNode 本身就是在设计框架**，`VNode`的设计还会对后续算法的性能产生影响。本章我们就着手对`VNode`进行一定的设计，尝试用`VNode`描述各类渲染内容。

#### 用 VNode 描述真实 DOM
#### 描述dom
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
#### 描述有子字节点的dom
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

#### 用 VNode 描述抽象内容
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

#### VNode 的种类
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

  #### 使用 flags 作为 VNode 的标识
  既然 VNode 有类别之分，我们就有必要使用一个唯一的标识，来标明某一个 VNode 属于哪一类。同时给 VNode 添加 flags 也是 Virtual DOM 算法的优化手段之一。