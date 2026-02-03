import type { StepType } from "@reactour/tour";

export interface OnboardingStepTranslations {
  step1Title: string;
  step1Content: string;
  step2Title: string;
  step2Content: string;
  step3Title: string;
  step3Content: string;
  step4Title: string;
  step4Content: string;
  step5Title: string;
  step5Content: string;
  step6Title: string;
  step6Content: string;
}

export function getOnboardingSteps(t: OnboardingStepTranslations): StepType[] {
  return [
    {
      selector: '[data-tour="nav-big-rocks"]',
      content: {
        title: t.step1Title,
        description: t.step1Content,
      },
      position: "bottom",
    },
    {
      selector: '[data-tour="new-big-rock-button"]',
      content: {
        title: t.step2Title,
        description: t.step2Content,
      },
      position: "bottom",
    },
    {
      selector: '[data-tour="big-rock-card"]',
      content: {
        title: t.step3Title,
        description: t.step3Content,
      },
      position: "right",
    },
    {
      selector: '[data-tour="tars-section"]',
      content: {
        title: t.step4Title,
        description: t.step4Content,
      },
      position: "top",
    },
    {
      selector: '[data-tour="activities-section"]',
      content: {
        title: t.step5Title,
        description: t.step5Content,
      },
      position: "top",
    },
    {
      selector: '[data-tour="nav-key-people"]',
      content: {
        title: t.step6Title,
        description: t.step6Content,
      },
      position: "bottom",
    },
  ];
}
