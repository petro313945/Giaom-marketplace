import { useState, useRef, MouseEvent } from 'react'

interface ImageZoomProps {
  src: string
  alt: string
  className?: string
  zoomLevel?: number
}

export default function ImageZoom({ 
  src, 
  alt, 
  className = '', 
  zoomLevel = 3 
}: ImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const lensRef = useRef<HTMLDivElement>(null)
  const zoomPreviewRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imageRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    
    // Calculate mouse position relative to container
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Calculate percentage position
    const percentX = (x / rect.width) * 100
    const percentY = (y / rect.height) * 100

    // Clamp values between 0 and 100
    const clampedX = Math.max(0, Math.min(100, percentX))
    const clampedY = Math.max(0, Math.min(100, percentY))

    setZoomPosition({ x: clampedX, y: clampedY })

    // Update lens position
    if (lensRef.current) {
      const lensWidth = 180
      const lensHeight = 180
      const lensX = Math.max(lensWidth / 2, Math.min(rect.width - lensWidth / 2, x))
      const lensY = Math.max(lensHeight / 2, Math.min(rect.height - lensHeight / 2, y))
      
      lensRef.current.style.left = `${lensX - lensWidth / 2}px`
      lensRef.current.style.top = `${lensY - lensHeight / 2}px`
    }

    // Position zoom preview
    if (zoomPreviewRef.current && containerRef.current) {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const containerRight = rect.right
      const containerTop = rect.top
      const previewWidth = 400
      const previewHeight = 400
      
      // Calculate position - prefer right side
      let left = containerRight + 20
      let top = containerTop
      
      // If not enough space on right, show on left
      if (viewportWidth - containerRight < previewWidth + 20) {
        left = rect.left - previewWidth - 20
      }
      
      // Ensure preview stays within viewport vertically
      if (top + previewHeight > viewportHeight) {
        top = Math.max(20, viewportHeight - previewHeight - 20)
      }
      if (top < 20) {
        top = 20
      }
      
      zoomPreviewRef.current.style.left = `${left}px`
      zoomPreviewRef.current.style.top = `${top}px`
    }
  }

  const handleMouseEnter = () => {
    setIsZoomed(true)
  }

  const handleMouseLeave = () => {
    setIsZoomed(false)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className={`relative cursor-pointer w-full h-full ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative w-full h-full overflow-hidden">
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className="w-full h-full object-contain"
            onLoad={handleImageLoad}
            draggable={false}
          />
          
          {/* Zoom lens indicator on main image */}
          {isZoomed && imageLoaded && (
            <div
              ref={lensRef}
              className="absolute pointer-events-none border-2 border-primary/70 bg-primary/10 rounded-lg"
              style={{
                width: '180px',
                height: '180px',
                left: '0',
                top: '0',
                boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.1), 0 0 20px rgba(0, 0, 0, 0.1)',
              }}
            />
          )}
        </div>
      </div>
      
      {/* Zoomed image preview - using fixed positioning to avoid overflow issues */}
      {isZoomed && imageLoaded && (
        <div
          ref={zoomPreviewRef}
          className="fixed pointer-events-none z-[9999] border-2 border-border rounded-lg overflow-hidden shadow-2xl bg-background hidden md:block"
          style={{
            width: '400px',
            height: '400px',
            left: '0',
            top: '0',
          }}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-contain"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
            }}
            draggable={false}
          />
        </div>
      )}
    </div>
  )
}
