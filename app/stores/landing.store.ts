import { defineStore } from 'pinia'

export const useLandingStore = defineStore('LandingPage', () => {
  const landingData = ref<Landing | null>(null)

  function setLandingData(data: Landing) {
    if (data && data.menu_items && Array.isArray(data.menu_items)) {
      data.menu_items.sort((a: MenuItem, b: MenuItem) => {
        const sortA = a.sort ?? Infinity;
        const sortB = b.sort ?? Infinity;

        return Number(sortA) - Number(sortB);
      });
    }

    landingData.value = data;
  }

  function clearStore() {
    landingData.value = null;
  }

  return {
    setLandingData,
    clearStore,
    landingData,
  } as const;
});