'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import TopBar from '@/components/dashboard/TopBar';
import Link from 'next/link';
import FlagIssueModal from '@/components/dashboard/tax/FlagIssueModal';

import EditVATModal from '@/components/dashboard/tax/EditVATModal';
import RecordFilingModal from '@/components/dashboard/tax/RecordFilingModal';
import { dashboard, business, tax, type DashboardData, type BusinessProfile, type TaxFilingResponse, type TaxObligationResponse, type TaxLawUpdateResponse, type ComplianceAnomalyResponse } from '@/lib/api';

// ─── Formatters ──────────────────────────────────────────────────────────────

function formatNaira(value: number): string {
  if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
  return `₦${value.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

function formatFilingDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

const filingTabs = ['All', 'VAT', 'WHT', 'CIT', 'PAYE'];

export default function TaxPage() {
  const breakdownRef = useRef<HTMLDivElement>(null);
  const [vatTab, setVatTab] = useState<'input' | 'output'>('input');
  const [activeFilingTab, setActiveFilingTab] = useState('All');
  const [showFlag, setShowFlag] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [isVatSubmitted, setIsVatSubmitted] = useState(false);

  const [data, setData] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const infoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showInfoMessage = useCallback((msg: string) => {
    setInfoMessage(msg);
    if (infoDismissTimer.current) clearTimeout(infoDismissTimer.current);
    infoDismissTimer.current = setTimeout(() => setInfoMessage(null), 30000);
  }, []);

  const dismissInfoMessage = useCallback(() => {
    setInfoMessage(null);
    if (infoDismissTimer.current) clearTimeout(infoDismissTimer.current);
  }, []);

  const [filingsList, setFilingsList] = useState<TaxFilingResponse[]>([]);
  const [filingsLoading, setFilingsLoading] = useState(false);

  // Live obligations and law updates
  const [obligationsList, setObligationsList] = useState<TaxObligationResponse[]>([]);
  const [obligationsLoading, setObligationsLoading] = useState(true);
  const [lawUpdates, setLawUpdates] = useState<TaxLawUpdateResponse[]>([]);
  const [showLawMonitor, setShowLawMonitor] = useState(true);
  const [recalculating, setRecalculating] = useState<Record<string, boolean>>({});
  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const [anomalies, setAnomalies] = useState<ComplianceAnomalyResponse[]>([]);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);
  const [showComplianceCenter, setShowComplianceCenter] = useState(true);
  const [complianceTab, setComplianceTab] = useState<'active' | 'resolved'>('active');
  const [autoFixingAll, setAutoFixingAll] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [autoFixingId, setAutoFixingId] = useState<string | null>(null);

  const [selectedObligation, setSelectedObligation] = useState<TaxObligationResponse | null>(null);
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [showRecordFiling, setShowRecordFiling] = useState(false);

  const loadObligations = (bizId: string) => {
    setObligationsLoading(true);
    tax.getOverview(bizId)
      .then((res) => {
        setObligationsList(res.obligations);
        const active = res.obligations.filter(o => 
          isObligationActive(o.tax_type) &&
          o.status.toLowerCase() !== 'filed' &&
          o.status.toLowerCase() !== 'confirmed'
        );
        if (active.length > 0) {
          setSelectedObligation(prev => {
            if (prev && active.some(a => a.id === prev.id)) {
              return active.find(a => a.id === prev.id) || null;
            }
            return active[0];
          });
        } else {
          setSelectedObligation(null);
        }
      })
      .catch((e) => console.error('Failed to load obligations:', e))
      .finally(() => setObligationsLoading(false));
  };

  const loadAnomalies = (bizId: string) => {
    setAnomaliesLoading(true);
    tax.getComplianceAnomalies(bizId)
      .then((res) => setAnomalies(res))
      .catch((e) => console.error('Failed to load compliance anomalies:', e))
      .finally(() => setAnomaliesLoading(false));
  };

  useEffect(() => {
    if (!profile?.business_id || !selectedObligation) {
      setBreakdownData(null);
      return;
    }
    setBreakdownLoading(true);
    tax.getObligationBreakdown(profile.business_id, selectedObligation.id)
      .then((res) => setBreakdownData(res))
      .catch((e) => console.error('Failed to load breakdown details:', e))
      .finally(() => setBreakdownLoading(false));
  }, [selectedObligation, profile?.business_id]);

  useEffect(() => {
    Promise.all([dashboard.get(), business.getProfile()])
      .then(([dash, prof]) => { setData(dash); setProfile(prof); })
      .catch((e) => setError(e.message ?? 'Failed to load tax data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!profile?.business_id) return;
    setFilingsLoading(true);
    tax.getFilings(profile.business_id)
      .then((res) => setFilingsList(res))
      .catch((e) => console.error('Failed to load filings:', e))
      .finally(() => setFilingsLoading(false));

    loadObligations(profile.business_id);
    loadAnomalies(profile.business_id);
    
    tax.getLawUpdates()
      .then((res) => setLawUpdates(res))
      .catch((e) => console.error('Failed to load law updates:', e));
  }, [profile?.business_id]);

  const getTaxAuditDescription = (type: string): string => {
    const t = type.toLowerCase();
    if (t === 'vat') return 'VAT output/input figures';
    if (t === 'wht') return 'Withholding Tax (WHT) liabilities';
    if (t === 'cit') return 'Company Income Tax (CIT) return';
    if (t === 'paye') return 'PAYE payroll deductions';
    return `${type.toUpperCase()} obligations`;
  };

  const handleRecalculate = async (taxType: string) => {
    if (!profile?.business_id) return;
    const typeLower = taxType.toLowerCase();
    setRecalculating(prev => ({ ...prev, [typeLower]: true }));
    showInfoMessage(
      `Elon is currently working your books for you — your ${getTaxAuditDescription(taxType)} are being audited in the background. Please feel free to continue with your other activities. You will be notified via WhatsApp (if connected) or your in-app notification center as soon as the review is complete.`
    );
    try {
      await tax.triggerCompute(profile.business_id, typeLower);
      
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await tax.getOverview(profile.business_id!);
          const hasUpdated = res.obligations.some(o => 
            o.tax_type.toLowerCase() === typeLower && 
            o.computed_at && 
            (new Date().getTime() - new Date(o.computed_at).getTime()) < 20000
          );
          if (hasUpdated || attempts >= 10) {
            setObligationsList(res.obligations);
            loadAnomalies(profile.business_id!);
            setRecalculating(prev => ({ ...prev, [typeLower]: false }));
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Error polling obligation status:', err);
        }
      }, 3000);

    } catch (err: any) {
      console.error('Failed to trigger recalculation:', err);
      alert(err.message || 'Failed to trigger recalculation');
      setRecalculating(prev => ({ ...prev, [typeLower]: false }));
    }
  };

  // Helper to determine if a tax type is applicable based on role / profile settings
  const isObligationActive = (taxType: string): boolean => {
    if (!profile) return false;
    const t = taxType.toLowerCase();
    if (t === 'vat') {
      return profile.vat_registered === true;
    }
    if (t === 'cit') {
      // Use cit_applicable from TaxProfile (set during onboarding / settings)
      // Falls back to business_type check for legacy profiles without TaxProfile row
      return profile.cit_applicable === true ||
        (profile.user_type === 'business' && profile.business_type === 'limited_liability');
    }
    if (t === 'pit') {
      return profile.pit_applicable === true;
    }
    if (t === 'paye') {
      return profile.user_type === 'business';
    }
    return true; // WHT and other general tax types always apply
  };

  // Format fiscal year period from fiscal_year_end ("MM-DD") for display
  const getFiscalYearLabel = (): string => {
    const fyEnd = profile?.fiscal_year_end ?? '12-31';
    const [mm, dd] = fyEnd.split('-').map(Number);
    if (!mm || !dd) return 'Jan 1 – Dec 31';
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    // Start is the day after FY end in the prior year
    const startM = mm === 12 ? 1 : mm + 1;
    const startD = dd === 31 ? 1 : dd + 1; // simplified; good enough for display
    const startLabel = `${months[startM - 1]} ${startD}`;
    const endLabel = `${months[mm - 1]} ${dd}`;
    return `${startLabel} – ${endLabel}`;
  };

  const activeObligations = obligationsList.filter(o => 
    isObligationActive(o.tax_type) &&
    o.status.toLowerCase() !== 'filed' &&
    o.status.toLowerCase() !== 'confirmed'
  );

  const sortedObligations = useMemo(() => {
    const filtered = obligationsList.filter(o => isObligationActive(o.tax_type));
    return [...filtered].sort((a, b) => {
      const aActive = a.status.toLowerCase() !== 'filed' && a.status.toLowerCase() !== 'confirmed';
      const bActive = b.status.toLowerCase() !== 'filed' && b.status.toLowerCase() !== 'confirmed';
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [obligationsList, profile]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: filingsList.length };
    filingsList.forEach((f) => {
      const type = f.tax_type.toUpperCase();
      counts[type] = (counts[type] || 0) + 1;
      if (type === 'PAYE' || f.authority.toUpperCase() === 'LIRS') {
        counts['PAYE'] = (counts['PAYE'] || 0) + 1;
      }
    });
    return counts;
  }, [filingsList]);

  const handleRecalculateAll = async () => {
    if (!profile?.business_id) return;
    setRecalculatingAll(true);
    showInfoMessage(
      "Elon is currently working your books for you — a full audit of all your tax obligations has been queued and is running in the background. Please feel free to continue with your other activities. You will be notified via WhatsApp (if connected) or your in-app notification center as soon as the review is complete."
    );
    
    // Filter down to only active tax types for this profile
    const allTypes = ['vat', 'paye', 'wht', 'cit'];
    const activeTypes = allTypes.filter(isObligationActive);
    
    const initialRecalculating = activeTypes.reduce((acc, t) => {
      acc[t] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    setRecalculating(initialRecalculating);

    try {
      // Trigger calculation for all obligations sequentially via single Celery task
      await tax.triggerCompute(profile.business_id!, 'all');
      
      const startTime = new Date().getTime();
      let attempts = 0;
      
      const interval = setInterval(async () => {
        attempts++;
        try {
          const res = await tax.getOverview(profile.business_id!);
          
          const nextRecalculating = { ...recalculating };
          let finishedCount = 0;
          
          res.obligations.forEach(o => {
            const t = o.tax_type.toLowerCase();
            if (!isObligationActive(t)) return;
            
            const isFinished = o.computed_at && (new Date(o.computed_at).getTime() > startTime - 5000);
            if (isFinished) {
              nextRecalculating[t] = false;
              finishedCount++;
            } else {
              nextRecalculating[t] = true;
            }
          });

          setRecalculating(nextRecalculating);
          
          if (finishedCount === activeTypes.length || attempts >= 15) {
            setObligationsList(res.obligations);
            loadAnomalies(profile.business_id!);
            setRecalculating(
              allTypes.reduce((acc, t) => {
                acc[t] = false;
                return acc;
              }, {} as Record<string, boolean>)
            );
            setRecalculatingAll(false);
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Error polling after batch recalculation:', err);
        }
      }, 3000);
      
    } catch (err: any) {
      console.error('Failed to trigger recalculation for all:', err);
      alert(err.message || 'Failed to recalculate all obligations');
      setRecalculating(
        allTypes.reduce((acc, t) => {
          acc[t] = false;
          return acc;
        }, {} as Record<string, boolean>)
      );
      setRecalculatingAll(false);
    }
  };

  const reloadAllData = (bizId: string) => {
    loadObligations(bizId);
    loadAnomalies(bizId);
    setFilingsLoading(true);
    tax.getFilings(bizId)
      .then((res) => setFilingsList(res))
      .catch((e) => console.error('Failed to load filings:', e))
      .finally(() => setFilingsLoading(false));
    dashboard.get()
      .then((dash) => setData(dash))
      .catch((e) => console.error('Failed to load dashboard stats:', e));
  };

  const handleRecordFilingSubmit = async (reference: string, amount: number) => {
    if (!profile?.business_id || !selectedObligation) return;
    try {
      await tax.recordFiling(profile.business_id, {
        obligation_id: selectedObligation.id,
        nrs_reference: reference,
        amount_filed: amount,
      });
      reloadAllData(profile.business_id);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to record filing');
    }
  };

  const handleFlagIssueSubmit = async (issueType: string, description: string, affectedTransactionIds?: string[]) => {
    if (!profile?.business_id || !selectedObligation) return;
    try {
      await tax.flagObligation(profile.business_id, selectedObligation.id, {
        issue_type: issueType,
        description,
        affected_transaction_ids: affectedTransactionIds,
      });
      reloadAllData(profile.business_id);
    } catch (err: any) {
      console.error('Failed to flag issue:', err);
    }
  };

  const handleResolveAnomaly = async (anomalyId: string) => {
    if (!profile?.business_id) return;
    try {
      await tax.resolveComplianceAnomaly(profile.business_id, anomalyId);
      loadAnomalies(profile.business_id);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve compliance anomaly');
    }
  };

  const handleAutoFixAnomaly = async (anomalyId: string) => {
    if (!profile?.business_id) return;
    setAutoFixingId(anomalyId);
    try {
      await tax.autoFixComplianceAnomaly(profile.business_id, anomalyId);
      showInfoMessage(
        "Elon is correcting your records in the background. Please wait for a moment while we recalculate obligations..."
      );
      loadAnomalies(profile.business_id);
      loadObligations(profile.business_id);
    } catch (err: any) {
      alert(err.message || 'Auto-fix failed. Please resolve manually.');
    } finally {
      setAutoFixingId(null);
    }
  };

  const handleAutoFixAll = async () => {
    if (!profile?.business_id) return;
    setAutoFixingAll(true);
    showInfoMessage(
      "Elon is currently correcting your transaction records in the background. Please feel free to continue with your other activities. You will be notified via WhatsApp or your in-app notification center when the auto-fixes are complete."
    );
    try {
      await tax.autoFixAllComplianceAnomalies(profile.business_id);
      
      // Poll overview/anomalies after a short delay
      setTimeout(() => {
        if (profile?.business_id) {
          loadAnomalies(profile.business_id);
          loadObligations(profile.business_id);
        }
      }, 5000);
    } catch (err: any) {
      alert(err.message || 'Auto-fix all failed.');
    } finally {
      setAutoFixingAll(false);
    }
  };

  const handleDownloadReport = async (scope: 'all' | 'unresolved' | 'resolved') => {
    if (!profile?.business_id) return;
    setShowExportDropdown(false);
    try {
      const blob = await tax.downloadComplianceReport(profile.business_id, scope);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Taaxbro_Compliance_Report_${scope}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Failed to download report.');
    }
  };


  // ── Derived values ───────────────────────────────────────────────────────
  const stats = data?.stats;
  const revenue = stats ? Number(stats.revenue_current_month) : 0;
  const activeAnomalies = useMemo(() => anomalies.filter(a => !a.resolved), [anomalies]);
  const resolvedAnomalies = useMemo(() => anomalies.filter(a => a.resolved), [anomalies]);

  const steps = [
    { n: 1, label: 'Computed', done: true },
    { n: 2, label: 'Ready for review', done: true },
    { n: 3, label: 'Approve & Submit', done: isVatSubmitted },
    { n: 4, label: 'Confirmed by FIRS', done: false },
  ];

  const nextFilingMonthName = stats?.next_filing_date 
    ? new Date(stats.next_filing_date).toLocaleDateString('en-GB', { month: 'short' })
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 21).toLocaleDateString('en-GB', { month: 'short' });

  const formatPeriod = (startStr: string) => {
    const d = new Date(startStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  const getFilingStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'filed') return 'Confirmed';
    if (s === 'awaiting_approval' || s === 'pending') return 'Awaiting Approval';
    if (s === 'failed') return 'Failed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getObligationStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'filed' || s === 'confirmed') return 'Filed';
    if (s === 'awaiting_approval') return 'Awaiting Approval';
    if (s === 'under_review') return 'Under Review';
    if (s === 'computed') return 'Filing Ready';
    if (s === 'pending') return 'Accumulating';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getFilingStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'filed') return 'bg-green-50 text-green-600 border border-green-150 font-semibold px-2 py-0.5 text-xs';
    if (s === 'awaiting_approval' || s === 'pending') return 'bg-orange-50 text-orange-600 border border-orange-150 font-semibold px-2 py-0.5 text-xs';
    if (s === 'failed') return 'bg-red-50 text-red-600 border border-red-150 font-semibold px-2 py-0.5 text-xs';
    return 'bg-grey-50 text-grey-600 border border-grey-150 font-semibold px-2 py-0.5 text-xs';
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    let bgClass = '';
    let textClass = '';
    let borderClass = '';
    let iconName = '';
    let label = '';

    if (s === 'awaiting_approval' || s === 'under_review') {
      if (s === 'under_review') {
        bgClass = 'bg-[#FEF2F2]';
        textClass = 'text-[#EF4444]';
        borderClass = 'border-[#FEE2E2]';
        iconName = 'ph:warning-bold';
        label = 'Under Review';
      } else {
        bgClass = 'bg-[#FFF4E5]';
        textClass = 'text-[#F0861C]';
        borderClass = 'border-[#FFE2BA]';
        iconName = 'ph:clock-bold';
        label = 'Awaiting Approval';
      }
    } else if (s === 'computed') {
      bgClass = 'bg-[#F5EAFF]';
      textClass = 'text-[#A855F7]';
      borderClass = 'border-[#E9D5FF]';
      iconName = 'ph:file-text-bold';
      label = 'Filing Ready';
    } else if (s === 'pending') {
      bgClass = 'bg-[#EEF2FF]';
      textClass = 'text-[#4F46E5]';
      borderClass = 'border-[#C7D2FE]';
      iconName = 'ph:chart-line-up-bold';
      label = 'Accumulating';
    } else if (s === 'filed' || s === 'confirmed') {
      bgClass = 'bg-[#ECFDF5]';
      textClass = 'text-[#10B981]';
      borderClass = 'border-[#A7F3D0]';
      iconName = 'ph:check-circle-bold';
      label = 'Filed';
    } else {
      bgClass = 'bg-grey-50';
      textClass = 'text-secondary-30';
      borderClass = 'border-grey-10';
      iconName = 'ph:info-bold';
      label = status.charAt(0).toUpperCase() + status.slice(1);
    }

    return (
      <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${bgClass} ${textClass} ${borderClass} shrink-0`}>
        <Icon icon={iconName} className="text-xs shrink-0" />
        {label}
      </span>
    );
  };

  const getTaxTypeName = (type: string, authority?: string) => {
    const t = type.toLowerCase();
    if (t === 'vat') return 'Value Added Tax (VAT)';
    if (t === 'wht') return 'Withholding Tax (WHT)';
    if (t === 'cit') return 'Company Income Tax (CIT)';
    if (t === 'paye') {
      const stateName = profile?.state 
        ? (profile.state.charAt(0).toUpperCase() + profile.state.slice(1).toLowerCase()) 
        : 'Lagos';
      return `PAYE - ${stateName} State (${authority ?? 'LIRS'})`;
    }
    return type.toUpperCase();
  };

  const getObligationMeta = (ob: TaxObligationResponse) => {
    const t = ob.tax_type.toLowerCase();
    const isFiled = ob.status.toLowerCase() === 'filed' || ob.status.toLowerCase() === 'confirmed';
    
    // Find filing date if filed
    let dateStr = '';
    if (isFiled) {
      const matchingFiling = filingsList.find(f => f.obligation_id === ob.id);
      const filedDate = matchingFiling?.submitted_at || ob.computed_at || ob.due_date;
      dateStr = `Filed ${formatFilingDate(filedDate)}`;
    } else {
      dateStr = `Due ${formatFilingDate(ob.due_date)}`;
    }

    if (t === 'vat') return `7.5% | Monthly | ${ob.authority} | ${dateStr}`;
    if (t === 'wht') return `At source | Monthly | ${ob.authority} | ${dateStr}`;
    if (t === 'cit') {
      const fyStart = new Date(ob.period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const fyEnd = new Date(ob.period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return `30% | Annual | FY: ${fyStart} – ${fyEnd} | ${dateStr}`;
    }
    if (t === 'paye') return `Monthly | ${ob.authority} | ${dateStr}`;
    return `${ob.authority} | ${dateStr}`;
  };

  const getObligationStatusClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'filed' || s === 'confirmed') return 'bg-green-50 text-green-600 border border-green-200';
    if (s === 'awaiting_approval' || s === 'pending') return 'bg-orange-50 text-orange-600 border border-orange-200';
    if (s === 'under_review') return 'bg-orange-50 text-orange-600 border border-orange-200';
    if (s === 'computed') return 'bg-purple-50 text-purple-600 border border-purple-200';
    return 'bg-primary-50 text-primary-600 border border-primary-200';
  };

  const formatComputedAt = (iso: string | null | undefined) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `Last computed: ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getZeroStateExplanation = (ob: TaxObligationResponse) => {
    if (Number(ob.net_liability) !== 0) return null;
    const t = ob.tax_type.toLowerCase();
    const periodMonth = new Date(ob.period_start).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (t === 'paye') {
      return `No salary payments recorded for ${periodMonth}`;
    }
    if (t === 'cit') {
      return `Net profit ≤ ₦0 — CIT exempt for this year`;
    }
    if (t === 'vat') {
      return `No sales or operations subject to VAT for ${periodMonth}`;
    }
    if (t === 'wht') {
      return `No withholding transactions recorded for ${periodMonth}`;
    }
    return null;
  };

  const filteredHistory = filingsList.filter((f) => {
    const type = f.tax_type.toUpperCase();
    if (activeFilingTab === 'All') return true;
    if (activeFilingTab === 'PAYE') {
      return type === 'PAYE' || f.authority.toUpperCase() === 'LIRS';
    }
    return type === activeFilingTab.toUpperCase();
  });

  const getVatBreakdown = () => {
    if (!data || !data.recent_transactions) return [];
    
    const categoriesMap: Record<string, { collected: number; txns: number }> = {};
    const targetType = vatTab === 'output' ? 'credit' : 'debit';
    
    data.recent_transactions.forEach(tx => {
      if (tx.type === targetType && tx.vat_amount && Number(tx.vat_amount) > 0) {
        const cat = tx.category ? (tx.category.charAt(0).toUpperCase() + tx.category.slice(1)) : (targetType === 'credit' ? 'Sales' : 'Expenses');
        if (!categoriesMap[cat]) {
          categoriesMap[cat] = { collected: 0, txns: 0 };
        }
        categoriesMap[cat].collected += Number(tx.vat_amount);
        categoriesMap[cat].txns += 1;
      }
    });
    
    const list = Object.entries(categoriesMap).map(([cat, info]) => ({
      category: cat,
      collected: info.collected,
      txns: info.txns
    }));
    
    if (list.length === 0) {
      if (vatTab === 'output') {
        list.push({
          category: 'Standard Goods & Services',
          collected: stats ? Number(stats.tax_reserve) : 0,
          txns: data.recent_transactions.filter(t => t.type === 'credit').length
        });
      } else {
        list.push({
          category: 'Purchases & Operations',
          collected: 0,
          txns: data.recent_transactions.filter(t => t.type === 'debit').length
        });
      }
    }
    
    return list;
  };

  const vatBreakdown = getVatBreakdown();

  // Sum Output VAT
  const outputVatFromTxns = data?.recent_transactions
    ? data.recent_transactions
        .filter(t => t.type === 'credit' && t.vat_amount && Number(t.vat_amount) > 0)
        .reduce((sum, t) => sum + Number(t.vat_amount), 0)
    : 0;
  const outputVatTotal = stats && Number(stats.tax_reserve) > 0 ? Number(stats.tax_reserve) : outputVatFromTxns;

  // Sum Input VAT
  const inputVatTotal = data?.recent_transactions
    ? data.recent_transactions
        .filter(t => t.type === 'debit' && t.vat_amount && Number(t.vat_amount) > 0)
        .reduce((sum, t) => sum + Number(t.vat_amount), 0)
    : 0;

  const netVatPayable = Math.max(0, outputVatTotal - inputVatTotal);

  const vatObligation = obligationsList.find(o => o.tax_type.toLowerCase() === 'vat');
  const vatDueDate = vatObligation?.due_date ?? null;

  const inputVatTxns = data?.recent_transactions
    ? data.recent_transactions.filter(t => t.type === 'debit' && t.vat_amount && Number(t.vat_amount) > 0).length
    : 0;

  const outputVatTxns = data?.recent_transactions
    ? data.recent_transactions.filter(t => t.type === 'credit' && t.vat_amount && Number(t.vat_amount) > 0).length
    : 0;

  // Total confirmed filings count — only count confirmed rows from real history
  const confirmedFilingCount = filingsList.filter(
    (f) => f.status.toLowerCase() === 'confirmed' || f.status.toLowerCase() === 'filed'
  ).length;

  // Sum non-filed liabilities for active obligations
  const activeObligationsDue = activeObligations
    .reduce((sum, o) => {
      if (o.tax_type.toLowerCase() === 'vat') return sum; // Add netVatPayable separately for live offset calculations
      return sum + Number(o.net_liability);
    }, 0);

  const totalDueThisMonth = activeObligationsDue + netVatPayable;

  const statCards = [
    { 
      label: 'Filed this year', 
      value: loading ? '—' : String(confirmedFilingCount), 
      sub: confirmedFilingCount > 0 ? 'All confirmed' : 'No filings recorded yet', 
      border: confirmedFilingCount > 0 ? 'border-success' : 'border-secondary-40' 
    },
    { 
      label: 'Next Deadline', 
      value: stats?.next_filing_date ? formatFilingDate(stats.next_filing_date) : '—', 
      sub: stats?.next_filing_date ? 'Filing obligation pending' : 'No upcoming filing', 
      border: stats?.next_filing_date ? 'border-danger' : 'border-secondary-40'
    },
    { 
      label: 'Total due this month', 
      value: stats ? formatNaira(totalDueThisMonth) : '—', 
      sub: 'Active Obligations', 
      subClass: 'text-primary-30', 
      border: 'border-primary-30' 
    },
    { 
      label: 'Overdue', 
      value: stats?.tax_liabilities_status === 'Overdue' ? '1' : '0', 
      sub: stats?.tax_liabilities_status === 'Overdue' ? 'Requires immediate action' : 'All filings up to date', 
      border: stats?.tax_liabilities_status === 'Overdue' ? 'border-danger' : 'border-secondary-40' 
    },
  ];

  const flagTxns = useMemo(() => {
    if (!selectedObligation || !breakdownData) return [];
    const taxType = selectedObligation.tax_type.toLowerCase();
    if (taxType === 'vat') {
      const list = vatTab === 'output' ? (breakdownData.output_vat || []) : (breakdownData.input_vat || []);
      return list.map((tx: any) => ({
        id: tx.id,
        displayId: tx.id.substring(0, 8).toUpperCase(),
        date: tx.issue_date ? new Date(tx.issue_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : new Date(tx.expense_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        desc: tx.invoice_number ? `Invoice #${tx.invoice_number} - ${tx.client_name}` : `${tx.vendor_name || 'Vendor'} (${tx.category})`,
        amount: formatNaira(tx.total_amount || tx.amount)
      }));
    }
    if (taxType === 'wht') {
      const bills = breakdownData.wht_bills || [];
      const expenses = breakdownData.wht_expenses || [];
      return [
        ...bills.map((b: any) => ({
          id: b.id,
          displayId: b.id.substring(0, 8).toUpperCase(),
          date: new Date(b.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          desc: `${b.vendor_name} (Bill #${b.bill_number})`,
          amount: formatNaira(b.wht_amount)
        })),
        ...expenses.map((e: any) => ({
          id: e.id,
          displayId: e.id.substring(0, 8).toUpperCase(),
          date: new Date(e.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
          desc: `${e.vendor_name || 'Expense'} (${e.category})`,
          amount: formatNaira(e.wht_amount)
        }))
      ];
    }
    if (taxType === 'paye') {
      const payments = breakdownData.payments || [];
      return payments.map((p: any) => ({
        id: p.id,
        displayId: p.id.substring(0, 8).toUpperCase(),
        date: 'Payroll',
        desc: p.employee_name,
        amount: formatNaira(p.paye_deducted)
      }));
    }
    return [];
  }, [selectedObligation, breakdownData, vatTab]);

  // ── CSV Export ──────────────────────────────────────────────────────────────
  function handleExportCSV() {
    const rows = [
      ['Period', 'Authority', 'Type', 'Reference', 'Submitted', 'Amount Filed', 'Status'],
      ...filteredHistory.map(r => [
        formatPeriod(r.period_start),
        r.authority,
        r.tax_type,
        r.nrs_reference ?? '—',
        r.submitted_at ? new Date(r.submitted_at).toLocaleDateString('en-GB') : '—',
        r.amount_filed,
        getFilingStatusLabel(r.status)
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taaxbro-filing-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className='flex flex-col flex-1'>
      <TopBar>
        <div>
          <h1 className='text-2xl font-bold text-secondary-10'>Taaxbro Tax</h1>
          <p className='text-sm text-secondary-30 mt-0.5'>
            Federal and state tax compliance – all obligations in one place
          </p>
        </div>
      </TopBar>

      <main className='flex-1 p-4 sm:p-8 space-y-5 overflow-y-auto'>
        {/* Error banner */}
        {error && (
          <div className='px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2'>
            <Icon icon='ph:warning-circle' className='text-lg shrink-0' />
            {error}
          </div>
        )}

        {/* Elon Audit Info Banner */}
        {infoMessage && (
          <div className='fixed bottom-6 right-6 z-[9999] w-[calc(100%-3rem)] sm:w-[450px] md:w-[500px] rounded-2xl border border-primary-20 bg-gradient-to-r from-primary-50 to-[#f0f7ff] text-sm text-secondary-10 shadow-2xl overflow-hidden animate-fade-in'>
            <div className='flex items-start justify-between gap-3 px-4 py-3.5'>
              <div className='flex items-start gap-3'>
                {/* Animated AI thinking indicator */}
                <div className='relative mt-0.5 shrink-0'>
                  <div className='w-8 h-8 rounded-full bg-primary-30/10 flex items-center justify-center'>
                    <Icon icon='ph:robot' className='text-base text-primary-30' />
                  </div>
                  <span className='absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary-30 animate-pulse border-2 border-white' />
                </div>
                <div>
                  <p className='font-semibold text-secondary-10 mb-0.5'>Elon is on it — sit back and relax</p>
                  <p className='text-secondary-30 leading-relaxed'>{infoMessage}</p>
                </div>
              </div>
              <button
                onClick={dismissInfoMessage}
                className='text-secondary-30 hover:text-secondary-10 transition-colors shrink-0 mt-0.5'
                aria-label='Dismiss'
              >
                <Icon icon='ph:x' className='text-base' />
              </button>
            </div>
            {/* Progress bar */}
            <div className='h-0.5 bg-primary-10'>
              <div className='h-full bg-primary-30/50 animate-[shrink_30s_linear_forwards]' style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {/* Stat cards */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className='bg-white rounded-xl border border-grey-10 p-5 animate-pulse'>
                  <div className='h-3 bg-grey-10 rounded w-24 mb-3' />
                  <div className='h-7 bg-grey-10 rounded w-32 mb-4' />
                  <div className='h-3 bg-grey-10 rounded w-20' />
                </div>
              ))
            : statCards.map((c) => (
                <div key={c.label} className={`bg-white rounded-xl border ${c.border} p-5 shadow-sm`}>
                  <p className='text-xs text-secondary-30 mb-2'>{c.label}</p>
                  <p className='text-2xl font-bold text-secondary-10 mb-2'>{c.value}</p>
                  <p className={`text-xs ${c.subClass ?? 'text-secondary-30'}`}>{c.sub}</p>
                </div>
              ))}
        </div>

        {/* Stepper / Compliance Banner */}
        {selectedObligation && (
          <div className='bg-primary-50 border border-primary-10 rounded-xl p-6'>
            <h2 className='text-xl font-semibold text-secondary-10 mb-1 flex items-center gap-2'>
              {getTaxTypeName(selectedObligation.tax_type)} Return 
              {selectedObligation.status.toLowerCase() === 'under_review' && (
                <span className='text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 font-semibold border border-orange-200 flex items-center gap-1 uppercase tracking-wider'>
                  ⚠️ Under Review
                </span>
              )}
              {(selectedObligation.status.toLowerCase() === 'confirmed' || selectedObligation.status.toLowerCase() === 'filed') && (
                <span className='text-xs px-2.5 py-0.5 rounded-full bg-success/20 text-success font-semibold border border-success/30 flex items-center gap-1 uppercase tracking-wider'>
                  ✓ Confirmed
                </span>
              )}
            </h2>
            <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-secondary-30 mb-5'>
              <span>Net Liability: <strong className='text-secondary-10'>{formatNaira(Number(selectedObligation.net_liability))}</strong></span>
              <span className='hidden md:inline text-secondary-40'>|</span>
              <span>Period: {formatPeriod(selectedObligation.period_start)} to {formatPeriod(selectedObligation.period_end)}</span>
              <span className='hidden md:inline text-secondary-40'>|</span>
              <span className={(selectedObligation.status.toLowerCase() === 'confirmed' || selectedObligation.status.toLowerCase() === 'filed') ? 'text-success font-medium' : 'text-danger font-medium'}>
                {(selectedObligation.status.toLowerCase() === 'confirmed' || selectedObligation.status.toLowerCase() === 'filed') ? 'Remitted & Recorded' : `Due ${formatFilingDate(selectedObligation.due_date)}`}
              </span>
            </div>
            
            <div className='flex flex-wrap items-center gap-y-3 gap-x-4 sm:gap-x-6'>
              {(() => {
                const s = selectedObligation.status.toLowerCase();
                const isUnderReview = s === 'under_review';
                const isConfirmed = s === 'confirmed' || s === 'filed';
                const filingSteps = [
                  { n: 1, label: 'Computed', done: true },
                  { n: 2, label: isUnderReview ? 'Under Review' : 'Ready for review', done: true, isWarn: isUnderReview },
                  { n: 3, label: 'Record Filing', done: isConfirmed },
                  { n: 4, label: `Confirmed by ${selectedObligation.authority}`, done: isConfirmed },
                ];
                return filingSteps.map((step, idx) => (
                  <div key={step.n} className='flex items-center shrink-0'>
                    <div className='flex items-center gap-2'>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${step.isWarn ? 'bg-orange-500 text-white' : (step.done ? 'bg-primary-30 text-white' : 'bg-secondary-40 text-secondary-30')}`}>
                        {step.isWarn ? <Icon icon='ph:warning-bold' className='text-sm' /> : (step.done ? <Icon icon='ph:check-bold' className='text-sm' /> : step.n)}
                      </div>
                      <span className={`text-xs sm:text-sm ${step.done ? 'text-primary-30 font-medium' : 'text-secondary-30'}`}>{step.label}</span>
                    </div>
                    {idx < 3 && (
                      <div className={`hidden lg:block h-px w-6 lg:w-12 mx-2 lg:mx-3 ${step.done ? 'bg-primary-30' : 'bg-secondary-40'}`} />
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        <div className='grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-5'>
          {/* Breakdown Card */}
          <div ref={breakdownRef} className='bg-white rounded-xl border border-grey-10/60 p-6 flex flex-col lg:sticky lg:top-[96px] lg:h-[calc(100vh-180px)] min-h-[550px] shadow-sm overflow-hidden'>
            {selectedObligation ? (
              <div className='flex flex-col flex-1 min-h-0'>
                <div className='flex items-center justify-between mb-4 border-b border-grey-10 pb-3 shrink-0'>
                  <div>
                    <h2 className='text-base font-semibold text-secondary-10'>
                      {selectedObligation.tax_type.toUpperCase()} - {
                        selectedObligation.tax_type.toLowerCase() === 'cit'
                          ? String(new Date(selectedObligation.period_start).getFullYear())
                          : new Date(selectedObligation.period_start).toLocaleDateString('en-US', { month: 'long' })
                      } Breakdown
                    </h2>
                  </div>
                  <Link href='/books' className='text-sm text-primary-30 hover:underline flex items-center gap-1 font-medium'>
                    View Transactions <Icon icon='ph:arrow-right' />
                  </Link>
                </div>

                <div className='flex-1 overflow-y-auto min-h-0 pr-1'>
                  {breakdownLoading ? (
                    <div className='py-20 flex flex-col items-center justify-center gap-3'>
                      <Icon icon='ph:circle-notch' className='text-3xl animate-spin text-primary-30' />
                      <p className='text-sm text-secondary-30'>Retrieving live calculation data...</p>
                    </div>
                  ) : !breakdownData ? (
                    <div className='py-20 text-center text-sm text-secondary-30'>
                      No breakdown details available for this obligation.
                    </div>
                  ) : (
                    <div className='space-y-4'>
                      {/* Render VAT Breakdown */}
                      {selectedObligation.tax_type.toLowerCase() === 'vat' && (
                        <div className='space-y-4 animate-fadeIn'>
                          <div className='flex flex-wrap gap-4 sm:gap-6 border-b border-grey-10 mb-4'>
                            {(['input', 'output'] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setVatTab(t)}
                                className={`pb-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${vatTab === t ? 'border-primary-30 text-primary-30' : 'border-transparent text-secondary-30'}`}
                              >
                                {t === 'input' ? 'Input VAT' : 'Output VAT'}
                              </button>
                            ))}
                          </div>

                          <div className='border border-grey-10 rounded-xl overflow-hidden shadow-sm'>
                            <div className='grid grid-cols-3 bg-primary-40 text-white text-xs px-4 py-3 font-semibold'>
                              <span>Category</span>
                              <span>{vatTab === 'input' ? 'VAT Paid' : 'VAT Collected'}</span>
                              <span className='text-right'>Transactions</span>
                            </div>
                            {/* Map grouped breakdown */}
                            {(() => {
                              const outputList = breakdownData.output_vat || [];
                              const inputList = breakdownData.input_vat || [];
                              const breakdownRows: Array<{ category: string; collected: number; txns: number }> = [];
                              
                              if (vatTab === 'output') {
                                const categoriesMap: Record<string, { collected: number; txns: number }> = {};
                                outputList.forEach((inv: any) => {
                                  const cat = inv.client_name || 'Sales';
                                  if (!categoriesMap[cat]) categoriesMap[cat] = { collected: 0, txns: 0 };
                                  categoriesMap[cat].collected += Number(inv.vat_total);
                                  categoriesMap[cat].txns += 1;
                                });
                                Object.entries(categoriesMap).forEach(([category, val]) => {
                                  breakdownRows.push({ category, collected: val.collected, txns: val.txns });
                                });
                              } else {
                                const categoriesMap: Record<string, { collected: number; txns: number }> = {};
                                inputList.forEach((exp: any) => {
                                  const cat = exp.category ? (exp.category.charAt(0).toUpperCase() + exp.category.slice(1)) : 'Expenses';
                                  if (!categoriesMap[cat]) categoriesMap[cat] = { collected: 0, txns: 0 };
                                  categoriesMap[cat].collected += Number(exp.vat_amount);
                                  categoriesMap[cat].txns += 1;
                                });
                                Object.entries(categoriesMap).forEach(([category, val]) => {
                                  breakdownRows.push({ category, collected: val.collected, txns: val.txns });
                                });
                              }

                              return (
                                <>
                                  {breakdownRows.length === 0 ? (
                                    <div className='py-6 text-center text-xs text-secondary-30 bg-primary-50/10'>
                                      No transactions with VAT tracked in this period.
                                    </div>
                                  ) : (
                                    breakdownRows.map((row, idx) => (
                                      <div key={idx} className={`grid grid-cols-3 px-4 py-3 text-sm border-b border-grey-10/40 bg-white`}>
                                        <span className='text-secondary-10 font-medium'>{row.category}</span>
                                        <span className='text-secondary-10 font-semibold'>{formatNaira(row.collected)}</span>
                                        <span className='text-secondary-30 text-right'>{row.txns}</span>
                                      </div>
                                    ))
                                  )}
                                </>
                              );
                            })()}
                          </div>

                          {/* Dedicated VAT Summary Panel */}
                          {(() => {
                            const outputList = breakdownData.output_vat || [];
                            const inputList = breakdownData.input_vat || [];
                            const totalOutputVat = outputList.reduce((sum: number, inv: any) => sum + Number(inv.vat_total || 0), 0);
                            const totalInputVat = inputList.reduce((sum: number, exp: any) => sum + Number(exp.vat_amount || 0), 0);
                            const netVatPayableValue = Math.max(0, totalOutputVat - totalInputVat);
                            const totalOutputTxns = outputList.length;
                            const totalInputTxns = inputList.length;

                            return (
                              <div className='bg-primary-50/10 border border-grey-10/60 rounded-xl p-4 space-y-3 shadow-sm'>
                                <h3 className='text-xs font-bold text-secondary-20 uppercase tracking-wider mb-1'>VAT Calculation Summary</h3>
                                <div className='grid grid-cols-3 gap-3 text-center'>
                                  <div className='bg-white border border-grey-10/40 rounded-lg p-2 flex flex-col justify-center min-h-[72px] shadow-sm'>
                                    <span className='text-[9px] text-secondary-30 font-semibold uppercase block leading-none'>Total Output VAT</span>
                                    <span className='text-xs sm:text-sm font-bold text-secondary-10 block mt-1'>{formatNaira(totalOutputVat)}</span>
                                    <span className='text-[8px] text-secondary-30 block mt-0.5'>{totalOutputTxns} sales txns</span>
                                  </div>
                                  <div className='bg-white border border-grey-10/40 rounded-lg p-2 flex flex-col justify-center min-h-[72px] shadow-sm'>
                                    <span className='text-[9px] text-secondary-30 font-semibold uppercase block leading-none'>Total Input VAT</span>
                                    <span className='text-xs sm:text-sm font-bold text-secondary-10 block mt-1'>{formatNaira(totalInputVat)}</span>
                                    <span className='text-[8px] text-secondary-30 block mt-0.5'>{totalInputTxns} expense txns</span>
                                  </div>
                                  <div className='bg-primary-30 text-white rounded-lg p-2 flex flex-col justify-center min-h-[72px] shadow-sm'>
                                    <span className='text-[9px] text-white/80 font-bold uppercase block leading-none'>Net VAT Payable</span>
                                    <span className='text-sm sm:text-base font-black block mt-1'>{formatNaira(netVatPayableValue)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Render WHT Breakdown */}
                      {selectedObligation.tax_type.toLowerCase() === 'wht' && (
                        <div className='space-y-4 animate-fadeIn'>
                          <div className='border border-grey-10 rounded-xl overflow-hidden shadow-sm'>
                            <div className='grid grid-cols-4 bg-primary-40 text-white text-xs px-4 py-3 font-medium'>
                              <span>Vendor / Item</span>
                              <span>Date</span>
                              <span>Gross Amount</span>
                              <span>WHT Withheld</span>
                            </div>
                            {(() => {
                              const bills = breakdownData.wht_bills || [];
                              const expenses = breakdownData.wht_expenses || [];
                              const whtItems = [
                                ...bills.map((b: any) => ({
                                  name: b.vendor_name,
                                  date: b.date,
                                  amount: b.amount,
                                  wht: b.wht_amount,
                                })),
                                ...expenses.map((e: any) => ({
                                  name: e.vendor_name || 'General Expense',
                                  date: e.date,
                                  amount: e.amount,
                                  wht: e.wht_amount,
                                })),
                              ];

                              if (whtItems.length === 0) {
                                return (
                                  <div className='py-6 text-center text-xs text-secondary-30 bg-primary-50/10'>
                                    No withholding transactions recorded for this period.
                                  </div>
                                );
                              }

                              return whtItems.map((item, idx) => (
                                <div key={idx} className='grid grid-cols-4 px-4 py-3 text-sm border-b border-grey-10/40 bg-white items-center'>
                                  <span className='text-secondary-10 font-medium truncate'>{item.name}</span>
                                  <span className='text-secondary-30 text-xs'>{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                                  <span className='text-secondary-30'>{formatNaira(item.amount)}</span>
                                  <span className='text-primary-30 font-semibold'>{formatNaira(item.wht)}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Render PAYE Breakdown */}
                      {selectedObligation.tax_type.toLowerCase() === 'paye' && (
                        <div className='space-y-4 animate-fadeIn'>
                          <div className='border border-grey-10 rounded-xl overflow-hidden shadow-sm'>
                            <div className='grid grid-cols-4 bg-primary-40 text-white text-xs px-4 py-3 font-medium'>
                              <span>Employee</span>
                              <span>Gross Pay</span>
                              <span>Pension (EE)</span>
                              <span>PAYE Deducted</span>
                            </div>
                            {(() => {
                              const payments = breakdownData.payments || [];
                              if (payments.length === 0) {
                                return (
                                  <div className='py-6 text-center text-xs text-secondary-30 bg-primary-50/10'>
                                    No payroll records generated in this period.
                                  </div>
                                );
                              }
                              return payments.map((p: any, idx: number) => (
                                <div key={idx} className='grid grid-cols-4 px-4 py-3 text-sm border-b border-grey-10/40 bg-white items-center'>
                                  <span className='text-secondary-10 font-medium'>{p.employee_name}</span>
                                  <span className='text-secondary-30'>{formatNaira(p.gross_salary)}</span>
                                  <span className='text-secondary-30'>{formatNaira(p.pension_employee)}</span>
                                  <span className='text-primary-30 font-semibold'>{p.is_paye_exempt ? 'EXEMPT' : formatNaira(p.paye_deducted)}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Render CIT Breakdown */}
                      {selectedObligation.tax_type.toLowerCase() === 'cit' && (
                        <div className='space-y-4 animate-fadeIn text-secondary-10'>
                          <div className='grid grid-cols-2 gap-4'>
                            <div className='p-4 bg-primary-50/30 border border-grey-10 rounded-xl'>
                              <p className='text-xs text-secondary-30 font-medium uppercase'>Annual Revenue</p>
                              <p className='text-xl font-bold mt-1'>{formatNaira(breakdownData.annual_revenue || 0)}</p>
                            </div>
                            <div className='p-4 bg-primary-50/30 border border-grey-10 rounded-xl'>
                              <p className='text-xs text-secondary-30 font-medium uppercase'>Annual Expenses</p>
                              <p className='text-xl font-bold mt-1 text-danger'>{formatNaira(breakdownData.annual_expenses || 0)}</p>
                            </div>
                          </div>

                          <div className='border border-grey-10 rounded-xl p-4 bg-white space-y-3 shadow-sm'>
                            <div className='flex justify-between text-sm'>
                              <span className='text-secondary-30'>Estimated Net Profit</span>
                              <span className='font-semibold'>{formatNaira((breakdownData.annual_revenue || 0) - (breakdownData.annual_expenses || 0))}</span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span className='text-secondary-30'>CIT Company Band</span>
                              <span className='font-semibold text-primary-30 capitalize'>{breakdownData.band || 'Exempt'}</span>
                            </div>
                            <div className='flex justify-between text-sm border-t border-grey-10/40 pt-2.5'>
                              <span className='text-secondary-30'>Company Income Tax Estimate</span>
                              <span className='font-semibold'>{formatNaira(breakdownData.cit_estimate || 0)}</span>
                            </div>
                            <div className='flex justify-between text-sm'>
                              <span className='text-secondary-30'>Education Tax Estimate (3%)</span>
                              <span className='font-semibold'>{formatNaira(breakdownData.education_tax || 0)}</span>
                            </div>
                            <div className='flex justify-between text-base font-bold border-t border-primary-10 pt-3 text-secondary-10'>
                              <span>Total Estimated Due</span>
                              <span className='text-primary-30'>{formatNaira(breakdownData.total_tax_estimate || 0)}</span>
                            </div>
                          </div>

                          {breakdownData.notes && (
                            <div className='p-4 bg-yellow-50 border border-yellow-200/60 rounded-xl flex gap-3 text-xs text-secondary-30 leading-relaxed shadow-sm'>
                              <Icon icon='ph:warning' className='text-lg text-yellow-600 shrink-0 mt-0.5' />
                              <p>{breakdownData.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='py-20 text-center text-sm text-secondary-30 flex-1 flex flex-col justify-center items-center gap-2'>
                <Icon icon='ph:shield-alert' className='text-3xl text-secondary-40' />
                <p>No active obligation selected</p>
              </div>
            )}

            {/* CTAs at the bottom */}
            {selectedObligation && !breakdownLoading && (
              <div className='mt-6 pt-5 border-t border-grey-10'>
                <div className='flex items-center gap-4 mb-4 justify-between'>
                  <div className='flex items-center gap-4'>
                    {selectedObligation.tax_type.toLowerCase() === 'vat' && (
                      <button onClick={() => setShowEdit(true)} className='flex items-center gap-1.5 text-sm font-semibold text-secondary-30 hover:text-secondary-10 transition-colors'>
                        Edit Breakdown <Icon icon='ph:note-pencil' className='text-base' />
                      </button>
                    )}
                    <button 
                      onClick={() => setShowFlag(true)} 
                      disabled={selectedObligation.status.toLowerCase() === 'under_review' || selectedObligation.status.toLowerCase() === 'confirmed' || selectedObligation.status.toLowerCase() === 'filed'}
                      className='flex items-center gap-1.5 text-sm font-semibold text-secondary-30 hover:text-secondary-10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
                    >
                      Flag an Issue <Icon icon='ph:warning' className='text-base' />
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setShowRecordFiling(true)}
                  disabled={selectedObligation.status.toLowerCase() === 'under_review' || selectedObligation.status.toLowerCase() === 'confirmed' || selectedObligation.status.toLowerCase() === 'filed'}
                  className={`w-full py-3 rounded-full text-white text-sm font-semibold transition-all shadow-md flex items-center justify-center gap-2 ${selectedObligation.status.toLowerCase() === 'confirmed' || selectedObligation.status.toLowerCase() === 'filed' ? 'bg-success cursor-default' : (selectedObligation.status.toLowerCase() === 'under_review' ? 'bg-orange-400 cursor-not-allowed' : 'bg-primary-30 hover:bg-primary-40')}`}
                >
                  {selectedObligation.status.toLowerCase() === 'confirmed' || selectedObligation.status.toLowerCase() === 'filed' ? (
                    <>
                      <Icon icon='ph:check-circle-bold' className='text-base' />
                      Filing Remitted & Confirmed
                    </>
                  ) : selectedObligation.status.toLowerCase() === 'under_review' ? (
                    <>
                      <Icon icon='ph:warning-bold' className='text-base' />
                      Filing Paused (Under Review)
                    </>
                  ) : (
                    'Approve & Submit'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Active Obligations */}
          <div className='bg-white rounded-xl border border-grey-10/60 p-6 flex flex-col lg:sticky lg:top-[96px] lg:h-[calc(100vh-180px)] min-h-[550px] shadow-sm overflow-hidden'>
            <div className='flex items-center justify-between mb-4 shrink-0'>
              <div>
                <h2 className='text-base font-semibold text-secondary-10'>Active Obligations</h2>
                <p className='text-xs text-secondary-30 flex items-center gap-1 mt-0.5'>
                  <Icon icon='ph:info' /> Click on item to view more info
                </p>
                {/* Financial Year Info Badge */}
                {profile && (
                  <div className='mt-2 inline-flex items-center gap-1.5 text-[10px] font-medium text-secondary-30 bg-grey-10/50 border border-grey-10 rounded-full px-2.5 py-1'>
                    <Icon icon='ph:calendar-blank' className='shrink-0' />
                    <span>Your Financial Year: <strong className='text-secondary-20'>{getFiscalYearLabel()}</strong></span>
                    <span
                      title={`Your company's fiscal year runs ${getFiscalYearLabel()} annually. CIT is due 6 months after the financial year ends. This is determined by your Tax Profile settings.`}
                      className='cursor-help'
                    >
                      <Icon icon='ph:question' className='text-secondary-40' />
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleRecalculateAll}
                disabled={recalculatingAll || obligationsLoading}
                className='text-xs text-primary-30 hover:text-primary-40 transition-all flex items-center gap-1.5 bg-primary-50 hover:bg-primary-10 rounded-full px-3 py-1.5 font-semibold border border-primary-20/40 shadow-sm disabled:opacity-50 select-none'
              >
                <Icon 
                  icon='ph:arrows-clockwise' 
                  className={`text-sm ${recalculatingAll ? 'animate-spin' : ''}`} 
                />
                {recalculatingAll ? 'Recalculating All...' : 'Recalculate All'}
              </button>
            </div>
            <div className='space-y-3 flex-1 overflow-y-auto min-h-0 pr-1 my-2'>
              {obligationsLoading ? (
                [0, 1, 2, 3].map((i) => (
                  <div key={i} className='bg-white rounded-xl border border-grey-10 p-5 animate-pulse'>
                    <div className='h-3 bg-grey-10 rounded w-24 mb-3' />
                    <div className='h-7 bg-grey-10 rounded w-32 mb-4' />
                    <div className='h-3 bg-grey-10 rounded w-20' />
                  </div>
                ))
              ) : sortedObligations.length === 0 ? (
                <p className='text-sm text-secondary-30 text-center py-4'>
                  No tax obligations found. Use settings to configure your business profile.
                </p>
              ) : (
                sortedObligations.map((ob, i) => {
                  const isSelected = selectedObligation?.id === ob.id;
                  const isAccumulating = ob.status.toLowerCase() === 'pending';
                  const formattedAmount = (isAccumulating ? 'Est. ' : '') + formatNaira(Number(ob.net_liability));

                  return (
                    <div
                      key={ob.id ?? i}
                      onClick={() => {
                        setSelectedObligation(ob);
                        if (window.innerWidth < 1024) {
                          breakdownRef.current?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`border rounded-xl p-4 hover:border-primary-20 cursor-pointer transition-colors shadow-sm relative flex flex-col justify-between ${isSelected ? 'border-primary-30 bg-primary-50/20' : 'border-grey-10 bg-white'}`}
                    >
                      <div className='flex items-start justify-between gap-4'>
                        {/* Left column */}
                        <div className='flex-1 min-w-0'>
                          <p className='text-sm font-semibold text-secondary-10 truncate'>
                            {getTaxTypeName(ob.tax_type, ob.authority)}
                          </p>
                          <p className='text-xs text-secondary-30 mt-1 font-medium'>
                            {getObligationMeta(ob)}
                          </p>
                        </div>

                        {/* Right column */}
                        <div className='flex flex-col items-end shrink-0 gap-2'>
                          {renderStatusBadge(ob.status)}
                          
                          <div className='flex items-center gap-1.5'>
                            <p className='text-sm sm:text-base font-bold text-secondary-10'>
                              {formattedAmount}
                            </p>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecalculate(ob.tax_type);
                              }}
                              disabled={recalculating[ob.tax_type.toLowerCase()]}
                              className='p-1 text-secondary-30 hover:text-primary-30 hover:bg-primary-50 rounded-full transition-all disabled:opacity-50'
                              title="Recalculate obligation"
                            >
                              <Icon 
                                icon='ph:arrows-clockwise' 
                                className={`text-xs ${recalculating[ob.tax_type.toLowerCase()] ? 'animate-spin' : ''}`} 
                              />
                            </button>
                          </div>
                        </div>
                      </div>

                      {getZeroStateExplanation(ob) && (
                        <p className='text-xs text-orange-400 mt-2 font-medium bg-orange-50/50 rounded px-2.5 py-1 inline-block border border-orange-100/50 self-start'>
                          💡 {getZeroStateExplanation(ob)}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            
            <div className='mt-auto pt-4 border-t border-grey-10 shrink-0'>
              <Link href='/settings' className='w-full py-3 block text-center rounded-full bg-primary-40 text-white text-sm font-medium hover:bg-primary-30 transition-colors shadow-sm'>
                Configure Obligations in Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Filing History */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden'>
          <div className='flex items-center justify-between px-6 py-4 border-b border-grey-10/60'>
            <h2 className='text-base font-semibold text-secondary-10'>Filing History</h2>
            <button 
              onClick={handleExportCSV}
              className='flex items-center gap-1.5 border border-grey-10 rounded-full px-4 py-2 text-sm text-secondary-10 hover:bg-primary-50 transition-colors'>
              Export <Icon icon='ph:download-simple' />
            </button>
          </div>

          <div className='flex flex-wrap items-center gap-2 px-6 py-3 border-b border-grey-10/60'>
            {filingTabs.map((t) => (
              <button
                key={t}
                onClick={() => setActiveFilingTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors ${activeFilingTab === t ? 'bg-primary-30 text-white font-medium' : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
              >
                {(() => {
                  const count = tabCounts[t.toUpperCase()] ?? tabCounts[t];
                  return count && count > 0 ? `${t} (${count})` : t;
                })()}
              </button>
            ))}
          </div>

          <div className='overflow-x-auto w-full'>
            <table className='w-full text-sm min-w-[700px]'>
              <thead>
                <tr className='bg-primary-40 text-white text-xs'>
                  {['Period', 'Authority', 'Reference', 'Submitted', 'Amount Filed', 'Status'].map((h) => (
                    <th key={h} className='text-left px-5 py-3 font-medium'>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filingsLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-secondary-30">
                      <div className="flex items-center justify-center gap-2">
                        <Icon icon="ph:circle-notch" className="text-lg animate-spin text-primary-30" />
                        <span>Loading filings...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-secondary-30">
                      No filings recorded yet. Prepare your CSV, submit to FIRS/REV360, and enter the reference code to record.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row, i) => (
                    <tr key={row.id ?? i} className='border-t border-grey-10/40 hover:bg-primary-50/30 transition-colors'>
                      <td className='px-5 py-3.5 text-secondary-10'>{formatPeriod(row.period_start)}</td>
                      <td className='px-5 py-3.5 text-secondary-10'>{row.authority} ({row.tax_type})</td>
                      <td className='px-5 py-3.5 text-secondary-30'>{row.nrs_reference ?? '—'}</td>
                      <td className='px-5 py-3.5 text-secondary-10'>
                        {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className='px-5 py-3.5 font-medium text-secondary-10'>{formatNaira(row.amount_filed)}</td>
                      <td className='px-5 py-3.5'>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getFilingStatusClass(row.status)}`}>
                          {getFilingStatusLabel(row.status)}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className='flex items-center justify-between px-6 py-4 border-t border-grey-10/60'>
            <p className='text-xs text-secondary-30'>Showing {filteredHistory.length} of {filingsList.length}</p>
            <div className='flex items-center gap-1'>
              <button className='w-8 h-8 rounded-full bg-primary-30 text-white text-sm flex items-center justify-center transition-colors'>1</button>
            </div>
            <div className='flex items-center gap-2 text-xs text-secondary-30'>
              Rows:
              <div className='relative'>
                <select className='border border-grey-10 rounded-lg px-2 py-1 text-xs text-secondary-10 outline-none appearance-none pr-5'>
                  <option>10</option><option>20</option><option>50</option>
                </select>
                <Icon icon='ph:caret-down' className='absolute right-1 top-1/2 -translate-y-1/2 text-secondary-30 pointer-events-none text-xs' />
              </div>
            </div>
          </div>
        </div>

        {/* AI Compliance & Audit Center collapsible section */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
          <button 
            onClick={() => setShowComplianceCenter(!showComplianceCenter)}
            className='w-full flex items-center justify-between px-6 py-4 hover:bg-primary-50/20 transition-colors'
          >
            <div className='flex items-center gap-2'>
              <div className={`w-8 h-8 rounded-lg ${activeAnomalies.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'} flex items-center justify-center shrink-0`}>
                <Icon icon={activeAnomalies.length > 0 ? 'ph:shield-warning' : 'ph:shield-check'} className='text-lg' />
              </div>
              <div className='text-left'>
                <h2 className='text-base font-semibold text-secondary-10'>AI Compliance & Audit Center</h2>
                <p className='text-xs text-secondary-30'>Real-time regulatory audits by Elon. Unresolved anomalies require immediate review.</p>
              </div>
            </div>
            <div className='flex items-center gap-3 shrink-0'>
              {activeAnomalies.length > 0 ? (
                <span className='text-xs px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 font-semibold'>
                  {activeAnomalies.length} Anomaly{activeAnomalies.length > 1 ? 'ies' : ''}
                </span>
              ) : (
                <span className='text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 font-semibold'>
                  Fully Compliant
                </span>
              )}
              <Icon 
                icon={showComplianceCenter ? 'ph:caret-up' : 'ph:caret-down'} 
                className='text-secondary-30 text-lg' 
              />
            </div>
          </button>

          {showComplianceCenter && (
            <div className='border-t border-grey-10/60 p-6 bg-primary-50/10 space-y-4'>
              {/* Tabs and Actions Row */}
              <div className='flex flex-wrap items-center justify-between gap-4 border-b border-grey-10/40 pb-3'>
                <div className='flex gap-2'>
                  <button
                    onClick={() => setComplianceTab('active')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${complianceTab === 'active' ? 'bg-primary-30 text-white' : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
                  >
                    Active Alerts ({activeAnomalies.length})
                  </button>
                  <button
                    onClick={() => setComplianceTab('resolved')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${complianceTab === 'resolved' ? 'bg-primary-30 text-white' : 'border border-grey-10 text-secondary-10 hover:bg-primary-50'}`}
                  >
                    Audit History ({resolvedAnomalies.length})
                  </button>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                  {/* Auto-Fix All Button (only visible when there are active anomalies) */}
                  {activeAnomalies.length > 0 && (
                    <button
                      onClick={handleAutoFixAll}
                      disabled={autoFixingAll}
                      className='inline-flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm disabled:opacity-50'
                    >
                      <Icon icon='ph:sparkle-bold' className={autoFixingAll ? 'animate-spin' : ''} />
                      {autoFixingAll ? 'Auto-fixing All...' : 'Auto-Fix All'}
                    </button>
                  )}

                  {/* Export PDF Compliance Report Dropdown */}
                  <div className='relative'>
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className='inline-flex items-center gap-1.5 border border-grey-10 bg-white hover:bg-primary-50 text-secondary-10 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm'
                    >
                      <Icon icon='ph:file-pdf-bold' className='text-red-500' />
                      Export Audit Report
                      <Icon icon='ph:caret-down-bold' className='text-[10px]' />
                    </button>
                    {showExportDropdown && (
                      <div className='absolute right-0 mt-1.5 w-48 bg-white border border-grey-10 rounded-xl shadow-lg z-30 py-1 text-xs text-secondary-10 animate-fade-in'>
                        <button
                          onClick={() => handleDownloadReport('all')}
                          className='w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors'
                        >
                          Export Full Report
                        </button>
                        <button
                          onClick={() => handleDownloadReport('unresolved')}
                          className='w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors'
                        >
                          Export Active Alerts Only
                        </button>
                        <button
                          onClick={() => handleDownloadReport('resolved')}
                          className='w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors'
                        >
                          Export Resolved History Only
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {anomaliesLoading ? (
                <div className='py-8 flex flex-col items-center justify-center gap-2'>
                  <Icon icon='ph:circle-notch' className='text-2xl animate-spin text-primary-30' />
                  <p className='text-xs text-secondary-30'>Loading compliance details...</p>
                </div>
              ) : (
                (() => {
                  const items = complianceTab === 'active' ? activeAnomalies : resolvedAnomalies;
                  if (items.length === 0) {
                    return complianceTab === 'active' ? (
                      <div className='py-8 px-6 bg-white border border-grey-10/40 rounded-xl shadow-sm text-center flex flex-col items-center justify-center gap-2'>
                        <div className='w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500'>
                          <Icon icon='ph:check-circle-bold' className='text-2xl' />
                        </div>
                        <h3 className='text-sm font-semibold text-secondary-10'>Your business is fully tax compliant</h3>
                        <p className='text-xs text-secondary-30 max-w-md mx-auto'>
                          Elon has audited your transactions, invoices, expenses, and payroll. No compliance anomalies detected for the active periods.
                        </p>
                      </div>
                    ) : (
                      <div className='py-8 text-center text-xs text-secondary-30'>
                        No compliance history found.
                      </div>
                    );
                  }

                  return (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {items.map((anomaly) => {
                        const isCritical = anomaly.severity.toLowerCase() === 'critical';
                        const isWarning = anomaly.severity.toLowerCase() === 'warning';
                        
                        let borderStyle = 'border-l-blue-500';
                        let iconName = 'ph:info-bold';
                        let badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
                        
                        if (isCritical) {
                          borderStyle = 'border-l-red-500';
                          iconName = 'ph:warning-octagon-bold';
                          badgeColor = 'bg-red-50 text-red-600 border-red-200';
                        } else if (isWarning) {
                          borderStyle = 'border-l-orange-500';
                          iconName = 'ph:warning-bold';
                          badgeColor = 'bg-orange-50 text-orange-600 border-orange-200';
                        }

                        return (
                          <div 
                            key={anomaly.id} 
                            className={`bg-white border border-grey-10/40 border-l-4 ${borderStyle} rounded-xl p-4 shadow-sm flex flex-col justify-between`}
                          >
                            <div className='space-y-3'>
                              <div className='flex items-center justify-between'>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${badgeColor} tracking-wider`}>
                                  {anomaly.severity}
                                </span>
                                {anomaly.tax_type && (
                                  <span className='text-xs font-semibold text-secondary-30 uppercase'>
                                    {anomaly.tax_type}
                                  </span>
                                )}
                              </div>
                              
                              <div>
                                <h4 className='text-sm font-bold text-secondary-10 flex items-center gap-1.5'>
                                  <Icon icon={iconName} className='text-base shrink-0' />
                                  {anomaly.title}
                                </h4>
                                <p className='text-xs text-secondary-30 mt-1 leading-relaxed'>
                                  {anomaly.description}
                                </p>
                                {anomaly.law_citation_name && anomaly.law_citation_url && (
                                  <a
                                    href={anomaly.law_citation_url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-primary-30 hover:underline bg-primary-50 border border-primary-20/40 rounded-full px-2 py-0.5'
                                  >
                                    <Icon icon='ph:file-pdf-bold' className='text-red-500 text-xs shrink-0' />
                                    Exempt under [{anomaly.law_citation_name}]
                                  </a>
                                )}
                              </div>

                              <div className='bg-primary-50/50 rounded-lg p-3 border border-primary-10/40 text-[11px] text-secondary-20 space-y-1'>
                                <strong className='text-secondary-10 block font-semibold'>Action Required:</strong>
                                <p className='leading-relaxed'>{anomaly.action_required}</p>
                              </div>
                            </div>

                            <div className='flex items-center justify-between gap-3 mt-4 pt-3 border-t border-grey-10/40'>
                              <span className='text-[10px] text-secondary-40'>
                                Detected: {new Date(anomaly.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                              
                              <div className='flex flex-wrap items-center gap-2'>
                                {!anomaly.resolved && (
                                  <Link
                                    href={`/chat?anomalyId=${anomaly.id}`}
                                    className='px-3 py-1 rounded bg-primary-50 text-primary-30 hover:bg-primary-20 text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm'
                                  >
                                    <Icon icon='ph:robot-bold' />
                                    Discuss with Elon
                                  </Link>
                                )}
                                {(() => {
                                  const isAutoFixable = !anomaly.resolved && 
                                    ['vat_exempt_item_charged', 'vat_exemption_violation'].includes(anomaly.anomaly_type) && 
                                    anomaly.entity_type && anomaly.entity_id;
                                  
                                  if (!isAutoFixable) return null;
                                  
                                  return (
                                    <button
                                      onClick={() => handleAutoFixAnomaly(anomaly.id)}
                                      disabled={autoFixingId === anomaly.id}
                                      className='inline-flex items-center gap-1 px-3 py-1 rounded bg-[#10B981] hover:bg-[#059669] text-white text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm'
                                    >
                                      <Icon icon='ph:sparkle-bold' className={autoFixingId === anomaly.id ? 'animate-spin' : ''} />
                                      {autoFixingId === anomaly.id ? 'Fixing...' : 'Auto-Fix'}
                                    </button>
                                  );
                                })()}
                                {anomaly.action_link && !anomaly.resolved && (
                                  <a 
                                    href={anomaly.action_link}
                                    className='px-3 py-1 rounded bg-primary-10 text-primary-30 hover:bg-primary-20 text-xs font-semibold transition-colors shadow-sm'
                                  >
                                    Review
                                  </a>
                                )}
                                {!anomaly.resolved && (
                                  <button
                                    onClick={() => handleResolveAnomaly(anomaly.id)}
                                    className='px-3 py-1 rounded border border-grey-10 text-secondary-10 hover:bg-primary-50 text-xs font-semibold transition-colors shadow-sm'
                                  >
                                    Mark Resolved
                                  </button>
                                )}
                                {anomaly.resolved && (
                                  <span className='text-xs text-green-600 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-200/50 shadow-sm'>
                                    <Icon icon='ph:check-bold' /> Resolved
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>

        {/* AI Tax Law Monitor collapsible section */}
        <div className='bg-white rounded-xl border border-grey-10/60 overflow-hidden shadow-sm'>
          <button 
            onClick={() => setShowLawMonitor(!showLawMonitor)}
            className='w-full flex items-center justify-between px-6 py-4 hover:bg-primary-50/20 transition-colors'
          >
            <div className='flex items-center gap-2'>
              <div className='w-8 h-8 rounded-lg bg-primary-10 flex items-center justify-center text-primary-30'>
                <Icon icon='ph:cpu' className='text-lg' />
              </div>
              <div className='text-left'>
                <h2 className='text-base font-semibold text-secondary-10'>AI Tax Law Monitor</h2>
                <p className='text-xs text-secondary-30'>Automatic daily tracking of FIRS / State IRS regulations</p>
              </div>
            </div>
            <Icon 
              icon={showLawMonitor ? 'ph:caret-up' : 'ph:caret-down'} 
              className='text-secondary-30 text-lg' 
            />
          </button>

          {showLawMonitor && (
            <div className='border-t border-grey-10/60 p-6 space-y-4 bg-primary-50/10'>
              {lawUpdates.length === 0 ? (
                <p className='text-sm text-secondary-30 text-center py-4'>
                  No recent tax law updates detected. The monitor is running and checking official sources daily.
                </p>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {lawUpdates.map((update) => (
                    <div key={update.id} className='bg-white border border-grey-10/40 rounded-xl p-4 shadow-sm flex flex-col justify-between'>
                      <div>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-xs font-semibold px-2 py-0.5 rounded bg-primary-10 text-primary-30 uppercase'>
                            {update.tax_type}
                          </span>
                          <span className='text-xs text-secondary-30'>
                            {new Date(update.detected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <h4 className='text-sm font-semibold text-secondary-10 mb-1 capitalize'>
                          {update.category_code.replace(/_/g, ' ')}
                        </h4>
                        <p className='text-xs text-secondary-30 mb-2'>
                          Rate updated from <span className='line-through'>{(Number(update.old_rate ?? 0) * 100).toFixed(1)}%</span> to <span className='font-semibold text-secondary-10'>{(Number(update.new_rate) * 100).toFixed(1)}%</span>
                        </p>
                        {update.source_law && (
                          <p className='text-[11px] text-primary-30 bg-primary-50/50 rounded px-2 py-1 font-medium inline-block mb-2'>
                            ⚖️ {update.source_law}
                          </p>
                        )}
                      </div>
                      {update.source_url && (
                        <a 
                          href={update.source_url} 
                          target='_blank' 
                          rel='noopener noreferrer'
                          className='text-xs text-primary-30 hover:underline flex items-center gap-1 mt-2 self-start'
                        >
                          View Official Announcement <Icon icon='ph:arrow-square-out' />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showFlag && selectedObligation && (
        <FlagIssueModal 
          onClose={() => setShowFlag(false)} 
          onSubmit={handleFlagIssueSubmit}
          transactions={flagTxns}
          period={formatPeriod(selectedObligation.period_start)}
          authority={selectedObligation.authority}
        />
      )}
      {showRecordFiling && selectedObligation && (
        <RecordFilingModal
          onClose={() => setShowRecordFiling(false)}
          onSubmit={handleRecordFilingSubmit}
          computedAmount={Number(selectedObligation.net_liability)}
          taxType={selectedObligation.tax_type}
          period={formatPeriod(selectedObligation.period_start)}
          authority={selectedObligation.authority}
          grossOutput={Number(selectedObligation.gross_output)}
          grossInput={Number(selectedObligation.gross_input)}
          breakdownData={breakdownData}
          periodStart={selectedObligation.period_start}
          periodEnd={selectedObligation.period_end}
        />
      )}
      {showEdit && (
        <EditVATModal 
          onClose={() => setShowEdit(false)} 
          initialRows={vatBreakdown.map(v => ({
            category: v.category,
            vat: v.collected,
            txns: v.txns
          }))}
          period={stats?.next_filing_date 
            ? new Date(stats.next_filing_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
            : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          }
        />
      )}
    </div>
  );
}
