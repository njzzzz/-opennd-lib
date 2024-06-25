import { isEmptyInput, isPlainObj } from './utils'

export type GetPropType<T extends Record<string, any>, P extends string> = P extends `${infer L}.${infer R}` ? GetPropType<T[L], R> : T[P]
const FILTER_SPLIT = '|'
const PARAMS_SPLIT = ','
export class PrismaQueryBuilder<T extends Record<string, any> = Record<string, any>, K extends string = Extract<keyof T, string>> {
  query: Record<string, any> = {}
  source: Record<string, any> = {}
  constructor(source: Record<string, any> = {}, query: Record<string, any> = {}) {
    this.source = source
    this.query = query
    return this
  }

  /**
   * @description 核心函数
   */
  set = ({ keys = [], queryPipeline = [], filterPipeline = {} }: {
    keys: K | K[] | []
    queryPipeline: Pipeline[] | Pipeline
    // eslint-disable-next-line ts/ban-types
    filterPipeline?: Record<K, (filterPipeline | string & {})[] | filterPipeline> | object
  }) => {
    const { where = {} } = this.query
    const conditions = this.core<Pipeline>({ keys, queryPipeline, filterPipeline })
    // 处理参数
    this.query = {
      ...this.query,
      where: {
        ...where,
        ...conditions,
      },
    }
    return this
  }

  /**
   * @description 统一处理 filterPipeline Pipeline
   */
  core = <P extends string>({ keys = [], queryPipeline = [], filterPipeline = {} }: {
    keys: K | K[] | []
    queryPipeline: P[] | P
    // eslint-disable-next-line ts/ban-types
    filterPipeline?: Record<K, (filterPipeline | string & {})[] | filterPipeline> | object
  }) => {
    keys = typeof keys === 'string' ? [keys] : keys
    queryPipeline = typeof queryPipeline === 'string' ? [queryPipeline] : queryPipeline
    return keys.reduce((acc: Record<string, any>, key: string) => {
      const result = queryPipeline.reduce((data, operate) => {
        const filter = filterPipeline[key] ?? []
        const filters = typeof filter === 'string' ? [filter] : filter
        // 解析filter
        const filterFns = filters.map((filter = '') => {
          const [filterName, params = ''] = filter.split(FILTER_SPLIT)
          return (source: T, key: string) => {
            // 调用filter, 并传入参数
            return this[filterName](source, key, params.split(PARAMS_SPLIT))
          }
        })
        const result = filterFns.reduce((data, filter) => {
          // filter 传入的是从source取到的值
          return filter ? filter(data, key) : data
        }, this.source[key])
        data[operate] = result
        return data
      }, {} as any)
      // 处理重新赋值 reassign
      if (Reflect.has(result, 'reassign')) {
        acc[key] = result.reassign
      }
      else {
        acc[key] = result
      }
      return acc
    }, {})
  }

  /**
   *
   */
  reassign = ({
    key,
    filterPipeline,
  }: {
    key: K
    // eslint-disable-next-line ts/ban-types
    filterPipeline: (filterPipeline | string & {})[] | filterPipeline | string & {}
  }) => {
    this.set({
      keys: [key],
      queryPipeline: ['reassign'],
      filterPipeline: {
        [key]: filterPipeline,
      },
    })
    return this
  }

  /**
   * @description contains 快捷操作
   */
  contains = ({ keys = [], filterPipeline = [] }: {
    keys: K | K[]
    // eslint-disable-next-line ts/ban-types
    filterPipeline?: Record<K, (filterPipeline | string & {})[] | filterPipeline> | object
  }) => {
    keys = typeof keys === 'string' ? [keys] : keys
    this.set({
      keys,
      queryPipeline: ['contains'],
      filterPipeline,
    })
    return this
  }

  /**
   * @description 时间区间查询 快捷操作
   */
  timeRange = ({ startTimeKey, endTimeKey, searchKey }: {
    startTimeKey: K
    endTimeKey: K
    searchKey: string
  }) => {
    this.set({
      keys: [startTimeKey] as any,
      queryPipeline: ['lte'],
      filterPipeline: { [startTimeKey]: ['ISODate'] },
    })
    this.set({
      keys: [endTimeKey],
      queryPipeline: ['gte'],
      filterPipeline: { [endTimeKey]: ['ISODate'] },
    })
    this.AND({ keys: [startTimeKey, endTimeKey] })
    this.mapKeys({
      searhKeyMap: {
        [startTimeKey]: searchKey,
        [endTimeKey]: searchKey,
      } as any,
    })
    return this
  }

  /**
   * @description 时间区间查询 createAt 快捷操作
   * - 默认值
   * - startTimeKey 'startTime'
   * - endTimeKey 'endTime'
   * - searchKey 'createAt'
   */
  createAtTimeRange = () => {
    this.timeRange({
      startTimeKey: 'startTime' as any,
      endTimeKey: 'endTime' as any,
      searchKey: 'createAt' as any,
    })
    return this
  }

