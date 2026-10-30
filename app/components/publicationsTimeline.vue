<script lang="ts" setup>
interface Props {
  items: Publication[]
  milestoneStyle?: 'square' | 'circle' | 'diamond' | 'triangle'
}
/*  Attention!:
* 'triangle' is an experimantal feature and it is just ok in firefox based browsers
* I don't know about Safari
*/
const props = withDefaults(defineProps<Props>(), {
  milestoneStyle: 'circle'
})

const config = useRuntimeConfig()
const API_URL: string = config.public.apiURL

const landingStore = useLandingStore()
const { tStatic } = useTranslation()
const { initials, fullTitle, toIeee, toBibtex } = useCitation()

// items are already sorted (newest first), so grouping keeps that order
const groupedByYear = computed((): Array<{ year: string, publications: Publication[] }> => {
  const groups: Array<{ year: string, publications: Publication[] }> = []
  for (const pub of props.items ?? []) {
    const year = pub.year ?? '–'
    const group = groups.find(g => g.year === year)
    if (group) group.publications.push(pub)
    else groups.push({ year, publications: [pub] })
  }
  return groups
})

function isMe(author: Author): boolean {
  const name = landingStore.landingData?.my_name
  return !!name && `${author.first_name} ${author.last_name}`.trim() === name.trim()
}

// shows a short "copied" hint on the button that was used
const copiedKey = ref<string | null>(null)
async function copy(text: string, key: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = key
    setTimeout(() => { if (copiedKey.value === key) copiedKey.value = null }, 2000)
  } catch (error) {
    console.error('Could not copy to clipboard:', error)
  }
}

</script>

<template>
  <ol v-if="(items && items.length > 0)"
    class="relative space-y-10 before:absolute before:h-full before:w-1 before:rounded-full before:bg-secondary !pl-1 md:!pl-3 post-content-none">
    <li v-for="group in groupedByYear" :key="group.year" class="list-none post-content-none">
      <div class="relative flex items-center gap-3 -ml-2">
        <span v-if="milestoneStyle === 'circle'"
          class="rounded-full bg-secondary size-5 shrink-0 ring-2 ring-base-100 -ml-2.25">
        </span>
        <span v-else-if="milestoneStyle === 'square'"
          class="rounded-sm bg-secondary size-4.5 shrink-0 ring-2 ring-base-100 -ml-2">
        </span>
        <span v-else-if="milestoneStyle === 'diamond'"
          class="rotate-45 rounded-sm bg-secondary size-4.5 shrink-0 ring-2 ring-base-100 ml-0.25">
        </span>
        <div v-else-if="milestoneStyle === 'triangle'"
          class="relative flex items-center justify-center -ml-[2.25px]">
          <span class="triangle-ring absolute -mt-0.5"></span>
          <span class="triangle shrink-0 bg-secondary">
          </span>
        </div>
        <span class="text-xl font-bold">{{ group.year }}</span>
      </div>

      <div class="mt-3 ml-5 md:ml-6">
        <article v-for="(pub, pubIndex) in group.publications" :key="pub.id">
          <div class="flex flex-col gap-1">
            <span class="text-lg font-bold leading-snug">{{ fullTitle(pub) }}</span>
            <span v-if="pub.authors?.length">
              <template v-for="(author, idx) in pub.authors" :key="idx">
                <span :class="isMe(author) ? 'font-bold underline decoration-primary decoration-2 underline-offset-3' : ''">
                  {{ [initials(author), author.prefix, author.last_name].filter(Boolean).join(' ') }}</span><span
                  v-if="idx < pub.authors.length - 1">, </span>
              </template>
            </span>
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1 text-base-content/80">
              <span class="px-1.5 text-xs font-semibold uppercase rounded-xs bg-base-200 text-base-content">
                {{ pub.journal ? tStatic('publication_journal') : tStatic('publication_conference') }}
              </span>
              <span>
                <span class="italic">{{ pub.journal || pub.conference }}</span><template
                  v-if="pub.location"> · {{ pub.location }}</template><template
                  v-if="pub.publisher"> · {{ pub.publisher }}</template>
              </span>
            </span>
          </div>

          <div class="flex flex-wrap gap-2 mt-3">
            <a v-if="pub.file" :href="`${API_URL}/assets/${pub.file}`" target="_blank" rel="noopener"
              class="post-content-none pub-action">{{ tStatic('publication_pdf') }}</a>
            <a v-if="pub.identifier?.type === 'DOI' && pub.identifier.value"
              :href="`https://doi.org/${pub.identifier.value}`" target="_blank" rel="noopener"
              class="post-content-none pub-action">DOI: {{ pub.identifier.value }}</a>
            <span v-else-if="pub.identifier?.value" class="pub-action !cursor-default">
              {{ pub.identifier.type }}: {{ pub.identifier.value }}
            </span>
            <a v-else-if="pub.url" :href="pub.url" target="_blank" rel="noopener"
              class="post-content-none pub-action">URL</a>
            <button type="button" class="pub-action" @click="copy(toIeee(pub), `ieee-${pub.id}`)">
              {{ copiedKey === `ieee-${pub.id}` ? tStatic('publication_copied') : tStatic('publication_cite') }}
            </button>
            <button type="button" class="pub-action" @click="copy(toBibtex(pub), `bib-${pub.id}`)">
              {{ copiedKey === `bib-${pub.id}` ? tStatic('publication_copied') : tStatic('publication_bibtex') }}
            </button>
          </div>

          <div v-if="group.publications[pubIndex + 1]" class="divider">
            <div class="h-fit my-5 max-w-full border-t-3 border-dotted !border-base-200">
            </div>
          </div>
        </article>
      </div>
    </li>
  </ol>
</template>
<style scoped>
@reference "~/assets/css/main.css";

.pub-action {
  @apply px-2 py-0.5 text-sm font-semibold transition-all border-2 rounded-sm cursor-pointer bg-accent text-accent-content border-base-content hover:bg-primary hover:text-primary-content focus:outline-2 focus:outline-primary active:scale-97;
}

.triangle {
  --r: 0.2rem;
  width: 1.55rem;
  aspect-ratio: 1/cos(30deg);
  --_g: calc(tan(60deg)*var(--r)) bottom var(--r), #000 98%, #0000 101%;
  -webkit-mask:
    conic-gradient(from -30deg at 50% calc(200% - 3*var(--r)/2), #000 60deg, #0000 0) 0 100%/100% calc(100% - 3*var(--r)/2) no-repeat,
    radial-gradient(var(--r) at 50% calc(2*var(--r)), #000 98%, #0000 101%),
    radial-gradient(var(--r) at left var(--_g)),
    radial-gradient(var(--r) at right var(--_g));
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background: var(--color-secondary);
}

.triangle-ring {
  --r: 0.3rem;
  width: calc(1.55rem + 8px);
  aspect-ratio: 1/cos(30deg);
  --_g: calc(tan(60deg)*var(--r)) bottom var(--r), #000 98%, #0000 101%;
  -webkit-mask:
    conic-gradient(from -30deg at 50% calc(200% - 3*var(--r)/2), #000 60deg, #0000 0) 0 100%/100% calc(100% - 3*var(--r)/2) no-repeat,
    radial-gradient(var(--r) at 50% calc(2*var(--r)), #000 98%, #0000 101%),
    radial-gradient(var(--r) at left var(--_g)),
    radial-gradient(var(--r) at right var(--_g));
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  background: var(--color-base-100);
}
</style>