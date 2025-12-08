import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Menu, Save, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import MobileMenu from "@/components/MobileMenu";
import { INDIA_DISTRICTS } from "@/data/india-districts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfileData = {
  firstName: string;
  middleName?: string;
  lastName?: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
  state?: string;
  district?: string;
  block?: string;
  address?: string;
};

const defaultProfile: ProfileData = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  state: "",
  district: "",
  block: "",
  address: "",
};

export default function MemberProfile() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [districts, setDistricts] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [extra, setExtra] = useState<Record<string, any>>({});

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileData>({ defaultValues: defaultProfile });

  // initialize form (load from localStorage if exists)
  useEffect(() => {
    const saved = localStorage.getItem("userProfile") || localStorage.getItem("registrationData");
    if (saved) {
      try {
        const obj = JSON.parse(saved);
        reset({ ...defaultProfile, ...obj });
      } catch (e) {
        reset(defaultProfile);
      }
    } else {
      reset(defaultProfile);
    }
  }, [reset]);

  const selectedState = watch("state");
  useEffect(() => {
    if (selectedState) setDistricts(INDIA_DISTRICTS[selectedState] ?? []);
    else setDistricts([]);
  }, [selectedState]);

  // We're switching the profile page into a multi-step additional-details form
  // The completion percentage will be computed from both existing profile fields
  // and the additional details we capture below.

  const getCompletionPercentage = (values: ProfileData) => {
    const fields = [
      values.firstName,
      values.lastName,
      values.email,
      values.phone,
      values.dateOfBirth,
      values.gender,
      values.state,
      values.district,
      values.block,
      values.address,
    ];
    const filled = fields.filter((v) => !!v && `${v}`.trim() !== "").length;
    return Math.round((filled / fields.length) * 100) || 0;
  };

  const onSave = (data: ProfileData) => {
    if (!data.firstName || !data.email || !data.phone || !data.state || !data.district) {
      toast.error("Please fill in required fields before saving.");
      return;
    }

    localStorage.setItem("userProfile", JSON.stringify(data));
    localStorage.setItem("userName", `${data.firstName} ${data.lastName ?? ""}`.trim());
    localStorage.setItem("registrationData", JSON.stringify(data));

    // try to persist core profile in backend as well
    const userId = localStorage.getItem("memberId");
    if (userId) {
      fetch("http://localhost:4000/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          state: data.state,
          district: data.district,
          block: data.block,
          address: data.address,
        }),
      }).catch(() => {/* ignore backend errors */});
    }

    setIsEditing(false);
    toast.success("Profile saved successfully");
  };

  const onCancel = () => {
    const saved = localStorage.getItem("userProfile") || localStorage.getItem("registrationData");
    if (saved) reset(JSON.parse(saved));
    else reset(defaultProfile);
    setIsEditing(false);
  };

  const currentValues = watch();
  const completion = getCompletionPercentage(currentValues);

  // Load extra details from localStorage when the component mounts
  useEffect(() => {
    const saved = localStorage.getItem("userProfileDetails");
    if (saved) {
      try {
        setExtra(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleExtraChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    setExtra((prev) => ({ ...prev, [name]: value }));
  };

  const navigate = useNavigate();

  function generateApplicationId(): string {
    // Format: APP-YYYY-XXX — where XXX is a sequential number stored in localStorage
    const year = new Date().getFullYear();
    const key = `application-seq-${year}`;
    const seq = Number(localStorage.getItem(key) || 0) + 1;
    localStorage.setItem(key, String(seq));
    return `APP-${year}-${String(seq).padStart(3, '0')}`;
  }

  const saveExtra = async () => {
    localStorage.setItem("userProfileDetails", JSON.stringify(extra));
    const userId = localStorage.getItem("memberId");

    if (!userId) {
      toast.error("User not logged in");
      return;
    }

    // Try to save additional details to backend
    try {
      const response = await fetch("http://localhost:4000/api/profile/additional-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, details: extra }),
      });
      if (!response.ok) {
        console.warn("Backend save failed, continuing with localStorage");
      }
    } catch (e) {
      console.warn("Backend unavailable, continuing with localStorage", e);
    }

    // create an application record on backend; fall back to local id if needed
    let appId = '';
    const profileSnapshot = JSON.parse(localStorage.getItem('userProfile') || '{}');
    try {
      const resp = await fetch("http://localhost:4000/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, profileSnapshot, detailsSnapshot: extra }),
      });
      if (resp.ok) {
        const data = await resp.json();
        appId = data?.application?.id || '';
      }
    } catch (e) {
      // ignore and fallback
    }

    if (!appId) appId = generateApplicationId();

    const stages = [
      { id: 1, key: 'block', title: 'Block Admin Review', reviewer: 'Rajesh Kumar (Block Admin)', status: 'Under Review', reviewDate: null, notes: '' },
      { id: 2, key: 'district', title: 'District Admin Review', reviewer: 'Priya Sharma (District Admin)', status: 'Pending', reviewDate: null, notes: '' },
      { id: 3, key: 'state', title: 'State Admin Review', reviewer: 'Dr. Amit Patel (State Admin)', status: 'Pending', reviewDate: null, notes: '' },
      { id: 4, key: 'payment', title: 'Ready for Payment', reviewer: 'ACTIV Super Admin', status: 'Pending', reviewDate: null, notes: '' },
    ];

    const app = {
      id: appId,
      submittedAt: new Date().toISOString(),
      status: 'Under Review',
      stage: 1,
      stages,
      profile: {
        profile: profileSnapshot,
        extra: extra,
      }
    };

    try {
      const appsJson = localStorage.getItem('applications') || '[]';
      const apps = JSON.parse(appsJson);
      apps.push(app);
      localStorage.setItem('applications', JSON.stringify(apps));
    } catch (e) {
      localStorage.setItem('applications', JSON.stringify([app]));
    }

    toast.success("Additional details saved");

    // navigate to submitted confirmation page and pass id via query param
    navigate(`/member/application-submitted?id=${encodeURIComponent(appId)}`);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:block w-16 lg:w-56">
        <Sidebar />
      </div>

      <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col">
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="p-2">
            <Menu className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">My Profile</h1>
          <div className="w-10" />
        </div>

        <div className="flex-1 p-4 md:p-6 overflow-auto bg-background">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">My Profile</h1>
                <p className="text-muted-foreground">Manage your personal information</p>
              </div>

              <div className="hidden md:block">
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={onCancel}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSubmit(onSave)} className="bg-blue-600 text-white">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Profile Completion</p>
                    <p className="text-sm font-semibold text-blue-600">{completion}%</p>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${completion}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Details multi-step form (4 steps) */}
            <div>
              <div className="mb-6 text-center">
                <h2 className="text-xl font-bold">Additional Details Form</h2>
                <p className="text-sm text-muted-foreground">Member Registration</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center ${step === s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Step {step} of 4</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <form onSubmit={(e) => { e.preventDefault(); if (step < 4) nextStep(); else { saveExtra(); } }}>
                    {step === 1 && (
                      <div>
                        <h3 className="font-semibold mb-4">Personal details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input className="border border-black" disabled value={watch('firstName') ? `${watch('firstName')} ${watch('lastName') ?? ''}` : ''} />
                          </div>
                          <div>
                            <Label>Block</Label>
                            <Input className="border border-black" disabled value={watch('block') || ''} />
                          </div>
                          <div>
                            <Label>City</Label>
                            <Input className="border border-black" disabled value={watch('district') || ''} />
                          </div>
                          <div>
                            <Label>District</Label>
                            <Input className="border border-black" disabled value={watch('district') || ''} />
                          </div>
                          <div>
                            <Label>Phone Number</Label>
                            <Input className="border border-black" disabled value={watch('phone') || ''} />
                          </div>
                          <div>
                            <Label>Email ID</Label>
                            <Input className="border border-black" disabled value={watch('email') || ''} />
                          </div>
                          <div>
                            <Label>Date of Birth</Label>
                            <Input className="border border-black" disabled value={watch('dateOfBirth') || ''} />
                          </div>
                        </div>

                        <div className="mt-6 bg-gray-50 border rounded p-4">
                          <h4 className="font-medium mb-3">Page 1 - Personal & Demographic Details</h4>
                          <div className="grid grid-cols-1 gap-3">
                            <div>
                              <Label>Aadhaar No. (Personal Identity No.)</Label>
                              <Input className="border border-black" name="aadhaar" value={extra.aadhaar || ''} onChange={handleExtraChange} />
                            </div>
                            <div>
                              <Label>Street Name</Label>
                              <Input className="border border-black" name="street" value={extra.street || ''} onChange={handleExtraChange} />
                            </div>
                            <div>
                              <Label>Educational Qualification</Label>
                              <Input className="border border-black" name="education" value={extra.education || ''} onChange={handleExtraChange} />
                            </div>
                            <div>
                              <Label>Religion</Label>
                              <Input className="border border-black" name="religion" value={extra.religion || ''} onChange={handleExtraChange} />
                            </div>
                            <div>
                              <Label>Social Category</Label>
                              <Input className="border border-black" name="socialCategory" value={extra.socialCategory || ''} onChange={handleExtraChange} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div>
                        <h3 className="font-semibold mb-4">Business Information</h3>
                        <div className="space-y-3">
                          <div>
                            <Label>Doing Business</Label>
                            <div className="flex gap-4 mt-2">
                              <label className="flex items-center gap-2"><input type="radio" name="doingBusiness" value="yes" checked={extra.doingBusiness === 'yes'} onChange={handleExtraChange} /> Yes</label>
                              <label className="flex items-center gap-2"><input type="radio" name="doingBusiness" value="no" checked={extra.doingBusiness === 'no'} onChange={handleExtraChange} /> No</label>
                            </div>
                          </div>

                          <div>
                            <Label>Name of the Organization</Label>
                            <Input name="organization" value={extra.organization || ''} onChange={handleExtraChange} />
                          </div>

                          <div>
                            <Label>Constitution of the Company</Label>
                            <select name="constitution" value={extra.constitution || ''} onChange={handleExtraChange} className="w-full border rounded p-2">
                              <option value="">Select constitution type</option>
                              <option value="proprietorship">Proprietorship</option>
                              <option value="partnership">Partnership</option>
                              <option value="private">Private Limited</option>
                              <option value="public">Public Limited</option>
                              <option value="others">Others</option>
                            </select>
                          </div>

                          <div>
                            <Label>Type of Business</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              {['Agriculture','Manufacturing','Trader','Retailer','Service Provider','Others'].map((b) => (
                                <label key={b} className="flex items-center gap-2"><input type="checkbox" name="businessType" value={b} checked={(extra.businessType || []).includes(b)} onChange={(e) => {
                                  const checked = e.target.checked;
                                  setExtra(prev => {
                                    const current = prev.businessType || [];
                                    const next = checked ? [...current, b] : current.filter(x => x !== b);
                                    return { ...prev, businessType: next };
                                  })
                                }} /> {b}</label>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Business Commencement Year</Label>
                              <select name="businessYear" value={extra.businessYear || ''} onChange={handleExtraChange} className="w-full border rounded p-2">
                                <option value="">Select year</option>
                                {Array.from({length: 50}).map((_,i) => (
                                  <option key={i} value={`${1980 + i}`}>{1980 + i}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>Number of Employees</Label>
                              <Input className="border border-black" name="employees" value={extra.employees || ''} onChange={handleExtraChange} />
                            </div>
                          </div>

                          <div>
                            <Label>Member of any other Chamber/Association</Label>
                            <Input className="border border-black" name="chamber" value={extra.chamber || ''} onChange={handleExtraChange} />
                          </div>

                          <div>
                            <Label>Registered with Govt. Organization</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              {['MSME','KVIC','NABARD','None','Others'].map(x => (
                                <label key={x} className="flex items-center gap-2"><input type="checkbox" name="govtOrg" value={x} onChange={(e) => {
                                  const checked = e.target.checked;
                                  setExtra(prev => {
                                    const cur = Array.isArray(prev.govtOrg) ? prev.govtOrg : (prev.govtOrg ? [prev.govtOrg] : []);
                                    const next = checked ? [...cur, x] : cur.filter(y => y !== x);
                                    return { ...prev, govtOrg: next };
                                  })
                                }} /> {x}</label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div>
                        <h3 className="font-semibold mb-4">Financial & Compliance Information</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <Label>PAN Number</Label>
                            <Input className="border border-black" name="pan" value={extra.pan || ''} onChange={handleExtraChange} placeholder="Enter PAN number" />
                          </div>
                          <div>
                            <Label>GST Number</Label>
                            <Input className="border border-black" name="gst" value={extra.gst || ''} onChange={handleExtraChange} placeholder="Enter GST number" />
                          </div>
                          <div>
                            <Label>Udyam Number</Label>
                            <Input className="border border-black" name="udyam" value={extra.udyam || ''} onChange={handleExtraChange} placeholder="Enter Udyam number" />
                          </div>

                          <div>
                            <Label>Filed Income Tax Returns</Label>
                            <div className="flex gap-4 mt-2 items-center">
                              <label className="flex items-center gap-2"><input type="radio" name="filedITR" value="yes" checked={extra.filedITR === 'yes'} onChange={handleExtraChange} /> Yes</label>
                              <label className="flex items-center gap-2"><input type="radio" name="filedITR" value="no" checked={extra.filedITR === 'no'} onChange={handleExtraChange} /> No</label>
                            </div>
                          </div>

                          <div>
                            <Label>How many continuous years have you filed ITR?</Label>
                            <Input className="border border-black" name="itrYears" value={extra.itrYears || ''} onChange={handleExtraChange} />
                          </div>

                          <div>
                            <Label>Turnover</Label>
                            <select name="turnover" value={extra.turnover || ''} onChange={handleExtraChange} className="w-full border rounded p-2">
                              <option value="">Select turnover range</option>
                              <option value="lt_10l">Less than 10 L</option>
                              <option value="10l_1cr">10 L - 1 Cr</option>
                              <option value="gt_1cr">Over 1 Cr</option>
                            </select>
                          </div>

                          <div>
                            <Label>Turnover for Last 3 Yrs</Label><br></br>
                            <Input className="border border-black" name="turnover1" value={extra.turnover1 || ''} onChange={handleExtraChange} placeholder="FY 2024-25" /><br></br>
                            <Input className="border border-black" name="turnover2" value={extra.turnover2 || ''} onChange={handleExtraChange} placeholder="FY 2023-24" /><br></br>
                            <Input className="border border-black" name="turnover3" value={extra.turnover3 || ''} onChange={handleExtraChange} placeholder="FY 2022-23" />
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 4 && (
                      <div>
                        <h3 className="font-semibold mb-4">Declaration</h3>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <Label>No. of Sister Concerns</Label>
                            <Input className="border border-black" name="sisterConcerns" value={extra.sisterConcerns || ''} onChange={handleExtraChange} />
                          </div>
                          <div>
                            <Label>Name(s) of Company</Label>
                            <Input className="border border-black" name="companyNames" value={extra.companyNames || ''} onChange={handleExtraChange} />
                          </div>
                          <div>
                            <button type="button" onClick={() => setExtra(prev => ({ ...prev, companyNames: (prev.companyNames || '') + (prev.companyNames ? ', ' : '') }))} className="mt-2 inline-block px-3 py-1 border rounded text-sm">Add Another Company</button>
                          </div>
                          <div>
                            <label className="flex items-center gap-2"><input type="checkbox" /> Show one field per name entered above</label>
                          </div>
                          <div>
                            <Label>Declaration</Label>
                            <textarea name="declaration" value={extra.declaration || ''} onChange={handleExtraChange} className="w-full border rounded p-2" rows={3} />
                            <p className="text-xs text-muted-foreground mt-1">This application is under the Verification and Screening Process. We have every right to ACCEPT or REJECT this application according to our membership policy. I confirm the above information is true and correct</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between mt-6">
                      {step > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            prevStep();
                          }}
                        >
                          Previous
                        </Button>
                      )}
                      <div className="ml-auto">
                        <Button type="submit" className="bg-blue-600 text-white">{step === 4 ? 'Submit Application' : 'Next'}</Button>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic details and contact information</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit(onSave)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name*</Label>
                      <Input className="border border-black" id="firstName" {...register("firstName", { required: "First name required" })} disabled={!isEditing} />
                      {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="middleName">Middle Name</Label>
                      <Input className="border border-black" id="middleName" {...register("middleName")} disabled={!isEditing} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input className="border border-black" id="lastName" {...register("lastName")} disabled={!isEditing} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address*</Label>
                      <Input className="border border-black" id="email" type="email" {...register("email", { required: "Email required", pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} disabled={!isEditing} />
                      {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number*</Label>
                      <Input className="border border-black" id="phone" {...register("phone", { required: "Phone required", pattern: { value: /^\+?\d{10,15}$/, message: "Invalid phone" } })} disabled={!isEditing} />
                      {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth</Label>
                      <Input className="border border-black" id="dateOfBirth" type="date" {...register("dateOfBirth")} disabled={!isEditing} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Controller
                        control={control}
                        name="gender"
                        render={({ field }) => (
                          <Select value={field.value || ""} onValueChange={(v: string) => field.onChange(v)} disabled={!isEditing}>
                            <SelectTrigger className="border border-black">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Location Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label htmlFor="state">State*</Label>
                        <Controller
                          control={control}
                          name="state"
                          render={({ field }) => (
                            <Select value={field.value || ""} onValueChange={(v: string) => field.onChange(v)} disabled={!isEditing}>
                              <SelectTrigger className="border border-black">
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(INDIA_DISTRICTS).map((s) => (
                                  <SelectItem key={s} value={s}>
                                    {s}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="district">District*</Label>
                        <Controller
                          control={control}
                          name="district"
                          render={({ field }) => (
                            <Select value={field.value || ""} onValueChange={(v: string) => field.onChange(v)} disabled={!isEditing || !selectedState}>
                              <SelectTrigger className="border border-black">
                                <SelectValue placeholder={districts.length ? "Select district" : "No districts available"} />
                              </SelectTrigger>
                              <SelectContent>
                                {districts.length > 0 ? (
                                  districts.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)
                                ) : (
                                  <>
                                    <SelectItem value="district1">District 1</SelectItem>
                                    <SelectItem value="district2">District 2</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="block">Block</Label>
                        <Controller
                          control={control}
                          name="block"
                          render={({ field }) => (
                            <Select value={field.value || ""} onValueChange={(v: string) => field.onChange(v)} disabled={!isEditing}>
                              <SelectTrigger className="border border-black">
                                <SelectValue placeholder="Select block" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="block1">Block 1</SelectItem>
                                <SelectItem value="block2">Block 2</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" {...register("address")} disabled={!isEditing} />
                      </div>
                    </div>

                    {/* Mobile action buttons: when editing use Save/Cancel */}
                    <div className="md:hidden flex gap-2 pt-6 border-t">
                      {isEditing ? (
                        <>
                          <Button variant="outline" onClick={onCancel} className="flex-1">
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button onClick={handleSubmit(onSave)} className="flex-1 bg-blue-600 text-white">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => setIsEditing(true)} className="w-full">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
