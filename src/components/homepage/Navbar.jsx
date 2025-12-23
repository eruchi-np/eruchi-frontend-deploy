import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Loader2 } from 'lucide-react'

const Navbar = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen)
  }

  useEffect(() => {
    const updateNavbar = () => {
      const token = localStorage.getItem("access_token")
      const username = localStorage.getItem("username")
      
      if (token && username) {
        setIsAllowed(true)
        setUser({
          username: username,
          firstLetter: username.charAt(0).toUpperCase()
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

  return (
    <nav className="rounded-lg border-b z-50 p-2.5 top-0 bg-white sticky">
      <div className="flex justify-between items-center mx-4">
        {/* Logo */}
        <div className="cursor-pointer">
          <Link to="/">
            <img src="/logo.png" width={135} height={60} alt="eruchi_icon" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8">
          <Link to="/">
            <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">Home</span>
          </Link>
          <Link to="/for-business">
            <span className="uppercase cursor-pointer font-semibold hover:text-blue-600 transition-colors">For Business</span>
          </Link>
          <Link to="/faqs">
            <span className="font-semibold hover:text-blue-600 transition-colors">FAQs</span>
          </Link>
        </div>

        {/* User auth area */}
        {isLoading ? (
          <div className="hidden justify-center items-center md:flex space-y-7">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : user ? (
          <div className="hidden justify-center items-center md:flex space-x-7">
            <Link to="/profile" className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-semibold text-sm hover:bg-blue-600 transition-colors">
              {user.firstLetter}
            </Link>
          </div>
        ) : (
          <div className="hidden lg:flex">
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
        <div className="fixed top-0 right-0 w-full h-full transition-all fade-in-5 bg-white shadow-lg z-50 p-6">
          <div className="flex justify-between border-b-2 pb-5 w-full items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Menu</h2>
            <button onClick={toggleDrawer} className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <X className="w-7 h-7 text-black" />
            </button>
          </div>
          <nav className="flex transition-all h-full relative fade-in-5 flex-col gap-6">
            <Link 
              to="/for-business" 
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              FOR BUSINESS
            </Link>
            <Link 
              to="/faqs" 
              onClick={toggleDrawer}
              className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors py-2 border-b border-gray-100"
            >
              FAQs
            </Link>
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
            <div className="w-full justify-center items-center border-t-2 border-gray-200 bg-blue-600 rounded-xl absolute bottom-6 left-0 right-0 mx-6 text-white p-4 text-center shadow-lg hover:bg-blue-700 transition-colors">
              <Link to="/login" onClick={toggleDrawer}>
                <span className="uppercase cursor-pointer font-bold text-lg">Login</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar