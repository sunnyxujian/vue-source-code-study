# 组件的本质
#### case1：组件的产出是什么
1. 一个组件就是一个函数，给我什么样的数据，我就渲染对应的`html`内容。
2. 一个共识：现代组件的产出就是`Virtual DOM`，`Virtual DOM`是真实`DOM`的描述。
3. `Virtual DOM`带来了 分层设计，它对渲染过程的抽象，使得框架可以渲染到`web`(浏览器) 以外的平台，以及能够实现`SSR`等。

#### case2：组件的 VNode 如何表示
1.  判断`vnode.tag`是否是字符串，是字符串就是元素，否则就是组件
2. 可以让`VNode`的`tag`属性指向组件本身，从而使用`VNode`来描述组件。


#### case3：组件的种类
1. 普通的函数组件
   - 是一个纯函数
   - 没有自身状态，只接收外部数据
   - 产出`VNode`的方式：单纯的函数调用
2. 类(`class`)组件
   - 是一个类，可实例化
   - 可以有自身状态
   - 产出`VNode`的方式：需要实例化，然后调用其`render`函数