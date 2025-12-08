import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { FaGoogle, FaFacebook, FaLinkedin } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authenticateAdmin, setAdminSession } from "@/utils/authService";

export default function EnhancedLoginPage() {
  const [userType, setUserType] = useState<"member" | "admin">("member");
  const [adminCategory, setAdminCategory] = useState<"block" | "district" | "state" | "super">("block");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // Map admin category to role
  const getRoleFromCategory = (category: string): string => {
    switch (category) {
      case "block": return "block_admin";
      case "district": return "district_admin";
      case "state": return "state_admin";
      case "super": return "super_admin";
      default: return "member";
    }
  };

  // Get default credentials for each admin category
  const getDefaultCredentials = (category: string): { id: string, password: string } => {
    switch (category) {
      case "block":
        return { id: "block_admin_001", password: "block_pass_123" };
      case "district":
        return { id: "district_admin_001", password: "district_pass_123" };
      case "state":
        return { id: "state_admin_001", password: "state_pass_123" };
      case "super":
        return { id: "super_admin_001", password: "super_pass_123" };
      default:
        return { id: "", password: "" };
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Implement social login logic here
    console.log(`Logging in with ${provider}`);
    toast.info(`Social login with ${provider} would be implemented here`);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!identifier || !password) {
      toast.error("Please enter both ID and password");
      setIsLoading(false);
      return;
    }

    try {
      // For admin login, we use the authenticateAdmin function
      const result = await authenticateAdmin(identifier, password);
      
      if (result.success) {
        // Set admin session flags
        const role = getRoleFromCategory(adminCategory);
        setAdminSession(identifier, role, `${role.split('_')[0].charAt(0).toUpperCase() + role.split('_')[0].slice(1)} Admin ${identifier.split('_')[2]}`);
        
        toast.success("Login successful!");
        
        // Navigate to appropriate dashboard
        const adminPath = role === "block_admin" ? "/admin/block/dashboard" : "/admin/dashboard";
        navigate(adminPath);
      } else {
        toast.error("Invalid credentials");
      }
    } catch (err) {
      toast.error("Unable to reach backend. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Try backend login first
      try {
        const res = await fetch('http://localhost:4000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });

        if (res.ok) {
          const json = await res.json();
          const found = json.user;
          localStorage.setItem('userName', found.firstName || found.email || found.memberId);
          localStorage.setItem('memberId', found.memberId);
          if (found && found.role) localStorage.setItem('role', found.role);
          localStorage.setItem('isLoggedIn', 'true');
          
          const isAdmin = ['super_admin','state_admin','district_admin','block_admin'].includes(found.role);
          const adminPath = found.role === 'block_admin' ? '/admin/block/dashboard' : '/admin/dashboard';
          navigate(isAdmin ? adminPath : '/member/dashboard');
          return;
        }
      } catch (err) {
        // no backend â€” fallback to localStorage
      }

      const usersJson = localStorage.getItem('users');
      if (!usersJson) {
        toast.error('No registered users found. Please register first.');
        setIsLoading(false);
        return;
      }

      const users = JSON.parse(usersJson) as Array<any>;
      // allow login by email or memberId
      const found = users.find((u) => u.email === identifier || u.memberId === identifier);
      if (!found) {
        toast.error('No account matches that email or member ID');
        setIsLoading(false);
        return;
      }

      if (found.password !== password) {
        toast.error('Invalid credentials');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('userName', found.firstName || found.email || found.memberId);
      localStorage.setItem('memberId', found.memberId);
      if (found && found.role) localStorage.setItem('role', found.role);
      localStorage.setItem('isLoggedIn', 'true');
      
      const isAdminFallback = ['super_admin','state_admin','district_admin','block_admin'].includes(found.role);
      const adminPath = found.role === 'block_admin' ? '/admin/block/dashboard' : '/admin/dashboard';
      navigate(isAdminFallback ? adminPath : '/member/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Login failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  
  // Unified login: try admin auth first, then member flow
  const handleUnifiedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!identifier || !password) {
      toast.error('Please enter both ID and password');
      setIsLoading(false);
      return;
    }
    try {
      // Attempt admin authentication (supports IDs like block_admin_001)
      try {
        const adminAuth = await authenticateAdmin(identifier, password);
        if (adminAuth.success) {
          const role = (adminAuth.role as string) || '';
          const label = (role.split('_')[0] || 'Admin');
          setAdminSession(
            identifier,
            role || 'member',
            `${label.charAt(0).toUpperCase() + label.slice(1)} Admin`
          );
          const adminPath = role === 'block_admin' ? '/admin/block/dashboard' : '/admin/dashboard';
          navigate(adminPath);
          toast.success('Login successful!');
          return;
        }
      } catch {}

      // Member/backend authentication
      try {
        const res = await fetch('http://localhost:4000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password }),
        });
        if (res.ok) {
          const json = await res.json();
          const found = json.user;
          localStorage.setItem('userName', found.firstName || found.email || found.memberId);
          localStorage.setItem('memberId', found.memberId);
          const role = (typeof found.role === 'string' && found.role) || '';
          localStorage.setItem('role', role || 'member');
          localStorage.setItem('isLoggedIn', 'true');
          const isAdmin = ['super_admin','state_admin','district_admin','block_admin'].includes(role);
          const adminPath = role === 'block_admin' ? '/admin/block/dashboard' : '/admin/dashboard';
          navigate(isAdmin ? adminPath : '/member/dashboard');
          return;
        }
      } catch {}

      // Local users fallback
      const usersJson = localStorage.getItem('users');
      if (!usersJson) {
        toast.error('No registered users found. Please register first.');
        setIsLoading(false);
        return;
      }
      const users = JSON.parse(usersJson) as Array<any>;
      const found = users.find((u) => u.email === identifier || u.memberId === identifier);
      if (!found) {
        toast.error('No account matches that email or member ID');
        setIsLoading(false);
        return;
      }
      if (found.password !== password) {
        toast.error('Invalid credentials');
        setIsLoading(false);
        return;
      }
      localStorage.setItem('userName', found.firstName || found.email || found.memberId);
      localStorage.setItem('memberId', found.memberId);
      const role = (typeof found.role === 'string' && found.role) || '';
      localStorage.setItem('role', role || 'member');
      localStorage.setItem('isLoggedIn', 'true');
      const isAdminFallback = ['super_admin','state_admin','district_admin','block_admin'].includes(role);
      const adminPath = role === 'block_admin' ? '/admin/block/dashboard' : '/admin/dashboard';
      navigate(isAdminFallback ? adminPath : '/member/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Login failed. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // if already logged in, redirect to dashboard
  useEffect(() => {
    const logged = localStorage.getItem('isLoggedIn');
    if (logged === 'true') {
      const role = localStorage.getItem('role') || '';
      const adminPath = role === 'block_admin' ? '/admin/block/dashboard' : '/admin/dashboard';
      navigate(role.endsWith('_admin') ? adminPath : '/member/dashboard');
    }
  }, [navigate]);

  // Fill default credentials when admin category changes
  useEffect(() => {
    if (userType === "admin") {
      const creds = getDefaultCredentials(adminCategory);
      setIdentifier(creds.id);
      setPassword(creds.password);
    }
  }, [adminCategory, userType]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6 bg-white/95 backdrop-blur shadow-xl rounded-2xl">
        <div className="text-center space-y-2">
          <div className="inline-block p-2 rounded-full bg-blue-100 mb-2">
            <img
              src="/placeholder.svg"
              alt="Logo"
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ACTIV Portal</h1>
          <p className="text-gray-500">Sign in to your account or create a new one</p>
        </div>
        
        <div className="space-y-4">
          

          {userType === "admin" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-category">Admin Category</Label>
                <Select value={adminCategory} onValueChange={(value: "block" | "district" | "state" | "super") => setAdminCategory(value)}>
                  <SelectTrigger id="admin-category">
                    <SelectValue placeholder="Select admin category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block Admin</SelectItem>
                    <SelectItem value="district">District Admin</SelectItem>
                    <SelectItem value="state">State Admin</SelectItem>
                    <SelectItem value="super">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Default Credentials:</strong> {getDefaultCredentials(adminCategory).id} / {getDefaultCredentials(adminCategory).password}
                </p>
              </div>
            </div>
          )}

          {/* Social Media Login Buttons */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="w-full hover:bg-transparent"
                onClick={() => handleSocialLogin("Google")}
              >
                <FaGoogle className="w-5 h-5 text-red-500" />
              </Button>
              <Button
                variant="outline"
                className="w-full hover:bg-transparent"
                onClick={() => handleSocialLogin("Facebook")}
              >
                <FaFacebook className="w-5 h-5 text-blue-600" />
              </Button>
              <Button
                variant="outline"
                className="w-full hover:bg-transparent"
                onClick={() => handleSocialLogin("LinkedIn")}
              >
                <FaLinkedin className="w-5 h-5 text-blue-700" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUnifiedSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Enter email or ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-500">
                Forget Password?
              </a>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:text-blue-500">
            Register as member
          </a>
        </div>
      </Card>
    </div>
  );
}


