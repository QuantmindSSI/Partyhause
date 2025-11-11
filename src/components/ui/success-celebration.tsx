import { motion } from 'framer-motion';
import { PartyPopper, Check, Sparkles, Send, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface SuccessCelebrationProps {
  title: string;
  message: string;
  onContinue: () => void;
  continueLabel?: string;
  showConfetti?: boolean;
  achievements?: Array<{
    icon: React.ReactNode;
    label: string;
  }>;
}

export function SuccessCelebration({
  title,
  message,
  onContinue,
  continueLabel = 'Continue',
  showConfetti = true,
  achievements = []
}: SuccessCelebrationProps) {
  const { width, height } = useWindowSize();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}

      {/* Success Card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5,
          ease: [0, 0.71, 0.2, 1.01]
        }}
        className="max-w-2xl w-full"
      >
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
          <CardContent className="pt-12 pb-8 px-8">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2,
                duration: 0.6,
                type: "spring",
                stiffness: 200
              }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative w-24 h-24 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                  <PartyPopper className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"
            >
              {title}
            </motion.h1>

            {/* Message */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl text-gray-600 text-center mb-8"
            >
              {message}
            </motion.p>

            {/* Achievements Grid */}
            {achievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
              >
                {achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex flex-col items-center p-4 bg-gradient-to-br from-orange-50 to-pink-50 rounded-lg"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2 shadow-md">
                      {achievement.icon}
                    </div>
                    <p className="text-sm font-medium text-gray-700 text-center">
                      {achievement.label}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Action Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center"
            >
              <Button
                onClick={onContinue}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {continueLabel}
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-orange-400 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 50,
              opacity: 0.8,
            }}
            animate={{
              y: -50,
              opacity: 0,
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              delay: Math.random() * 2,
              repeat: Infinity,
              repeatDelay: Math.random() * 3,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// Mini success toast for smaller celebrations
export function SuccessToast({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed top-4 right-4 z-50 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3"
    >
      <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
        {icon || <Check className="w-5 h-5" />}
      </div>
      <p className="font-semibold">{message}</p>
    </motion.div>
  );
}
