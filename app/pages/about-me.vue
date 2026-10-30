<script setup lang="ts">
const landingStore = useLandingStore();
const cvStore = useCvStore();
const config = useRuntimeConfig()
const API_URL: string = config.public.apiURL
definePageMeta({
  layout: 'sidebars',
  hasHeader: true,
  scrollToTop: true,
  hasSubMenu: false,
})

const contactStore = useContactStore();
const localePath = useLocalePath()

const { t, tStatic } = useTranslation()

// e.g. "Software Engineer @ Phoenix Contact"
const currentStages = computed<string[]>(() => [
  ...cvStore.currentCareerStages.map(stage => `${t(stage, 'position')} @ ${t(stage, 'company')}`),
  ...cvStore.currentEducationalStages.map(stage => `${t(stage, 'degree')} @ ${t(stage, 'institution')}`),
])

const cvImage = computed<string | null>(() => {
  return cvStore.cvData?.image || landingStore.landingData?.image || null
})
</script>
<template>
  <div v-if="cvStore.cvData" class="flex flex-col w-full gap-3 post-content">
    <div class="flex flex-col items-start gap-3 p-1 rounded-sm bg-base-100">
      <div
        class="flex flex-col items-center w-full gap-2 border-2 border-dotted rounded-sm md:justify-between md:flex-row border-base-200">
        <div
          class="flex flex-col w-full md:w-fit *:flex *:flex-col *:items-start *:px-2 *:py-1.5 *:gap-1 *:justify-start md:*:gap-0 md:*:flex-row md:*:items-center md:*:p-2 text-secondary-content dark:text-secondary-content-dark font-medium">
          <h2>{{ t(cvStore.cvData, 'welcome_heading') }}</h2>
          <div v-if="currentStages.length" class="!items-start">
            <div class="profile-label">{{ tStatic('currently') }}</div>
            <div class="hidden pt-1.5 basis-4 shrink-0 md:block">
              <div class="single-dot-secondary">
              </div>
            </div>
            <div class="flex flex-col font-bold">
              <span v-for="line in currentStages" :key="line">{{ line }}</span>
            </div>
          </div>
          <div>
            <div class="profile-label">{{ tStatic('work_experience') }}</div>
            <div class="hidden basis-4 shrink-0 md:block">
              <div class="single-dot-secondary">
              </div>
            </div>
            <div class="font-bold">{{ cvStore.workExperienceYears }}+ {{
              tStatic('years_in_field') }}</div>
          </div>
          <div v-if="contactStore.contactData?.socials?.length">
            <div class="profile-label">{{ tStatic('profiles') }}</div>
            <div class="hidden basis-4 shrink-0 md:block">
              <div class="single-dot-secondary">
              </div>
            </div>
            <div class="flex flex-wrap gap-2 mt-1 md:mt-0">
              <a v-for="social in contactStore.contactData.socials" :key="social.id" :href="social.link"
                target="_blank" rel="noopener noreferrer" :title="social.name" :aria-label="social.name"
                class="post-content-none transition-transform hover:scale-110 focus:scale-110">
                <NuxtImg v-if="social.icon" :src="`${API_URL}/assets/${social.icon}`" :alt="social.name"
                  class="object-contain p-0.5 bg-white rounded-full size-7 outline-2 outline-base-content" />
                <span v-else class="text-sm underline">{{ social.name }}</span>
              </a>
            </div>
          </div>
          <div v-if="t(cvStore.cvData, 'work_status')">
            <div class="relative profile-label" v-if="cvStore.cvData.work_status_attention" >
              <div class="relative">{{ tStatic('career_status') }}</div>
            </div>
            <div class="hidden basis-4 shrink-0 md:block" v-if="cvStore.cvData.work_status_attention">
              <star-bling v-if="cvStore.cvData.work_status_attention"
                class="relative -left-2.5 size-7" animation :interval="5000"></star-bling>
              <div v-else class="single-dot-secondary">
              </div>
            </div>
            <div class="relative font-bold">
              <div class="relative"
                :class="{ ' rounded-sm  px-1 ml-0.5': cvStore.cvData.work_status_attention }">{{
                  t(cvStore.cvData,
                    'work_status') }}</div>
            </div>
          </div>
        </div>
        <div class="flex flex-col items-start justify-end gap-2 p-3 w-42 shrink-0">
          <div class="relative w-full">
            <light-box v-if="cvImage"
              :img-src="`${API_URL}/assets/${cvImage}`" class="">
              <template #trigger="{ openLightbox }">
                <picture class="self-center mt-0 shrink-0">
                  <NuxtImg :src="`${API_URL}/assets/${cvImage}`" :alt="`Portrait of ${landingStore.landingData?.my_name}`"
                    class="relative object-cover object-center w-full h-40 transition-transform cursor-zoom-in outline-2 rounded-xs"
                    @click="openLightbox" />
                </picture>
              </template>
            </light-box>
          </div>
        </div>
      </div>
    </div>
    <div class="divider">
      <div class="h-fit mx-auto my-0 max-w-1/2 dots-border-top !border-base-300">
      </div>
    </div>
    <div class="p-1 rounded-sm bg-base-100">
      <div class="border-2 border-dotted rounded-sm bg-base-100 border-base-200">
        <h2 class="p-2 pb-0">{{ tStatic('about_me') }}</h2>
        <div class="p-2" v-html="t(cvStore.cvData, 'summary')"></div>
      </div>
    </div>
    <div class="divider">
      <div class="h-fit mx-auto my-0 max-w-1/2 dots-border-top !border-base-300">
      </div>
    </div>
    <div class="p-1 rounded-sm bg-base-100">
      <div class="border-2 border-dotted rounded-sm bg-base-100 border-base-200">
        <h2 class="p-2 pb-0">{{ tStatic('my_life_stages') }}</h2>
        <div class="flex flex-col gap-6 p-2">
          <div v-html="t(cvStore.cvData, 'stages_summary')">
          </div>
          <stages-timeline type="career" :items="cvStore.cvData.career_stages"
            milestone-style="circle" />
          <div class="divider">
            <div class="w-1/2 mx-auto my-0 border-t-4 border-dotted h-fit border-base-200">
            </div>
          </div>
          <stages-timeline type="educational" :items="cvStore.cvData.educational_stages"
            milestone-style="square" />
        </div>
      </div>
    </div>
    <div class="divider">
      <div class="h-fit mx-auto my-0 max-w-1/2 dots-border-top !border-base-300">
      </div>
    </div>
    <div class="p-1 rounded-sm bg-base-100">
      <div
        class="flex flex-col items-center gap-3 p-4 text-center border-2 border-dotted rounded-sm bg-base-100 border-base-200">
        <p class="font-medium">{{ tStatic('about_cta') }}</p>
        <div class="flex flex-wrap justify-center gap-2">
          <NuxtLink :to="localePath('/contact')" class="post-content-none cta-action cta-primary">
            {{ tStatic('about_cta_contact') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/publications')" class="post-content-none cta-action">
            {{ tStatic('about_cta_publications') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/portfolio')" class="post-content-none cta-action">
            {{ tStatic('about_cta_projects') }}
          </NuxtLink>
        </div>
      </div>
    </div>
    <!--<div v-if="cvStore.cvData.publications && cvStore.cvData.publications.length > 0"
      class="p-1 rounded-sm bg-base-100">
      <div class="border-2 border-dotted rounded-sm bg-base-100 border-base-200 post-content">
        <h2 class="p-2 pb-0">{{ tStatic('publications') }}</h2>
        <div class="p-2">
          <publications-timeline :items="cvStore.cvData.publications" milestone-style="diamond" />
        </div>
      </div>
    </div>-->
  </div>
</template>
<style scoped>
@reference "~/assets/css/main.css";

.cta-action {
  @apply px-3 py-1 text-sm font-semibold transition-all border-2 rounded-sm bg-accent text-accent-content border-base-content hover:bg-primary hover:text-primary-content focus:outline-2 focus:outline-primary active:scale-97;
}

/* mobile: small label above the value; desktop: label column next to the value */
.profile-label {
  @apply text-xs font-semibold tracking-wide uppercase shrink-0 md:text-base md:font-medium md:tracking-normal md:normal-case md:basis-32;
}

.cta-primary {
  @apply bg-primary text-primary-content;
}

:deep(.custom-content-list li),
:deep(.custom-content-list ol),
:deep(.custom-content-list ul) {
  margin-bottom: 0em !important;
  margin-top: 0em !important;
}
</style>