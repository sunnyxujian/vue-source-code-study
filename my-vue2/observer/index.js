/*
 * @Description: 响应式处理
 * @Author: xujian
 * @Date: 2021-05-25 13:40:14
 */

import { isArray, isObject } from "../utils"
import { arrayMethods } from "./array"

export function observer(data) {
  // 如果要侦测的数据不是对象或者已经被侦测过 那么就不侦测了
  if (!isObject(data) || data.__ob__) return
  return new Observer(data)
  
}



class Observer {
  constructor(data) {
    // 把当前实例挂在到data.__ob__上。后面在observerArray的时候可以用得到，并且还可以做为当前对象有没有做过响应式拦截的标志
    // 给所有响应式数据增加标识，并且可以在响应式上获取Observer实例上的方法
    Object.defineProperty(data, '__ob__', {
      enumerable: false,
      configurable: false,
      value: this
    })

    this.data = data
    if (isArray(data)) {
      // 对数组原来的方法进行改写， 切片编程  高阶函数
      data.__proto__ = arrayMethods
      this.observeArray(data)
    } else {
      this.walk(data)
    }
  }
  walk(obj) {
    Object.keys(obj).forEach(key => {
      defineReactive(obj, key, obj[key])
    })
  }
  // 监听数组的每一项
  observeArray(arr) {
    for (let idx = 0; idx < arr.length; idx++) {
      observer(arr[idx])
    }
  }
}

function defineReactive(obj, key, value) {
  observer(value)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get() {
      return value
    },
    set(newVal) {
      if (newVal === value) return
      observer(newVal)
      console.log(obj,key,'属性或者值发生了变化')
      obj[key] = newVal
    }
  })
}