import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
            setUserName(user.name || user.username || 'User');
          } catch (error) {
            console.error('Error parsing user data:', error);
            setUserName('User');
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserName(null);
      }
    };

    // Check on mount
    checkAuthStatus();

    // Listen for storage changes (if user logs in/out in another tab)
    window.addEventListener('storage', checkAuthStatus);
    
    // Listen for custom login event
    const handleLoginEvent = () => checkAuthStatus();
    window.addEventListener('userLoggedIn', handleLoginEvent);
    
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('userLoggedIn', handleLoginEvent);
    };
  }, []);

  const navItems = [
    { name: 'Home', link: '/home' },
    { name: 'Command Center', link: '/command-center' },
    { name: 'Targeting Intel', link: '/targeting_intel' },
    { name: 'Ad Surveillance', link: '/ad-surveillance' },
    { name: 'Auto Create', link: '/auto-create' },
    { name: 'Reverse Engineering', link: '/video-analysis'}
  ];

  const handleNavClick = (link: string) => {
    navigate(link);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Update state
    setIsLoggedIn(false);
    setUserName(null);
    setIsMobileMenuOpen(false);
    
    // Redirect to home
    navigate('/');
  };

  return (
    <Navbar>
      {/* Desktop Navigation */}
      <NavBody>
        <NavbarLogo />
        {isLoggedIn && (
          <NavItems 
            items={navItems} 
            onItemClick={(link) => navigate(link)}
          />
        )}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              {/* Show user name */}
              {userName && (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:block font-mulish">
                  Welcome, {userName}
                </span>
              )}
              <NavbarButton variant="secondary" onClick={handleLogout}>
                Logout
              </NavbarButton>
            </>
          ) : (
            <>
              <NavbarButton 
                variant="secondary"
                onClick={() => navigate('login')}
              >
                Sign In
              </NavbarButton>
              <NavbarButton 
                variant="gradient"
                onClick={() => navigate('sign-up')}
              >
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
            <button
              key={`mobile-link-${idx}`}
              onClick={() => handleNavClick(item.link)}
              className="relative text-neutral-600 dark:text-neutral-300 hover:text-cyan-600 transition-colors text-left w-full"
            >
              <span className="block font-medium">{item.name}</span>
            </button>
          ))}
          
          {/* Mobile Auth Buttons */}
          <div className="flex w-full flex-col gap-4 mt-4">
            {isLoggedIn ? (
              <>
                {/* Show user name on mobile */}
                {userName && (
                  <div className="text-sm text-neutral-600 dark:text-neutral-300 px-2 py-2 text-center bg-slate-50 rounded-lg font-mulish">
                    Logged in as <span className="font-semibold text-cyan-600">{userName}</span>
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
                  onClick={() => handleNavClick('/login')}
                  variant="secondary"
                  className="w-full"
                >
                  Sign In
                </NavbarButton>
                <NavbarButton
                  onClick={() => handleNavClick('/sign-up')}
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