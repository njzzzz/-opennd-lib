import { isArray, isEmptyInput, isPlainObj } from '@/utils'

export class PrismaQueryBuilder<
  T,
  TableFields = any,
> {
  #query: any = {}
  #source: T
  /**
   * 切换合并模式INNER为正常的合并模式 combine， 剩余模式是合并模式会将值进行合并
   */
  #mode: 'INNER' | 'AND' | 'OR' | 'NOT' = 'INNER'
  constructor(source: T = {} as T, query: Record<string, any> = {}) {
    this.#source = source
    this.#query = query
    return this
  }

  /**
   * @description 时间 大于
   */
  timeGte = (key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>, params: {
    get?: string
  } = {}) => {
    const { get } = params
    this.set({
      key,
      type: 'dateType',
      get,
      cb(query, k, val) {
        query[k] = {
          gte: val,
        }
      },
    })
    return this
  }

  /**
   * @description 时间小于
   */
  timeLte = (key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>, params: {
    get?: string
  } = {}) => {
    const { get } = params
    this.set({
      key,
      type: 'dateType',
      get,
      cb(query, k, val) {
        query[k] = {
          lte: val,
        }
      },
    })
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
    const startTimeVal = this.#source[startTimeField] as Date
    const endTimeVal = this.#source[endTimeField] as Date
    const query: Partial<{ lte: string, gte: string }> = {}
    if (!isEmptyInput(startTimeVal))
      query.gte = new Date(startTimeVal).toISOString()

    if (!isEmptyInput(endTimeVal))
      query.lte = new Date(endTimeVal).toISOString()

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
    params: {
      join?: string
      get?: string
      filter?: Filter
    } = {},
  ) => {
    const { join, get, filter } = params
    this.set({
      key,
      join,
      filter,
      get,
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
    params: {
      join?: string
      get?: string
      filter?: Filter
    } = {},
  ) => {
    const { join, get, filter } = params
    this.set({
      key,
      join,
      get,
      type: 'plainType',
      filter,
      cb(query, k, val) {
        query[k] = {
          equals: val,
        }
      },
    })
    return this
  }

  /**
   * @description 赋值,直接赋值，如果key对应的值为对象可配置get进行取值
   */
  assign = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params: {
      join?: string
      get?: string
      filter?: Filter
      idKey?: keyof RelationTableFields
      operate?: Operate
    } = {},
  ) => {
    const {
      filter,
      get,
      join,
      idKey = 'id',
      operate = 'plainType',
    } = params
    this.set({
      filter,
      get,
      idKey: idKey as any,
      key,
      join,
      type: operate,
      cb(query, k, val) {
        query[k] = val
      },
    })
    return this
  }

  /**
   * @description 关联查询 some，满足其中一个条件即可
   */
  relationOr = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params: {
      get?: string
      idKey?: keyof RelationTableFields
      filter?: Filter
    } = {},
  ) => {
    const {
      get,
      filter = Number,
      idKey = 'id',
    } = params
    this.set({
      filter,
      get,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          [idKey]: {
            in: val,
          },
        }
      },
    })
    return this
  }

  /**
   * @description 关联查询 every，满足所有条件
   */
  relationAnd = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params:
    {
      get?: string
      idKey?: keyof RelationTableFields
      filter?: Filter
    } = {},
  ) => {
    const { get, filter = Number, idKey = 'id' } = params
    this.set({
      filter,
      get,
      idKey,
      key,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          AND: val.map(v => ({ [idKey]: { in: [v] } })),
        }
      },
    })
    return this
  }

  /**
   * @description 关联查询 none，排除所有
   */
  relationNot = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params:
    {
      get?: string
      idKey?: keyof RelationTableFields
      filter?: Filter
    } = {},
  ) => {
    const { get, filter = Number, idKey = 'id' } = params
    this.set({
      filter,
      get,
      key,
      idKey,
      type: 'arrayType',
      cb: (query, k, val) => {
        query[k] = {
          [idKey]: {
            notIn: val,
          },
        }
      },
    })
    return this
  }

  /**
   * @description 创建条件关联
   */
  relationQuery = <
    SourceType = any,
    RelationTableFields extends Record<string, any> = Record<string, any>,
  >(
    params: {
      key: keyof T | Partial<Record<keyof T, keyof TableFields>>
      /**
       * @description 指定关联id名称默认为'id'
       */
      idKey?: keyof RelationTableFields
    },
  /**
   * 关联条件构造器
   */
    cb: (builder: InstanceType<typeof PrismaQueryBuilder<SourceType, RelationTableFields>>) => any,
  ) => {
    const { key, idKey = 'id' } = params ?? {}
    this.set({
      key,
      type: 'relationQueryType',
      idKey,
      builder: cb,
      cb(query, k, val) {
        query[k] = val
      },
    })
    return this
  }

  /**
   * @description 创建多个关联，支持条件
   */
  relationManySome = <
    SourceType = any,
    RelationTableFields extends Record<string, any> = Record<string, any>,
  >(
    params: {
      key: keyof T | Partial<Record<keyof T, keyof TableFields>>
      /**
       * @description 指定关联id名称默认为'id'
       */
      idKey?: keyof RelationTableFields
    },
  /**
   * 关联条件构造器
   */
    cb: (builder: InstanceType<typeof PrismaQueryBuilder<SourceType, RelationTableFields>>) => any,
  ) => {
    const { key, idKey = 'id' } = params ?? {}
    this.set({
      key,
      type: 'relationManyQueryType',
      idKey,
      builder: cb,
      cb(query, k, val) {
        query[k] = {
          some: val,
        }
      },
    })
    return this
  }

  /**
   * @description 创建多个关联，支持条件
   */
  relationManyNone = <
    SourceType = any,
    RelationTableFields extends Record<string, any> = Record<string, any>,
  >(
    params: {
      key: keyof T | Partial<Record<keyof T, keyof TableFields>>
      /**
       * @description 指定关联id名称默认为'id'
       */
      idKey?: keyof RelationTableFields
    },
  /**
   * 关联条件构造器
   */
    cb: (builder: InstanceType<typeof PrismaQueryBuilder<SourceType, RelationTableFields>>) => any,
  ) => {
    const { key, idKey = 'id' } = params ?? {}
    this.set({
      key,
      type: 'relationManyQueryType',
      idKey,
      builder: cb,
      cb(query, k, val) {
        query[k] = {
          none: val,
        }
      },
    })
    return this
  }

  /**
   * @description 创建多个关联，支持条件
   */
  relationManyEvery = <
    SourceType = any,
    RelationTableFields extends Record<string, any> = Record<string, any>,
  >(
    params: {
      key: keyof T | Partial<Record<keyof T, keyof TableFields>>
      /**
       * @description 指定关联id名称默认为'id'
       */
      idKey?: keyof RelationTableFields
    },
  /**
   * 关联条件构造器
   */
    cb: (builder: InstanceType<typeof PrismaQueryBuilder<SourceType, RelationTableFields>>) => any,
  ) => {
    const { key, idKey = 'id' } = params ?? {}
    this.set({
      key,
      type: 'relationManyQueryType',
      idKey,
      builder: cb,
      cb(query, k, val) {
        query[k] = {
          every: val,
        }
      },
    })
    return this
  }

  /**
   *
   * @description in 查询
   */
  in = (
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params:
    {
      get?: string
      filter?: Filter
      idKey?: string
    } = {},
  ) => {
    const { get, filter, idKey = 'id' } = params
    this.set({
      filter,
      get,
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

  /**
   *
   * @description notIn 查询
   */
  notIn = (
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params:
    {
      get?: string
      join?: string
      idKey?: string
      filter?: Filter
    } = {},
  ) => {
    const { get, filter, idKey = 'id' } = params
    this.set({
      filter,
      get,
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

  /**
   * @description 生成组合条件AND
   */
  ADD = (fn: (t: this) => void) => {
    this.#mode = 'AND'
    fn(this)
    this.#mode = 'INNER'
    return this
  }

  /**
   * @description 生成组合条件NOT
   */
  NOT = (fn: (t: this) => void) => {
    this.#mode = 'NOT'
    fn(this)
    this.#mode = 'INNER'
    return this
  }

  /**
   * @description 生成组合条件OR
   */
  OR = (fn: (t: this) => void) => {
    this.#mode = 'OR'
    fn(this)
    this.#mode = 'INNER'
    return this
  }

  /**
   * @description 获取查询条件
   */
  query = () => {
    return this.#query
  }

  /**
   * @description 此处定义merge Query的策略
   */
  private mergeQuery = (query) => {
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

  /**
   * @description 此处定义merge的策略
   */
  private merge = (query) => {
    this.mergeQuery(query)
  }

  set = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    params:
    {
      key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      get?: string
      filter?: Filter
      join?: string
      idKey?: keyof RelationTableFields
      type: Operate
      cb: (query: any, k: string, val: any) => void
      builder?: (t: any) => any
    },
  ) => {
    const {
      join,
      cb,
      filter,
      get,
      idKey,
      key,
      type,
      builder,
    } = params ?? {}
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
        idKey: idKey as any,
        get,
        join,
        k,
        isObj,
        builder,
        key,
        cb: (k, val) => {
          cb(query, k, val)
        },
      },
      )
    })
    this.merge(query)
    return this
  }

  // /**
  //  * @description 创建create data,不要用于查询条件的构建, 回调函数中只能用create打头的函数
  //  */
  // create(fn: (t: this) => void) {
  //   this.#mode = 'CREATE'
  //   if (Reflect.ownKeys(this.#query).length)
  //     throw new Error('不可以在创建查询时使用create！')

  //   fn(this)
  //   this.#mode = 'INNER'
  //   return this.#create
  // }

  private keys = (key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>) => {
    let keys = null
    const query: Partial<Record<keyof T, { every: { in: any } } >> = {}
    if (typeof key === 'string')
      keys = [key]

    const isObj = isPlainObj(key)
    if (isObj)
      keys = Object.keys(key)

    return { keys, isObj, query }
  }

  /**
   * arrayType 不支持join
   */
  private arrayType = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    params: {
      val: any
      filter: NumberConstructor | StringConstructor | BooleanConstructor
      get: keyof RelationTableFields
      k: any
      isObj: boolean
      idKey: string
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      filter,
      get,
      idKey = 'id',
      isObj,
      k,
      key,
      cb,
    } = params ?? {}
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val) && val.length) {
      if (typeof val === 'string') {
        val = val.split(',').map(id => filter ? filter(id) : id).filter(v => !isEmptyInput(v))
      }
      else if (isPlainObj(val[0])) {
        // 值为对象
        val = val.map(item => filter ? filter(item[idKey]) : item[idKey]).filter(v => !isEmptyInput(v))
      }
      else {
        val = val.map(id => filter ? filter(id) : id).filter(v => !isEmptyInput(v))
      }
      k = isObj ? key[k] : k
      cb(k, val)
    }
  }

  /**
   * 处理原始类型的值， 如果是数组会拼接， 对象需要指定joinOrGetKey来取值
   */
  private plainType = (
    params: {
      val: any
      k: any
      isObj: boolean
      join: string
      get: string
      idKey: string
      filter: Filter
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      join = ',',
      get,
      cb,
      isObj,
      k,
      key,
      idKey,
      filter,
    } = params ?? {}
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val)) {
      const isObjItem = isPlainObj(val[0])
      // 对象数组
      if (isArray(val)) {
        if (isObjItem) {
          val = val.map(item => filter ? filter(item[idKey]) : item[idKey]).filter(v => !isEmptyInput(v)).join(join)
        }
        else {
          val = val.map(item => filter ? filter(item) : item).filter(v => !isEmptyInput(v)).join(join)
        }
      }
      if (filter) {
        val = filter(val)
      }
      k = isObj ? key[k] : k
      cb(k, val)
    }
  }

  /**
   * 处理时间类型的值转为ISO
   */
  private dateType = (
    params: {
      val: any
      k: any
      isObj: boolean
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      get: string
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      cb,
      isObj,
      k,
      key,
      get,
    } = params ?? {}
    k = isObj ? key[k] : k
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val)) {
      val = new Date(val).toISOString()
      cb(k, val)
    }
  }

  /**
   *  @description 处理条件关联类型
   */
  private relationManyQueryType = (
    params: {
      val: any
      k: any
      isObj: boolean
      join: string
      get: string
      builder: (t: any) => any
      idKey: string
      filter: Filter
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      get,
      cb,
      isObj,
      k,
      key,
      idKey,
      builder,
    } = params ?? {}
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val)) {
      if (typeof val === 'string') {
        val = val.split(',')
      }
      if (isArray(val)) {
        const isObjItem = isPlainObj(val[0])
        if (builder) {
          const queryBuilder = new PrismaQueryBuilder(isObjItem ? val : { [idKey]: val })
          builder(queryBuilder)
          val = queryBuilder.query()
        }
        k = isObj ? key[k] : k
        cb(k, val)
      }
      else {
        throw new Error('relation的值不是数组类型，请改用.relation()')
      }
    }
  }

  /**
   *  @description 处理条件关联类型
   */
  private relationQueryType = (
    params: {
      val: any
      k: any
      isObj: boolean
      join: string
      get: string
      builder: (t: any) => any
      idKey: string
      filter: Filter
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      get,
      cb,
      isObj,
      k,
      key,
      idKey,
      builder,
    } = params ?? {}
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val)) {
      if (isArray(val)) {
        throw new Error('relation的值是数组类型，请改用.relationMany*')
      }
      else {
        if (builder) {
          const queryBuilder = new PrismaQueryBuilder({ [idKey]: val })
          builder(queryBuilder)
          val = queryBuilder.query()
        }
        k = isObj ? key[k] : k
        cb(k, val)
      }
    }
  }
}
export type Operate = 'arrayType' | 'plainType' | 'dateType' | 'relationManyQueryType' | 'relationQueryType'
export type CreateOperate = 'arrayType' | 'plainType' | 'dateType' | 'relationQueryType'
export type Filter = BooleanConstructor | StringConstructor | NumberConstructor | null

