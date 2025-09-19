<script setup lang="ts">
import type { ComputedRef } from 'vue'

const projectStore = useProjectStore()
const cvStore = useCvStore()
const router = useRouter()

definePageMeta({
  layout: 'sidebars',
  hasHeader: true,
  hasSubMenu: false,
  scrollToTop: true
})

const { t, tStatic } = await useTranslation()

const config = useRuntimeConfig()
const API_URL: string = config.public.apiURL

</script>
<template>
  <div class="flex flex-col gap-0" v-if="cvStore.cvData">
    <div v-if="cvStore.cvData.publications && cvStore.cvData.publications.length > 0"
      class="p-1 rounded-sm bg-base-100">
      <div class="border-2 border-dotted rounded-sm bg-base-100 border-base-200 post-content">
        <h2 class="p-2 pb-0">{{ tStatic('publications') }}</h2>
        <div class="p-2">
          <publications-timeline :items="cvStore.cvData.publications" milestone-style="diamond" />
        </div>
      </div>
    </div>
  </div>
</template>
<style>
.delayed {
  transition-duration: 1s;
}
</style>