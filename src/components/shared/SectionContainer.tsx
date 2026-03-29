import { cn } from '@/lib/utils';

interface SectionContainerProps {
  children: React.ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
}

const gapMap = {
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8',
};

export default function SectionContainer({ children, className, gap = 'lg' }: SectionContainerProps) {
  return <div className={cn(gapMap[gap], className)}>{children}</div>;
}
