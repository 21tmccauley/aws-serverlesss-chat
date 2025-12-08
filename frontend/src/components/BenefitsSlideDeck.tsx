import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Shield, Database, Zap, Network, Code } from 'lucide-react'

interface Benefit {
  id: string
  icon: typeof Shield
  title: string
  description?: string
  items: string[]
  borderColor: string
  iconColor: string
}

const benefits: Benefit[] = [
  {
    id: 'cost',
    icon: Code,
    title: 'Cost Effective',
    description: 'All services use AWS Free Tier or pay-per-request pricing. Perfect for demos, prototypes, and small-scale applications.',
    items: [
      'Free tier covers most development needs',
      'Pay only for actual usage',
      'No upfront costs or commitments',
      'Scale costs with your application'
    ],
    borderColor: 'border-purple-500',
    iconColor: 'text-purple-500'
  },
  {
    id: 'serverless',
    icon: Zap,
    title: 'Serverless Architecture',
    description: 'No servers to manage. Lambda functions scale automatically based on demand. Pay only for what you use.',
    items: [
      'Automatic scaling handles traffic spikes',
      'No patch management or security updates needed',
      'Built-in high availability',
      'Zero cold starts for WebSocket connections'
    ],
    borderColor: 'border-orange-500',
    iconColor: 'text-orange-500'
  },
  {
    id: 'realtime',
    icon: Network,
    title: 'Real-Time Communication',
    description: 'WebSocket connections enable instant message delivery to all connected users without polling or refresh.',
    items: [
      'Sub-100ms message delivery',
      'Persistent connections reduce overhead',
      'Broadcast to all active connections',
      'No polling or refresh required'
    ],
    borderColor: 'border-cyan-500',
    iconColor: 'text-cyan-500'
  },
  {
    id: 'storage',
    icon: Database,
    title: 'Managed Data Storage',
    description: 'Fully managed database with automatic scaling and built-in backups. No database administration required.',
    items: [
      'Automatic scaling with demand',
      'Encrypted storage with automatic backups',
      'Pay-per-request pricing model',
      'Point-in-time recovery available'
    ],
    borderColor: 'border-green-500',
    iconColor: 'text-green-500'
  },
  {
    id: 'infrastructure',
    icon: Database,
    title: 'Infrastructure as Code',
    description: 'Version-controlled, reproducible infrastructure that scales with your team. Deploy in minutes, not days.',
    items: [
      'Terraform manages entire infrastructure',
      'Version-controlled for auditability',
      'Reproducible deployments across environments',
      'State locking prevents conflicts'
    ],
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-500'
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security & Authentication',
    description: 'Enterprise-grade security built into every layer, protecting users and data from common threats.',
    items: [
      'Username validation before connection',
      'Server-side protection against malicious input',
      'Prevents user impersonation',
      'Least privilege access controls',
      'Encrypted data storage'
    ],
    borderColor: 'border-red-500',
    iconColor: 'text-red-500'
  }
]


const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4
    }
  })
}

export default function BenefitsSlideDeck() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    duration: 20,
    align: 'center',
    dragFree: false
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollPrev()
    }
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollNext()
    }
  }, [emblaApi])

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index)
    }
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)

    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollPrev()
      } else if (e.key === 'ArrowRight') {
        scrollNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [scrollPrev, scrollNext])

  return (
    <div className="relative w-full">
      {/* Slide Deck Container */}
      <div className="overflow-hidden rounded-xl bg-card" ref={emblaRef}>
        <div className="flex">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={benefit.id}
                className="flex-[0_0_100%] min-w-0"
              >
                <div className={`bg-background rounded-lg p-8 md:p-12 border-l-4 ${benefit.borderColor} h-full min-h-[500px] flex flex-col justify-center`}>
                  <div className="max-w-3xl mx-auto w-full">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className={`w-16 h-16 ${benefit.iconColor} flex items-center justify-center mb-4`}>
                        <Icon className="w-10 h-10" />
                      </div>
                    </div>

                    {/* Title */}
                    <motion.h4
                      key={`title-${benefit.id}-${selectedIndex}`}
                      className="text-3xl md:text-4xl font-semibold mb-4"
                      initial={index === selectedIndex ? { opacity: 0, y: 20 } : false}
                      animate={index === selectedIndex ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                      transition={index === selectedIndex ? { delay: 0.3, duration: 0.4 } : { duration: 0 }}
                    >
                      {benefit.title}
                    </motion.h4>

                    {/* Description */}
                    {benefit.description && (
                      <motion.p
                        key={`desc-${benefit.id}-${selectedIndex}`}
                        className="text-muted-foreground text-base md:text-lg mb-6"
                        initial={index === selectedIndex ? { opacity: 0, y: 20 } : false}
                        animate={index === selectedIndex ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                        transition={index === selectedIndex ? { delay: 0.4, duration: 0.4 } : { duration: 0 }}
                      >
                        {benefit.description}
                      </motion.p>
                    )}

                    {/* Items List */}
                    <motion.ul
                      key={`list-${benefit.id}-${selectedIndex}`}
                      className="text-muted-foreground text-sm md:text-base space-y-3"
                      initial={index === selectedIndex ? "hidden" : false}
                      animate={index === selectedIndex ? "visible" : { opacity: 1 }}
                    >
                      {benefit.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          custom={itemIndex}
                          variants={itemVariants}
                          className="flex items-start gap-3"
                        >
                          <span className={`${benefit.iconColor} mt-1.5 shrink-0`}>•</span>
                          <span>{item}</span>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-6">
        {/* Previous Button */}
        <button
          onClick={scrollPrev}
          className="p-3 rounded-lg bg-card border border-border hover:bg-secondary transition-theme disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Dots Indicator */}
        <div className="flex gap-2">
          {benefits.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                index === selectedIndex
                  ? 'bg-accent w-8'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={scrollNext}
          className="p-3 rounded-lg bg-card border border-border hover:bg-secondary transition-theme disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide Counter */}
      <div className="text-center mt-4 text-sm text-muted-foreground">
        {selectedIndex + 1} / {benefits.length}
      </div>
    </div>
  )
}

