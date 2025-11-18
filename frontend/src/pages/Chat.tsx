import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MorphingAvatar from "@/components/MorphingAvatar";
import MorphingMessageBubble from "@/components/MorphingMessageBubble";

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
}

const Chat = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [username, setUsername] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const usernameFromState = location.state?.username;
    if (!usernameFromState) {
      navigate("/");
      return;
    }
    setUsername(usernameFromState);

    // Simulate WebSocket connection (replace with actual WebSocket URL)
    // ws.current = new WebSocket('wss://your-api-gateway-url');
    
    // Mock connection for demo
    setTimeout(() => {
      setIsConnected(true);
      toast({
        title: "Connected",
        description: "You're now connected to the chat",
      });
    }, 500);

    // Mock viewer count updates
    const viewerInterval = setInterval(() => {
      setViewerCount(Math.floor(Math.random() * 50) + 1);
    }, 10000);

    return () => {
      clearInterval(viewerInterval);
      ws.current?.close();
    };
  }, [location.state, navigate, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      username,
      text: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");

    // Here you would send via WebSocket:
    // ws.current?.send(JSON.stringify(newMessage));

    toast({
      title: "Message sent",
      description: "Your message has been broadcast",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Broadcast Chat</h1>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse-glow`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 text-base font-semibold bg-gradient-primary text-white rounded-2xl animate-morph-slow">
              <Users className="h-4 w-4" />
              {viewerCount} watching
            </Badge>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 container px-8 py-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
              <div className="rounded-full bg-gradient-primary p-6 mb-6">
                <Wifi className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Welcome to the chat!</h2>
              <p className="text-muted-foreground text-center max-w-md">
                Start the conversation. Your messages will be broadcast to all connected users.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <MorphingMessageBubble
                key={message.id}
                username={message.username}
                message={message.text}
                timestamp={message.timestamp}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div className="sticky bottom-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container px-8 py-6">
          <div className="max-w-4xl mx-auto">
            {isTyping && (
              <div className="mb-3 text-sm text-muted-foreground animate-pulse">
                Someone is typing...
              </div>
            )}
            <div className="flex gap-4">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 h-14 px-6 text-base border-2 rounded-2xl shadow-sm focus:shadow-md focus:border-primary transition-all duration-300"
              />
              <Button
                onClick={sendMessage}
                variant="gradient"
                size="lg"
                className="px-8 rounded-2xl hover:scale-105 transition-transform duration-300"
                disabled={!inputMessage.trim()}
              >
                <Send className="h-5 w-5 mr-2" />
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
