<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@opennd/lib](./lib.md) &gt; [PrismaCreateBuilder](./lib.prismacreatebuilder.md) &gt; [assign](./lib.prismacreatebuilder.assign.md)

## PrismaCreateBuilder.assign property

 赋值,直接赋值，如果key对应的值为对象可配置get进行取值

**Signature:**

```typescript
assign: <RelationTableFields extends Record<string, any> = Record<string, any>>(key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>, params?: {
        join?: string;
        get?: string;
        filter?: Filter;
        idKey?: keyof RelationTableFields;
        operate?: CreateOperate;
    }) => this;
```
