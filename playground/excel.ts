// import mongoose, { Schema, connect } from 'mongoose'
// import type { CellObject } from 'xlsx-js-style'
// import XLSX from 'xlsx-js-style'
// import express, { Router } from 'express'

// const router = Router()
// const app = express()
// const model = new Schema({
//   name: String,
//   username: String,
//   a: String,
//   b: String,
//   c: String,
//   d: String,
//   e: String,
//   f: String,
//   g: String,
//   h: String,
//   i: String,
//   j: String,
//   k: String,
//   l: String,
//   m: String,
//   n: String,
// })
// const userModel = mongoose.model('users', model)
// router.get('/excel', async (req, res) => {
//   const users = await userModel.find().allowDiskUse(true)
//   const headers = [
//     [
//       { value: 'name', label: '名称' },
//       { value: 'username', label: '用户名称' },
//       { value: 'a', label: '用户名称' },
//       { value: 'b', label: '用户名称' },
//       { value: 'c', label: '用户名称' },
//       { value: 'd', label: '用户名称' },
//       { value: 'e', label: '用户名称' },
//       { value: 'f', label: '用户名称' },
//       { value: 'g', label: '用户名称' },
//       { value: 'h', label: '用户名称' },
//       { value: 'i', label: '用户名称' },
//       { value: 'j', label: '用户名称' },
//       { value: 'k', label: '用户名称' },
//       { value: 'l', label: '用户名称' },
//       { value: 'm', label: '用户名称' },
//       { value: 'n', label: '用户名称' },
//     ],
//   ]
//   const cols = Array(16).fill({ wch: 15 })
//   const buffer = excel({ headers, cols, data: users })
//   // 设置响应头
//   res.setHeader('Content-Disposition', 'attachment; filename=SHE.xlsx')
//   res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
//   // 发送 Buffer
//   res.send(buffer)
// })
// app.use(
//   router,
// )
// connect('mongodb://127.0.0.1:27020/dev').then(async () => {
//   app.listen(12345, () => {
//     console.log('listening at 12345')
//   })
// })

// const BOLD_SIZE_14 = {
//   bold: true,
//   sz: 14,
//   name: '宋体',
// }

// const BORDER = {
//   top: { style: 'thin' },
//   bottom: { style: 'thin' },
//   left: { style: 'thin' },
//   right: { style: 'thin' },
// }

// const CENTER_WRAP = {
//   vertical: 'center',
//   horizontal: 'center',
//   wrapText: true,
// }
// interface Item {
//   label: string
//   value: string
// }

// function excel({ headers = [], data = [], cols = [], dataHeaderIndex = 0 }: { headers: (Item[])[], data: any[], cols: XLSX.ColInfo[], dataHeaderIndex?: number }) {
//   // 作为取值的headers
//   const dataHeaders = headers[dataHeaderIndex] ?? []
//   // 创建一个新的工作簿
//   const workbook = XLSX.utils.book_new()
//   // 定义表头
//   const sheetData = [
//     headers.map((header) => {
//       return header.map<CellObject>(row => ({
//         v: row.label,
//         t: 's',
//         s: {
//           font: BOLD_SIZE_14,
//           alignment: CENTER_WRAP,
//           border: BORDER,
//           fill: { fgColor: { rgb: 'D9D9D9' } },
//         },
//       }))
//     }),
//     ...data.map(item => dataHeaders.reduce<CellObject[]>((acc, { value }) => {
//       acc.push({
//         v: item[value],
//         t: 's',
//         s: {
//           alignment: CENTER_WRAP,
//           border: BORDER,
//         },
//       })
//       return acc
//     }, [])),
//   ]
//   // 将数据转换为工作表
//   const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
//   // 设置列宽
//   worksheet['!cols'] = cols
//   // 将工作表添加到工作簿
//   XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
//   // 将工作簿写入 Buffer
//   const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
//   return buffer
// }
import { PassThrough } from 'node:stream'
import mongoose, { Schema, connect } from 'mongoose'
import express, { NextFunction, Router } from 'express'
import ExcelJS from 'exceljs'
import { excelCursorStream } from '@/excel'

// async function createWorkbookStream() {
//   const passThrough = new PassThrough()

//   const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
//     stream: passThrough,
//   })

//   const worksheet = workbook.addWorksheet('Sheet 1')
//   worksheet.columns = [
//     { header: 'ID', key: 'id' },
//     { header: 'Name', key: 'name' },
//     { header: 'Age', key: 'age' },
//   ]

//   for (let i = 1; i <= 1000; i++)
//     worksheet.addRow({ id: i, name: `Name ${i}`, age: Math.floor(Math.random() * 100) }).commit()

//   await workbook.commit()
//   return passThrough
// }

const router = Router()
const app = express()
const model = new Schema({
  name: String,
  username: String,
  a: String,
  b: String,
  c: String,
  d: String,
  e: String,
  f: String,
  g: String,
  h: String,
  i: String,
  j: String,
  k: String,
  l: String,
  m: String,
  n: String,
})
// const BOLD_SIZE_14 = {
//   bold: true,
//   sz: 14,
//   name: '宋体',
// }

// const BORDER = {
//   top: { style: 'thin' },
//   bottom: { style: 'thin' },
//   left: { style: 'thin' },
//   right: { style: 'thin' },
// }

// const CENTER_WRAP = {
//   vertical: 'center',
//   horizontal: 'center',
//   wrapText: true,
// }

const userModel = mongoose.model('users', model)

router.get('/excel', async (req, res) => {
  const cursor = userModel.find().skip(400000).limit(100).cursor()
  await excelCursorStream({
    filename: '真是帅的表格',
    res,
    req,
    cursor,
    merges: ['A1:P1'],
    headers: [
      [
        { title: '真是帅的表格标题' },
      ],
      [
        { title: '姓名', dataIndex: 'name', width: 10 },
        { title: '用户名', dataIndex: 'username', width: 30 },
        { title: 'a', dataIndex: 'a', width: 15 },
        { title: 'b', dataIndex: 'b', width: 15 },
        { title: 'c', dataIndex: 'c', width: 15 },
        { title: 'd', dataIndex: 'd', width: 15 },
        { title: 'e', dataIndex: 'e', width: 15 },
        { title: 'e', dataIndex: 'f', width: 15 },
        { title: 'e', dataIndex: 'g', width: 15 },
        { title: 'e', dataIndex: 'h', width: 15 },
        { title: 'e', dataIndex: 'i', width: 15 },
        { title: 'e', dataIndex: 'j', width: 15 },
        { title: 'e', dataIndex: 'k', width: 15 },
        { title: 'e', dataIndex: 'l', width: 15 },
        { title: 'e', dataIndex: 'm', width: 15 },
        { title: 'e', dataIndex: 'n', width: 15 },
      ],
    ],
  })
})
// router.get('/', async (req, res, next) => {
//   next()
//   console.log(1)
//   console.log(2)
//   res.json({
//     a: 1,
//   })
// }, () => {
//   console.log('next')
// })
// app.use(logger)
app.use(router)
// // app.use(logger)

// app.use(errorHandler)
// app.use('/user/:id', (req, res, next) => {
//   console.log('Request URL:', req.originalUrl)
//   next('')
// }, (req, res, next) => {
//   console.log('Request Type:', req.method)
//   next()
// })
connect('mongodb://127.0.0.1:27020/dev').then(async () => {
  app.listen(12345, () => {
    console.log('listening at 12345')
  })
})
// function logger(req, res, next) {
//   console.log('logger')
//   next()
// }
// function errorHandler(err, req, res, next) {
//   console.log('error', err)
//   next()
// }
