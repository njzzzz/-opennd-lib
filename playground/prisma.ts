import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import express from 'express'
import bodyParser from 'body-parser'
import { PrismaBuilder } from '@/prisma'

const source = {
  startTime: '2020/01/01',
  endTime: '',
  name: '1',
  idsstr: '1,2,3,4',
  ids: [1, 2, 3, 4],
  sub: {
    name: 'subName',
  },
}
const query = new PrismaBuilder<typeof source, Prisma.UserWhereInput>(source)
  .timeRange({
    endTimeField: 'endTime',
    startTimeField: 'startTime',
    to: 'createAt',
  })
  .contains(['name', 'startTime'])
  .contains({
    name: 'profileId',
  })
  .relationOr<{ id: number }>({ ids: 'Profile' }, 'id')
  .relationOr<{ id: number }>({ ids: 'email' }, 'id')
  .relationAnd(['ids', 'idsstr'])
  .in({
    ids: 'name',
  })
  .notIn({ ids: 'updateAt' })
  .ADD((builer) => {
    builer
      .contains('ids')
      .in('ids')
      .relationOr('ids')
      .contains({ sub: 'OR' }, 'name')
  })
  // .relationNot(['ids', 'idsstr'])
  .query()

console.log(JSON.stringify(query, null, 2))

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
