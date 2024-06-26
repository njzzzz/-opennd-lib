import short from 'short-uuid'
/**
 * 获取数组中第一个值不为undefine的项
 */
export function getFirstNotUndefinedValue<T>(arr: any[]): T {
  return arr.find(item => item !== undefined)
}
/**
 * @description 判断传入的数组的每一项或单个值是否为undefined|true
 */
export function undefinedAndTrueAsTrue(val: boolean | any[]) {
  if (Array.isArray(val))
    return val.every(item => item === undefined || item === true)
  else
    return val === undefined || val === true
}
/**
 * @description  判断传入的数组的每一项或单个值是否为undefined|!['', null].includes(val)
 */
export function undefinedAndNotNullValueAsTrue(val: string | any[]) {
  if (Array.isArray(val)) {
    return val.every(
      item => item === undefined || !['', null].includes(item),
    )
  }
  else {
    return val === undefined || !['', null].includes(val)
  }
}
/**
 * @description 生成短的uuid
 */
export function sid() {
  return short.generate()
}
/**
 * @description 获取数据类型
 */
export function realType(may: any) {
  return Object.prototype.toString.call(may)
}
/**
 * @description 判断类型是否为 type
 */
export function realTypeEqual(may: any, type: string) {
  return realType(may) === `[object ${type}]`
}
/**
 * @description 判断值是否是string
 */
export function isStr(val: any) {
  return typeof val === 'string'
}
/**
 * @description 判断值是否是null|undefined|''
 */
export function isEmptyInput(val: any) {
  return [null, undefined, ''].includes(val)
}
/**
 * @description 判断值是否是undefined
 */
export function isUndef(val: any) {
  return realTypeEqual(val, 'Undefined')
}
/**
 * @description 判断值是否为null
 */
export function isNull(val: any) {
  return realTypeEqual(val, 'Null')
}
/**
 * @description 判断值是否为数组
 */
export function isArray(val: any) {
  return realTypeEqual(val, 'Array')
}
/**
 * @description 判断值是否为对象
 */
export function isPlainObj(val: any) {
  return realTypeEqual(val, 'Object')
}
/**
 * @description 使用字符串点操作获取对象中的值
 * @example getValueByPath(obj, 'a.b.c')
 */
export const getValueByPath = function (object: any, prop: string) {
  prop = prop || ''
  const paths = prop.split('.')
  let current = object
  let result = null
  for (let i = 0, j = paths.length; i < j; i++) {
    const path = paths[i]
    if (!current)
      break

    if (i === j - 1) {
      result = current[path]
      break
    }
    current = current[path]
  }
  return result
}

/**
 * @description 使用字符串点操作获设置对象中属性, 中间不存在的属性值将被设为 {}
 * @example setValueByPath(obj, 'a.b.c', 'value')
 */
export function setValueByPath(obj: any, path: string, value: any) {
  let tempObj = obj
  path = path.replace(/\[(\w+)\]/g, '.$1')
  path = path.replace(/^\./, '')
  const keyArr = path.split('.')
  let i = 0
  for (let len = keyArr.length; i <= len - 1; ++i) {
    const key = keyArr[i]
    if (len - 1 === i) {
      // 终止
      tempObj[key] = value
    }
    else if (key in tempObj) {
      tempObj = tempObj[key]
    }
    else {
      obj[key] = {}
      tempObj = obj[key]
    }
  }
  return obj
}
/**
 * @description 使用字符串点操作获取对象中属性
 * @example getPropByPath(obj, 'a.b.c')
 */
export function getPropByPath(obj: any, path: string, strict: any) {
  let tempObj = obj
  path = path.replace(/\[(\w+)\]/g, '.$1')
  path = path.replace(/^\./, '')

  const keyArr = path.split('.')
  let i = 0
  for (let len = keyArr.length; i < len - 1; ++i) {
    if (!tempObj && !strict)
      break
    const key = keyArr[i]
    if (key in tempObj) {
      tempObj = tempObj[key]
    }
    else {
      if (strict)
        throw new Error('please transfer a valid prop path to form item!')

      break
    }
  }
  return {
    o: tempObj,
    k: keyArr[i],
    v: tempObj ? tempObj[keyArr[i]] : null,
  }
}
/**
 * @description 执行多个同步函数
 */
export function runFns(fns = [], args = []) {
  fns.forEach(fn => fn(...args))
}
/**
 * @description 判断是否是空对象
 */
export function isEmptyObj(obj: any) {
  return isPlainObj(obj) && Reflect.ownKeys(obj as object).length === 0
}
/**
 * @description 当值不为undefined时，将值赋值给data[key]
 */
export function setIfNotUndef(data = {}, key = '', value) {
  if (!isUndef(value))
    data[key] = value
}
/**
 * @description 判断数组中不包含undefined '' null
 */
export function noInputEmptyInArr(arr) {
  return !arr.some(val => isEmptyInput(val))
}
/**
 * @description 空函数
 */
export function func() {}
