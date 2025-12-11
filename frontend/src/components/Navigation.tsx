import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Target, Eye, Zap } from 'lucide-react';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from './ui/resizable-navbar';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Check login status from localStorage
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token) {
        setIsLoggedIn(true);
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setUserName(user.name);
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserName(null);
      }
    };

    // Check on mount
    checkAuthStatus();

    // Optional: Listen for storage changes (if user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const navItems = [
    { name: 'Command Center', link: '/command-center' },
    { name: 'Performance', link: '/performance' },
    { name: 'Audience Intel', link: '/audience' },
    { name: 'Market View', link: '/market' },
    { name: 'Quick Launch', link: '/quick-launch' }
  ];

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update state
    setIsLoggedIn(false);
    setUserName(null);
    setIsMobileMenuOpen(false);
    
    // Redirect to login
    navigate('/');
  };

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        <NavItems items={navItems} />
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {/* Show user name if available */}
              {userName && (
                <span className="text-sm text-neutral-600 dark:text-neutral-300 hidden md:block">
                  {userName}
                </span>
              )}
              <NavbarButton variant="secondary" onClick={handleLogout}>
                Logout
              </NavbarButton>
            </>
          ) : (
            <>
              <NavbarButton variant="secondary" onClick={() => navigate('/')}>
                Sign In
              </NavbarButton>
              <NavbarButton variant="gradient" onClick={() => navigate('/sign-up')}>
                Get Started
              </NavbarButton>
            </>
          )}
        </div>
      </NavBody>

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <NavbarLogo />
          <MobileNavToggle
            isOpen={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => (
            <a
              key={`mobile-link-${idx}`}
              href={item.link}
              onClick={() => setIsMobileMenuOpen(false)}
              className="relative text-neutral-600 dark:text-neutral-300 hover:text-cyan-600 transition-colors"
            >
              <span className="block font-medium">{item.name}</span>
            </a>
          ))}
          
          {/* Mobile Auth Buttons */}
          <div className="flex w-full flex-col gap-4 mt-4">
            {isLoggedIn ? (
              <>
                {/* Show user name on mobile */}
                {userName && (
                  <div className="text-sm text-neutral-600 dark:text-neutral-300 px-2 py-1 text-center">
                    Logged in as <span className="font-medium">{userName}</span>
                  </div>
                )}
                <NavbarButton
                  onClick={handleLogout}
                  variant="secondary"
                  className="w-full"
                >
                  Logout
                </NavbarButton>
              </>
            ) : (
              <>
                <NavbarButton
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/');
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Sign In
                </NavbarButton>
                <NavbarButton
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    navigate('/sign-up');
                  }}
                  variant="gradient"
                  className="w-full"
                >
                  Get Started
                </NavbarButton>
              </>
            )}
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
};

export default Navigation;