import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Code, GitBranch, Play, TestTube, BarChart, Settings, Cloud } from 'lucide-react'

interface DevOpsSlide {
  id: string
  icon: typeof Code
  title: string
  description?: string
  items: string[]
  borderColor: string
  iconColor: string
}

const devopsSlides: DevOpsSlide[] = [
  {
    id: 'iac',
    icon: Code,
    title: 'Infrastructure as Code',
    description: 'Entire AWS infrastructure defined in Terraform. Version-controlled, reproducible, and auditable infrastructure deployments.',
    items: [
      'Terraform manages all AWS resources',
      'Version-controlled in Git',
      'Reproducible across environments',
      'State locking prevents conflicts',
      'Plan before apply for safety',
      'Easy rollback and updates'
    ],
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-500'
  },
  {
    id: 'deployment',
    icon: Play,
    title: 'Automated Deployment',
    description: 'Streamlined deployment scripts automate the entire process from code to production, reducing human error and deployment time.',
    items: [
      'One-command backend deployment',
      'Automated frontend build and deploy',
      'Environment variable management',
      'S3 + CloudFront CDN setup',
      'Cache invalidation automation',
      'Zero-downtime deployments'
    ],
    borderColor: 'border-green-500',
    iconColor: 'text-green-500'
  },
  {
    id: 'version-control',
    icon: GitBranch,
    title: 'Version Control & Git',
    description: 'All code and infrastructure changes tracked in Git, enabling collaboration, code review, and change history.',
    items: [
      'Git for source code versioning',
      'Terraform state in version control',
      'Branch-based development workflow',
      'Code review before merge',
      'Commit history for auditability',
      'Tag releases for production'
    ],
    borderColor: 'border-purple-500',
    iconColor: 'text-purple-500'
  },
  {
    id: 'testing',
    icon: TestTube,
    title: 'Testing & Quality',
    description: 'Comprehensive testing strategy ensures reliability and catches issues before they reach production.',
    items: [
      'Local Lambda function testing',
      'Event-driven test scenarios',
      'WebSocket connection testing',
      'Integration test workflows',
      'Test utilities for debugging',
      'TDD workflow documentation'
    ],
    borderColor: 'border-yellow-500',
    iconColor: 'text-yellow-500'
  },
  {
    id: 'monitoring',
    icon: BarChart,
    title: 'Monitoring & Logging',
    description: 'Built-in AWS monitoring and logging provide visibility into system performance and help diagnose issues quickly.',
    items: [
      'CloudWatch Logs for Lambda functions',
      'API Gateway request/response logging',
      'DynamoDB metrics and alarms',
      'Error tracking and alerting',
      'Performance monitoring',
      'Cost tracking and optimization'
    ],
    borderColor: 'border-cyan-500',
    iconColor: 'text-cyan-500'
  },
  {
    id: 'cicd',
    icon: Settings,
    title: 'CI/CD Pipeline',
    description: 'Continuous Integration and Deployment practices enable rapid, reliable releases with automated testing and validation.',
    items: [
      'Automated build processes',
      'Infrastructure validation',
      'Automated testing on changes',
      'Staged deployment environments',
      'Rollback capabilities',
      'Deployment documentation'
    ],
    borderColor: 'border-orange-500',
    iconColor: 'text-orange-500'
  },
  {
    id: 'environments',
    icon: Cloud,
    title: 'Environment Management',
    description: 'Separate environments for development, staging, and production ensure safe testing and deployment workflows.',
    items: [
      'Environment-specific configurations',
      'Isolated AWS resources per environment',
      'Variable-based environment setup',
      'Safe production deployments',
      'Environment parity',
      'Easy environment teardown'
    ],
    borderColor: 'border-indigo-500',
    iconColor: 'text-indigo-500'
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

export default function DevOpsSlideDeck() {
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
          {devopsSlides.map((slide, index) => {
            const Icon = slide.icon
            return (
              <div
                key={slide.id}
                className="flex-[0_0_100%] min-w-0"
              >
                <div className={`bg-background rounded-lg p-8 md:p-12 border-l-4 ${slide.borderColor} h-full min-h-[500px] flex flex-col justify-center`}>
                  <div className="max-w-3xl mx-auto w-full">
                    {/* Icon */}
                    <div className="mb-6">
                      <div className={`w-16 h-16 ${slide.iconColor} flex items-center justify-center mb-4`}>
                        <Icon className="w-10 h-10" />
                      </div>
                    </div>

                    {/* Title */}
                    <motion.h4
                      key={`title-${slide.id}-${selectedIndex}`}
                      className="text-3xl md:text-4xl font-semibold mb-4"
                      initial={index === selectedIndex ? { opacity: 0, y: 20 } : false}
                      animate={index === selectedIndex ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                      transition={index === selectedIndex ? { delay: 0.3, duration: 0.4 } : { duration: 0 }}
                    >
                      {slide.title}
                    </motion.h4>

                    {/* Description */}
                    {slide.description && (
                      <motion.p
                        key={`desc-${slide.id}-${selectedIndex}`}
                        className="text-muted-foreground text-base md:text-lg mb-6"
                        initial={index === selectedIndex ? { opacity: 0, y: 20 } : false}
                        animate={index === selectedIndex ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                        transition={index === selectedIndex ? { delay: 0.4, duration: 0.4 } : { duration: 0 }}
                      >
                        {slide.description}
                      </motion.p>
                    )}

                    {/* Items List */}
                    <motion.ul
                      key={`list-${slide.id}-${selectedIndex}`}
                      className="text-muted-foreground text-sm md:text-base space-y-3"
                      initial={index === selectedIndex ? "hidden" : false}
                      animate={index === selectedIndex ? "visible" : { opacity: 1 }}
                    >
                      {slide.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          custom={itemIndex}
                          variants={itemVariants}
                          className="flex items-start gap-3"
                        >
                          <span className={`${slide.iconColor} mt-1.5 shrink-0`}>•</span>
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
          {devopsSlides.map((_, index) => (
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
        {selectedIndex + 1} / {devopsSlides.length}
      </div>
    </div>
  )
}

