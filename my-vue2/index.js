/*
 * @Description: Vue instance
 * @Author: xujian
 * @Date: 2021-05-25 11:20:22
 */

import initMixin from './init'
// import { stateMixin } from './state'
// import { renderMixin } from './render'
// import { eventsMixin } from './events'
// import { lifecycleMixin } from './lifecycle'
// import { warn } from '../util/index'


function Vue(options) {
  if (process.env.NODE_ENV !== 'production' && !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}


initMixin(Vue)
// stateMixin(Vue)
// eventsMixin(Vue)
// lifecycleMixin(Vue)
// renderMixin(Vue)

Vue.prototype.$mount = function (el, hydrating) {

}

export default Vue