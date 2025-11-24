import express from 'express'
import { uploadToCnb, createProxyHandler } from './_utils'
import { reply } from './_reply'
import { store, type ImageRecord } from './_store' // [新增] 引入存储
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid' // 建议安装 uuid 或使用简单的随机数生成

const upload = multer()
const app = express()

// ... (原有配置代码保持不变) ...
const requestConfig = {
  responseType: 'arraybuffer',
  timeout: 5000,
  headers: {
    Accept: 'image/*, */*',
    'User-Agent': 'SeerImageProxy/1.0 (+https://seerinfo.yuyuqaq.cn)',
  },
}
const BASE_URL = 'https://cnb.cool/' + process.env.SLUG_IMG + '/-/imgs/'

// ... (中间件保持不变) ...
app.use(express.json()) // [新增] 解析 JSON body 用于删除接口

// [新增] 管理接口：获取图片列表
app.get('/admin/list', (req, res) => {
  const list = store.getAll()
  res.json(reply(0, '获取成功', list))
})

// [新增] 管理接口：删除图片 (注：目前仅删除记录，CNB API 如不支持删除则无法物理删除)
app.post('/admin/delete', (req, res) => {
  const { id } = req.body
  if (!id) return res.status(400).json(reply(1, 'ID不能为空', null))
  
  store.remove(id)
  res.json(reply(0, '删除成功', null))
})

// ... (原有 GET /img/*path 保持不变) ...
app.get('/img/*path', createProxyHandler(BASE_URL, requestConfig))


app.post(
  '/upload/img',
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // ... (原有上传逻辑保持不变) ...
      const files = req.files as { [fieldname: string]: Express.Multer.File[] }
      if (!files || !files.file) {
        return res.status(400).json(reply(1, '未上传文件', ''))
      }

      const mainFile = files.file?.[0]
      const thumbnailFile = files.thumbnail?.[0]

      const mainResult = await uploadToCnb({
        fileBuffer: mainFile.buffer,
        fileName: mainFile.originalname,
      })

      const baseUrl = process.env.BASE_IMG_URL
      const mainImgPath = extractImagePath(mainResult.url)
      const mainUrl = baseUrl + mainImgPath

      let thumbnailUrl = null
      let thumbnailAssets = null

      if (thumbnailFile) {
        const thumbnailResult = await uploadToCnb({
          fileBuffer: thumbnailFile.buffer,
          fileName: thumbnailFile.originalname,
        })
        const thumbnailImgPath = extractImagePath(thumbnailResult.url)
        thumbnailUrl = baseUrl + thumbnailImgPath
        thumbnailAssets = thumbnailResult.assets
      }

      // [新增] 保存上传记录
      const record: ImageRecord = {
        id: uuidv4(), // 如果没有 uuid 库，可以使用 Date.now().toString()
        name: mainFile.originalname,
        url: mainUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        size: mainFile.size,
        type: mainFile.mimetype,
        createdAt: Date.now()
      }
      store.add(record)

      res.json(
        reply(0, '上传成功', {
          url: mainUrl,
          thumbnailUrl: thumbnailUrl,
          assets: mainResult.assets,
          thumbnailAssets: thumbnailAssets,
          hasThumbnail: !!thumbnailFile,
        }),
      )
    } catch (err) {
      console.error('上传失败:', err.response?.data || err.message)
      res.status(500).json(reply(1, '上传失败', err.message))
    }
  },
)

// ... (extractImagePath 保持不变) ...
function extractImagePath(url) {
  if (url.includes('-/imgs/')) {
    return url.split('-/imgs/')[1]
  } else if (url.includes('-/files/')) {
    return url.split('-/files/')[1]
  }
  return url
}

export default app
