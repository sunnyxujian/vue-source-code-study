import { VNodeFlags, ChildrenFlags } from '../2.design-vnode/flags'

import { h, Fragment, Portal, createTextVNode } from '../3.h-function/h'

const isType = Object.prototype.toString

export function render(vnode, container) {
  const prevVNode = container.vnode
  if (prevVNode == null) {
    if (vnode) {
      // 没有旧的 VNode，只有新的 VNode。使用 `mount` 函数挂载全新的 VNode
      mount(vnode, container)
      // 将新的 VNode 添加到 container.vnode 属性下，这样下一次渲染时旧的 VNode 就存在了
      container.vnode = vnode
    }
  } else {
    if (vnode) {
      // 有旧的 VNode，也有新的 VNode。则调用 `patch` 函数打补丁
      patch(prevVNode, vnode, container)
      // 更新 container.vnode
      container.vnode = vnode
    } else {
      // 有旧的 VNode 但是没有新的 VNode，这说明应该移除 DOM，在浏览器中可以使用 removeChild 函数。
      container.removeChild(prevVNode.el)
      container.vnode = null
    }
  }
}


function mount(vnode, container, isSVG) {
  const { flags } = vnode
  if (flags & VNodeFlags.ELEMENT) {
    // 挂载普通标签
    mountElement(vnode, container)
  } else if (flags & VNodeFlags.COMPONENT) {
    // 挂载组件
    mountComponent(vnode, container)
  } else if (flags & VNodeFlags.TEXT) {
    // 挂载纯文本
    mountText(vnode, container)
  } else if (flags & VNodeFlags.FRAGMENT) {
    // 挂载 Fragment
    mountFragment(vnode, container)
  } else if (flags & VNodeFlags.PORTAL) {
    // 挂载 Portal
    mountPortal(vnode, container)
  }
}


function bindClass(el, className) {
  if (typeof className === "string") {
    el.className = className
  } else {
    let names = ''
    function spreadClass(classes) {
      for (let key in classes) {
        const item = classes[key]
        if (typeof item === 'string') {
          names = names + ' ' + classes[key]
        }
        if (item === true) {
          names = names + ' ' + key
        }
        if (isType.call(item) === '[object Object]') {
          for (let skey in item) {
            if (item[skey]) names = names + ' ' + skey
          }
        }
        if (Array.isArray(item)) {
          spreadClass(item)
        }
      }
    }
    if (className && typeof className === 'object') {
      spreadClass(className)
      el.className = names
    }
  }
}

const domPropsRE = /\[A-Z]|^(?:value|checked|selected|muted)$/
function mountElement(vnode, container, isSVG) {
  // 判断是否是svg元素
  isSVG = isSVG || vnode.flags & VNodeFlags.ELEMENT_SVG
  const el = isSVG
    ? document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
    : document.createElement(vnode.tag)
  // 将真实DOM引用到vnode的el属性上
  vnode.el = el
  // 拿到 VNodeData
  const data = vnode.data
  if (data) {
    // 如果 VNodeData 存在，则遍历之
    for (let key in data) {
      // key 可能是 class、style、on 等等
      switch (key) {
        case 'style':
          // 如果 key 的值是 style，说明是内联样式，逐个将样式规则应用到 el
          for (let k in data.style) {
            el.style[k] = data.style[k]
          }
          break
        case 'class':
          // 如果 key 的值是 style，说明是内联样式，逐个将样式规则应用到 el
          bindClass(el, data[key])
          break
        default:
          if (key[0] === 'o' && key[1] === 'n') {
            // 事件
            el.addEventListener(key.slice(2), data[key])
          } else if (domPropsRE.test(key)) {
            // 当作 DOM Prop 处理
            el[key] = data[key]
          } else {
            // 当作 Attr 处理
            el.setAttribute(key, data[key])
          }
          break
      }
    }
  }

  // 挂载子节点
  const { childFlags, children } = vnode
  // 检测如果没有子节点则无需递归挂载
  if (childFlags !== ChildrenFlags.NO_CHILDREN) {
    if (childFlags & ChildrenFlags.SINGLE_VNODE) {
      // 如果是单个子节点则调用 mount 函数挂载
      mount(children, el, isSVG)
    } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
      // 如果是单多个子节点则遍历并调用 mount 函数挂载
      for (let i = 0; i < children.length; i++) {
        mount(children[i], el, isSVG)
      }
    }
  }
  // console.dir(el);
  container.appendChild(el)
}

