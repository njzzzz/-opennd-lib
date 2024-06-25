# next 执行时机
- send之后可next但是不可再修改res
# 解决prisma迁移已有数据库

1. 创建初始化基线
```bash
mkdir -p prisma/migrations/0_init
```
2. 生成迁移并使用 prisma migrate diff 将其保存到文件中
```bash
npx prisma migrate diff \
--from-empty \
--to-schema-datamodel prisma/schema.prisma \
--script > prisma/migrations/0_init/migration.sql
```
3. 为每个应忽略的迁移运行 prisma migrate resolve 命令

```bash
npx prisma migrate resolve --applied 0_init
```

## Deploy prod database

```
dotenv -e .env.prod -- npx prisma migrate deploy

```

# 解决冲突
1. npx prisma migrate dev --create-only
2. 手动修改sql文件
3. npx prisma migrate dev
