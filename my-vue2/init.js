import { initState } from "./state"
import { isFunction } from "./utils"

/*
 * @Description: vue初始化方法
 * @Author: xujian
 * @Date: 2021-05-25 13:39:51
 */

let uid = 0

function initMixin(Vue) {

  Vue.prototype._init = function (options) {
    const vm = this

    vm._uid = uid++

    vm._isVue = true

    vm.$options = options // 真实vue里这里会做一个合并操作 合并Vue内置的组件指令等等。。。

    vm._renderProxy = vm

    // 暴露真实的事例  
    vm._self = vm

    initState(vm)

    // if (vm.$options.el) {
    //   vm.$mount(vm.$options.el)
    // }
    
  }

}



export default initMixin