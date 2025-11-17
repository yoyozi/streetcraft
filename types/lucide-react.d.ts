// Type declaration for lucide-react
declare module 'lucide-react' {
  export interface LucideIconProps {
    size?: string | number;
    color?: string;
    absoluteStrokeWidth?: boolean;
    className?: string;
    style?: React.CSSProperties;
  }

  export interface LucideIcon
    extends React.FC<LucideIconProps> {
    displayName: string;
  }

  export const Sun: LucideIcon;
  export const Moon: LucideIcon;
  export const Search: LucideIcon;
  export const ShoppingCart: LucideIcon;
  export const User: LucideIcon;
  export const EllipsisVertical: LucideIcon;
}
