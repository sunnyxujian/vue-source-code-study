import { VNodeFlags, ChildrenFlags } from '../2.design-vnode/flags'
import { h } from '../3.h-function/h'

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

const multipleElementVnode = h(
  'div',
  {
    style: {
      height: '100px',
      width: '100px',
      background: 'red'
    },
    class: [
      {
        'class-b': true,
        'class-c': ['1', '2', '3']
      },
      ['class-e', 'class-f', ['x', ['xx', ['xxx', ['bbb']]]]],
      'a'
    ],
    onclick: function handler() {
      alert('click me')
    }
  },
)

const inputElement = h('input', {
  class: 'cls-a',
  type: 'checkbox',
  checked: true,
  custom: '1'
})

mountElement(multipleElementVnode, document.querySelector('#app'))

mountElement(inputElement, document.querySelector('#app'))