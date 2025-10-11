import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePartyStore } from '@/store/usePartyStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, QrCode, UserCheck, Camera, AlertCircle } from 'lucide-react';

// Mock QR Reader component since react-qr-reader might have compatibility issues
const MockQRReader = ({ onResult }: { onResult: (result: string) => void }) => {
  const [isScanning, setIsScanning] = useState(false);

  const mockScan = () => {
    setIsScanning(true);
    // Simulate scanning a guest QR code after 2 seconds
    setTimeout(() => {
      onResult('guest2'); // Mock scanning guest2
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="relative aspect-square bg-secondary/20 rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center">
      {isScanning ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-primary"
        >
          <QrCode className="h-12 w-12" />
        </motion.div>
      ) : (
        <div className="text-center">
          <Camera className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">Click to simulate QR scan</p>
          <Button onClick={mockScan} className="btn-party">
            Start Scanning
          </Button>
        </div>
      )}
      
      {/* Scanning animation overlay */}
      {isScanning && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, ease: "linear" }}
          className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary origin-left"
        />
      )}
    </div>
  );
};

export const QRScanner = () => {
  const { setCurrentPage, guests, updateGuest } = usePartyStore();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleScan = (guestId: string) => {
    const guest = guests.find(g => g.id === guestId);
    
    if (guest) {
      if (guest.is_checked_in) {
        setScanStatus('error');
        setScanResult(`${guest.name} is already checked in!`);
      } else {
        // Update guest check-in status
        updateGuest(guestId, { is_checked_in: true });
        setScanStatus('success');
        setScanResult(`${guest.name} has been checked in successfully!`);
      }
    } else {
      setScanStatus('error');
      setScanResult('Guest not found. Please check the QR code.');
    }

    // Clear result after 3 seconds
    setTimeout(() => {
      setScanResult(null);
      setScanStatus('idle');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-10"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('event-management')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Event
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                QR Code Scanner
              </h1>
              <p className="text-muted-foreground">Scan guest QR codes to check them in</p>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="glass border-primary/20 shadow-2xl">
              <CardHeader className="text-center">
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  className="mx-auto mb-4"
                >
                  <QrCode className="h-16 w-16 text-primary animate-neon-flicker" />
                </motion.div>
                <CardTitle className="text-3xl">Check-In Scanner</CardTitle>
                <CardDescription className="text-lg">
                  Point your camera at a guest's QR code to check them in
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Scanner Area */}
                <div className="relative">
                  <MockQRReader onResult={handleScan} />
                  
                  {/* Corner markers for scanner */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-primary" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-primary" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-primary" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-primary" />
                </div>

                {/* Scan Result */}
                {scanResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border-2 ${
                      scanStatus === 'success' 
                        ? 'bg-accent/10 border-accent text-accent' 
                        : 'bg-destructive/10 border-destructive text-destructive'
                    }`}
                  >
                    <div className="flex items-center">
                      {scanStatus === 'success' ? (
                        <UserCheck className="h-5 w-5 mr-3" />
                      ) : (
                        <AlertCircle className="h-5 w-5 mr-3" />
                      )}
                      <p className="font-semibold">{scanResult}</p>
                    </div>
                  </motion.div>
                )}

                {/* Instructions */}
                <div className="bg-secondary/20 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 flex items-center">
                    <QrCode className="h-4 w-4 mr-2 text-primary" />
                    How to scan:
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ask guests to show their QR codes</li>
                    <li>• Center the QR code in the scanning area</li>
                    <li>• Wait for the automatic check-in confirmation</li>
                    <li>• The guest list will update in real-time</li>
                  </ul>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center bg-primary/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-primary">
                      {guests.filter(g => g.is_checked_in).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Checked In</div>
                  </div>
                  <div className="text-center bg-accent/10 rounded-lg p-4">
                    <div className="text-2xl font-bold text-accent">
                      {guests.filter(g => !g.is_checked_in).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};