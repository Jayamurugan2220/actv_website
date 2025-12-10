import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PageContainer from "@/components/layout/PageContainer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, ArrowRight, Upload } from "lucide-react";
import { toast } from "sonner";
import { INDIA_DISTRICTS } from "@/data/india-districts";

const MemberRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [profilePicture, setProfilePicture] = useState<string>("");
  
  const [districts, setDistricts] = useState<string[]>([]);
  const [partialData, setPartialData] = useState<any>({});

  // Derive role from email and id patterns
  const emailToRole = (e: string): string => {
    const n = (e || '').trim().toLowerCase();
    if (n.startsWith('block.')) return 'block_admin';
    if (n.startsWith('district.')) return 'district_admin';
    if (n.startsWith('state.')) return 'state_admin';
    if (n.startsWith('super.')) return 'super_admin';
    // also accept exact special emails if used
    if (n === 'blockadmin@activ.com') return 'block_admin';
    if (n === 'districtadmin@activ.com') return 'district_admin';
    if (n === 'stateadmin@activ.com') return 'state_admin';
    if (n === 'superadmin@activ.com') return 'super_admin';
    return 'member';
  };

  const idToRole = (id: string): string => {
    const s = (id || '').toUpperCase();
    if (s.startsWith('BA')) return 'block_admin';
    if (s.startsWith('DA')) return 'district_admin';
    if (s.startsWith('SA')) return 'state_admin';
    if (s.startsWith('SU')) return 'super_admin';
    return 'member';
  };

  type Step1Form = {
    firstName: string;
    middleName?: string;
    lastName?: string;
    mobile: string;
    email: string;
    password: string;
    confirmPassword: string;
  };

  type Step2Form = {
    stateName: string;
    districtName: string;
    block: string;
    address: string;
  };

  const { register: registerStep1, handleSubmit: handleSubmitStep1, control: controlStep1, formState: { errors: errorsStep1 } } = useForm<Step1Form>({ mode: 'onBlur' });
  const { register: registerStep2, handleSubmit: handleSubmitStep2, control: controlStep2, watch: watchStep2, clearErrors: clearErrorsStep2, formState: { errors: errorsStep2 } } = useForm<Step2Form>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { stateName: '', districtName: '', block: '', address: '' },
  });

  const handleStep1Submit = (data: Step1Form) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setPartialData(data);
    setStep(2);
  };

  const handleStep2Submit = async (data: Step2Form) => {
    const combined = {
      ...partialData,
      memberId: partialData.email,
      password: partialData.password,
      state: data.stateName,
      district: data.districtName,
      block: data.block,
      address: data.address,
      registeredAt: new Date().toISOString(),
    };

    // Persist user to users list so they can login later
    try {
      const usersJson = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersJson) as Array<any>;

      // prevent duplicate memberId (using email as unique ID)
      if (users.some((u) => u.memberId === partialData.email)) {
        toast.error('Member ID already exists. Please choose another.');
        return;
      }

      // derive intended role from email prefix (fallback to member)
      const roleFromEmail = emailToRole(partialData.email);
      users.push({
        memberId: partialData.email,
        password: partialData.password,
        email: partialData.email,
        firstName: partialData.firstName,
        role: roleFromEmail,
        registeredAt: new Date().toISOString(),
      });

      // Try to register with backend if available, otherwise fallback to localStorage users
      let backendOk = false;
      try {
        const res = await fetch('http://localhost:4000/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memberId: partialData.email, password: partialData.password, email: partialData.email, firstName: partialData.firstName }),
        });

        if (res.ok) {
          backendOk = true;

          // Also save the full profile to backend after successful registration
          try {
            const profilePayload = {
              userId: partialData.email,
              firstName: partialData.firstName,
              lastName: partialData.lastName,
              email: partialData.email,
              phone: partialData.mobile,
              state: data.stateName,
              district: data.districtName,
              block: data.block,
              address: data.address,
            };
            await fetch('http://localhost:4000/api/profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(profilePayload),
            });
          } catch (e) {
            console.warn('Failed to save profile to backend', e);
          }
        }
      } catch (err) {
        // backend not available — fall back to localStorage
        backendOk = false;
      }

      if (!backendOk) localStorage.setItem('users', JSON.stringify(users));

      // Keep registrationData (profile) for convenience
      localStorage.setItem('registrationData', JSON.stringify(combined));
      localStorage.setItem('userName', partialData.firstName || combined.firstName || 'Member');
      // set session so the user is logged in immediately after register
      localStorage.setItem('memberId', partialData.email);
      const fromEmail = emailToRole(partialData.email);
      const fromId = idToRole(partialData.email); // memberId equals email here
      const roleDerived = fromEmail !== 'member' ? fromEmail : (fromId !== 'member' ? fromId : 'member');
      localStorage.setItem('role', roleDerived);
      if (['super_admin','state_admin','district_admin','block_admin'].includes(roleDerived)) {
        localStorage.setItem('isAdminLoggedIn', 'true');
      } else {
        localStorage.setItem('isLoggedIn', 'true');
      }
      localStorage.removeItem('hasVisitedDashboard');
      toast.success('Registration successful — you are now signed in');
      // navigate to appropriate dashboard
      const adminPath = roleDerived === 'block_admin' ? '/admin/block/dashboard' : '/admin/dashboard';
      navigate(['super_admin','state_admin','district_admin','block_admin'].includes(roleDerived) ? adminPath : '/member/dashboard');
    } catch (err) {
      console.error('Failed to persist user', err);
      toast.error('Failed to save registration. Please try again.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const watchedState = watchStep2 ? watchStep2('stateName') : null;
  useEffect(() => {
    if (watchedState) {
      setDistricts(INDIA_DISTRICTS[watchedState] ?? []);
    } else {
      setDistricts([]);
    }
  }, [watchedState]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[url('/assets/gradient-bg.png')] bg-cover bg-center">
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
          {/* Left column - Title and progress (visible on all sizes but styled differently) */}
          <div className="w-full lg:w-auto">
            <div className="text-center lg:text-left mb-6 lg:mb-0">
              <div className="mx-auto lg:mx-0 w-16 h-16 lg:w-20 lg:h-20 bg-primary rounded-full flex items-center justify-center mb-4 lg:mb-6">
                <UserPlus className="w-8 h-8 lg:w-10 lg:h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl lg:text-4xl font-bold mb-1">Member Registration</h2>
              <p className="text-muted-foreground mb-3 text-sm lg:text-base">Step {step} of 2</p>

              <div className="w-full max-w-md mx-auto lg:mx-0 bg-white/30 rounded-full h-2 mb-3">
                <div className={`h-2 rounded-full bg-blue-600`} style={{ width: step === 1 ? '45%' : '100%' }} />
              </div>

              <div className="flex gap-4 justify-center lg:justify-start text-sm lg:text-sm text-blue-600">
                <div className={`flex items-center gap-2 ${step === 1 ? 'font-semibold' : 'text-gray-500'}`}>
                  <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">•</span>
                  <span>Personal Info</span>
                </div>
                <div className={`flex items-center gap-2 ${step === 2 ? 'font-semibold' : 'text-gray-500'}`}>
                  <span className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">•</span>
                  <span>Location</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Card with form */}
          <div>
            <Card className="w-full shadow-strong border-0">
              <CardHeader className="space-y-2 text-left">
                <CardTitle className="text-2xl font-bold">Registration Form</CardTitle>
                <CardDescription className="text-sm text-gray-500">Please provide accurate information</CardDescription>
              </CardHeader>
              <CardContent>
                {step === 1 ? (
                  <form onSubmit={handleSubmitStep1(handleStep1Submit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Full Name*</Label>
                        <Input id="firstName" placeholder="Enter your full name" {...registerStep1('firstName', { required: 'First name is required' })} />
                        {errorsStep1.firstName && <p className="text-xs text-red-600 mt-1">{errorsStep1.firstName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Phone Number*</Label>
                        <Input id="mobile" placeholder="+91 XXXXXX XXXXX" {...registerStep1('mobile', { required: 'Phone number required', pattern: { value: /^\+?\d{10,15}$/, message: 'Enter a valid phone number' } })} />
                        {errorsStep1.mobile && <p className="text-xs text-red-600 mt-1">{errorsStep1.mobile.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address*</Label>
                      <Input id="email" type="email" placeholder="your.email@example.com" {...registerStep1('email', { required: 'Email required', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' } })} />
                      {errorsStep1.email && <p className="text-xs text-red-600 mt-1">{errorsStep1.email.message}</p>}
                    </div>

                    

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password*</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter Password"
                          {...registerStep1('password', {
                            required: 'Password required',
                            minLength: { value: 6, message: 'At least 6 characters' },
                          })}
                        />
                        {errorsStep1.password && (
                          <p className="text-xs text-red-600 mt-1">{errorsStep1.password.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password*</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm Password"
                          {...registerStep1('confirmPassword', { required: 'Please confirm password' })}
                        />
                        {errorsStep1.confirmPassword && (
                          <p className="text-xs text-red-600 mt-1">{errorsStep1.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" className="bg-blue-600 text-white">Next</Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSubmitStep2(handleStep2Submit)} className="space-y-6"><div className="space-y-2">
                      <Label htmlFor="state">State*</Label>
                      <Controller
                        control={controlStep2}
                        name="stateName"
                        rules={{ required: 'State is required' }}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={(v: string) => { field.onChange(v); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.keys(INDIA_DISTRICTS).map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errorsStep2.stateName && <p className="text-xs text-red-600 mt-1">{errorsStep2.stateName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="district">District*</Label>
                      <Controller
                        control={controlStep2}
                        name="districtName"
                        rules={{ required: 'District is required' }}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={(v: string) => field.onChange(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder={districts.length ? 'Select district' : 'No districts available'} />
                            </SelectTrigger>
                            <SelectContent>
                              {districts.length > 0 ? (
                                districts.map((d) => (
                                  <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))
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
                      {errorsStep2.districtName && <p className="text-xs text-red-600 mt-1">{errorsStep2.districtName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="block">Block*</Label>
                      <Controller
                        control={controlStep2}
                        name="block"
                        defaultValue=""
                        rules={{ required: 'Block is required' }}
                        render={({ field }) => (
                          <Select value={field.value || ''} onValueChange={(v: string) => { field.onChange(v); clearErrorsStep2('block'); }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select block" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="block1">Block 1</SelectItem>
                              <SelectItem value="block2">Block 2</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errorsStep2.block && <p className="text-xs text-red-600 mt-1">{errorsStep2.block.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Complete Address*</Label>
                      <Input id="address" placeholder="Complete address" {...registerStep2('address', { required: 'Address required' })} />
                      {errorsStep2.address && <p className="text-xs text-red-600 mt-1">{errorsStep2.address.message}</p>}
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setStep(1);
                          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
                        }}
                      >
                        Previous
                      </Button>
                      <Button type="submit" className="bg-blue-600 text-white">Submit</Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </div>
  );
};

export default MemberRegister;
