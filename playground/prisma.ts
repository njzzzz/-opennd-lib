import { PrismaClient } from '@prisma/client'
import { PrismaQueryBuilder } from '@/prisma'

const prisma = new PrismaClient()

async function main() {
  const source = {
    startTime: '2020/01/01',
    endTime: '2020/01/01',
    name: null,
    age: '',
    User: [{ id: 2 }],
    year: '',
  }
  const where = new PrismaQueryBuilder<typeof source>(source)
    .set({
      keys: 'User',
      queryPipeline: 'reassign',
      filterPipeline: {
        User: ['map|id'],
      },
    })
    .multipleNOT({
      keys: 'User',
    })
    .end()
  console.log('%c🤪 ~ file: prisma.ts:22 [main/where] -> where : ', 'color: #55546a', JSON.stringify(where))
  const data = await prisma.profile.findMany({
    where,
  })
  console.log('%c🤪 ~ file: prisma.ts:25 [main/data] -> data : ', 'color: #f7df6', data)
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
