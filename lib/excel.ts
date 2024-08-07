import ExcelJS from 'exceljs'
import type { Request, Response } from 'express'

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
   * @description 数值列取值key
   */
  dataIndex?: string
  /**
   * @description 数值列字体大小
   */
  size?: number
  /**
   * @description 表格标题列字体大小
   */
  headerSize?: number
  /**
   * @description 数值列字体是否加粗
   */
  bold?: boolean
  /**
   * @description 表格标题字体是否加粗
   */
  headerBold?: boolean
  /**
   * @description 数值列水平布局
   */
  horizontal?: ExcelJS.Alignment['horizontal']
  /**
   * @description 表格标题列水平布局
   */
  headerHorizontal?: ExcelJS.Alignment['horizontal']
  /**
   * @description 数值列垂直布局
   */
  vertical?: ExcelJS.Alignment['vertical']
  /**
   * @description 表格标题列垂直布局
   */
  headerVertical?: ExcelJS.Alignment['vertical']
  /**
   * @description 数值列是否带边框
   */
  border?: boolean
  /**
   * @description 表格标题列是否带边框
   */
  headerBorder?: boolean
  /**
   * @description 表格标题列背景色 设置为false则不使用背景色
   */
  bgColor?: false | string
  /**
   * @description 表头背景色 设置为false则不使用背景色
   */
  headerBgColor?: false | string
  /**
   * @description 表格数值列取值自定义,只对使用dataHeaderIndex指定的表头有效
   */
  renderCell?: <T>(data: T) => any
}
export interface ExcelStreamArs {
  /**
   * excel 文件名
   */
  filename: string
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
  cursor: any
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
  const { headerBold = true, headerSize = 14, headerBgColor = 'D9D9D9', headerBorder = true, headerHorizontal = 'center', headerVertical = 'middle' } = header
  const style: Partial<ExcelJS.Column> = {}
  style.font = {
    name: '宋体',
    size: headerSize,
    bold: headerBold,
  }
  if (headerBorder) {
    style.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  }

  if (headerBgColor !== false && typeof headerBgColor === 'string') {
    // 背景色
    style.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: headerBgColor },
    }
  }
  style.alignment = { vertical: headerVertical, horizontal: headerHorizontal }
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
  filename,
  width = 20,
}: ExcelStreamArs) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  // 需要暴露Content-Disposition否则客户端无法获取文件名称
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition')
  res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}.xlsx`)
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
      const { bold = false, size = 9, bgColor = false, border = true, horizontal = 'left', vertical = 'middle' } = dataHeader[index - 1]
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
      if (bgColor !== false && typeof bgColor === 'string') {
        // 背景色
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: bgColor },
        }
      }
      cell.alignment = { vertical, horizontal }
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
