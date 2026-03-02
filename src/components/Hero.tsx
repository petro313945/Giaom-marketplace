import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'

export default function Hero() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const images = [
    '/Slider/Gioam banner.png',
    '/Slider/Giaom banner 2.png'
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000) // Change image every 5 seconds

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <section className="relative overflow-hidden min-h-[500px] md:min-h-[600px]">
      {/* Background Images with Animation */}
      <div className="absolute inset-0 w-full h-full">
        {images.map((image, index) => (
          <img
            key={index}
            src={image}
            alt={`Hero banner ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 z-10" />
      </div>

      {/* Content */}
      <div className="relative z-20 container py-24 md:py-32">
        <div className="mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-balance text-primary drop-shadow-lg">
            Shop Handmade Goods<br />You Won't Find Anywhere Else
          </h2>
          <p className="text-lg md:text-xl text-primary mb-8 text-pretty drop-shadow-md">
            Original creations crafted by independent makers around the world.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/">Browse Collections</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/become-seller">Sell Your Creations</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