  mapKeys = ({ searhKeyMap }: { searhKeyMap: Partial<Record<K, string>> }) => {
    const { where = {} } = this.query
    const { AND = [], OR = [], NOT = [] } = where
    const arr = [...AND, ...NOT, ...OR]
    Object.keys(searhKeyMap).forEach((oldKey) => {
      const newKey = searhKeyMap[oldKey]
      if (!isEmptyInput(where[oldKey])) {
        where[newKey] = where[oldKey] ?? null
        delete where?.[oldKey]
      }
      // 修改 AND = [], OR = [], NOT = [] 的键
      arr.forEach((item) => {
        if (!isEmptyInput(item[oldKey])) {
          item[newKey] = item[oldKey] ?? null
          delete item?.[oldKey]
        }
      })
    })
    return this
  }

  /**
   * @description 组合参数为and 快捷操作
   */
  AND = ({ keys = [] }: { keys: K[] }) => {
    this.combine({ keys, combine: 'AND' })
    return this
  }

  /**
   * @description 组合参数为or 快捷操作
   */
  OR = ({ keys = [] }: { keys: K[] }) => {
    this.combine({ keys, combine: 'OR' })
    return this
  }

  /**
   * @description 组合参数为not 快捷操作
   */
  NOT = ({ keys = [] }: { keys: K[] }) => {
    this.combine({ keys, combine: 'NOT' })
    return this
  }

  /**
   * @description 组合参数为
   * 组合参数不会被覆盖只会累加
   */
  combine = ({ keys = [], combine = 'AND' }: { keys: K[], combine?: Combine }) => {
    const { where = {} } = this.query
    const { combines, other } = Object.keys(where).reduce((acc, key: any) => {
      if (keys.includes(key)) {
        acc.combines.push({
          [key]: where[key],
        })
      }
      else {
        acc.other[key] = where[key]
      }
      return acc
    }, { combines: [], other: {} })
    const _combine = where[combine] ?? []
    this.query = {
      where: {
        ...other,
        [combine]: [..._combine, ...combines],
      },
    }
    return this
  }

  /**
   * @description 多值查询 OR
   */
  multipleRelationOR = ({ keys = [] }: {
    keys: K | K[] | []
  }) => {
    const { where = {} } = this.query
    const { OR = [] } = where
    keys = typeof keys === 'string' ? [keys] : keys
    const _OR = keys.map((key) => {
      const values = where[key] ?? []
      delete where[key]
      return {
        [key]: {
          some: {
            OR: values,
          },
        },
      }
    })
    this.query = {
      ...this.query,
      where: {
        ...where,
        OR: [
          ...OR,
          ..._OR,
        ],
      },
    }
    return this
  }

  /**
   * @description 多值查询 AND
   */
  multipleAND = ({ keys = [] }: {
    keys: K | K[] | []
  }) => {
    const { where = {} } = this.query
    const { AND = [] } = where
    keys = typeof keys === 'string' ? [keys] : keys
    const _AND = keys.map((key) => {
      const values = where[key] ?? []
      delete where[key]
      return {
        [key]: {
          every: {
            AND: values,
          },
        },
      }
    })
    this.query = {
      ...this.query,
      where: {
        ...where,
        AND: [
          ...AND,
          ..._AND,
        ],
      },
    }
    return this
  }

  /**
   * @description 多值查询 NOT
   */
  multipleNOT = ({ keys = [] }: {
    keys: K | K[] | []
  }) => {
    const { where = {} } = this.query
    const { NOT = [] } = where
    keys = typeof keys === 'string' ? [keys] : keys
    const _NOT = keys.map((key) => {
      const values = where[key] ?? []
      delete where[key]
      return {
        [key]: {
          every: {
            NOT: values,
          },
        },
      }
    })
    this.query = {
      ...this.query,
      where: {
        ...where,
        NOT: [
          ...NOT,
          ..._NOT,
        ],
      },
    }
    return this
  }

  end = () => {
    return this.query.where
  }

  // 以下为filter
  /**
   * @description map filter filterPipeline: ['map|key1,key2']
   * 数组取值, 参数为需要map的键
   */
  map = (source: Record<string, any>[], key: string, keys: any[]) => {
    return source.map(item => keys.reduce((acc, k) => {
      acc[k] = item[k]
      return acc
    }, {}))
  }

  /**
   * @description map filter filterPipeline: ['mapId']
   * 数组取值返回id 无参数
   */
  mapId = (source: Record<string, any>[]) => {
    return source.map(item => item.id, {})
  }

  /**
   * @description map filter filterPipeline: ['mapPickOne|id']
   * 只接受一个参数
   */
  mapPickOne = (source: Record<string, any>[], key: string, keys: any[]) => {
    return source.map(item => item[keys[0]] || null)
  }

  ISODate = (source: string) => {
    return isEmptyInput(source) ? null : new Date(source).toISOString()
  }

  /**
   * @description 将数组单个值转为对象 filterPipeline: ['mapToObj|id']
   */
  mapToObj(source: Record<string, any>[], key: string, keys: any[]) {
    return source.map((item) => {
      return keys.reduce((acc, key) => {
        acc[key] = item
        return acc
      }, {})
    })
  }
}

export type Pipeline = 'lte' | 'gte' | 'lt' | 'gt' | 'contains' | 'endsWith' | 'equals' | 'in' | 'not' | 'notIn' | 'startWith' | 'reassign'
export type filterPipeline = 'map' | 'mapId' | 'mapPickOne' | 'mapToObj'
export type Combine = 'OR' | 'AND' | 'NOT'
