import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Lock } from "lucide-react";
import { toast } from "sonner";

const MemberLogin = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<{ memberId: string; password: string }>({ mode: 'onBlur' });

  const handleLogin = async (data: { memberId: string; password: string }) => {
    try {
      // try backend auth first
      try {
        const res = await fetch('http://localhost:4000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: data.memberId, password: data.password }),
        });

        if (res.ok) {
          const json = await res.json();
          const found = json.user;

          // Persist full profile returned by backend so UI can consume it
          try {
            localStorage.setItem('userProfile', JSON.stringify(found));
            // keep registrationData key for compatibility where backend sends the same shape
            localStorage.setItem('registrationData', JSON.stringify(found));
          } catch (e) {
            // ignore storage errors
          }

          localStorage.setItem('userName', found.firstName || found.email || found.memberId);
          localStorage.setItem('memberId', found.memberId);
          localStorage.setItem('isLoggedIn', 'true');
          navigate('/member/dashboard');
          return;
        }
      } catch (err) {
        // ignore and fall back to localStorage
      }

      const usersJson = localStorage.getItem("users");
      if (!usersJson) {
        toast.error("No registered users found. Please register first.");
        return;
      }

      const users = JSON.parse(usersJson) as Array<any>;
      const found = users.find((u) => u.memberId === data.memberId);
      if (!found) {
        toast.error("No account found with that Member ID");
        return;
      }

      if (found.password !== data.password) {
        toast.error("Invalid credentials");
        return;
      }

      // Persist any available profile data to `userProfile` / `registrationData`
      try {
        // if there is a detailed registrationData stored and it belongs to this member, use that
        const regJson = localStorage.getItem('registrationData');
        if (regJson) {
          try {
            const reg = JSON.parse(regJson);
            if (reg.memberId === found.memberId) {
              localStorage.setItem('userProfile', JSON.stringify(reg));
            } else {
              localStorage.setItem('userProfile', JSON.stringify(found));
            }
          } catch (e) {
            localStorage.setItem('userProfile', JSON.stringify(found));
          }
        } else {
          localStorage.setItem('userProfile', JSON.stringify(found));
        }

        // Also keep a registrationData key (compatibility)
        localStorage.setItem('registrationData', JSON.stringify(found));
      } catch (e) {
        // ignore
      }

      // Set logged-in session info
      localStorage.setItem("userName", found.firstName || found.email || found.memberId);
      localStorage.setItem("memberId", found.memberId);
      localStorage.setItem("isLoggedIn", "true");
      navigate("/member/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Login failed. Please try again later.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-strong gradient-card border-0">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
            <UserCircle className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">Member Login</CardTitle>
          <CardDescription>Access your VJS member portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="memberId">Member ID</Label>
              <Input id="memberId" placeholder="Enter your member ID" {...register('memberId', { required: 'Member ID is required' })} />
              {errors.memberId && <p className="text-xs text-red-600 mt-1">{errors.memberId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" {...register('password', { required: 'Password is required' })} />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end">
              <Link to="/member/forgot-password" className="text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>
            <Button type="submit" className="w-full" size="lg">
              <Lock className="w-4 h-4 mr-2" />
              Login
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">New Member? </span>
              <Link to="/member/register" className="text-primary hover:underline font-medium">
                Register Here
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberLogin;
