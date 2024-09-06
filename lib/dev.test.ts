import { describe, expect, it } from 'vitest'
import { withProxyLogger } from '@/dev'

describe('dev', () => {
  it('withProxyLogger inject onProxyReq', () => {
    expect(withProxyLogger({
      '/api': {

      },
    }).onProxyReq).toEqual(expect.any(Function))
  })
})
