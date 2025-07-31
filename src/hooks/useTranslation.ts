import { useTranslations } from 'next-intl';

export function useTranslation() {
  const t = useTranslations();
  
  return { t };
}

export default useTranslation;