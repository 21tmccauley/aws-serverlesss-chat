import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Shield, Database, Zap, Network, Code, Target, CheckCircle2, Layers, FileText, Users } from 'lucide-react'

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
    id: 'problem',
    icon: Target,
    title: 'The Challenge',
    description: 'Build a real-time chat application that can scale effortlessly, keep costs low, and maintain enterprise-level security—all without managing servers.',
    items: [
      'Users need instant message delivery, not page refreshes',
      'The solution must scale automatically as users join',
      'Security can\'t be an afterthought—it\'s built in from day one',
      'Messages need to persist so users can see conversation history',
      'Infrastructure should be cost-effective and easy to maintain'
    ],
    borderColor: 'border-purple-500',
    iconColor: 'text-purple-500'
  },
  {
    id: 'solution',
    icon: CheckCircle2,
    title: 'Working Solution Achieved',
    description: 'Fully functional real-time chat application deployed and operational on AWS serverless infrastructure.',
    items: [
      'Live WebSocket API handling real-time connections',
      'Functional chat interface with message broadcasting',
      'Message history retrieval working correctly',
      'Connection management (connect/disconnect) operational',
      'Complete infrastructure deployed via Terraform'
    ],
    borderColor: 'border-green-500',
    iconColor: 'text-green-500'
  },
  {
    id: 'services',
    icon: Layers,
    title: 'AWS Services & Their Purpose',
    description: 'Each service plays a specific role in the architecture, working together to deliver the complete solution.',
    items: [
      'API Gateway WebSocket API: Real-time bidirectional communication',
      'Lambda Functions: Serverless compute for connection/auth/messaging',
      'DynamoDB: NoSQL database for connections and message storage',
      'IAM: Least privilege access controls for security',
      'Terraform: Infrastructure as Code for reproducible deployments'
    ],
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-500'
  },
  {
    id: 'security',
    icon: Shield,
    title: 'Security & Auditing Considerations',
    description: 'Enterprise-grade security built into every layer with comprehensive auditing capabilities.',
    items: [
      'Lambda Authorizer validates usernames before WebSocket connections',
      'Server-side input validation prevents XSS and injection attacks',
      'Username verification from DynamoDB prevents impersonation',
      'IAM least privilege: Scoped permissions to specific resources only',
      'Encryption at rest: DynamoDB tables encrypted with AWS managed keys',
      'CloudWatch Logs: Complete audit trail of all Lambda invocations'
    ],
    borderColor: 'border-red-500',
    iconColor: 'text-red-500'
  },
  {
    id: 'requirements',
    icon: Users,
    title: 'Customer Requirements Met',
    description: 'All specified requirements have been successfully implemented and verified.',
    items: [
      'Real-time message delivery to all connected users',
      'Username-based authentication and validation',
      'Message history retrieval functionality',
      'Scalable serverless architecture',
      'Cost-effective solution using AWS Free Tier',
      'Infrastructure as Code for maintainability'
    ],
    borderColor: 'border-orange-500',
    iconColor: 'text-orange-500'
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

