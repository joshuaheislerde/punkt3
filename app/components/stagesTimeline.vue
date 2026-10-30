<script lang="ts" setup>
const languageStore = useLanguageStore();
const { t, tStatic } = useTranslation()
const { locale } = useI18n()
interface Props {
  type: 'career' | 'educational' | 'publication'
  items: (CareerStage | EducationalStage)[] | [] | null
  milestoneStyle?: 'square' | 'circle' // shape of the duration markers on the line
}
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

// ["3y", "2m"]
function durationParts(stage: CareerStage | EducationalStage): string[] {
  const months = durationInMonths(stage)
  const years = Math.floor(months / 12)
  const rest = months % 12
  return [
    years ? $t('duration_years_short', { n: years }) : '',
    rest ? $t('duration_months_short', { n: rest }) : '',
  ].filter(Boolean)
}

// each stage gets a marker whose area grows with the duration (size ~ sqrt of months)
const MARKER_MIN = 44
const MARKER_MAX = 64
const maxMonths = computed((): number =>
  Math.max(1, ...(props.items ?? []).map(stage => durationInMonths(stage)))
)

function markerSize(stage: CareerStage | EducationalStage): number {
  const ratio = Math.sqrt(durationInMonths(stage) / maxMonths.value)
  return Math.round(Math.max(MARKER_MIN, MARKER_MAX * ratio))
}

// all years a stage covers, newest first (the line runs from the latest year at the top to the start year at the bottom)
function stageYears(stage: CareerStage | EducationalStage): number[] {
  if (!stage.from) return []
  const start = new Date(stage.from).getFullYear()
  const end = stage.to ? new Date(stage.to).getFullYear() : new Date().getFullYear()
  return Array.from({ length: Math.max(1, end - start + 1) }, (_, i) => end - i)
}

// each year is labelled only once, at the topmost stage that covers it
const visibleYears = computed((): Map<string | number, number[]> => {
  const shown = new Set<number>()
  const result = new Map<string | number, number[]>()
  for (const stage of props.items ?? []) {
    const years = stageYears(stage).filter(year => !shown.has(year))
    years.forEach(year => shown.add(year))
    result.set(stage.id, years)
  }
  return result
})

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
      class="relative space-y-8 duration-timeline before:absolute before:h-full before:w-1 before:rounded-full before:bg-secondary">
      <li v-for="(stage, stageIndex) in items" :key="stage.id" class="list-none">
        <div class="relative flex items-stretch gap-2"
          :style="{ '--marker': `${markerSize(stage)}px`, '--ticks': visibleYears.get(stage.id)?.length ?? 0 }">
          <!-- marker on the line (size reflects the duration), below it the covered years along the line -->
          <div class="marker-column">
            <div class="duration-marker"
              :class="[milestoneStyle === 'square' ? 'rounded-md' : 'rounded-full', isOngoing(stage) ? 'border-dotted' : 'border-solid']">
              <span v-for="part in durationParts(stage)" :key="part">{{ part }}</span>
            </div>
            <div class="year-ticks">
              <span v-for="year in visibleYears.get(stage.id)" :key="year" class="year-tick">
                {{ year }}<span class="year-tick-mark"></span>
              </span>
            </div>
          </div>
          <div class="relative flex flex-col w-full gap-2 -mt-1 marker-min-height">
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
            <div v-if="type === 'career'" class="font-bold text-base-content">
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
            <div v-if="t(stage, 'additional_info')" class="relative">
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

/* timeline: the line runs through the centre of the duration markers, the covered years are listed along the line; smaller on mobile */
.duration-timeline {
  --column: 56px;
  --marker-scale: 0.85;
  padding-left: 0 !important;
}

.duration-timeline::before {
  left: calc(var(--column) / 2 - 2px);
}

.marker-column {
  @apply flex flex-col items-center -mt-1 shrink-0;
  width: var(--column);
}

/* years sit left of the line below the marker, evenly spaced, each with a small tick touching the line */
.year-ticks {
  @apply flex flex-col w-full pt-1 font-semibold leading-none text-secondary-content dark:text-secondary-content-dark;
  padding-right: calc(50% + 2px);
  font-size: 0.5625rem;
}

.year-tick {
  @apply flex items-center justify-end h-5 gap-0.5;
}

.year-tick-mark {
  @apply w-1.5 h-0.5 rounded-full bg-secondary;
}

.duration-marker {
  @apply flex flex-row items-center justify-center gap-0.5 font-bold whitespace-nowrap leading-tight text-center border-2 ring-4 ring-base-100 border-secondary text-base-content;
  width: max(40px, calc(var(--marker) * var(--marker-scale)));
  height: max(40px, calc(var(--marker) * var(--marker-scale)));
  font-size: 0.625rem;
  background: color-mix(in oklab, var(--color-secondary) 25%, var(--color-base-100));
}

.marker-min-height {
  min-height: calc(max(40px, var(--marker) * var(--marker-scale)) + var(--ticks) * 1.25rem);
}

@media (min-width: 48rem) {
  .duration-timeline {
    --column: 64px;
    --marker-scale: 1;
  }

  .year-ticks {
    font-size: 0.625rem;
  }

  .duration-marker {
    font-size: 0.6875rem;
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
</style>
