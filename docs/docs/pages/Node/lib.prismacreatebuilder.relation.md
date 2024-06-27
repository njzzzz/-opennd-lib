<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@opennd/lib](./lib.md) &gt; [PrismaCreateBuilder](./lib.prismacreatebuilder.md) &gt; [relation](./lib.prismacreatebuilder.relation.md)

## PrismaCreateBuilder.relation property

 创建关联

**Signature:**

```typescript
relation: (key: keyof T | (keyof T)[] | Partial<Record<keyof T, keyof TableFields>>, params?: {
        join?: string;
        get?: string;
        itemGet?: string;
        filter?: Filter;
    }) => this;
```