import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, ArrowLeft, Presentation, Code, Network, Zap, Database, Shield, Send, Users, MessageSquare } from 'lucide-react'
import BenefitsSlideDeck from '../components/BenefitsSlideDeck'
import ReactFlow, { 
  Node, 
  Edge, 
  Connection,
  Background, 
  Controls, 
  MiniMap,
  ConnectionMode,
  addEdge,
  useNodesState,
  useEdgesState,
  NodeTypes,
  Handle,
  Position,
  MarkerType
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom Node Components with Icons
const IconNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const { icon: Icon, label, description, color, bgColor } = data
  
  return (
    <div 
      className={`px-4 py-3 rounded-lg border-2 shadow-lg transition-all ${
        selected ? 'ring-2 ring-accent ring-offset-2' : ''
      }`}
      style={{ 
        background: bgColor || '#fff',
        borderColor: color || '#333',
        minWidth: '180px'
      }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex flex-col items-center text-center">
        <div className="mb-2" style={{ color: color || '#333' }}>
          <Icon size={32} />
        </div>
        <div className="font-semibold text-sm mb-1">{label}</div>
        {description && (
          <div className="text-xs opacity-70 whitespace-pre-line">{description}</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  iconNode: IconNode,
}

// System Architecture Diagram
const systemArchitectureNodes: Node[] = [
  { 
    id: 'frontend', 
    type: 'iconNode',
    position: { x: 400, y: -50 }, 
    data: { 
      icon: Code,
      label: 'Frontend',
      description: 'React + TypeScript\nWebSocket Client\nReal-time UI',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'api-gateway', 
    type: 'iconNode',
    position: { x: 400, y: 150 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: 'WebSocket API\nRoutes:\n$connect (with authorizer)\n$disconnect\nsendMessage',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'lambda-authorizer', 
    type: 'iconNode',
    position: { x: 100, y: 150 }, 
    data: { 
      icon: Shield,
      label: 'Authorizer',
      description: 'Lambda Function\nValidates username\nBlocks malicious input\nReturns Allow/Deny',
      color: '#dc2626',
      bgColor: '#fee2e2'
    }
  },
  { 
    id: 'lambda-onconnect', 
    type: 'iconNode',
    position: { x: 100, y: 450 }, 
    data: { 
      icon: Zap,
      label: 'onConnect',
      description: 'Lambda Function\nStore connection',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'lambda-sendmessage', 
    type: 'iconNode',
    position: { x: 700, y: 450 }, 
    data: { 
      icon: Zap,
      label: 'sendMessage',
      description: 'Lambda Function\nSave & broadcast\nVerifies username\nfrom database',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'lambda-ondisconnect', 
    type: 'iconNode',
    position: { x: 400, y: 450 }, 
    data: { 
      icon: Zap,
      label: 'onDisconnect',
      description: 'Lambda Function\nRemove connection',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'dynamodb-connections', 
    type: 'iconNode',
    position: { x: 200, y: 700 }, 
    data: { 
      icon: Database,
      label: 'Connections Table',
      description: 'DynamoDB\nPK: connectionId\nusername, connectedAt\nPay-per-request',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'dynamodb-messages', 
    type: 'iconNode',
    position: { x: 500, y: 700 }, 
    data: { 
      icon: Database,
      label: 'Messages Table',
      description: 'DynamoDB\nPK: messageId\nSK: timestamp\nusername, message',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
]

const systemArchitectureEdges: Edge[] = [
  { 
    id: 'e1', 
    source: 'frontend', 
    target: 'api-gateway', 
    label: 'WebSocket Connection\n?username=...',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e1b', 
    source: 'lambda-authorizer', 
    target: 'api-gateway', 
    label: 'Allow/Deny',
    style: { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e2', 
    source: 'api-gateway', 
    target: 'lambda-onconnect', 
    label: '$connect\n(if allowed)',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e3', 
    source: 'api-gateway', 
    target: 'lambda-sendmessage', 
    label: 'sendMessage',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e4', 
    source: 'api-gateway', 
    target: 'lambda-ondisconnect', 
    label: '$disconnect',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e5', 
    source: 'lambda-onconnect', 
    target: 'dynamodb-connections', 
    label: 'PutItem',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e6', 
    source: 'lambda-sendmessage', 
    target: 'dynamodb-connections', 
    label: 'GetItem (username)\nScan (connections)',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e7', 
    source: 'lambda-sendmessage', 
    target: 'dynamodb-messages', 
    label: 'PutItem',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'e8', 
    source: 'lambda-ondisconnect', 
    target: 'dynamodb-connections', 
    label: 'DeleteItem',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
]

// Message Flow Diagram
const messageFlowNodes: Node[] = [
  { 
    id: 'user1', 
    type: 'iconNode',
    position: { x: 50, y: 0 }, 
    data: { 
      icon: Users,
      label: 'User 1',
      description: 'Sends message',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'api-gw-flow', 
    type: 'iconNode',
    position: { x: 50, y: 150 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: 'Receives message\nRoutes to sendMessage',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'lambda-send', 
    type: 'iconNode',
    position: { x: 50, y: 300 }, 
    data: { 
      icon: Zap,
      label: 'sendMessage Lambda',
      description: '1. Get username from DB\n2. Save to Messages\n3. Scan Connections\n4. Broadcast',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'db-messages', 
    type: 'iconNode',
    position: { x: -50, y: 500 }, 
    data: { 
      icon: Database,
      label: 'Messages Table',
      description: 'Store message',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'db-connections', 
    type: 'iconNode',
    position: { x: 150, y: 500 }, 
    data: { 
      icon: Database,
      label: 'Connections Table',
      description: '1. Get username\n2. Get connectionIds',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'broadcast', 
    type: 'iconNode',
    position: { x: 800, y: 0 }, 
    data: { 
      icon: Send,
      label: 'Broadcast',
      description: 'PostToConnection\nfor each connection',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'user2', 
    type: 'iconNode',
    position: { x: 700, y: 400 }, 
    data: { 
      icon: Users,
      label: 'User 2',
      description: 'Receives message',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'user3', 
    type: 'iconNode',
    position: { x: 900, y: 400 }, 
    data: { 
      icon: Users,
      label: 'User 3',
      description: 'Receives message',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
]

const messageFlowEdges: Edge[] = [
  { 
    id: 'mf1', 
    source: 'user1', 
    target: 'api-gw-flow', 
    label: 'Send message',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf2', 
    source: 'api-gw-flow', 
    target: 'lambda-send', 
    label: 'Route',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf3', 
    source: 'lambda-send', 
    target: 'db-connections', 
    label: '1. Get username\n(verify identity)',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf3a', 
    source: 'lambda-send', 
    target: 'db-messages', 
    label: '2. Save message',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf4', 
    source: 'lambda-send', 
    target: 'db-connections', 
    label: '3. Get connections',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf5', 
    source: 'lambda-send', 
    target: 'broadcast', 
    label: '4. Broadcast',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf6', 
    source: 'broadcast', 
    target: 'user2', 
    style: { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf7', 
    source: 'broadcast', 
    target: 'user3', 
    style: { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'mf8', 
    source: 'broadcast', 
    target: 'user1', 
    style: { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
]

// Connection Lifecycle Diagram
const connectionLifecycleNodes: Node[] = [
  { 
    id: 'user-connect', 
    type: 'iconNode',
    position: { x: 0, y: 50 }, 
    data: { 
      icon: Users,
      label: 'User',
      description: 'Opens WebSocket\nwss://...?username=...',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'connect-api', 
    type: 'iconNode',
    position: { x: 300, y: 50 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: '$connect route\nCalls authorizer first',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'connect-authorizer', 
    type: 'iconNode',
    position: { x: 600, y: 50 }, 
    data: { 
      icon: Shield,
      label: 'Authorizer',
      description: 'Validates username\nBlocks malicious input\nReturns Allow/Deny',
      color: '#dc2626',
      bgColor: '#fee2e2'
    }
  },
  { 
    id: 'connect-lambda', 
    type: 'iconNode',
    position: { x: 900, y: 50 }, 
    data: { 
      icon: Zap,
      label: 'onConnect',
      description: 'Validates username\nStore connectionId\n(if authorized)',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'connect-db', 
    type: 'iconNode',
    position: { x: 1200, y: 50 }, 
    data: { 
      icon: Database,
      label: 'Connections Table',
      description: 'Store:\nconnectionId\nusername\nconnectedAt',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'user-send', 
    type: 'iconNode',
    position: { x: 0, y: 250 }, 
    data: { 
      icon: MessageSquare,
      label: 'User',
      description: 'Sends message',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'send-api', 
    type: 'iconNode',
    position: { x: 300, y: 250 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: 'sendMessage route',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'send-lambda', 
    type: 'iconNode',
    position: { x: 600, y: 250 }, 
    data: { 
      icon: Zap,
      label: 'sendMessage',
      description: 'Get username from DB\nProcess & broadcast\n(prevents impersonation)',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'user-disconnect', 
    type: 'iconNode',
    position: { x: 0, y: 450 }, 
    data: { 
      icon: Users,
      label: 'User',
      description: 'Closes connection',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'disconnect-api', 
    type: 'iconNode',
    position: { x: 300, y: 450 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: '$disconnect route',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'disconnect-lambda', 
    type: 'iconNode',
    position: { x: 600, y: 450 }, 
    data: { 
      icon: Zap,
      label: 'onDisconnect',
      description: 'Remove connection',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'disconnect-db', 
    type: 'iconNode',
    position: { x: 900, y: 450 }, 
    data: { 
      icon: Database,
      label: 'Connections Table',
      description: 'Delete:\nconnectionId',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
]

const connectionLifecycleEdges: Edge[] = [
  // Connect flow
  { 
    id: 'cl1', 
    source: 'user-connect', 
    target: 'connect-api', 
    label: 'WebSocket connect\n?username=...',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl1a', 
    source: 'connect-api', 
    target: 'connect-authorizer', 
    label: 'Authorize',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl1b', 
    source: 'connect-authorizer', 
    target: 'connect-api', 
    label: 'Allow/Deny',
    style: { stroke: '#dc2626', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl2', 
    source: 'connect-api', 
    target: 'connect-lambda', 
    label: 'Trigger\n(if allowed)',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl3', 
    source: 'connect-lambda', 
    target: 'connect-db', 
    label: 'PutItem',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Send message flow
  { 
    id: 'cl4', 
    source: 'user-send', 
    target: 'send-api', 
    label: 'Send message',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl5', 
    source: 'send-api', 
    target: 'send-lambda', 
    label: 'Route',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Disconnect flow
  { 
    id: 'cl6', 
    source: 'user-disconnect', 
    target: 'disconnect-api', 
    label: 'Close connection',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl7', 
    source: 'disconnect-api', 
    target: 'disconnect-lambda', 
    label: 'Trigger',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl8', 
    source: 'disconnect-lambda', 
    target: 'disconnect-db', 
    label: 'DeleteItem',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
]

type DiagramType = 'system' | 'message-flow' | 'connection-lifecycle' | 'key-benefits'

export default function LearnMorePage() {
  const [isDark, setIsDark] = useState(false)
  const [activeDiagram, setActiveDiagram] = useState<DiagramType>('key-benefits')
  
  const [systemNodes, setSystemNodes, onSystemNodesChange] = useNodesState(systemArchitectureNodes)
  const [systemEdges, setSystemEdges, onSystemEdgesChange] = useEdgesState(systemArchitectureEdges)
  
  const [messageNodes, setMessageNodes, onMessageNodesChange] = useNodesState(messageFlowNodes)
  const [messageEdges, setMessageEdges, onMessageEdgesChange] = useEdgesState(messageFlowEdges)
  
  const [lifecycleNodes, setLifecycleNodes, onLifecycleNodesChange] = useNodesState(connectionLifecycleNodes)
  const [lifecycleEdges, setLifecycleEdges, onLifecycleEdgesChange] = useEdgesState(connectionLifecycleEdges)
  
  const getCurrentNodes = () => {
    switch (activeDiagram) {
      case 'system': return systemNodes
      case 'message-flow': return messageNodes
      case 'connection-lifecycle': return lifecycleNodes
      case 'key-benefits': return []
      default: return []
    }
  }
  
  const getCurrentEdges = () => {
    switch (activeDiagram) {
      case 'system': return systemEdges
      case 'message-flow': return messageEdges
      case 'connection-lifecycle': return lifecycleEdges
      case 'key-benefits': return []
      default: return []
    }
  }
  
  const getCurrentNodesChange = () => {
    switch (activeDiagram) {
      case 'system': return onSystemNodesChange
      case 'message-flow': return onMessageNodesChange
      case 'connection-lifecycle': return onLifecycleNodesChange
      case 'key-benefits': return () => {}
      default: return () => {}
    }
  }
  
  const getCurrentEdgesChange = () => {
    switch (activeDiagram) {
      case 'system': return onSystemEdgesChange
      case 'message-flow': return onMessageEdgesChange
      case 'connection-lifecycle': return onLifecycleEdgesChange
      case 'key-benefits': return () => {}
      default: return () => {}
    }
  }
  
  const getCurrentEdgesSetter = () => {
    switch (activeDiagram) {
      case 'system': return setSystemEdges
      case 'message-flow': return setMessageEdges
      case 'connection-lifecycle': return setLifecycleEdges
      case 'key-benefits': return (_updater: (edges: Edge[]) => Edge[]) => {}
      default: return (_updater: (edges: Edge[]) => Edge[]) => {}
    }
  }

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  const toggleTheme = () => {
    const html = document.documentElement
    html.classList.toggle('dark')
    setIsDark(!isDark)
  }

  const onConnect = useCallback(
    (params: Connection) => getCurrentEdgesSetter()((eds) => addEdge(params, eds)),
    [activeDiagram]
  )

  const diagramInfo = {
    system: {
      title: 'System Architecture',
      description: 'High-level overview of all AWS components and their relationships in the deployed infrastructure'
    },
    'message-flow': {
      title: 'Message Flow',
      description: 'How a message travels from one user through the system to all connected users in real-time'
    },
    'connection-lifecycle': {
      title: 'Connection Lifecycle',
      description: 'The complete lifecycle of a WebSocket connection: connect, send messages, and disconnect'
    },
    'key-benefits': {
      title: 'Key Benefits',
      description: 'Security-first serverless architecture with robust infrastructure management'
    }
  }

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
            <span className="font-semibold text-lg hidden sm:inline">Learn More</span>
            <span className="font-semibold text-lg sm:hidden">Learn</span>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Presentation className="w-8 h-8 text-accent-foreground" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            Architecture & Infrastructure
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A comprehensive guide to how this real-time chat application works, built entirely on AWS serverless services
          </p>
        </div>

        {/* Diagram Selector */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => setActiveDiagram('key-benefits')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'key-benefits'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              Key Benefits
            </button>
            <button
              onClick={() => setActiveDiagram('system')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'system'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              System Architecture
            </button>
            <button
              onClick={() => setActiveDiagram('message-flow')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'message-flow'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              Message Flow
            </button>
            <button
              onClick={() => setActiveDiagram('connection-lifecycle')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'connection-lifecycle'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              Connection Lifecycle
            </button>
          </div>
        </div>

        {/* React Flow Charts */}
        {activeDiagram !== 'key-benefits' && (
          <div className="max-w-7xl mx-auto mb-12">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">
                {diagramInfo[activeDiagram].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {diagramInfo[activeDiagram].description}
              </p>
              <div className="h-[600px] w-full">
                <ReactFlow
                  nodes={getCurrentNodes()}
                  edges={getCurrentEdges()}
                  nodeTypes={nodeTypes}
                  onNodesChange={getCurrentNodesChange()}
                  onEdgesChange={getCurrentEdgesChange()}
                  onConnect={onConnect}
                  connectionMode={ConnectionMode.Loose}
                  fitView
                  className="bg-background"
                >
                  <Background />
                  <Controls />
                  <MiniMap />
                </ReactFlow>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Information Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {/* System Architecture Details */}
          {activeDiagram === 'system' && (
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Component Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-background rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Code className="w-6 h-6 text-accent" />
                    <h4 className="text-xl font-semibold">Frontend</h4>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    React + TypeScript application that establishes WebSocket connections to API Gateway with username as query parameter for real-time communication.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Technologies:</p>
                    <p>React, TypeScript, Tailwind CSS, WebSocket API</p>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Network className="w-6 h-6 text-accent" />
                    <h4 className="text-xl font-semibold">API Gateway</h4>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Manages persistent WebSocket connections and routes messages to Lambda functions. Uses route selection expression based on request body action field.
                  </p>
                  <div className="text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Routes:</p>
                    <p>$connect • $disconnect • sendMessage (via $request.body.action)</p>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-6 h-6 text-accent" />
                    <h4 className="text-xl font-semibold">Lambda Functions</h4>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Three serverless functions handle connection management and message broadcasting using API Gateway Management API.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-semibold">onConnect:</span> Store connection (username from query params)</p>
                    <p><span className="font-semibold">sendMessage:</span> Save & broadcast via PostToConnection</p>
                    <p><span className="font-semibold">onDisconnect:</span> Remove connection</p>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-accent" />
                    <h4 className="text-xl font-semibold">DynamoDB</h4>
                  </div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Two tables store connections and message history with pay-per-request pricing.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p><span className="font-semibold">Connections:</span> connectionId (PK), username, connectedAt</p>
                    <p><span className="font-semibold">Messages:</span> messageId (PK: timestamp-connectionId), timestamp (range key), username, message</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Message Flow Details */}
          {activeDiagram === 'message-flow' && (
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Message Flow Steps</h3>
              <div className="space-y-4">
                {[
                  { num: 1, title: 'User Sends Message', desc: 'Frontend sends message with action field ({ action: "sendMessage", message: "..." }) via WebSocket. API Gateway routes to sendMessage Lambda using route selection expression.' },
                  { num: 2, title: 'Save Message', desc: 'sendMessage Lambda generates messageId (timestamp-connectionId), saves to Messages table with timestamp, username, and message content.' },
                  { num: 3, title: 'Get All Connections', desc: 'Lambda scans Connections table to retrieve all active connectionIds for broadcasting.' },
                  { num: 4, title: 'Broadcast to All Users', desc: 'Lambda uses API Gateway Management API (PostToConnection) to send the message to each active connection. Automatically removes stale connections (410 errors) during broadcast.' },
                  { num: 5, title: 'Real-Time Delivery', desc: 'All connected users receive the message instantly via their WebSocket connections through the API Gateway Management API.' },
                ].map((step) => (
                  <div key={step.num} className="bg-background rounded-lg p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold flex-shrink-0 text-sm">
                        {step.num}
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connection Lifecycle Details */}
          {activeDiagram === 'connection-lifecycle' && (
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Connection Lifecycle Stages</h3>
              <div className="space-y-6">
                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">1</span>
                    Connection Establishment
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    When a user opens the chat application, the frontend establishes a WebSocket connection to API Gateway with the username as a query parameter (wss://url?username=...).
                  </p>
                  <p className="text-muted-foreground text-sm">
                    API Gateway triggers the onConnect Lambda, which extracts the username from query parameters and stores the connectionId and username in the Connections DynamoDB table.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">2</span>
                    Message Sending
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    Users can send messages while connected. Each message is routed through API Gateway to the sendMessage Lambda, which processes and broadcasts it to all active connections.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Messages are saved to the Messages table for history, and broadcast in real-time to all connected users.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">3</span>
                    Connection Termination
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    When a user closes the WebSocket connection (closes browser, navigates away, etc.), API Gateway automatically triggers the onDisconnect Lambda.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    The Lambda removes the connectionId from the Connections table, cleaning up the connection record.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Benefits Section */}
          {activeDiagram === 'key-benefits' && (
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Key Benefits</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {diagramInfo[activeDiagram].description}
              </p>
              <BenefitsSlideDeck />
            </div>
          )}

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
  )
}

