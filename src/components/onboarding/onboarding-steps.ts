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
}

// Store translations for use in tooltip
let currentTranslations: OnboardingStepTranslations | null = null;

export function setOnboardingTranslations(t: OnboardingStepTranslations) {
  currentTranslations = t;
}

export function getOnboardingTranslations(): OnboardingStepTranslations | null {
  return currentTranslations;
}

export function getOnboardingSteps(t: OnboardingStepTranslations): StepType[] {
  // Store translations for tooltip access
  setOnboardingTranslations(t);

  return [
    {
      selector: '[data-tour="nav-big-rocks"]',
      content: `**${t.step1Title}**\n\n${t.step1Content}`,
      position: "bottom",
    },
    {
      selector: '[data-tour="new-big-rock-button"]',
      content: `**${t.step2Title}**\n\n${t.step2Content}`,
      position: "bottom",
    },
    {
      selector: '[data-tour="big-rock-card"]',
      content: `**${t.step3Title}**\n\n${t.step3Content}`,
      position: "right",
    },
    {
      selector: '[data-tour="tars-section"]',
      content: `**${t.step4Title}**\n\n${t.step4Content}`,
      position: "top",
    },
    {
      selector: '[data-tour="activities-section"]',
      content: `**${t.step5Title}**\n\n${t.step5Content}`,
      position: "top",
    },
  ];
}
