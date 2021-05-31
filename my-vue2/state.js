/*
 * @Description: feature name
 * @Author: xujian
 * @Date: 2021-05-25 13:40:01
 */

import { observer } from "./observer"
import { isFunction } from "./utils"


export function initState(vm) {
  const opts = vm.$options
  if (opts.data) {
    initData(vm)
  }
}


export function initData(vm) {
  const options = vm.$options
  const data = vm._data = isFunction(options.data) ? options.data() : options.data
  // 将_data的属性代理到当前实例上
  Object.keys(data).forEach(key => {
    proxy(vm, `_data`, key)
  });

  observer(data)
}


// 代理函数
export function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key]
    },
    set(val) {
      vm[source][key] = val
    }
  })
}