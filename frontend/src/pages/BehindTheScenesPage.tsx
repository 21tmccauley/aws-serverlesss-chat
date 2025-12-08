import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, ArrowLeft, Presentation, Code, Network, Zap, Database, Shield, Server, Cloud, Globe } from 'lucide-react'
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
  Position
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

// Infrastructure Architecture Diagram
const infrastructureNodes: Node[] = [
  { 
    id: 'frontend', 
    type: 'iconNode',
    position: { x: 50, y: 200 }, 
    data: { 
      icon: Code,
      label: 'Frontend',
      description: 'React + TypeScript\nWebSocket Client',
      color: '#0284c7',
      bgColor: '#e0f2fe'
    }
  },
  { 
    id: 'api-gateway', 
    type: 'iconNode',
    position: { x: 300, y: 200 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: 'WebSocket API\n$connect, $disconnect\nsendMessage',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'lambda-onconnect', 
    type: 'iconNode',
    position: { x: 600, y: 100 }, 
    data: { 
      icon: Zap,
      label: 'onConnect',
      description: 'Lambda Function\nNode.js 20.x\n256 MB, 10s',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'lambda-sendmessage', 
    type: 'iconNode',
    position: { x: 600, y: 200 }, 
    data: { 
      icon: Zap,
      label: 'sendMessage',
      description: 'Lambda Function\nNode.js 20.x\n512 MB, 30s',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'lambda-ondisconnect', 
    type: 'iconNode',
    position: { x: 600, y: 300 }, 
    data: { 
      icon: Zap,
      label: 'onDisconnect',
      description: 'Lambda Function\nNode.js 20.x\n256 MB, 10s',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'dynamodb-connections', 
    type: 'iconNode',
    position: { x: 900, y: 150 }, 
    data: { 
      icon: Database,
      label: 'Connections',
      description: 'DynamoDB Table\nPK: connectionId\nPay-per-request',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'dynamodb-messages', 
    type: 'iconNode',
    position: { x: 900, y: 250 }, 
    data: { 
      icon: Database,
      label: 'Messages',
      description: 'DynamoDB Table\nPK: messageId\nSK: timestamp',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'iam-role', 
    type: 'iconNode',
    position: { x: 600, y: 400 }, 
    data: { 
      icon: Shield,
      label: 'IAM Role',
      description: 'Lambda Execution Role\nDynamoDB & API Gateway\nPermissions',
      color: '#9333ea',
      bgColor: '#f3e8ff'
    }
  },
]

const infrastructureEdges: Edge[] = [
  { id: 'e1', source: 'frontend', target: 'api-gateway', label: 'WebSocket', style: { stroke: '#0284c7' } },
  { id: 'e2', source: 'api-gateway', target: 'lambda-onconnect', label: '$connect route', style: { stroke: '#2563eb' } },
  { id: 'e3', source: 'api-gateway', target: 'lambda-sendmessage', label: 'sendMessage route', style: { stroke: '#2563eb' } },
  { id: 'e4', source: 'api-gateway', target: 'lambda-ondisconnect', label: '$disconnect route', style: { stroke: '#2563eb' } },
  { id: 'e5', source: 'lambda-onconnect', target: 'dynamodb-connections', label: 'PutItem', style: { stroke: '#d97706' } },
  { id: 'e6', source: 'lambda-sendmessage', target: 'dynamodb-connections', label: 'Scan', style: { stroke: '#d97706' } },
  { id: 'e7', source: 'lambda-sendmessage', target: 'dynamodb-messages', label: 'PutItem', style: { stroke: '#d97706' } },
  { id: 'e8', source: 'lambda-ondisconnect', target: 'dynamodb-connections', label: 'DeleteItem', style: { stroke: '#d97706' } },
  { id: 'e9', source: 'iam-role', target: 'lambda-onconnect', label: 'assumes', style: { stroke: '#9333ea', strokeDasharray: '5,5' } },
  { id: 'e10', source: 'iam-role', target: 'lambda-sendmessage', label: 'assumes', style: { stroke: '#9333ea', strokeDasharray: '5,5' } },
  { id: 'e11', source: 'iam-role', target: 'lambda-ondisconnect', label: 'assumes', style: { stroke: '#9333ea', strokeDasharray: '5,5' } },
]

// Terraform Resource Dependency Diagram
const terraformNodes: Node[] = [
  { 
    id: 'tf-variables', 
    type: 'iconNode',
    position: { x: 50, y: 200 }, 
    data: { 
      icon: Cloud,
      label: 'Variables',
      description: 'project_name\naws_region\nstage_name',
      color: '#0ea5e9',
      bgColor: '#f0f9ff'
    }
  },
  { 
    id: 'tf-iam-role', 
    type: 'iconNode',
    position: { x: 300, y: 100 }, 
    data: { 
      icon: Shield,
      label: 'IAM Role',
      description: 'lambda_execution_role\nBasic Execution Policy',
      color: '#9333ea',
      bgColor: '#f3e8ff'
    }
  },
  { 
    id: 'tf-iam-policy', 
    type: 'iconNode',
    position: { x: 300, y: 300 }, 
    data: { 
      icon: Shield,
      label: 'IAM Policy',
      description: 'DynamoDB Permissions\nAPI Gateway Permissions',
      color: '#9333ea',
      bgColor: '#f3e8ff'
    }
  },
  { 
    id: 'tf-dynamodb-connections', 
    type: 'iconNode',
    position: { x: 600, y: 50 }, 
    data: { 
      icon: Database,
      label: 'Connections Table',
      description: 'DynamoDB\nPK: connectionId',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'tf-dynamodb-messages', 
    type: 'iconNode',
    position: { x: 600, y: 150 }, 
    data: { 
      icon: Database,
      label: 'Messages Table',
      description: 'DynamoDB\nPK: messageId\nSK: timestamp',
      color: '#16a34a',
      bgColor: '#dcfce7'
    }
  },
  { 
    id: 'tf-lambda-onconnect', 
    type: 'iconNode',
    position: { x: 600, y: 250 }, 
    data: { 
      icon: Zap,
      label: 'onConnect',
      description: 'Lambda Function\nDepends on: IAM Role\nEnv: CONNECTIONS_TABLE',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'tf-lambda-sendmessage', 
    type: 'iconNode',
    position: { x: 600, y: 350 }, 
    data: { 
      icon: Zap,
      label: 'sendMessage',
      description: 'Lambda Function\nDepends on: IAM Role\nEnv: CONNECTIONS_TABLE\nMESSAGES_TABLE',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'tf-lambda-ondisconnect', 
    type: 'iconNode',
    position: { x: 600, y: 450 }, 
    data: { 
      icon: Zap,
      label: 'onDisconnect',
      description: 'Lambda Function\nDepends on: IAM Role\nEnv: CONNECTIONS_TABLE',
      color: '#d97706',
      bgColor: '#fef3c7'
    }
  },
  { 
    id: 'tf-api-gateway', 
    type: 'iconNode',
    position: { x: 900, y: 200 }, 
    data: { 
      icon: Network,
      label: 'API Gateway',
      description: 'WebSocket API\nRoute Selection:\n$request.body.action',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'tf-api-stage', 
    type: 'iconNode',
    position: { x: 900, y: 300 }, 
    data: { 
      icon: Globe,
      label: 'API Stage',
      description: 'API Gateway Stage\nauto_deploy: true',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'tf-integrations', 
    type: 'iconNode',
    position: { x: 900, y: 400 }, 
    data: { 
      icon: Network,
      label: 'Integrations',
      description: 'Lambda Integrations\non_connect\nsend_message\non_disconnect',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'tf-routes', 
    type: 'iconNode',
    position: { x: 1200, y: 200 }, 
    data: { 
      icon: Network,
      label: 'Routes',
      description: 'API Routes\n$connect\n$disconnect\nsendMessage',
      color: '#2563eb',
      bgColor: '#dbeafe'
    }
  },
  { 
    id: 'tf-permissions', 
    type: 'iconNode',
    position: { x: 1200, y: 300 }, 
    data: { 
      icon: Shield,
      label: 'Permissions',
      description: 'Lambda Permissions\nAllow API Gateway\nto invoke Lambdas',
      color: '#9333ea',
      bgColor: '#f3e8ff'
    }
  },
]

const terraformEdges: Edge[] = [
  { id: 'tf-e1', source: 'tf-variables', target: 'tf-iam-role', label: 'uses', style: { stroke: '#0ea5e9' } },
  { id: 'tf-e2', source: 'tf-iam-role', target: 'tf-iam-policy', label: 'attached to', style: { stroke: '#9333ea' } },
  { id: 'tf-e3', source: 'tf-variables', target: 'tf-dynamodb-connections', label: 'uses', style: { stroke: '#0ea5e9' } },
  { id: 'tf-e4', source: 'tf-variables', target: 'tf-dynamodb-messages', label: 'uses', style: { stroke: '#0ea5e9' } },
  { id: 'tf-e5', source: 'tf-iam-role', target: 'tf-lambda-onconnect', label: 'assumes', style: { stroke: '#9333ea', strokeDasharray: '5,5' } },
  { id: 'tf-e6', source: 'tf-iam-role', target: 'tf-lambda-sendmessage', label: 'assumes', style: { stroke: '#9333ea', strokeDasharray: '5,5' } },
  { id: 'tf-e7', source: 'tf-iam-role', target: 'tf-lambda-ondisconnect', label: 'assumes', style: { stroke: '#9333ea', strokeDasharray: '5,5' } },
  { id: 'tf-e8', source: 'tf-dynamodb-connections', target: 'tf-lambda-onconnect', label: 'env var', style: { stroke: '#16a34a', strokeDasharray: '3,3' } },
  { id: 'tf-e9', source: 'tf-dynamodb-connections', target: 'tf-lambda-sendmessage', label: 'env var', style: { stroke: '#16a34a', strokeDasharray: '3,3' } },
  { id: 'tf-e10', source: 'tf-dynamodb-messages', target: 'tf-lambda-sendmessage', label: 'env var', style: { stroke: '#16a34a', strokeDasharray: '3,3' } },
  { id: 'tf-e11', source: 'tf-dynamodb-connections', target: 'tf-lambda-ondisconnect', label: 'env var', style: { stroke: '#16a34a', strokeDasharray: '3,3' } },
  { id: 'tf-e12', source: 'tf-variables', target: 'tf-api-gateway', label: 'uses', style: { stroke: '#0ea5e9' } },
  { id: 'tf-e13', source: 'tf-api-gateway', target: 'tf-api-stage', label: 'has', style: { stroke: '#2563eb' } },
  { id: 'tf-e14', source: 'tf-lambda-onconnect', target: 'tf-integrations', label: 'integrated', style: { stroke: '#d97706' } },
  { id: 'tf-e15', source: 'tf-lambda-sendmessage', target: 'tf-integrations', label: 'integrated', style: { stroke: '#d97706' } },
  { id: 'tf-e16', source: 'tf-lambda-ondisconnect', target: 'tf-integrations', label: 'integrated', style: { stroke: '#d97706' } },
  { id: 'tf-e17', source: 'tf-api-gateway', target: 'tf-integrations', label: 'has', style: { stroke: '#2563eb' } },
  { id: 'tf-e18', source: 'tf-integrations', target: 'tf-routes', label: 'targeted by', style: { stroke: '#2563eb' } },
  { id: 'tf-e19', source: 'tf-api-gateway', target: 'tf-routes', label: 'has', style: { stroke: '#2563eb' } },
  { id: 'tf-e20', source: 'tf-lambda-onconnect', target: 'tf-permissions', label: 'needs', style: { stroke: '#d97706', strokeDasharray: '5,5' } },
  { id: 'tf-e21', source: 'tf-lambda-sendmessage', target: 'tf-permissions', label: 'needs', style: { stroke: '#d97706', strokeDasharray: '5,5' } },
  { id: 'tf-e22', source: 'tf-lambda-ondisconnect', target: 'tf-permissions', label: 'needs', style: { stroke: '#d97706', strokeDasharray: '5,5' } },
  { id: 'tf-e23', source: 'tf-api-gateway', target: 'tf-permissions', label: 'grants', style: { stroke: '#2563eb', strokeDasharray: '5,5' } },
]

export default function BehindTheScenesPage() {
  const [isDark, setIsDark] = useState(false)
  const [activeDiagram, setActiveDiagram] = useState<'infrastructure' | 'terraform'>('infrastructure')
  
  const [infraNodes, setInfraNodes, onInfraNodesChange] = useNodesState(infrastructureNodes)
  const [infraEdges, setInfraEdges, onInfraEdgesChange] = useEdgesState(infrastructureEdges)
  
  const [tfNodes, setTfNodes, onTfNodesChange] = useNodesState(terraformNodes)
  const [tfEdges, setTfEdges, onTfEdgesChange] = useEdgesState(terraformEdges)
  
  const currentNodes = activeDiagram === 'infrastructure' ? infraNodes : tfNodes
  const currentEdges = activeDiagram === 'infrastructure' ? infraEdges : tfEdges
  const onCurrentNodesChange = activeDiagram === 'infrastructure' ? onInfraNodesChange : onTfNodesChange
  const onCurrentEdgesChange = activeDiagram === 'infrastructure' ? onInfraEdgesChange : onTfEdgesChange
  const setCurrentEdges = activeDiagram === 'infrastructure' ? setInfraEdges : setTfEdges

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
    (params: Connection) => setCurrentEdges((eds) => addEdge(params, eds)),
    [setCurrentEdges]
  )

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
            <span className="font-semibold text-lg hidden sm:inline">Behind the Scenes</span>
            <span className="font-semibold text-lg sm:hidden">Behind Scenes</span>
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
            Behind the Scenes
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            How the site works - A technical deep dive
          </p>
        </div>

        {/* Diagram Selector */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setActiveDiagram('infrastructure')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'infrastructure'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              Infrastructure Architecture
            </button>
            <button
              onClick={() => setActiveDiagram('terraform')}
              className={`px-6 py-3 rounded-lg font-semibold transition-theme ${
                activeDiagram === 'terraform'
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card border border-border hover:bg-secondary'
              }`}
            >
              Terraform Dependencies
            </button>
          </div>
        </div>

        {/* React Flow Charts */}
        <div className="max-w-7xl mx-auto mb-12">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">
              {activeDiagram === 'infrastructure' 
                ? 'AWS Infrastructure Architecture' 
                : 'Terraform Resource Dependencies'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {activeDiagram === 'infrastructure' 
                ? 'Shows all AWS resources and their relationships in the deployed infrastructure'
                : 'Shows how Terraform resources depend on each other and the order of creation'}
            </p>
            <div className="h-[600px] w-full">
              <ReactFlow
                nodes={currentNodes}
                edges={currentEdges}
                nodeTypes={nodeTypes}
                onNodesChange={onCurrentNodesChange}
                onEdgesChange={onCurrentEdgesChange}
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
      </main>
    </div>
  )
}

