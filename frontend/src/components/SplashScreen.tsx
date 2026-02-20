import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoadingLogo from '../assets/LoadingLogo.png';

interface SplashScreenProps {
    onComplete?: () => void;
    duration?: number;
    visible?: boolean;
}

export default function SplashScreen({ 
    onComplete, 
    duration = 1000, 
    visible: externalVisible = true 
}: SplashScreenProps) {
    const [visible, setVisible] = useState(externalVisible);

    useEffect(() => {
        if (!externalVisible) {
            setVisible(false);
            return;
        }

        const timer = setTimeout(() => {
            setVisible(false);
            onComplete?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onComplete, externalVisible]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    style={styles.overlay}
                >
                    <div style={styles.contentWrapper}>
                        {/* LOGO */}
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                duration: 1.2,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            style={styles.logoWrapper}
                        >
                            <img
                                src={LoadingLogo}
                                alt="ELFSOD loading logo"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                }}
                            />
                        </motion.div>

                        {/* PROGRESS BAR (0% → 100%) */}
                        <div style={styles.progressWrapper}>
                            <div style={styles.progressTrack}>
                                <motion.div
                                    style={styles.progressFill}
                                    initial={{ width: '0%' }}
                                    animate={{ width: '100%' }}
                                    transition={{
                                        duration: duration / 1000,
                                        ease: 'linear',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* =========================
   Integrated Styles
   ========================= */

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px',
    },

    contentWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
    },

    logoWrapper: {
        position: 'relative',
        width: '100%',
        maxWidth: '700px',
        height: '251.6px',
    },

    /* ===== Progress Bar ===== */

    progressWrapper: {
        marginTop: '20px',
        width: '100%',
        maxWidth: '700px', // EXACTLY matches logo width
    },

    progressTrack: {
        width: '100%',
        height: '4px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: '999px',
        overflow: 'hidden',
    },

    progressFill: {
        height: '100%',
        backgroundColor: '#ffffff',
        borderRadius: '999px',
    },
};