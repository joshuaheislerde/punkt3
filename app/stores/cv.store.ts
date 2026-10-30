import { defineStore } from 'pinia'
import { type Ref } from "vue";

interface WorkPeriod {
  start: Date;
  end: Date;
}

export const useCvStore = defineStore('CV', () => {
  const cvData: Ref<CV | null> = ref(null);

  // most recent first: ongoing stages on top, then by end date, then by start date
  function byRecency(a: CareerStage | EducationalStage, b: CareerStage | EducationalStage): number {
    const end = (stage: CareerStage | EducationalStage): number =>
      stage.until_today || !stage.to ? Infinity : new Date(stage.to).getTime();
    const start = (stage: CareerStage | EducationalStage): number =>
      stage.from ? new Date(stage.from).getTime() : 0;

    return (end(b) - end(a)) || (start(b) - start(a));
  }

  function setData(data: CV): void {
    cvData.value = {
      ...data,
      career_stages: [...(data.career_stages ?? [])].sort(byRecency),
      educational_stages: [...(data.educational_stages ?? [])].sort(byRecency),
    };
  }

  function clearStore(): void {
    cvData.value = null;
  }

  const workExperienceYears = computed((): number => {
    if (!cvData.value?.career_stages) {
      return 0;
    }

    // Filter stages that should be counted and have valid dates
    const validStages: WorkPeriod[] = cvData.value.career_stages
      .filter(stage => stage.use_in_accumulate_work_experience && stage.from)
      .map(stage => ({
        start: new Date(stage.from!), // Non-null assertion since we filtered for stage.from
        end: stage.to ? new Date(stage.to) : new Date()
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (validStages.length === 0) return 0;

    // Merge overlapping periods
    const mergedPeriods: WorkPeriod[] = [];
    let currentPeriod: WorkPeriod = validStages[0]!;

    for (let i = 1; i < validStages.length; i++) {
      const nextStage = validStages[i];

      if (nextStage && nextStage.start <= currentPeriod.end) {
        currentPeriod.end = new Date(Math.max(currentPeriod.end.getTime(), nextStage.end.getTime()));
      } else if (nextStage) {
        // No overlap, save current period and start new one
        mergedPeriods.push(currentPeriod);
        currentPeriod = nextStage;
      }
    }
    mergedPeriods.push(currentPeriod); // Add the last period

    // Calculate total months from merged periods
    let totalMonths = 0;
    for (const period of mergedPeriods) {
      const yearDiff = period.end.getFullYear() - period.start.getFullYear();
      const monthDiff = period.end.getMonth() - period.start.getMonth();
      const dayDiff = period.end.getDate() - period.start.getDate();

      let months = yearDiff * 12 + monthDiff;
      if (dayDiff < 0) {
        months -= 1;
      }

      totalMonths += Math.max(0, months);
    }

    return Math.floor(totalMonths / 12);
  });

  // Stages without an end date (or flagged "until today") that have already started
  const isOngoing = (stage: { from: string | null; to: string | null; until_today: boolean | null }): boolean => {
    const now = new Date();
    if (stage.from && new Date(stage.from) > now) return false;
    return !!stage.until_today || !stage.to || new Date(stage.to) >= now;
  };

  const currentCareerStages = computed((): CareerStage[] =>
    (cvData.value?.career_stages ?? [])
      .filter(stage => stage.status !== 'draft' && stage.status !== 'archived' && isOngoing(stage))
      .sort((a, b) => new Date(b.from ?? 0).getTime() - new Date(a.from ?? 0).getTime())
  );

  const currentEducationalStages = computed((): EducationalStage[] =>
    (cvData.value?.educational_stages ?? [])
      .filter(isOngoing)
      .sort((a, b) => new Date(b.from ?? 0).getTime() - new Date(a.from ?? 0).getTime())
  );

  return {
    setData,
    clearStore,
    cvData,
    workExperienceYears,
    currentCareerStages,
    currentEducationalStages
  } as const;
});