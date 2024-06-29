import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import bodyParser from 'body-parser'
import { PrismaCreateBuilder, PrismaQueryBuilder } from '@/prisma'

const source = {
  startTime: '2020/01/01',
  endTime: '',
  name: '1',
  idsstr: '1,2,3,4',
  ids: [1, 2, 3, 4],
  relation: 1,
  relations: [1, 2, 3, 4],
  relationStrings: '1,2,3,4',
  relationMaps: [{ id: 1, name: 'qqq' }],
  sub: {
    email: 'email@email.com',
  },
}
// const query = new PrismaQueryBuilder<typeof source, Prisma.UserWhereInput>(source)
//   .timeRange({
//     endTimeField: 'endTime',
//     startTimeField: 'startTime',
//     to: 'createAt',
//   })
//   .contains(['startTime'])
//   .contains({
//     name: 'profileId',
//   })
//   .relationOr<{ data: number }>({ ids: 'Profile' }, { itemGet: 'data' })
//   .relationOr<{ id: number }>({ ids: 'email' }, { itemGet: 'id' })
//   .relationAnd(['ids', 'idsstr'])
//   .in({
//     ids: 'name',
//   })
//   .notIn({ ids: 'updateAt' })
//   .ADD((builer) => {
//     builer
//       .contains('ids')
//       .in('ids')
//       .relationOr('ids')
//       .contains({ sub: 'OR' }, {
//         get: 'name',
//       })
//   })
//   .query()
// prisma.user.findMany({
//   where:{
//     orders:{some:{id:{}}}
//   }
// })
// prisma.user.findMany({
//   where: {
//     // gender: {
//     //   id:{}
//     // }
//     // orders: {
//     //   some: { AND: [{ id: { in: [1] } }, { name: { contains: '1' } }] },
//     // },
//   },
// })
type Source = typeof source
type Sub = Source['relationMaps'][number]
const create = new PrismaCreateBuilder<Source, Prisma.UserWhereInput>(source)
  .relationMany({ key: 'relations' })
  .relationMany({ key: 'relationStrings' })
  .relationMany<Sub, Prisma.PostWhereInput>({
    key: 'relationMaps',
  }, (builder) => {
    builder.assign({
      id: 'published',
    })
    builder.ADD(((builder) => {
      builder.assign('name')
    }))
  })
  .time('startTime')
  .arrayToString({ ids: 'id' })
  .assign('endTime')
  .set({
    key: {
      sub: 'email',
    },
    type: 'plainType',
    get: 'email',
    cb(query, k, val) {
      query[k] = val
    },
  })
  .relation('relation')
  .create()

console.log(JSON.stringify(create, null, 2))

const prisma = new PrismaClient()
const app = express()
app.use(bodyParser.urlencoded({
  extended: true,
}))
app.use(bodyParser.json())
async function main() {
  app.post('/user/:name', async (req, res) => {
    const name = req.params.name
    const result = await prisma.user.create({
      data: {
        email: `${name}@email.com`,
        name,
        Profile: { connect: [{ id: 2, AND: [{ id: 1 }] }] },
        Post: { connect: { id: 1 } },
      },
    })
    res.status(200).json({
      code: 200,
      data: result,
    })
  })
  app.post('/profile', async (req, res) => {
    const { id = null } = req.body
    const data = await prisma.profile.findMany({ where: {
      bio: {
        in: [],
      },
      AND: [
        { User: { some: { id: { in: [1] } } } },
        { bio: { contains: '' } },
      ],
      User: id.length ? { some: { id: { in: id } } } : {},

    } })
    res.json({
      data,
      code: 200,
    })
  })
  app.get('/profile/all', async (req, res) => {
    const data = await prisma.profile.findMany({ include: { User: true } })
    res.json({
      data,
      code: 200,
    })
  })
  app.post('/profile/:bio', async (req, res) => {
    const bio = req.params.bio
    const uid = req.body.uid ?? []
    try {
      const result = await prisma.profile.create({
        data: {
          bio,
          User: {
            connect: uid.map(id => ({ id })),
          },
        },
      })
      res.status(200).json({
        code: 200,
        data: result,
      })
    }
    catch (error) {
      console.log(error)
      res.status(500).json({
        code: 500,
      })
    }
  })
  // const source = {
  //   startTime: '2020/01/01',
  //   endTime: '2020/01/01',
  //   name: null,
  //   age: '',
  //   User: [{ id: 2 }],
  //   year: '',
  // }
  // const where = new PrismaQueryBuilder<typeof source>(source)
  //   .set({
  //     keys: 'User',
  //     queryPipeline: 'reassign',
  //     filterPipeline: {
  //       User: ['map|id'],
  //     },
  //   })
  //   .multipleNOT({
  //     keys: 'User',
  //   })
  //   .end()
  // console.log('%c🤪 ~ file: prisma.ts:22 [main/where] -> where : ', 'color: #55546a', JSON.stringify(where))
  // const data = await prisma.profile.findMany({
  //   where,
  // })
  // console.log('%c🤪 ~ file: prisma.ts:25 [main/data] -> data : ', 'color: #f7df6', data)
  app.listen(7890, () => {
    console.log(`listen at 7890`)
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    // eslint-disable-next-line node/prefer-global/process
    process.exit(1)
  })