export class PrismaCreateBuilder<
  T,
  TableFields = any,
> {
  #create: any = {}
  #source: T
  constructor(source: T = {} as T, create: Record<string, any> = {}) {
    this.#source = source
    this.#create = create
    return this
  }

  /**
   * @description 赋值,直接赋值，如果key对应的值为对象可配置get进行取值
   */
  assign = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params: {
      join?: string
      get?: string
      filter?: Filter
      idKey?: keyof RelationTableFields
      operate?: CreateOperate
    } = {},
  ) => {
    const {
      filter,
      get,
      join,
      idKey = 'id',
      operate = 'plainType',
    } = params
    this.set({
      filter,
      get,
      idKey: idKey as any,
      key,
      join,
      type: operate,
      cb(query, k, val) {
        query[k] = val
      },
    })
    return this
  }

  create = () => {
    return this.#create
  }

  private mergeCreate = (query: Record<string, any>) => {
    this.#create = {
      ...this.#create,
      ...query,
    }
  }

  /**
   * @description 此处定义merge的策略
   */
  private merge(query) {
    this.mergeCreate(query)
  }

  /**
   * @description 创建时间类型
   */
  time(key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>, params: { get?: string } = {}) {
    const { get } = params
    this.set({
      key,
      get,
      type: 'dateType',
      cb(query, k, val) {
        query[k] = val
      },
    })
    return this
  }

  /**
   * @description 创建字符数组类型
   */
  arrayToString(
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params: {
      join?: string
      get?: string
      idKey?: string
      filter?: Filter
    } = {},
  ) {
    const { join, filter, get, idKey } = params
    this.set({
      key,
      get,
      join,
      filter,
      idKey,
      type: 'plainType',
      cb(query, k, val) {
        query[k] = val
      },
    })
    return this
  }

  /**
   * @description 创建关联
   */
  relation = (
    key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>,
    params: {
      join?: string
      get?: string
      idKey?: string
      filter?: Filter
    } = {},
  ) => {
    const { join, filter, get, idKey = 'id' } = params
    this.set({
      key,
      get,
      join,
      filter,
      idKey,
      type: 'plainType',
      cb(query, k, val) {
        query[k] = {
          connect: {
            [idKey]: val,
          },
        }
      },
    })
    return this
  }

  /**
   * @description 创建多个关联，支持条件
   */
  relationMany = <
    SourceType = any,
    RelationTableFields extends Record<string, any> = Record<string, any>,
  >(
    params: {
      key: keyof T | Partial<Record<keyof T, keyof TableFields>>
      filter?: Filter
      /**
       * @description 指定关联id名称默认为'id'
       */
      idKey?: keyof RelationTableFields
    },
  /**
   * 关联条件构造器
   */
    cb?: (builder: InstanceType<typeof PrismaQueryBuilder<SourceType, RelationTableFields>>) => any,
  ) => {
    const { key, idKey = 'id', filter = Number } = params ?? {}
    this.set({
      key,
      type: 'relationQueryType',
      idKey,
      filter,
      builder: cb,
      cb(query, k, val) {
        query[k] = {
          connect: val,
        }
      },
    })
    return this
  }

  set = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    params:
    {
      key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      get?: string
      filter?: Filter
      join?: string
      idKey?: keyof RelationTableFields
      type: CreateOperate
      builder?: (t: any) => any
      cb: (query: any, k: string, val: any) => void
    },
  ) => {
    const {
      join,
      cb,
      filter,
      get,
      idKey,
      key,
      type,
      builder,
    } = params ?? {}
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
        idKey: idKey as any,
        get,
        builder,
        join,
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

  private keys = (key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>) => {
    let keys = null
    const query: Partial<Record<keyof T, { every: { in: any } } >> = {}
    if (typeof key === 'string')
      keys = [key]

    const isObj = isPlainObj(key)
    if (isObj)
      keys = Object.keys(key)

    return { keys, isObj, query }
  }

  /**
   *  @description 处理数组类型 不支持join
   */
  private arrayType = <RelationTableFields extends Record<string, any> = Record<string, any>>(
    params: {
      val: any
      filter: NumberConstructor | StringConstructor | BooleanConstructor
      get: keyof RelationTableFields
      k: any
      isObj: boolean
      idKey: string
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      filter,
      get,
      idKey = 'id',
      isObj,
      k,
      key,
      cb,
    } = params ?? {}
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val) && val.length) {
      if (typeof val === 'string') {
        val = val.split(',').map(id => filter ? filter(id) : id).filter(v => !isEmptyInput(v))
      }
      else if (isPlainObj(val[0])) {
        // 值为对象
        val = val.map(item => filter ? filter(item[idKey]) : item[idKey]).filter(v => !isEmptyInput(v))
      }
      else {
        val = val.map(id => filter ? filter(id) : id).filter(v => !isEmptyInput(v))
      }
      k = isObj ? key[k] : k
      cb(k, val)
    }
  }

  /**
   *  @description 处理原始类型的值， 如果是数组会拼接， 对象需要指定joinOrGetKey来取值
   */
  private plainType = (
    params: {
      val: any
      k: any
      isObj: boolean
      join: string
      get: string
      idKey: string
      filter: Filter
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      join = ',',
      get,
      cb,
      isObj,
      k,
      key,
      idKey,
      filter,
    } = params ?? {}
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val)) {
    // 对象数组
      if (isArray(val)) {
        val = val.map(item => filter ? filter(item) : item).filter(v => !isEmptyInput(v)).join(join)
      }
      else if (isArray(val) && isPlainObj(val[0])) {
        val = val.map(item => filter ? filter(item[idKey]) : item[idKey]).filter(v => !isEmptyInput(v)).join(join)
      }
      if (filter) {
        val = filter(val)
      }
      k = isObj ? key[k] : k
      cb(k, val)
    }
  }

  /**
   *  @description 处理时间类型的值转为ISO
   */
  private dateType = (
    params: {
      val: any
      k: any
      isObj: boolean
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      get: string
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      cb,
      isObj,
      k,
      key,
      get,
    } = params ?? {}
    k = isObj ? key[k] : k
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val)) {
      val = new Date(val).toISOString()
      cb(k, val)
    }
  }

  /**
   *  @description 处理条件关联类型
   */
  private relationQueryType = (
    params: {
      val: any
      k: any
      isObj: boolean
      join: string
      get: string
      builder: (t: any) => any
      idKey: string
      filter: Filter
      key: string | number | symbol | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>
      cb: (k: string, val: any) => void
    },
  ) => {
    let {
      val,
      get,
      cb,
      isObj,
      filter,
      k,
      key,
      idKey,
      builder,
    } = params ?? {}
    val = isEmptyInput(get) ? val : val?.[get]
    if (!isEmptyInput(val)) {
      if (typeof val === 'string') {
        val = val.split(',')
      }
      if (isArray(val)) {
        if (builder && isPlainObj(val[0])) {
          val = val.map((v) => {
            const queryBuilder = new PrismaQueryBuilder(v)
            builder(queryBuilder)
            return queryBuilder.query()
          })
        }
        else {
          val = val.map(id => ({ [idKey]: filter ? filter(id) : id }))
        }
        k = isObj ? key[k] : k
        cb(k, val)
      }
      else {
        throw new Error('relation的值不是数组类型，请改用.relation()')
      }
    }
  }
}
