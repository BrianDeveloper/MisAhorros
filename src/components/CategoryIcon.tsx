import {
  Banknote,
  BookOpen,
  BriefcaseBusiness,
  Bus,
  Car,
  Circle,
  CircleDollarSign,
  Coffee,
  Coins,
  Ellipsis,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  House,
  Landmark,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const categoryIcons: Record<string, LucideIcon> = {
  Banknote,
  BookOpen,
  Briefcase: BriefcaseBusiness,
  BriefcaseBusiness,
  Bus,
  Car,
  CircleDollarSign,
  Coffee,
  Coins,
  Ellipsis,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  Home: House,
  House,
  Landmark,
  MoreHorizontal: Ellipsis,
  MoreVertical: Ellipsis,
  Music,
  PawPrint,
  PiggyBank,
  Plane,
  Receipt,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Stethoscope,
  TrendingUp,
  Utensils,
  Wallet,
  Wrench,
  Zap,
}

interface CategoryIconProps {
  name?: string | null
  categoryName?: string | null
  size?: number
}

const semanticCategoryIcons: Record<string, LucideIcon> = {
  alquiler: House,
  'alquiler/hipoteca': House,
  comida: Utensils,
  educacion: GraduationCap,
  entretenimiento: Gamepad2,
  freelance: BriefcaseBusiness,
  inversiones: TrendingUp,
  'otros egresos': Receipt,
  'otros ingresos': Coins,
  regalo: Gift,
  ropa: Shirt,
  salario: Banknote,
  salud: HeartPulse,
  servicios: Zap,
  transporte: Bus,
}

export function CategoryIcon({ name, categoryName, size = 18 }: CategoryIconProps) {
  const explicitIcon = name && name !== 'Circle' ? categoryIcons[name] : undefined
  const normalizedCategory = categoryName
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
  const Icon = explicitIcon ?? (normalizedCategory ? semanticCategoryIcons[normalizedCategory] : undefined) ?? Circle
  return <Icon size={size} aria-hidden="true" />
}
