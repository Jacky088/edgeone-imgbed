<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { Trash2, ExternalLink, FileImage, AlertTriangle, ArrowLeft, Database } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import ThemeToggle from '@/components/ThemeToggle.vue'

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
const deletingId = ref<string | null>(null) // [新增] 删除状态跟踪

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
  if (!confirm('警告：此操作将【永久物理删除】远程文件，无法恢复！确定继续吗？')) return
  
  deletingId.value = id // 开启 Loading
  try {
    const { data } = await axios.post('/api/admin/delete', { id })
    if (data.code === 0) {
      toast.success('物理删除成功')
      list.value = list.value.filter(item => item.id !== id)
    } else {
      toast.error(data.msg || '删除失败')
    }
  } catch (e) {
    toast.error('网络请求失败')
  } finally {
    deletingId.value = null // 关闭 Loading
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
  <div class="aurora-bg min-h-screen p-6 transition-colors duration-300">
    <div class="mx-auto max-w-6xl">
      
      <div class="mb-8 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" @click="$router.push('/')" class="rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50">
            <ArrowLeft class="h-5 w-5" />
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">资源管理</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Generic Packages 物理存储</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <div class="glass-card overflow-hidden rounded-[2rem]">
        
        <div v-if="loading" class="flex flex-col items-center justify-center p-20 text-gray-500 dark:text-gray-400">
          <Database class="mb-4 h-10 w-10 animate-bounce opacity-50" />
          <div class="text-sm">正在同步远程数据...</div>
        </div>
        
        <div v-else-if="list.length === 0" class="flex flex-col items-center justify-center p-20 text-gray-400 dark:text-gray-600">
          <FileImage class="mb-4 h-16 w-16 opacity-20" />
          <p class="text-lg font-medium">暂无上传记录</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50/50 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400">
              <tr>
                <th class="px-6 py-4 font-medium">预览</th>
                <th class="px-6 py-4 font-medium">文件名 / 代理链接</th>
                <th class="px-6 py-4 font-medium">元数据</th>
                <th class="px-6 py-4 font-medium">上传时间</th>
                <th class="px-6 py-4 font-medium text-right">物理操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100/50 dark:divide-gray-800/50">
              <tr v-for="item in list" :key="item.id" class="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                <td class="px-6 py-4">
                  <div class="h-14 w-14 overflow-hidden rounded-xl border border-gray-200 bg-white p-1 shadow-sm transition-transform group-hover:scale-110 dark:border-gray-700 dark:bg-gray-800">
                    <img 
                      :src="item.thumbnailUrl || item.url" 
                      class="h-full w-full rounded-lg object-cover" 
                      alt="preview"
                      loading="lazy"
                    />
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="font-medium text-gray-900 truncate max-w-[240px] dark:text-gray-100" :title="item.name">
                    {{ item.name }}
                  </div>
                  <a :href="item.url" target="_blank" class="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400">
                    打开链接 <ExternalLink class="h-3 w-3" />
                  </a>
                </td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                  <div class="font-mono text-xs">{{ formatSize(item.size) }}</div>
                  <div class="mt-1 inline-flex rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                    {{ item.type ? item.type.split('/')[1] : 'UNK' }}
                  </div>
                </td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {{ formatDate(item.createdAt) }}
                </td>
                <td class="px-6 py-4 text-right">
                  <button 
                    @click="handleDelete(item.id)"
                    :disabled="deletingId === item.id"
                    class="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-100 hover:shadow-sm disabled:opacity-50 disabled:cursor-wait dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                    title="物理删除文件"
                  >
                    <Trash2 class="h-4 w-4" :class="{ 'animate-spin': deletingId === item.id }" />
                    <span v-if="deletingId === item.id">删除中</span>
                    <span v-else>销毁</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-6 flex items-start gap-3 rounded-2xl border border-yellow-100 bg-yellow-50/50 p-4 text-sm text-yellow-700 dark:border-yellow-900/30 dark:bg-yellow-900/10 dark:text-yellow-400">
        <AlertTriangle class="h-5 w-5 shrink-0 mt-0.5" />
        <p>安全警告：所有“销毁”操作均为物理删除，将直接调用 CNB Generic Packages DELETE 接口，文件一旦删除将无法恢复。</p>
      </div>
    </div>
  </div>
</template>
