import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { X, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface MermaidDiagramProps {
  chart: string
  title?: string
  className?: string
}

export default function MermaidDiagram({ chart, title, className = '' }: MermaidDiagramProps) {
  const mermaidRef = useRef<HTMLDivElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Initialize Mermaid once
  useEffect(() => {
    if (isInitialized) return

    mermaid.initialize({
      startOnLoad: false,
      theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
      },
      sequence: {
        useMaxWidth: true,
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
      },
    })
    setIsInitialized(true)
  }, [isInitialized])

  // Render diagram helper function
  const renderDiagram = (container: HTMLDivElement, chartText: string) => {
    if (!container || !chartText.trim()) return Promise.resolve()

    // Clear previous content
    container.innerHTML = ''

    // Generate unique ID
    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`

    // Create element directly in the container
    const mermaidElement = document.createElement('div')
    mermaidElement.className = 'mermaid'
    mermaidElement.id = id
    mermaidElement.textContent = chartText.trim()
    
    // Append to container first - this ensures it's in the DOM
    container.appendChild(mermaidElement)

    // Use requestAnimationFrame to ensure DOM is fully updated
    return new Promise<void>((resolve, reject) => {
      requestAnimationFrame(() => {
        if (!mermaidElement.parentElement) {
          reject(new Error('Element was removed from DOM'))
          return
        }

        // Render the diagram
        mermaid.run({
          nodes: [mermaidElement],
        }).then(() => {
          resolve()
        }).catch((error) => {
          reject(error)
        })
      })
    })
  }

  // Render diagram in main container
  useEffect(() => {
    if (!isInitialized || !mermaidRef.current || !chart.trim()) return

    setError(null)
    
    // Wait for DOM to be ready and element to have dimensions
    const renderMainDiagram = () => {
      if (!mermaidRef.current) return

      // Check if element is visible and has dimensions
      const rect = mermaidRef.current.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        // Element not visible yet, try again
        requestAnimationFrame(renderMainDiagram)
        return
      }

      renderDiagram(mermaidRef.current, chart).catch((error) => {
        console.error('Mermaid rendering error:', error)
        setError(error.message || 'Failed to render diagram')
        if (mermaidRef.current) {
          mermaidRef.current.innerHTML = ''
        }
      })
    }

    // Small delay to ensure component is mounted
    const timeoutId = setTimeout(() => {
      renderMainDiagram()
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [chart, isInitialized])

  // Render diagram in fullscreen when opened
  useEffect(() => {
    if (!isFullscreen || !fullscreenRef.current || !chart.trim() || !isInitialized) return

    // Wait a bit for the modal to be fully rendered
    const timeoutId = setTimeout(() => {
      if (!fullscreenRef.current) return

      renderDiagram(fullscreenRef.current, chart).catch((error) => {
        console.error('Mermaid fullscreen rendering error:', error)
      })
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [isFullscreen, chart, isInitialized])

  // Update theme when dark mode changes
  useEffect(() => {
    if (!isInitialized) return

    const observer = new MutationObserver(() => {
      if (mermaidRef.current && chart.trim()) {
        const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'default'
        mermaid.initialize({
          startOnLoad: false,
          theme,
        })
        
        // Re-render with new theme
        setTimeout(() => {
          if (!mermaidRef.current) return
          
          renderDiagram(mermaidRef.current, chart).catch((error) => {
            console.error('Mermaid theme update error:', error)
          })
        }, 100)
      }
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [chart, isInitialized])

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
    setPanPosition({ x: 0, y: 0 })
  }

  // Mouse wheel zoom
  useEffect(() => {
    if (!isFullscreen || !fullscreenContainerRef.current) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoomLevel((prev) => Math.max(0.5, Math.min(3, prev + delta)))
      }
    }

    const container = fullscreenContainerRef.current
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [isFullscreen])

  // Pan functionality
  useEffect(() => {
    if (!isFullscreen || !fullscreenContainerRef.current) return

    const container = fullscreenContainerRef.current

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left mouse button
        setIsPanning(true)
        setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y })
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning) {
        setPanPosition({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        })
      }
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isFullscreen, isPanning, panStart, panPosition])

  // Reset zoom and pan when closing fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setZoomLevel(1)
      setPanPosition({ x: 0, y: 0 })
    }
  }, [isFullscreen])

  // Handle escape key to close fullscreen
  useEffect(() => {
    if (!isFullscreen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  return (
    <>
      <div className={`mermaid-diagram ${className} relative group`}>
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div
          ref={mermaidRef}
          className="flex justify-center items-center min-h-[200px] [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full cursor-pointer relative"
          onClick={() => setIsFullscreen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsFullscreen(true)
            }
          }}
          aria-label="Click to view fullscreen"
        >
          {/* Overlay hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-background/90 px-4 py-2 rounded-lg shadow-lg border border-border">
              <Maximize2 className="w-4 h-4" />
              <span>Click to view fullscreen</span>
            </div>
          </div>
        </div>
        {error && (
          <div className="text-red-500 p-4 text-center text-sm">
            Error rendering diagram: {error}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsFullscreen(false)
            }
          }}
        >
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-2xl font-bold">{title || 'Diagram'}</h2>
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    className="p-2 hover:bg-background rounded transition-theme disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Zoom out"
                    title="Zoom out (Ctrl + Scroll)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm font-medium min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    className="p-2 hover:bg-background rounded transition-theme disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Zoom in"
                    title="Zoom in (Ctrl + Scroll)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className="p-2 hover:bg-background rounded transition-theme ml-1"
                    aria-label="Reset zoom"
                    title="Reset zoom"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-theme"
                  aria-label="Close fullscreen"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Diagram Container */}
            <div
              ref={fullscreenContainerRef}
              className="flex-1 overflow-hidden relative"
              style={{ cursor: isPanning ? 'grabbing' : zoomLevel > 1 ? 'grab' : 'default' }}
            >
              <div
                className="absolute inset-0 flex items-center justify-center p-8"
                style={{
                  transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <div
                  ref={fullscreenRef}
                  className="flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:w-full"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border text-center text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-4">
                <span>Press ESC to close</span>
                <span>•</span>
                <span>Ctrl + Scroll to zoom</span>
                {zoomLevel > 1 && (
                  <>
                    <span>•</span>
                    <span>Click and drag to pan</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
