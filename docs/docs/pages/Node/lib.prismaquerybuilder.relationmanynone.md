<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@opennd/lib](./lib.md) &gt; [PrismaQueryBuilder](./lib.prismaquerybuilder.md) &gt; [relationManyNone](./lib.prismaquerybuilder.relationmanynone.md)

## PrismaQueryBuilder.relationManyNone property

 创建多个关联，支持条件

**Signature:**

```typescript
relationManyNone: <SourceType = any, RelationTableFields extends Record<string, any> = Record<string, any>>(params: {
        key: keyof T | Partial<Record<keyof T, keyof TableFields>>;
        idKey?: keyof RelationTableFields;
    }, cb: (builder: InstanceType<typeof PrismaQueryBuilder<SourceType, RelationTableFields>>) => any) => this;
```