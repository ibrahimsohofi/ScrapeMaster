declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  customParameters?: Record<string, any>;
}

export interface UserProperties {
  user_id?: string;
  user_role?: string;
  user_industry?: string;
  user_company_size?: string;
  user_experience_level?: string;
}

export interface ConversionEvent {
  event_name: string;
  currency?: string;
  value?: number;
  transaction_id?: string;
  items?: Array<{
    item_id: string;
    item_name: string;
    category: string;
    quantity?: number;
    price?: number;
  }>;
}

class AnalyticsTracker {
  private isInitialized = false;
  private isProduction = process.env.NODE_ENV === 'production';
  private gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  private debugMode = process.env.NODE_ENV === 'development';

  constructor() {
    if (typeof window !== 'undefined' && this.gaId) {
      this.initializeGoogleAnalytics();
    }
  }

  private initializeGoogleAnalytics() {
    if (this.isInitialized || !this.gaId) return;

    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = () => {
      window.dataLayer.push(arguments);
    };

    // Configure Google Analytics
    window.gtag('js', new Date());
    window.gtag('config', this.gaId, {
      debug_mode: this.debugMode,
      send_page_view: false, // We'll handle page views manually
      allow_google_signals: true,
      allow_ad_personalization_signals: false, // GDPR compliance
    });

    this.isInitialized = true;
    console.log('Google Analytics initialized:', this.gaId);
  }

  // Page Tracking
  trackPageView(url: string, title?: string) {
    if (!this.isInitialized) return;

    window.gtag('event', 'page_view', {
      page_title: title || document.title,
      page_location: url,
      page_path: new URL(url).pathname,
    });

    if (this.debugMode) {
      console.log('Page view tracked:', { url, title });
    }
  }

  // Generic Event Tracking
  trackEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return;

    window.gtag('event', event.action, {
      event_category: event.category,
      event_label: event.label,
      value: event.value,
      ...event.customParameters,
    });

