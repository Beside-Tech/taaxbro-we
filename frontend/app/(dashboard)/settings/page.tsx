'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import { useAuth } from '@/context/AuthContext';
import { business, onboarding, ApiError, integrations, auth, tax, type BusinessProfile, type OnboardingPayload, type WhatsAppSettings, type UserSessionInfo, type TaxProfileSettings } from '@/lib/api';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

const BUSINESS_TYPES = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership',         label: 'Partnership' },
  { value: 'limited_liability',   label: 'Limited Company' },
  { value: 'ngo',                 label: 'NGO / Non-Profit' },
  { value: 'other',               label: 'Other' },
];

const INDUSTRIES = [
  'Technology', 'Agriculture', 'Finance', 'Healthcare', 'Education', 'Retail',
  'Manufacturing', 'Real Estate', 'Media', 'Legal', 'Consulting', 'Hospitality',
  'Transportation', 'Construction', 'Energy', 'Other',
];

const USER_TYPES = [
  { value: 'business',         label: 'Business / SME',            icon: 'ph:briefcase' },
  { value: 'freelancer',       label: 'Freelancer / Individual',   icon: 'ph:laptop' },
  { value: 'tax_professional', label: 'Tax Professional',          icon: 'ph:scales' },
];

type ActiveTab = 'profile' | 'tax' | 'invoicing' | 'whatsapp' | 'security' | 'sessions';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tax profile state (CIT / PIT / Fiscal Year)
  const [taxProfileForm, setTaxProfileForm] = useState<TaxProfileSettings>({
    cit_applicable: false,
    pit_applicable: false,
    fiscal_year_end: '12-31',
  });
  const [taxProfileSaving, setTaxProfileSaving] = useState(false);
  const [taxProfileSuccess, setTaxProfileSuccess] = useState(false);
  const [taxProfileError, setTaxProfileError] = useState<string | null>(null);
  
  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp settings state
  const [waSettings, setWaSettings] = useState<WhatsAppSettings | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waPhoneNumber, setWaPhoneNumber] = useState('');

  // Active sessions state
  const [sessions, setSessions] = useState<UserSessionInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // OTP flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  // 2FA state
  const [twoFaSetupSecret, setTwoFaSetupSecret] = useState<string | null>(null);
  const [twoFaQrCode, setTwoFaQrCode] = useState<string | null>(null);
  const [twoFaCodeInput, setTwoFaCodeInput] = useState('');
  const [twoFaModalOpen, setTwoFaModalOpen] = useState(false);
  const [twoFaDisableModalOpen, setTwoFaDisableModalOpen] = useState(false);
  const [twoFaDisableCode, setTwoFaDisableCode] = useState('');
  const [twoFaStateLoading, setTwoFaStateLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSaving, setPasswordChangeSaving] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Form fields
  const [form, setForm] = useState({
    business_name: '',
    owner_name: '',
    business_type: 'sole_proprietorship',
    user_type: 'business',
    industry: 'Other',
    state: 'Lagos',
    tin: '',
    rc_number: '',
    nin: '',
    vat_registered: false,
    vat_registration_no: '',
    address: '',
    phone: '',
    bank_name: '',
    account_number: '',
    account_name: '',
  });

  // Load profile details
  useEffect(() => {
    business
      .getProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          business_name: data.name ?? '',
          owner_name: data.owner_name ?? '',
          business_type: data.business_type ?? 'sole_proprietorship',
          user_type: data.user_type ?? 'business',
          industry: data.industry ? (data.industry.charAt(0).toUpperCase() + data.industry.slice(1)) : 'Other',
          state: data.state ?? 'Lagos',
          tin: data.tin ?? '',
          rc_number: data.rc_number ?? '',
          nin: data.nin ?? '',
          vat_registered: data.vat_registered ?? false,
          vat_registration_no: data.vat_registration_no ?? '',
          address: data.address ?? '',
          phone: data.phone ?? '',
          bank_name: data.bank_name ?? '',
          account_number: data.account_number ?? '',
          account_name: data.account_name ?? '',
        });

        // Pre-populate tax profile toggles from BusinessProfile (already joined server-side)
        setTaxProfileForm({
          cit_applicable: data.cit_applicable ?? false,
          pit_applicable: data.pit_applicable ?? false,
          fiscal_year_end: data.fiscal_year_end ?? '12-31',
        });

        if (data.business_id) {
          setWaLoading(true);
          integrations
            .getWhatsAppSettings(data.business_id)
            .then((waData) => {
              setWaSettings(waData);
              setWaPhoneNumber(waData.phone_number ?? '');
            })
            .catch((e) => {
              console.log('No WhatsApp integration configured yet:', e.message);
              setWaSettings(null);
              setWaPhoneNumber('');
            })
            .finally(() => setWaLoading(false));
        }
      })
      .catch((e) => setError(e.message ?? 'Failed to load business profile.'))
      .finally(() => setLoading(false));
  }, []);

  // Compute profile completion percentage
  const calculateCompletion = () => {
    let completed = 0;
    const total = 6;
    
    if (form.business_name.trim()) completed++;
    if (form.user_type && form.industry) completed++;
    if (form.tin.trim()) completed++;
    
    if (form.user_type === 'business') {
      if (form.rc_number.trim()) completed++;
    } else if (form.user_type === 'freelancer') {
      if (form.nin.trim()) completed++;
    } else {
      completed++; // tax professional does not strictly enforce CAC/NIN
    }
    
    if (form.address.trim() && form.phone.trim()) completed++;
    if (form.bank_name.trim() && form.account_number.trim() && form.account_name.trim()) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const completionPct = calculateCompletion();

  // Save profile changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'whatsapp') {
      return;
    }
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload: OnboardingPayload = {
        user_type: form.user_type,
        business_name: form.business_name,
        owner_name: form.owner_name.trim() || undefined,
        business_type: form.business_type,
        state: form.state,
        industry: form.industry,
        tin: form.tin.trim() || undefined,
        rc_number: form.user_type === 'business' ? (form.rc_number.trim() || undefined) : undefined,
        nin: form.user_type === 'freelancer' ? (form.nin.trim() || undefined) : undefined,
        vat_registered: form.vat_registered,
        vat_registration_no: form.vat_registered ? (form.vat_registration_no.trim() || undefined) : undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        bank_name: form.bank_name.trim() || undefined,
        account_number: form.account_number.trim() || undefined,
        account_name: form.account_name.trim() || undefined,
      };

      const updatedUser = await onboarding.complete(payload);
      setUser(updatedUser);
      setSaveSuccess(true);
      
      // Reload profile from server to ensure fresh state
      const refreshed = await business.getProfile();
      setProfile(refreshed);

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Save Tax Profile (CIT / PIT / Fiscal Year)
  const handleSaveTaxProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaxProfileSaving(true);
    setTaxProfileError(null);
    setTaxProfileSuccess(false);
    try {
      const updated = await tax.updateTaxProfile(taxProfileForm);
      setTaxProfileForm(updated);
      // Also refresh the BusinessProfile cache so the tax page sees the new values
      const refreshed = await business.getProfile();
      setProfile(refreshed);
      setTaxProfileSuccess(true);
      setTimeout(() => setTaxProfileSuccess(false), 3000);
    } catch (err: any) {
      setTaxProfileError(err instanceof ApiError ? err.message : 'Failed to save tax profile settings.');
    } finally {
      setTaxProfileSaving(false);
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoError(null);

    try {
      const result = await business.uploadLogo(file);
      if (profile) {
        setProfile({ ...profile, logo_url: result.logo_url });
      }
    } catch (err: any) {
      setLogoError(err.message ?? 'Logo upload failed. Support formats are PNG, JPEG, SVG under 2MB.');
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    // In our backend, logo removal isn't a dedicated endpoint, but we can set logo_url to None 
    // by triggering profile update or a clean reload. For visual consistency, we can update it in the profile state.
    if (profile) {
      setProfile({ ...profile, logo_url: null });
    }
  };

  // OTP flow timers and events
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Load active sessions when tab changes to sessions
  useEffect(() => {
    if (activeTab === 'sessions') {
      setSessionsLoading(true);
      auth
        .getSessions()
        .then(setSessions)
        .catch((e) => setError(e.message ?? 'Failed to load active sessions.'))
        .finally(() => setSessionsLoading(false));
    }
  }, [activeTab]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session? The device will be logged out.')) {
      return;
    }
    setRevokingId(sessionId);
    try {
      await auth.revokeSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      const target = sessions.find((s) => s.id === sessionId);
      if (target?.is_current) {
        window.location.href = '/login';
      }
    } catch (err: any) {
      setError(err.message ?? 'Failed to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    if (!confirm('Are you sure you want to revoke all other sessions? All other logged-in devices will be disconnected.')) {
      return;
    }
    setSessionsLoading(true);
    try {
      await auth.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.is_current));
    } catch (err: any) {
      setError(err.message ?? 'Failed to revoke other sessions.');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Trigger verify if 6 digits are filled
  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === 6 && otpSent && !otpLoading) {
      handleVerifyOtp();
    }
  }, [otpDigits]);

  const handleSendOtp = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!profile?.business_id || !waPhoneNumber.trim()) {
      setOtpError('Please enter a valid phone number');
      return;
    }
    
    setOtpLoading(true);
    setOtpError(null);
    setDebugCode(null);
    try {
      const res = await integrations.sendWhatsAppOtp(profile.business_id, waPhoneNumber.trim());
      if (res.debug_code) {
        setDebugCode(res.debug_code);
      }
      setOtpSent(true);
      setCooldown(60);
      // Reset code inputs
      setOtpDigits(['', '', '', '', '', '']);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 50);
    } catch (err: any) {
      setOtpError(err instanceof ApiError ? err.message : 'Failed to send verification code.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length < 6) {
      setOtpError('Please enter the 6-digit code');
      return;
    }
    
    if (!profile?.business_id) return;
    
    setOtpLoading(true);
    setOtpError(null);
    try {
      const waData = await integrations.verifyWhatsAppOtp(profile.business_id, waPhoneNumber.trim(), code);
      setWaSettings(waData);
      setWaPhoneNumber(waData.phone_number ?? '');
      setOtpSent(false);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setOtpError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) {
      const newDigits = [...otpDigits];
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }
    
    const newDigits = [...otpDigits];
    const valDigits = val.split('').slice(0, 6 - index);
    valDigits.forEach((d, i) => {
      newDigits[index + i] = d;
    });
    setOtpDigits(newDigits);
    
    const nextIndex = Math.min(index + valDigits.length, 5);
    if (nextIndex !== index) {
      otpRefs.current[nextIndex]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        otpRefs.current[index - 1]?.focus();
      } else if (otpDigits[index]) {
        const newDigits = [...otpDigits];
        newDigits[index] = '';
        setOtpDigits(newDigits);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < pastedData.length; i++) {
        newDigits[i] = pastedData[i];
      }
      setOtpDigits(newDigits);
      const focusIndex = Math.min(pastedData.length, 5);
      otpRefs.current[focusIndex]?.focus();
    }
  };

  const handleDisconnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!profile?.business_id) return;
    
    if (!confirm('Are you sure you want to disconnect WhatsApp integration?')) {
      return;
    }
    
    setWaLoading(true);
    setError(null);
    try {
      await integrations.disconnectWhatsApp(profile.business_id);
      setWaSettings(null);
      setWaPhoneNumber('');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to disconnect WhatsApp.');
    } finally {
      setWaLoading(false);
    }
  };

  // ── 2FA & Password Change Handlers ───────────────────────────────────────
  
  const handleSetup2FA = async () => {
    setTwoFaStateLoading(true);
    setTwoFaError(null);
    try {
      const res = await auth.setup2fa();
      setTwoFaSetupSecret(res.secret);
      setTwoFaQrCode(res.qr_code_base64);
      setTwoFaCodeInput('');
      setTwoFaModalOpen(true);
    } catch (err: any) {
      setTwoFaError(err.message ?? 'Failed to initiate 2FA setup.');
    } finally {
      setTwoFaStateLoading(false);
    }
  };

  const handleEnable2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!twoFaCodeInput || twoFaCodeInput.length !== 6) {
      setTwoFaError('Please enter a valid 6-digit verification code.');
      return;
    }
    setTwoFaStateLoading(true);
    setTwoFaError(null);
    try {
      await auth.enable2fa(twoFaCodeInput);
      setTwoFaModalOpen(false);
      setTwoFaSetupSecret(null);
      setTwoFaQrCode(null);
      setTwoFaCodeInput('');
      if (user) {
        setUser({ ...user, two_fa_enabled: true });
      }
      alert('Two-Factor Authentication has been enabled successfully!');
    } catch (err: any) {
      setTwoFaError(err.message ?? 'Invalid code or failed to enable 2FA.');
    } finally {
      setTwoFaStateLoading(false);
    }
  };

  const handleDisable2FA = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!twoFaDisableCode || twoFaDisableCode.length !== 6) {
      setTwoFaError('Please enter a valid 6-digit verification code.');
      return;
    }
    setTwoFaStateLoading(true);
    setTwoFaError(null);
    try {
      await auth.disable2fa(twoFaDisableCode);
      setTwoFaDisableModalOpen(false);
      setTwoFaDisableCode('');
      if (user) {
        setUser({ ...user, two_fa_enabled: false });
      }
      alert('Two-Factor Authentication has been disabled successfully.');
    } catch (err: any) {
      setTwoFaError(err.message ?? 'Invalid code or failed to disable 2FA.');
    } finally {
      setTwoFaStateLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match.');
      return;
    }

    setPasswordChangeSaving(true);
    try {
      await auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordChangeSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordChangeSuccess(false), 5000);
    } catch (err: any) {
      setPasswordChangeError(err.message ?? 'Failed to change password.');
    } finally {
      setPasswordChangeSaving(false);
    }
  };


  if (loading) {
    return (
      <div className='flex flex-col flex-1 h-screen items-center justify-center bg-grey-0'>
        <Icon icon='ph:circle-notch' className='animate-spin text-4xl text-primary-30' />
        <p className='text-sm text-secondary-30 mt-3 font-medium'>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col flex-1 bg-[#fcfcfc] min-h-screen'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-bold text-secondary-10'>Settings Hub</h1>
          <p className='text-sm text-secondary-30 mt-0.5'>Configure your profile, compliance parameters, and invoices</p>
        </div>
      </TopBar>

      <main className='flex-1 p-8 max-w-6xl mx-auto w-full'>
        {/* Alerts */}
        {error && (
          <div className='mb-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2 animate-fade-in'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        {saveSuccess && (
          <div className='mb-6 px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2 animate-fade-in'>
            <Icon icon='ph:check-circle' className='text-lg shrink-0' />
            Settings saved successfully!
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
          
          {/* Left Navigation Panel */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Completion Widget */}
            <div className='bg-white rounded-3xl p-5 border border-grey-10 shadow-sm flex items-center gap-4'>
              <div className='relative w-14 h-14 flex items-center justify-center shrink-0'>
                <svg className='w-full h-full transform -rotate-90' viewBox='0 0 36 36'>
                  <path
                    className='text-grey-10'
                    strokeWidth='3.5'
                    stroke='currentColor'
                    fill='none'
                    d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                  />
                  <path
                    className='text-primary-30 transition-all duration-500 ease-out'
                    strokeDasharray={`${completionPct}, 100`}
                    strokeWidth='3.5'
                    strokeLinecap='round'
                    stroke='currentColor'
                    fill='none'
                    d='M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'
                  />
                </svg>
                <span className='absolute text-xs font-bold text-secondary-10'>{completionPct}%</span>
              </div>
              <div>
                <h4 className='font-bold text-sm text-secondary-10'>Profile Setup</h4>
                <p className='text-xs text-secondary-30 mt-0.5'>
                  {completionPct === 100 ? 'All sections completed!' : 'Complete skipped fields'}
                </p>
              </div>
            </div>

            {/* Sidebar Tabs */}
            <nav className='bg-white rounded-3xl p-2.5 border border-grey-10 shadow-sm space-y-1'>
              {(['profile', 'tax', 'invoicing', 'whatsapp', 'security', 'sessions'] as ActiveTab[]).map((tab) => {
                const isActive = activeTab === tab;
                const label = 
                  tab === 'profile' ? 'Business Profile' :
                  tab === 'tax' ? 'Tax & Identity' :
                  tab === 'invoicing' ? 'Invoices & Banking' :
                  tab === 'whatsapp' ? 'WhatsApp Bot' :
                  tab === 'security' ? 'Security & 2FA' : 'Active Sessions';
                const icon = 
                  tab === 'profile' ? 'ph:user-gear' :
                  tab === 'tax' ? 'ph:scales' :
                  tab === 'invoicing' ? 'ph:credit-card' :
                  tab === 'whatsapp' ? 'ph:whatsapp-logo' :
                  tab === 'security' ? 'ph:shield-check' : 'ph:devices';
                
                return (
                  <button
                    key={tab}
                    type='button'
                    onClick={() => { setActiveTab(tab); setError(null); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-primary-30 text-white shadow-sm' 
                        : 'text-secondary-20 hover:bg-grey-0'
                    }`}
                  >
                    <Icon icon={icon} className='text-lg' />
                    {label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Form Content Panel */}
          <div className='lg:col-span-3'>
            <form onSubmit={handleSave} className='bg-white rounded-3xl border border-grey-10 p-8 shadow-sm space-y-8'>
              
              {/* TAB 1: BUSINESS PROFILE */}
              {activeTab === 'profile' && (
                <div className='space-y-6 animate-fade-in'>
                  <div>
                    <h2 className='text-xl font-bold text-secondary-10'>Business Profile</h2>
                    <p className='text-sm text-secondary-30 mt-1'>Update your core business profile settings, entity details, and branding logo.</p>
                  </div>

                  {/* Logo Upload Section */}
                  <div className='flex items-center gap-6 p-5 bg-grey-0 rounded-2xl border border-grey-10'>
                    <div className='relative w-20 h-20 bg-white border border-grey-10 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm'>
                      {profile?.logo_url ? (
                        <img src={profile.logo_url} alt='Business logo' className='w-full h-full object-contain p-2' />
                      ) : (
                        <Icon icon='ph:image-square' className='text-3xl text-secondary-40' />
                      )}
                      {logoUploading && (
                        <div className='absolute inset-0 bg-white/70 flex items-center justify-center'>
                          <Icon icon='ph:circle-notch' className='animate-spin text-primary-30 text-lg' />
                        </div>
                      )}
                    </div>
                    
                    <div className='space-y-2'>
                      <div className='flex items-center gap-3'>
                        <button
                          type='button'
                          onClick={() => fileInputRef.current?.click()}
                          disabled={logoUploading}
                          className='px-4 py-2 border border-grey-10 bg-white hover:border-primary-30 hover:text-primary-30 transition rounded-full text-xs font-bold text-secondary-10'
                        >
                          Change logo
                        </button>
                        {profile?.logo_url && (
                          <button
                            type='button'
                            onClick={handleRemoveLogo}
                            className='px-3 py-2 text-xs font-bold text-red-500 hover:text-red-600 transition'
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className='text-xs text-secondary-30'>PNG, JPG or SVG format. Max size 2MB.</p>
                      {logoError && <p className='text-xs text-red-500 mt-1 font-medium'>{logoError}</p>}
                    </div>

                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='image/*'
                      className='hidden'
                      onChange={handleLogoUpload}
                    />
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    {form.user_type === 'business' ? (
                      <>
                        <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                          Business Name
                          <input
                            type='text'
                            value={form.business_name}
                            onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                            required
                            className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                          />
                        </label>
                        <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                          Owner Name
                          <input
                            type='text'
                            value={form.owner_name}
                            onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                            required
                            className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                          />
                        </label>
                      </>
                    ) : (
                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col md:col-span-2'>
                        Full Name / Trading Name
                        <input
                          type='text'
                          value={form.business_name}
                          onChange={(e) => setForm({ ...form, business_name: e.target.value, owner_name: e.target.value })}
                          required
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>
                    )}

                    <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                      Business Type
                      <select
                        value={form.business_type}
                        onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                        className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                      >
                        {BUSINESS_TYPES.map((bt) => (
                          <option key={bt.value} value={bt.value}>{bt.label}</option>
                        ))}
                      </select>
                    </label>

                    <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                      Industry
                      <select
                        value={form.industry}
                        onChange={(e) => setForm({ ...form, industry: e.target.value })}
                        className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                      >
                        {INDUSTRIES.map((ind) => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </label>

                    <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                      State of Residence
                      <select
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                      >
                        {NIGERIAN_STATES.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className='space-y-3'>
                    <span className='text-sm font-semibold text-secondary-10'>Your Role</span>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      {USER_TYPES.map((ut) => {
                        const isSelected = form.user_type === ut.value;
                        return (
                          <div
                            key={ut.value}
                            onClick={() => setForm({ ...form, user_type: ut.value })}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                              isSelected 
                                ? 'border-primary-30 bg-primary-50 text-secondary-10' 
                                : 'border-grey-10 bg-grey-0 hover:border-primary-20 hover:bg-[#fafafa]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary-30 text-white' : 'bg-grey-10 text-secondary-30'}`}>
                              <Icon icon={ut.icon} className='text-lg' />
                            </div>
                            <span className='text-sm font-bold'>{ut.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TAX & COMPLIANCE */}
              {activeTab === 'tax' && (
                <div className='space-y-6 animate-fade-in'>
                  <div>
                    <h2 className='text-xl font-bold text-secondary-10'>Tax & Compliance</h2>
                    <p className='text-sm text-secondary-30 mt-1'>Configure regulatory values required for tax computations and FIRS filings.</p>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                      Tax Identification Number (TIN)
                      <input
                        type='text'
                        value={form.tin}
                        onChange={(e) => setForm({ ...form, tin: e.target.value })}
                        placeholder='10-digit number'
                        className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                      />
                    </label>

                    {form.user_type === 'business' ? (
                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        CAC RC / BN number
                        <input
                          type='text'
                          value={form.rc_number}
                          onChange={(e) => setForm({ ...form, rc_number: e.target.value })}
                          placeholder='RC123456 or BN123456'
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>
                    ) : form.user_type === 'freelancer' ? (
                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        National Identity Number (NIN)
                        <input
                          type='text'
                          value={form.nin}
                          onChange={(e) => setForm({ ...form, nin: e.target.value })}
                          placeholder='11-digit NIN'
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>
                    ) : null}
                  </div>

                  <div className='p-5 rounded-2xl border border-grey-10 bg-[#fafafa] space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <h4 className='font-bold text-sm text-secondary-10'>VAT Registration</h4>
                        <p className='text-xs text-secondary-30 mt-0.5'>Is your business registered with FIRS to collect VAT?</p>
                      </div>
                      <button
                        type='button'
                        onClick={() => setForm({ ...form, vat_registered: !form.vat_registered })}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                          form.vat_registered ? 'bg-primary-30' : 'bg-secondary-40'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            form.vat_registered ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {form.vat_registered && (
                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col pt-3 border-t border-grey-10 animate-fade-in'>
                        VAT Registration Number
                        <input
                          type='text'
                          value={form.vat_registration_no}
                          onChange={(e) => setForm({ ...form, vat_registration_no: e.target.value })}
                          placeholder='FIRS-VAT-XXXXX'
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-white px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 transition-all'
                        />
                      </label>
                    )}
                  </div>

                  {/* ── Income Tax & Financial Year ─────────────────────────────── */}
                  <div className='pt-2 border-t border-grey-10 space-y-5'>
                    <div>
                      <h3 className='font-bold text-base text-secondary-10 mb-0.5'>Income Tax & Financial Year</h3>
                      <p className='text-xs text-secondary-30'>
                        Your income tax type is automatically determined by your registered business structure. Only your financial year end requires configuration.
                      </p>
                    </div>

                    {/* Auto-derived tax type status card */}
                    {(() => {
                      const isCIT = form.business_type === 'limited_liability';
                      const isPIT = ['sole_proprietorship', 'partnership'].includes(form.business_type) || form.user_type === 'freelancer';
                      const taxLabel = isCIT ? 'CIT — Company Income Tax' : isPIT ? 'PIT — Personal Income Tax' : 'No Income Tax Obligation';
                      const taxDesc = isCIT
                        ? '30% of annual net profit, filed with FIRS 6 months after financial year end.'
                        : isPIT
                        ? 'Progressive rate on personal income. Annual self-assessment with FIRS.'
                        : 'Your current business type does not trigger a standard income tax obligation.';
                      const taxIcon = isCIT ? 'ph:buildings' : isPIT ? 'ph:user' : 'ph:minus-circle';
                      const tagColor = isCIT
                        ? 'bg-violet-50 text-violet-700 border-violet-200'
                        : isPIT
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-grey-0 text-secondary-30 border-grey-10';

                      return (
                        <div className='p-5 rounded-2xl border border-grey-10 bg-[#fafafa] flex items-start gap-4'>
                          <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${tagColor}`}>
                            <Icon icon={taxIcon} className='text-lg' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <span className='text-sm font-bold text-secondary-10'>{taxLabel}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagColor}`}>
                                Auto-detected
                              </span>
                            </div>
                            <p className='text-xs text-secondary-30 mt-1 leading-relaxed'>{taxDesc}</p>
                            <p className='text-[10px] text-secondary-40 mt-2'>
                              To change your income tax type, update your <strong>Business Type</strong> in the Business Profile tab.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Financial Year End — the only real config choice */}
                    <form onSubmit={handleSaveTaxProfile} className='space-y-4'>
                      <div className='p-5 rounded-2xl border border-grey-10 bg-[#fafafa] space-y-4'>
                        <div>
                          <h4 className='font-bold text-sm text-secondary-10'>Financial Year End</h4>
                          <p className='text-xs text-secondary-30 mt-0.5 leading-relaxed'>
                            When does your accounting year close? This determines your CIT due date (6 months after year-end). Most Nigerian businesses use <strong>Dec 31</strong>.
                          </p>
                        </div>
                        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
                          {[
                            { label: 'Dec 31', sub: 'Most common', value: '12-31' },
                            { label: 'Mar 31', sub: 'Apr–Mar FY', value: '03-31' },
                            { label: 'Jun 30', sub: 'Jul–Jun FY', value: '06-30' },
                            { label: 'Sep 30', sub: 'Oct–Sep FY', value: '09-30' },
                          ].map((opt) => {
                            const isSelected = taxProfileForm.fiscal_year_end === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type='button'
                                onClick={() => setTaxProfileForm({ ...taxProfileForm, fiscal_year_end: opt.value })}
                                className={`py-3 px-2 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 ${
                                  isSelected
                                    ? 'border-primary-30 bg-primary-50 shadow-sm'
                                    : 'border-grey-10 bg-white hover:border-primary-20'
                                }`}
                              >
                                <span className={`text-sm font-bold ${isSelected ? 'text-primary-30' : 'text-secondary-10'}`}>{opt.label}</span>
                                <span className={`text-[10px] font-medium ${isSelected ? 'text-primary-30/70' : 'text-secondary-40'}`}>{opt.sub}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* CIT due date preview */}
                        {(() => {
                          const fyEnd = taxProfileForm.fiscal_year_end;
                          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                          const [mm] = fyEnd.split('-').map(Number);
                          if (!mm) return null;
                          const dueMonth = mm + 6 > 12 ? mm + 6 - 12 : mm + 6;
                          const dueMonthName = monthNames[dueMonth - 1];
                          return (
                            <p className='text-xs text-secondary-30 flex items-center gap-1.5 pt-1 border-t border-grey-10/60'>
                              <Icon icon='ph:calendar-check' className='text-primary-30' />
                              CIT annual filing would be due each <strong className='text-secondary-20'>{dueMonthName} 30</strong>, six months after your year-end.
                            </p>
                          );
                        })()}
                      </div>

                      {taxProfileError && (
                        <div className='px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
                          <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
                          {taxProfileError}
                        </div>
                      )}
                      {taxProfileSuccess && (
                        <div className='px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-sm text-green-700 flex items-center gap-2'>
                          <Icon icon='ph:check-circle' className='text-lg shrink-0' />
                          Financial year saved! CIT due dates have been updated.
                        </div>
                      )}

                      <button
                        type='submit'
                        disabled={taxProfileSaving}
                        className='flex items-center gap-2 px-6 py-3 rounded-full bg-primary-30 text-white text-sm font-bold hover:bg-primary-40 transition-all shadow-sm disabled:opacity-60'
                      >
                        {taxProfileSaving ? (
                          <Icon icon='ph:circle-notch' className='animate-spin text-base' />
                        ) : (
                          <Icon icon='ph:floppy-disk' className='text-base' />
                        )}
                        {taxProfileSaving ? 'Saving...' : 'Save Financial Year'}
                      </button>
                    </form>
                  </div>
                </div>
              )}


              {/* TAB 3: INVOICES & BANKING */}
              {activeTab === 'invoicing' && (
                <div className='space-y-6 animate-fade-in'>
                  <div>
                    <h2 className='text-xl font-bold text-secondary-10'>Invoices & Banking</h2>
                    <p className='text-sm text-secondary-30 mt-1'>These contact details and banking credentials are automatically shown on your PDF invoices.</p>
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col md:col-span-2'>
                      Physical Business Address
                      <textarea
                        rows={2}
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder='Enter your physical business address to print on invoices'
                        className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none resize-none focus:border-primary-30 focus:bg-white transition-all'
                      />
                    </label>

                    <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                      Support Phone Number
                      <input
                        type='text'
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder='+234 800 000 0000'
                        className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                      />
                    </label>
                  </div>

                  <div className='pt-6 border-t border-grey-10 space-y-4'>
                    <h3 className='font-bold text-base text-secondary-10'>Manual Bank Account Details</h3>
                    <p className='text-xs text-secondary-30'>Enable remittance instructions directly on generated bills and client invoices.</p>
                    
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-4'>
                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        Bank Name
                        <input
                          type='text'
                          value={form.bank_name}
                          onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                          placeholder='GTBank, Zenith Bank'
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>

                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        Account Number
                        <input
                          type='text'
                          value={form.account_number}
                          onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                          placeholder='10 digits'
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>

                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        Account Name
                        <input
                          type='text'
                          value={form.account_name}
                          onChange={(e) => setForm({ ...form, account_name: e.target.value })}
                          placeholder='Corporate or Name'
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WHATSAPP BOT */}
              {activeTab === 'whatsapp' && (
                <div className='space-y-6 animate-fade-in'>
                  <div>
                    <h2 className='text-xl font-bold text-secondary-10'>WhatsApp Integration</h2>
                    <p className='text-sm text-secondary-30 mt-1'>
                      Manage your WhatsApp bot connection for receipt scanning and tax assistance.
                    </p>
                  </div>

                  {waLoading ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                      <Icon icon='ph:circle-notch' className='animate-spin text-3xl text-primary-30' />
                      <p className='text-xs text-secondary-30 mt-2'>Fetching WhatsApp settings...</p>
                    </div>
                  ) : waSettings?.phone_number && waSettings?.enabled ? (
                    /* Connected View */
                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl p-8 border border-grey-10 shadow-sm flex flex-col items-center text-center space-y-6 animate-fade-in relative overflow-hidden">
                        <div className="absolute -top-20 -right-20 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />
                        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-60 pointer-events-none" />

                        <div className="relative">
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping scale-110" />
                          <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Icon icon="logos:whatsapp-icon" className="text-4xl text-white brightness-0 invert" />
                          </div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-400 border-4 border-white rounded-full flex items-center justify-center">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                          </div>
                        </div>

                        <div className="space-y-2 max-w-md">
                          <h3 className="text-xl font-bold text-secondary-10">WhatsApp Connected</h3>
                          <p className="text-emerald-600 font-semibold text-sm flex items-center justify-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Linked to {waSettings.phone_number}
                          </p>
                          <p className="text-xs text-secondary-30 leading-relaxed pt-2">
                            Your business is connected to the Taaxbro WhatsApp assistant. You can scan receipts, ask tax questions, and receive automated filing deadline updates directly from WhatsApp.
                          </p>
                        </div>

                        <div className="pt-4 border-t border-grey-10 w-full flex justify-center">
                          <button
                            type="button"
                            onClick={handleDisconnect}
                            disabled={waLoading}
                            className="px-6 py-3 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 transition rounded-full text-xs font-bold flex items-center gap-2 shadow-sm"
                          >
                            {waLoading ? (
                              <Icon icon="ph:circle-notch" className="animate-spin text-sm" />
                            ) : (
                              <Icon icon="ph:trash" className="text-sm" />
                            )}
                            Disconnect WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : otpSent ? (
                    /* OTP (Verification Code) View */
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-white rounded-3xl p-8 border border-grey-10 shadow-sm space-y-6 relative">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpSent(false);
                              setOtpError(null);
                              setOtpDigits(['', '', '', '', '', '']);
                            }}
                            className="w-10 h-10 rounded-full border border-grey-10 hover:border-primary-30 hover:text-primary-30 transition flex items-center justify-center bg-white shadow-sm shrink-0"
                          >
                            <Icon icon="ph:arrow-left" className="text-lg" />
                          </button>
                          <div>
                            <h3 className="text-lg font-bold text-secondary-10">Enter Verification Code</h3>
                            <p className="text-xs text-secondary-30 mt-0.5">
                              We sent a 6-digit code to <span className="font-semibold text-secondary-10">{waPhoneNumber}</span>
                            </p>
                          </div>
                        </div>

                        {debugCode && (
                          <div className='w-full p-4 bg-orange-50 border border-orange-250 rounded-2xl flex gap-3 text-sm text-orange-800 animate-fade-in text-left'>
                            <Icon icon='ph:info-bold' className='text-lg shrink-0 mt-0.5 text-orange-600' />
                            <div>
                              <p className='font-bold text-orange-900'>Demo Verification Code</p>
                              <p className='text-xs text-orange-700 mt-1 leading-relaxed'>
                                Taaxbro WhatsApp API is running in sandbox/mock mode. Enter the following code to link your account: <strong className='text-sm bg-orange-100 px-1.5 py-0.5 rounded text-orange-900 font-mono'>{debugCode}</strong>
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col items-center space-y-4 pt-4">
                          <div className="flex gap-2 sm:gap-3 justify-center">
                            {otpDigits.map((digit, index) => (
                              <input
                                key={index}
                                ref={(el) => {
                                  otpRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(e, index)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                onPaste={handleOtpPaste}
                                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-2xl border-2 border-grey-10 bg-grey-0 focus:border-primary-30 focus:bg-white focus:ring-4 focus:ring-primary-30/10 outline-none transition-all"
                              />
                            ))}
                          </div>

                          {otpError && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                              <Icon icon="ph:warning-circle" className="text-sm" />
                              {otpError}
                            </p>
                          )}

                          <div className="pt-2 text-center">
                            {cooldown > 0 ? (
                              <p className="text-xs text-secondary-30">
                                Resend code in <span className="font-semibold text-secondary-10">{cooldown}s</span>
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                className="text-xs text-primary-30 hover:text-primary-40 font-bold transition hover:underline"
                              >
                                Resend verification code
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="pt-6 border-t border-grey-10 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleVerifyOtp()}
                            disabled={otpLoading || otpDigits.some(d => !d)}
                            className="inline-flex items-center justify-center rounded-full bg-primary-30 px-6 py-3 text-sm font-bold text-white hover:bg-primary-40 transition-colors shadow-sm disabled:opacity-55 disabled:cursor-not-allowed"
                          >
                            {otpLoading && <Icon icon="ph:circle-notch" className="animate-spin mr-2 text-base" />}
                            Verify & Connect
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Unconnected (Phone number input) View */
                    <div className="space-y-6 animate-fade-in">
                      <div className="bg-white rounded-3xl p-8 border border-grey-10 shadow-sm space-y-6 relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-56 h-56 bg-primary-30/5 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/60 shadow-sm">
                            <Icon icon="logos:whatsapp-icon" className="text-2xl" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-lg font-bold text-secondary-10">Connect WhatsApp Assistant</h3>
                            <p className="text-xs text-secondary-30 leading-relaxed">
                              Link your WhatsApp account to enable receipts uploading, tax calculations, and real-time query resolution directly via chat.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-2">
                          <label className="space-y-2 text-sm font-semibold text-secondary-10 flex flex-col">
                            WhatsApp Phone Number
                            <div className="relative mt-1">
                              <input
                                type="tel"
                                value={waPhoneNumber}
                                onChange={(e) => setWaPhoneNumber(e.target.value)}
                                placeholder="e.g. +234 803 123 4567"
                                className="w-full rounded-2xl border border-grey-10 bg-grey-0 pl-4 pr-12 py-3.5 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white focus:ring-4 focus:ring-primary-30/10 transition-all placeholder:text-secondary-40"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-secondary-40">
                                <Icon icon="ph:phone" className="text-lg" />
                              </div>
                            </div>
                          </label>

                          {otpError && (
                            <p className="text-xs text-red-500 font-medium flex items-center gap-1.5">
                              <Icon icon="ph:warning-circle" className="text-sm" />
                              {otpError}
                            </p>
                          )}

                          <div className="rounded-2xl bg-[#f8fafc] border border-blue-50/55 p-4 space-y-2">
                            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                              <Icon icon="ph:info" className="text-base text-blue-600" />
                              Verification Code Required
                            </span>
                            <p className="text-[11px] text-blue-700 leading-relaxed">
                              For security, we will send a 6-digit verification code to this phone number via WhatsApp. Ensure you can receive messages on this number.
                            </p>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-grey-10 flex justify-end">
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={otpLoading || !waPhoneNumber.trim()}
                            className="inline-flex items-center justify-center rounded-full bg-primary-30 px-6 py-3 text-sm font-bold text-white hover:bg-primary-40 transition-colors shadow-sm disabled:opacity-55 disabled:cursor-not-allowed"
                          >
                            {otpLoading && <Icon icon="ph:circle-notch" className="animate-spin mr-2 text-base" />}
                            Send Verification Code
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: SECURITY & 2FA */}
              {activeTab === 'security' && (
                <div className='space-y-8 animate-fade-in'>
                  <div>
                    <h2 className='text-xl font-bold text-secondary-10'>Security Settings</h2>
                    <p className='text-sm text-secondary-30 mt-1'>
                      Protect your financial database by configuring Two-Factor Authentication and updating passwords.
                    </p>
                  </div>

                  {/* Two-Factor Authentication (2FA) */}
                  <div className='bg-white rounded-2xl border border-grey-10 p-6 shadow-sm space-y-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='space-y-1'>
                        <h3 className='font-bold text-base text-secondary-10 flex items-center gap-2'>
                          <Icon icon='ph:shield-check' className='text-xl text-primary-30' />
                          Two-Factor Authentication (2FA)
                        </h3>
                        <p className='text-xs text-secondary-30 max-w-lg leading-relaxed'>
                          Add an extra layer of security to your account. Logins will require a verification code from an authenticator app (like Google Authenticator or 1Password) in addition to your password.
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                        user?.two_fa_enabled 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-grey-0 text-secondary-30 border border-grey-10'
                      }`}>
                        {user?.two_fa_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>

                    <div className='pt-4 border-t border-grey-10/40 flex justify-end'>
                      {user?.two_fa_enabled ? (
                        <button
                          type='button'
                          onClick={() => {
                            setTwoFaDisableCode('');
                            setTwoFaError(null);
                            setTwoFaDisableModalOpen(true);
                          }}
                          className='px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm'
                        >
                          <Icon icon='ph:shield-warning' className='text-sm' />
                          Disable 2FA
                        </button>
                      ) : (
                        <button
                          type='button'
                          onClick={handleSetup2FA}
                          disabled={twoFaStateLoading}
                          className='px-5 py-2.5 bg-primary-30 hover:bg-primary-40 disabled:opacity-55 disabled:cursor-not-allowed text-white rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-sm'
                        >
                          {twoFaStateLoading ? (
                            <Icon icon='ph:circle-notch' className='animate-spin text-sm' />
                          ) : (
                            <Icon icon='ph:shield-plus' className='text-sm' />
                          )}
                          Enable 2FA
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Change Password Form */}
                  <div className='bg-white rounded-2xl border border-grey-10 p-6 shadow-sm space-y-6'>
                    <div>
                      <h3 className='font-bold text-base text-secondary-10 flex items-center gap-2'>
                        <Icon icon='ph:key' className='text-xl text-primary-30' />
                        Change Password
                      </h3>
                      <p className='text-xs text-secondary-30 mt-0.5'>
                        Change your password. Updating your password will disconnect all other active devices.
                      </p>
                    </div>

                    {passwordChangeError && (
                      <div className='px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 animate-fade-in'>
                        <Icon icon='ph:warning-circle' className='text-base shrink-0' />
                        {passwordChangeError}
                      </div>
                    )}

                    {passwordChangeSuccess && (
                      <div className='px-4 py-3 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-700 flex items-center gap-2 animate-fade-in'>
                        <Icon icon='ph:check-circle' className='text-base shrink-0' />
                        Password updated successfully and other sessions revoked!
                      </div>
                    )}

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        Current Password
                        <input
                          type='password'
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder='••••••••'
                          required
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>

                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        New Password
                        <input
                          type='password'
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder='••••••••'
                          required
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>

                      <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                        Confirm New Password
                        <input
                          type='password'
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder='••••••••'
                          required
                          className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                        />
                      </label>
                    </div>

                    <div className='flex justify-end pt-2'>
                      <button
                        type='button'
                        onClick={handleChangePassword}
                        disabled={passwordChangeSaving || !currentPassword || !newPassword || !confirmPassword}
                        className='px-6 py-3 bg-primary-30 hover:bg-primary-40 disabled:opacity-55 disabled:cursor-not-allowed text-white text-sm font-bold transition rounded-full flex items-center justify-center gap-2 shadow-sm'
                      >
                        {passwordChangeSaving && <Icon icon='ph:circle-notch' className='animate-spin text-base' />}
                        Update Password
                      </button>
                    </div>
                  </div>

                  {/* Enable 2FA Modal */}
                  {twoFaModalOpen && (
                    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in'>
                      <div className='bg-white rounded-3xl p-8 max-w-md w-full mx-4 border border-grey-10 shadow-2xl space-y-6 text-center animate-scale-up'>
                        <div className='space-y-2'>
                          <h3 className='text-xl font-bold text-secondary-10'>Scan QR Code</h3>
                          <p className='text-xs text-secondary-30 leading-relaxed'>
                            Scan this QR code with your authenticator app to set up Two-Factor Authentication.
                          </p>
                        </div>

                        {twoFaQrCode && (
                          <div className='mx-auto w-48 h-48 bg-white border border-grey-10 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm p-2'>
                            <img src={twoFaQrCode} alt='TOTP QR Code' className='w-full h-full object-contain' />
                          </div>
                        )}

                        {twoFaSetupSecret && (
                          <div className='p-3 bg-grey-0 rounded-2xl border border-grey-10 text-center space-y-1.5'>
                            <span className='text-[10px] text-secondary-40 font-bold uppercase tracking-wider block'>Manual Secret Key</span>
                            <code className='text-xs font-mono font-bold text-secondary-10 select-all block'>{twoFaSetupSecret}</code>
                          </div>
                        )}

                        {twoFaError && (
                          <p className='text-xs text-red-500 font-medium flex items-center justify-center gap-1.5'>
                            <Icon icon='ph:warning-circle' className='text-sm' />
                            {twoFaError}
                          </p>
                        )}

                        <form onSubmit={handleEnable2FA} className='space-y-4'>
                          <label className='space-y-2 text-xs font-bold text-secondary-10 flex flex-col text-left'>
                            Enter Verification Code
                            <input
                              type='text'
                              maxLength={6}
                              inputMode='numeric'
                              pattern='[0-9]*'
                              value={twoFaCodeInput}
                              onChange={(e) => setTwoFaCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder='000000'
                              className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:border-primary-30 focus:bg-white transition-all placeholder:text-secondary-40'
                            />
                          </label>

                          <div className='flex gap-3 pt-2'>
                            <button
                              type='button'
                              onClick={() => {
                                setTwoFaModalOpen(false);
                                setTwoFaQrCode(null);
                                setTwoFaSetupSecret(null);
                              }}
                              className='w-1/3 px-4 py-3 border border-grey-10 hover:bg-grey-0 text-sm font-bold text-secondary-20 transition rounded-full'
                            >
                              Cancel
                            </button>
                            <button
                              type='submit'
                              disabled={twoFaStateLoading || twoFaCodeInput.length !== 6}
                              className='w-2/3 px-6 py-3 bg-primary-30 hover:bg-primary-40 disabled:opacity-55 disabled:cursor-not-allowed text-sm font-bold text-white transition rounded-full flex items-center justify-center gap-2 shadow-md'
                            >
                              {twoFaStateLoading && <Icon icon='ph:circle-notch' className='animate-spin text-base' />}
                              Verify & Enable
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Disable 2FA Modal */}
                  {twoFaDisableModalOpen && (
                    <div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in'>
                      <div className='bg-white rounded-3xl p-8 max-w-md w-full mx-4 border border-grey-10 shadow-2xl space-y-6 text-center animate-scale-up'>
                        <div className='mx-auto w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500 shadow-sm'>
                          <Icon icon='ph:shield-warning-bold' className='text-3xl' />
                        </div>

                        <div className='space-y-2'>
                          <h3 className='text-xl font-bold text-secondary-10'>Disable Two-Factor Auth</h3>
                          <p className='text-xs text-secondary-30 leading-relaxed'>
                            For security, please enter the current 6-digit code from your authenticator app to disable Two-Factor Authentication.
                          </p>
                        </div>

                        {twoFaError && (
                          <p className='text-xs text-red-500 font-medium flex items-center justify-center gap-1.5'>
                            <Icon icon='ph:warning-circle' className='text-sm' />
                            {twoFaError}
                          </p>
                        )}

                        <form onSubmit={handleDisable2FA} className='space-y-4'>
                          <label className='space-y-2 text-xs font-bold text-secondary-10 flex flex-col text-left'>
                            Enter Verification Code
                            <input
                              type='text'
                              maxLength={6}
                              inputMode='numeric'
                              pattern='[0-9]*'
                              value={twoFaDisableCode}
                              onChange={(e) => setTwoFaDisableCode(e.target.value.replace(/[^0-9]/g, ''))}
                              placeholder='000000'
                              className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:border-primary-30 focus:bg-white transition-all placeholder:text-secondary-40'
                            />
                          </label>

                          <div className='flex gap-3 pt-2'>
                            <button
                              type='button'
                              onClick={() => {
                                setTwoFaDisableModalOpen(false);
                                setTwoFaDisableCode('');
                              }}
                              className='w-1/3 px-4 py-3 border border-grey-10 hover:bg-grey-0 text-sm font-bold text-secondary-20 transition rounded-full'
                            >
                              Cancel
                            </button>
                            <button
                              type='submit'
                              disabled={twoFaStateLoading || twoFaDisableCode.length !== 6}
                              className='w-2/3 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-55 disabled:cursor-not-allowed text-sm font-bold text-white transition rounded-full flex items-center justify-center gap-2 shadow-md shadow-red-500/10'
                            >
                              {twoFaStateLoading && <Icon icon='ph:circle-notch' className='animate-spin text-base' />}
                              Disable 2FA
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ACTIVE SESSIONS */}
              {activeTab === 'sessions' && (
                <div className='space-y-6 animate-fade-in'>
                  <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                    <div>
                      <h2 className='text-xl font-bold text-secondary-10'>Active Sessions</h2>
                      <p className='text-sm text-secondary-30 mt-1'>
                        Devices and locations currently logged into your Taaxbro account.
                      </p>
                    </div>
                    {sessions.length > 1 && (
                      <button
                        type='button'
                        onClick={handleRevokeOtherSessions}
                        className='px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 transition rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm'
                      >
                        <Icon icon='ph:sign-out-bold' />
                        Revoke Other Devices
                      </button>
                    )}
                  </div>

                  {sessionsLoading ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                      <Icon icon='ph:circle-notch' className='animate-spin text-3xl text-primary-30' />
                      <p className='text-xs text-secondary-30 mt-2'>Loading active sessions...</p>
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {sessions.map((session) => {
                        const isMobile = session.device_info?.os === 'Android' || session.device_info?.os === 'iOS';
                        const deviceIcon = isMobile ? 'ph:phone' : 'ph:desktop';
                        const formattedDate = new Date(session.created_at).toLocaleDateString('en-NG', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <div
                            key={session.id}
                            className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                              session.is_current
                                ? 'border-primary-30 bg-primary-50/20'
                                : 'border-grey-10 bg-white hover:bg-grey-0/40'
                            }`}
                          >
                            <div className='flex items-center gap-4'>
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                  session.is_current
                                    ? 'bg-primary-30 text-white border-primary-30'
                                    : 'bg-grey-0 text-secondary-30 border-grey-10'
                                }`}
                              >
                                <Icon icon={deviceIcon} className='text-xl' />
                              </div>

                              <div className='space-y-1'>
                                <div className='flex items-center gap-2 flex-wrap'>
                                  <span className='font-bold text-sm text-secondary-10'>
                                    {session.device_info?.os ?? 'Unknown OS'} • {session.device_info?.browser ?? 'Browser'}
                                  </span>
                                  {session.is_current && (
                                    <span className='px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-primary-30 text-white flex items-center gap-1 shadow-sm shadow-primary-30/10'>
                                      <span className='w-1.5 h-1.5 rounded-full bg-white animate-pulse' />
                                      Current Device
                                    </span>
                                  )}
                                </div>
                                <p className='text-xs text-secondary-30 leading-none'>
                                  IP Address: <span className='font-mono font-medium text-secondary-20'>{session.ip_address ?? 'Unknown'}</span>
                                </p>
                                <p className='text-[10px] text-secondary-40'>
                                  Logged in: {formattedDate}
                                </p>
                              </div>
                            </div>

                            <div className='flex items-center'>
                              <button
                                type='button'
                                onClick={() => handleRevokeSession(session.id)}
                                disabled={revokingId === session.id}
                                className={`px-4 py-2 border rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                                  session.is_current
                                    ? 'border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600'
                                    : 'border-grey-10 hover:border-red-200 hover:bg-red-50 hover:text-red-600 text-secondary-20'
                                }`}
                              >
                                {revokingId === session.id ? (
                                  <Icon icon='ph:circle-notch' className='animate-spin text-sm' />
                                ) : (
                                  <Icon icon='ph:trash' className='text-sm' />
                                )}
                                {session.is_current ? 'Log Out' : 'Revoke'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Form Footer Save Button */}
              {activeTab !== 'whatsapp' && activeTab !== 'sessions' && activeTab !== 'security' && (
                <div className='pt-6 border-t border-grey-10 flex justify-end gap-3'>
                  <button
                    type='submit'
                    disabled={saving}
                    className='inline-flex items-center justify-center rounded-full bg-primary-30 px-6 py-3 text-sm font-bold text-white hover:bg-primary-40 transition-colors shadow-sm disabled:opacity-55 disabled:cursor-not-allowed'
                  >
                    {saving && <Icon icon='ph:circle-notch' className='animate-spin mr-2 text-base' />}
                    Save Changes
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
