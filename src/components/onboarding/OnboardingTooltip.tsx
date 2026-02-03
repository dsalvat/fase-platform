"use client";

import { useTour } from "@reactour/tour";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, CheckCircle } from "lucide-react";

interface TooltipTranslations {
  skipTour: string;
  nextStep: string;
  previousStep: string;
  finish: string;
  stepOf: string;
}

interface OnboardingTooltipProps {
  content: string;
  translations: TooltipTranslations;
  onSkip: () => void;
}

export function OnboardingTooltip({
  content,
  translations: t,
  onSkip,
}: OnboardingTooltipProps) {
  const { currentStep, steps, setCurrentStep, setIsOpen } = useTour();

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Parse content - format is "**Title**\n\nDescription"
  const parts = content.split("\n\n");
  const title = parts[0]?.replace(/\*\*/g, "") || "";
  const description = parts[1] || "";

  const handleNext = () => {
    if (isLastStep) {
      setIsOpen(false);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip();
  };

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden min-w-[320px] max-w-[380px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-blue-100 text-sm font-medium">
            {t.stepOf
              .replace("{current}", String(currentStep + 1))
              .replace("{total}", String(steps.length))}
          </span>
          <button
            onClick={handleSkip}
            className="text-blue-200 hover:text-white transition-colors p-1 rounded-md hover:bg-blue-500/30"
            aria-label="Close tour"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {title && (
          <h3 className="text-white font-semibold text-lg mt-2">
            {title}
          </h3>
        )}
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {description && (
          <p className="text-gray-600 text-sm leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          className="text-gray-500 hover:text-gray-700"
        >
          {t.skipTour}
        </Button>

        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.previousStep}
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleNext}
            className={isLastStep
              ? "bg-green-600 hover:bg-green-700 gap-1"
              : "bg-blue-600 hover:bg-blue-700 gap-1"
            }
          >
            {isLastStep ? (
              <>
                <CheckCircle className="h-4 w-4" />
                {t.finish}
              </>
            ) : (
              <>
                {t.nextStep}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Step indicators */}
      <div className="px-5 pb-4 bg-gray-50 flex justify-center gap-1.5">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentStep
                ? "w-6 bg-blue-600"
                : index < currentStep
                ? "w-2 bg-blue-300"
                : "w-2 bg-gray-300"
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
