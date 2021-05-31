/*
 * @Description: feature name
 * @Author: xujian
 * @Date: 2021-05-27 16:47:15
 */
let id = 0

class Dep {
  constructor() {
    this.id = id++
    this.subs = [] // 用于存放watcher
  }

  depend() {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  addDep(watcher) {
    this.subs.push(watcher)
  }

  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}


Dep.target = null

const stack = []

export function pushTarget(watcher) {
  Dep.target = watcher
  stack.push(watcher)
}

export function popTarget() {
  stack.pop()
  Dep.target = stack[stack.length - 1]
}