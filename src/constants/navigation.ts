import { BookOpen, Shield, FileText, Info, Users, Calendar, List, CreditCard, Monitor, LucideIcon } from 'lucide-react';
import { Category } from '../types/index';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  [Category.INTRODUCAO]: BookOpen,
  [Category.GRO]: Shield,
  [Category.ESOCIAL]: FileText,
  [Category.INFORMACOES]: Info,
  [Category.COLETIVO]: Users,
  [Category.EVENTOS]: Calendar,
  [Category.FINANCEIRO]: CreditCard,
  [Category.TI]: Monitor,
};

export const getCategoryIcon = (category: string | undefined): LucideIcon => {
  return category && CATEGORY_ICONS[category] ? CATEGORY_ICONS[category] : List;
};
