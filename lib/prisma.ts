import { isArray, isEmptyInput, isPlainObj } from './utils'

export class PrismaBuilder<
T,
TableFields = any,
> {
  #query: Record<string, any> = {}
  #source: T
  #createRelation: Record<string, any> = {}
  #create: Record<string, any> = {}

  /**
   * 切换合并模式INNER为正常的合并模式 combine， 剩余模式是合并模式会将值进行合并
   */
  #mode: 'INNER' | 'AND' | 'OR' | 'NOT' | 'CREATE' | 'CREATE_RELATION' = 'INNER'
  constructor(source: T = {} as T, query: Record<string, any> = {}) {
    this.#source = source
    this.#query = query
    return this
  }

  /**
   * @description 时间区间查询
   */
  timeRange = ({ startTimeField, endTimeField, to }: {
    startTimeField: keyof T
    endTimeField: keyof T
    to: keyof Omit<TableFields, 'NOT' | 'OR' | 'AND'>
  }) => {
    const startTimeVal = this.#source[startTimeField]
    const endTimeVal = this.#source[endTimeField]
    const query: Partial<{ ltg: T[keyof T], gte: T[keyof T] }> = {}
    if (!isEmptyInput(startTimeVal)) {
      query.ltg = startTimeVal
    }
    if (!isEmptyInput(endTimeVal)) {
      query.gte = endTimeVal
    }
    this.merge({
      [to]: query,
    })
    return this
  }

  /**
   * @description like查询
   * 数组类型的值会join，默认使用”,’拼接，可在自定义
   */
  contains = (
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    joinOrGetKey: string = ',',
  ) => {
    this.set({
      key,
      joinOrGetKey,
      type: 'plainType',
      cb(query, k, val) {
        query[k] = {
          contains: val,
        }
      },

    })
    return this
  }

  /**
   * @description 全等
   */

  equals = (
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    joinOrGetKey: string = ',',
  ) => {
    this.set({
      key,
      joinOrGetKey,
      type: 'plainType',
      cb(query, k, val) {
        query[k] = {
          equals: val,
        }
      },
    })
    return this
  }

  /**
   * @description 赋值
   */
  assign = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    {
      key,
      filter = Number,
      idKey = 'id',
      joinOrGetKey = ',',
      operate = 'plainType',
    }: {
      key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      joinOrGetKey?: string
      idKey?: keyof RelationTableFields
      filter?: BooleanConstructor | StringConstructor | NumberConstructor
      operate?: OPERATE
    },

  ) => {
    this.set({
      filter,
      idKey,
      key,
      joinOrGetKey,
      type: operate,
      cb(query, k, val) {
        query[k] = val
      },
    })
    return this
  }

  relationOr<RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    idKey: keyof RelationTableFields = 'id',
    filter: BooleanConstructor | StringConstructor | NumberConstructor = Number,
  ) {
    this.set({
      filter,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          some: {
            [idKey]: val,
          },
        }
      },
    })
    return this
  }

  relationAnd<RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    idKey: keyof RelationTableFields = 'id',
    filter: BooleanConstructor | StringConstructor | NumberConstructor = Number,
  ) {
    this.set({
      filter,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          every: {
            [idKey]: val,
          },
        }
      },
    })
    return this
  }

  relationNot<RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    idKey: keyof RelationTableFields = 'id',
    filter: BooleanConstructor | StringConstructor | NumberConstructor = Number,
  ) {
    this.set({
      filter,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          none: {
            [idKey]: val,
          },
        }
      },
    })
    return this
  }

  in(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    idKey: string = 'id',
    filter: BooleanConstructor | StringConstructor | NumberConstructor = Number,
  ) {
    this.set({
      filter,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          in: val,
        }
      },
    })
    return this
  }

  notIn(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    idKey: string = 'id',
    filter: BooleanConstructor | StringConstructor | NumberConstructor = Number,
  ) {
    this.set({
      filter,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          notIn: val,
        }
      },
    })
    return this
  }

  ADD(fn: (t: this) => void) {
    this.#mode = 'AND'
    fn(this)
    this.#mode = 'INNER'
    return this
  }

  NOT(fn: (t: this) => void) {
    this.#mode = 'NOT'
    fn(this)
    this.#mode = 'INNER'
    return this
  }

  OR(fn: (t: this) => void) {
    this.#mode = 'OR'
    fn(this)
    this.#mode = 'INNER'
    return this
  }

  /**
   * 获取查询
   */
  query() {
    return this.#query
  }

  private mergeQuery(query) {
    const { NOT = [], OR = [], AND = [] } = this.#query
    const has = Reflect.ownKeys(query).length
    switch (this.#mode) {
      case 'INNER':
        this.#query = {
          ...this.#query,
          ...query,
        }
        break
      case 'NOT':
        if (has) {
          this.#query = {
            ...this.#query,
            NOT: [
              ...NOT,
              query,
            ],
          }
        }

        break
      case 'OR':
        if (has) {
          this.#query = {
            ...this.#query,
            OR: [
              ...OR,
              query,
            ],
          }
        }
        break
      case 'AND':
        this.#query = {
          ...this.#query,
          AND: [
            ...AND,
            query,
          ],
        }
        break
      default:
        break
    }
  }

  private mergeCreateRelation(query) {
    const { NOT = [], OR = [], AND = [] } = this.#query
    const has = Reflect.ownKeys(query).length
    switch (this.#mode) {
      case 'INNER':
        this.#query = {
          ...this.#query,
          ...query,
        }
        break
      case 'NOT':
        if (has) {
          this.#query = {
            ...this.#query,
            NOT: [
              ...NOT,
              query,
            ],
          }
        }

        break
      case 'OR':
        if (has) {
          this.#query = {
            ...this.#query,
            OR: [
              ...OR,
              query,
            ],
          }
        }
        break
      case 'AND':
        this.#query = {
          ...this.#query,
          AND: [
            ...AND,
            query,
          ],
        }
        break
      default:
        break
    }
  }

  private mergeCreate(query) {
    this.#create = {
      ...this.#createRelation,
      ...query,
    }
  }

  /**
   * 此处定义merge的策略
   */
  private merge(query) {
    // 合并创建逻辑
    if (this.#mode === 'CREATE') {
      this.mergeCreate(query)
    }
    else if (this.#mode === 'CREATE_RELATION') {
      this.mergeCreateRelation(query)
    }
    else {
      this.mergeQuery(query)
    }
  }

  /**
   * 创建 connect
   */
  createRelation<RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    idKey: keyof RelationTableFields = 'id',
    filter: BooleanConstructor | StringConstructor | NumberConstructor = Number,
    fn: (t: this) => any,
  ) {
    fn(this)
    this.set({
      filter,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k) => {
        query[k] = {
          connect: {
            [idKey]: this.#createRelation,
          },
        }
      },
    })
    this.#createRelation = {}
    return this
  }

  createTime(key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>) {
    this.set({
      key,
      type: 'dateType',
      cb(query, k, val) {
        query[k] = val
      },
    })
    return this
  }

  set<RelationTableFields extends Record<string, any> = Record<string, any>>(
    {
      joinOrGetKey = ',',
      cb,
      filter = Number,
      idKey = 'id',
      key,
      type,
    }:
    {
      key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      idKey?: keyof RelationTableFields
      filter?: BooleanConstructor | StringConstructor | NumberConstructor
      joinOrGetKey?: string
      type: OPERATE
      cb: (query: any, k: string, val: any) => void
    },
  ) {
    const {
      keys,
      isObj,
      query,
    } = this.keys(key)
    const finalKeys = keys || key
    finalKeys.forEach((k) => {
      const val = this.#source[k]
      this[type]({
        val,
        filter,
        idKey,
        joinOrGetKey,
        k,
        isObj,
        key,
        cb: (...args) => {
          cb(query, ...args)
        },
      },
      )
    })
    this.merge(query)
    return this
  }

  /**
   * @description 创建create data,不要用于查询条件的构建, 回调函数中只能用create打头的函数
   */
  create(fn: (t: this) => void) {
    this.#mode = 'CREATE'
    if (Reflect.ownKeys(this.#query).length) {
      throw new Error('不可以在创建查询时使用create！')
    }
    fn(this)
    this.#mode = 'INNER'
    return this.#createRelation
  }

  private keys(key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>) {
    let keys = null
    const query: Partial<Record<keyof T, { every: { in: any } } >> = {}
    if (typeof key === 'string') {
      keys = [key]
    }
    const isObj = isPlainObj(key)
    if (isObj) {
      keys = Object.keys(key)
    }
    return { keys, isObj, query }
  }

  private arrayType<RelationTableFields extends Record<string, any> = Record<string, any>>(
    {
      val,
      filter,
      idKey = 'id',
      isObj,
      k,
      key,
      cb,
    }: {
      val: any
      filter: NumberConstructor | StringConstructor | BooleanConstructor
      idKey: keyof RelationTableFields
      k: any
      isObj: boolean
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) {
    if (!isEmptyInput(val) && val.length) {
      if (typeof val === 'string') {
        val = val.split(',').map(id => filter(id))
      }
      else if (isPlainObj(val[0])) {
        // 值不为对象
        val = val.map(item => filter(item[idKey]))
      }
      else {
        val = val.map(id => filter(id))
      }
      k = isObj ? key[k] : k
      cb(k, val)
    }
    return { val, k }
  }

  /**
   * 处理原始类型的值， 如果是数组会拼接， 对象需要指定joinOrGetKey来取值
   */
  private plainType(
    {
      val,
      joinOrGetKey = ',',
      cb,
      isObj,
      k,
      key,
    }: {
      val: any
      k: any
      isObj: boolean
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      joinOrGetKey: string
      cb: (k: string, val: any) => void
    },
  ) {
    if (!isEmptyInput(val)) {
      k = isObj ? key[k] : k
      const newVal = isArray(val) ? val.join(joinOrGetKey) : isPlainObj(val) ? val[joinOrGetKey] : val
      cb(k, newVal)
    }
  }

  /**
   * 处理时间类型的值转为ISO
   */
  private dateType(
    {
      val,
      cb,
      isObj,
      k,
      key,
    }: {
      val: any
      k: any
      isObj: boolean
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      joinOrGetKey: string
      cb: (k: string, val: any) => void
    },
  ) {
    if (!isEmptyInput(val)) {
      k = isObj ? key[k] : k
      const newVal = new Date(val).toISOString
      cb(k, newVal)
    }
  }
}
export type OPERATE = 'arrayType' | 'plainType' | 'dateType'
