'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/features/auth/AuthContext';
import { apiClient } from '@/lib/api-client';
import { 
  ArrowLeft, 
  Building, 
  MapPin, 
  User, 
  FileText, 
  Loader2, 
  AlertCircle,
  Save,
  Send,
  CheckCircle,
  Mail,
  CloudSun,
  Users,
  Wrench,
  Package,
  Layers,
  ImageIcon,
  History,
  Lock,
  Trash2,
  Plus,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Project {
  id: number;
  name: string;
  code: string;
  ownerName: string | null;
  supervisorName: string | null;
  contractorName: string | null;
  location: string | null;
  logoUrl: string | null;
  defaultReporterName: string | null;
  defaultReceiver: string | null;
  defaultCc: string | null;
}

interface Report {
  id: number;
  projectId: number;
  reportType: string;
  reportNo: string | null;
  reportDate: string;
  issueDate: string | null;
  title: string | null;
  status: string;
  sourceReportId: number | null;
  createdById: number;
  approvedById: number | null;
  approvedAt: string | null;
  sentAt: string | null;
  project: Project;
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
}

interface WeatherRow {
  id?: number;
  period: string;
  isSunny: boolean;
  isRainy: boolean;
  isNormal: boolean;
  wind: string | null;
  wave: string | null;
  swell: string | null;
  note: string | null;
}

interface ManpowerRow {
  id?: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  previousQuantity: number | null;
  changeQuantity: number | null;
  todayQuantity: number | null;
  managerQuantity: number | null;
  staffQuantity: number | null;
  overtimeQuantity: number | null;
  securityQuantity: number | null;
  note: string | null;
}

interface EquipmentRow {
  id?: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  previousQuantity: number | null;
  changeQuantity: number | null;
  todayQuantity: number | null;
  normalQuantity: number | null;
  repairingQuantity: number | null;
  brokenQuantity: number | null;
  note: string | null;
}

interface MaterialRow {
  id?: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  quantity: number | null;
  note: string | null;
}

// API Responses
interface ApiManpowerRow {
  id: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  previousQuantity: string | number | null;
  changeQuantity: string | number | null;
  todayQuantity: string | number | null;
  managerQuantity: string | number | null;
  staffQuantity: string | number | null;
  overtimeQuantity: string | number | null;
  securityQuantity: string | number | null;
  note: string | null;
}

interface ApiEquipmentRow {
  id: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  previousQuantity: string | number | null;
  changeQuantity: string | number | null;
  todayQuantity: string | number | null;
  normalQuantity: string | number | null;
  repairingQuantity: string | number | null;
  brokenQuantity: string | number | null;
  note: string | null;
}

interface ApiMaterialRow {
  id: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  quantity: string | number | null;
  note: string | null;
}

const editReportSchema = z.object({
  reportNo: z.string().min(1, { message: 'Số báo cáo không được để trống' }),
  title: z.string().min(1, { message: 'Tiêu đề không được để trống' }),
  issueDate: z.string().optional(),
});

type EditReportFormValues = z.infer<typeof editReportSchema>;

type TabKey = 'general' | 'weather' | 'manpower' | 'equipment' | 'materials' | 'workitems' | 'images' | 'history';

export default function ReportEditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const params = useParams();

  const projectId = params.projectId;
  const reportId = params.reportId;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Phase 4 States
  const [weatherRows, setWeatherRows] = useState<WeatherRow[]>([]);
  const [manpowerRows, setManpowerRows] = useState<ManpowerRow[]>([]);
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([]);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);

  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const [tabSuccessMsg, setTabSuccessMsg] = useState<string | null>(null);

  // Authorization flags
  const isAdmin = user?.role === 'ADMIN';
  const isPM = user?.role === 'PROJECT_MANAGER';
  const isReporter = user?.role === 'REPORTER';
  const isReviewer = user?.role === 'REVIEWER';

  const canEdit = isAdmin || isPM || isReporter;
  const canApprove = isAdmin || isPM || isReviewer;
  const canSend = isAdmin || isPM || isReporter;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditReportFormValues>({
    resolver: zodResolver(editReportSchema),
    defaultValues: {
      reportNo: '',
      title: '',
      issueDate: '',
    },
  });

  const fetchReport = async () => {
    if (!reportId) return;
    try {
      const data = await apiClient.get<Report>(`/reports/${reportId}`);
      setReport(data);

      // Pre-fill form values
      setValue('reportNo', data.reportNo || '');
      setValue('title', data.title || '');
      if (data.issueDate) {
        const formattedDate = new Date(data.issueDate).toISOString().slice(0, 10);
        setValue('issueDate', formattedDate);
      } else {
        setValue('issueDate', '');
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Không thể tải thông tin báo cáo');
    }
  };

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (!reportId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient.get<Report>(`/reports/${reportId}`);
        if (active) {
          setReport(data);
          setValue('reportNo', data.reportNo || '');
          setValue('title', data.title || '');
          if (data.issueDate) {
            const formattedDate = new Date(data.issueDate).toISOString().slice(0, 10);
            setValue('issueDate', formattedDate);
          } else {
            setValue('issueDate', '');
          }
          setIsLoading(false);
        }
      } catch (err) {
        const apiError = err as { message?: string };
        if (active) {
          setError(apiError.message || 'Không thể tải thông tin báo cáo');
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, [reportId, setValue]);

  // Load Tab specific data
  useEffect(() => {
    let active = true;
    const loadTabData = async () => {
      if (!reportId) return;
      setTabError(null);
      setTabSuccessMsg(null);
      setTabLoading(true);
      try {
        if (activeTab === 'weather') {
          const data = await apiClient.get<WeatherRow[]>(`/reports/${reportId}/weather`);
          if (active) {
            if (data.length > 0) {
              setWeatherRows(data);
            } else {
              setWeatherRows([
                { period: 'Sáng', isSunny: false, isRainy: false, isNormal: true, wind: '', wave: '', swell: '', note: '' },
                { period: 'Chiều', isSunny: false, isRainy: false, isNormal: true, wind: '', wave: '', swell: '', note: '' },
                { period: 'Tối', isSunny: false, isRainy: false, isNormal: true, wind: '', wave: '', swell: '', note: '' },
              ]);
            }
          }
        } else if (activeTab === 'manpower') {
          const data = await apiClient.get<ApiManpowerRow[]>(`/reports/${reportId}/manpower`);
          if (active) {
            setManpowerRows(data.map(m => ({
              id: m.id,
              name: m.name,
              unit: m.unit || 'Người',
              sortOrder: m.sortOrder,
              previousQuantity: m.previousQuantity ? Number(m.previousQuantity) : 0,
              changeQuantity: m.changeQuantity ? Number(m.changeQuantity) : 0,
              todayQuantity: m.todayQuantity ? Number(m.todayQuantity) : 0,
              managerQuantity: m.managerQuantity ? Number(m.managerQuantity) : 0,
              staffQuantity: m.staffQuantity ? Number(m.staffQuantity) : 0,
              overtimeQuantity: m.overtimeQuantity ? Number(m.overtimeQuantity) : 0,
              securityQuantity: m.securityQuantity ? Number(m.securityQuantity) : 0,
              note: m.note || '',
            })));
          }
        } else if (activeTab === 'equipment') {
          const data = await apiClient.get<ApiEquipmentRow[]>(`/reports/${reportId}/equipment`);
          if (active) {
            setEquipmentRows(data.map(e => ({
              id: e.id,
              name: e.name,
              unit: e.unit || 'Chiếc',
              sortOrder: e.sortOrder,
              previousQuantity: e.previousQuantity ? Number(e.previousQuantity) : 0,
              changeQuantity: e.changeQuantity ? Number(e.changeQuantity) : 0,
              todayQuantity: e.todayQuantity ? Number(e.todayQuantity) : 0,
              normalQuantity: e.normalQuantity ? Number(e.normalQuantity) : 0,
              repairingQuantity: e.repairingQuantity ? Number(e.repairingQuantity) : 0,
              brokenQuantity: e.brokenQuantity ? Number(e.brokenQuantity) : 0,
              note: e.note || '',
            })));
          }
        } else if (activeTab === 'materials') {
          const data = await apiClient.get<ApiMaterialRow[]>(`/reports/${reportId}/materials`);
          if (active) {
            setMaterialRows(data.map(mat => ({
              id: mat.id,
              name: mat.name,
              unit: mat.unit || 'Tấn',
              sortOrder: mat.sortOrder,
              quantity: mat.quantity ? Number(mat.quantity) : 0,
              note: mat.note || '',
            })));
          }
        }
      } catch (err) {
        const apiError = err as { message?: string };
        if (active) {
          setTabError(apiError.message || 'Không thể tải dữ liệu bảng');
        }
      } finally {
        if (active) {
          setTabLoading(false);
        }
      }
    };

    if (['weather', 'manpower', 'equipment', 'materials'].includes(activeTab)) {
      void loadTabData();
    }

    return () => {
      active = false;
    };
  }, [activeTab, reportId]);

  const onSaveMetadata = async (data: EditReportFormValues) => {
    if (!reportId) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmittingAction(true);
    try {
      await apiClient.patch(`/reports/${reportId}`, data);
      setSuccessMsg('Đã lưu thông tin chung thành công');
      await fetchReport();
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Lỗi khi cập nhật báo cáo');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleStatusChange = async (action: 'submit' | 'approve' | 'mark-sent') => {
    if (!reportId) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmittingAction(true);
    try {
      await apiClient.post(`/reports/${reportId}/${action}`, {});
      setSuccessMsg(`Báo cáo đã chuyển trạng thái thành công`);
      await fetchReport();
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || `Lỗi khi thực hiện thao tác`);
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Weather handlers
  const handleWeatherChange = (index: number, field: keyof WeatherRow, value: string | boolean | null) => {
    const updated = [...weatherRows];
    const row = { ...updated[index] };
    
    if (field === 'isSunny' && typeof value === 'boolean') {
      row.isSunny = value;
      if (value) {
        row.isRainy = false;
        row.isNormal = false;
      }
    } else if (field === 'isRainy' && typeof value === 'boolean') {
      row.isRainy = value;
      if (value) {
        row.isSunny = false;
        row.isNormal = false;
      }
    } else if (field === 'isNormal' && typeof value === 'boolean') {
      row.isNormal = value;
      if (value) {
        row.isSunny = false;
        row.isRainy = false;
      }
    } else if (field === 'wind') {
      row.wind = value as string;
    } else if (field === 'wave') {
      row.wave = value as string;
    } else if (field === 'swell') {
      row.swell = value as string;
    } else if (field === 'note') {
      row.note = value as string;
    }
    
    updated[index] = row;
    setWeatherRows(updated);
  };

  const handleSaveWeather = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      await apiClient.put(`/reports/${reportId}/weather`, { rows: weatherRows });
      setTabSuccessMsg('Đã lưu dữ liệu thời tiết thành công!');
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi lưu dữ liệu thời tiết');
    } finally {
      setTabLoading(false);
    }
  };

  // Manpower handlers
  const handleManpowerChange = (index: number, field: keyof ManpowerRow, value: string | number | null) => {
    const updated = [...manpowerRows];
    const row = { ...updated[index] };

    if (field === 'name' && typeof value === 'string') {
      row.name = value;
    } else if (field === 'unit') {
      row.unit = value as string | null;
    } else if (field === 'note') {
      row.note = value as string | null;
    } else if (typeof value === 'number' || value === null) {
      if (field === 'sortOrder') {
        row.sortOrder = value || 0;
      } else if (field === 'previousQuantity') {
        row.previousQuantity = value;
      } else if (field === 'changeQuantity') {
        row.changeQuantity = value;
      } else if (field === 'todayQuantity') {
        row.todayQuantity = value;
      } else if (field === 'managerQuantity') {
        row.managerQuantity = value;
      } else if (field === 'staffQuantity') {
        row.staffQuantity = value;
      } else if (field === 'overtimeQuantity') {
        row.overtimeQuantity = value;
      } else if (field === 'securityQuantity') {
        row.securityQuantity = value;
      }
    }

    if (field === 'previousQuantity' || field === 'changeQuantity') {
      const prev = Number(row.previousQuantity) || 0;
      const change = Number(row.changeQuantity) || 0;
      row.todayQuantity = prev + change;
    }

    updated[index] = row;
    setManpowerRows(updated);
  };

  const handleAddManpowerRow = () => {
    const nextSortOrder = manpowerRows.length > 0
      ? Math.max(...manpowerRows.map(m => m.sortOrder)) + 1
      : 1;
    setManpowerRows([
      ...manpowerRows,
      {
        name: '',
        unit: 'Người',
        sortOrder: nextSortOrder,
        previousQuantity: 0,
        changeQuantity: 0,
        todayQuantity: 0,
        managerQuantity: 0,
        staffQuantity: 0,
        overtimeQuantity: 0,
        securityQuantity: 0,
        note: '',
      }
    ]);
  };

  const handleDeleteManpowerRow = (index: number) => {
    setManpowerRows(manpowerRows.filter((_, i) => i !== index));
  };

  const handleSaveManpower = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      if (manpowerRows.some(r => !r.name.trim())) {
        throw new Error('Tên nhân sự không được để trống ở bất kỳ dòng nào');
      }
      await apiClient.put(`/reports/${reportId}/manpower`, { rows: manpowerRows });
      setTabSuccessMsg('Đã lưu dữ liệu nhân lực thành công!');
      const updated = await apiClient.get<ApiManpowerRow[]>(`/reports/${reportId}/manpower`);
      setManpowerRows(updated.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit || 'Người',
        sortOrder: m.sortOrder,
        previousQuantity: m.previousQuantity ? Number(m.previousQuantity) : 0,
        changeQuantity: m.changeQuantity ? Number(m.changeQuantity) : 0,
        todayQuantity: m.todayQuantity ? Number(m.todayQuantity) : 0,
        managerQuantity: m.managerQuantity ? Number(m.managerQuantity) : 0,
        staffQuantity: m.staffQuantity ? Number(m.staffQuantity) : 0,
        overtimeQuantity: m.overtimeQuantity ? Number(m.overtimeQuantity) : 0,
        securityQuantity: m.securityQuantity ? Number(m.securityQuantity) : 0,
        note: m.note || '',
      })));
    } catch (err) {
      const apiError = err as (Error | { message?: string });
      setTabError(apiError.message || 'Lỗi khi lưu dữ liệu nhân lực');
    } finally {
      setTabLoading(false);
    }
  };

  // Equipment handlers
  const handleEquipmentChange = (index: number, field: keyof EquipmentRow, value: string | number | null) => {
    const updated = [...equipmentRows];
    const row = { ...updated[index] };

    if (field === 'name' && typeof value === 'string') {
      row.name = value;
    } else if (field === 'unit') {
      row.unit = value as string | null;
    } else if (field === 'note') {
      row.note = value as string | null;
    } else if (typeof value === 'number' || value === null) {
      if (field === 'sortOrder') {
        row.sortOrder = value || 0;
      } else if (field === 'previousQuantity') {
        row.previousQuantity = value;
      } else if (field === 'changeQuantity') {
        row.changeQuantity = value;
      } else if (field === 'todayQuantity') {
        row.todayQuantity = value;
      } else if (field === 'normalQuantity') {
        row.normalQuantity = value;
      } else if (field === 'repairingQuantity') {
        row.repairingQuantity = value;
      } else if (field === 'brokenQuantity') {
        row.brokenQuantity = value;
      }
    }

    if (field === 'previousQuantity' || field === 'changeQuantity') {
      const prev = Number(row.previousQuantity) || 0;
      const change = Number(row.changeQuantity) || 0;
      row.todayQuantity = prev + change;
    }

    updated[index] = row;
    setEquipmentRows(updated);
  };

  const handleAddEquipmentRow = () => {
    const nextSortOrder = equipmentRows.length > 0
      ? Math.max(...equipmentRows.map(e => e.sortOrder)) + 1
      : 1;
    setEquipmentRows([
      ...equipmentRows,
      {
        name: '',
        unit: 'Chiếc',
        sortOrder: nextSortOrder,
        previousQuantity: 0,
        changeQuantity: 0,
        todayQuantity: 0,
        normalQuantity: 0,
        repairingQuantity: 0,
        brokenQuantity: 0,
        note: '',
      }
    ]);
  };

  const handleDeleteEquipmentRow = (index: number) => {
    setEquipmentRows(equipmentRows.filter((_, i) => i !== index));
  };

  const handleSaveEquipment = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      if (equipmentRows.some(r => !r.name.trim())) {
        throw new Error('Tên thiết bị không được để trống ở bất kỳ dòng nào');
      }
      await apiClient.put(`/reports/${reportId}/equipment`, { rows: equipmentRows });
      setTabSuccessMsg('Đã lưu dữ liệu thiết bị thành công!');
      const updated = await apiClient.get<ApiEquipmentRow[]>(`/reports/${reportId}/equipment`);
      setEquipmentRows(updated.map(e => ({
        id: e.id,
        name: e.name,
        unit: e.unit || 'Chiếc',
        sortOrder: e.sortOrder,
        previousQuantity: e.previousQuantity ? Number(e.previousQuantity) : 0,
        changeQuantity: e.changeQuantity ? Number(e.changeQuantity) : 0,
        todayQuantity: e.todayQuantity ? Number(e.todayQuantity) : 0,
        normalQuantity: e.normalQuantity ? Number(e.normalQuantity) : 0,
        repairingQuantity: e.repairingQuantity ? Number(e.repairingQuantity) : 0,
        brokenQuantity: e.brokenQuantity ? Number(e.brokenQuantity) : 0,
        note: e.note || '',
      })));
    } catch (err) {
      const apiError = err as (Error | { message?: string });
      setTabError(apiError.message || 'Lỗi khi lưu dữ liệu thiết bị');
    } finally {
      setTabLoading(false);
    }
  };

  // Material handlers
  const handleMaterialChange = (index: number, field: keyof MaterialRow, value: string | number | null) => {
    const updated = [...materialRows];
    const row = { ...updated[index] };

    if (field === 'name' && typeof value === 'string') {
      row.name = value;
    } else if (field === 'unit') {
      row.unit = value as string | null;
    } else if (field === 'note') {
      row.note = value as string | null;
    } else if (field === 'quantity' && (typeof value === 'number' || value === null)) {
      row.quantity = value;
    } else if (field === 'sortOrder' && typeof value === 'number') {
      row.sortOrder = value;
    }

    updated[index] = row;
    setMaterialRows(updated);
  };

  const handleAddMaterialRow = () => {
    const nextSortOrder = materialRows.length > 0
      ? Math.max(...materialRows.map(m => m.sortOrder)) + 1
      : 1;
    setMaterialRows([
      ...materialRows,
      {
        name: '',
        unit: 'Tấn',
        sortOrder: nextSortOrder,
        quantity: 0,
        note: '',
      }
    ]);
  };

  const handleDeleteMaterialRow = (index: number) => {
    setMaterialRows(materialRows.filter((_, i) => i !== index));
  };

  const handleSaveMaterials = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      if (materialRows.some(r => !r.name.trim())) {
        throw new Error('Tên vật liệu không được để trống ở bất kỳ dòng nào');
      }
      await apiClient.put(`/reports/${reportId}/materials`, { rows: materialRows });
      setTabSuccessMsg('Đã lưu dữ liệu vật liệu nhập kho thành công!');
      const updated = await apiClient.get<ApiMaterialRow[]>(`/reports/${reportId}/materials`);
      setMaterialRows(updated.map(mat => ({
        id: mat.id,
        name: mat.name,
        unit: mat.unit || 'Tấn',
        sortOrder: mat.sortOrder,
        quantity: mat.quantity ? Number(mat.quantity) : 0,
        note: mat.note || '',
      })));
    } catch (err) {
      const apiError = err as (Error | { message?: string });
      setTabError(apiError.message || 'Lỗi khi lưu dữ liệu vật liệu');
    } finally {
      setTabLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white tracking-tight">Biên tập báo cáo ngày</h1>
        </div>
        <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const isFinalized = report.status === 'APPROVED' || report.status === 'SENT';

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            Bản nháp
          </span>
        );
      case 'IN_REVIEW':
        return (
          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            Chờ duyệt
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            Đã duyệt
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center rounded-md bg-sky-500/10 px-2.5 py-0.5 text-xs font-semibold text-sky-400 border border-sky-500/20">
            Đã gửi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-500/10 px-2.5 py-0.5 text-xs font-semibold text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  const getReportTypeLabel = (type: string) => {
    if (type === 'DAILY') return 'Báo cáo ngày';
    if (type === 'SUMMARY') return 'Báo cáo tóm tắt';
    if (type === 'V2') return 'Báo cáo V2';
    return type;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-850 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/30 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">{report.title}</h1>
              {renderStatusBadge(report.status)}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Dự án: <span className="text-white font-medium">{report.project.name}</span> | Số báo cáo: <span className="font-mono text-blue-450 font-bold">{report.reportNo}</span> | Ngày báo cáo: <span className="text-slate-200">{new Date(report.reportDate).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}</span>
            </p>
          </div>
        </div>

        {/* Action controls based on status and roles */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Submit Action */}
          {report.status === 'DRAFT' && canEdit && (
            <button
              onClick={() => void handleStatusChange('submit')}
              disabled={isSubmittingAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-650 hover:bg-blue-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Gửi duyệt
            </button>
          )}

          {/* Approve Action */}
          {report.status === 'IN_REVIEW' && canApprove && (
            <button
              onClick={() => void handleStatusChange('approve')}
              disabled={isSubmittingAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-650 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <CheckCircle className="h-4 w-4" />
              Duyệt báo cáo
            </button>
          )}

          {/* Send Action */}
          {report.status === 'APPROVED' && canSend && (
            <button
              onClick={() => void handleStatusChange('mark-sent')}
              disabled={isSubmittingAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-650 hover:bg-sky-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <Mail className="h-4 w-4" />
              Đánh dấu đã gửi
            </button>
          )}

          {/* Return to Project page */}
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white transition"
          >
            Về trang dự án
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-4 text-sm text-emerald-200">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-450" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-sm text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Editor Tabs Navigation */}
      <div className="border-b border-slate-850/80 overflow-x-auto flex gap-2 scrollbar-none">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'general'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          Thông tin chung
        </button>

        <button
          onClick={() => setActiveTab('weather')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'weather'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <CloudSun className="h-4 w-4" />
          Thời tiết
        </button>

        <button
          onClick={() => setActiveTab('manpower')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'manpower'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          Nhân lực
        </button>

        <button
          onClick={() => setActiveTab('equipment')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'equipment'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Wrench className="h-4 w-4" />
          Thiết bị
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'materials'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Package className="h-4 w-4" />
          Vật liệu
        </button>

        <button
          onClick={() => setActiveTab('workitems')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'workitems'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          Khối lượng thi công
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'images'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Hình ảnh
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'history'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          Lịch sử
        </button>
      </div>

      {/* Tabs Content */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-6 shadow-md min-h-[400px]">
        {/* Tab 1: General Info Form */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-4 text-sm text-yellow-200">
                <Lock className="h-5 w-5 shrink-0 text-yellow-450" />
                <span>
                  Báo cáo này đã được <strong>{report.status === 'APPROVED' ? 'duyệt' : 'gửi'}</strong> và bị khóa chỉnh sửa trực tiếp. Để cập nhật dữ liệu, vui lòng thực hiện &quot;Tạo bản điều chỉnh&quot; ở các Phase sau.
                </span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSaveMetadata)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Side: General metadata edit form */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Thông tin Báo cáo
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-350">Số báo cáo *</label>
                      <input
                        type="text"
                        disabled={isFinalized || !canEdit}
                        {...register('reportNo')}
                        className={`mt-2 block w-full rounded-lg bg-slate-950/80 border ${
                          errors.reportNo ? 'border-red-500' : 'border-slate-800'
                        } py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                      />
                      {errors.reportNo && (
                        <p className="mt-1 text-xs text-red-400 font-medium">{errors.reportNo.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-350">Ngày báo cáo (Không thể sửa)</label>
                      <input
                        type="text"
                        disabled
                        value={new Date(report.reportDate).toLocaleDateString('vi-VN', { timeZone: 'UTC' })}
                        className="mt-2 block w-full rounded-lg bg-slate-950/40 border border-slate-850 py-2.5 px-3 text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-350">Tiêu đề báo cáo *</label>
                      <input
                        type="text"
                        disabled={isFinalized || !canEdit}
                        {...register('title')}
                        className={`mt-2 block w-full rounded-lg bg-slate-950/80 border ${
                          errors.title ? 'border-red-500' : 'border-slate-800'
                        } py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 disabled:opacity-50 disabled:cursor-not-allowed transition`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-xs text-red-400 font-medium">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-350">Ngày phát hành</label>
                      <input
                        type="date"
                        disabled={isFinalized || !canEdit}
                        {...register('issueDate')}
                        className="mt-2 block w-full rounded-lg bg-slate-950/80 border border-slate-800 py-2.5 px-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-350">Loại báo cáo</label>
                      <input
                        type="text"
                        disabled
                        value={getReportTypeLabel(report.reportType)}
                        className="mt-2 block w-full rounded-lg bg-slate-950/40 border border-slate-850 py-2.5 px-3 text-slate-500 cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>
                </div>

                {!isFinalized && canEdit && (
                  <div className="pt-4 border-t border-slate-850 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingAction || !isDirty}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer shadow-md hover:shadow-blue-500/10"
                    >
                      <Save className="h-4 w-4" />
                      Lưu thay đổi
                    </button>
                  </div>
                )}
              </div>

              {/* Right Side: Project defaults (Read-only for report reference) */}
              <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-5 h-fit text-sm">
                <h3 className="font-bold text-white tracking-tight border-b border-slate-850 pb-2.5 flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-555" />
                  Mặc định từ dự án
                </h3>

                <div className="space-y-3.5 leading-relaxed text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Chủ đầu tư (ĐD)</span>
                    <p className="text-slate-200 font-semibold">{report.project.ownerName || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Tư vấn giám sát</span>
                    <p className="text-slate-200 font-semibold">{report.project.supervisorName || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Nhà thầu chính</span>
                    <p className="text-slate-200 font-semibold">{report.project.contractorName || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Địa điểm thi công</span>
                    <div className="flex items-center gap-1 text-slate-200 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{report.project.location || '---'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Người lập báo cáo mặc định</span>
                    <div className="flex items-center gap-1 text-slate-200 font-semibold">
                      <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>{report.project.defaultReporterName || '---'}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Nơi nhận mặc định</span>
                    <p className="text-slate-200 font-semibold">{report.project.defaultReceiver || '---'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold uppercase tracking-wider text-3xs">Cc mặc định</span>
                    <p className="text-slate-200 font-semibold">{report.project.defaultCc || '---'}</p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Weather */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-3 text-xs text-yellow-200 mb-4">
                <Lock className="h-4 w-4 shrink-0 text-yellow-450" />
                <span>Báo cáo này đã chốt, không thể chỉnh sửa thời tiết.</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <CloudSun className="h-4 w-4 text-blue-500" />
                Thời tiết công trường
              </h3>
              {!isFinalized && canEdit && (
                <button
                  onClick={handleSaveWeather}
                  disabled={tabLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Lưu thời tiết
                </button>
              )}
            </div>

            {tabError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-3 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{tabError}</span>
              </div>
            )}

            {tabSuccessMsg && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-250">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{tabSuccessMsg}</span>
              </div>
            )}

            {tabLoading && weatherRows.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-555" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-350">
                  <thead>
                    <tr className="border-b border-slate-850 font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-28">Buổi</th>
                      <th className="py-2.5 px-3 text-center w-20">Nắng</th>
                      <th className="py-2.5 px-3 text-center w-20">Mưa</th>
                      <th className="py-2.5 px-3 text-center w-24">Bình thường</th>
                      <th className="py-2.5 px-3 w-36">Gió</th>
                      <th className="py-2.5 px-3 w-36">Sóng</th>
                      <th className="py-2.5 px-3 w-36">Chiều dâng</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {weatherRows.map((row, index) => (
                      <tr key={row.period} className="hover:bg-slate-850/10 transition-colors">
                        <td className="py-3 px-3 font-semibold text-white">{row.period}</td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            disabled={isFinalized || !canEdit}
                            checked={row.isSunny}
                            onChange={(e) => handleWeatherChange(index, 'isSunny', e.target.checked)}
                            className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-550/20 h-4 w-4"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            disabled={isFinalized || !canEdit}
                            checked={row.isRainy}
                            onChange={(e) => handleWeatherChange(index, 'isRainy', e.target.checked)}
                            className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-550/20 h-4 w-4"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            disabled={isFinalized || !canEdit}
                            checked={row.isNormal}
                            onChange={(e) => handleWeatherChange(index, 'isNormal', e.target.checked)}
                            className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-blue-550/20 h-4 w-4"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={row.wind || ''}
                            onChange={(e) => handleWeatherChange(index, 'wind', e.target.value)}
                            placeholder="Ví dụ: Nhẹ"
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 transition text-xs"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={row.wave || ''}
                            onChange={(e) => handleWeatherChange(index, 'wave', e.target.value)}
                            placeholder="Ví dụ: Êm"
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 transition text-xs"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={row.swell || ''}
                            onChange={(e) => handleWeatherChange(index, 'swell', e.target.value)}
                            placeholder="Ví dụ: Thấp"
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 transition text-xs"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={row.note || ''}
                            onChange={(e) => handleWeatherChange(index, 'note', e.target.value)}
                            placeholder="Ghi chú thêm..."
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 transition text-xs"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Manpower */}
        {activeTab === 'manpower' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-3 text-xs text-yellow-200 mb-4">
                <Lock className="h-4 w-4 shrink-0 text-yellow-450" />
                <span>Báo cáo này đã chốt, không thể chỉnh sửa nhân lực.</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Nhân lực thi công
              </h3>
              <div className="flex items-center gap-2">
                {!isFinalized && canEdit && (
                  <>
                    <button
                      onClick={handleAddManpowerRow}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm dòng
                    </button>
                    <button
                      onClick={handleSaveManpower}
                      disabled={tabLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Lưu nhân lực
                    </button>
                  </>
                )}
              </div>
            </div>

            {tabError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-3 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{tabError}</span>
              </div>
            )}

            {tabSuccessMsg && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-255">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{tabSuccessMsg}</span>
              </div>
            )}

            {tabLoading && manpowerRows.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-555" />
              </div>
            ) : manpowerRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <Users className="h-8 w-8 text-slate-700 mb-2" />
                <h4 className="text-xs font-semibold text-slate-400">Không có dòng dữ liệu nào</h4>
                <p className="text-3xs text-slate-500 mt-1 mb-3">Hãy bấm nút &quot;Thêm dòng&quot; để tạo bản ghi mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-350 table-fixed min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-850 font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-2 w-[18%]">Tên nhân sự *</th>
                      <th className="py-2.5 px-2 w-[8%] text-center">Đơn vị</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Lũy kế trước</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Thay đổi</th>
                      <th className="py-2.5 px-2 text-right w-[11%]">Hôm nay</th>
                      <th className="py-2.5 px-2 text-right w-[8%]">Quản lý</th>
                      <th className="py-2.5 px-2 text-right w-[8%]">Nhân viên</th>
                      <th className="py-2.5 px-2 text-right w-[8%]">T.Thêm</th>
                      <th className="py-2.5 px-2 text-right w-[8%]">B.Vệ</th>
                      <th className="py-2.5 px-2 w-[13%]">Ghi chú</th>
                      {!isFinalized && canEdit && <th className="py-2.5 px-2 text-right w-[4%]"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {manpowerRows.map((row, index) => {
                      const prev = Number(row.previousQuantity) || 0;
                      const change = Number(row.changeQuantity) || 0;
                      const today = Number(row.todayQuantity) || 0;
                      const isMismatch = today !== prev + change;

                      return (
                        <tr key={index} className="hover:bg-slate-850/10 transition-colors">
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit}
                              value={row.name}
                              onChange={(e) => handleManpowerChange(index, 'name', e.target.value)}
                              placeholder="Ví dụ: Thợ hàn"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit}
                              value={row.unit || ''}
                              onChange={(e) => handleManpowerChange(index, 'unit', e.target.value)}
                              placeholder="Người"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-center"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.previousQuantity ?? ''}
                              onChange={(e) => handleManpowerChange(index, 'previousQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.changeQuantity ?? ''}
                              onChange={(e) => handleManpowerChange(index, 'changeQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                disabled={isFinalized || !canEdit}
                                value={row.todayQuantity ?? ''}
                                onChange={(e) => handleManpowerChange(index, 'todayQuantity', e.target.value === '' ? null : Number(e.target.value))}
                                placeholder="0"
                                className={`w-full rounded bg-slate-950/80 border py-1 px-1 text-xs text-right ${
                                  isMismatch 
                                    ? 'border-yellow-600/80 text-yellow-400 focus:ring-yellow-500' 
                                    : 'border-slate-800 text-white focus:ring-blue-550'
                                }`}
                              />
                              {isMismatch && (
                                <AlertTriangle 
                                  className="h-4 w-4 text-yellow-500 shrink-0 cursor-help" 
                                  title={`Số liệu lệch! Trước (${prev}) + Thay đổi (${change}) = ${prev + change}, nhưng nhập là ${today}`}
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.managerQuantity ?? ''}
                              onChange={(e) => handleManpowerChange(index, 'managerQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.staffQuantity ?? ''}
                              onChange={(e) => handleManpowerChange(index, 'staffQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.overtimeQuantity ?? ''}
                              onChange={(e) => handleManpowerChange(index, 'overtimeQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.securityQuantity ?? ''}
                              onChange={(e) => handleManpowerChange(index, 'securityQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit}
                              value={row.note || ''}
                              onChange={(e) => handleManpowerChange(index, 'note', e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs"
                            />
                          </td>
                          {!isFinalized && canEdit && (
                            <td className="py-2 px-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteManpowerRow(index)}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-850 hover:border-red-800 bg-slate-950/50 hover:bg-red-950/20 text-slate-450 hover:text-red-400 transition"
                                title="Xóa dòng"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Equipment */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-3 text-xs text-yellow-200 mb-4">
                <Lock className="h-4 w-4 shrink-0 text-yellow-450" />
                <span>Báo cáo này đã chốt, không thể chỉnh sửa thiết bị.</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Wrench className="h-4 w-4 text-blue-500" />
                Thiết bị thi công
              </h3>
              <div className="flex items-center gap-2">
                {!isFinalized && canEdit && (
                  <>
                    <button
                      onClick={handleAddEquipmentRow}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm dòng
                    </button>
                    <button
                      onClick={handleSaveEquipment}
                      disabled={tabLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Lưu thiết bị
                    </button>
                  </>
                )}
              </div>
            </div>

            {tabError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-3 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{tabError}</span>
              </div>
            )}

            {tabSuccessMsg && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-255">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{tabSuccessMsg}</span>
              </div>
            )}

            {tabLoading && equipmentRows.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-555" />
              </div>
            ) : equipmentRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <Wrench className="h-8 w-8 text-slate-700 mb-2" />
                <h4 className="text-xs font-semibold text-slate-400">Không có dòng dữ liệu nào</h4>
                <p className="text-3xs text-slate-500 mt-1 mb-3">Hãy bấm nút &quot;Thêm dòng&quot; để tạo bản ghi mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-355 table-fixed min-w-[800px]">
                  <thead>
                    <tr className="border-b border-slate-850 font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-2 w-[22%]">Tên thiết bị *</th>
                      <th className="py-2.5 px-2 w-[8%] text-center">Đơn vị</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Lũy kế trước</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Thay đổi</th>
                      <th className="py-2.5 px-2 text-right w-[11%]">Hôm nay</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Hoạt động</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Sửa chữa</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Hỏng hóc</th>
                      <th className="py-2.5 px-2 w-[11%]">Ghi chú</th>
                      {!isFinalized && canEdit && <th className="py-2.5 px-2 text-right w-[4%]"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {equipmentRows.map((row, index) => {
                      const prev = Number(row.previousQuantity) || 0;
                      const change = Number(row.changeQuantity) || 0;
                      const today = Number(row.todayQuantity) || 0;
                      const normal = Number(row.normalQuantity) || 0;
                      const repairing = Number(row.repairingQuantity) || 0;
                      const broken = Number(row.brokenQuantity) || 0;

                      const isSumMismatch = today !== prev + change;
                      const isStateMismatch = today !== normal + repairing + broken;
                      const hasWarning = isSumMismatch || isStateMismatch;

                      let warningTitle = '';
                      if (isSumMismatch) warningTitle += `Số liệu lệch: Trước (${prev}) + Thay đổi (${change}) = ${prev + change} != Hôm nay (${today}). `;
                      if (isStateMismatch) warningTitle += `Hiện trạng lệch: Hoạt động (${normal}) + Sửa chữa (${repairing}) + Hỏng (${broken}) = ${normal + repairing + broken} != Hôm nay (${today}).`;

                      return (
                        <tr key={index} className="hover:bg-slate-850/10 transition-colors">
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit}
                              value={row.name}
                              onChange={(e) => handleEquipmentChange(index, 'name', e.target.value)}
                              placeholder="Ví dụ: Máy xúc bánh xích"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs font-semibold"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit}
                              value={row.unit || ''}
                              onChange={(e) => handleEquipmentChange(index, 'unit', e.target.value)}
                              placeholder="Chiếc"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-center"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.previousQuantity ?? ''}
                              onChange={(e) => handleEquipmentChange(index, 'previousQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.changeQuantity ?? ''}
                              onChange={(e) => handleEquipmentChange(index, 'changeQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                disabled={isFinalized || !canEdit}
                                value={row.todayQuantity ?? ''}
                                onChange={(e) => handleEquipmentChange(index, 'todayQuantity', e.target.value === '' ? null : Number(e.target.value))}
                                placeholder="0"
                                className={`w-full rounded bg-slate-950/80 border py-1 px-1 text-xs text-right ${
                                  hasWarning 
                                    ? 'border-yellow-600/80 text-yellow-450 focus:ring-yellow-500' 
                                    : 'border-slate-800 text-white focus:ring-blue-550'
                                }`}
                              />
                              {hasWarning && (
                                <AlertTriangle 
                                  className="h-4 w-4 text-yellow-500 shrink-0 cursor-help" 
                                  title={warningTitle.trim()}
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.normalQuantity ?? ''}
                              onChange={(e) => handleEquipmentChange(index, 'normalQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.repairingQuantity ?? ''}
                              onChange={(e) => handleEquipmentChange(index, 'repairingQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit}
                              value={row.brokenQuantity ?? ''}
                              onChange={(e) => handleEquipmentChange(index, 'brokenQuantity', e.target.value === '' ? null : Number(e.target.value))}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit}
                              value={row.note || ''}
                              onChange={(e) => handleEquipmentChange(index, 'note', e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs"
                            />
                          </td>
                          {!isFinalized && canEdit && (
                            <td className="py-2 px-1 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteEquipmentRow(index)}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-850 hover:border-red-800 bg-slate-950/50 hover:bg-red-950/20 text-slate-450 hover:text-red-400 transition"
                                title="Xóa dòng"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Materials */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-3 text-xs text-yellow-200 mb-4">
                <Lock className="h-4 w-4 shrink-0 text-yellow-450" />
                <span>Báo cáo này đã chốt, không thể chỉnh sửa vật liệu.</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                Vật liệu nhập kho
              </h3>
              <div className="flex items-center gap-2">
                {!isFinalized && canEdit && (
                  <>
                    <button
                      onClick={handleAddMaterialRow}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm dòng
                    </button>
                    <button
                      onClick={handleSaveMaterials}
                      disabled={tabLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Lưu vật liệu
                    </button>
                  </>
                )}
              </div>
            </div>

            {tabError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-3 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{tabError}</span>
              </div>
            )}

            {tabSuccessMsg && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-255">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{tabSuccessMsg}</span>
              </div>
            )}

            {tabLoading && materialRows.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-555" />
              </div>
            ) : materialRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <Package className="h-8 w-8 text-slate-700 mb-2" />
                <h4 className="text-xs font-semibold text-slate-400">Không có dòng dữ liệu nào</h4>
                <p className="text-3xs text-slate-500 mt-1 mb-3">Hãy bấm nút &quot;Thêm dòng&quot; để tạo bản ghi mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs text-slate-350 table-fixed min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-850 font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-2.5 px-2 w-[40%]">Tên vật liệu *</th>
                      <th className="py-2.5 px-2 w-[15%] text-center">Đơn vị</th>
                      <th className="py-2.5 px-2 text-right w-[15%]">Số lượng nhập</th>
                      <th className="py-2.5 px-2 w-[25%]">Ghi chú</th>
                      {!isFinalized && canEdit && <th className="py-2.5 px-2 text-right w-[5%]"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {materialRows.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-850/10 transition-colors">
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={row.name}
                            onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                            placeholder="Ví dụ: Cát hạt vàng"
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={row.unit || ''}
                            onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                            placeholder="m3"
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-center"
                          />
                        </td>
                        <td className="py-2 px-1 text-right">
                          <input
                            type="number"
                            disabled={isFinalized || !canEdit}
                            value={row.quantity ?? ''}
                            onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value === '' ? null : Number(e.target.value))}
                            placeholder="0"
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-slate-205 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={row.note || ''}
                            onChange={(e) => handleMaterialChange(index, 'note', e.target.value)}
                            placeholder="Ghi chú nhập..."
                            className="w-full rounded bg-slate-950/80 border border-slate-800 py-1.5 px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs"
                          />
                        </td>
                        {!isFinalized && canEdit && (
                          <td className="py-2 px-1 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteMaterialRow(index)}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md border border-slate-850 hover:border-red-800 bg-slate-950/50 hover:bg-red-950/20 text-slate-455 hover:text-red-400 transition"
                              title="Xóa dòng"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Work Items Grid Placeholder */}
        {activeTab === 'workitems' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Khối lượng hạng mục thi công (Excel-like Grid)</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-md">
              Tính năng nhập bảng khối lượng dạng cây phân cấp, tự động tính lũy kế và phần trăm hoàn thành, copy/paste trực tiếp từ Excel sẽ khả dụng trong **Phase 5: Work Item Excel-like Grid**.
            </p>
          </div>
        )}

        {/* Tab 7: Images Placeholder */}
        {activeTab === 'images' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Hình ảnh thi công & Sơ họa</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              Tính năng tải lên, resize ảnh, ghi chú thích và sắp xếp thứ tự ảnh hiển thị sẽ khả dụng trong **Phase 6: Image Management**.
            </p>
          </div>
        )}

        {/* Tab 8: Audit History Placeholder */}
        {activeTab === 'history' && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-semibold text-slate-350">Lịch sử Chỉnh sửa & Phiên bản</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-md">
              Tính năng so sánh sự khác biệt giữa các phiên bản, quản lý version điều chỉnh và ghi audit log chi tiết đến cấp độ ô sẽ khả dụng trong **Phase 10: Versioning + Audit Log nâng cao**.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