// 挂载文本节点
function mountText(vnode, container) {
  const el = document.createTextNode(vnode.children)
  vnode.el = el
  container.appendChild(el)
}

// 挂载 Fragment
function mountFragment(vnode, container, isSVG) {
  // 拿到 children 和 childFlags
  const { children, childFlags } = vnode
  switch (childFlags) {
    case ChildrenFlags.SINGLE_VNODE:
      // 如果是单个子节点，则直接调用 mount
      mount(children, container, isSVG)
      break
    case ChildrenFlags.NO_CHILDREN:
      // 如果没有子节点，等价于挂载空片段，会创建一个空的文本节点占位
      const placeholder = createTextVNode('')
      mountText(placeholder, container)
      break
    default:
      // 多个子节点，遍历挂载之
      for (let i = 0; i < children.length; i++) {
        mount(children[i], container, isSVG)
      }
  }
}

// 挂载 Portal
function mountPortal(vnode, container) {
  const { tag, children, childFlags } = vnode
  const target = typeof tag === 'string' ? document.querySelector(tag) : tag
  if (childFlags & ChildrenFlags.SINGLE_VNODE) {
    mount(children, target)
  } else if (childFlags & ChildrenFlags.MULTIPLE_VNODES) {
    for (let i = 0; i < children.length; i++) {
      mount(children[i], target)
    }
  }

  // 占位的空文本节点
  const placeholder = createTextVNode('')
  // 将该节点挂载到 container 中
  mountText(placeholder, container, null)
  // el 属性引用该节点
  vnode.el = placeholder.el
}

// 挂载组件
function mountComponent(vnode, container, isSVG) {
  // 挂载状态组件
  if (vnode.flags & VNodeFlags.COMPONENT_STATEFUL) {
    mountStatefulComponent(vnode, container, isSVG)
  } else {
    // 挂载函数式
    mountFunctionalComponent(vnode, container, isSVG)
  }
}

// 挂载状态组件
function mountStatefulComponent(vnode, container, isSVG) {
  // 创建组件实例
  const instance = new vnode.tag()
  // 渲染VNode
  instance.$vnode = instance.render()
  // 挂载
  mount(instance.$vnode, container, isSVG)
  // el 属性值 和 组件实例的 $el 属性都引用组件的根DOM元素
  instance.$el = vnode.el = instance.$vnode.el
}

// 挂载函数式
function mountFunctionalComponent(vnode, container, isSVG) {
  // 获取 VNode
  const $vnode = vnode.tag()
  // 挂载
  mount($vnode, container, isSVG)
  // el 元素引用该组件的根元素
  vnode.el = $vnode.el
}




const inputElement = h('input', {
  class: 'cls-a',
  type: 'checkbox',
  checked: true,
  custom: '1'
})

// mountElement(inputElement, document.querySelector('#app'))

const multipleElementVnode = h(
  'div',
  {
    style: {
      height: '100px',
      width: '100px',
      background: 'red'
    },
    class: ['some-class'],
    onclick: function handler() {
      alert('click me')
    }
  },
  h(Fragment, null, [
    h('span', null, '我是标题1......'),
    h('span', null, '我是标题2......')
  ])
)


// mountElement(multipleElementVnode, document.querySelector('#app'))

const portalVnode = h(
  'div',
  {
    style: {
      height: '100px',
      width: '100px',
      background: 'red'
    },
    class: ['some-class'],
    onclick: function handler() {
      alert('click me')
    }
  },
  h(Portal, { target: '#portal-box' }, [
    h('p', null, '我是portal 1......'),
    h('p', null, '我是portal 2......')
  ])
)


// mountElement(portalVnode, document.querySelector('#app'))


class MyComponent {
  render() {
    return h(
      'div',
      {
        style: {
          background: 'green'
        }
      },
      [
        h('h1', null, '我是状态组件的标题1......'),
        h('h2', null, '我是状态组件的标题2......')
      ]
    )
  }
}

const compVnode = h(MyComponent)
// render(compVnode, document.getElementById('app'))


function MyFunctionalComponent() {
  // 返回要渲染的内容描述，即 VNode
  return h(
    'div',
    {
      style: {
        background: 'yellow'
      }
    },
    [
      h('h1', null, '我是函数组件的标题1......'),
      h('h2', null, '我是函数组件的标题2......')
    ]
  )
}

const fnCompVnode = h(MyFunctionalComponent)
render(fnCompVnode, document.getElementById('app'))