/*
 * @Description: 公共工具库
 * @Author: xujian
 * @Date: 2021-05-25 13:40:26
 */

function isType(type) {
  return function (val) {
    return Object.prototype.toString.call(val) === `[object ${type}]`
  }
}


export function isFunction(val) {
  return isType('Function')(val)
}

export function isObject(val) {
  return isType('Object')(val) || isType('Array')(val)
}

export function isArray(val) {
  return isType('Array')(val)
}



export function isPureObject(val) {
  return isType('Object')(val) || isType('Array')(val)
}

