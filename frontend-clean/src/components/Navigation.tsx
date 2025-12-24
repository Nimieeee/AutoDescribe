'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Sparkles, ClipboardList, TrendingUp, Target } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home', icon: Sparkles },
    { href: '/review', label: 'Review', icon: ClipboardList },
  ]

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                AutoDescribe
              </h1>
            </div>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
              {links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all duration-200 border-b-2
                      ${isActive
                        ? 'border-violet-500 text-gray-900 dark:text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-700'
                      }`}
                  >
                    <link.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-violet-500' : ''}`} />
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile menu button could go here */}
        </div>
      </div>
    </nav>
  )
}