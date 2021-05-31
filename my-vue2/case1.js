/*
 * @Description: feature name
 * @Author: xujian
 * @Date: 2021-05-26 14:01:58
 */

import Vue from './index'

const vm = new Vue({
  el: '#app',
  data: {
    name: 'xujian',
    age: 27,
    child: {
      name: "pipixia",
      age: 1,
      arr: [1, 2, 3, {
        prop1: 1,
        prop2: 2,
        prop3: 3,
      }]
    }
  }
})

console.log(vm);

window.vm = vm
