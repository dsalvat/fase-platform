"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { TourProvider } from "@reactour/tour";
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
  isRunning: boolean;
  startTour: () => void;
  endTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
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
  const [isRunning, setIsRunning] = useState(false);

  // Auto-start tour for new users
  useEffect(() => {
    if (!onboardingCompleted) {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        setIsRunning(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [onboardingCompleted]);

  const startTour = useCallback(() => {
    setIsRunning(true);
  }, []);

  const endTour = useCallback(async () => {
    setIsRunning(false);
    // Mark as completed in database
    await markOnboardingComplete();
  }, []);

  const steps = getOnboardingSteps(translations);

  const contextValue: OnboardingContextValue = {
    isRunning,
    startTour,
    endTour,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      <TourProvider
        steps={steps}
        isOpen={isRunning}
        setIsOpen={setIsRunning}
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
        {children}
      </TourProvider>
    </OnboardingContext.Provider>
  );
}
