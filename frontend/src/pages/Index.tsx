import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import MorphingShapes from "@/components/MorphingShapes";

const Index = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  const handleJoinChat = () => {
    if (username.trim()) {
      navigate("/chat", { state: { username: username.trim() } });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-radial opacity-50 animate-gradient-shift" style={{ backgroundSize: "200% 200%" }} />
      
      {/* Morphing Shapes Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
        <MorphingShapes className="scale-150" />
      </div>
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="container px-8 pt-32 pb-24">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="mb-8 inline-block">
              <div className="rounded-full bg-gradient-primary p-4 shadow-xl">
                <MessageSquare className="h-16 w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-primary">
              Broadcast Chat
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Connect instantly. Share your thoughts with everyone in real-time.
            </p>

            {/* Username Input Card */}
            <Card className="max-w-md mx-auto p-8 shadow-xl animate-scale-in rounded-2xl border-2">
              <div className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-sm font-semibold mb-3 text-left">
                    Choose your username
                  </label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleJoinChat()}
                    placeholder="Enter your name..."
                    className="h-14 px-6 text-lg border-2 rounded-xl"
                  />
                </div>
                
                <Button
                  onClick={handleJoinChat}
                  variant="gradient"
                  size="lg"
                  disabled={!username.trim()}
                  className="w-full text-lg"
                >
                  Join Chat
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Index;
