/*
 * @Description: feature name
 * @Author: xujian
 * @Date: 2021-05-27 14:27:14
 */

const arrayProtoMethods = Array.prototype;

const arrayMethods = Object.create(Array.prototype)


const arrayChangedMethods = [
  'unshift',
  'shift',
  'push',
  'pop',
  'splice',
  'reverse',
  'sort'
]


arrayChangedMethods.forEach(method => {
  arrayMethods[method] = function (...args) {
    result = arrayProtoMethods[method].apply(this, args)
    const ob = this.__ob__
    // 数组是否有新增的元素
    let inserted = null
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args;
        break;
      case 'splice':
        // splice可以作为插入使用，第三个到后面全是插入的元素，所以inserted就是拿到第三个开始到结束的元素
        inserted = args.slice(2)
      default:
        break;
    }

    if (inserted) {
      ob.observerArray(inserted) // 对新增的每一项进行响应式处理
    }

    return result
  }
})

