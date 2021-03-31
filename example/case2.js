const elementVnode = {
  tag: 'div',
  content: '元素节点'
}



class MyComponent {
  render() {
    // render 函数产出 VNode
    return {
      tag: 'Component',
      content: '元素节点'
    }
  }
}

function mountElement(vnode, container) {
  // 创建元素
  const el = document.createElement(vnode.tag)
  el.innerText = vnode.content
  // 将元素添加到容器
  container.appendChild(el)
}

function mountComponent(vnode, container) {
  // 创建组件实例
  const instance = new vnode.tag()
  // 渲染
  instance.$vnode = instance.render()
  // 挂载
  mountElement(instance.$vnode, container)
}

function render(vnode, container) {
  if (typeof vnode.tag === 'string') {
    // html 标签
    mountElement(vnode, container)
  } else {
    // 组件
    mountComponent(vnode, container)
  }
}

