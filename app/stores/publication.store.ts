import { defineStore } from "pinia";
import { type Ref } from "vue";

export const usePublicationStore = defineStore("Publication", () => {
  const publications: Ref<Publication[] | null> = ref(null);

  function setPublicationsData(data: Publication[]) {
    // newest publications first; entries without a year go last
    publications.value = [...data].sort((a: Publication, b: Publication) => {
      const yearA = Number(a.year) || -Infinity;
      const yearB = Number(b.year) || -Infinity;

      return yearB - yearA;
    });
  }

  function clearStore() {
    publications.value = null;
  }

  return {
    setPublicationsData,
    clearStore,
    publications,
  } as const;
});
