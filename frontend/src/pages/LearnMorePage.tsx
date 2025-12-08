import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, ArrowLeft, Presentation, Code, Network, Zap, Database, Shield, Send, Users, MessageSquare, Globe } from 'lucide-react'
import BenefitsSlideDeck from '../components/BenefitsSlideDeck'
import DevOpsSlideDeck from '../components/DevOpsSlideDeck'
import MermaidDiagram from '../components/MermaidDiagram'
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
      description: 'WebSocket API\nRoutes:\n$connect (with authorizer)\n$disconnect\nsendMessage\ngetHistory',
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
      description: 'Lambda Function\nHandles:\nsendMessage (save & broadcast)\ngetHistory (fetch recent)\nVerifies username\nfrom database',
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
      description: 'DynamoDB\nPK: messageId\nSK: timestamp\nmessageType (GSI partition)\nTimestampIndex GSI\nusername, message',
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
    id: 'e3a', 
    source: 'api-gateway', 
    target: 'lambda-sendmessage', 
    label: 'getHistory',
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
    label: 'PutItem (save)\nQuery (getHistory)',
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
      description: 'sendMessage flow:\n1. Get username from DB\n2. Save to Messages\n3. Scan Connections\n4. Broadcast\n\nAlso handles getHistory',
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
      description: 'Store message\nQuery via TimestampIndex\nGSI for getHistory',
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
      description: 'Store connectionId\n(username validated\nby authorizer)',
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
      description: 'Handles:\nsendMessage (save & broadcast)\ngetHistory (fetch recent)\nGet username from DB\n(prevents impersonation)',
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
  { 
    id: 'user-history', 
    type: 'iconNode',
    position: { x: 0, y: 650 }, 
    data: { 
      icon: MessageSquare,
      label: 'User',
      description: 'Requests history',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'history-api', 
    type: 'iconNode',
    position: { x: 300, y: 650 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: 'getHistory route',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'history-lambda', 
    type: 'iconNode',
    position: { x: 600, y: 650 }, 
    data: { 
      icon: Zap,
      label: 'sendMessage',
      description: 'Query Messages\nvia TimestampIndex GSI\nSend recent messages',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'history-db', 
    type: 'iconNode',
    position: { x: 900, y: 650 }, 
    data: { 
      icon: Database,
      label: 'Messages Table',
      description: 'Query TimestampIndex\nGSI (messageType, timestamp)\nReturn recent messages',
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
  // Get history flow
  { 
    id: 'cl9', 
    source: 'user-history', 
    target: 'history-api', 
    label: 'Request history',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl10', 
    source: 'history-api', 
    target: 'history-lambda', 
    label: 'Route',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl11', 
    source: 'history-lambda', 
    target: 'history-db', 
    label: 'Query GSI',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl12', 
    source: 'history-db', 
    target: 'history-lambda', 
    label: 'Return messages',
    style: { stroke: '#16a34a', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cl13', 
    source: 'history-lambda', 
    target: 'user-history', 
    label: 'Send messages',
    style: { stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
]

// CloudFront Hosting Sequence Diagram
// Arranged as a sequence diagram with participants at top and interactions flowing down
const cloudfrontHostingNodes: Node[] = [
  // Participants row (top)
  { 
    id: 'user-browser', 
    type: 'iconNode',
    position: { x: 100, y: 0 }, 
    data: { 
      icon: Users,
      label: 'User Browser',
      description: 'HTTPS requests',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'cloudfront-edge', 
    type: 'iconNode',
    position: { x: 350, y: 0 }, 
    data: { 
      icon: Network,
      label: 'CloudFront Edge',
      description: 'Nearest location\nCache check',
      color: '#7c3aed',
      bgColor: '#ede9fe'
    }
  },
  { 
    id: 's3-bucket', 
    type: 'iconNode',
    position: { x: 600, y: 0 }, 
    data: { 
      icon: Database,
      label: 'S3 Origin',
      description: 'Static files\nOrigin storage',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  // Sequence flow nodes (interactions)
  { 
    id: 'seq1', 
    type: 'iconNode',
    position: { x: 225, y: 150 }, 
    data: { 
      icon: Send,
      label: '1. HTTPS Request',
      description: 'GET /index.html\nhttps://dxxx.cloudfront.net',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'seq2', 
    type: 'iconNode',
    position: { x: 225, y: 300 }, 
    data: { 
      icon: Zap,
      label: '2. Check Cache',
      description: 'Cache hit?\nYes → serve\nNo → fetch',
      color: '#7c3aed',
      bgColor: '#ede9fe'
    }
  },
  { 
    id: 'seq3', 
    type: 'iconNode',
    position: { x: 475, y: 450 }, 
    data: { 
      icon: Send,
      label: '3. Fetch from Origin',
      description: 'Cache miss\nGET from S3',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'seq4', 
    type: 'iconNode',
    position: { x: 475, y: 600 }, 
    data: { 
      icon: Send,
      label: '4. Return Files',
      description: 'index.html\nassets/*',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'seq5', 
    type: 'iconNode',
    position: { x: 225, y: 750 }, 
    data: { 
      icon: Send,
      label: '5. Serve & Cache',
      description: 'Return to user\nCache for future',
      color: '#7c3aed',
      bgColor: '#ede9fe'
    }
  },
  // Deployment section
  { 
    id: 'deploy-process', 
    type: 'iconNode',
    position: { x: 850, y: 300 }, 
    data: { 
      icon: Code,
      label: 'Deployment',
      description: 'deploy-frontend.sh\nBuild & upload',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'deploy-upload', 
    type: 'iconNode',
    position: { x: 725, y: 450 }, 
    data: { 
      icon: Send,
      label: 'Upload to S3',
      description: 's3 sync\ndelete old files',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'cache-invalidation', 
    type: 'iconNode',
    position: { x: 475, y: 750 }, 
    data: { 
      icon: Zap,
      label: 'Invalidate Cache',
      description: 'Invalidate /*\nForce fresh content',
      color: '#dc2626',
      bgColor: '#fee2e2'
    }
  },
]

const cloudfrontHostingEdges: Edge[] = [
  // Main request flow (sequence)
  { 
    id: 'cf1', 
    source: 'user-browser', 
    target: 'seq1', 
    label: '',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf2', 
    source: 'seq1', 
    target: 'cloudfront-edge', 
    label: '',
    style: { stroke: '#0284c7', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf3', 
    source: 'cloudfront-edge', 
    target: 'seq2', 
    label: '',
    style: { stroke: '#7c3aed', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf4', 
    source: 'seq2', 
    target: 'seq3', 
    label: 'Cache miss',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf5', 
    source: 'seq3', 
    target: 's3-bucket', 
    label: '',
    style: { stroke: '#2563eb', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf6', 
    source: 's3-bucket', 
    target: 'seq4', 
    label: '',
    style: { stroke: '#16a34a', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf7', 
    source: 'seq4', 
    target: 'seq5', 
    label: '',
    style: { stroke: '#16a34a', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf8', 
    source: 'seq5', 
    target: 'user-browser', 
    label: '',
    style: { stroke: '#7c3aed', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Cache hit path (alternative)
  { 
    id: 'cf9', 
    source: 'seq2', 
    target: 'seq5', 
    label: 'Cache hit',
    style: { stroke: '#7c3aed', strokeWidth: 2, strokeDasharray: '5,5' },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  // Deployment flow
  { 
    id: 'cf10', 
    source: 'deploy-process', 
    target: 'deploy-upload', 
    label: '',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf11', 
    source: 'deploy-upload', 
    target: 's3-bucket', 
    label: '',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf12', 
    source: 'deploy-process', 
    target: 'cache-invalidation', 
    label: '',
    style: { stroke: '#d97706', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
  { 
    id: 'cf13', 
    source: 'cache-invalidation', 
    target: 'cloudfront-edge', 
    label: '',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed }
  },
]

type DiagramType = 'system' | 'message-flow' | 'connection-lifecycle' | 'key-benefits' | 'devops' | 'cloudfront'

export default function LearnMorePage() {
  const [isDark, setIsDark] = useState(false)
  const [activeDiagram, setActiveDiagram] = useState<DiagramType>('key-benefits')
  
  const [systemNodes, setSystemNodes, onSystemNodesChange] = useNodesState(systemArchitectureNodes)
  const [systemEdges, setSystemEdges, onSystemEdgesChange] = useEdgesState(systemArchitectureEdges)
  
  const [messageNodes, setMessageNodes, onMessageNodesChange] = useNodesState(messageFlowNodes)
  const [messageEdges, setMessageEdges, onMessageEdgesChange] = useEdgesState(messageFlowEdges)
  
  const [lifecycleNodes, setLifecycleNodes, onLifecycleNodesChange] = useNodesState(connectionLifecycleNodes)
  const [lifecycleEdges, setLifecycleEdges, onLifecycleEdgesChange] = useEdgesState(connectionLifecycleEdges)
  
  const [cloudfrontNodes, setCloudfrontNodes, onCloudfrontNodesChange] = useNodesState(cloudfrontHostingNodes)
  const [cloudfrontEdges, setCloudfrontEdges, onCloudfrontEdgesChange] = useEdgesState(cloudfrontHostingEdges)
  
  const getCurrentNodes = () => {
    switch (activeDiagram) {
      case 'system': return systemNodes
      case 'message-flow': return messageNodes
      case 'connection-lifecycle': return lifecycleNodes
      case 'cloudfront': return cloudfrontNodes
      case 'key-benefits': return []
      case 'devops': return []
      default: return []
    }
  }
  
  const getCurrentEdges = () => {
    switch (activeDiagram) {
      case 'system': return systemEdges
      case 'message-flow': return messageEdges
      case 'connection-lifecycle': return lifecycleEdges
      case 'cloudfront': return cloudfrontEdges
      case 'key-benefits': return []
      case 'devops': return []
      default: return []
    }
  }
  
  const getCurrentNodesChange = () => {
    switch (activeDiagram) {
      case 'system': return onSystemNodesChange
      case 'message-flow': return onMessageNodesChange
      case 'connection-lifecycle': return onLifecycleNodesChange
      case 'cloudfront': return onCloudfrontNodesChange
      case 'key-benefits': return () => {}
      case 'devops': return () => {}
      default: return () => {}
    }
  }
  
  const getCurrentEdgesChange = () => {
    switch (activeDiagram) {
      case 'system': return onSystemEdgesChange
      case 'message-flow': return onMessageEdgesChange
      case 'connection-lifecycle': return onLifecycleEdgesChange
      case 'cloudfront': return onCloudfrontEdgesChange
      case 'key-benefits': return () => {}
      case 'devops': return () => {}
      default: return () => {}
    }
  }
  
  const getCurrentEdgesSetter = () => {
    switch (activeDiagram) {
      case 'system': return setSystemEdges
      case 'message-flow': return setMessageEdges
      case 'connection-lifecycle': return setLifecycleEdges
      case 'cloudfront': return setCloudfrontEdges
      case 'key-benefits': return (_updater: (edges: Edge[]) => Edge[]) => {}
      case 'devops': return (_updater: (edges: Edge[]) => Edge[]) => {}
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
    'cloudfront': {
      title: 'CloudFront Hosting Flow',
      description: 'How the frontend is deployed to S3 and served globally through CloudFront CDN for optimal performance'
    },
    'key-benefits': {
      title: 'Key Benefits',
      description: 'Security-first serverless architecture with robust infrastructure management'
    },
    'devops': {
      title: 'DevOps Pipeline',
      description: 'Modern DevOps practices for infrastructure management, deployment automation, and continuous delivery'
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
            <button
              onClick={() => setActiveDiagram('cloudfront')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'cloudfront'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              CloudFront Hosting
            </button>
            <button
              onClick={() => setActiveDiagram('devops')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'devops'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              DevOps Pipeline
            </button>
          </div>
        </div>

        {/* React Flow Charts */}
        {activeDiagram !== 'key-benefits' && activeDiagram !== 'devops' && activeDiagram !== 'cloudfront' && (
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

        {/* CloudFront Mermaid Sequence Diagram */}
        {activeDiagram === 'cloudfront' && (
          <div className="max-w-7xl mx-auto mb-12">
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-2xl font-bold mb-4">
                {diagramInfo[activeDiagram].title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {diagramInfo[activeDiagram].description}
              </p>
              <MermaidDiagram
                chart={`
sequenceDiagram
    participant User as User Browser
    participant CF as CloudFront Edge
    participant S3 as S3 Origin
    participant Deploy as Deployment Process

    Note over User,S3: Request Flow (Cache Miss)
    User->>CF: 1. HTTPS Request<br/>GET /index.html
    CF->>CF: 2. Check Cache
    CF->>S3: 3. Cache Miss<br/>Fetch from Origin
    S3-->>CF: 4. Return Files<br/>(index.html, assets)
    CF->>CF: 5. Cache Content
    CF-->>User: 6. Serve Content<br/>(HTTPS Response)

    Note over User,CF: Request Flow (Cache Hit)
    User->>CF: 1. HTTPS Request<br/>GET /index.html
    CF->>CF: 2. Check Cache<br/>(Cache Hit!)
    CF-->>User: 3. Serve Cached Content<br/>(Low Latency)

    Note over Deploy,S3: Deployment Flow
    Deploy->>S3: Upload Files<br/>(s3 sync)
    Deploy->>CF: Invalidate Cache<br/>(/* paths)
    Note over CF: Cache Cleared<br/>Next request fetches fresh content
                `}
                title="CloudFront Hosting Sequence"
                className="min-h-[500px]"
              />
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
                    <p>$connect • $disconnect • sendMessage • getHistory (via $request.body.action)</p>
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
                    <p><span className="font-semibold">sendMessage:</span> Handles sendMessage (save & broadcast) and getHistory (fetch recent messages via GSI)</p>
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
                    <p><span className="font-semibold">Messages:</span> messageId (PK: timestamp-connectionId), timestamp (range key), messageType, username, message</p>
                    <p><span className="font-semibold">Messages GSI:</span> TimestampIndex (hash key: messageType='chat', range key: timestamp) for efficient querying of recent messages</p>
                  </div>
                </div>
              </div>

              {/* CloudFront Hosting Section */}
              <div className="bg-card border border-border rounded-xl p-8 mt-12">
                <div className="flex items-center gap-3 mb-6">
                  <Globe className="w-8 h-8 text-accent" />
                  <h3 className="text-2xl font-bold">CloudFront CDN Hosting</h3>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  The frontend is hosted on AWS S3 and served globally through Amazon CloudFront, providing fast, secure, and scalable content delivery.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-background rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Database className="w-6 h-6 text-accent" />
                      <h4 className="text-xl font-semibold">S3 Static Hosting</h4>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      The React application is built and deployed to an S3 bucket configured for static website hosting. All frontend assets (HTML, CSS, JavaScript) are stored in S3.
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><span className="font-semibold">Build Process:</span> React app compiled to static files</p>
                      <p><span className="font-semibold">Storage:</span> S3 bucket with public read access</p>
                      <p><span className="font-semibold">Configuration:</span> Static website hosting enabled</p>
                      <p><span className="font-semibold">Deployment:</span> Automated via deploy-frontend.sh script</p>
                    </div>
                  </div>

                  <div className="bg-background rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Network className="w-6 h-6 text-accent" />
                      <h4 className="text-xl font-semibold">CloudFront CDN</h4>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      CloudFront distribution sits in front of S3, caching content at edge locations worldwide and serving users from the nearest location for optimal performance.
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><span className="font-semibold">Global CDN:</span> 400+ edge locations worldwide</p>
                      <p><span className="font-semibold">HTTPS:</span> Automatic SSL/TLS encryption</p>
                      <p><span className="font-semibold">Caching:</span> Intelligent cache management</p>
                      <p><span className="font-semibold">Performance:</span> Low latency, high throughput</p>
                    </div>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6 mb-6">
                  <h4 className="text-lg font-semibold mb-4">Key Features</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">React Router Support</p>
                          <p className="text-xs">Custom error responses (403/404 → index.html) enable client-side routing</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Cache Invalidation</p>
                          <p className="text-xs">Automatic cache invalidation on deployment ensures users get latest version</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Compression</p>
                          <p className="text-xs">Automatic gzip compression reduces bandwidth and improves load times</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">HTTPS Redirect</p>
                          <p className="text-xs">All HTTP traffic automatically redirected to HTTPS for security</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Cost Effective</p>
                          <p className="text-xs">Pay-per-use pricing with free tier for low traffic applications</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Scalability</p>
                          <p className="text-xs">Handles traffic spikes automatically without infrastructure changes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Deployment Workflow</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0">1</div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">Build Frontend</p>
                        <p className="text-muted-foreground text-xs">React app compiled with WebSocket URL from Terraform outputs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0">2</div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">Upload to S3</p>
                        <p className="text-muted-foreground text-xs">Static files synced to S3 bucket (deletes old files, uploads new ones)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0">3</div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">CloudFront Cache Invalidation</p>
                        <p className="text-muted-foreground text-xs">Cache invalidated for all paths (/*) to ensure users get updated content</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0">4</div>
                      <div>
                        <p className="font-semibold text-foreground mb-1">Error Page Configuration</p>
                        <p className="text-muted-foreground text-xs">Custom error responses configured to support React Router client-side navigation</p>
                      </div>
                    </div>
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
                    API Gateway triggers the authorizer Lambda first to validate the username, then (if allowed) triggers the onConnect Lambda, which stores the connectionId and validated username in the Connections DynamoDB table.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">2</span>
                    Message History Retrieval
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    After connecting, users can request message history. The frontend sends a getHistory action via WebSocket, which is routed to the sendMessage Lambda.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    The Lambda queries the Messages table using the TimestampIndex GSI (with messageType='chat' as partition key and timestamp as sort key) to efficiently retrieve the most recent messages, then sends them back to the requesting user via PostToConnection.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">3</span>
                    Message Sending
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    Users can send messages while connected. Each message is routed through API Gateway to the sendMessage Lambda, which processes and broadcasts it to all active connections. The same Lambda also handles getHistory requests.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Messages are saved to the Messages table for history (with messageType='chat' for GSI queries), and broadcast in real-time to all connected users. The Lambda verifies the username from the Connections table to prevent impersonation.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">4</span>
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

          {/* CloudFront Hosting Details */}
          {activeDiagram === 'cloudfront' && (
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">CloudFront Hosting Flow</h3>
              <div className="space-y-6">
                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">1</span>
                    User Request
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    User's browser makes an HTTPS request to the CloudFront distribution URL (e.g., https://dxxx.cloudfront.net).
                  </p>
                  <p className="text-muted-foreground text-sm">
                    CloudFront automatically redirects HTTP to HTTPS and routes the request to the nearest edge location based on geographic proximity.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">2</span>
                    Cache Check
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    The edge location checks its cache for the requested content. If cached and not expired, it serves the content directly to the user (cache hit).
                  </p>
                  <p className="text-muted-foreground text-sm">
                    This provides extremely low latency as the content is served from the edge location closest to the user, without needing to fetch from S3.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">3</span>
                    Origin Fetch (Cache Miss)
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    If the content is not cached (cache miss), CloudFront fetches it from the S3 origin bucket.
                  </p>
                  <p className="text-muted-foreground text-sm">
                    The content is then cached at the edge location for future requests, and served to the user. Subsequent requests from nearby users will benefit from the cached content.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-xl font-semibold mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold text-sm">4</span>
                    Deployment & Cache Invalidation
                  </h4>
                  <p className="text-muted-foreground text-sm mb-3">
                    When deploying updates, the deploy-frontend.sh script uploads new files to S3 and automatically creates a cache invalidation for all paths (/*).
                  </p>
                  <p className="text-muted-foreground text-sm">
                    This ensures that users receive the latest version of the application. Cache invalidation typically completes within a few minutes, and CloudFront will fetch fresh content from S3 for subsequent requests.
                  </p>
                </div>

                <div className="bg-background rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-3">Benefits of This Architecture</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Global Performance</p>
                          <p className="text-xs">Content served from 400+ edge locations worldwide, minimizing latency</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Reduced S3 Costs</p>
                          <p className="text-xs">Caching reduces the number of requests to S3, lowering data transfer costs</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">DDoS Protection</p>
                          <p className="text-xs">CloudFront provides built-in DDoS mitigation and protection</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Automatic Scaling</p>
                          <p className="text-xs">Handles traffic spikes without any infrastructure changes</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">SSL/TLS Certificates</p>
                          <p className="text-xs">Free SSL certificates managed automatically by AWS</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent mt-1">•</span>
                        <div>
                          <p className="font-semibold text-foreground">Compression</p>
                          <p className="text-xs">Automatic gzip compression reduces bandwidth usage</p>
                        </div>
                      </div>
                    </div>
                  </div>
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

          {/* DevOps Pipeline Section */}
          {activeDiagram === 'devops' && (
            <div className="bg-card border border-border rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">DevOps Pipeline</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {diagramInfo[activeDiagram].description}
              </p>
              <DevOpsSlideDeck />
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

