import { useEffect } from 'react';
import { campaignConfig } from '@/config/campaignConfig';

export const CampaignTheme = () => {
  useEffect(() => {
    if (campaignConfig.active && campaignConfig.customColors.enabled) {
      const root = document.documentElement;
      Object.entries(campaignConfig.customColors.vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    return () => {
      // Cleanup al desmontar
      if (campaignConfig.customColors.enabled) {
        const root = document.documentElement;
        Object.keys(campaignConfig.customColors.vars).forEach((key) => {
          root.style.removeProperty(key);
        });
      }
    };
  }, []);

  return null;
};
