import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    html.classList.toggle('dark')
    setIsDark(!isDark)
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-theme">
      {/* Navigation */}
      <nav className="border-b border-border transition-theme">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold text-lg">
              ◈
            </div>
            <span className="font-semibold text-lg">TechChat</span>
          </div>
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-secondary rounded-lg transition-theme"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-40">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-bold leading-tight text-balance mb-8">
              Where ideas{' '}
              <span className="text-accent">connect</span> instantly
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-lg">
              A minimalist platform for one-to-many conversations. Clean design, 
              infinite possibilities. Connect with your audience in real time.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/chat"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-theme text-lg"
              >
                Start Chatting
              </Link>
              <button className="px-8 py-4 border-2 border-accent text-accent rounded-lg font-semibold hover:bg-accent hover:text-accent-foreground transition-theme text-lg">
                Learn More
              </button>
            </div>
          </div>

          {/* Futuristic Grid Visual */}
          <div className="relative h-96 md:h-full min-h-80">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-transparent to-accent/10 rounded-2xl" />
            <div className="absolute inset-0 grid grid-cols-8 gap-1 p-8 opacity-25">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="bg-accent/50 rounded-md" />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 border-2 border-accent rounded-lg animate-pulse" />
                <div className="absolute inset-2 border border-accent/50 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ready to connect? CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center border-t border-border">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Ready to connect?</h2>
        <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Join the revolution of seamless, minimalist communication. Start your journey now.
        </p>
        <Link
          to="/chat"
          className="inline-block px-10 py-4 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-theme text-lg"
        >
          Enter Chat
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-20 py-12 transition-theme">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground">
          <p>© 2025 TechChat. Minimalist communication for the future.</p>
        </div>
      </footer>
    </div>
  )
}
