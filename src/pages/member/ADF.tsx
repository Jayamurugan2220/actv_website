import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Menu, FileText, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import MobileMenu from "@/components/MobileMenu";
import { INDIA_DISTRICTS } from "@/data/india-districts";

interface ADFFormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  state: string;
  district: string;
  block: string;
  address: string;
  qualifications: string;
  experience: string;
  sector: string;
  objectives: string;
}

const ADFForm = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState<ADFFormData>({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    state: "",
    district: "",
    block: "",
    address: "",
    qualifications: "",
    experience: "",
    sector: "",
    objectives: "",
  });

  const [status, setStatus] = useState<"draft" | "submitted" | "approved" | "rejected">("draft");
  const [submittedDate, setSubmittedDate] = useState<string>("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(true);

  // Load existing ADF data from localStorage; if none, prefill from registration/profile
  useEffect(() => {
    const savedADF = localStorage.getItem("adfFormData");
    if (savedADF) {
      try {
        const parsed = JSON.parse(savedADF);
        setFormData(parsed.data);
        setStatus(parsed.status || "draft");
        setSubmittedDate(parsed.submittedDate || "");
        setIsEditing(parsed.status === "draft");
        // initialize districts if state present
        if (parsed.data?.state && INDIA_DISTRICTS[parsed.data.state]) {
          setDistricts(INDIA_DISTRICTS[parsed.data.state]);
        }
        return;
      } catch (error) {
        // ignore and try to prefill from profile below
      }
    }

    // No saved ADF — prefill from registrationData or userProfile
    try {
      const regJson = localStorage.getItem('userProfile') || localStorage.getItem('registrationData');
      if (regJson) {
        const reg = JSON.parse(regJson);
        const prefilled: ADFFormData = {
          fullName: reg.firstName && reg.lastName ? `${reg.firstName} ${reg.lastName}` : (reg.firstName || reg.fullName || ""),
          email: reg.email || "",
          phone: reg.mobile || reg.phone || "",
          dateOfBirth: reg.dob || reg.dateOfBirth || "",
          state: reg.state || reg.stateName || "",
          district: reg.district || reg.districtName || "",
          block: reg.block || "",
          address: reg.address || "",
          qualifications: "",
          experience: "",
          sector: "",
          objectives: "",
        };
        setFormData(prefilled);
        if (prefilled.state && INDIA_DISTRICTS[prefilled.state]) {
          setDistricts(INDIA_DISTRICTS[prefilled.state]);
        }
      }
    } catch (e) {
      // ignore prefill errors
    }
  }, []);

  const handleStateChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      state: value,
      district: "",
    }));
    setDistricts(INDIA_DISTRICTS[value] || []);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.state ||
      !formData.district ||
      !formData.block ||
      !formData.address
    ) {
      toast.error("Please fill in all required fields");
      return false;
    }
    return true;
  };

  const handleSaveDraft = () => {
    localStorage.setItem(
      "adfFormData",
      JSON.stringify({
        data: formData,
        status: "draft",
        savedDate: new Date().toISOString(),
      })
    );
    toast.success("Draft saved successfully");
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const submissionData = {
      data: formData,
      status: "submitted",
      submittedDate: new Date().toISOString(),
      submittedBy: localStorage.getItem("userName") || "User",
    };

    localStorage.setItem("adfFormData", JSON.stringify(submissionData));
    setStatus("submitted");
    setSubmittedDate(new Date().toLocaleDateString());
    setIsEditing(false);
    toast.success("ADF Form submitted successfully!");
  };

  const handleEdit = () => {
    setIsEditing(true);
    setStatus("draft");
  };

  const getStatusColor = (st: string) => {
    switch (st) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (st: string) => {
    switch (st) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <FileText className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

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
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">ADF Form</h1>
          <div className="w-10" />
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto bg-background">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>ADF Form Submission</CardTitle>
                    <CardDescription>Application Development Form</CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(status)} flex items-center gap-2`}>
                    {getStatusIcon(status)}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {submittedDate && (
                  <p className="text-sm text-muted-foreground">
                    Submitted on: <span className="font-medium">{submittedDate}</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Form Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Enter your details below</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-6">
                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name*</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth*</Label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address*</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number*</Label>
                      <Input
                        id="phone"
                        name="phone"
                        placeholder="+91 XXXXXXXXXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Location Information</h3>

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State*</Label>
                        <Select value={formData.state} onValueChange={handleStateChange} disabled={!isEditing}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(INDIA_DISTRICTS).map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="district">District*</Label>
                        <Select
                          value={formData.district}
                          onValueChange={(value) => handleSelectChange("district", value)}
                          disabled={!isEditing || !formData.state}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                          <SelectContent>
                            {districts.map((district) => (
                              <SelectItem key={district} value={district}>
                                {district}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="block">Block*</Label>
                        <Select value={formData.block || ''} onValueChange={(v: string) => handleSelectChange('block', v)} disabled={!isEditing}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select block" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="block1">Block 1</SelectItem>
                            <SelectItem value="block2">Block 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Complete Address*</Label>
                        <Input
                          id="address"
                          name="address"
                          placeholder="Enter full address"
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Professional Information</h3>

                    {/* Row 5 */}
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="qualifications">Educational Qualifications</Label>
                      <Textarea
                        id="qualifications"
                        name="qualifications"
                        placeholder="List your educational qualifications"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>

                    {/* Row 6 */}
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="experience">Work Experience (in years)</Label>
                      <Input
                        id="experience"
                        name="experience"
                        placeholder="e.g., 5 years"
                        value={formData.experience}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Row 7 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="sector">Sector</Label>
                        <Select
                          value={formData.sector}
                          onValueChange={(value) => handleSelectChange("sector", value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                            <SelectItem value="healthcare">Healthcare</SelectItem>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="technology">Technology</SelectItem>
                            <SelectItem value="finance">Finance</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Row 8 */}
                    <div className="space-y-2">
                      <Label htmlFor="objectives">Learning Objectives</Label>
                      <Textarea
                        id="objectives"
                        name="objectives"
                        placeholder="What are your goals for this program?"
                        value={formData.objectives}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6 border-t">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={handleSaveDraft}>
                          Save as Draft
                        </Button>
                        <Button onClick={handleSubmit} className="bg-blue-600 text-white">
                          Submit ADF Form
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleEdit}>Edit Form</Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ADFForm;
