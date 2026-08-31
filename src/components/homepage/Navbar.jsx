import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Navbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBusiness, setIsBusiness] = useState(false)

  const { user: authUser } = useAuth()
  const location = useLocation()

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen)
  }

  useEffect(() => {
    setIsDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isDrawerOpen])

  useEffect(() => {
    const updateNavbar = () => {
      const token = localStorage.getItem('access_token')
      const username = localStorage.getItem('username')
      const isBusinessFlag = localStorage.getItem('is_business') === 'true'
      const businessName = localStorage.getItem('business_name')

      // Business session — set flag and exit early
      if (isBusinessFlag && businessName) {
        setIsBusiness(true)
        setIsAllowed(true)
        setUser({
          username: businessName,
          firstLetter: businessName.charAt(0).toUpperCase(),
          isBusiness: true,
        })
        setIsLoading(false)
        return
      }

      // Regular user session
      setIsBusiness(false)

      if (token && username) {
        setIsAllowed(true)
        setUser({
          username: username,
          firstLetter: username.charAt(0).toUpperCase(),
        })
      } else {
        setIsAllowed(false)
        setUser(null)
      }

      setIsLoading(false)
    }

    updateNavbar()
    window.addEventListener('authChange', updateNavbar)
    window.addEventListener('profileComplete', updateNavbar)
    window.addEventListener('storage', updateNavbar)

    return () => {
      window.removeEventListener('authChange', updateNavbar)
      window.removeEventListener('profileComplete', updateNavbar)
      window.removeEventListener('storage', updateNavbar)
    }
  }, [])

  // ── Business session: locked-down navbar, no links, no menu ──────────────
  if (isBusiness) {
    return (
      <nav className="rounded-lg border-b z-50 p-2.5 top-0 bg-white sticky">
        <div className="flex items-center justify-between mx-3 sm:mx-4 h-[52px] sm:h-[60px]">
          <Link to="/business/dashboard" className="min-w-0">
            <img
              src="/logo.png"
              className="h-9 sm:h-[52px] w-auto"
              alt="eRuchi"
            />
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-700">
            <Link to="/business/dashboard" className="hover:text-gray-900">Dashboard</Link>
            <Link to="/business/scan" className="hover:text-gray-900">Scan</Link>
            <Link to="/business/profile" className="hover:text-gray-900">Profile</Link>
          </div>
        </div>
      </nav>
    )
  }

  // ── Regular navbar ────────────────────────────────────────────────────────
  return (
    <nav className="rounded-lg border-b z-50 p-2.5 top-0 bg-white sticky">
      <div className="flex justify-between items-center mx-3 sm:mx-4 min-w-0">
        {/* Logo */}
        <div className="cursor-pointer min-w-0 shrink">
          <Link to="/">
            <img src="/logo.png" className="h-9 sm:h-[52px] w-auto" alt="eRuchi" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-4 lg:gap-8 items-center text-sm lg:text-base">
          <Link to="/">
            <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Home</span>
          </Link>
          <Link to="/shop">
            <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Rewards</span>
          </Link>
          {authUser?.isProfileComplete && (
            <Link to="/standalone-surveys">
              <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Surveys</span>
            </Link>
          )}
          <Link to="/faqs">
            <span className="font-semibold uppercase hover:text-blue-600 transition-colors">FAQs</span>
          </Link>
          <Link to="/for-business">
            <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Merchant</span>
          </Link>
          {authUser?.role === 'admin' && (
            <Link to="/admin">
              <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Admin</span>
            </Link>
          )}
        </div>

        {/* User auth area */}
        {isLoading ? (
          <div className="hidden justify-center items-center md:flex space-y-7">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : user ? (
          <div className="hidden justify-center items-center md:flex space-x-7">
            <Link
              to="/profile"
              className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-semibold text-sm hover:bg-blue-600 transition-colors"
            >
              {user.firstLetter}
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex">
            <Link to="/login">
              <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Login</span>
            </Link>
          </div>
        )}

        {/* Mobile Hamburger Menu */}
        <div className="flex space-x-5 items-center md:hidden cursor-pointer" onClick={toggleDrawer}>
          {isDrawerOpen ? <X className="w-6 h-6 text-black" /> : <Menu className="w-7 h-7 text-black" />}
        </div>
      </div>

      {/* Mobile Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 w-full h-[100dvh] overflow-y-auto transition-all fade-in-5 bg-white shadow-lg z-50 p-5 sm:p-6 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
          <div className="flex justify-between border-b-2 pb-5 w-full items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
            <button onClick={toggleDrawer} className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <X className="w-7 h-7 text-black" />
            </button>
          </div>
          <nav className="flex transition-all fade-in-5 flex-col gap-4 min-h-0">
            <Link
              to="/"
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              HOME
            </Link>
            <Link
              to="/shop"
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              SHOP
            </Link>
            {authUser?.isProfileComplete && (
              <Link
                to="/standalone-surveys"
                onClick={toggleDrawer}
                className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
              >
                SURVEYS
              </Link>
            )}
            <Link
              to="/faqs"
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              FAQs
            </Link>
            <Link
              to="/for-business"
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              MERCHANT
            </Link>
            {authUser?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={toggleDrawer}
                className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
              >
                ADMIN
              </Link>
            )}

            {isAllowed && user ? (
              <Link
                to="/profile"
                onClick={toggleDrawer}
                className="flex items-center text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-semibold text-sm mr-3">
                  {user.firstLetter}
                </div>
                Profile
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={toggleDrawer}
                className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
              >
                Login
              </Link>
            )}
          </nav>
          {!isAllowed && (
            <Link
              to="/login"
              onClick={toggleDrawer}
              className="mt-8 w-full inline-flex justify-center items-center bg-blue-600 rounded-xl text-white p-4 text-center shadow-lg hover:bg-blue-700 transition-colors"
            >
              <span className="uppercase cursor-pointer font-bold text-lg">Login</span>
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar