<script setup lang="ts">
definePageMeta({
    layout: 'default',
    scrollToTop: true,
})
const localePath = useLocalePath()
const router = useRouter()
const config = useRuntimeConfig()
const API_URL: string = config.public.apiURL

const designStore = useDesignStore();
const landingStore = useLandingStore();
const cvStore = useCvStore();

const { t, tMenuItem, tStatic } = useTranslation()
const { landingData } = storeToRefs(landingStore) as { landingData: Ref<Landing | null> }

useLandingSeo(landingData)

const opening_line: Ref<HTMLElement | null> = ref(null);
const about_me: Ref<HTMLElement | null> = ref(null);
const menu_items: Ref<HTMLElement | null> = ref(null);

type DimensionKey = 'opening_line' | 'about_me' | 'menu_items'
const { saveDimensions } = useElementDimensions<DimensionKey>({
    set: designStore.setLandingPageDesign
})

saveDimensions(opening_line, 'opening_line')
saveDimensions(about_me, 'about_me')
saveDimensions(menu_items, 'menu_items')

const mainMenuItems = computed((): Array<MenuItem> => landingData.value?.menu_items ?? [])

// With opening_line_mode 'current_stages' the opening line is built from the ongoing CV stages.
// Falls back to the custom opening line if there are no ongoing stages.
const currentStageLines = computed((): Array<{ key: string, title: string, subtitle: string }> => {
    if (landingData.value?.opening_line_mode !== 'current_stages') return []
    const career = cvStore.currentCareerStages.map(stage => ({
        key: `career-${stage.id}`,
        title: t(stage, 'position'),
        subtitle: `${tStatic('opening_line_at')} ${t(stage, 'company')}`,
    }))
    const education = cvStore.currentEducationalStages.map(stage => ({
        key: `education-${stage.id}`,
        title: t(stage, 'degree'),
        subtitle: `${tStatic('opening_line_in_progress')} · ${t(stage, 'institution')}`,
    }))
    return [...career, ...education].filter(line => line.title)
})

// With opening_line_mode 'full_name' only the name is shown; otherwise the custom opening line
const openingLineText = computed((): string => {
    if (landingData.value?.opening_line_mode === 'full_name' && landingData.value.my_name) {
        return landingData.value.my_name
    }
    return t(landingData.value, 'opening_line')
})

const htmlLink = ref<HTMLElement | null>(null)

function isInternalLink(href: string): boolean {
    return !!href && href.startsWith('/') && !href.startsWith('//') && !href.startsWith('mailto') && !href.startsWith('www.')
}

function handleHtmlClick(e: MouseEvent) {
    //converting all internal links (that will come throught v-html from WYSIWYG) to NuxtLink for SPA navigation
    // might be good to outsource this into a composable
    const target = e.target as HTMLElement | null
    if (!target) return
    const link = target.closest('a')
    if (!link) return
    const href = (link.getAttribute('href') || '').trim()
    if (!isInternalLink(href)) return
    e.preventDefault()
    router.push(localePath(href))
}
</script>
<template>
    <div v-if="landingData" class="relative">
        <div class="flex flex-col items-center justify-center max-w-5xl">
            <div class="my-11" ref="opening_line">
                <h1 v-if="currentStageLines.length"
                    class="flex flex-col max-w-sm gap-4 p-4 text-center rounded-sm sm:max-w-2xl bg-base-100">
                    <span v-for="line in currentStageLines" :key="line.key" class="flex flex-col">
                        <span class="text-4xl/10 sm:text-5xl/12">{{ line.title }}</span>
                        <span class="font-sans text-xl md:text-2xl text-base-content">{{ line.subtitle }}</span>
                    </span>
                </h1>
                <h1 v-else
                    class="max-w-sm p-4 text-center rounded-sm sm:max-w-lg text-5xl/14 sm:text-7xl/16 bg-base-100">
                    {{ openingLineText }}
                </h1>
            </div>
            <div class="flex flex-col items-center px-10 sm:flex-row sm:gap-3 my-11" ref="about_me">
                <picture
                    class="z-10 self-center flex-shrink-0 w-24 h-24 -mt-10 sm:mt-0 sm:w-34 sm:h-34">
                    <div
                        class="absolute block mt-4 w-22 h-22 sm:w-32 sm:h-32 -z-10 dots-border bg-base-300 rounded-xs ring-6 ring-base-100">
                    </div>
                    <NuxtImg v-if="landingData" :src="`${API_URL}/assets/${landingData.image}`"
                        :alt="`Portrait of ${landingData.my_name}`"
                        class="object-cover ml-4 w-22 h-22 sm:w-32 sm:h-32 outline-2 rounded-xs" />
                </picture>
                <div class="flex flex-col px-3 rounded-sm post-content bg-base-100 mt-9 sm:mt-0">
                    <p v-if="landingData" ref="htmlLink" class="text-xl text-left md:text-2xl"
                        v-html="t(landingData, 'about_me_short')" @click="handleHtmlClick">
                    </p>
                    <!-- freelance offer: link to the contact page below the intro text -->
                    <div class="mt-2 mb-1">
                        <NuxtLink :to="localePath('/contact')"
                            class="inline-block px-2 text-sm font-semibold no-underline transition-all border-2 rounded-sm post-content-none md:text-base bg-primary text-primary-content border-base-content hover:scale-103 focus:outline-2 focus:outline-primary active:scale-97">
                            {{ tStatic('freelance_cta') }}
                        </NuxtLink>
                    </div>
                </div>
            </div>
            <nav class="relative flex flex-col sm:my-11" ref="menu_items">
                <div class="grid grid-cols-1 sm:gap-10 sm:grid-cols-2 mt-25 sm:mt-20">
                    <div v-for="item in mainMenuItems" :key="item.slug">
                        <NuxtLink :to="`/${item.slug}`">
                            <div
                                class="relative transition-all active:scale-95 hover:scale-103 focus:scale-103">
                                <div class="flex p-4 mx-auto transition-all border-2 cursor-pointer sm:ml-auto w-[calc(100%-6rem)] sm:w-64 hover:outline-0 outline-primary bg-base-100 peer h-35 rounded-sm focus:outline-0  mb-10 sm:mb-0"
                                    tabindex="0">
                                    <div class="z-20 flex flex-col justify-start align-middle ">
                                        <div class="flex items-center align-middle">
                                            <h2 class="text-xl md:text-2xl">
                                                {{ tMenuItem(item, 'heading') }}
                                            </h2>
                                        </div>
                                        <p class="line-clamp-3">
                                            {{ tMenuItem(item, 'description') }}
                                        </p>
                                    </div>
                                </div>
                                <div
                                    class="absolute -bottom-[7.5%] h-[115%] w-[calc(100%-4rem)] sm:w-[110%] mx-auto left-[2rem] sm:-left-[5%] bg-primary -z-10 scale-y-10 origin-bottom peer-hover:color-primary-content peer-hover:scale-y-100 transition-transform rounded-sm peer-focus:color-primary-content peer-focus:scale-y-100">
                                </div>
                            </div>
                        </NuxtLink>
                    </div>
                </div>
            </nav>
        </div>
    </div>
</template>
<style></style>