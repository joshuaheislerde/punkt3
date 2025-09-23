import { defineStore } from "pinia";
import { type Ref } from "vue";

export const usePublicationStore = defineStore("Publication", () => {
  const publications: Ref<Publication[] | null> = ref(null);

  function setPublicationsData(data: Publication[]) {
    publications.value = data;
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
