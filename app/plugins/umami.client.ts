// Loads the Umami tracker (cookieless analytics) when NUXT_PUBLIC_UMAMI_HOST and
// NUXT_PUBLIC_UMAMI_WEBSITE_ID are set. Without them (e.g. locally) nothing is loaded.
export default defineNuxtPlugin(() => {
  const { umamiHost, umamiWebsiteId, umamiDomains } = useRuntimeConfig().public
  if (!umamiHost || !umamiWebsiteId) return

  useHead({
    script: [{
      src: `${String(umamiHost).replace(/\/$/, '')}/script.js`,
      defer: true,
      'data-website-id': String(umamiWebsiteId),
      // only count visits on the production domain(s), not on previews or localhost
      ...(umamiDomains ? { 'data-domains': String(umamiDomains) } : {}),
      'data-do-not-track': 'true',
      'data-exclude-search': 'true',
    }],
  })
})
