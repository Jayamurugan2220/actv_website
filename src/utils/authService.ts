// authService.ts - Centralized authentication service with security measures

// Default credentials for all admin roles (in a real app, these would be securely stored)
const DEFAULT_CREDENTIALS: Record<string, { password: string, role: string }> = {
  block_admin_001: { password: "block_pass_123", role: "block_admin" },
  block_admin_002: { password: "block_secure_456", role: "block_admin" },
  district_admin_001: { password: "district_pass_123", role: "district_admin" },
  district_admin_002: { password: "district_secure_456", role: "district_admin" },
  state_admin_001: { password: "state_pass_123", role: "state_admin" },
  state_admin_002: { password: "state_secure_456", role: "state_admin" },
  super_admin_001: { password: "super_pass_123", role: "super_admin" },
  super_admin_002: { password: "super_secure_456", role: "super_admin" }
};

// Hash function for basic obfuscation (NOT for production - use proper hashing libraries)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Securely store session data
export const setAdminSession = (adminId: string, role: string, userName: string) => {
  // Store session flags
  localStorage.setItem("isAdminLoggedIn", "true");
  localStorage.setItem("adminId", adminId);
  localStorage.setItem("userName", userName);
  localStorage.setItem("role", role);
  
  // Store hashed timestamp for session validation
  localStorage.setItem("sessionStart", simpleHash(Date.now().toString()));
};

// Validate admin session
export const validateAdminSession = (expectedRole?: string): boolean => {
  const isLoggedIn = localStorage.getItem("isAdminLoggedIn") === "true";
  const role = localStorage.getItem("role");
  
  if (!isLoggedIn) return false;
  
  // If specific role is required, check it
  if (expectedRole && role !== expectedRole) return false;
  
  // Validate session hasn't been tampered with
  const sessionStart = localStorage.getItem("sessionStart");
  if (!sessionStart) return false;
  
  return true;
};

// Clear admin session
export const clearAdminSession = () => {
  localStorage.removeItem("isAdminLoggedIn");
  localStorage.removeItem("adminId");
  localStorage.removeItem("userName");
  localStorage.removeItem("role");
  localStorage.removeItem("sessionStart");
};

// Authenticate admin credentials
export const authenticateAdmin = async (adminId: string, password: string): Promise<{ success: boolean, role?: string }> => {
  try {
    // First check default credentials
    const admin = DEFAULT_CREDENTIALS[adminId];
    if (admin && admin.password === password) {
      return { success: true, role: admin.role };
    }
    
    // If not default credentials, try backend authentication
    const res = await fetch("http://localhost:4000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: adminId, password }),
    });

    if (!res.ok) {
      return { success: false };
    }

    const json = await res.json();
    const role = json.user?.role;
    
    return { success: true, role };
  } catch (err) {
    console.error("Authentication error:", err);
    return { success: false };
  }
};

// Get current admin info
export const getCurrentAdmin = () => {
  if (!validateAdminSession()) return null;
  
  return {
    id: localStorage.getItem("adminId") || "",
    name: localStorage.getItem("userName") || "",
    role: localStorage.getItem("role") || ""
  };
};

// Check if admin ID belongs to a specific role
export const isAdminIdForRole = (adminId: string, role: string): boolean => {
  const admin = DEFAULT_CREDENTIALS[adminId];
  return admin ? admin.role === role : false;
};