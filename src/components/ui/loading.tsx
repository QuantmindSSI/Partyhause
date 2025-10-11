import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4'
};

export const Loading = ({ className, size = 'md', fullScreen = false }: LoadingProps) => {
  const Wrapper = fullScreen ? motion.div : motion.span;
  
  return (
    <Wrapper
      className={cn(
        'flex items-center justify-center',
        fullScreen && 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50',
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={cn(
          sizes[size],
          'border-primary border-t-transparent rounded-full',
          'animate-spin'
        )}
        style={{
          boxShadow: '0 0 15px var(--shadow-glow)'
        }}
      />
    </Wrapper>
  );
};
