import { describe, expect, it } from 'vitest'
import { withProxyLogger } from '@/dev'

const proxy = {
  '/api': {},
}
describe('dev', () => {
  it('withProxyLogger inject onProxyReq', () => {
    withProxyLogger(proxy)
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    expect(proxy['/api'].onProxyReq).toEqual(expect.any(Function))
  })
})
