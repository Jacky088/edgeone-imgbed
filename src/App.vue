<script setup lang="ts">
import { RouterView } from 'vue-router'
import { Toaster } from 'vue-sonner'
import { useTheme } from '@/composables/useTheme'

const { theme } = useTheme()
</script>

<template>
  <RouterView />
  
  <Toaster 
    position="top-center" 
    :theme="theme" 
    richColors 
    closeButton
    class="!z-[99999]"
    :toastOptions="{
      class: '!rounded-xl !border-0 !shadow-2xl !py-3 !px-5 !text-sm !font-medium !gap-3',
      style: {
        marginTop: '2rem' // 距离顶部稍微多一点距离
      }
    }"
  />
</template>

<style>
/* 🚑 紧急样式补丁 
  如果 vue-sonner 的默认 CSS 没加载成功，这段代码会强制把弹窗固定在屏幕正上方居中。
  这能完美解决弹窗出现在左下角的问题。
*/
:root {
  --toaster-width: 356px;
}

/* 强制定位容器 */
ol[data-sonner-toaster] {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  width: 100% !important;
  height: 100vh !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important; /* 核心：水平居中 */
  justify-content: flex-start !important; /* 核心：从顶部开始 */
  pointer-events: none !important;
  z-index: 99999 !important;
}

/* 恢复内部点击事件 */
li[data-sonner-toast] {
  pointer-events: auto !important;
}
</style>