    if (this.debugMode) {
      console.log('Event tracked:', event);
    }
  }

  // Onboarding Flow Tracking
  trackOnboardingStep(step: number, stepName: string, userData?: any) {
    this.trackEvent({
      action: 'onboarding_step_completed',
      category: 'Onboarding',
      label: stepName,
      value: step,
      customParameters: {
        step_number: step,
        step_name: stepName,
        user_role: userData?.role,
        user_industry: userData?.industry,
        user_company_size: userData?.teamSize,
        user_use_case: userData?.useCase,
      },
    });
  }

  trackOnboardingCompleted(userData: any) {
    this.trackEvent({
      action: 'onboarding_completed',
      category: 'Onboarding',
      customParameters: {
        user_role: userData.role,
        user_industry: userData.industry,
        user_company_size: userData.teamSize,
        user_use_case: userData.useCase,
        user_goals: userData.goals?.join(','),
        user_experience: userData.experience,
      },
    });

    // Track as conversion
    this.trackConversion({
      event_name: 'onboarding_complete',
      value: 1,
    });
  }

  trackOnboardingAbandoned(step: number, stepName: string) {
    this.trackEvent({
      action: 'onboarding_abandoned',
      category: 'Onboarding',
      label: stepName,
      value: step,
      customParameters: {
        abandonment_step: step,
        abandonment_step_name: stepName,
      },
    });
  }

  // Case Studies Page Tracking
  trackCaseStudyView(caseStudyId: string, caseStudyTitle: string) {
    this.trackEvent({
      action: 'case_study_viewed',
      category: 'Case Studies',
      label: caseStudyTitle,
      customParameters: {
        case_study_id: caseStudyId,
        case_study_title: caseStudyTitle,
      },
    });
  }

  trackCaseStudyInteraction(action: string, caseStudyId: string, element?: string) {
    this.trackEvent({
      action: `case_study_${action}`,
      category: 'Case Studies',
      label: caseStudyId,
      customParameters: {
        case_study_id: caseStudyId,
        interaction_element: element,
      },
    });
  }

  trackIndustryFilter(industry: string) {
    this.trackEvent({
      action: 'industry_filter_selected',
      category: 'Case Studies',
      label: industry,
      customParameters: {
        selected_industry: industry,
      },
    });
  }

  // Conversion Tracking
  trackConversion(conversion: ConversionEvent) {
    if (!this.isInitialized) return;

    window.gtag('event', conversion.event_name, {
      currency: conversion.currency || 'USD',
      value: conversion.value,
      transaction_id: conversion.transaction_id,
      items: conversion.items,
    });

    if (this.debugMode) {
      console.log('Conversion tracked:', conversion);
    }
  }

  // User Identification
  setUserProperties(properties: UserProperties) {
    if (!this.isInitialized) return;

    window.gtag('config', this.gaId!, {
      user_id: properties.user_id,
      custom_map: {
        user_role: properties.user_role,
        user_industry: properties.user_industry,
        user_company_size: properties.user_company_size,
        user_experience_level: properties.user_experience_level,
      },
    });

    if (this.debugMode) {
      console.log('User properties set:', properties);
    }
  }

  // Landing Page A/B Testing
  trackExperiment(experimentId: string, variantId: string) {
    this.trackEvent({
      action: 'experiment_viewed',
      category: 'A/B Testing',
      label: experimentId,
      customParameters: {
        experiment_id: experimentId,
        variant_id: variantId,
      },
    });
  }

  trackExperimentConversion(experimentId: string, variantId: string, conversionType: string) {
    this.trackEvent({
      action: 'experiment_conversion',
      category: 'A/B Testing',
      label: experimentId,
      customParameters: {
        experiment_id: experimentId,
        variant_id: variantId,
        conversion_type: conversionType,
      },
    });
  }

  // Business Metrics
  trackCTAClick(ctaName: string, location: string) {
    this.trackEvent({
      action: 'cta_clicked',
      category: 'CTA',
      label: ctaName,
      customParameters: {
        cta_name: ctaName,
        cta_location: location,
      },
    });
  }

  trackFormSubmission(formName: string, formType: string) {
    this.trackEvent({
      action: 'form_submitted',
      category: 'Forms',
      label: formName,
      customParameters: {
        form_name: formName,
        form_type: formType,
      },
    });
  }

  trackFeatureUsage(featureName: string, action: string) {
    this.trackEvent({
      action: 'feature_used',
      category: 'Features',
      label: featureName,
      customParameters: {
        feature_name: featureName,
        feature_action: action,
      },
    });
  }

  // Error Tracking
  trackError(error: Error, context?: string) {
    this.trackEvent({
      action: 'error_occurred',
      category: 'Errors',
      label: error.message,
      customParameters: {
        error_message: error.message,
        error_stack: error.stack,
        error_context: context,
      },
    });
  }

  // Performance Tracking
  trackPerformance(metric: string, value: number, unit: string) {
    this.trackEvent({
      action: 'performance_metric',
      category: 'Performance',
      label: metric,
      value: value,
      customParameters: {
        metric_name: metric,
        metric_value: value,
        metric_unit: unit,
      },
    });
  }
}

// Create singleton instance
export const analytics = new AnalyticsTracker();

// Convenience methods for common tracking scenarios
export const trackOnboarding = {
  stepCompleted: (step: number, stepName: string, userData?: any) =>
    analytics.trackOnboardingStep(step, stepName, userData),
  completed: (userData: any) => analytics.trackOnboardingCompleted(userData),
  abandoned: (step: number, stepName: string) =>
    analytics.trackOnboardingAbandoned(step, stepName),
};

export const trackCaseStudies = {
  viewed: (id: string, title: string) => analytics.trackCaseStudyView(id, title),
  interacted: (action: string, id: string, element?: string) =>
    analytics.trackCaseStudyInteraction(action, id, element),
  filtered: (industry: string) => analytics.trackIndustryFilter(industry),
};

export const trackConversions = {
  signUp: (userId: string, method: string) =>
    analytics.trackConversion({
      event_name: 'sign_up',
      value: 1,
      // Custom parameters for internal tracking
    }),
  demo: (userId?: string) =>
    analytics.trackConversion({
      event_name: 'demo_requested',
      value: 10,
      // Custom parameters for login tracking
    }),
  trial: (userId: string, plan: string) =>
    analytics.trackConversion({
      event_name: 'trial_started',
      value: 50,
      // Custom parameters for trial tracking
    }),
};

// React Hook for analytics
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    analytics.trackPageView(window.location.href);
  }, [pathname]);

  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    setUserProperties: analytics.setUserProperties.bind(analytics),
    trackOnboarding,
    trackCaseStudies,
    trackConversions,
  };
}
