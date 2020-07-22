class Promise {
  constructor(excutor) {
    //promise的当前状态
    this._status = 'padding'
    //成功状态需要传递的参数
    this._value = ''
    //失败状态下的理由
    this._reason = ''
    //成功函数调用队列
    this._onFulfilledCallback = []
    //失败函数调用队列
    this._onRejectedCallback = []
    this._onFinallyCallback = []
    //resolve函数
    let resolve = (value) => {
      //_status状态不可逆
      if (this.status === 'padding') {
        this._status = 'fulfilled'
        //完成状态需要传递的参数
        this._value = value
        //状态改变就依次执行成功函数调用队列
        this._onFulfilledCallback.forEach((fn) => {
          fn()
        })
      }
    }
    let reject = (reason) => {
      //_status状态不可逆
      if (this.status === 'padding') {
        this._status = 'rejected'
        //完成状态需要传递的参数
        this._reason = reason
        //状态改变就依次执行成功函数调用队列
        this._onRejectedCallback.forEach((fn) => {
          fn()
        })
      }
    }
    //捕获异常
    try {
      excutor(resolve, reject)
    } catch (e) {
      reject(e)
    }
  }
  get status() {
    return this._status
  }
  //all方法实现
  static all(arr) {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(arr)) {
        return reject(new TypeError('argument must be anarray'))
      }
      let countNum = 0
      let promiseLength = arr.length
      let valuesList = []
      for (let index = 0; index < arr.length; index++) {
        arr[index].then((res)=>{
          countNum++
          valuesList.push(res)
          if (countNum === promiseLength){
            resolve(valuesList)
          }
        },(err)=>{
            reject(err)
        })
      }
    })
  }
  //race方法实现
  static race(arr){
    return new Promise((resolve, reject) => {
      if (!Array.isArray(arr)) {
        return reject(new TypeError('argument must be anarray'))
      }
      for (let index = 0; index < arr.length; index++) {
        arr[index].then((res) => {
            resolve(valuesList)
        }, (err) => {
          reject(err)
        })
      }
    })
  }
  //finally方法实现
  finally(callBack) {
    return this.then(
      /* onFulfilled */
      () => callBack(),
      /* onRejected */
      () => callBack()
    )
  }
  //resolve方法实现
  static resolve(value) {
    return new Promise((resolve,reject)=>{
      resolve(value)
    })
  }
  //reject方法实现
  static reject (err) {
    return new Promise((resolve, reject) => {
      reject(err)
    })
  }
  //then方法
  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === 'function' ? onFulfilled : (value) => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : (error) => {
            throw error
          }
    let newPromise = null
    //如果处于完成态
    if (this.status === 'fulfilled') {
      //返回一个新的promise
      return (newPromise = new Promise((resolve, reject) => {
        //这里使用setTimeout是eventloop机制的问题，能保证任务队列里有then方法，先执行主线程，执行微任务，然后宏任务放进队列里，然后再检查宏任务里面是不是有微任务，如果有就先执行微任务，然后执行完毕以后再执行下一个宏任务
        setTimeout(() => {
          try {
            let x = onFulfilled(this._value)
            this.resolvePromise(newPromise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }))
    }
    if (this.status === 'rejected') {
      //返回一个新的promise
      return (newPromise = new Promise((resolve, reject) => {
        //这里使用setTimeout是eventloop机制的问题，能保证任务队列里有then方法，先执行主线程，执行微任务，然后宏任务放进队列里，然后再检查宏任务里面是不是有微任务，如果有就先执行微任务，然后执行完毕以后再执行下一个宏任务
        setTimeout(() => {
          try {
            let x = onRejected(this._reason)
            this.resolvePromise(newPromise, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }))
    }
    if (this.status === 'padding') {
      //返回一个新的promise
      return (newPromise = new Promise((resolve, reject) => {
        //这里使用setTimeout是eventloop机制的问题，能保证任务队列里有then方法，先执行主线程，执行微任务，然后宏任务放进队列里，然后再检查宏任务里面是不是有微任务，如果有就先执行微任务，然后执行完毕以后再执行下一个宏任务
        this._onFulfilledCallback.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this._value)
              this.resolvePromise(newPromise, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })
        })
        this._onRejectedCallback.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this._reason)
              this.resolvePromise(newPromise, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          })
        })
      }))
    }
  }
  catch(onRejected) {
    this.then(null, onRejected)
  }
  resolvePromise(newPromise, x, resolve, reject) {
    if (newPromise === x) {
      return reject(new TypeError('circular reference'))
    }
    let called = false
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
      try {
        let then = x.then
        if (typeof then === 'function') {
          then.call(
            x,
            (y) => {
              if (called) {
                return
              }
              called = true
              this.resolvePromise(newPromise, y, resolve, reject)
            },
            (error) => {
              if (called) {
                return
              }
              called = true
              reject(error)
            }
          )
        } else {
          resolve(x)
        }
      } catch (error) {
        if (called) {
          return
        }
        called = true
        reject(error)
      }
    } else {
      resolve(x)
    }
  }
}