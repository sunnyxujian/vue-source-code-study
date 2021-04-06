// 声明元素的vnode
const elementVnode = {
  tag: 'div',
  content: '元素节点'
}

// 用class表示组件
class MyComponent {
  render() {
    // render 函数产出 VNode
    return {
      tag: 'div',
      content: '组件节点'
    }
  }
}

// 将class以vnode的形式包起来
const componentVnode = {
  tag: MyComponent
}

// 挂载元素，其实就是createElement加appendChild
function mountElement(vnode, container) {
  // 创建元素
  const el = document.createElement(vnode.tag)
  el.innerText = vnode.content
  // 将元素添加到容器
  container.appendChild(el)
}

// 挂载组件，其实就是实例化组件，然后获取VNode 再走挂载元素流程
function mountComponent(vnode, container) {
  // 创建组件实例
  const instance = new vnode.tag()
  // 渲染
  instance.$vnode = instance.render()
  // 挂载
  mountElement(instance.$vnode, container)
}

// render的本质就是挂载真实节点
function render(vnode, container) {
  if (typeof vnode.tag === 'string') {
    // html 标签
    mountElement(vnode, container)
  } else if (vnode.props) {
    // 函数组件
    mountFnComponent(vnode, container)
  } else {
    // 组件
    mountComponent(vnode, container)
  }
}



// 渲染
render(elementVnode, document.querySelector('#app'))
render(componentVnode, document.querySelector('#app1'))


// 函数式组件
function MyFnComponent(props) {
  return {
    tag: props.tag,
    content: props.content
  }
}

// 将class以vnode的形式包起来
const fnComponentVnode = {
  tag: MyFnComponent,
  props: {
    tag: 'div',
    content: '函数式组件节点'
  }
}

// 挂载组件，其实就是实例化组件，然后获取VNode 再走挂载元素流程
function mountFnComponent(vnode, container) {
  // 创建组件实例
  const fnVnode = vnode.tag(vnode.props)
  console.log(fnVnode);
  // 挂载
  mountElement(fnVnode, container)
}


render(fnComponentVnode, document.querySelector('#app2'))


