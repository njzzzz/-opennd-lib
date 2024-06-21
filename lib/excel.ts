import ExcelJS from 'exceljs'
import type { Request, Response } from 'express'
import type { Cursor } from 'mongoose'

export interface Header {
  /**
   * @description 表格列标题
   */
  title: string
  /**
   * @description 表格列宽度
   */
  width?: number
  /**
   * @description 表格列取值key
   */
  dataIndex?: string
  /**
   * @description 表格标题字体大小
   */
  size?: number
  /**
   * @description 表格标题字体是否加粗
   */
  bold?: boolean
  /**
   * @description 表格列是否带边框
   */
  border?: boolean
  /**
   * @description 表格列背景色
   */
  bgColor?: boolean | string
  /**
   * @description 表格取值自定义
   */
  renderCell?: <T>(data: T) => any
}
export interface ExcelStreamArs {
  /**
   * express res
   * @description express 的 res
   */
  res: Response
  /**
   * @description express 的 req
   */
  req: Request
  /**
   * @description 表头配置，支持多级表头
   */
  headers: Header[][]
  sheetName?: string
  /**
   * @description 压缩等级
   */
  zlibLevel?: number
  /**
   * @description 合并表头配置
   * @example ['A1:D1', 'A2:D2']
   */
  merges?: string[]
  /**
   * @description mongoose cursor
   */
  cursor: Cursor<any, any>
  /**
   * @description 使用第几个header取值,默认为 headers.length - 1
   */
  dataHeaderIndex?: number
  /**
   * @description 表格列全局宽度
   */
  width?: number
}

function getHeaderStyle(header: Partial<Header>) {
  const { bold = true, size = 14, bgColor = 'D9D9D9', border = true } = header
  const style: Partial<ExcelJS.Column> = {}
  style.font = {
    name: '宋体',
    size,
    bold,
  }
  if (border) {
    style.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  }

  if (typeof bgColor === 'string') {
    // 背景色
    style.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: bgColor },
    }
  }
  style.alignment = { vertical: 'middle', horizontal: 'center' }
  return style
}
/**
 * @description express mongodb 流式导出 excel
 */
export async function excelCursorStream({
  req,
  res,
  headers,
  sheetName = 'Sheet 1',
  dataHeaderIndex,
  zlibLevel = 9,
  merges = [],
  cursor,
  width = 20,
}: ExcelStreamArs) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename=styled_sample.xlsx')
  res.setHeader('Transfer-Encoding', 'chunked')
  dataHeaderIndex = dataHeaderIndex ?? headers.length - 1
  const dataHeader = headers[dataHeaderIndex]
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    stream: res,
    useStyles: true,
    zip: {
      zlib: {
        level: zlibLevel,
      },
    },
  })
  const worksheet = workbook.addWorksheet(sheetName)
  const [_, ..._headers] = headers
  // 使用dataHeader设置第一项设置列宽度
  worksheet.columns = dataHeader.map((header, index) => {
    // 值和标题设置成第一项的
    const { title = '', dataIndex = '' } = _[index] ?? {}
    // 宽度使用数组表头的
    const { width: colWidth = width } = header
    return {
      header: title,
      width: colWidth,
      key: dataIndex,
    }
  })
  // 设置第一行的样式
  worksheet.getRow(1).eachCell((cell, index) => {
    const header = _[index - 1] ?? {}
    const style = getHeaderStyle(header)
    Object.assign(cell, { ...style })
  })

  // 插入后续的表头
  _headers.forEach((header, index) => {
    const merge = merges[index]
    const row = worksheet.addRow(header.map(item => item.title))
    // 设置表头样式，index从1开始的
    row.eachCell((cell, index) => {
      const styles = getHeaderStyle(header[index - 1])
      Object.assign(cell, { ...styles })
    })
    // 设置表头合并
    if (merge)
      worksheet.mergeCells(merge)
    row.commit()
  })

  req.on('close', () => {
    cursor.close()
    res.end()
  })
  // 设置值
  cursor.on('data', (doc) => {
    const row = worksheet.addRow(dataHeader.map<any>(({ renderCell, dataIndex }) => {
      const val = doc[dataIndex!]
      return renderCell ? renderCell(doc) : val
    }))
    // 设置单行样式, index从1开始的
    row.eachCell((cell, index) => {
      const { bold = false, size = 9, bgColor = false, border = true } = dataHeader[index - 1]
      if (border) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      }
      cell.font = {
        name: '宋体',
        size,
        bold,
      }
      if (typeof bgColor === 'string') {
        // 背景色
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        }
      }
      cell.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    row.commit()
  })

  cursor.on('end', async () => {
    await workbook.commit()
    res.end()
  })

  cursor.on('error', () => {
    res.status(500).send('Internal Server Error')
  })
}
