import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";
import { toast } from "sonner";
import { authenticateAdmin, setAdminSession, isAdminIdForRole } from "@/utils/authService";

const DistrictLogin = () => {
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId || !password) {
      toast.error("Please enter both ID and password");
      return;
    }

    try {
      const result = await authenticateAdmin(memberId, password);
      
      if (result.success) {
        // Check if this admin ID is authorized for district admin role
        if (result.role === "district_admin" || isAdminIdForRole(memberId, "district_admin")) {
          // Set admin session flags
          setAdminSession(memberId, "district_admin", `District Admin ${memberId.split('_')[2]}`);
          
          toast.success("Login successful!");
          navigate("/admin/dashboard");
        } else {
          toast.error("Access denied. This account is not authorized for District Admin access.");
        }
      } else {
        toast.error("Invalid credentials");
      }
    } catch (err) {
      toast.error("Unable to reach backend. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong gradient-card border-0">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-2">
            <Shield className="w-10 h-10 text-secondary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">District Admin Login</CardTitle>
          <CardDescription>Access District Administrator Portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="memberId">District Admin ID</Label>
              <Input
                id="memberId"
                placeholder="Enter your district admin ID"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" variant="default">
              <Lock className="w-4 h-4 mr-2" />
              Login as District Admin
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Default Credentials:</h3>
            <ul className="text-xs space-y-1">
              <li>district_admin_001 / district_pass_123</li>
              <li>district_admin_002 / district_secure_456</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DistrictLogin;