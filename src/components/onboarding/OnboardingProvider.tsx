"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { TourProvider, useTour } from "@reactour/tour";
import { getOnboardingSteps, OnboardingStepTranslations } from "./onboarding-steps";
import { OnboardingTooltip } from "./OnboardingTooltip";
import { markOnboardingComplete } from "@/app/actions/onboarding";

interface OnboardingTranslations extends OnboardingStepTranslations {
  skipTour: string;
  nextStep: string;
  previousStep: string;
  finish: string;
  stepOf: string;
}

interface OnboardingContextValue {
  startTour: () => void;
  endTour: () => void;
  translations: {
    skipTour: string;
    nextStep: string;
    previousStep: string;
    finish: string;
    stepOf: string;
  };
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

// Inner component that has access to useTour
function OnboardingController({
  children,
  onboardingCompleted,
  onEndTour,
}: {
  children: ReactNode;
  onboardingCompleted: boolean;
  onEndTour: () => void;
}) {
  const { setIsOpen } = useTour();

  // Auto-start tour for new users
  useEffect(() => {
    if (!onboardingCompleted) {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted, setIsOpen]);

  return <>{children}</>;
}

interface OnboardingProviderProps {
  children: ReactNode;
  translations: OnboardingTranslations;
  onboardingCompleted: boolean;
}

export function OnboardingProvider({
  children,
  translations,
  onboardingCompleted,
}: OnboardingProviderProps) {
  const [hasEnded, setHasEnded] = useState(false);

  const endTour = useCallback(async () => {
    if (hasEnded) return;
    setHasEnded(true);
    // Mark as completed in database
    await markOnboardingComplete();
  }, [hasEnded]);

  const startTour = useCallback(() => {
    // This would need access to useTour, handled differently
  }, []);

  const steps = getOnboardingSteps(translations);

  const contextValue: OnboardingContextValue = {
    startTour,
    endTour,
    translations: {
      skipTour: translations.skipTour,
      nextStep: translations.nextStep,
      previousStep: translations.previousStep,
      finish: translations.finish,
      stepOf: translations.stepOf,
    },
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      <TourProvider
        steps={steps}
        onClickClose={({ setIsOpen }) => {
          setIsOpen(false);
          endTour();
        }}
        beforeClose={endTour}
        styles={{
          popover: (base) => ({
            ...base,
            borderRadius: "12px",
            padding: 0,
            maxWidth: "380px",
          }),
          maskWrapper: (base) => ({
            ...base,
            color: "rgba(0, 0, 0, 0.7)",
          }),
          highlightedArea: (base) => ({
            ...base,
            borderRadius: "8px",
          }),
        }}
        components={{
          Content: (props) => (
            <OnboardingTooltip
              {...props}
              translations={{
                skipTour: translations.skipTour,
                nextStep: translations.nextStep,
                previousStep: translations.previousStep,
                finish: translations.finish,
                stepOf: translations.stepOf,
              }}
              onSkip={endTour}
            />
          ),
        }}
        padding={{ mask: 8, popover: [12, 16] }}
        showBadge={false}
        showNavigation={false}
        showCloseButton={false}
        disableInteraction
        scrollSmooth
      >
        <OnboardingController
          onboardingCompleted={onboardingCompleted}
          onEndTour={endTour}
        >
          {children}
        </OnboardingController>
      </TourProvider>
    </OnboardingContext.Provider>
  );
}
