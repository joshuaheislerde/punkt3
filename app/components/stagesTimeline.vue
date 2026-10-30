<script lang="ts" setup>
const languageStore = useLanguageStore();
const { t, tStatic } = useTranslation()
const { locale } = useI18n()
interface Props {
  type: 'career' | 'educational' | 'publication'
  items: (CareerStage | EducationalStage)[] | [] | null
  milestoneStyle?: 'square' | 'circle' | 'diamond' | 'triangle'
}
/*  Attention!:
* 'triangle' is an experimantal feature and it is just ok in firefox based browsers
* I don't know about Safari
*/
const props = withDefaults(defineProps<Props>(), {
  milestoneStyle: 'circle'
})

const { t: $t } = useI18n()
const router = useRouter()
const localePath = useLocalePath()

// the end month counts as a full month (to: 2022-07-01 means until July 2022)
function durationInMonths(stage: CareerStage | EducationalStage): number {
  if (!stage.from) return 0
  const start = new Date(stage.from)
  const end = stage.to ? new Date(stage.to) : new Date()
  return Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1)
}

// ["3 yrs", "2 mos"]
function durationParts(stage: CareerStage | EducationalStage): string[] {
  const months = durationInMonths(stage)
  const years = Math.floor(months / 12)
  const rest = months % 12
  return [
    years ? $t('duration_years', years) : '',
    rest ? $t('duration_months', rest) : '',
  ].filter(Boolean)
}

// career stages get a circle whose area grows with the duration (diameter ~ sqrt of months)
const CIRCLE_MIN = 56
const CIRCLE_MAX = 104
const maxMonths = computed((): number =>
  Math.max(1, ...(props.items ?? []).map(stage => durationInMonths(stage)))
)

function circleSize(stage: CareerStage | EducationalStage): number {
  const ratio = Math.sqrt(durationInMonths(stage) / maxMonths.value)
  return Math.round(Math.max(CIRCLE_MIN, CIRCLE_MAX * ratio))
}

function isOngoing(stage: CareerStage | EducationalStage): boolean {
  return !!stage.until_today || !stage.to
}

// grades are maintained as free text, so unify the decimal separator per language
function formatGrade(value: string): string {
  return locale.value.startsWith('de') ? value.replace('.', ',') : value.replace(',', '.')
}

// long descriptions are collapsed; the toggle is only shown if the text actually overflows
const COLLAPSED_HEIGHT = 72
const descriptionRefs = new Map<string | number, HTMLElement>()
const overflowing = ref(new Set<string | number>())
const expanded = ref(new Set<string | number>())

function setDescriptionRef(id: string | number, el: unknown): void {
  if (el instanceof HTMLElement) descriptionRefs.set(id, el)
  else descriptionRefs.delete(id)
}

function measureDescriptions(): void {
  const next = new Set<string | number>()
  descriptionRefs.forEach((el, id) => {
    if (el.scrollHeight > COLLAPSED_HEIGHT + 8) next.add(id)
  })
  overflowing.value = next
}

