/**
 * CNB Generic Packages (制品库) 工具类
 */
// [修复] 静态引入 stream，防止动态 import 导致打包/运行错误
import { Readable } from 'stream'

// 定义并导出包常量
export const PACKAGE_NAME = 'imgbed-assets'
export const PACKAGE_VERSION = 'v1'

/**
 * 上传文件到 CNB 通用制品库
 */
export async function uploadToCnb({ fileBuffer, fileName }: { fileBuffer: Buffer, fileName: string }) {
  const slug = process.env.SLUG_IMG
  // 增加一些基本的环境变量检查日志
  if (!slug || !process.env.TOKEN_IMG) {
    console.error('Missing env vars: SLUG_IMG or TOKEN_IMG')
    throw new Error('Environment configuration error')
  }

  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

  const resp = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN_IMG}`,
      'Content-Type': 'application/octet-stream',
    },
    body: fileBuffer,
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`CNB Upload Failed: ${resp.status} - ${errText}`)
  }

  return {
    path: `/${fileName}`,
    filename: fileName
  }
}

/**
 * 从 CNB 通用制品库物理删除文件
 */
export async function deleteFromCnb(fileName: string) {
  const slug = process.env.SLUG_IMG
  const url = `https://api.cnb.cool/${slug}/-/packages/generic/${PACKAGE_NAME}/${PACKAGE_VERSION}/${fileName}`

  const resp = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.TOKEN_IMG}`,
    },
  })

  if (!resp.ok && resp.status !== 404) {
    const errText = await resp.text()
    throw new Error(`CNB Delete Failed: ${resp.status} - ${errText}`)
  }

  return true
}

/**
 * 创建代理处理函数
 */
export function createProxyHandler(baseUrl: string, requestConfig: any) {
  return async (req: any, res: any) => {
    try {
      const urlPath = req.params.path
      if (!urlPath || urlPath.includes('..')) {
        return res.status(400).json({ error: 'Invalid image path' })
      }

      const targetUrl = new URL(urlPath, baseUrl).toString()

      const fetchOptions = {
        method: 'GET',
        headers: requestConfig?.headers || {},
      }

      const response = await fetch(targetUrl, fetchOptions)

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        const contentLength = response.headers.get('content-length')
        
        if (contentType) res.setHeader('Content-Type', contentType)
        if (contentLength) res.setHeader('Content-Length', contentLength)
        
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')

        // [修复] 使用 Node.js 标准流传输，兼容性最好
        // @ts-ignore
        const nodeStream = Readable.fromWeb(response.body)
        nodeStream.pipe(res)
      } else {
        if (response.status === 404) {
           return res.status(404).send('Not Found')
        }
        res.status(response.status).json({ error: `Upstream error: ${response.statusText}` })
      }
    } catch (e: any) {
      console.error(`❌ [Proxy Error] ${e.message}`)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
}
