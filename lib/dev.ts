const options = {
  onProxyReq: (proxyReq, req) => {
    // 构造完整的代理 URL 并打印
    const completeUrl = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`
    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${completeUrl}`)
  },
}

/**
 * @description 代理日志
 * @param proxy
 */
export function withProxyLogger<T extends Record<string, any>>(proxy: T) {
  Object.values(proxy).forEach((value) => {
    if (typeof value === 'object') {
      Object.assign(value, options)
    }
  })
}