function toggleDescription(id: string | number): void {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

onMounted(() => nextTick(measureDescriptions))
watch(locale, () => nextTick(measureDescriptions))

// internal links from WYSIWYG content (e.g. "/publications") use SPA navigation
function handleHtmlClick(e: MouseEvent): void {
  const link = (e.target as HTMLElement | null)?.closest('a')
  const href = (link?.getAttribute('href') || '').trim()
  if (!href.startsWith('/') || href.startsWith('//')) return
  e.preventDefault()
  router.push(localePath(href))
}
</script>

<template>
  <div v-if="(items && items.length > 0)">
    <h3 v-if="type === 'career'">{{ tStatic('my_career_stages') }}</h3>
    <h3 v-else-if="type === 'educational'">{{ tStatic('my_education_stages') }}</h3>
    <ol
      class="relative !pl-1 md:!pl-3 space-y-8 before:absolute before:-ml-px before:h-full before:w-1 before:rounded-full before:bg-secondary">
      <li v-for="(stage, stageIndex) in items" :key="stage.id" class="list-none">
        <div class="relative flex items-start gap-2">
          <span v-if="milestoneStyle === 'circle'"
            class="-mt-1 rounded-full bg-secondary size-5 shrink-0 ring-2 ring-base-100  -ml-2.25">
          </span>
          <span v-else-if="milestoneStyle === 'square'"
            class="-mt-1 rounded-sm bg-secondary size-4.5 shrink-0 ring-2 ring-base-100  -ml-2">
          </span>
          <span v-else-if="milestoneStyle === 'diamond'"
            class="-mt-1 rotate-45 rounded-sm bg-secondary size-4.5 shrink-0 ring-2 ring-base-100 ml-0.25">
          </span>
          <div v-else-if="milestoneStyle === 'triangle'"
            class="relative flex items-center justify-center -mt-1 -ml-[2.25px]">
            <span class="triangle-ring absolute -mt-0.5"></span>
            <span class="triangle shrink-0 bg-secondary">
            </span>
          </div>
          <div class="relative flex flex-col w-full gap-2 -mt-1"
            :style="type === 'career' ? { '--circle': `${circleSize(stage)}px` } : {}">
            <div v-if="type === 'career' && durationParts(stage).length" class="duration-circle"
              :class="isOngoing(stage) ? 'border-dotted' : 'border-solid'">
              <span v-for="part in durationParts(stage)" :key="part">{{ part }}</span>
            </div>
            <div
              class="flex flex-col flex-wrap items-start justify-between gap-2 text-sm font-medium md:flex-row text-secondary-content dark:text-secondary-content-dark">
              <div class="flex">
                <div v-if="stage.date_display === 'year'" class="flex flex-row items-center gap-1">
                  <nuxt-time v-if="stage.from" :datetime="stage.from" year="numeric"
                    :locale="locale"></nuxt-time>
                  <span>-</span>
                  <nuxt-time v-if="stage.to" :datetime="stage.to" year="numeric"
                    :locale="locale"></nuxt-time>
                  <div v-else-if="stage.until_today">{{ tStatic('today') }}</div>
                  <div></div>
                </div>
                <div v-else-if="stage.date_display === 'month_year'"
                  class="flex flex-row items-center gap-1">
                  <nuxt-time v-if="stage.from" :datetime="stage.from" month="long" year="numeric"
                    :locale="locale"></nuxt-time>
                  <span>-</span>
                  <nuxt-time v-if="stage.to" :datetime="stage.to" month="long" year="numeric"
                    :locale="locale"></nuxt-time>
                  <div v-else-if="stage.until_today">{{ tStatic('today') }}</div>
                </div>
                <div v-else-if="stage.date_display === 'full'"
                  class="flex flex-row items-center gap-1">
                  <nuxt-time v-if="stage.from" :datetime="stage.from" day="numeric" month="long"
                    year="numeric" :locale="locale"></nuxt-time>
                  <span>-</span>
                  <nuxt-time v-if="stage?.to" :datetime="stage.to" day="numeric" month="long"
                    year="numeric" :locale="locale"></nuxt-time>
                  <div v-else-if="stage.until_today">{{ tStatic('today') }}</div>
                </div>
                <span v-if="t(stage, 'employment_level') && type === 'career'" class="text-sm">
                  &nbsp;({{ t(stage, 'employment_level') }})
                </span>
              </div>
              <div>{{ t(stage, 'location') }}</div>
            </div>
            <div v-if="type === 'career'" class="font-bold text-base-content circle-gap">
              <p class="text-lg">
                {{ t(stage, 'position') }}
              </p>
              <p>
                {{ t(stage, 'company') }}
              </p>
            </div>
            <div v-else-if="type === 'educational'">
              <div class="font-bold text-base-content">
                <p class="text-lg">
                  {{ t(stage, 'degree') }}
                </p>
                <p>{{ t(stage, 'institution') }}
                </p>
              </div>
              <div class="text-sm">
                <div v-if="t(stage, 'final_thesis_title') || t(stage, 'final_thesis_grade')"
                  class="py-2">
                  <div v-if="t(stage, 'final_thesis_title')" class="font-medium">{{
                    tStatic('final_thesis') }}:</div>
                  <div>{{ t(stage, 'final_thesis_title') }}</div>
                  <div v-if="t(stage, 'final_thesis_grade')">({{ tStatic('grading') }}: {{ formatGrade(t(stage, 'final_thesis_grade')) }})
                  </div>
                </div>
                <div v-if="t(stage, 'final_grade')" class="font-medium ">
                  {{ tStatic('final_grade') }}: {{ formatGrade(t(stage, 'final_grade')) }}
                </div>
              </div>
            </div>
            <div v-if="t(stage, 'additional_info')" class="relative"
              :class="{ 'circle-gap': type === 'career' }">
              <div :ref="el => setDescriptionRef(stage.id, el)" v-html="t(stage, 'additional_info')"
                class="overflow-hidden text-sm stage-description"
                :class="{ 'collapsed': overflowing.has(stage.id) && !expanded.has(stage.id) }"
                :style="overflowing.has(stage.id) && !expanded.has(stage.id) ? { maxHeight: `${COLLAPSED_HEIGHT}px` } : {}"
                @click="handleHtmlClick">
              </div>
              <button v-if="overflowing.has(stage.id)" type="button"
                class="mt-1 text-sm font-semibold cursor-pointer text-secondary-content dark:text-secondary-content-dark hover:underline"
                @click="toggleDescription(stage.id)">
                {{ expanded.has(stage.id) ? tStatic('show_less') : tStatic('show_more') }}
              </button>
            </div>
          </div>
        </div>
        <div v-if="items[stageIndex + 1]" class="pl-4 divider">
          <div class="h-fit my-4 max-w-full border-t-3 border-dotted !border-base-200">
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
@reference "~/assets/css/main.css";

/* career duration bubble: sits on the right below date/location; smaller on mobile */
.duration-circle {
  @apply absolute right-0 flex flex-col items-center justify-center text-xs font-bold leading-tight text-center border-2 rounded-full top-14 md:top-8 bg-secondary/25 border-secondary text-base-content;
  width: calc(var(--circle) * 0.75);
  height: calc(var(--circle) * 0.75);
}

.circle-gap {
  padding-right: calc(var(--circle) * 0.75 + 0.75rem);
}

@media (min-width: 48rem) {
  .duration-circle {
    @apply text-sm;
    width: var(--circle);
    height: var(--circle);
  }

  .circle-gap {
    padding-right: calc(var(--circle) + 1rem);
  }
}

.stage-description.collapsed {
  -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent);
  mask-image: linear-gradient(to bottom, #000 55%, transparent);
}

.stage-description :deep(ul) {
  margin: 0.25rem 0 0 0 !important;
}

.stage-description :deep(li) {
  margin: 0.125rem 0 !important;
}

.stage-description :deep(small) {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  line-height: 1rem;
  opacity: 0.75;
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