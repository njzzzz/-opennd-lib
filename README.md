# @opennd/lib

## Install
```bash
npm  i  @opennd/lib --save
```
[API Docs](./docs/index.md)

## Example

```ts
import { excelCursorStream } from '@opennd/lib'
const model = mongoose.model('xxx', new Schema({
  name: String,
  age: Number
}))

router.get('/xxx', (req, res) => {
  const cursor = model.find().cursor()
  await excelCursorStream({
    res,
    req,
    cursor,
    merges: ['A1:B1'],
    headers: [
      [
        { title: '真是帅的表格标题' },
      ],
      [
        { title: '姓名', dataIndex: 'name', width: 20 },
        { title: '年龄', dataIndex: 'age', width: 10 },
      ],
    ],
  })
})
```
