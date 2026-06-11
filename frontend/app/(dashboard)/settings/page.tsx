'use client';

import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import { useAuth } from '@/context/AuthContext';
import { business, onboarding, ApiError, integrations, type BusinessProfile, type OnboardingPayload, type WhatsAppSettings } from '@/lib/api';

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

type ActiveTab = 'profile' | 'tax' | 'invoicing' | 'whatsapp';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // WhatsApp settings state
  const [waSettings, setWaSettings] = useState<WhatsAppSettings | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waSaving, setWaSaving] = useState(false);
  const [waTestLoading, setWaTestLoading] = useState(false);
  const [waTestMessage, setWaTestMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [waPhoneNumber, setWaPhoneNumber] = useState('');
  const [waEnabled, setWaEnabled] = useState(false);
  const [waNotificationsEnabled, setWaNotificationsEnabled] = useState(true);
  const [waOcrMode, setWaOcrMode] = useState<'manual' | 'auto'>('manual');
  const [waAutoReplyEnabled, setWaAutoReplyEnabled] = useState(false);
  const [waAutoReplyText, setWaAutoReplyText] = useState('');

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

        if (data.business_id) {
          setWaLoading(true);
          integrations
            .getWhatsAppSettings(data.business_id)
            .then((waData) => {
              setWaSettings(waData);
              setWaPhoneNumber(waData.phone_number ?? '');
              setWaEnabled(waData.enabled ?? false);
              setWaNotificationsEnabled(waData.notifications_enabled ?? true);
              setWaOcrMode(waData.ocr_mode ?? 'manual');
              setWaAutoReplyEnabled(waData.auto_reply_enabled ?? false);
              setWaAutoReplyText(waData.auto_reply_text ?? '');
            })
            .catch((e) => {
              console.log('No WhatsApp integration configured yet:', e.message);
              // Setup default values when integration is missing
              setWaPhoneNumber('');
              setWaEnabled(false);
              setWaNotificationsEnabled(true);
              setWaOcrMode('manual');
              setWaAutoReplyEnabled(false);
              setWaAutoReplyText('');
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
      await handleWhatsAppSave();
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

  const handleWhatsAppSave = async () => {
    if (!profile?.business_id) return;
    setWaSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const waData = await integrations.updateWhatsAppSettings(profile.business_id, {
        phone_number: waPhoneNumber.trim() || undefined,
        enabled: waEnabled,
        notifications_enabled: waNotificationsEnabled,
        ocr_mode: waOcrMode,
        auto_reply_enabled: waAutoReplyEnabled,
        auto_reply_text: waAutoReplyText.trim() || undefined,
      });
      setWaSettings(waData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Failed to update WhatsApp settings.');
    } finally {
      setWaSaving(false);
    }
  };

  const handleWhatsAppTest = async () => {
    if (!profile?.business_id) return;
    setWaTestLoading(true);
    setWaTestMessage(null);
    try {
      const res = await integrations.testWhatsAppIntegration(profile.business_id);
      setWaTestMessage({ type: 'success', text: res.message || 'Test message sent successfully!' });
    } catch (err: any) {
      setWaTestMessage({ type: 'error', text: err.message || 'Failed to send test message.' });
    } finally {
      setWaTestLoading(false);
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
              {(['profile', 'tax', 'invoicing', 'whatsapp'] as ActiveTab[]).map((tab) => {
                const isActive = activeTab === tab;
                const label = 
                  tab === 'profile' ? 'Business Profile' :
                  tab === 'tax' ? 'Tax & Identity' :
                  tab === 'invoicing' ? 'Invoices & Banking' : 'WhatsApp Bot';
                const icon = 
                  tab === 'profile' ? 'ph:user-gear' :
                  tab === 'tax' ? 'ph:scales' :
                  tab === 'invoicing' ? 'ph:credit-card' : 'ph:whatsapp-logo';
                
                return (
                  <button
                    key={tab}
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
                      Manage your WhatsApp bot connection, receipt scanning modes, and notification parameters.
                    </p>
                  </div>

                  {waLoading ? (
                    <div className='flex flex-col items-center justify-center py-12'>
                      <Icon icon='ph:circle-notch' className='animate-spin text-3xl text-primary-30' />
                      <p className='text-xs text-secondary-30 mt-2'>Fetching WhatsApp settings...</p>
                    </div>
                  ) : (
                    <div className='space-y-6'>
                      {/* Live WhatsApp Status Switch */}
                      <div className='flex items-center justify-between p-5 bg-grey-0 rounded-2xl border border-grey-10'>
                        <div>
                          <h4 className='font-bold text-sm text-secondary-10'>WhatsApp Bot Status</h4>
                          <p className='text-xs text-secondary-30 mt-0.5'>
                            Turn the WhatsApp conversational tax assistant on or off for your business.
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={() => setWaEnabled(!waEnabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                            waEnabled ? 'bg-primary-30' : 'bg-secondary-40'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              waEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Phone and OCR Mode */}
                      <div className='grid gap-4 md:grid-cols-2'>
                        <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                          WhatsApp Business Phone Number
                          <input
                            type='text'
                            value={waPhoneNumber}
                            onChange={(e) => setWaPhoneNumber(e.target.value)}
                            placeholder='+234 800 000 0000'
                            className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                          />
                        </label>

                        <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col'>
                          OCR Processing Mode
                          <select
                            value={waOcrMode}
                            onChange={(e) => setWaOcrMode(e.target.value as 'manual' | 'auto')}
                            className='mt-1 w-full rounded-2xl border border-grey-10 bg-grey-0 px-4 py-3 text-sm font-medium outline-none focus:border-primary-30 focus:bg-white transition-all'
                          >
                            <option value='manual'>Verify before saving (Manual Audit)</option>
                            <option value='auto'>Save immediately (Auto Expense)</option>
                          </select>
                        </label>
                      </div>

                      {/* Notifications switch */}
                      <div className='flex items-center justify-between p-5 bg-grey-0 rounded-2xl border border-grey-10'>
                        <div>
                          <h4 className='font-bold text-sm text-secondary-10'>WhatsApp Notifications</h4>
                          <p className='text-xs text-secondary-30 mt-0.5'>
                            Receive automated filing deadline updates and tax payment confirmation receipts.
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={() => setWaNotificationsEnabled(!waNotificationsEnabled)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                            waNotificationsEnabled ? 'bg-primary-30' : 'bg-secondary-40'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              waNotificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Auto Reply switch */}
                      <div className='p-5 bg-grey-0 rounded-2xl border border-grey-10 space-y-4'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <h4 className='font-bold text-sm text-secondary-10'>Custom Auto-Reply</h4>
                            <p className='text-xs text-secondary-30 mt-0.5'>
                              Send an automated greeting message whenever customers message the WhatsApp bot.
                            </p>
                          </div>
                          <button
                            type='button'
                            onClick={() => setWaAutoReplyEnabled(!waAutoReplyEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                              waAutoReplyEnabled ? 'bg-primary-30' : 'bg-secondary-40'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                waAutoReplyEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {waAutoReplyEnabled && (
                          <label className='space-y-2 text-sm font-semibold text-secondary-10 flex flex-col pt-3 border-t border-grey-10 animate-fade-in'>
                            Auto-Reply Message Content
                            <textarea
                              rows={3}
                              value={waAutoReplyText}
                              onChange={(e) => setWaAutoReplyText(e.target.value)}
                              placeholder='Welcome to Taaxbro! Please upload a receipt or type your query...'
                              className='mt-1 w-full rounded-2xl border border-grey-10 bg-white px-4 py-3 text-sm font-medium outline-none resize-none focus:border-primary-30 transition-all'
                            />
                          </label>
                        )}
                      </div>

                      {/* Test Connection Button and message feedback */}
                      <div className='p-5 bg-[#faf5ff] border border-purple-100 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4'>
                        <div className='space-y-1'>
                          <h4 className='font-bold text-sm text-purple-900'>Test WhatsApp Connection</h4>
                          <p className='text-xs text-purple-700 leading-relaxed max-w-2xl'>
                            Verify your credentials by sending a live test message from the platform to your WhatsApp device. Make sure the bot status is Enabled.
                          </p>
                        </div>
                        <button
                          type='button'
                          disabled={waTestLoading || !waEnabled}
                          onClick={handleWhatsAppTest}
                          className='inline-flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-3 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0'
                        >
                          {waTestLoading && <Icon icon='ph:circle-notch' className='animate-spin mr-2 text-sm' />}
                          Send Test Message
                        </button>
                      </div>

                      {/* WhatsApp test results feedback */}
                      {waTestMessage && (
                        <div className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 animate-fade-in ${
                          waTestMessage.type === 'success' 
                            ? 'bg-green-50 border-green-200 text-green-700' 
                            : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                          <Icon icon={waTestMessage.type === 'success' ? 'ph:check-circle' : 'ph:warning-circle'} className='text-base shrink-0' />
                          {waTestMessage.text}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Form Footer Save Button */}
              <div className='pt-6 border-t border-grey-10 flex justify-end gap-3'>
                <button
                  type='submit'
                  disabled={saving || waSaving}
                  className='inline-flex items-center justify-center rounded-full bg-primary-30 px-6 py-3 text-sm font-bold text-white hover:bg-primary-40 transition-colors shadow-sm disabled:opacity-55 disabled:cursor-not-allowed'
                >
                  {(saving || waSaving) && <Icon icon='ph:circle-notch' className='animate-spin mr-2 text-base' />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
