import { h, init } from 'snabbdom'
// init 方法用来创建 patch 函数
const patch = init([])

const MyComponent = props => {
  return h('h1', props.title)
}

// 组件的产出是 VNode
const prevVnode = MyComponent({ title: 'prev' })
// 将 VNode 渲染成真实 DOM
patch(document.getElementById('app'), prevVnode)

/* 
1. 一个共识：组件的产出就是 Virtual DOM。
2. VNode 是真实 DOM 的描述
*/