import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu } from "lucide-react";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MobileMenu from "@/components/MobileMenu";
import { useNavigate } from "react-router-dom";

const MemberDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [latestApplication, setLatestApplication] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user name from localStorage (set during login/registration)
    const storedUserName = localStorage.getItem("userName");
    const hasVisitedBefore = localStorage.getItem("hasVisitedDashboard");

    if (storedUserName) {
      setUserName(storedUserName);
    }

    if (hasVisitedBefore) {
      setIsFirstVisit(false);
    } else {
      // Mark first visit as complete
      localStorage.setItem("hasVisitedDashboard", "true");
    }
  }, []);

  // Load latest application from backend (fallback to localStorage)
  useEffect(() => {
    const userId = localStorage.getItem("memberId");
    async function loadApplications() {
      let apps: any[] = [];
      // backend first
      if (userId) {
        try {
          const res = await fetch(`http://localhost:4000/api/users/${encodeURIComponent(userId)}/applications`);
          if (res.ok) {
            const data = await res.json();
            apps = Array.isArray(data.applications) ? data.applications : [];
          }
        } catch (_) {
          // ignore
        }
      }
      // fallback to local
      if (!apps.length) {
        try {
          apps = JSON.parse(localStorage.getItem('applications') || '[]');
        } catch (_) {
          apps = [];
        }
      }
      if (apps.length) {
        const sorted = [...apps].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setLatestApplication(sorted[0]);
      } else {
        setLatestApplication(null);
      }
    }
    loadApplications();
  }, []);

  const computeProfileCompletion = (): number => {
    // Combine the base profile and the additional user details (saved separately)
    const rawMain = localStorage.getItem("userProfile") || localStorage.getItem("registrationData");
    const rawExtra = localStorage.getItem("userProfileDetails");

    if (!rawMain && !rawExtra) return 0;

    let main = {} as Record<string, any>;
    let extra = {} as Record<string, any>;

    try {
      if (rawMain) main = JSON.parse(rawMain);
    } catch (e) {
      main = {} as any;
    }

    try {
      if (rawExtra) extra = JSON.parse(rawExtra);
    } catch (e) {
      extra = {} as any;
    }

    // Fields to consider for completion percentage
    const fields = [
      main.firstName,
      main.lastName,
      main.email,
      main.phone,
      main.dateOfBirth,
      main.gender,
      main.state,
      main.district,
      main.block,
      main.address,

      // extra details
      extra.aadhaar,
      extra.street,
      extra.education,
      extra.religion,
      extra.socialCategory,

      extra.organization,
      extra.constitution,
      (extra.businessType || []).length ? 'has' : '',
      extra.businessYear,
      extra.employees,

      extra.pan,
      extra.gst,
      extra.udyam,
      extra.filedITR,
      extra.itrYears,
      extra.turnover,
      extra.turnover1,
      extra.turnover2,
      extra.turnover3,

      extra.sisterConcerns,
      extra.companyNames,
      extra.declaration,
    ];

    const filled = fields.filter((f: any) => !!f && `${f}`.trim() !== "").length;
    return Math.round((filled / fields.length) * 100) || 0;
  };

  const completionPercentage = computeProfileCompletion();

  let business: any = {};
  try {
    const businessRaw = localStorage.getItem("userProfileDetails");
    business = businessRaw ? JSON.parse(businessRaw) : {};
  } catch (_) {
    business = {} as any;
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar for desktop */}
      <div className="hidden md:block w-16 lg:w-56">
        <Sidebar />
      </div>

      {/* Mobile menu */}
      <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header with menu button */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(true)}
            className="p-2"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Dashboard</h1>
          <Avatar className="w-10 h-10">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-primary text-primary-foreground">SD</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-auto bg-background">
          <div className="w-full max-w-6xl mx-auto">
            {/* Welcome section - adjusted for mobile */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold hidden md:block">
                {isFirstVisit ? "Welcome" : "Welcome back"}, {userName || "Member"}
              </h1>
              <div className="flex items-center gap-4 mt-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {userName ? userName.split(" ").map(n => n[0]).join("") : "SD"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold md:text-2xl">
                    {isFirstVisit ? "Welcome" : "Welcome back"}, {userName || "Member"}
                  </h2>
                  <p className="text-muted-foreground">TechCorp Solution</p>
                </div>
              </div>
            </div>

            {/* Search bar - improved mobile responsiveness */}
            <div className="mb-6">
              <div className="w-full">
                <input
                  aria-label="Search by location"
                  placeholder="Search by location..."
                  className="w-full border border-gray-200 rounded-full px-4 py-2 shadow-sm bg-white"
                />
              </div>
            </div>

            {/* Profile completion card - optimized spacing */}
            <Card className="shadow-medium border-0 w-full mb-6">
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Create Your Business Account</h3>
                    <div className="mt-2">
                      <span className="inline-block text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5">Start setup</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Set up your business account to unlock team features and payments.</p>
                    <div className="mt-4">
                      <Button className="bg-blue-600 text-white w-full md:w-auto" onClick={() => navigate('/member/business-profile')}>
                        Create Account
                      </Button>
                    </div>
                  </div>
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-50 rounded-lg flex items-center justify-center">
                    <img src="/assets/placeholder.svg" alt="briefcase" className="w-20 h-20 md:w-24 md:h-24" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Status Card */}            {/* Membership card and documents after membership */}
            {latestApplication?.payment?.status === 'Completed' && (
              <>
                <Card className="w-full mb-6 border-0 shadow-medium bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold bg-white/20 rounded-full px-2 py-0.5">{(latestApplication.payment.plan || 'annual').toString().toUpperCase()}</span>
                          <span className="text-xs font-semibold bg-green-500 rounded-full px-2 py-0.5">Active</span>
                        </div>
                        <div className="text-sm opacity-90">Member since</div>
                        <div className="text-xl font-bold">
                          {latestApplication.payment.paidAt ? new Date(latestApplication.payment.paidAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                        </div>
                        <div className="text-sm mt-1 opacity-90">Member ID: <span className="font-semibold">{latestApplication.id}</span></div>
                      </div>
                      <div className="hidden md:block w-10 h-10 rounded-full bg-white/30" />
                    </div>
                  </CardContent>
                </Card>

                <div className="mb-3">
                  <h3 className="text-xl font-semibold">Official Documents</h3>
                  <p className="text-sm text-muted-foreground">Access and download essential documents related to your account</p>
                </div>

                <div className="space-y-3 mb-6">
                  <button
                    className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-blue-100 text-blue-900"
                    onClick={() => navigate('/member/certificate')}
                  >
                    <span className="font-medium">Download Membership Certificate</span>
                    <span>⬇️</span>
                  </button>
                  <button
                    className="w-full flex items-center justify-between px-4 py-4 rounded-xl bg-green-100 text-green-900"
                    onClick={() => {
                      const blob = new Blob([`Tax Exemption CertificateMember: ${userName || 'Member'}Member ID: ${latestApplication.id}Date: ${new Date().toLocaleDateString()}`], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `Tax-Exemption-${latestApplication.id}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    <span className="font-medium">Download Tax Exemption Certificate</span>
                    <span>⬇️</span>
                  </button>
                </div>
              </>
            )}

            {/* Quick actions grid - mobile optimized (single set, clickable) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* Removed ADF Form, Certificate, Help Center, Events cards */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;


