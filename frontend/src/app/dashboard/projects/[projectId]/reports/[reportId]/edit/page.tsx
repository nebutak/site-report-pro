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
  AlertTriangle,
  Upload
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
  messageContent?: string | null;
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

interface WorkItemRow {
  id?: number;
  tempId?: string;
  parentId?: number | null;
  tempParentId?: string | null;
  sortOrder: number;
  level: number;
  code: string | null;
  name: string;
  unit: string | null;
  designQuantity: number | null;
  previousAccumulatedQuantity: number | null;
  todayQuantity: number | null;
  currentAccumulatedQuantity: number | null;
  completionPercent: number | null;
  personInCharge: string | null;
  note: string | null;
  isGroup: boolean;
  isLocked: boolean;
  formula: unknown;
}

interface ApiWorkItemRow {
  id: number;
  parentId: number | null;
  sortOrder: number;
  level: number;
  code: string | null;
  name: string;
  unit: string | null;
  designQuantity: string | number | null;
  previousAccumulatedQuantity: string | number | null;
  todayQuantity: string | number | null;
  currentAccumulatedQuantity: string | number | null;
  completionPercent: string | number | null;
  personInCharge: string | null;
  note: string | null;
  isGroup: boolean;
  isLocked: boolean;
  formula: unknown;
}

interface ReportImage {
  id: number;
  reportId: number;
  fileUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  sortOrder: number;
  sizeBytes?: number | null;
  mimeType?: string | null;
}

interface ReportExport {
  id: number;
  reportId: number;
  versionId: number | null;
  format: string;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  createdById: number | null;
  createdAt: string;
}

interface ReportVersion {
  id: number;
  reportId: number;
  versionNo: number;
  snapshot: unknown;
  changeReason: string | null;
  createdById: number;
  createdAt: string;
  createdBy: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface AuditLog {
  id: number;
  userId: number | null;
  projectId: number | null;
  reportId: number | null;
  entityType: string;
  entityId: number | null;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  reason: string | null;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
}

const editReportSchema = z.object({
  reportNo: z.string().min(1, { message: 'Số báo cáo không được để trống' }),
  title: z.string().min(1, { message: 'Tiêu đề không được để trống' }),
  issueDate: z.string().optional(),
});

type EditReportFormValues = z.infer<typeof editReportSchema>;

type TabKey = 'general' | 'message' | 'weather' | 'manpower' | 'equipment' | 'materials' | 'workitems' | 'images' | 'export' | 'history';

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

  // Phase 4 & 5 States
  const [weatherRows, setWeatherRows] = useState<WeatherRow[]>([]);
  const [manpowerRows, setManpowerRows] = useState<ManpowerRow[]>([]);
  const [equipmentRows, setEquipmentRows] = useState<EquipmentRow[]>([]);
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([]);
  const [workItemRows, setWorkItemRows] = useState<WorkItemRow[]>([]);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState('');
  const [isImportingExcelFile, setIsImportingExcelFile] = useState(false);
  const [reportImages, setReportImages] = useState<ReportImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [tabLoading, setTabLoading] = useState(false);
  const [tabError, setTabError] = useState<string | null>(null);
  const [tabSuccessMsg, setTabSuccessMsg] = useState<string | null>(null);

  // Phase 7 States
  const [exportHistory, setExportHistory] = useState<ReportExport[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [localMessageContent, setLocalMessageContent] = useState('');
  const [isExportingTxt, setIsExportingTxt] = useState(false);

  // Phase 10 States
  const [reportVersions, setReportVersions] = useState<ReportVersion[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ReportVersion | null>(null);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [snapshotActiveTab, setSnapshotActiveTab] = useState<'weather' | 'manpower' | 'equipment' | 'materials' | 'workitems' | 'images'>('weather');
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [changeReasonText, setChangeReasonText] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);


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
      setLocalMessageContent(data.messageContent || '');

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
          setLocalMessageContent(data.messageContent || '');
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

  const handleRegenerateMessage = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      const res = await apiClient.post<{ messageContent: string }>(`/reports/${reportId}/regenerate-message`, {});
      setLocalMessageContent(res.messageContent);
      setTabSuccessMsg('Sinh lại lời dẫn thành công!');
      if (report) {
        setReport({ ...report, messageContent: res.messageContent });
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi sinh lại lời dẫn');
    } finally {
      setTabLoading(false);
    }
  };

