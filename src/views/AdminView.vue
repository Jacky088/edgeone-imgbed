<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { Trash2, ExternalLink, FileImage, AlertCircle } from 'lucide-vue-next'
import { Button } from '@/components/ui/button' // 假设你已经有 Button 组件导出
import { toast } from 'vue-sonner'

interface ImageRecord {
  id: string
  name: string
  url: string
  thumbnailUrl?: string
  size: number
  type: string
  createdAt: number
}

const list = ref<ImageRecord[]>([])
const loading = ref(false)

const fetchList = async () => {
  loading.value = true
  try {
    const { data } = await axios.get('/api/admin/list')
    if (data.code === 0) {
      list.value = data.data
    }
  } catch (e) {
    toast.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这条记录吗？(注意：远程文件可能仍需手动清理)')) return
  try {
    const { data } = await axios.post('/api/admin/delete', { id })
    if (data.code === 0) {
      toast.success('记录已删除')
      list.value = list.value.filter(item => item.id !== id)
    } else {
      toast.error(data.msg)
    }
  } catch (e) {
    toast.error('删除失败')
  }
}

const formatDate = (ts: number) => {
  return new Date(ts).toLocaleString()
}

const formatSize = (bytes: number) => {
  return (bytes / 1024).toFixed(2) + ' KB'
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="mx-auto max-w-5xl">
      <div class="mb-6 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">图片管理后台</h1>
        <Button variant="outline" @click="$router.push('/')">返回上传</Button>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div v-if="loading" class="p-8 text-center text-gray-500">加载中...</div>
        
        <div v-else-if="list.length === 0" class="flex flex-col items-center justify-center p-12 text-gray-400">
          <FileImage class="mb-2 h-12 w-12 opacity-20" />
          <p>暂无上传记录</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-500">
              <tr>
                <th class="px-6 py-3 font-medium">缩略图</th>
                <th class="px-6 py-3 font-medium">文件名 / 链接</th>
                <th class="px-6 py-3 font-medium">信息</th>
                <th class="px-6 py-3 font-medium">上传时间</th>
                <th class="px-6 py-3 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="item in list" :key="item.id" class="hover:bg-gray-50/50">
                <td class="px-6 py-3">
                  <div class="h-12 w-12 overflow-hidden rounded border bg-gray-100">
                    <img 
                      :src="item.thumbnailUrl || item.url" 
                      class="h-full w-full object-cover" 
                      alt="preview"
                    />
                  </div>
                </td>
                <td class="px-6 py-3">
                  <div class="font-medium text-gray-900 truncate max-w-[200px]" :title="item.name">
                    {{ item.name }}
                  </div>
                  <a :href="item.url" target="_blank" class="mt-1 flex items-center text-xs text-blue-500 hover:underline">
                    查看原图 <ExternalLink class="ml-1 h-3 w-3" />
                  </a>
                </td>
                <td class="px-6 py-3 text-gray-500">
                  <div>{{ formatSize(item.size) }}</div>
                  <div class="text-xs uppercase bg-gray-100 px-1.5 py-0.5 rounded w-fit mt-1">{{ item.type.split('/')[1] }}</div>
                </td>
                <td class="px-6 py-3 text-gray-500">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="px-6 py-3 text-right">
                  <button 
                    @click="handleDelete(item.id)"
                    class="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
                    title="删除记录"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-xs text-blue-700">
        <AlertCircle class="h-4 w-4 shrink-0 mt-0.5" />
        <p>注意：由于对象存储API限制，目前的“删除”操作仅移除本地的历史记录，不会物理删除远程服务器上的文件。</p>
      </div>
    </div>
  </div>
</template>
