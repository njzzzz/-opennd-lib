import { beforeEach, describe, expect, it } from 'vitest'
import { PrismaQueryBuilder } from './prisma'

interface ExampleSource {
  startTime: Date
  endTime: Date
  field1: string
  field2: string
  relationField: number[]
  someField: string[]
}

interface ExampleTableFields {
  someField: string
  anotherField: string
}

describe('prismaQueryBuilder', () => {
  let builder: PrismaQueryBuilder<ExampleSource, ExampleTableFields>

  beforeEach(() => {
    builder = new PrismaQueryBuilder<ExampleSource, ExampleTableFields>({
      startTime: new Date('2022-01-01'),
      endTime: new Date('2022-12-31'),
      field1: 'value1',
      field2: 'value2',
      relationField: [1, 2, 3],
      someField: ['item1', 'item2'],
    })
  })

  it('should initialize with source and query', () => {
    const query = builder.query()
    expect(query).toEqual({})
  })

  it('should build a timeRange query', () => {
    builder.timeRange({ startTimeField: 'startTime', endTimeField: 'endTime', to: 'someField' })
    const query = builder.query()
    expect(query).toEqual({
      someField: {
        gte: '2022-01-01T00:00:00.000Z',
        lte: '2022-12-31T00:00:00.000Z',
      },
    })
  })

  it('should build a contains query', () => {
    builder.contains('field1')
    const query = builder.query()
    expect(query).toEqual({
      field1: {
        contains: 'value1',
      },
    })
  })

  it('should build an equals query', () => {
    builder.equals('field1')
    const query = builder.query()
    expect(query).toEqual({
      field1: {
        equals: 'value1',
      },
    })
  })

  it('should build an assign query', () => {
    builder.assign('field1')
    const query = builder.query()
    expect(query).toEqual({
      field1: 'value1',
    })
  })

  it('should build a relationOr query', () => {
    builder.relationOr('relationField')
    const query = builder.query()
    expect(query).toEqual({
      relationField: {
        id: {
          in: [1, 2, 3],
        },
      },
    })
  })
  it('should build a relationQuery query', () => {
    builder.relationQuery<{ sid: string }, { sid: string }>({
      key: 'field1',
      idKey: 'sid',
    }, (builder) => {
      builder.contains('sid')
    })
    const query = builder.query()
    expect(query).toEqual({
      field1: {
        sid: {
          contains: 'value1',
        },
      },
    })
  })

  it('should build a relationAnd query', () => {
    builder.relationAnd('relationField')
    const query = builder.query()
    expect(query).toEqual({
      relationField: {
        AND: [
          { id: { in: [1] } },
          { id: { in: [2] } },
          { id: { in: [3] } },
        ],
      },
    })
  })

  it('should build a relationNot query', () => {
    builder.relationNot('relationField')
    const query = builder.query()
    expect(query).toEqual({
      relationField: {
        id: {
          notIn: [1, 2, 3],
        },
      },
    })
  })

  it('should build a relationManySome query', () => {
    builder.relationManySome<{ id: number[] }>({
      key: 'relationField',
      idKey: 'id',
    }, (builder) => {
      builder.in('id')
    })
    const query = builder.query()
    expect(query).toEqual({
      relationField: {
        some: {
          id: {
            in: [1, 2, 3],
          },
        },
      },
    })
  })
  it('should build a relationManyEvery query', () => {
    builder.relationManyEvery<{ id: number[] }>({
      key: 'relationField',
      idKey: 'id',
    }, (builder) => {
      builder.in('id')
    })
    const query = builder.query()
    expect(query).toEqual({
      relationField: {
        every: {
          id: {
            in: [1, 2, 3],
          },
        },
      },
    })
  })
  it('should build a relationManyNone query', () => {
    builder.relationManyNone<{ id: number[] }>({
      key: 'relationField',
      idKey: 'id',
    }, (builder) => {
      builder.in('id')
    })
    const query = builder.query()
    expect(query).toEqual({
      relationField: {
        none: {
          id: {
            in: [1, 2, 3],
          },
        },
      },
    })
  })
  it('should build an in query', () => {
    builder.in('field2')
    const query = builder.query()
    expect(query).toEqual({
      field2: {
        in: ['value2'],
      },
    })
  })

  it('should build a notIn query', () => {
    builder.notIn('field2')
    const query = builder.query()
    expect(query).toEqual({
      field2: {
        notIn: ['value2'],
      },
    })
  })

  it('should build a combined ADD query', () => {
    builder.ADD((qb) => {
      qb.equals('field1')
      qb.contains('field2')
    })
    const query = builder.query()
    expect(query).toEqual({
      AND: [
        { field1: { equals: 'value1' } },
        { field2: { contains: 'value2' } },
      ],
    })
  })

  it('should build a combined NOT query', () => {
    builder.NOT((qb) => {
      qb.equals('field1')
      qb.contains('field2')
    })
    const query = builder.query()
    expect(query).toEqual({
      NOT: [
        { field1: { equals: 'value1' } },
        { field2: { contains: 'value2' } },
      ],
    })
  })

  it('should build a combined OR query', () => {
    builder.OR((qb) => {
      qb.equals('field1')
      qb.contains('field2')
    })
    const query = builder.query()
    expect(query).toEqual({
      OR: [
        { field1: { equals: 'value1' } },
        { field2: { contains: 'value2' } },
      ],
    })
  })
})