  const handleSaveMessage = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      await apiClient.patch(`/reports/${reportId}`, { messageContent: localMessageContent });
      setTabSuccessMsg('Đã lưu lời dẫn thành công!');
      if (report) {
        setReport({ ...report, messageContent: localMessageContent });
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi lưu lời dẫn');
    } finally {
      setTabLoading(false);
    }
  };

  const handleExportTxt = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setIsExportingTxt(true);
    try {
      await apiClient.post<ReportExport>(`/reports/${reportId}/export`, { format: 'TXT' });
      setTabSuccessMsg('Kết xuất báo cáo TXT thành công!');
      const data = await apiClient.get<ReportExport[]>(`/reports/${reportId}/exports`);
      setExportHistory(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi kết xuất báo cáo TXT');
    } finally {
      setIsExportingTxt(false);
    }
  };

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
        } else if (activeTab === 'workitems') {
          const data = await apiClient.get<ApiWorkItemRow[]>(`/reports/${reportId}/work-items`);
          if (active) {
            setWorkItemRows(data.map(w => ({
              id: w.id,
              parentId: w.parentId,
              sortOrder: w.sortOrder,
              level: w.level,
              code: w.code,
              name: w.name,
              unit: w.unit,
              designQuantity: w.designQuantity ? Number(w.designQuantity) : null,
              previousAccumulatedQuantity: w.previousAccumulatedQuantity ? Number(w.previousAccumulatedQuantity) : null,
              todayQuantity: w.todayQuantity ? Number(w.todayQuantity) : null,
              currentAccumulatedQuantity: w.currentAccumulatedQuantity ? Number(w.currentAccumulatedQuantity) : null,
              completionPercent: w.completionPercent ? Number(w.completionPercent) : null,
              personInCharge: w.personInCharge,
              note: w.note,
              isGroup: w.isGroup,
              isLocked: w.isLocked,
              formula: w.formula,
            })));
          }
        } else if (activeTab === 'images') {
          const data = await apiClient.get<ReportImage[]>(`/reports/${reportId}/images`);
          if (active) {
            setReportImages(data);
          }
        } else if (activeTab === 'export') {
          const data = await apiClient.get<ReportExport[]>(`/reports/${reportId}/exports`);
          if (active) {
            setExportHistory(data);
          }
        } else if (activeTab === 'history') {
          const versionsData = await apiClient.get<ReportVersion[]>(`/reports/${reportId}/versions`);
          const logsData = await apiClient.get<AuditLog[]>(`/reports/${reportId}/audit-logs`);
          if (active) {
            setReportVersions(versionsData);
            setAuditLogs(logsData);
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

    if (['weather', 'manpower', 'equipment', 'materials', 'workitems', 'images', 'export', 'history'].includes(activeTab)) {
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

  const handleCreateAdjustment = async () => {
    if (!reportId || !changeReasonText.trim()) return;
    setIsSubmittingAdjustment(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiClient.post(`/reports/${reportId}/adjustment`, { changeReason: changeReasonText });
      setSuccessMsg('Tạo bản điều chỉnh thành công, báo cáo đã được chuyển về trạng thái Bản nháp (DRAFT).');
      setIsAdjustmentModalOpen(false);
      setChangeReasonText('');
      await fetchReport();
      if (activeTab === 'history') {
        const versionsData = await apiClient.get<ReportVersion[]>(`/reports/${reportId}/versions`);
        const logsData = await apiClient.get<AuditLog[]>(`/reports/${reportId}/audit-logs`);
        setReportVersions(versionsData);
        setAuditLogs(logsData);
      }
    } catch (err) {
      const apiError = err as { message?: string };
      setError(apiError.message || 'Lỗi khi tạo bản điều chỉnh');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const handleExportPdf = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setIsExporting(true);
    try {
      await apiClient.post<ReportExport>(`/reports/${reportId}/export`, { format: 'PDF' });
      setTabSuccessMsg('Kết xuất báo cáo PDF thành công!');
      const data = await apiClient.get<ReportExport[]>(`/reports/${reportId}/exports`);
      setExportHistory(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi kết xuất báo cáo PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setIsExportingExcel(true);
    try {
      await apiClient.post<ReportExport>(`/reports/${reportId}/export`, { format: 'EXCEL' });
      setTabSuccessMsg('Kết xuất báo cáo Excel thành công!');
      const data = await apiClient.get<ReportExport[]>(`/reports/${reportId}/exports`);
      setExportHistory(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi kết xuất báo cáo Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportWord = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setIsExportingWord(true);
    try {
      await apiClient.post<ReportExport>(`/reports/${reportId}/export`, { format: 'WORD' });
      setTabSuccessMsg('Kết xuất báo cáo Word thành công!');
      const data = await apiClient.get<ReportExport[]>(`/reports/${reportId}/exports`);
      setExportHistory(data);
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi kết xuất báo cáo Word');
    } finally {
      setIsExportingWord(false);
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

  // Work Items handlers
  const recalculateWorkItemTotals = (rows: WorkItemRow[]): WorkItemRow[] => {
    const newRows = rows.map(r => ({ ...r }));
    
    const calcRow = (idx: number) => {
      const row = newRows[idx];
      if (!row) return;

      if (row.isGroup) {
        let designSum = 0;
        let prevSum = 0;
        let todaySum = 0;
        let currentSum = 0;
        let hasAnyChild = false;

        for (let i = idx + 1; i < newRows.length; i++) {
          const child = newRows[i];
          if (child.level <= row.level) break;
          
          if (child.level === row.level + 1) {
            if (child.isGroup) {
              calcRow(i);
            } else {
              const childPrev = child.previousAccumulatedQuantity || 0;
              const childToday = child.todayQuantity || 0;
              child.currentAccumulatedQuantity = childPrev + childToday;
              child.completionPercent = (child.designQuantity && child.designQuantity > 0)
                ? (child.currentAccumulatedQuantity / child.designQuantity) * 100
                : null;
            }
            
            designSum += child.designQuantity || 0;
            prevSum += child.previousAccumulatedQuantity || 0;
            todaySum += child.todayQuantity || 0;
            currentSum += child.currentAccumulatedQuantity || 0;
            hasAnyChild = true;
          }
        }

        row.designQuantity = hasAnyChild ? designSum : 0;
        row.previousAccumulatedQuantity = hasAnyChild ? prevSum : 0;
        row.todayQuantity = hasAnyChild ? todaySum : 0;
        row.currentAccumulatedQuantity = hasAnyChild ? currentSum : 0;
        row.completionPercent = row.designQuantity > 0
          ? (row.currentAccumulatedQuantity / row.designQuantity) * 100
          : null;
      } else {
        const prev = row.previousAccumulatedQuantity || 0;
        const today = row.todayQuantity || 0;
        row.currentAccumulatedQuantity = prev + today;
        row.completionPercent = (row.designQuantity && row.designQuantity > 0)
          ? (row.currentAccumulatedQuantity / row.designQuantity) * 100
          : null;
      }
    };

    const groupIndices: { idx: number; level: number }[] = [];
    newRows.forEach((r, i) => {
      if (r.isGroup) {
        groupIndices.push({ idx: i, level: r.level });
      } else {
        const prev = r.previousAccumulatedQuantity || 0;
        const today = r.todayQuantity || 0;
        r.currentAccumulatedQuantity = prev + today;
        r.completionPercent = (r.designQuantity && r.designQuantity > 0)
          ? (r.currentAccumulatedQuantity / r.designQuantity) * 100
          : null;
      }
    });

    groupIndices.sort((a, b) => b.level - a.level);
    
    for (const grp of groupIndices) {
      calcRow(grp.idx);
    }

    return newRows;
  };

  const handleWorkItemChange = (
    index: number,
    field: keyof WorkItemRow,
    value: string | number | boolean | null
  ) => {
    const updated = [...workItemRows];
    const row = { ...updated[index] };

    if (field === 'name' && typeof value === 'string') {
      row.name = value;
    } else if (field === 'code') {
      row.code = value as string | null;
    } else if (field === 'unit') {
      row.unit = value as string | null;
    } else if (field === 'personInCharge') {
      row.personInCharge = value as string | null;
    } else if (field === 'note') {
      row.note = value as string | null;
    } else if (field === 'isGroup' && typeof value === 'boolean') {
      row.isGroup = value;
    } else if (field === 'isLocked' && typeof value === 'boolean') {
      row.isLocked = value;
    } else if (typeof value === 'number' || value === null) {
      if (field === 'designQuantity') {
        row.designQuantity = value;
      } else if (field === 'previousAccumulatedQuantity') {
        row.previousAccumulatedQuantity = value;
      } else if (field === 'todayQuantity') {
        row.todayQuantity = value;
      }
    }

    updated[index] = row;
    const recalculated = recalculateWorkItemTotals(updated);
    setWorkItemRows(recalculated);
  };

  const handleAddWorkItemRow = (index?: number, type: 'sibling' | 'child' = 'sibling') => {
    const updated = [...workItemRows];
    const tempId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let insertIndex = updated.length;
    let level = 0;
    let parentId: number | null = null;
    let tempParentId: string | null = null;

    if (index !== undefined && index >= 0 && index < updated.length) {
      const currentRow = updated[index];
      
      if (type === 'sibling') {
        level = currentRow.level;
        parentId = currentRow.parentId || null;
        tempParentId = currentRow.tempParentId || null;
        
        insertIndex = index + 1;
        while (insertIndex < updated.length && updated[insertIndex].level > currentRow.level) {
          insertIndex++;
        }
      } else {
        level = currentRow.level + 1;
        if (currentRow.id) {
          parentId = currentRow.id;
        } else {
          tempParentId = currentRow.tempId || null;
        }
        
        currentRow.isGroup = true;
        insertIndex = index + 1;
      }
    }

    const newRow: WorkItemRow = {
      tempId,
      parentId,
      tempParentId,
      sortOrder: 0,
      level,
      code: '',
      name: '',
      unit: '',
      designQuantity: 0,
      previousAccumulatedQuantity: 0,
      todayQuantity: 0,
      currentAccumulatedQuantity: 0,
      completionPercent: 0,
      personInCharge: '',
      note: '',
      isGroup: false,
      isLocked: false,
      formula: null,
    };

    updated.splice(insertIndex, 0, newRow);
    
    const sorted = updated.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    const recalculated = recalculateWorkItemTotals(sorted);
    setWorkItemRows(recalculated);
  };

  const handleDeleteWorkItemRow = (index: number) => {
    const updated = [...workItemRows];
    const row = updated[index];
    if (!row) return;

    let deleteCount = 1;
    while (index + deleteCount < updated.length && updated[index + deleteCount].level > row.level) {
      deleteCount++;
    }

    updated.splice(index, deleteCount);

    const sorted = updated.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    const recalculated = recalculateWorkItemTotals(sorted);
    setWorkItemRows(recalculated);
  };

  const handleIndentWorkItemRow = (index: number) => {
    if (index <= 0) return;
    const updated = [...workItemRows];
    const row = { ...updated[index] };
    const prevRow = updated[index - 1];

    if (row.level <= prevRow.level) {
      row.level = row.level + 1;
      
      if (prevRow.id) {
        row.parentId = prevRow.id;
        row.tempParentId = null;
      } else {
        row.parentId = null;
        row.tempParentId = prevRow.tempId || null;
      }
      prevRow.isGroup = true;

      updated[index] = row;
      const recalculated = recalculateWorkItemTotals(updated);
      setWorkItemRows(recalculated);
    }
  };

  const handleOutdentWorkItemRow = (index: number) => {
    const updated = [...workItemRows];
    const row = { ...updated[index] };
    if (row.level <= 0) return;

    const newLevel = row.level - 1;
    row.level = newLevel;

    let newParentId: number | null = null;
    let newTempParentId: string | null = null;
    
    if (newLevel > 0) {
      for (let i = index - 1; i >= 0; i--) {
        if (updated[i].level === newLevel - 1) {
          if (updated[i].id) {
            newParentId = updated[i].id || null;
          } else {
            newTempParentId = updated[i].tempId || null;
          }
          break;
        }
      }
    }

    row.parentId = newParentId;
    row.tempParentId = newTempParentId;

    updated[index] = row;
    
    const recalculated = recalculateWorkItemTotals(updated);
    setWorkItemRows(recalculated);
  };

  const handleMoveWorkItemRow = (index: number, direction: 'up' | 'down') => {
    const updated = [...workItemRows];
    const row = updated[index];
    if (!row) return;

    let blockLength = 1;
    while (index + blockLength < updated.length && updated[index + blockLength].level > row.level) {
      blockLength++;
    }

    const block = updated.splice(index, blockLength);

    let insertIndex = index;
    if (direction === 'up') {
      if (index === 0) {
        updated.splice(index, 0, ...block);
        return;
      }
      insertIndex = index - 1;
      const targetLevel = updated[insertIndex].level;
      while (insertIndex > 0 && updated[insertIndex - 1].level >= targetLevel) {
        insertIndex--;
      }
    } else {
      if (index >= updated.length) {
        updated.splice(index, 0, ...block);
        return;
      }
      const nextRow = updated[index];
      const targetLevel = nextRow.level;
      insertIndex = index + 1;
      while (insertIndex < updated.length && updated[insertIndex].level > targetLevel) {
        insertIndex++;
      }
    }

    updated.splice(insertIndex, 0, ...block);

    const sorted = updated.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    const recalculated = recalculateWorkItemTotals(sorted);
    setWorkItemRows(recalculated);
  };

  const handleSaveWorkItems = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      if (workItemRows.some(r => !r.name.trim())) {
        throw new Error('Tên hạng mục không được để trống ở bất kỳ dòng nào');
      }
      await apiClient.put(`/reports/${reportId}/work-items`, { rows: workItemRows });
      setTabSuccessMsg('Đã lưu dữ liệu khối lượng hạng mục thi công thành công!');
      
      const updated = await apiClient.get<ApiWorkItemRow[]>(`/reports/${reportId}/work-items`);
      setWorkItemRows(updated.map(w => ({
        id: w.id,
        parentId: w.parentId,
        sortOrder: w.sortOrder,
        level: w.level,
        code: w.code,
        name: w.name,
        unit: w.unit,
        designQuantity: w.designQuantity ? Number(w.designQuantity) : null,
        previousAccumulatedQuantity: w.previousAccumulatedQuantity ? Number(w.previousAccumulatedQuantity) : null,
        todayQuantity: w.todayQuantity ? Number(w.todayQuantity) : null,
        currentAccumulatedQuantity: w.currentAccumulatedQuantity ? Number(w.currentAccumulatedQuantity) : null,
        completionPercent: w.completionPercent ? Number(w.completionPercent) : null,
        personInCharge: w.personInCharge,
        note: w.note,
        isGroup: w.isGroup,
        isLocked: w.isLocked,
        formula: w.formula,
      })));
    } catch (err) {
      const apiError = err as (Error | { message?: string });
      setTabError(apiError.message || 'Lỗi khi lưu dữ liệu hạng mục');
    } finally {
      setTabLoading(false);
    }
  };

  const handleImportExcelData = (pastedText: string) => {
    if (!pastedText.trim()) return;
    const lines = pastedText.split(/\r?\n/).filter(line => line.trim());
    const newItems: WorkItemRow[] = [];

    const normalizeHeader = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9%]+/g, ' ')
        .trim();

    const parseExcelNumber = (value?: string) => {
      if (!value) return 0;
      const raw = value.trim();
      if (!raw) return 0;
      const cleaned = raw.replace(/\s/g, '');
      const hasComma = cleaned.includes(',');
      const hasDot = cleaned.includes('.');
      const normalized = hasComma && hasDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : hasComma
          ? cleaned.replace(',', '.')
          : cleaned.replace(/,/g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const splitCells = (line: string) => line.split('\t');
    const firstCells = splitCells(lines[0] || '');
    const hasHeader = firstCells.some(cell => {
      const header = normalizeHeader(cell);
      return header.includes('ten') || header.includes('noi dung') || header.includes('hang muc') || header.includes('don vi');
    });

    const headers = hasHeader ? firstCells.map(normalizeHeader) : [];
    const findColumn = (...keywords: string[]) => {
      if (!hasHeader) return -1;
      return headers.findIndex(header => keywords.every(keyword => header.includes(keyword)));
    };
    const findColumnWhere = (predicate: (header: string) => boolean) => {
      if (!hasHeader) return -1;
      return headers.findIndex(predicate);
    };

    const columnMap = hasHeader
      ? {
          code: findColumn('tt'),
          name: (() => {
            const byWorkName = findColumn('ten', 'cong');
            if (byWorkName >= 0) return byWorkName;
            const byItem = findColumn('hang', 'muc');
            if (byItem >= 0) return byItem;
            return findColumn('noi', 'dung');
          })(),
          unit: findColumn('don', 'vi'),
          designQuantity: findColumn('thiet', 'ke'),
          previousAccumulatedQuantity: findColumn('luy', 'ke', 'truoc'),
          todayQuantity: (() => {
            const today = findColumnWhere(header => header.includes('hom') && header.includes('nay') && !header.includes('luy'));
            if (today >= 0) return today;
            return findColumnWhere(header => header.includes('ngay') && header.includes('nay') && !header.includes('luy'));
          })(),
          currentAccumulatedQuantity: findColumn('luy', 'ke', 'nay'),
          completionPercent: (() => {
            const percent = findColumn('%');
            if (percent >= 0) return percent;
            return findColumn('ty', 'le');
          })(),
          personInCharge: findColumn('phu', 'trach'),
          note: findColumn('ghi', 'chu'),
        }
      : {
          code: 0,
          name: 1,
          unit: 2,
          designQuantity: 3,
          previousAccumulatedQuantity: 4,
          todayQuantity: 5,
          currentAccumulatedQuantity: -1,
          completionPercent: -1,
          personInCharge: 6,
          note: 7,
        };

    const getCell = (cells: string[], index: number) => index >= 0 ? cells[index]?.trim() || '' : '';
    const inferLevel = (code: string, name: string) => {
      const leadingSpaces = name.match(/^\s*/)?.[0].length || 0;
      if (leadingSpaces >= 4) return Math.min(3, Math.floor(leadingSpaces / 2));
      if (/^\d+(\.\d+){2,}/.test(code)) return 3;
      if (/^\d+\.\d+/.test(code)) return 2;
      if (/^[a-z]\.?$/i.test(code) || /^[-+]$/.test(code)) return 1;
      return 0;
    };
    
    let nextSortOrder = workItemRows.length > 0
      ? Math.max(...workItemRows.map(w => w.sortOrder)) + 1
      : 1;
    const parentStack: Array<{ level: number; tempId: string }> = [];

    for (const line of hasHeader ? lines.slice(1) : lines) {
      if (!line.trim()) continue;
      const cells = splitCells(line);
      if (cells.length < 2) continue;
      
      const code = getCell(cells, columnMap.code);
      const rawName = columnMap.name >= 0 ? cells[columnMap.name] || '' : '';
      const name = rawName.trim();
      
      if (!name || normalizeHeader(name).includes('ten cong viec') || normalizeHeader(name).includes('ten hang muc')) {
        continue;
      }

      const unit = getCell(cells, columnMap.unit);
      const designQuantity = parseExcelNumber(getCell(cells, columnMap.designQuantity));
      const previousAccumulatedQuantity = parseExcelNumber(getCell(cells, columnMap.previousAccumulatedQuantity));
      const todayQuantity = parseExcelNumber(getCell(cells, columnMap.todayQuantity));
      const currentFromExcel = parseExcelNumber(getCell(cells, columnMap.currentAccumulatedQuantity));
      const currentAccumulatedQuantity = currentFromExcel || previousAccumulatedQuantity + todayQuantity;
      const completionFromExcel = parseExcelNumber(getCell(cells, columnMap.completionPercent).replace('%', ''));
      const completionPercent = completionFromExcel || (designQuantity > 0 ? (currentAccumulatedQuantity / designQuantity) * 100 : null);
      const personInCharge = getCell(cells, columnMap.personInCharge);
      const note = getCell(cells, columnMap.note);

      const isGroup = !unit && !designQuantity && !previousAccumulatedQuantity && !todayQuantity && !currentFromExcel;
      const level = inferLevel(code, rawName);
      const tempId = `temp-excel-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const parent = [...parentStack].reverse().find(item => item.level < level);

      newItems.push({
        tempId,
        parentId: null,
        tempParentId: parent?.tempId || null,
        sortOrder: nextSortOrder++,
        level,
        code,
        name,
        unit,
        designQuantity,
        previousAccumulatedQuantity,
        todayQuantity,
        currentAccumulatedQuantity,
        completionPercent,
        personInCharge,
        note,
        isGroup,
        isLocked: false,
        formula: null,
      });

      while (parentStack.length && parentStack[parentStack.length - 1].level >= level) {
        parentStack.pop();
      }
      parentStack.push({ level, tempId });
    }

    appendImportedWorkItems(newItems);
  };

  const appendImportedWorkItems = (rows: WorkItemRow[]) => {
    if (rows.length === 0) return;
    const combined = [...workItemRows, ...rows];
    const sorted = combined.map((r, i) => ({ ...r, sortOrder: i + 1 }));
    const recalculated = recalculateWorkItemTotals(sorted);
    setWorkItemRows(recalculated);
  };

  const handleImportExcelFile = async (file: File) => {
    if (!reportId) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setTabError('Chỉ hỗ trợ import file Excel .xlsx');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setTabError('File Excel vượt quá 20MB');
      return;
    }

    setTabError(null);
    setTabSuccessMsg(null);
    setIsImportingExcelFile(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await apiClient.post<{ sheetName: string; rows: WorkItemRow[] }>(
        `/reports/${reportId}/work-items/import-excel`,
        formData,
      );
      appendImportedWorkItems(result.rows);
      setTabSuccessMsg(`Đã import ${result.rows.length} dòng từ sheet "${result.sheetName}". Kiểm tra lại dữ liệu rồi bấm Lưu hạng mục.`);
      setIsExcelModalOpen(false);
      setExcelPasteText('');
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Không thể import file Excel');
    } finally {
      setIsImportingExcelFile(false);
    }
  };

  // Image handlers
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!reportId || !e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    
    const oversized = files.find(file => file.size > 5 * 1024 * 1024);
    if (oversized) {
      setUploadError(`Ảnh "${oversized.name}" vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.`);
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await apiClient.post<ReportImage[]>(`/reports/${reportId}/images/bulk`, formData);
      setReportImages([...reportImages, ...response]);
      setTabSuccessMsg(`Tải lên ${response.length} hình ảnh thành công!`);
    } catch (err) {
      const apiError = err as { message?: string };
      setUploadError(apiError.message || 'Lỗi khi tải ảnh lên');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleImageCaptionChange = (index: number, caption: string) => {
    const updated = [...reportImages];
    updated[index] = { ...updated[index], caption };
    setReportImages(updated);
  };

  const handleMoveImage = (index: number, direction: 'up' | 'down') => {
    const updated = [...reportImages];
    if (direction === 'up' && index > 0) {
      const temp = updated[index];
      updated[index] = updated[index - 1];
      updated[index - 1] = temp;
    } else if (direction === 'down' && index < updated.length - 1) {
      const temp = updated[index];
      updated[index] = updated[index + 1];
      updated[index + 1] = temp;
    }

    const sorted = updated.map((img, i) => ({ ...img, sortOrder: i + 1 }));
    setReportImages(sorted);
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa hình ảnh này không?')) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      await apiClient.delete(`/reports/images/${imageId}`);
      setReportImages(reportImages.filter(img => img.id !== imageId));
      setTabSuccessMsg('Đã xóa hình ảnh thi công thành công!');
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi xóa hình ảnh');
    } finally {
      setTabLoading(false);
    }
  };

  const handleSaveImagesMetadata = async () => {
    if (!reportId) return;
    setTabError(null);
    setTabSuccessMsg(null);
    setTabLoading(true);
    try {
      const rows = reportImages.map(img => ({
        id: img.id,
        caption: img.caption || '',
        sortOrder: img.sortOrder,
      }));
      await apiClient.put(`/reports/${reportId}/images`, { rows });
      setTabSuccessMsg('Đã lưu thông tin chú thích và sắp xếp ảnh thành công!');
      const updated = await apiClient.get<ReportImage[]>(`/reports/${reportId}/images`);
      setReportImages(updated);
    } catch (err) {
      const apiError = err as { message?: string };
      setTabError(apiError.message || 'Lỗi khi lưu thông tin hình ảnh');
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
    if (type === 'MESSAGE') return 'Lời dẫn';
    return type;
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATE_REPORT': return 'Khởi tạo báo cáo';
      case 'UPDATE_WEATHER': return 'Cập nhật thời tiết';
      case 'UPDATE_MANPOWER': return 'Cập nhật nhân lực';
      case 'UPDATE_EQUIPMENT': return 'Cập nhật thiết bị';
      case 'UPDATE_MATERIAL': return 'Cập nhật vật tư';
      case 'UPDATE_WORK_ITEMS': return 'Cập nhật khối lượng';
      case 'EXPORT_REPORT': return 'Xuất bản file';
      case 'CREATE_ADJUSTMENT': return 'Tạo bản điều chỉnh';
      case 'UPDATE_CELL': return 'Sửa ô dữ liệu';
      case 'REGENERATE_MESSAGE': return 'Sinh lại lời dẫn';
      default: return action;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'WeatherRow': return 'Thời tiết';
      case 'ManpowerRow': return 'Nhân lực';
      case 'EquipmentRow': return 'Thiết bị';
      case 'MaterialRow': return 'Vật tư';
      case 'WorkItem': return 'Khối lượng';
      default: return type;
    }
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case 'isSunny': return 'Trời nắng';
      case 'isRainy': return 'Trời mưa';
      case 'isNormal': return 'Bình thường';
      case 'wind': return 'Gió';
      case 'wave': return 'Sóng';
      case 'swell': return 'Sóng lừng';
      case 'note': return 'Ghi chú';
      case 'name': return 'Tên';
      case 'unit': return 'Đơn vị';
      case 'previousQuantity': return 'Lũy kế trước';
      case 'changeQuantity': return 'Thay đổi';
      case 'todayQuantity': return 'Hôm nay';
      case 'managerQuantity': return 'Quản lý';
      case 'staffQuantity': return 'Nhân viên';
      case 'overtimeQuantity': return 'Tăng ca';
      case 'securityQuantity': return 'Bảo vệ';
      case 'normalQuantity': return 'Hoạt động';
      case 'repairingQuantity': return 'Sửa chữa';
      case 'brokenQuantity': return 'Hỏng';
      case 'quantity': return 'Số lượng';
      case 'code': return 'Mã hiệu';
      case 'designQuantity': return 'KL Thiết kế';
      case 'previousAccumulatedQuantity': return 'Lũy kế trước';
      case 'currentAccumulatedQuantity': return 'Lũy kế hiện tại';
      case 'completionPercent': return 'Tỷ lệ hoàn thành';
      case 'personInCharge': return 'Phụ trách';
      default: return field;
    }
  };

  const renderSnapshotContent = () => {
    if (!selectedVersion) return null;
    
    const snapshot = selectedVersion.snapshot as {
      weatherRows?: WeatherRow[];
      manpowerRows?: ApiManpowerRow[];
      equipmentRows?: ApiEquipmentRow[];
      materialRows?: ApiMaterialRow[];
      workItems?: ApiWorkItemRow[];
      images?: ReportImage[];
    };

    switch (snapshotActiveTab) {
      case 'weather':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-450 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3 text-center">Nắng</th>
                  <th className="py-2.5 px-3 text-center">Mưa</th>
                  <th className="py-2.5 px-3 text-center">Bình thường</th>
                  <th className="py-2.5 px-3">Gió</th>
                  <th className="py-2.5 px-3">Sóng</th>
                  <th className="py-2.5 px-3">Sóng lừng</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {(snapshot.weatherRows || []).map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{w.period}</td>
                    <td className="py-2.5 px-3 text-center">{w.isSunny ? '✓' : ''}</td>
                    <td className="py-2.5 px-3 text-center">{w.isRainy ? '✓' : ''}</td>
                    <td className="py-2.5 px-3 text-center">{w.isNormal ? '✓' : ''}</td>
                    <td className="py-2.5 px-3">{w.wind || '---'}</td>
                    <td className="py-2.5 px-3">{w.wave || '---'}</td>
                    <td className="py-2.5 px-3">{w.swell || '---'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{w.note || '---'}</td>
                  </tr>
                ))}
                {(snapshot.weatherRows || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-slate-500 italic">Không có dữ liệu thời tiết.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'manpower':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-450 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Hạng mục nhân sự</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3 text-right">Lũy kế trước</th>
                  <th className="py-2.5 px-3 text-right">Thay đổi</th>
                  <th className="py-2.5 px-3 text-right">Hôm nay</th>
                  <th className="py-2.5 px-3 text-right">Quản lý</th>
                  <th className="py-2.5 px-3 text-right">Nhân viên</th>
                  <th className="py-2.5 px-3 text-right">Tăng ca</th>
                  <th className="py-2.5 px-3 text-right">Bảo vệ</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {(snapshot.manpowerRows || []).map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{m.name}</td>
                    <td className="py-2.5 px-3">{m.unit || '---'}</td>
                    <td className="py-2.5 px-3 text-right">{m.previousQuantity !== null ? Number(m.previousQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right text-blue-400">{m.changeQuantity !== null ? Number(m.changeQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{m.todayQuantity !== null ? Number(m.todayQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right">{m.managerQuantity !== null ? Number(m.managerQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right">{m.staffQuantity !== null ? Number(m.staffQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right">{m.overtimeQuantity !== null ? Number(m.overtimeQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right">{m.securityQuantity !== null ? Number(m.securityQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-slate-400">{m.note || '---'}</td>
                  </tr>
                ))}
                {(snapshot.manpowerRows || []).length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-4 text-center text-slate-500 italic">Không có dữ liệu nhân lực.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'equipment':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-450 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Hạng mục thiết bị</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3 text-right">Lũy kế trước</th>
                  <th className="py-2.5 px-3 text-right">Thay đổi</th>
                  <th className="py-2.5 px-3 text-right">Hôm nay</th>
                  <th className="py-2.5 px-3 text-right">Hoạt động</th>
                  <th className="py-2.5 px-3 text-right">Sửa chữa</th>
                  <th className="py-2.5 px-3 text-right">Hỏng</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {(snapshot.equipmentRows || []).map((e, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{e.name}</td>
                    <td className="py-2.5 px-3">{e.unit || '---'}</td>
                    <td className="py-2.5 px-3 text-right">{e.previousQuantity !== null ? Number(e.previousQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right text-blue-400">{e.changeQuantity !== null ? Number(e.changeQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{e.todayQuantity !== null ? Number(e.todayQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right">{e.normalQuantity !== null ? Number(e.normalQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right">{e.repairingQuantity !== null ? Number(e.repairingQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-right">{e.brokenQuantity !== null ? Number(e.brokenQuantity) : 0}</td>
                    <td className="py-2.5 px-3 text-slate-400">{e.note || '---'}</td>
                  </tr>
                ))}
                {(snapshot.equipmentRows || []).length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-4 text-center text-slate-500 italic">Không có dữ liệu thiết bị.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'materials':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-450 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Tên vật tư</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3 text-right">Số lượng tiêu hao</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {(snapshot.materialRows || []).map((mat, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/30">
                    <td className="py-2.5 px-3 font-semibold text-slate-200">{mat.name}</td>
                    <td className="py-2.5 px-3">{mat.unit || '---'}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">{mat.quantity !== null ? Number(mat.quantity) : 0}</td>
                    <td className="py-2.5 px-3 text-slate-400">{mat.note || '---'}</td>
                  </tr>
                ))}
                {(snapshot.materialRows || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500 italic">Không có dữ liệu vật tư.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'workitems':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300 border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-450 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Mã</th>
                  <th className="py-2.5 px-3">Hạng mục công việc</th>
                  <th className="py-2.5 px-3">Đơn vị</th>
                  <th className="py-2.5 px-3 text-right">KL Thiết kế</th>
                  <th className="py-2.5 px-3 text-right">Lũy kế trước</th>
                  <th className="py-2.5 px-3 text-right">Hôm nay</th>
                  <th className="py-2.5 px-3 text-right">Lũy kế hiện tại</th>
                  <th className="py-2.5 px-3 text-right">Hoàn thành</th>
                  <th className="py-2.5 px-3">Người phụ trách</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {(snapshot.workItems || []).map((w, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-900/30 ${
                      w.isGroup ? 'bg-slate-900/10 font-semibold' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">{w.code || ''}</td>
                    <td className="py-2.5 px-3 text-slate-200" style={{ paddingLeft: `${w.level * 16 + 12}px` }}>
                      {w.name}
                    </td>
                    <td className="py-2.5 px-3">{w.unit || ''}</td>
                    <td className="py-2.5 px-3 text-right">{w.designQuantity !== null ? Number(w.designQuantity) : '---'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{w.previousAccumulatedQuantity !== null ? Number(w.previousAccumulatedQuantity) : '---'}</td>
                    <td className="py-2.5 px-3 text-right text-blue-400 font-bold">{w.todayQuantity !== null ? Number(w.todayQuantity) : '---'}</td>
                    <td className="py-2.5 px-3 text-right text-white font-bold">{w.currentAccumulatedQuantity !== null ? Number(w.currentAccumulatedQuantity) : '---'}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-450 font-bold">
                      {w.completionPercent !== null ? `${Number(w.completionPercent).toFixed(1)}%` : '---'}
                    </td>
                    <td className="py-2.5 px-3">{w.personInCharge || '---'}</td>
                    <td className="py-2.5 px-3 text-slate-400">{w.note || ''}</td>
                  </tr>
                ))}
                {(snapshot.workItems || []).length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-4 text-center text-slate-500 italic">Không có dữ liệu khối lượng thi công.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      case 'images':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(snapshot.images || []).map((img) => (
              <div key={img.id} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-850 p-2.5 space-y-2">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-slate-900 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3001'}${img.fileUrl}`}
                    alt={img.caption || 'Hình ảnh báo cáo'}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="text-[10px] text-slate-400 truncate px-0.5" title={img.caption || ''}>
                  {img.caption || 'Chưa có chú thích'}
                </div>
              </div>
            ))}
            {(snapshot.images || []).length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-500 italic">Không có hình ảnh đính kèm.</div>
            )}
          </div>
        );
      default:
        return null;
    }
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

          {/* Create Adjustment Action */}
          {(report.status === 'APPROVED' || report.status === 'SENT') && canEdit && (
            <button
              onClick={() => setIsAdjustmentModalOpen(true)}
              disabled={isSubmittingAction}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-550 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
            >
              <History className="h-4 w-4" />
              Tạo bản điều chỉnh
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

        {report.reportType === 'MESSAGE' && (
          <button
            onClick={() => setActiveTab('message')}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'message'
                ? 'border-blue-500 text-blue-450'
                : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Lời dẫn
          </button>
        )}

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
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'export'
              ? 'border-blue-500 text-blue-450'
              : 'border-transparent text-slate-450 hover:text-slate-200 hover:border-slate-800'
          }`}
        >
          <Send className="h-4 w-4" />
          Xuất bản
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
        {/* Tab Lời dẫn: Cho MESSAGE report */}
        {activeTab === 'message' && report.reportType === 'MESSAGE' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-3 text-xs text-yellow-200 mb-4">
                <Lock className="h-4 w-4 shrink-0 text-yellow-450" />
                <span>Báo cáo này đã chốt, không thể chỉnh sửa lời dẫn.</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                Lời dẫn báo cáo
              </h3>
              <div className="flex items-center gap-2">
                {!isFinalized && canEdit && (
                  <>
                    <button
                      onClick={handleRegenerateMessage}
                      disabled={tabLoading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-955 hover:bg-slate-850 px-3 py-2 text-xs font-semibold text-slate-350 hover:text-white transition cursor-pointer"
                    >
                      Sinh lại lời dẫn
                    </button>
                    <button
                      onClick={handleSaveMessage}
                      disabled={tabLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Lưu lời dẫn
                    </button>
                  </>
                )}
              </div>
            </div>

            {tabError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-3 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-450" />
                <span>{tabError}</span>
              </div>
            )}

            {tabSuccessMsg && (
              <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-250">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{tabSuccessMsg}</span>
              </div>
            )}

            {tabLoading && !localMessageContent ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-555" />
              </div>
            ) : (
              <div className="space-y-4">
                <textarea
                  disabled={isFinalized || !canEdit}
                  value={localMessageContent}
                  onChange={(e) => setLocalMessageContent(e.target.value)}
                  placeholder="Nội dung lời dẫn báo cáo..."
                  className="w-full min-h-[400px] rounded-lg bg-slate-950/85 border border-slate-850 p-4 text-sm text-slate-202 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 transition font-mono leading-relaxed resize-y"
                />
              </div>
            )}
          </div>
        )}

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
                                <span title={`Số liệu lệch! Trước (${prev}) + Thay đổi (${change}) = ${prev + change}, nhưng nhập là ${today}`}>
                                  <AlertTriangle 
                                    className="h-4 w-4 text-yellow-500 shrink-0 cursor-help" 
                                  />
                                </span>
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
                                <span title={warningTitle.trim()}>
                                  <AlertTriangle 
                                    className="h-4 w-4 text-yellow-500 shrink-0 cursor-help" 
                                  />
                                </span>
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

        {/* Tab 6: Work Items Tree Grid */}
        {activeTab === 'workitems' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-3 text-xs text-yellow-200 mb-4">
                <Lock className="h-4 w-4 shrink-0 text-yellow-450" />
                <span>Báo cáo này đã chốt, không thể chỉnh sửa khối lượng thi công.</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-500" />
                Khối lượng hạng mục thi công
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {!isFinalized && canEdit && (
                  <>
                    <button
                      onClick={() => handleAddWorkItemRow()}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Thêm dòng
                    </button>
                    <button
                      onClick={() => setIsExcelModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer"
                    >
                      <Package className="h-3.5 w-3.5 text-emerald-500" />
                      Nhập từ Excel
                    </button>
                    <button
                      onClick={handleSaveWorkItems}
                      disabled={tabLoading}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Lưu hạng mục
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

            {tabLoading && workItemRows.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-555" />
              </div>
            ) : workItemRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <Layers className="h-8 w-8 text-slate-700 mb-2" />
                <h4 className="text-xs font-semibold text-slate-400">Không có dòng dữ liệu nào</h4>
                <p className="text-3xs text-slate-500 mt-1 mb-3">Bấm nút &quot;Thêm dòng&quot; hoặc &quot;Nhập từ Excel&quot; để tạo hạng mục mới</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20">
                <table className="w-full border-collapse text-left text-xs text-slate-350 min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-slate-850 font-semibold text-slate-500 uppercase tracking-wider bg-slate-900/40">
                      <th className="py-2.5 px-2 w-[12%] text-center">Hành động</th>
                      <th className="py-2.5 px-2 w-[8%]">Mã hiệu</th>
                      <th className="py-2.5 px-2 w-[24%]">Hạng mục công việc *</th>
                      <th className="py-2.5 px-2 w-[6%] text-center">Đơn vị</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">KL Thiết kế</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Lũy kế trước</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Hôm nay</th>
                      <th className="py-2.5 px-2 text-right w-[9%]">Lũy kế hiện tại</th>
                      <th className="py-2.5 px-2 text-right w-[7%]">Tỷ lệ (%)</th>
                      <th className="py-2.5 px-2 w-[10%]">Phụ trách</th>
                      <th className="py-2.5 px-2 w-[10%]">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40">
                    {workItemRows.map((row, index) => {
                      const current = row.currentAccumulatedQuantity || 0;
                      const percent = row.completionPercent || 0;
                      const isGroup = row.isGroup;

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-slate-850/10 transition-colors ${
                            isGroup ? 'bg-slate-900/20 font-bold text-white' : ''
                          }`}
                        >
                          <td className="py-2 px-1 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!isFinalized && canEdit ? (
                                <>
                                  <button
                                    onClick={() => handleAddWorkItemRow(index, 'child')}
                                    className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                                    title="Thêm hạng mục con"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleIndentWorkItemRow(index)}
                                    className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold"
                                    title="Thụt lề (Tạo con)"
                                  >
                                    &gt;
                                  </button>
                                  <button
                                    onClick={() => handleOutdentWorkItemRow(index)}
                                    className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white font-bold"
                                    title="Nhô lề (Tạo cha)"
                                  >
                                    &lt;
                                  </button>
                                  <button
                                    onClick={() => handleMoveWorkItemRow(index, 'up')}
                                    className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                                    title="Di chuyển lên"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    onClick={() => handleMoveWorkItemRow(index, 'down')}
                                    className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white"
                                    title="Di chuyển xuống"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWorkItemRow(index)}
                                    className="h-5 w-5 inline-flex items-center justify-center rounded bg-slate-955 hover:bg-red-950/20 border border-slate-800 hover:border-red-900 text-slate-500 hover:text-red-400"
                                    title="Xóa hạng mục"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              ) : (
                                <span className="text-slate-600 font-medium">Khóa</span>
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit || row.isLocked}
                              value={row.code || ''}
                              onChange={(e) => handleWorkItemChange(index, 'code', e.target.value)}
                              placeholder="Mã..."
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs font-mono"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <div
                              style={{ paddingLeft: `${row.level * 1.25}rem` }}
                              className="flex items-center gap-1.5"
                            >
                              {isGroup && (
                                <span className="text-blue-450 select-none">📁</span>
                              )}
                              <input
                                type="text"
                                disabled={isFinalized || !canEdit || row.isLocked}
                                value={row.name}
                                onChange={(e) => handleWorkItemChange(index, 'name', e.target.value)}
                                placeholder="Tên công việc..."
                                className={`w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs ${
                                  isGroup ? 'text-white font-bold' : 'text-slate-200'
                                }`}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit || row.isLocked || isGroup}
                              value={row.unit || ''}
                              onChange={(e) => handleWorkItemChange(index, 'unit', e.target.value)}
                              placeholder="Đơn vị"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-center disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit || row.isLocked || isGroup}
                              value={row.designQuantity ?? ''}
                              onChange={(e) =>
                                handleWorkItemChange(
                                  index,
                                  'designQuantity',
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit || row.isLocked || isGroup}
                              value={row.previousAccumulatedQuantity ?? ''}
                              onChange={(e) =>
                                handleWorkItemChange(
                                  index,
                                  'previousAccumulatedQuantity',
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled={isFinalized || !canEdit || row.isLocked || isGroup}
                              value={row.todayQuantity ?? ''}
                              onChange={(e) =>
                                handleWorkItemChange(
                                  index,
                                  'todayQuantity',
                                  e.target.value === '' ? null : Number(e.target.value)
                                )
                              }
                              placeholder="0"
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs text-right disabled:opacity-30 disabled:cursor-not-allowed font-semibold"
                            />
                          </td>
                          <td className="py-2 px-1 text-right">
                            <input
                              type="number"
                              disabled
                              value={current || ''}
                              placeholder="0"
                              className="w-full rounded bg-slate-950/30 border border-slate-850 py-1 px-1.5 text-slate-400 text-xs text-right cursor-not-allowed font-medium"
                            />
                          </td>
                          <td className="py-2 px-1 text-right text-slate-300 font-semibold pr-2">
                            {percent > 0 ? `${percent.toFixed(1)}%` : '0%'}
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit || row.isLocked}
                              value={row.personInCharge || ''}
                              onChange={(e) =>
                                handleWorkItemChange(index, 'personInCharge', e.target.value)
                              }
                              placeholder="Tên..."
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs"
                            />
                          </td>
                          <td className="py-2 px-1">
                            <input
                              type="text"
                              disabled={isFinalized || !canEdit || row.isLocked}
                              value={row.note || ''}
                              onChange={(e) => handleWorkItemChange(index, 'note', e.target.value)}
                              placeholder="Ghi chú..."
                              className="w-full rounded bg-slate-950/80 border border-slate-800 py-1 px-1.5 text-slate-355 focus:outline-none focus:ring-1 focus:ring-blue-550 text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Images Tab */}
        {activeTab === 'images' && (
          <div className="space-y-6">
            {isFinalized && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-950/40 border border-yellow-800/40 p-3 text-xs text-yellow-200 mb-4">
                <Lock className="h-4 w-4 shrink-0 text-yellow-450" />
                <span>Báo cáo này đã chốt, không thể tải lên hoặc chỉnh sửa hình ảnh.</span>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-blue-500" />
                Hình ảnh thi công & Sơ họa
              </h3>
              {!isFinalized && canEdit && reportImages.length > 0 && (
                <button
                  onClick={() => void handleSaveImagesMetadata()}
                  disabled={tabLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  Lưu hình ảnh
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
              <div className="flex items-center gap-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 p-3 text-xs text-emerald-255">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{tabSuccessMsg}</span>
              </div>
            )}

            {/* Upload Zone */}
            {!isFinalized && canEdit && (
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-800 border-dashed rounded-xl cursor-pointer bg-slate-950/20 hover:bg-slate-900/20 hover:border-slate-700 transition">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-8 h-8 mb-3 animate-spin text-blue-500" />
                          <p className="text-xs text-slate-350 font-medium">Đang xử lý và tải ảnh lên...</p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mb-3 text-slate-500" />
                          <p className="mb-2 text-xs text-slate-300 font-semibold">
                            Kéo thả hoặc Click để tải hình ảnh lên
                          </p>
                          <p className="text-3xs text-slate-550">JPEG, PNG, WEBP (Tối đa 5MB mỗi ảnh, có thể chọn nhiều ảnh)</p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleUploadImage}
                      disabled={isUploading}
                    />
                  </label>
                </div>
                {uploadError && (
                  <p className="text-xs text-red-400 font-medium">{uploadError}</p>
                )}
              </div>
            )}

            {/* Images Grid */}
            {tabLoading && reportImages.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-555" />
              </div>
            ) : reportImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <ImageIcon className="h-8 w-8 text-slate-700 mb-2" />
                <h4 className="text-xs font-semibold text-slate-400">Không có hình ảnh nào</h4>
                <p className="text-3xs text-slate-500 mt-1">Hãy kéo thả hoặc chọn tệp ảnh để thêm vào báo cáo</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {reportImages.map((img, index) => {
                  const sizeKB = img.sizeBytes ? (img.sizeBytes / 1024).toFixed(1) : '---';
                  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL
                    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
                    : 'http://localhost:3001';
                  const fullImageUrl = img.fileUrl ? `${backendBaseUrl}${img.fileUrl}` : '#';
                  const previewUrl = img.thumbnailUrl ? `${backendBaseUrl}${img.thumbnailUrl}` : fullImageUrl;

                  return (
                    <div
                      key={img.id}
                      className="bg-slate-950/40 border border-slate-850 rounded-xl overflow-hidden flex flex-col group hover:border-slate-750 transition"
                    >
                      {/* Image Preview Container */}
                      <div className="h-40 bg-slate-950 relative overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt={img.caption || 'Thi công'}
                          className="object-contain h-full w-full max-h-full transition duration-300 group-hover:scale-105"
                        />
                        <a
                          href={fullImageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-white transition backdrop-blur-[2px]"
                        >
                          Xem ảnh gốc
                        </a>
                      </div>

                      {/* Info & Caption Input */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>Thứ tự: {img.sortOrder}</span>
                            <span>{sizeKB} KB</span>
                          </div>
                          
                          <input
                            type="text"
                            disabled={isFinalized || !canEdit}
                            value={img.caption || ''}
                            onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                            placeholder="Nhập chú thích ảnh..."
                            className="w-full rounded bg-slate-950 border border-slate-850 py-1.5 px-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-550 transition font-medium"
                          />
                        </div>

                        {/* Actions */}
                        {!isFinalized && canEdit && (
                          <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleMoveImage(index, 'up')}
                                disabled={index === 0}
                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-850 hover:border-slate-700 bg-slate-950/20 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                title="Di chuyển lên"
                              >
                                ←
                              </button>
                              <button
                                onClick={() => handleMoveImage(index, 'down')}
                                disabled={index === reportImages.length - 1}
                                className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-850 hover:border-slate-700 bg-slate-950/20 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                                title="Di chuyển xuống"
                              >
                                →
                              </button>
                            </div>

                            <button
                              onClick={() => void handleDeleteImage(img.id)}
                              className="h-7 w-7 inline-flex items-center justify-center rounded border border-slate-850 hover:border-red-800/80 bg-slate-950/20 hover:bg-red-950/20 text-slate-500 hover:text-red-400 transition cursor-pointer"
                              title="Xóa hình ảnh"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Export PDF Tab */}
        {activeTab === 'export' && (
          <div className="space-y-6">
            {/* Alerts */}
            {tabError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-950/50 border border-red-800/60 p-4 text-xs text-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{tabError}</span>
              </div>
            )}
            {tabSuccessMsg && (
              <div className="flex items-start gap-3 rounded-lg bg-emerald-950/50 border border-emerald-800/60 p-4 text-xs text-emerald-200">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-450" />
                <span>{tabSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Actions and History */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-955/40 border border-slate-850 rounded-xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-500" />
                    Kết xuất báo cáo ngày
                  </h3>
                  <p className="text-3xs text-slate-400">
                    Báo cáo ngày sẽ được biên dịch sang định dạng tài liệu PDF, Excel hoặc Word bao gồm tất cả các thông tin Nhật ký công trình trong ngày.
                  </p>
                  
                  <div className="space-y-2">
                    <button
                      onClick={handleExportPdf}
                      disabled={isExporting || isExportingExcel || isExportingWord || isExportingTxt}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 py-2 px-4 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang kết xuất PDF...
                        </>
                      ) : (
                        <>
                          Kết xuất PDF (A4)
                        </>
                      )}
                    </button>

                    {report.reportType === 'MESSAGE' && (
                      <button
                        onClick={handleExportTxt}
                        disabled={isExporting || isExportingExcel || isExportingWord || isExportingTxt}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-600 hover:bg-slate-550 disabled:bg-slate-800 disabled:opacity-50 py-2 px-4 text-xs font-semibold text-white transition cursor-pointer"
                      >
                        {isExportingTxt ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Đang kết xuất TXT...
                          </>
                        ) : (
                          <>
                            Kết xuất TXT (.txt)
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={handleExportExcel}
                      disabled={isExporting || isExportingExcel || isExportingWord || isExportingTxt}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-555 disabled:bg-emerald-800 disabled:opacity-50 py-2 px-4 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      {isExportingExcel ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang kết xuất Excel...
                        </>
                      ) : (
                        <>
                          Kết xuất Excel (.xlsx)
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleExportWord}
                      disabled={isExporting || isExportingExcel || isExportingWord || isExportingTxt}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-550 disabled:bg-indigo-850 disabled:opacity-50 py-2 px-4 text-xs font-semibold text-white transition cursor-pointer"
                    >
                      {isExportingWord ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang kết xuất Word...
                        </>
                      ) : (
                        <>
                          Kết xuất Word (.docx)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Export History list */}
                <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200">Lịch sử xuất bản</h4>
                  {exportHistory.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-slate-850 rounded-lg text-3xs text-slate-500">
                      Chưa có tệp nào được xuất bản.
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                      {exportHistory.map((exp) => {
                        const sizeMB = exp.fileSize ? (exp.fileSize / (1024 * 1024)).toFixed(2) : '---';
                        const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL
                          ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
                          : 'http://localhost:3001';
                        const downloadUrl = `${backendBaseUrl}${exp.fileUrl}`;
                        
                        return (
                          <div
                            key={exp.id}
                            className="flex items-center justify-between border-b border-slate-850/60 pb-3 last:border-b-0 last:pb-0"
                          >
                            <div className="space-y-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`text-[8px] font-bold px-1.5 py-0.25 rounded border shrink-0 ${
                                  exp.format === 'EXCEL'
                                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                                    : exp.format === 'WORD'
                                    ? 'bg-indigo-950/40 text-indigo-400 border-indigo-800/40'
                                    : exp.format === 'TXT'
                                    ? 'bg-slate-950/40 text-slate-400 border-slate-800/40'
                                    : 'bg-blue-950/40 text-blue-400 border-blue-800/40'
                                }`}>
                                  {exp.format || 'PDF'}
                                </span>
                                <p className="text-3xs font-medium text-slate-250 truncate" title={exp.fileName}>
                                  {exp.fileName}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                                <span>{sizeMB} MB</span>
                                <span>•</span>
                                <span>{new Date(exp.createdAt).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                            <a
                              href={downloadUrl}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-3 inline-flex items-center justify-center rounded bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-3xs font-medium text-slate-300 hover:text-white transition"
                            >
                              Tải về
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Live PDF-HTML Preview inside an iframe */}
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-300">Xem trước bản in (A4 Preview)</h4>
                  <span className="text-[10px] text-slate-500">Mẫu báo cáo mặc định</span>
                </div>
                
                <div className="border border-slate-850 rounded-xl overflow-hidden bg-white h-[650px] shadow-inner relative">
                  <iframe
                    src={`${
                      process.env.NEXT_PUBLIC_API_URL
                        ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
                        : 'http://localhost:3001'
                    }/api/reports/${reportId}/preview?token=${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`}
                    className="w-full h-full border-0"
                    title="Báo cáo ngày - Xem trước"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Audit History */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột 1: Lịch sử phiên bản */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <History className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Lịch sử Phiên bản</h3>
              </div>
              
              {reportVersions.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-8 text-center text-xs text-slate-500">
                  Báo cáo chưa có phiên bản điều chỉnh nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {reportVersions.map((v) => (
                    <div
                      key={v.id}
                      onClick={() => {
                        setSelectedVersion(v);
                        setIsVersionModalOpen(true);
                        setSnapshotActiveTab('weather');
                      }}
                      className="bg-slate-900 border border-slate-850 hover:border-slate-750 transition-all rounded-xl p-4 cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-450 bg-blue-950/40 border border-blue-900/30 px-2 py-0.5 rounded-full">
                          Phiên bản v{v.versionNo}
                        </span>
                        <span className="text-[10px] text-slate-550">
                          {new Date(v.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-350 mt-2.5 line-clamp-2">
                        <span className="font-semibold text-slate-200">Lý do: </span>
                        {v.changeReason || 'Không có lý do ghi nhận'}
                      </p>
                      
                      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-450 border-t border-slate-850/60 pt-2 group-hover:text-slate-350 transition">
                        <User className="h-3 w-3" />
                        <span>Người tạo: {v.createdBy?.name || 'Hệ thống'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cột 2 & 3: Nhật ký hoạt động */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-white">Nhật ký hoạt động chi tiết</h3>
                </div>
                <span className="text-[10px] text-slate-500 font-medium">
                  Tổng cộng: {auditLogs.length} sự kiện
                </span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-16 text-center text-xs text-slate-500">
                  Chưa có nhật ký hoạt động nào ghi nhận.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 space-y-1.5 max-h-[600px] overflow-y-auto pr-2 divide-y divide-slate-850/50">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            log.action === 'CREATE_REPORT' ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40' :
                            log.action === 'CREATE_ADJUSTMENT' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/40' :
                            log.action === 'EXPORT_REPORT' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/40' :
                            log.action === 'UPDATE_CELL' ? 'bg-slate-800/80 text-slate-350 border border-slate-750' :
                            'bg-slate-850 text-slate-400 border border-slate-800'
                          }`}>
                            {getActionLabel(log.action)}
                          </span>
                          
                          <span className="font-semibold text-slate-200">
                            {log.user?.name || 'Hệ thống'}
                          </span>
                        </div>
                        
                        <span className="text-[10px] text-slate-550">
                          {new Date(log.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-slate-350 leading-relaxed pl-1">
                        {log.action === 'UPDATE_CELL' ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span>Sửa bảng</span>
                            <span className="text-slate-250 font-bold bg-slate-950/40 px-1.5 py-0.25 rounded border border-slate-800">{getEntityLabel(log.entityType)}</span>
                            <span>trường</span>
                            <span className="text-blue-450 font-bold bg-slate-950/40 px-1.5 py-0.25 rounded border border-slate-800">{getFieldLabel(log.fieldName || '')}</span>
                            <span>:</span>
                            {log.oldValue ? (
                              <span className="text-red-400 font-mono line-through bg-red-950/20 px-1 py-0.25 rounded">{log.oldValue}</span>
                            ) : (
                              <span className="text-slate-600 italic">Trống</span>
                            )}
                            <span className="text-slate-500">→</span>
                            {log.newValue ? (
                              <span className="text-emerald-450 font-mono font-bold bg-emerald-950/20 px-1 py-0.25 rounded">{log.newValue}</span>
                            ) : (
                              <span className="text-slate-600 italic">Xóa</span>
                            )}
                          </div>
                        ) : (
                          <span>{log.reason || 'Không có mô tả chi tiết.'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Tạo bản điều chỉnh */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500" />
                Tạo Bản Điều Chỉnh Báo Cáo
              </h3>
              <button
                onClick={() => {
                  setIsAdjustmentModalOpen(false);
                  setChangeReasonText('');
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-amber-950/20 border border-amber-800/30 p-3 text-xs text-amber-350 leading-relaxed">
                Sau khi tạo bản điều chỉnh, hệ thống sẽ tự động lưu lại Snapshot dữ liệu hiện thời thành một phiên bản lịch sử mới, và chuyển trạng thái báo cáo này về <strong>Bản nháp (DRAFT)</strong> để bạn tiếp tục chỉnh sửa.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-350">
                  Lý do điều chỉnh <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={changeReasonText}
                  onChange={(e) => setChangeReasonText(e.target.value)}
                  placeholder="Ví dụ: Thay đổi sản lượng thực tế hôm nay theo biên bản kiểm kê..."
                  rows={4}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 transition text-xs"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-850 bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAdjustmentModalOpen(false);
                  setChangeReasonText('');
                }}
                disabled={isSubmittingAdjustment}
                className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  void handleCreateAdjustment();
                }}
                disabled={isSubmittingAdjustment || !changeReasonText.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-650 hover:bg-amber-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
              >
                {isSubmittingAdjustment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <History className="h-4 w-4" />
                )}
                Xác nhận tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xem Snapshot Phiên bản */}
      {isVersionModalOpen && selectedVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col h-[90vh]">
            <div className="p-6 border-b border-slate-850 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-500" />
                  Xem Chi Tiết Phiên Bản v{selectedVersion.versionNo}
                </h3>
                <p className="text-3xs text-slate-450 mt-1">
                  Được tạo bởi: <span className="text-slate-300 font-medium">{selectedVersion.createdBy?.name || 'Hệ thống'}</span> | Lý do: <span className="text-slate-350 italic">{selectedVersion.changeReason || 'Không ghi nhận'}</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsVersionModalOpen(false);
                  setSelectedVersion(null);
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-slate-950/40 border-b border-slate-850 px-6 py-2 flex gap-1.5 overflow-x-auto scrollbar-none shrink-0">
              {[
                { key: 'weather', label: 'Thời tiết' },
                { key: 'manpower', label: 'Nhân lực' },
                { key: 'equipment', label: 'Thiết bị' },
                { key: 'materials', label: 'Vật tư' },
                { key: 'workitems', label: 'Khối lượng' },
                { key: 'images', label: 'Hình ảnh' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSnapshotActiveTab(t.key as 'weather' | 'manpower' | 'equipment' | 'materials' | 'workitems' | 'images')}
                  className={`px-3 py-1.5 rounded-lg text-3xs font-semibold transition cursor-pointer ${
                    snapshotActiveTab === t.key
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-900/30">
              {renderSnapshotContent()}
            </div>
            
            <div className="p-6 border-t border-slate-850 bg-slate-900/50 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setIsVersionModalOpen(false);
                  setSelectedVersion(null);
                }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Paste Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-500" />
                Nhập Khối Lượng từ Excel
              </h3>
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelPasteText('');
                }}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Sao chép các dòng trong Excel (hoặc Google Sheets) rồi dán trực tiếp vào khung dưới đây. Có thể dán kèm dòng tiêu đề để hệ thống tự nhận diện cột:
                <br />
                <span className="font-mono text-emerald-400 font-bold">TT/Mã | Tên/Nội dung công việc | Đơn vị | KL Thiết kế | Lũy kế trước | Hôm nay | Lũy kế hôm nay | % | Ghi chú</span>
              </p>

              <label className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-slate-750 bg-slate-950/40 px-4 py-3 cursor-pointer hover:border-emerald-600/60 transition">
                <div className="flex items-center gap-3 min-w-0">
                  {isImportingExcelFile ? (
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500 shrink-0" />
                  ) : (
                    <Upload className="h-5 w-5 text-emerald-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">Import trực tiếp file .xlsx</p>
                    <p className="text-3xs text-slate-500">Tự tìm sheet khối lượng và nhận diện cột tiếng Việt</p>
                  </div>
                </div>
                <span className="text-3xs font-semibold text-emerald-400 shrink-0">Chọn file</span>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  disabled={isImportingExcelFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) {
                      handleImportExcelFile(file);
                    }
                  }}
                />
              </label>
              
              <textarea
                value={excelPasteText}
                onChange={(e) => setExcelPasteText(e.target.value)}
                placeholder="Dán dữ liệu Excel (Ctrl+V) tại đây..."
                rows={10}
                className="w-full rounded-lg bg-slate-950 border border-slate-800 p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-550/20 focus:border-blue-550 transition font-mono text-xs"
              />
            </div>
            
            <div className="p-6 border-t border-slate-850 bg-slate-900/50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsExcelModalOpen(false);
                  setExcelPasteText('');
                }}
                className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-350 hover:text-white transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  handleImportExcelData(excelPasteText);
                  setIsExcelModalOpen(false);
                  setExcelPasteText('');
                }}
                disabled={!excelPasteText.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-650 hover:bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Nhập dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
