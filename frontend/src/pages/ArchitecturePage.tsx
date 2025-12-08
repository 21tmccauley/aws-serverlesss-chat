import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, ArrowLeft, Server, Database, Zap, Shield, Code, Cloud, MessageSquare, Users, Send, Menu, X } from 'lucide-react'
import MermaidDiagram from '../components/MermaidDiagram'

export default function ArchitecturePage() {
  const [isDark, setIsDark] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')
  const [showMobileNav, setShowMobileNav] = useState(false)

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    html.classList.toggle('dark')
    setIsDark(!isDark)
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: Cloud },
    { id: 'architecture', label: 'Architecture', icon: Code },
    { id: 'message-flow', label: 'Message Flow', icon: Send },
    { id: 'terraform', label: 'Terraform', icon: Server },
    { id: 'benefits', label: 'Benefits', icon: Users },
    { id: 'services', label: 'AWS Services', icon: Database },
  ]

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveSection(sectionId)
      setShowMobileNav(false)
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id)
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground transition-theme">
      {/* Navigation */}
      <nav className="border-b border-border transition-theme sticky top-0 bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-accent-foreground font-bold text-lg">
              ◈
            </div>
            <span className="font-semibold text-lg hidden sm:inline">Architecture & Infrastructure</span>
            <span className="font-semibold text-lg sm:hidden">Architecture</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMobileNav(!showMobileNav)}
              className="p-2 hover:bg-secondary rounded-lg transition-theme sm:hidden"
              aria-label="Toggle navigation"
            >
              {showMobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
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
        </div>
      </nav>

      {/* Mobile Navigation */}
      {showMobileNav && (
        <div className="sm:hidden border-b border-border bg-card">
          <div className="px-6 py-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-theme ${
                    activeSection === section.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{section.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-border sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-6">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-theme text-left ${
                      activeSection === section.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {/* Header */}
            <div className="text-center mb-16" id="overview">
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                AWS Serverless Architecture
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                A real-time chat application built entirely on AWS serverless services, 
                managed with Infrastructure as Code using Terraform.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <span>Serverless</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-accent" />
                  <span>Real-Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-accent" />
                  <span>Infrastructure as Code</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-accent" />
                  <span>Scalable</span>
                </div>
              </div>
            </div>

            {/* Architecture Overview */}
            <section className="mb-20 scroll-mt-8" id="architecture">
              <div className="flex items-center gap-3 mb-8">
                <Cloud className="w-8 h-8 text-accent" />
                <h2 className="text-3xl font-bold">System Architecture</h2>
              </div>
              
              {/* Architecture Diagram */}
              <div className="bg-card border border-border rounded-xl p-8 mb-8">
                <MermaidDiagram
                  chart={`
flowchart TD
    Frontend["Frontend<br/>React + TypeScript<br/>WebSocket Client"] -->|WebSocket Connection| API["API Gateway<br/>WebSocket API<br/>Routes: $connect, $disconnect, sendMessage"]
    
    API -->|$connect| Lambda1["onConnect<br/>Lambda Function<br/>Store connection"]
    API -->|sendMessage| Lambda2["sendMessage<br/>Lambda Function<br/>Save & broadcast"]
    API -->|$disconnect| Lambda3["onDisconnect<br/>Lambda Function<br/>Remove connection"]
    
    Lambda1 -->|Write| DB1[("Connections Table<br/>PK: connectionId<br/>username, connectedAt")]
    Lambda2 -->|Read/Write| DB1
    Lambda2 -->|Write| DB2[("Messages Table<br/>PK: messageId<br/>SK: timestamp<br/>username, message")]
    Lambda3 -->|Delete| DB1
    
    Lambda2 -->|Broadcast| API
    API -->|Real-time| Frontend
    
    IAM["IAM Role & Policies<br/>DynamoDB & API Gateway<br/>Permissions"] -.->|Manages| Lambda1
    IAM -.->|Manages| Lambda2
    IAM -.->|Manages| Lambda3
    
    style Frontend fill:#e0f2fe,stroke:#0284c7,stroke-width:2px
    style API fill:#dbeafe,stroke:#2563eb,stroke-width:2px
    style Lambda1 fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style Lambda2 fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style Lambda3 fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style DB1 fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style DB2 fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style IAM fill:#f3e8ff,stroke:#9333ea,stroke-width:2px
                  `}
                />
              </div>
              
              {/* Component Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Code className="w-6 h-6 text-accent" />
                    <h3 className="text-xl font-semibold">Frontend</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    React + TypeScript application that establishes WebSocket connections to API Gateway with username as query parameter for real-time communication.
                  </p>
                  <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Technologies:</p>
                    <p>React, TypeScript, Tailwind CSS, WebSocket API</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MessageSquare className="w-6 h-6 text-accent" />
                    <h3 className="text-xl font-semibold">API Gateway</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Manages persistent WebSocket connections and routes messages to Lambda functions. Uses route selection expression based on request body action field.
                  </p>
                  <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Routes:</p>
                    <p>$connect • $disconnect • sendMessage (via $request.body.action)</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-accent" />
                    <h3 className="text-xl font-semibold">Lambda Functions</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Three serverless functions handle connection management and message broadcasting using API Gateway Management API.
                  </p>
                  <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <p><span className="font-semibold">onConnect:</span> Store connection (username from query params)</p>
                    <p><span className="font-semibold">sendMessage:</span> Save & broadcast via PostToConnection</p>
                    <p><span className="font-semibold">onDisconnect:</span> Remove connection</p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-accent" />
                    <h3 className="text-xl font-semibold">DynamoDB</h3>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Two tables store connections and message history with pay-per-request pricing.
                  </p>
                  <div className="bg-background rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                    <p><span className="font-semibold">Connections:</span> connectionId (PK), username, connectedAt</p>
                    <p><span className="font-semibold">Messages:</span> messageId (PK: timestamp-connectionId), timestamp (range key), username, message</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Message Flow */}
            <section className="mb-20 scroll-mt-8" id="message-flow">
              <div className="flex items-center gap-3 mb-8">
                <Send className="w-8 h-8 text-accent" />
                <h2 className="text-3xl font-bold">Message Flow</h2>
              </div>
              
              {/* Message Flow Diagram */}
              <div className="bg-card border border-border rounded-xl p-8 mb-8">
                <MermaidDiagram
                  chart={`
sequenceDiagram
    participant User as 👤 User<br/>(Frontend)
    participant API as 🌐 API Gateway<br/>(WebSocket)
    participant Connect as ⚡ onConnect<br/>Lambda
    participant SendMsg as ⚡ sendMessage<br/>Lambda
    participant DB1 as 💾 Connections<br/>Table
    participant DB2 as 💾 Messages<br/>Table
    participant Users as 👥 All Users
    
    Note over User,API: 1. User Connects
    User->>API: WebSocket Connection<br/>($connect?username=...)
    API->>Connect: Trigger onConnect<br/>(username from query params)
    Connect->>DB1: Store connectionId<br/>& username
    DB1-->>Connect: Success
    Connect-->>API: Connection stored
    API-->>User: Connection established
    
    Note over User,Users: 2. User Sends Message
    User->>API: Send message<br/>(action: "sendMessage")
    API->>SendMsg: Trigger sendMessage<br/>(via route selection)
    
    Note over SendMsg,DB2: 3. Save Message
    SendMsg->>DB2: Save message<br/>(messageId: timestamp-connectionId,<br/>timestamp, username, message)
    DB2-->>SendMsg: Message saved
    
    Note over SendMsg,DB1: 4. Get All Connections
    SendMsg->>DB1: Scan all connections<br/>(full table scan)
    DB1-->>SendMsg: Return connectionIds
    
    Note over SendMsg,Users: 5. Broadcast to All Users
    loop For each connection
        SendMsg->>API: PostToConnection<br/>(via Management API)
        alt Connection active
            API->>Users: Broadcast message<br/>via WebSocket
        else Stale connection (410)
            SendMsg->>DB1: Remove stale connection
        end
    end
    
    Note over Users: 6. All Users Receive
    Users-->>Users: Display message<br/>in real-time
                  `}
                />
              </div>
              
              {/* Flow Steps */}
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { num: 1, title: 'User Connects', desc: 'Frontend establishes WebSocket connection with username as query parameter (wss://url?username=...), triggering onConnect Lambda.' },
                  { num: 2, title: 'Store Connection', desc: 'onConnect Lambda extracts username from query parameters and stores connection ID and username in Connections DynamoDB table.' },
                  { num: 3, title: 'User Sends Message', desc: 'Frontend sends message with action field ({ action: "sendMessage", ... }) via WebSocket. API Gateway routes to sendMessage Lambda using route selection expression.' },
                  { num: 4, title: 'Save & Broadcast', desc: 'sendMessage Lambda generates messageId (timestamp-connectionId), saves to Messages table, scans Connections table for all active connections, then uses API Gateway Management API (PostToConnection) to broadcast to each connection. Automatically removes stale connections (410 errors) during broadcast.' },
                  { num: 5, title: 'Real-Time Delivery', desc: 'All connected users receive the message instantly via their WebSocket connections through the API Gateway Management API.' },
                  { num: 6, title: 'User Disconnects', desc: 'onDisconnect Lambda removes connection ID from DynamoDB when user closes WebSocket connection.' },
                ].map((step) => (
                  <div key={step.num} className="bg-card border border-border rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0 text-sm">
                        {step.num}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{step.title}</h3>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Terraform Section */}
            <section className="mb-20 scroll-mt-8" id="terraform">
              <div className="flex items-center gap-3 mb-8">
                <Server className="w-8 h-8 text-accent" />
                <h2 className="text-3xl font-bold">Infrastructure as Code</h2>
              </div>
              
              <div className="bg-card border border-border rounded-xl p-8 mb-6">
                <p className="text-muted-foreground mb-6">
                  Terraform is used to define, provision, and manage all AWS infrastructure resources 
                  in a declarative, version-controlled manner. This ensures consistency, reproducibility, 
                  and easy collaboration.
                </p>

                <h3 className="text-xl font-semibold mb-4">Terraform Configuration Files</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { file: 'provider.tf', desc: 'Configures the AWS provider with region and credentials.' },
                    { file: 'variables.tf', desc: 'Defines input variables like project name, AWS region, and stage name.' },
                    { file: 'dynamodb.tf', desc: 'Creates the Connections and Messages DynamoDB tables with their schemas.' },
                    { file: 'iam.tf', desc: 'Creates IAM role for Lambda functions with DynamoDB and API Gateway permissions.' },
                    { file: 'lambda.tf', desc: 'Packages Lambda function code and creates Lambda functions with environment variables.' },
                    { file: 'api-gateway.tf', desc: 'Creates WebSocket API Gateway, defines routes, and integrates with Lambda functions.' },
                    { file: 'outputs.tf', desc: 'Exports WebSocket URLs (use stage_url output which includes stage name for frontend configuration).' },
                  ].map((item) => (
                    <div key={item.file} className="bg-background rounded-lg p-4">
                      <p className="font-semibold mb-2 text-sm">{item.file}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terraform Workflow Diagram */}
              <div className="bg-card border border-border rounded-xl p-8 mb-6">
                <MermaidDiagram
                  chart={`
flowchart LR
    Start([Start]) --> Init["1️⃣ terraform init<br/>Download providers<br/>& initialize backend"]
    Init --> Plan["2️⃣ terraform plan<br/>Preview changes<br/>& create execution plan"]
    Plan --> Apply["3️⃣ terraform apply<br/>Create/update resources<br/>in AWS"]
    Apply --> Output["4️⃣ terraform output<br/>Get WebSocket URL<br/>(use stage_url output)"]
    Output --> End([End])
    
    Apply --> Resources["📦 Resources Created:<br/>• API Gateway<br/>• Lambda Functions<br/>• DynamoDB Tables<br/>• IAM Roles"]
    
    style Start fill:#e0f2fe,stroke:#0284c7,stroke-width:3px
    style Init fill:#fef3c7,stroke:#d97706,stroke-width:2px
    style Plan fill:#dbeafe,stroke:#2563eb,stroke-width:2px
    style Apply fill:#dcfce7,stroke:#16a34a,stroke-width:2px
    style Output fill:#f3e8ff,stroke:#9333ea,stroke-width:2px
    style End fill:#e0f2fe,stroke:#0284c7,stroke-width:3px
    style Resources fill:#fef2f2,stroke:#dc2626,stroke-width:2px,stroke-dasharray: 5 5
                  `}
                />
              </div>
            </section>

            {/* Benefits */}
            <section className="mb-20 scroll-mt-8" id="benefits">
              <div className="flex items-center gap-3 mb-8">
                <Users className="w-8 h-8 text-accent" />
                <h2 className="text-3xl font-bold">Key Benefits</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Serverless Architecture</h3>
                  <p className="text-muted-foreground text-sm">
                    No servers to manage. Lambda functions scale automatically based on demand. 
                    Pay only for what you use.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Real-Time Communication</h3>
                  <p className="text-muted-foreground text-sm">
                    WebSocket connections enable instant message delivery to all connected users 
                    without polling or refresh.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Infrastructure as Code</h3>
                  <p className="text-muted-foreground text-sm">
                    Entire infrastructure is version-controlled and reproducible. 
                    Easy to deploy to multiple environments or recreate from scratch.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-3">Cost Effective</h3>
                  <p className="text-muted-foreground text-sm">
                    All services use AWS Free Tier or pay-per-request pricing. 
                    Perfect for demos, prototypes, and small-scale applications.
                  </p>
                </div>
              </div>
            </section>

            {/* AWS Services Used */}
            <section className="mb-20 scroll-mt-8" id="services">
              <h2 className="text-3xl font-bold mb-8">AWS Services Used</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">API Gateway</h3>
                  <p className="text-sm text-muted-foreground">
                    WebSocket API for managing persistent connections and routing messages.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">Lambda</h3>
                  <p className="text-sm text-muted-foreground">
                    Serverless compute for executing business logic without managing servers.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">DynamoDB</h3>
                  <p className="text-sm text-muted-foreground">
                    Fully managed NoSQL database for storing connections and messages.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">IAM</h3>
                  <p className="text-sm text-muted-foreground">
                    Identity and access management for secure resource access.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-semibold mb-2">CloudWatch</h3>
                  <p className="text-sm text-muted-foreground">
                    Logging and monitoring for Lambda functions and API Gateway.
                  </p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="text-center py-12 border-t border-border">
              <Link
                to="/chat"
                className="inline-block px-8 py-4 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-theme text-lg"
              >
                Try the Chat Application
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
