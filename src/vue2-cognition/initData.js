
var data = {
  a: 1,
  b: {
    c: 2
  }
}



// new Watch('a', () => {
//   alert(9)
// })
// new Watch('a', () => {
//   alert(90)
// })
// new Watch('b.c', () => {
//   alert(80)
// })

function observer(data) {
  for (let key in data) {
    defineReactive(data, key, data[key])
  }
}

function defineReactive(data, key, value) {
  console.log(data, key, value);
  initObserver(value)
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get: function () {
      return value
    },
    set: function (newVal) {
      if (val === newVal) return
      // 对新值进行观测
      observer(newVal)
    }
  })
}

function initObserver(data) {
  if (Object.prototype.toString.call(data) !== '[object Object]') {
    return
  }
  new observer(data)
}


initObserver(data)

console.log(data);