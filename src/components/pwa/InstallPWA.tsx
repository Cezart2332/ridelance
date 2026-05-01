import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  IconButton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Download as DownloadIcon, 
  Close as CloseIcon,
} from '@mui/icons-material';
import iosGuide from '../../assets/ios_guide.webp';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');

    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Handler for Android/Chrome "beforeinstallprompt"
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay or based on some logic
      const hasDismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // For iOS, we can't trigger the prompt, so we show instructions
    if (ios && !localStorage.getItem('pwa-prompt-dismissed')) {
        setShowPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleClose = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <Dialog 
      open={showPrompt} 
      onClose={handleClose}
      fullScreen={isMobile}
      slotProps={{
        paper: {
          sx: {
            borderRadius: isMobile ? 0 : 3,
            padding: 1
          }
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <IconButton onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <DialogContent sx={{ textAlign: 'center', pt: 0 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Box 
            component="img" 
            src="/pwa-192x192.png" 
            sx={{ width: 80, height: 80, borderRadius: 2, boxShadow: 3 }}
          />
        </Box>
        
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }} gutterBottom>
          Instalează Ridelance
        </Typography>
        
        <Typography variant="body1" component="p" color="text.secondary" sx={{ mb: 3 }}>
          {isIOS 
            ? 'Adaugă aplicația pe ecranul principal pentru acces rapid și o experiență mai bună.'
            : 'Instalează aplicația pentru a gestiona PFA-ul tău mai ușor, direct de pe ecranul principal.'}
        </Typography>

        {isIOS && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" component="p" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
              Instrucțiuni pentru iOS:
            </Typography>
            <Box 
              component="img" 
              src={iosGuide} 
              sx={{ 
                width: '100%', 
                borderRadius: 2, 
                boxShadow: 1,
                border: '1px solid',
                borderColor: 'divider'
              }} 
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 4, px: 3 }}>
        {!isIOS ? (
          <Button 
            variant="contained" 
            fullWidth 
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleInstallClick}
            sx={{ borderRadius: 10, py: 1.5 }}
          >
            Instalează Acum
          </Button>
        ) : (
          <Button 
            variant="outlined" 
            fullWidth 
            size="large"
            onClick={handleClose}
            sx={{ borderRadius: 10, py: 1.5 }}
          >
            Am înțeles
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default InstallPWA;
