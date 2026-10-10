import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  Plus,
  Send,
  QrCode,
  UploadCloud,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  Users,
  Image as ImageIcon,
  Server,
  ShieldCheck,
  ShieldAlert,
  Check,
  Smartphone,
  RotateCcw,
  LogOut,
  Zap,
  Edit3,
  Lock,
  Phone,
  X,
  Search,
  ExternalLink,
  Sparkles,
  Copy,
  Radio,
  Megaphone,
  CheckSquare,
  Square,
  Ban,
  Eye,
  Activity,
  Save,
  Loader2,
  CheckCheck,
  HelpCircle,
  Layers,
  ArrowRight,
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileText,
  AlignLeft,
  History,
  Settings,
  ListOrdered,
  Filter,
  CheckCircle,
  XCircle,
  Database,
  Cpu,
  Mic,
  Volume2,
  AlertTriangle,
  FileCode,
  Paperclip,
  Download,
  FileSpreadsheet,
  Award,
  BadgeCheck,
  Globe,
  Building2,
  UserCheck,
  BellRing,
  Sliders,
  Palette,
  Film,
  Video,
  Link2,
  MousePointerClick
} from 'lucide-react';
import {
  AutoSenderStatus,
  AutoSenderTask,
  ScamReportTask,
  ScamReportProof,
  TrustedPostTask,
  TrustedPostProof,
  GroupDeliveryRecord,
  CenterGroup,
  CenterMember
} from '../types';

interface CalculatedScheduleSlot {
  index: number;
  label: string;
  time12: string;
  time24: string;
  hour: number;
  minute: number;
}

interface HistoricalLog {
  group_jid: string;
  group_name: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  sent_at: string;
  error?: string;
  message_id?: string;
  task_id?: string;
  order_id?: string;
  tool_name?: string;
  post_caption?: string;
  image_url?: string;
  scheduled_time?: string;
}

export const AutoSenderView: React.FC = () => {
  const [status, setStatus] = useState<AutoSenderStatus | null>(null);
  const [groups, setGroups] = useState<CenterGroup[]>([]);
  const [tasks, setTasks] = useState<AutoSenderTask[]>([]);
  const [scamReports, setScamReports] = useState<ScamReportTask[]>([]);
  const [trustedPosts, setTrustedPosts] = useState<TrustedPostTask[]>([]);
  const [statusNotifications, setStatusNotifications] = useState<AutoSenderTask[]>([]);
  const [liveMyStatuses, setLiveMyStatuses] = useState<any[]>([]);
  const [isLoadingMyStatuses, setIsLoadingMyStatuses] = useState<boolean>(false);
  const [statusNotifSubTab, setStatusNotifSubTab] = useState<'my-status' | 'dashboard' | 'groups' | 'history' | 'analytics' | 'settings'>('my-status');
  const [statusNotifModalOpen, setStatusNotifModalOpen] = useState<boolean>(false);
  const [statusNotifLiveViewModalTask, setStatusNotifLiveViewModalTask] = useState<AutoSenderTask | null>(null);
  const [statusNotifLiveViewData, setStatusNotifLiveViewData] = useState<any | null>(null);
  const [statusNotifLiveViewPolling, setStatusNotifLiveViewPolling] = useState<boolean>(false);
  const [statusNotifHistoryModalTask, setStatusNotifHistoryModalTask] = useState<AutoSenderTask | null>(null);
  const [statusNotifPreviewModalTask, setStatusNotifPreviewModalTask] = useState<AutoSenderTask | null>(null);
  const [statusNotifSettingsModalOpen, setStatusNotifSettingsModalOpen] = useState<boolean>(false);
  const [tagGroupsModalOpen, setTagGroupsModalOpen] = useState<boolean>(false);
  const [tempTaggedGroups, setTempTaggedGroups] = useState<string[]>([]);
  const [tagGroupsSearch, setTagGroupsSearch] = useState<string>('');

  // Status Notification Form State
  const [statusNotifName, setStatusNotifName] = useState<string>('');
  const [statusNotifContentType, setStatusNotifContentType] = useState<'image' | 'video' | 'text'>('image');
  const [statusNotifImageUrl, setStatusNotifImageUrl] = useState<string>('');
  const [statusNotifImagePath, setStatusNotifImagePath] = useState<string>('');
  const [statusNotifImageFilename, setStatusNotifImageFilename] = useState<string>('');
  const [statusNotifVideoUrl, setStatusNotifVideoUrl] = useState<string>('');
  const [statusNotifVideoPath, setStatusNotifVideoPath] = useState<string>('');
  const [statusNotifVideoFilename, setStatusNotifVideoFilename] = useState<string>('');
  const [statusNotifText, setStatusNotifText] = useState<string>('');
  const [statusNotifBgColor, setStatusNotifBgColor] = useState<string>('#075E54');
  const [statusNotifCaption, setStatusNotifCaption] = useState<string>('');
  const [statusNotifLink, setStatusNotifLink] = useState<string>('');
  const [statusNotifSelectedAccount, setStatusNotifSelectedAccount] = useState<string>('');
  const [statusNotifSelectedGroups, setStatusNotifSelectedGroups] = useState<string[]>([]);
  const [statusNotifFrequency, setStatusNotifFrequency] = useState<number>(3);
  const [statusNotifDurationHours, setStatusNotifDurationHours] = useState<number>(24);
  const [statusNotifCustomDuration, setStatusNotifCustomDuration] = useState<string>('24');
  const [statusNotifStartTime, setStatusNotifStartTime] = useState<string>('09:00');
  const [statusNotifIntervalHours, setStatusNotifIntervalHours] = useState<number>(3);
  const [statusNotifGroupSearch, setStatusNotifGroupSearch] = useState<string>('');
  const [isSubmittingStatusNotif, setIsSubmittingStatusNotif] = useState<boolean>(false);
  const [statusNotifSubmitFeedback, setStatusNotifSubmitFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUploadingStatusNotifImage, setIsUploadingStatusNotifImage] = useState<boolean>(false);
  const [isUploadingStatusNotifVideo, setIsUploadingStatusNotifVideo] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<HistoricalLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  const isConnected = status?.status === 'CONNECTED';
  const isQrAvailable = status?.status === 'QR_AVAILABLE' || status?.status === 'WAITING_FOR_QR';

  // 1-second interval to continuously keep live date, time and delivery statuses updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const liveDateStr = useMemo(() => {
    const d = new Date(currentTime);
    const datePart = d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timePart = d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${datePart} • ${timePart}`;
  }, [currentTime]);

  // Horizontal Navigation Main Tabs:
  // Dashboard | WhatsApp Connection | Groups | Status Notification | New Post | Scam Report Post | Trusted Post | Schedules | Complete Status | History | Settings
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'connection' | 'groups' | 'status-notifications' | 'new-post' | 'scam-reports' | 'trusted-posts' | 'schedules' | 'status-report' | 'history' | 'settings'
  >('dashboard');



  // ==========================================
  // AUTO POST FORM STATE
  // ==========================================
  const getSuggestedStartTime = () => {
    const d = new Date(Date.now() + 5 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [toolName, setToolName] = useState<string>('');
  const [uploadedImageMeta, setUploadedImageMeta] = useState<{
    image_url: string;
    image_path?: string;
    filename: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [imageAltText, setImageAltText] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>('');
  const STORAGE_KEY_SELECTED_GROUPS = 'mdz_autosender_selected_group_ids';
  const [selectedGroups, setSelectedGroups] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mdz_autosender_selected_group_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) { }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('mdz_autosender_selected_group_ids', JSON.stringify(selectedGroups));
    } catch (_) { }
  }, [selectedGroups]);

  // Group Sending Interval State (4s, 5s, 10s, 20s, or Custom Interval)
  const [groupIntervalMode, setGroupIntervalMode] = useState<'4' | '5' | '10' | '20' | 'custom'>('5');
  const [groupIntervalCustomSeconds, setGroupIntervalCustomSeconds] = useState<number>(5);
  const activeGroupIntervalSeconds = useMemo(() => {
    if (groupIntervalMode === 'custom') {
      return Math.max(1, groupIntervalCustomSeconds || 5);
    }
    return parseInt(groupIntervalMode, 10) || 5;
  }, [groupIntervalMode, groupIntervalCustomSeconds]);

  const [isRefreshingGroups, setIsRefreshingGroups] = useState<boolean>(false);
  const [groupSearch, setGroupSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>(() => getSuggestedStartTime());
  const [scheduleTime, setScheduleTime] = useState<string>(() => {
    const now = new Date(Date.now() + 5 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [sendImmediately, setSendImmediately] = useState<boolean>(false);
  const [mentionAllInPost, setMentionAllInPost] = useState<boolean>(false);
  const [postsPerDay, setPostsPerDay] = useState<number>(3);
  const [postingIntervalHours, setPostingIntervalHours] = useState<number>(3);
  const [validityDuration, setValidityDuration] = useState<string>('1_month');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showLivePreviewMobile, setShowLivePreviewMobile] = useState<boolean>(false);

  // ==========================================
  // SCAM REPORT FORM & STATE
  // ==========================================
  const [scamSubTab, setScamSubTab] = useState<'create' | 'history'>('create');
  const [scamTitle, setScamTitle] = useState<string>('');
  const [scamReportedNumber, setScamReportedNumber] = useState<string>('');
  const [scamDescription, setScamDescription] = useState<string>('');
  const [scamProofImages, setScamProofImages] = useState<string[]>([]);
  const [scamProofAudios, setScamProofAudios] = useState<string[]>([]);
  const [scamSelectedGroups, setScamSelectedGroups] = useState<string[]>([]);
  const [scamGroupSearch, setScamGroupSearch] = useState<string>('');
  const [isUploadingScamImage, setIsUploadingScamImage] = useState<boolean>(false);
  const [isUploadingScamAudio, setIsUploadingScamAudio] = useState<boolean>(false);
  const [scamSubmitFeedback, setScamSubmitFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingScam, setIsSubmittingScam] = useState<boolean>(false);
  const [scamReportForDeletion, setScamReportForDeletion] = useState<ScamReportTask | null>(null);
  const [isDeletingScamMessages, setIsDeletingScamMessages] = useState<boolean>(false);
  const [scamDeletionResults, setScamDeletionResults] = useState<{
    reportId: string;
    results: Array<{ group_id: string; group_name: string; status: 'DELETED' | 'FAILED' | 'UNSUPPORTED'; error?: string }>;
  } | null>(null);

  // ==========================================
  // TRUSTED POST FORM & STATE
  // ==========================================
  const [trustedSubTab, setTrustedSubTab] = useState<'create' | 'history'>('create');
  const [trustedTitle, setTrustedTitle] = useState<string>('');
  const [trustedName, setTrustedName] = useState<string>('');
  const [trustedContact, setTrustedContact] = useState<string>('');
  const [trustedDescription, setTrustedDescription] = useState<string>('');
  const [trustedImageUrl, setTrustedImageUrl] = useState<string>('');
  const [trustedAudioUrl, setTrustedAudioUrl] = useState<string>('');
  const [trustedSelectedGroups, setTrustedSelectedGroups] = useState<string[]>([]);
  const [trustedGroupSearch, setTrustedGroupSearch] = useState<string>('');
  const [trustedScheduleMode, setTrustedScheduleMode] = useState<'IMMEDIATE' | 'SCHEDULED'>('IMMEDIATE');
  const [trustedScheduleTime, setTrustedScheduleTime] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [isUploadingTrustedImage, setIsUploadingTrustedImage] = useState<boolean>(false);
  const [isUploadingTrustedAudio, setIsUploadingTrustedAudio] = useState<boolean>(false);
  const [isSubmittingTrusted, setIsSubmittingTrusted] = useState<boolean>(false);
  const [trustedSubmitFeedback, setTrustedSubmitFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [trustedPostForDeletion, setTrustedPostForDeletion] = useState<TrustedPostTask | null>(null);
  const [isDeletingTrustedMessages, setIsDeletingTrustedMessages] = useState<boolean>(false);
  const [trustedDeletionResults, setTrustedDeletionResults] = useState<{
    postId: string;
    results: Array<{ group_id: string; group_name: string; status: 'DELETED' | 'FAILED' | 'UNSUPPORTED'; error?: string }>;
  } | null>(null);
  const [trustedDocUrl, setTrustedDocUrl] = useState<string>('');
  const [trustedDocFilename, setTrustedDocFilename] = useState<string>('');
  const [isUploadingTrustedDoc, setIsUploadingTrustedDoc] = useState<boolean>(false);
  const [selectedTrustedPostForDetails, setSelectedTrustedPostForDetails] = useState<TrustedPostTask | null>(null);
  const [selectedScamReportForDetails, setSelectedScamReportForDetails] = useState<ScamReportTask | null>(null);
  const [isPreviewTrustedModalOpen, setIsPreviewTrustedModalOpen] = useState<boolean>(false);

  // ==========================================
  // REAL GROUPS SECTION: EXPORT & DELETE STATE
  // ==========================================
  const [exportingGroupId, setExportingGroupId] = useState<string | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<CenterGroup | null>(null);
  const [deleteGroupAction, setDeleteGroupAction] = useState<'REMOVE_FROM_DASHBOARD' | 'LEAVE_WHATSAPP_GROUP'>('REMOVE_FROM_DASHBOARD');
  const [isDeletingGroup, setIsDeletingGroup] = useState<boolean>(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<CenterGroup | null>(null);
  const [liveGroupMembers, setLiveGroupMembers] = useState<CenterMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [memberSearch, setMemberSearch] = useState<string>('');

  // Schedules View filter
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'BLOCKED' | 'EXPIRED'>('ALL');

  // Pairing phone state
  const [pairingPhone, setPairingPhone] = useState<string>('');
  const [isPairingLoading, setIsPairingLoading] = useState<boolean>(false);
  const [pairingError, setPairingError] = useState<string | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<boolean>(false);

  // Complete Status Selection
  const [selectedTaskIdForStatus, setSelectedTaskIdForStatus] = useState<string | null>(null);
  const [statusReportSearch, setStatusReportSearch] = useState<string>('');

  // Delete Single Post / All Sent Posts Modals
  const [deleteSentPostModalTask, setDeleteSentPostModalTask] = useState<AutoSenderTask | null>(null);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState<boolean>(false);
  const [cancelFutureOnDelete, setCancelFutureOnDelete] = useState<boolean>(true);
  const [isDeletingSentPosts, setIsDeletingSentPosts] = useState<boolean>(false);
  const [deleteSentResults, setDeleteSentResults] = useState<{
    success: boolean;
    totalDeleted: number;
    totalFailed: number;
    results?: Array<{ group_id?: string; group_name?: string; status?: string; error?: string }>;
  } | null>(null);

  // Delete Record Confirmation Modal
  const [deleteRecordModalTask, setDeleteRecordModalTask] = useState<AutoSenderTask | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState<boolean>(false);

  // Change Schedule Modal
  const [scheduleModalTask, setScheduleModalTask] = useState<AutoSenderTask | null>(null);
  const [newScheduleTime, setNewScheduleTime] = useState<string>('');
  const [newPostsPerDay, setNewPostsPerDay] = useState<number>(3);
  const [newIntervalHours, setNewIntervalHours] = useState<number>(3);
  const [newValidityDuration, setNewValidityDuration] = useState<string>('1_month');
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  // Live View Post Preview Modal
  const [previewModalTask, setPreviewModalTask] = useState<AutoSenderTask | null>(null);

  // Per Day History Modal & Filter State
  const [selectedPostForHistory, setSelectedPostForHistory] = useState<AutoSenderTask | null>(null);
  const [historyDateFilter, setHistoryDateFilter] = useState<string>('ALL');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'SENT' | 'PENDING' | 'FAILED'>('ALL');
  const [historyGroupFilter, setHistoryGroupFilter] = useState<string>('');

  // Expanded Task Details on Unified Dashboard
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const toggleExpandTask = (taskId: string) => {
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Calculate validity duration in months
  const getDurationMonths = (duration: string): number => {
    switch (duration) {
      case '1_week':
      case '7_days':
        return 0.25;
      case '1_month':
        return 1;
      case '2_months':
        return 2;
      case '3_months':
        return 3;
      case '6_months':
        return 6;
      case '1_year':
        return 12;
      default:
        return 1;
    }
  };

  // Calculate next scheduled posting time and check upcoming window safely
  const getTaskNextExecutionTime = (task: AutoSenderTask, nowMs: number) => {
    try {
      let targetMs: number | null = null;
      if (!task) {
        return { nextDate: null, nextFormatted: '—', isWithin10Min: false, isDueNow: false, minutesRemaining: null };
      }

      // Check all configured daily slots (start_time + generated_times)
      const allSlots: string[] = [];
      if (typeof task.start_time === 'string' && task.start_time.includes(':')) {
        allSlots.push(task.start_time.trim().slice(0, 5));
      }
      if (Array.isArray(task.generated_times)) {
        task.generated_times.forEach((t: any) => {
          const str = typeof t === 'string' ? t.trim().slice(0, 5) : (t?.time24 || t?.time || '');
          if (str && str.includes(':') && !allSlots.includes(str)) {
            allSlots.push(str);
          }
        });
      }

      allSlots.sort((a, b) => {
        const [hA, mA] = a.split(':').map(Number);
        const [hB, mB] = b.split(':').map(Number);
        return hA * 60 + mA - (hB * 60 + mB);
      });

      const todayObj = new Date(nowMs);
      const pad = (n: number) => n.toString().padStart(2, '0');
      let baseStartDateStr = task.start_date || '';
      if (!baseStartDateStr && task.schedule_time) {
        baseStartDateStr = task.schedule_time.slice(0, 10);
      }
      if (!baseStartDateStr) {
        baseStartDateStr = `${todayObj.getFullYear()}-${pad(todayObj.getMonth() + 1)}-${pad(todayObj.getDate())}`;
      }

      if (allSlots.length > 0) {
        const [startYear, startMonth, startDay] = baseStartDateStr.split('-').map(Number);
        const startDateObj = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const todayDateOnly = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate(), 0, 0, 0, 0);
        const checkStartDate = startDateObj.getTime() > todayDateOnly.getTime() ? new Date(startDateObj) : new Date(todayDateOnly);

        for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
          const curDay = new Date(checkStartDate.getTime() + dayOffset * 24 * 3600 * 1000);
          const y = curDay.getFullYear();
          const m = curDay.getMonth();
          const d = curDay.getDate();

          for (const slot of allSlots) {
            const [h, min] = slot.split(':').map(Number);
            const slotCandidate = new Date(y, m, d, h, min, 0, 0);
            const candidateMs = slotCandidate.getTime();
            const isAfterLast = !task.last_posting_time || (candidateMs > new Date(task.last_posting_time).getTime() + 60 * 1000);

            if (candidateMs >= nowMs - 15000 && isAfterLast) {
              targetMs = candidateMs;
              break;
            }
          }
          if (targetMs) break;
        }
      } else if (task.scheduled_target_timestamp) {
        targetMs = task.scheduled_target_timestamp;
      } else if (task.schedule_time) {
        const d = new Date(task.schedule_time);
        if (!isNaN(d.getTime())) targetMs = d.getTime();
      } else if (task.next_execution_time) {
        const d = new Date(task.next_execution_time);
        if (!isNaN(d.getTime())) targetMs = d.getTime();
      }

      if (!targetMs) {
        return {
          nextDate: null,
          nextFormatted: task.start_time ? formatTime12h(task.start_time) : '06:29 PM',
          isWithin10Min: false,
          isDueNow: false,
          minutesRemaining: null
        };
      }

      const diffMs = targetMs - nowMs;
      const isWithin10Min = diffMs > 0 && diffMs <= 10 * 60 * 1000;
      const isDueNow = diffMs <= 0 && diffMs >= -30 * 1000 && task.status !== 'PAUSED' && task.status !== 'BLOCKED';
      const nextDate = new Date(targetMs);

      const isToday = nextDate.toDateString() === todayObj.toDateString();
      const tomorrowObj = new Date(todayObj);
      tomorrowObj.setDate(tomorrowObj.getDate() + 1);
      const isTomorrow = nextDate.toDateString() === tomorrowObj.toDateString();

      const timeStr = nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextFormatted = isToday ? timeStr : isTomorrow ? `Tomorrow, ${timeStr}` : `${nextDate.getMonth() + 1}/${nextDate.getDate()}, ${timeStr}`;
      const minutesRemaining = diffMs > 0 ? Math.ceil(diffMs / (60 * 1000)) : 0;

      return { nextDate, nextFormatted, isWithin10Min, isDueNow, minutesRemaining };
    } catch (err) {
      return {
        nextDate: null,
        nextFormatted: '—',
        isWithin10Min: false,
        isDueNow: false,
        minutesRemaining: null
      };
    }
  };

  // Color-Coded Post Live Status Logic
  const getPostLiveStatus = (task: AutoSenderTask, nowMs: number = Date.now()) => {
    const total = task.total_groups || (task.selected_group_ids?.length || task.target_group_jids?.length || 0);
    const sent = task.sent_count || 0;
    const failed = task.failed_count || 0;
    const pending = task.pending_count !== undefined ? task.pending_count : Math.max(0, total - sent - failed);
    const { isWithin10Min, isDueNow, minutesRemaining } = getTaskNextExecutionTime(task, nowMs);

    // 1. Paused / Blocked
    if (task.status === 'BLOCKED') {
      return {
        type: 'purple' as const,
        title: 'BLOCKED',
        label: 'BLOCKED 🚫',
        badge: 'Purple',
        desc: 'Deliveries stopped by user.',
        details: `Sent: ${sent}/${total} • Blocked`,
        boxBg: 'bg-[#F3E8FF] text-[#7E22CE]',
        iconColor: 'text-[#7E22CE]',
        badgeBg: 'bg-purple-500/15 text-purple-300 border border-purple-500/40',
        dotColor: 'bg-purple-400',
        indicatorLabel: 'Purple'
      };
    }
    if (task.status === 'PAUSED') {
      return {
        type: 'yellow' as const,
        title: 'PAUSED',
        label: 'PAUSED ⏸️',
        badge: 'Yellow',
        desc: 'Schedule on hold by user.',
        details: `Sent: ${sent}/${total} • Paused`,
        boxBg: 'bg-[#FEF3C7] text-[#92400E]',
        iconColor: 'text-[#92400E]',
        badgeBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
        dotColor: 'bg-amber-400',
        indicatorLabel: 'Yellow'
      };
    }

    // 2. Sending / In Progress
    if (task.status === 'SENDING' || task.status === 'EXECUTING') {
      return {
        type: 'blue' as const,
        title: 'SENDING',
        label: 'SENDING 🚀',
        badge: 'Blue',
        desc: 'Actively processing deliveries on cloud.',
        details: `Sending to ${total} Groups...`,
        boxBg: 'bg-[#DBEAFE] text-[#1D4ED8]',
        iconColor: 'text-[#1D4ED8]',
        badgeBg: 'bg-blue-500/15 text-blue-300 border border-blue-500/40',
        dotColor: 'bg-blue-400 animate-pulse',
        indicatorLabel: 'Blue'
      };
    }

    // 3. Completed / Confirmed Sent (Green)
    if (total > 0 && sent >= total && failed === 0 && sent > 0 && task.status !== 'PENDING' && task.status !== 'SCHEDULED') {
      return {
        type: 'green' as const,
        title: 'SENT COMPLETE',
        label: '✓ SEND',
        badge: 'Green',
        desc: 'All required deliveries confirmed successful by backend.',
        details: `Sent: ${sent}/${total} Groups Confirmed`,
        boxBg: 'bg-[#DCFCE7] text-[#15803D]',
        iconColor: 'text-[#15803D]',
        badgeBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
        dotColor: 'bg-emerald-400',
        indicatorLabel: 'Green'
      };
    }

    // 4. Failed (Red)
    if (failed > 0 && sent === 0) {
      return {
        type: 'red' as const,
        title: 'FAILED',
        label: '✕ FAILED',
        badge: 'Red',
        desc: 'All group delivery attempts failed.',
        details: `Failed: ${failed}/${total}`,
        boxBg: 'bg-[#FEE2E2] text-[#B91C1C]',
        iconColor: 'text-[#B91C1C]',
        badgeBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/40',
        dotColor: 'bg-rose-400',
        indicatorLabel: 'Red'
      };
    }

    // 5. Default Pending (Yellow)
    return {
      type: 'yellow' as const,
      title: 'PENDING',
      label: '◷ PENDING',
      badge: 'Yellow',
      desc: isWithin10Min ? `Upcoming send in ${minutesRemaining}m • Waiting to send.` : 'Scheduled sending time has not arrived or awaiting confirmation.',
      details: isWithin10Min ? `Upcoming in ${minutesRemaining}m • Waiting to send` : `Pending: ${pending || total}/${total} Groups`,
      boxBg: 'bg-[#FEF3C7] text-[#92400E]',
      iconColor: 'text-[#92400E]',
      badgeBg: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
      dotColor: 'bg-amber-400',
      indicatorLabel: 'Yellow'
    };
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scamImageInputRef = useRef<HTMLInputElement | null>(null);
  const scamAudioInputRef = useRef<HTMLInputElement | null>(null);
  const trustedImageInputRef = useRef<HTMLInputElement | null>(null);
  const trustedAudioInputRef = useRef<HTMLInputElement | null>(null);
  const trustedDocInputRef = useRef<HTMLInputElement | null>(null);

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, options);
  };

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 5000);
  };

  // Convert "09:00" or ISO to formatted 12-hour AM/PM
  const formatTime12h = (timeStr: string) => {
    try {
      let hours = 0;
      let minutes = 0;
      if (timeStr.includes(':') && !timeStr.includes('T')) {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;
      } else {
        const d = new Date(timeStr);
        hours = d.getHours();
        minutes = d.getMinutes();
      }
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      const mStr = minutes.toString().padStart(2, '0');
      return `${h12}:${mStr} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Calculate automated daily posting slots
  const calculatedScheduleSlots = useMemo<CalculatedScheduleSlot[]>(() => {
    const slots: CalculatedScheduleSlot[] = [];
    const [startH, startM] = startTime.split(':').map(n => parseInt(n, 10) || 0);

    for (let i = 0; i < postsPerDay; i++) {
      const totalHours = startH + i * postingIntervalHours;
      const wrappedHour = totalHours % 24;
      const ampm = wrappedHour >= 12 ? 'PM' : 'AM';
      const h12 = wrappedHour % 12 || 12;
      const mStr = (startM || 0).toString().padStart(2, '0');
      const h24Str = wrappedHour.toString().padStart(2, '0');

      let label = '';
      if (i === 0) label = 'First scheduled post';
      else if (i === 1) label = 'Second scheduled post';
      else if (i === 2) label = 'Third scheduled post';
      else if (i === 3) label = 'Fourth scheduled post';
      else if (i === 4) label = 'Fifth scheduled post';
      else label = `Scheduled post #${i + 1}`;

      slots.push({
        index: i + 1,
        label,
        time12: `${h12}:${mStr} ${ampm}`,
        time24: `${h24Str}:${mStr}`,
        hour: wrappedHour,
        minute: startM || 0
      });
    }
    return slots;
  }, [startTime, postsPerDay, postingIntervalHours]);

  // Strictly filter for eligible real WhatsApp groups (excluding private chats, status broadcast, inaccessible announcement channels)
  const eligibleGroups = useMemo(() => {
    return groups.filter(g => {
      const jid = g.jid || '';
      return jid.endsWith('@g.us') && !jid.includes('status') && g.can_send !== false;
    });
  }, [groups]);

  const filteredEligibleGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return eligibleGroups;
    return eligibleGroups.filter(g =>
      (g.name || '').toLowerCase().includes(q) ||
      (g.jid || '').toLowerCase().includes(q)
    );
  }, [eligibleGroups, groupSearch]);

  // Aggregate Account-Level Statistics
  const accountStats = useMemo(() => {
    const totalEligible = groups.filter(g => g.can_send !== false).length;
    let totalSent = 0;
    let totalFailed = 0;
    let totalPending = 0;
    let activeSchedules = 0;

    tasks.forEach(t => {
      totalSent += t.sent_count || 0;
      totalFailed += t.failed_count || 0;
      totalPending += t.pending_count || 0;
      if (t.status === 'ACTIVE' || t.status === 'SCHEDULED') {
        activeSchedules++;
      }
    });

    scamReports.forEach(r => {
      totalSent += r.sent_count || 0;
      totalFailed += r.failed_count || 0;
      totalPending += r.pending_count || 0;
    });

    trustedPosts.forEach(tp => {
      totalSent += tp.sent_count || 0;
      totalFailed += tp.failed_count || 0;
      totalPending += tp.pending_count || 0;
      if (tp.status === 'ACTIVE' || tp.status === 'SCHEDULED') {
        activeSchedules++;
      }
    });

    return {
      totalEligibleGroups: totalEligible,
      totalPostsSent: totalSent,
      totalFailedSends: totalFailed,
      totalPendingSends: totalPending,
      totalSavedPosts: tasks.length,
      activeSchedules
    };
  }, [groups, tasks, scamReports, trustedPosts]);

  // Dedicated Trusted Post Statistics
  const trustedStats = useMemo(() => {
    const totalEligible = groups.filter(g => g.can_send !== false).length;
    let totalSent = 0;
    let totalFailed = 0;
    let totalPending = 0;
    let totalScheduled = 0;

    trustedPosts.forEach(tp => {
      totalSent += tp.sent_count || 0;
      totalFailed += tp.failed_count || 0;
      totalPending += tp.pending_count || 0;
      if (tp.status === 'SCHEDULED' || tp.status === 'ACTIVE') {
        totalScheduled++;
      }
    });

    return {
      eligibleGroups: totalEligible,
      totalEligible,
      totalSent,
      totalFailed,
      totalPending,
      totalScheduled
    };
  }, [groups, trustedPosts]);

  // Dedicated Scam Report Statistics
  const scamStats = useMemo(() => {
    const totalEligible = groups.filter(g => g.can_send !== false).length;
    let totalSent = 0;
    let totalFailed = 0;
    let totalPending = 0;
    let totalScheduled = 0;

    scamReports.forEach(r => {
      totalSent += r.sent_count || 0;
      totalFailed += r.failed_count || 0;
      totalPending += r.pending_count || 0;
      if ((r.status as string) === 'DRAFT' || (r.status as string) === 'SENDING') {
        totalScheduled++;
      }
    });

    return {
      eligibleGroups: totalEligible,
      totalEligible,
      totalSent,
      totalFailed,
      totalPending,
      totalScheduled
    };
  }, [groups, scamReports]);

  // Fetch Status and Synchronize Data
  const fetchStatusAndData = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [statusRes, groupsRes, tasksRes, scamRes, trustedRes, historyRes, statusNotifsRes, myStatusRes] = await Promise.all([
        apiFetch('/api/auto-sender/status'),
        apiFetch('/api/auto-sender/groups'),
        apiFetch('/api/auto-sender/tasks'),
        apiFetch('/api/auto-sender/scam-reports').catch(() => null),
        apiFetch('/api/auto-sender/trusted-posts').catch(() => null),
        apiFetch('/api/auto-sender/history').catch(() => null),
        apiFetch('/api/auto-sender/status-notifications').catch(() => null),
        apiFetch('/api/auto-sender/my-statuses').catch(() => null)
      ]);

      if (statusRes.ok) {
        const statusData: AutoSenderStatus = await statusRes.json();
        setStatus(statusData);
      }

      if (groupsRes.ok) {
        const groupsData: CenterGroup[] = await groupsRes.json();
        const uniqueMap = new Map<string, CenterGroup>();
        groupsData.forEach(g => {
          if (g.jid && !uniqueMap.has(g.jid)) {
            uniqueMap.set(g.jid, g);
          }
        });
        setGroups(Array.from(uniqueMap.values()));
      }

      if (tasksRes.ok) {
        const tasksData: AutoSenderTask[] = await tasksRes.json();
        setTasks(tasksData);
        if (!selectedTaskIdForStatus && tasksData.length > 0) {
          setSelectedTaskIdForStatus(tasksData[0].post_id || tasksData[0].id);
        }
      }

      if (scamRes && scamRes.ok) {
        const scamData: ScamReportTask[] = await scamRes.json();
        setScamReports(Array.isArray(scamData) ? scamData : []);
      }

      if (trustedRes && trustedRes.ok) {
        const trustedData: TrustedPostTask[] = await trustedRes.json();
        setTrustedPosts(Array.isArray(trustedData) ? trustedData : []);
      }

      if (statusNotifsRes && statusNotifsRes.ok) {
        const notifsData = await statusNotifsRes.json();
        setStatusNotifications(Array.isArray(notifsData) ? notifsData : []);
      }

      if (myStatusRes && myStatusRes.ok) {
        const myStatusData = await myStatusRes.json();
        if (myStatusData.statuses && Array.isArray(myStatusData.statuses)) {
          setLiveMyStatuses(myStatusData.statuses);
        }
      }



      if (historyRes && historyRes.ok) {
        const histData = await historyRes.json();
        if (histData.logs) {
          setHistoryLogs(histData.logs);
        }
      }
    } catch (err) {
      console.error('[AUTO_SENDER] Poll error:', err);
    } finally {
      if (isInitial) setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTaskIdForStatus]);

  useEffect(() => {
    fetchStatusAndData(true);
    const interval = setInterval(() => {
      fetchStatusAndData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchStatusAndData]);

  // Client-Side Live Trigger: Automatically initiate execution at the exact scheduled second
  useEffect(() => {
    if (!isConnected) return;
    if (tasks.length > 0) {
      tasks.forEach(task => {
        if (task.status === 'PAUSED' || task.status === 'BLOCKED' || task.status === 'SENDING' || task.status === 'EXECUTING') return;
        const { isDueNow } = getTaskNextExecutionTime(task, currentTime);
        if (isDueNow) {
          const taskId = task.post_id || task.id;
          apiFetch(`/api/auto-sender/tasks/${taskId}/execute`, { method: 'POST' })
            .then(() => fetchStatusAndData(false))
            .catch(() => { });
        }
      });
    }

  }, [currentTime, isConnected, tasks, fetchStatusAndData]);


  // Real-Time Poller for Status Notification Dedicated Live View Modal
  useEffect(() => {
    if (!statusNotifLiveViewModalTask) {
      setStatusNotifLiveViewData(null);
      setStatusNotifLiveViewPolling(false);
      return;
    }
    const currentTaskId = statusNotifLiveViewModalTask.post_id || statusNotifLiveViewModalTask.id;
    let isMounted = true;

    const pollLiveView = async () => {
      try {
        const res = await apiFetch(`/api/auto-sender/status-notifications/${currentTaskId}/live-view`);
        if (res.ok && isMounted) {
          const data = await res.json();
          setStatusNotifLiveViewData(data);
          if (data.task) {
            setStatusNotifLiveViewModalTask(prev => prev ? { ...prev, ...data.task } : null);
          }
        }
      } catch (err) {
        console.error('[STATUS_NOTIF_LIVE_VIEW] Poll error:', err);
      }
    };

    setStatusNotifLiveViewPolling(true);
    pollLiveView();
    const liveInterval = setInterval(pollLiveView, 2000);
    return () => {
      isMounted = false;
      clearInterval(liveInterval);
    };
  }, [statusNotifLiveViewModalTask?.post_id, statusNotifLiveViewModalTask?.id]);

  const handleRefreshQr = async () => {
    try {
      setRefreshing(true);
      await apiFetch('/api/auto-sender/refresh-qr', { method: 'POST' });
      await fetchStatusAndData(false);
      showNotification('success', 'New QR Code generated.');
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRequestPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) return;
    setIsPairingLoading(true);
    setPairingError(null);
    try {
      const res = await apiFetch('/api/auto-sender/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pairingPhone.trim(), phoneNumber: pairingPhone.trim() })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setPairingError(data?.error || 'Failed to generate WhatsApp pairing code.');
      } else {
        const code = data?.pairingCode || data?.code || null;
        if (code) {
          setStatus(prev => prev ? { ...prev, pairingCode: code } : {
            status: 'WAITING_FOR_QR',
            pairingCode: code,
            socketStatusMessage: `Pairing code generated: ${code}`,
            phone: '',
            qrDataUrl: '',
            connectedAt: null,
            profile: null
          } as any);
        }
        await fetchStatusAndData(false);
        const codeMsg = code ? `Pairing Code: ${code}` : 'Pairing code generated. Check WhatsApp on your phone.';
        showNotification('success', codeMsg);
      }
    } catch (err: any) {
      setPairingError(err.message || 'Network error requesting pairing code.');
    } finally {
      setIsPairingLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Are you sure you want to unlink the WhatsApp Auto Sender session?')) return;
    setIsUnlinking(true);
    try {
      await apiFetch('/api/auto-sender/unlink', { method: 'POST' });
      await fetchStatusAndData(false);
      showNotification('info', 'WhatsApp Auto Sender unlinked.');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSyncGroups = async () => {
    try {
      setRefreshing(true);
      const res = await apiFetch('/api/auto-sender/groups/sync', { method: 'POST' });
      const data = await res.json();
      if (data.groups) {
        const uniqueMap = new Map<string, CenterGroup>();
        data.groups.forEach((g: CenterGroup) => {
          if (g.jid && !uniqueMap.has(g.jid)) uniqueMap.set(g.jid, g);
        });
        setGroups(Array.from(uniqueMap.values()));
        showNotification('success', `Synchronized ${data.groups.length} real WhatsApp groups.`);
      }
      await fetchStatusAndData(false);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleViewMembers = async (group: CenterGroup) => {
    setSelectedGroupForMembers(group);
    setLiveGroupMembers([]);
    setLoadingMembers(true);
    setMemberSearch('');
    try {
      const res = await apiFetch(`/api/auto-sender/groups/${encodeURIComponent(group.jid)}/members`);
      const data = await res.json();
      if (data.members) {
        setLiveGroupMembers(data.members);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // ==========================================
  // EXPORT MEMBER NUMBERS TO EXCEL (.xlsx)
  // ==========================================
  const handleExportMemberNumbers = async (group: CenterGroup) => {
    setExportingGroupId(group.jid);
    try {
      const res = await apiFetch(`/api/auto-sender/groups/${encodeURIComponent(group.jid)}/export-members`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Export failed');
      }

      const blob = await res.blob();
      const exportDateStr = new Date().toISOString().slice(0, 10);
      const cleanName = group.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}_Members_${exportDateStr}.xlsx`;

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showNotification('success', `Successfully exported real member records for "${group.name}" to ${filename}`);
    } catch (err: any) {
      showNotification('error', `Failed to export member numbers: ${err.message || 'Server error'}`);
    } finally {
      setExportingGroupId(null);
    }
  };

  // ==========================================
  // DELETE GROUP ACTION (CONFIRMATION MODAL)
  // ==========================================
  const handleConfirmDeleteGroup = async () => {
    if (!groupToDelete) return;
    setIsDeletingGroup(true);
    try {
      const res = await apiFetch(`/api/auto-sender/groups/${encodeURIComponent(groupToDelete.jid)}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: deleteGroupAction })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to perform group action');

      showNotification('success', data.message || 'Group action completed successfully.');
      setGroupToDelete(null);
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', `Group operation failed: ${err.message}`);
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // ==========================================
  // AUTO POST ACTIONS
  // ==========================================
  const handleToggleTaskPause = async (taskId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'PAUSED' ? 'resume' : 'pause';
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/${action}`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', `Post schedule ${action === 'resume' ? 'resumed' : 'paused'}.`);
        await fetchStatusAndData(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTaskBlock = async (taskId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'BLOCKED' ? 'unblock' : 'block';
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/${action}`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', `Post schedule ${action === 'unblock' ? 'unblocked' : 'blocked'}.`);
        await fetchStatusAndData(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    try {
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/retry`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Retry execution queued on 24/7 Cloud Server.');
        await fetchStatusAndData(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('info', 'Post schedule record deleted from database.');
        setDeleteRecordModalTask(null);
        await fetchStatusAndData(false);
      } else {
        const data = await res.json().catch(() => ({}));
        showNotification('error', 'Delete failed: ' + (data.error || 'Server error'));
      }
    } catch (e: any) {
      console.error(e);
      showNotification('error', 'Delete error: ' + (e?.message || 'Network error'));
    }
  };

  const handleExecuteNow = async (taskId: string) => {
    try {
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/execute`, { method: 'POST' });
      if (res.ok) {
        showNotification('success', 'Immediate post broadcast initiated in background.');
        await fetchStatusAndData(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAllSentPosts = async () => {
    setIsDeletingSentPosts(true);
    setDeleteSentResults(null);
    try {
      const res = await apiFetch('/api/auto-sender/tasks/delete-all-sent-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelFutureSchedules: cancelFutureOnDelete })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete sent messages');
      setDeleteSentResults(data);
      showNotification('success', `Deleted ${data.totalDeleted} sent messages from WhatsApp recipient groups.`);
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', 'Delete all request failed: ' + (err?.message || err));
    } finally {
      setIsDeletingSentPosts(false);
    }
  };

  const handleDeleteSingleGroupSentPost = async (taskId: string, groupJid: string) => {
    if (!window.confirm('Delete this sent message from this WhatsApp group for everyone?')) return;
    try {
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/groups/${encodeURIComponent(groupJid)}/delete-sent-post`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        showNotification('success', 'Message deleted on WhatsApp recipient group.');
      } else {
        showNotification('error', 'Delete failed: ' + (data.error || 'Unknown error'));
      }
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', 'Delete error: ' + err.message);
    }
  };

  const handleOpenNewPostForm = () => {
    setEditingPostId(null);
    setToolName('');
    setMessageText('');
    setUploadedImageMeta(null);
    setImageAltText('');
    setSelectedGroups([]);
    setGroupIntervalMode('5');
    setGroupIntervalCustomSeconds(5);
    setStartTime(getSuggestedStartTime());
    setActiveTab('new-post');
  };

  const handleEditTask = (task: AutoSenderTask) => {
    const taskId = task.post_id || task.id;
    setEditingPostId(taskId);
    setToolName(task.tool_name || task.head_name || task.image_alt_text || '');
    setMessageText(task.message || '');
    setImageAltText(task.image_alt_text || '');
    setSelectedGroups(task.selected_group_ids || task.target_group_jids || []);
    if (task.group_interval_seconds) {
      if ([4, 5, 10, 20].includes(task.group_interval_seconds)) {
        setGroupIntervalMode(String(task.group_interval_seconds) as any);
      } else {
        setGroupIntervalMode('custom');
        setGroupIntervalCustomSeconds(task.group_interval_seconds);
      }
    } else {
      setGroupIntervalMode('5');
      setGroupIntervalCustomSeconds(5);
    }
    if (task.image_url) {
      setUploadedImageMeta({
        image_url: task.image_url,
        image_path: task.image_path,
        filename: task.image_filename || 'Uploaded Post Image',
        size: task.image_size || 'Asset',
        dimensions: task.image_dimensions || 'Asset'
      });
    } else {
      setUploadedImageMeta(null);
    }
    setScheduleTime(task.schedule_time ? task.schedule_time.slice(0, 16) : '');
    setStartDate(task.start_date || (task.schedule_time ? task.schedule_time.slice(0, 10) : new Date().toISOString().slice(0, 10)));
    setStartTime(task.start_time || getSuggestedStartTime());
    setPostsPerDay(task.posts_per_day || 3);
    setPostingIntervalHours(task.interval_hours || 3);
    setValidityDuration(task.validity_duration || '1_month');
    setMentionAllInPost(Boolean(task.mention_all));
    setActiveTab('new-post');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    showNotification('info', `Now editing: ${task.tool_name || task.head_name || 'Post'} (#${task.order_id || taskId})`);
  };

  const handleRetryTaskGroup = async (taskId: string, jid: string) => {
    try {
      showNotification('info', 'Retrying sequential delivery for group...');
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/groups/${encodeURIComponent(jid)}/retry`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry request failed');
      showNotification('success', 'Group delivery retry initiated sequentially.');
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', err?.message || 'Failed to retry group');
    }
  };

  const handleDeleteTaskSentPosts = async () => {
    if (!deleteSentPostModalTask) return;
    setIsDeletingSentPosts(true);
    const taskId = deleteSentPostModalTask.post_id || deleteSentPostModalTask.id;
    try {
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/delete-sent-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelFutureSchedules: cancelFutureOnDelete })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete sent messages');
      setDeleteSentResults(data);
      if (data.totalDeleted > 0) {
        showNotification('success', `Deleted ${data.totalDeleted} messages across WhatsApp groups.`);
      } else {
        showNotification('info', data.message || 'No confirmed sent messages found on WhatsApp recipient groups to delete.');
      }
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', 'Delete failed: ' + (err?.message || err));
    } finally {
      setIsDeletingSentPosts(false);
    }
  };

  const handleSaveScheduleFromModal = async () => {
    if (!scheduleModalTask) return;
    setIsSavingSchedule(true);
    const taskId = scheduleModalTask.post_id || scheduleModalTask.id;
    try {
      let modalStartDate: string | undefined;
      let modalStartTime: string | undefined;
      let modalIso: string | undefined;
      if (newScheduleTime) {
        const dt = new Date(newScheduleTime);
        const pad = (n: number) => n.toString().padStart(2, '0');
        modalStartDate = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
        modalStartTime = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        modalIso = dt.toISOString();
      }
      const res = await apiFetch(`/api/auto-sender/tasks/${taskId}/change-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_time: modalIso,
          start_date: modalStartDate,
          start_time: modalStartTime,
          posts_per_day: newPostsPerDay,
          interval_hours: newIntervalHours,
          validity_duration: newValidityDuration
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update schedule');
      showNotification('success', 'Auto Post schedule updated.');
      setScheduleModalTask(null);
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', 'Update schedule failed: ' + (err?.message || err));
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // ==========================================
  // SCAM REPORT ACTIONS
  // ==========================================
  const handleSaveOrSendScamReport = async (sendNow: boolean) => {
    if (!scamTitle.trim() || !scamReportedNumber.trim()) {
      setScamSubmitFeedback({ type: 'error', text: 'Please enter Report Title and Reported Number.' });
      return;
    }
    if (scamSelectedGroups.length === 0) {
      setScamSubmitFeedback({ type: 'error', text: 'STRICT LOCK: Please select at least one WhatsApp group.' });
      return;
    }

    setIsSubmittingScam(true);
    setScamSubmitFeedback(null);

    try {
      const payload = {
        title: scamTitle.trim(),
        reported_number: scamReportedNumber.trim(),
        description: scamDescription.trim(),
        proof_images: scamProofImages,
        proof_audios: scamProofAudios,
        target_group_jids: scamSelectedGroups,
        send_immediately: sendNow
      };

      const res = await apiFetch('/api/auto-sender/scam-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save/send scam report');
      }

      setScamSubmitFeedback({
        type: 'success',
        text: sendNow
          ? '🚨 Scam Report broadcast initiated in background across selected groups!'
          : '💾 Scam Report draft saved successfully!'
      });

      setScamTitle('');
      setScamReportedNumber('');
      setScamDescription('');
      setScamProofImages([]);
      setScamProofAudios([]);
      setScamSelectedGroups([]);

      await fetchStatusAndData(false);
      setTimeout(() => {
        setScamSubTab('history');
        setScamSubmitFeedback(null);
      }, 1200);
    } catch (err: any) {
      setScamSubmitFeedback({ type: 'error', text: err.message || 'Scam report broadcast failed.' });
    } finally {
      setIsSubmittingScam(false);
    }
  };

  const handleExecuteScamReport = async (reportId: string) => {
    try {
      await apiFetch(`/api/auto-sender/scam-reports/${reportId}/execute`, { method: 'POST' });
      showNotification('success', 'Scam Report broadcast started.');
      await fetchStatusAndData(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRetryScamReport = async (reportId: string) => {
    try {
      await apiFetch(`/api/auto-sender/scam-reports/${reportId}/retry`, { method: 'POST' });
      showNotification('success', 'Retrying failed group deliveries.');
      await fetchStatusAndData(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteScamReportSentPosts = async () => {
    if (!scamReportForDeletion) return;
    setIsDeletingScamMessages(true);
    try {
      const res = await apiFetch(`/api/auto-sender/scam-reports/${scamReportForDeletion.id}/delete-sent-posts`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete scam report messages');
      setScamDeletionResults({ reportId: scamReportForDeletion.id, results: data.results || [] });
      showNotification('success', 'Message revocation command dispatched.');
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', 'Delete failed: ' + err.message);
    } finally {
      setIsDeletingScamMessages(false);
    }
  };

  const handleDeleteScamReport = async (reportId: string) => {
    if (!window.confirm('Delete this scam report record from the database?')) return;
    try {
      await apiFetch(`/api/auto-sender/scam-reports/${reportId}`, { method: 'DELETE' });
      showNotification('info', 'Scam report record deleted.');
      await fetchStatusAndData(false);
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // TRUSTED POST ACTIONS
  // ==========================================
  const handleTrustedDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTrustedDoc(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const res = await apiFetch('/api/auto-sender/upload-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileData: base64, filename: file.name })
        });
        const data = await res.json();
        if (res.ok) {
          setTrustedDocUrl(data.file_url);
          setTrustedDocFilename(file.name);
          showNotification('success', 'Document uploaded successfully.');
        } else {
          showNotification('error', data.error || 'Failed to upload document.');
        }
      } catch (err: any) {
        showNotification('error', err.message);
      } finally {
        setIsUploadingTrustedDoc(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOrSendTrustedPost = async (sendNow: boolean) => {
    if (!trustedTitle.trim() || !trustedName.trim()) {
      setTrustedSubmitFeedback({ type: 'error', text: 'Please enter Post Title and Trusted Entity Name.' });
      return;
    }
    if (trustedSelectedGroups.length === 0) {
      setTrustedSubmitFeedback({ type: 'error', text: 'STRICT LOCK: Please select at least one WhatsApp group.' });
      return;
    }

    setIsSubmittingTrusted(true);
    setTrustedSubmitFeedback(null);

    try {
      const payload = {
        title: trustedTitle.trim(),
        trusted_name: trustedName.trim(),
        contact_info: trustedContact.trim(),
        description: trustedDescription.trim(),
        image_url: trustedImageUrl || undefined,
        audio_url: trustedAudioUrl || undefined,
        document_url: trustedDocUrl || undefined,
        document_filename: trustedDocFilename || undefined,
        target_group_jids: trustedSelectedGroups,
        schedule_mode: sendNow ? 'IMMEDIATE' : trustedScheduleMode,
        schedule_time: sendNow ? new Date().toISOString() : (trustedScheduleTime ? new Date(trustedScheduleTime).toISOString() : new Date().toISOString()),
        is_draft: !sendNow && trustedScheduleMode === 'IMMEDIATE'
      };

      const res = await apiFetch('/api/auto-sender/trusted-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save trusted post');

      setTrustedSubmitFeedback({
        type: 'success',
        text: sendNow
          ? '🛡️ Trusted Post broadcast initiated in background!'
          : '💾 Trusted Post saved / scheduled successfully!'
      });

      setTrustedTitle('');
      setTrustedName('');
      setTrustedContact('');
      setTrustedDescription('');
      setTrustedImageUrl('');
      setTrustedAudioUrl('');
      setTrustedSelectedGroups([]);

      await fetchStatusAndData(false);
      setTimeout(() => {
        setTrustedSubTab('history');
        setTrustedSubmitFeedback(null);
      }, 1200);
    } catch (err: any) {
      setTrustedSubmitFeedback({ type: 'error', text: err.message || 'Failed to submit trusted post.' });
    } finally {
      setIsSubmittingTrusted(false);
    }
  };

  const handleExecuteTrustedPost = async (postId: string) => {
    try {
      await apiFetch(`/api/auto-sender/trusted-posts/${postId}/execute`, { method: 'POST' });
      showNotification('success', 'Trusted post broadcast initiated.');
      await fetchStatusAndData(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryTrustedPost = async (postId: string) => {
    try {
      await apiFetch(`/api/auto-sender/trusted-posts/${postId}/retry`, { method: 'POST' });
      showNotification('success', 'Retrying failed group dispatches.');
      await fetchStatusAndData(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTrustedPause = async (postId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'PAUSED' ? 'resume' : 'pause';
      await apiFetch(`/api/auto-sender/trusted-posts/${postId}/${action}`, { method: 'POST' });
      showNotification('success', `Trusted post schedule ${action === 'resume' ? 'resumed' : 'paused'}.`);
      await fetchStatusAndData(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTrustedPostSentMessages = async () => {
    if (!trustedPostForDeletion) return;
    setIsDeletingTrustedMessages(true);
    try {
      const res = await apiFetch(`/api/auto-sender/trusted-posts/${trustedPostForDeletion.id}/delete-sent-posts`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete sent messages');
      setTrustedDeletionResults({ postId: trustedPostForDeletion.id, results: data.results || [] });
      showNotification('success', 'Revocation command executed across target groups.');
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', 'Delete error: ' + err.message);
    } finally {
      setIsDeletingTrustedMessages(false);
    }
  };

  const handleDeleteTrustedPost = async (postId: string) => {
    if (!window.confirm('Delete this trusted post record from database?')) return;
    try {
      await apiFetch(`/api/auto-sender/trusted-posts/${postId}`, { method: 'DELETE' });
      showNotification('info', 'Trusted post record deleted.');
      await fetchStatusAndData(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearCompletedTasks = async () => {
    if (!window.confirm('Clear all expired and cancelled tasks from database?')) return;
    try {
      await apiFetch('/api/auto-sender/clear-completed', { method: 'POST' });
      showNotification('info', 'Completed and cancelled tasks cleared.');
      await fetchStatusAndData(false);
    } catch (err) {
      console.error(err);
    }
  };

  const calculateDurationExpiryDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() && !uploadedImageMeta) {
      setSubmitFeedback({ type: 'error', text: 'Please write a caption or upload an image.' });
      return;
    }
    if (selectedGroups.length === 0) {
      setSubmitFeedback({ type: 'error', text: 'STRICT LOCK: Please select at least one WhatsApp group.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const months = getDurationMonths(validityDuration);
      let computedScheduleTime: string;
      if (sendImmediately) {
        computedScheduleTime = new Date().toISOString();
      } else {
        const cleanDate = startDate || new Date().toISOString().slice(0, 10);
        const cleanTime = startTime || '09:00';
        const [yr, mo, da] = cleanDate.split('-').map(Number);
        const [hr, mn] = cleanTime.split(':').map(Number);
        const schedObj = new Date(yr, mo - 1, da, hr, mn, 0, 0);
        computedScheduleTime = schedObj.toISOString();
      }

      const payload = {
        image_url: uploadedImageMeta?.image_url,
        image_path: uploadedImageMeta?.image_path,
        image_filename: uploadedImageMeta?.filename,
        image_size: uploadedImageMeta?.size,
        image_dimensions: uploadedImageMeta?.dimensions,
        tool_name: toolName.trim() || undefined,
        head_name: toolName.trim() || undefined,
        image_alt_text: toolName.trim() || imageAltText.trim() || undefined,
        message: messageText.trim(),
        target_group_jids: selectedGroups,
        schedule_time: computedScheduleTime,
        schedule_mode: sendImmediately ? 'IMMEDIATE' : 'SCHEDULED',
        posts_per_day: postsPerDay,
        interval_hours: postingIntervalHours,
        group_interval_seconds: activeGroupIntervalSeconds,
        start_date: startDate,
        start_time: startTime,
        calculated_interval: `${postingIntervalHours} hours`,
        generated_times: calculatedScheduleSlots.map(s => s.time24),
        validity_duration: validityDuration,
        active_duration_months: months,
        mention_all: mentionAllInPost
      };

      let res: Response;
      if (editingPostId) {
        res = await apiFetch(`/api/auto-sender/tasks/${editingPostId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/auto-sender/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save post schedule');

      setSubmitFeedback({
        type: 'success',
        text: editingPostId ? '✅ Post schedule updated successfully!' : '🚀 Auto Post scheduled & active on 24/7 Cloud Server!'
      });

      setEditingPostId(null);
      setToolName('');
      setMessageText('');
      setUploadedImageMeta(null);
      setImageAltText('');
      setSelectedGroups([]);
      setStartTime(getSuggestedStartTime());

      await fetchStatusAndData(false);
      setTimeout(() => {
        setActiveTab('schedules');
        setSubmitFeedback(null);
      }, 1200);
    } catch (err: any) {
      setSubmitFeedback({ type: 'error', text: err.message || 'Submission error.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Image Upload Handlers
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = async () => {
        const dimStr = `${img.width}x${img.height}`;
        try {
          const res = await apiFetch('/api/auto-sender/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl,
              filename: file.name,
              dimensions: dimStr
            })
          });
          const data = await res.json();
          if (res.ok) {
            setUploadedImageMeta({
              image_url: data.image_url,
              image_path: data.image_path,
              filename: data.filename,
              size: data.size,
              dimensions: data.dimensions
            });
            showNotification('success', 'Image uploaded successfully.');
          } else {
            alert('Upload failed: ' + data.error);
          }
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setUploadingImage(false);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Scam Proof Image Upload Handler
  const handleScamImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingScamImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const res = await apiFetch('/api/auto-sender/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: `scam_${file.name}` })
        });
        const data = await res.json();
        if (res.ok && data.image_url) {
          setScamProofImages(prev => [...prev, data.image_url]);
          showNotification('success', 'Proof image attached.');
        }
      } catch (err: any) {
        alert('Upload failed: ' + err.message);
      } finally {
        setIsUploadingScamImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Scam Voice/Audio Upload Handler
  const handleScamAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingScamAudio(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const audioData = event.target?.result as string;
      try {
        const res = await apiFetch('/api/auto-sender/upload-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData, filename: file.name })
        });
        const data = await res.json();
        if (res.ok && data.audio_url) {
          setScamProofAudios(prev => [...prev, data.audio_url]);
          showNotification('success', 'Voice note proof attached.');
        }
      } catch (err: any) {
        alert('Audio upload failed: ' + err.message);
      } finally {
        setIsUploadingScamAudio(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trusted Post Image Upload Handler
  const handleTrustedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTrustedImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      try {
        const res = await apiFetch('/api/auto-sender/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: `trusted_${file.name}` })
        });
        const data = await res.json();
        if (res.ok && data.image_url) {
          setTrustedImageUrl(data.image_url);
          showNotification('success', 'Logo/Image attached.');
        }
      } catch (err: any) {
        alert('Upload failed: ' + err.message);
      } finally {
        setIsUploadingTrustedImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Trusted Post Audio Upload Handler
  const handleTrustedAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingTrustedAudio(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const audioData = event.target?.result as string;
      try {
        const res = await apiFetch('/api/auto-sender/upload-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData, filename: file.name })
        });
        const data = await res.json();
        if (res.ok && data.audio_url) {
          setTrustedAudioUrl(data.audio_url);
          showNotification('success', 'Audio note attached.');
        }
      } catch (err: any) {
        alert('Audio upload failed: ' + err.message);
      } finally {
        setIsUploadingTrustedAudio(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ==========================================
  // STATUS NOTIFICATION HANDLERS
  // ==========================================
  const handleOpenNewStatusUploadModal = () => {
    setStatusNotifName('');
    setStatusNotifContentType('image');
    setStatusNotifImageUrl('');
    setStatusNotifImagePath('');
    setStatusNotifImageFilename('');
    setStatusNotifVideoUrl('');
    setStatusNotifVideoPath('');
    setStatusNotifVideoFilename('');
    setStatusNotifText('');
    setStatusNotifBgColor('#075E54');
    setStatusNotifCaption('');
    setStatusNotifLink('');
    setStatusNotifSelectedAccount(status?.phone ? `+${status.phone} - ${status.name || 'Mujahid Abbas'}` : 'Primary Connected Account');
    setStatusNotifSelectedGroups([]); // Strict: Only explicitly tagged groups receive notifications
    setStatusNotifFrequency(3);
    setStatusNotifDurationHours(24);
    setStatusNotifCustomDuration('24');
    setStatusNotifStartTime(getSuggestedStartTime());
    setStatusNotifIntervalHours(3);
    setStatusNotifSubmitFeedback(null);
    setStatusNotifModalOpen(true);
  };

  const handleStatusNotifImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      alert('Image file size must be less than 16MB.');
      return;
    }

    setIsUploadingStatusNotifImage(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      try {
        const res = await apiFetch('/api/auto-sender/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, filename: file.name })
        });
        const data = await res.json();
        if (res.ok && data.image_url) {
          setStatusNotifImageUrl(data.image_url);
          setStatusNotifImagePath(data.image_path || '');
          setStatusNotifImageFilename(file.name);
          showNotification('success', 'Image status media uploaded.');
        } else {
          showNotification('error', data.error || 'Failed to upload image.');
        }
      } catch (err: any) {
        showNotification('error', err.message);
      } finally {
        setIsUploadingStatusNotifImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStatusNotifVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, MOV, WebM).');
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      alert('Video file size must be less than 30MB for WhatsApp Status.');
      return;
    }

    setIsUploadingStatusNotifVideo(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const videoData = ev.target?.result as string;
      try {
        const res = await apiFetch('/api/auto-sender/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoData, filename: file.name })
        });
        const data = await res.json();
        if (res.ok && data.video_url) {
          setStatusNotifVideoUrl(data.video_url);
          setStatusNotifVideoPath(data.video_path || '');
          setStatusNotifVideoFilename(file.name);
          showNotification('success', 'Video status media uploaded.');
        } else {
          showNotification('error', data.error || 'Failed to upload video.');
        }
      } catch (err: any) {
        showNotification('error', err.message);
      } finally {
        setIsUploadingStatusNotifVideo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOrPublishStatusNotification = async (
    action: 'DRAFT' | 'PUBLISH_STATUS' | 'SCHEDULE' | 'PUBLISH_STATUS_ONLY' | 'PUBLISH_AND_NOTIFY'
  ) => {
    if (!statusNotifName.trim()) {
      setStatusNotifSubmitFeedback({ type: 'error', text: 'Please enter a Status Campaign Name.' });
      return;
    }

    if (statusNotifContentType === 'image' && !statusNotifImageUrl) {
      setStatusNotifSubmitFeedback({ type: 'error', text: 'Please upload an image for Image Status.' });
      return;
    }

    if (statusNotifContentType === 'video' && !statusNotifVideoUrl) {
      setStatusNotifSubmitFeedback({ type: 'error', text: 'Please upload a video for Video Status.' });
      return;
    }

    if (statusNotifContentType === 'text' && !statusNotifText.trim()) {
      setStatusNotifSubmitFeedback({ type: 'error', text: 'Please enter status text content.' });
      return;
    }

    if (action === 'PUBLISH_AND_NOTIFY' && statusNotifSelectedGroups.length === 0) {
      setStatusNotifSubmitFeedback({ type: 'error', text: 'Please select at least one WhatsApp recipient group to notify.' });
      return;
    }

    setIsSubmittingStatusNotif(true);
    setStatusNotifSubmitFeedback(null);

    try {
      const calculatedEndHours = statusNotifDurationHours;
      const validityMap: Record<number, string> = {
        1: '1_day',
        3: '1_day',
        6: '1_day',
        12: '1_day',
        24: '1_day',
        48: '2_days',
        72: '3_days'
      };
      const validityDuration = validityMap[calculatedEndHours] || '1_month';

      const isPublishAction = action === 'PUBLISH_STATUS_ONLY' || action === 'PUBLISH_AND_NOTIFY' || action === 'PUBLISH_STATUS';

      const payload = {
        notification_headline: statusNotifName.trim(),
        tool_name: statusNotifName.trim(),
        head_name: statusNotifName.trim(),
        media_type: statusNotifContentType,
        image_url: statusNotifContentType === 'image' ? statusNotifImageUrl : undefined,
        image_path: statusNotifContentType === 'image' ? statusNotifImagePath : undefined,
        image_filename: statusNotifContentType === 'image' ? statusNotifImageFilename : undefined,
        video_url: statusNotifContentType === 'video' ? statusNotifVideoUrl : undefined,
        video_path: statusNotifContentType === 'video' ? statusNotifVideoPath : undefined,
        video_filename: statusNotifContentType === 'video' ? statusNotifVideoFilename : undefined,
        message: statusNotifContentType === 'text' ? statusNotifText.trim() : (statusNotifCaption.trim() || statusNotifName.trim()),
        cta_link: statusNotifLink.trim() || undefined,
        cta_label: statusNotifLink.trim() ? 'View Link' : undefined,
        target_group_jids: statusNotifSelectedGroups,
        posts_per_day: statusNotifFrequency,
        interval_hours: statusNotifIntervalHours,
        start_time: statusNotifStartTime,
        validity_duration: validityDuration,
        schedule_mode: isPublishAction ? 'IMMEDIATE' : (action === 'DRAFT' ? 'DRAFT' : 'SCHEDULED'),
        is_draft: action === 'DRAFT',
        is_status_notification: true
      };

      const res = await apiFetch('/api/auto-sender/status-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save status campaign');

      const createdTaskId = data.task?.post_id || data.task?.id;

      if (isPublishAction && createdTaskId) {
        // STEP 1: PUBLISH STRICTLY TO REAL MY STATUS ONLY
        setStatusNotifSubmitFeedback({ type: 'success', text: 'Step 1: Publishing directly to connected account My Status (status@broadcast)...' });
        const pubRes = await apiFetch(`/api/auto-sender/status-notifications/${createdTaskId}/publish-status`, { method: 'POST' });
        const pubData = await pubRes.json();
        if (!pubRes.ok || !pubData.success) {
          throw new Error(pubData.error || 'WhatsApp My Status publication failed. Group notifications remain strictly blocked.');
        }

        // STEP 2: ONLY IF PUBLISH_AND_NOTIFY WAS SELECTED, SEND NOTIFICATIONS TO SELECTED GROUPS
        if ((action === 'PUBLISH_AND_NOTIFY' || action === 'PUBLISH_STATUS') && statusNotifSelectedGroups.length > 0) {
          setStatusNotifSubmitFeedback({ type: 'success', text: `Step 2: Status confirmed published (Ref: ${pubData.task?.status_message_id || 'OK'})! Sending alerts to selected groups...` });
          await apiFetch(`/api/auto-sender/status-notifications/${createdTaskId}/send-notifications`, { method: 'POST' });
        }
      }

      showNotification('success', action === 'PUBLISH_STATUS_ONLY'
        ? 'Successfully published to WhatsApp My Status!'
        : (action === 'PUBLISH_AND_NOTIFY' || action === 'PUBLISH_STATUS')
          ? 'WhatsApp My Status published and notifications sent to selected groups!'
          : (action === 'DRAFT' ? 'Status campaign saved as draft.' : 'Status campaign scheduled successfully.'));

      setStatusNotifModalOpen(false);
      await fetchStatusAndData(false);
    } catch (err: any) {
      setStatusNotifSubmitFeedback({ type: 'error', text: err.message || 'Error occurred.' });
    } finally {
      setIsSubmittingStatusNotif(false);
    }
  };

  const handlePublishStatusOnly = async (taskId: string) => {
    try {
      showNotification('info', 'Publishing directly to WhatsApp My Status...');
      const res = await apiFetch(`/api/auto-sender/status-notifications/${taskId}/publish-status`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', 'Published to WhatsApp My Status successfully!');
      } else {
        showNotification('error', data.error || 'Failed to publish to WhatsApp Status.');
      }
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleSendNotificationsOnly = async (taskId: string) => {
    try {
      showNotification('info', 'Dispatching notifications to selected groups...');
      const res = await apiFetch(`/api/auto-sender/status-notifications/${taskId}/send-notifications`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        showNotification('success', 'Group notifications dispatched successfully!');
      } else {
        showNotification('error', data.error || 'Failed to dispatch group notifications.');
      }
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleRetryStatusNotifGroups = async (taskId: string) => {
    try {
      showNotification('info', 'Retrying failed group deliveries...');
      await apiFetch(`/api/auto-sender/status-notifications/${taskId}/retry-groups`, { method: 'POST' });
      showNotification('success', 'Retry sequence initiated.');
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleRefreshMyStatuses = async () => {
    try {
      setIsLoadingMyStatuses(true);
      await apiFetch('/api/auto-sender/my-statuses/refresh', { method: 'POST' }).catch(() => null);
      const res = await apiFetch('/api/auto-sender/my-statuses');
      if (res.ok) {
        const data = await res.json();
        if (data.statuses && Array.isArray(data.statuses)) {
          setLiveMyStatuses(data.statuses);
        }
      }
      showNotification('success', 'Real My Status list refreshed from connected WhatsApp account.');
    } catch (err: any) {
      showNotification('error', 'Failed to refresh My Status list.');
    } finally {
      setIsLoadingMyStatuses(false);
    }
  };

  const handleToggleStatusNotifActive = async (taskId: string, isPaused: boolean) => {
    try {
      const endpoint = isPaused ? 'resume' : 'pause';
      await apiFetch(`/api/auto-sender/status-notifications/${taskId}/${endpoint}`, { method: 'POST' });
      showNotification('success', isPaused ? 'Campaign resumed.' : 'Campaign paused.');
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteStatusNotif = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this status notification campaign?')) return;
    try {
      await apiFetch(`/api/auto-sender/status-notifications/${taskId}`, { method: 'DELETE' });
      showNotification('success', 'Campaign deleted.');
      await fetchStatusAndData(false);
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Save Modal Schedule Change
  const handleSaveScheduleChange = async () => {
    if (!scheduleModalTask) return;
    setIsSavingSchedule(true);
    try {
      let modalStartDate: string | undefined;
      let modalStartTime: string | undefined;
      let modalIso: string | undefined;
      if (newScheduleTime) {
        const dt = new Date(newScheduleTime);
        const pad = (n: number) => n.toString().padStart(2, '0');
        modalStartDate = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
        modalStartTime = `${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        modalIso = dt.toISOString();
      }
      const res = await apiFetch(`/api/auto-sender/tasks/${scheduleModalTask.post_id || scheduleModalTask.id}/change-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_time: modalIso,
          start_date: modalStartDate,
          start_time: modalStartTime,
          posts_per_day: newPostsPerDay,
          interval_hours: newIntervalHours,
          calculated_interval: `${newIntervalHours} hours`,
          validity_duration: newValidityDuration
        })
      });
      if (res.ok) {
        showNotification('success', 'Posting schedule updated.');
        setScheduleModalTask(null);
        await fetchStatusAndData(false);
      }
    } catch (e: any) {
      console.error(e);
      showNotification('error', 'Failed to update schedule: ' + (e?.message || e));
    } finally {
      setIsSavingSchedule(false);
    }
  };

  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groups;
    return groups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()));
  }, [groups, groupSearch]);

  const filteredScamGroups = useMemo(() => {
    if (!scamGroupSearch.trim()) return groups;
    return groups.filter(g => g.name.toLowerCase().includes(scamGroupSearch.toLowerCase()));
  }, [groups, scamGroupSearch]);

  const filteredTrustedGroups = useMemo(() => {
    if (!trustedGroupSearch.trim()) return groups;
    return groups.filter(g => g.name.toLowerCase().includes(trustedGroupSearch.toLowerCase()));
  }, [groups, trustedGroupSearch]);

  const filteredTasks = useMemo(() => {
    if (scheduleFilter === 'ALL') return tasks;
    return tasks.filter(t => t.status === scheduleFilter);
  }, [tasks, scheduleFilter]);

  const selectedTaskDetails = useMemo(() => {
    return tasks.find(t => (t.post_id === selectedTaskIdForStatus || t.id === selectedTaskIdForStatus)) || tasks[0] || null;
  }, [tasks, selectedTaskIdForStatus]);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen font-sans">

      {/* GLOBAL TOAST NOTIFICATION */}
      {notification && (
        <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${notification.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
          notification.type === 'error' ? 'bg-rose-950/90 border-rose-500/50 text-rose-200' :
            'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
          }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> :
            notification.type === 'error' ? <AlertCircle className="w-6 h-6 text-rose-400" /> :
              <Activity className="w-6 h-6 text-cyan-400" />}
          <span className="text-sm font-semibold">{notification.text}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. MAIN ACCOUNT PROFILE CARD (TOP OF PAGE) */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/90 border border-slate-800/80 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              {status?.pictureUrl ? (
                <img
                  src={status.pictureUrl}
                  alt={status.name || 'WhatsApp Profile'}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-emerald-500/40 shadow-xl bg-slate-800"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-3xl shadow-xl">
                  👤
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-slate-900 flex items-center justify-center ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {status?.name || (isConnected ? 'Connected WhatsApp User' : 'WhatsApp Auto Sender')}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {isConnected ? 'LIVE SESSION' : 'OFFLINE'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  24/7 VPS ENGINE
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  {status?.phone ? `+${status.phone}` : 'No phone connected'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Connected: {status?.connectedAt ? new Date(status.connectedAt).toLocaleDateString() + ' ' + new Date(status.connectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Activity className="w-4 h-4" />
                  Session: 100% Healthy
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end flex-wrap">
            {/* Live Date & Time Button */}
            <div className="px-4 py-2.5 sm:py-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm font-mono font-bold text-slate-200 shadow-md flex items-center gap-2" title="Live PC Date, Time & AM/PM">
              <Clock className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
              <span className="text-white">{liveDateStr}</span>
            </div>

            <button
              onClick={() => handleSyncGroups()}
              disabled={refreshing || !isConnected}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Groups
            </button>
            {isConnected ? (
              <button
                onClick={handleUnlink}
                disabled={isUnlinking}
                className="px-5 py-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                Unlink Account
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('connection')}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xl active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                Connect WhatsApp
              </button>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. ENLARGED 5 MAIN DASHBOARD STATISTIC CARDS (HORIZONTAL ROW) */}
        {/* ======================================================== */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-6 border-t border-slate-800/80">

          {/* 1. Total Eligible Groups */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Eligible Groups</span>
              <div className="text-2xl lg:text-3xl font-black text-white">{accountStats.totalEligibleGroups}</div>
              <p className="text-[11px] text-emerald-400 font-medium">Real verified WhatsApp groups</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all shadow-inner">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* 2. Total Posts Sent */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-cyan-500/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Posts Sent</span>
              <div className="text-2xl lg:text-3xl font-black text-white">{accountStats.totalPostsSent}</div>
              <p className="text-[11px] text-cyan-400 font-medium">Delivered to recipient groups</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-all shadow-inner">
              <Send className="w-6 h-6" />
            </div>
          </div>

          {/* 3. Total Failed Sends */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-rose-500/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Failed Sends</span>
              <div className="text-2xl lg:text-3xl font-black text-white">{accountStats.totalFailedSends}</div>
              <p className="text-[11px] text-rose-400 font-medium">Ready for auto-retry</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-all shadow-inner">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* 4. Total Pending Sends */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-amber-500/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pending Sends</span>
              <div className="text-2xl lg:text-3xl font-black text-white">{accountStats.totalPendingSends}</div>
              <p className="text-[11px] text-amber-400 font-medium">Queued in background buffer</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-all shadow-inner">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* 5. Total Scheduled Posts */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 hover:border-purple-500/40 transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Scheduled Posts</span>
              <div className="text-2xl lg:text-3xl font-black text-white">{accountStats.activeSchedules}</div>
              <p className="text-[11px] text-purple-400 font-medium">Survives browser restarts</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-all shadow-inner">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. HORIZONTAL TOP NAVIGATION MENU (LEFT TO RIGHT) */}
      {/* ======================================================== */}
      {/* 2. FULL TOP NAVIGATION BAR (ALL 9 MODULES) */}
      {/* ======================================================== */}
      <nav className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-xl flex items-center gap-1.5 overflow-x-auto scrollbar-none backdrop-blur-md">

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'dashboard' ? 'bg-[#25D366] text-slate-950 shadow-lg shadow-[#25D366]/20' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Send className="w-4 h-4 text-emerald-400 fill-current" />
          <span>WhatsApp Sender Auto Post</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/20 text-slate-900">
            {tasks.length}
          </span>
        </button>

        <button
          onClick={handleOpenNewPostForm}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'new-post' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Plus className="w-4 h-4" />
          New Auto Post
        </button>

        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'schedules' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Calendar className="w-4 h-4" />
          Auto Post Schedules ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('connection')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'connection' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <QrCode className="w-4 h-4" />
          WhatsApp Connection
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'groups' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Users className="w-4 h-4" />
          Real Groups ({groups.length})
        </button>



        {/* TRUSTED POST DEDICATED BUTTON */}
        <button
          onClick={() => setActiveTab('trusted-posts')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all border ${activeTab === 'trusted-posts'
            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40'
            : 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/50 hover:text-white'
            }`}
        >
          <Award className="w-4 h-4 text-indigo-300" />
          Trusted Post
        </button>

        {/* STATUS NOTIFICATION DEDICATED BUTTON — PLACED STRICTLY BETWEEN TRUSTED AND SCAMMER POST */}
        <button
          onClick={() => setActiveTab('status-notifications')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all border ${activeTab === 'status-notifications'
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400/40'
            : 'bg-gradient-to-r from-emerald-950/50 via-slate-900 to-teal-950/50 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50 hover:text-white hover:border-emerald-400'
            }`}
        >
          <BellRing className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>STATUS NOTIFICATION</span>
          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/30 text-emerald-300">
            {statusNotifications.length}
          </span>
        </button>

        {/* SCAM REPORT POST DEDICATED BUTTON */}
        <button
          onClick={() => setActiveTab('scam-reports')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 whitespace-nowrap transition-all border ${activeTab === 'scam-reports'
            ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/40 animate-pulse'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-300 hover:bg-rose-900/50 hover:text-white'
            }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-300" />
          Scam Report Post
        </button>



        <button
          onClick={() => setActiveTab('status-report')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'status-report' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Activity className="w-4 h-4" />
          Complete Status
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <History className="w-4 h-4" />
          Posting History
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === 'settings' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
        >
          <Settings className="w-4 h-4" />
          Settings & Health
        </button>
      </nav>

      {/* ======================================================== */}
      {/* MODULE TOOLBAR — DIRECTLY BELOW THE MAIN DASHBOARD */}
      {/* ======================================================== */}
      <div className="bg-slate-900/95 border border-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-wrap">
          {/* 1. Refresh Groups Button */}
          <button
            onClick={() => handleSyncGroups()}
            disabled={refreshing || !isConnected}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Fetch the latest actual groups from authorized WhatsApp session"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Groups</span>
          </button>

          {/* Live Date & Time Button */}
          <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-slate-200 flex items-center gap-2 shadow-sm" title="Live PC Date, Time & AM/PM">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
            <span className="text-white font-mono">{liveDateStr}</span>
          </div>

          {/* 2. Select Module Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Module:</span>
            <select
              value={
                activeTab === 'dashboard' ? 'auto-post-dashboard' :
                  activeTab === 'new-post' ? 'new-post' :
                    activeTab === 'schedules' ? 'schedules' :
                      activeTab === 'scam-reports' ? 'scam-reports' :
                        activeTab === 'trusted-posts' ? 'trusted-posts' :
                          activeTab === 'groups' ? 'groups' :
                            activeTab === 'connection' ? 'connection' :
                              'auto-post-dashboard'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'auto-post-dashboard') setActiveTab('dashboard');
                else if (val === 'new-post') handleOpenNewPostForm();
                else if (val === 'schedules') setActiveTab('schedules');
                else if (val === 'scam-reports') setActiveTab('scam-reports');
                else if (val === 'trusted-posts') setActiveTab('trusted-posts');
                else if (val === 'status-notifications') setActiveTab('status-notifications');
                else if (val === 'groups') setActiveTab('groups');
                else if (val === 'connection') setActiveTab('connection');
              }}
              className="bg-slate-900 text-white font-black px-3 py-1 rounded-lg border border-slate-700 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="auto-post-dashboard">📢 WhatsApp Sender Auto Post (Saved Posts)</option>
              <option value="new-post">➕ Create New Auto Post</option>
              <option value="schedules">📅 Auto Post Schedules</option>
              <option value="scam-reports">🚨 Scam Report Post</option>
              <option value="trusted-posts">🏆 Trusted Post</option>
              <option value="status-notifications">🔔 Status Notification (My Status & Groups)</option>
              <option value="groups">👥 Real Groups Moderation</option>
              <option value="connection">📲 WhatsApp Connection & QR</option>
            </select>
          </div>

          {/* 3. Selected Module Name Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {activeTab === 'dashboard' ? 'WhatsApp Sender Auto Post Active' :
                activeTab === 'new-post' ? 'Create New Auto Post Active' :
                  activeTab === 'schedules' ? 'Auto Post Schedules Active' :
                    activeTab === 'scam-reports' ? 'Scam Report Post Active' :
                      activeTab === 'trusted-posts' ? 'Trusted Post Active' :
                        activeTab === 'status-notifications' ? 'Status Notification Active' :
                          activeTab === 'groups' ? 'Real Groups Active' :
                            activeTab === 'connection' ? 'WhatsApp Connection Active' :
                              'Active Module'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 4. Select Groups & Counter */}
          <button
            onClick={() => setActiveTab('groups')}
            className="px-3.5 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            title="Open group selection and management panel"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Groups</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/30 text-indigo-200">
              {groups.length} Selected / Available
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. SEPARATE MODULE DASHBOARD DISPLAY AREA */}
      {/* ======================================================== */}

      {/* --- TAB: DASHBOARD — UNIFIED HORIZONTAL AUTO POSTS TABLE --- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Section Heading & Global Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                <LayoutDashboard className="w-5 h-5 text-emerald-400" />
                Saved Auto Posts — Live Status & Delivery Records
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {tasks.length} Saved
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Unified horizontal table displaying real-time delivery counts, color-coded status, and action buttons for every saved post.
              </p>
            </div>

            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={() => fetchStatusAndData(false)}
                disabled={refreshing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                title="Refresh live status from cloud server"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Status
              </button>
              <button
                onClick={() => setIsDeleteAllModalOpen(true)}
                disabled={tasks.length === 0}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All Sent Posts
              </button>
              <button
                onClick={handleOpenNewPostForm}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Auto Post
              </button>
            </div>
          </div>

          {/* HORIZONTAL HEADLINE ROW & SAVED POSTS TABLE — LEFT TO RIGHT */}
          {tasks.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto text-2xl">
                📝
              </div>
              <h3 className="text-lg font-bold text-white">No Auto Posts Scheduled Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Create your first automated marketing schedule with image, formatted caption, and automatic time calculator.
              </p>
              <button
                onClick={handleOpenNewPostForm}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Post
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              {/* SINGLE UNIFIED HORIZONTAL TABLE WITH ONE SHARED HEADER ROW */}
              <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-inner">
                <table className="w-full min-w-[2000px] text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Post Order 🆔</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[160px]">Tools Name</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[110px]">Post Images</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[125px]">Post Per Day</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[135px]">Group Select</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Post Time Sent</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Live View Post</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[155px]">Next Post Sent Time</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[135px]">Expire Date</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[170px]">Status</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[160px]">Per Day History</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[420px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tasks.map((task) => {
                      const taskId = task.post_id || task.id;
                      const nextExec = getTaskNextExecutionTime(task, currentTime);
                      const totalGroups = task.total_groups || (task.selected_group_ids?.length || task.target_group_jids?.length || 0);
                      const sentCount = task.sent_count || 0;
                      const failedCount = task.failed_count || 0;
                      const pendingCount = task.pending_count !== undefined ? task.pending_count : Math.max(0, totalGroups - sentCount - failedCount);
                      const nextScheduledStr = nextExec.nextFormatted;

                      // Calculate expiry date & validity status
                      const createdDate = task.created_at ? new Date(task.created_at) : new Date();
                      const expiryDate = task.expires_at ? new Date(task.expires_at) : (() => {
                        const d = new Date(createdDate);
                        const months = getDurationMonths(task.validity_duration || '1_month');
                        d.setMonth(d.getMonth() + months);
                        return d;
                      })();
                      const isExpired = expiryDate.getTime() < currentTime;
                      const expiryDateStr = `${expiryDate.getMonth() + 1}/${expiryDate.getDate()}/${expiryDate.getFullYear()}`;

                      const orderIdDisplay = task.order_id || `#ORD-${taskId.replace(/^(auto_task_|task_)/, '').slice(0, 7).toUpperCase()}`;
                      const postHeadName = task.tool_name || task.head_name || task.image_alt_text || 'Auto Marketing Post';
                      const postsPerDayDisplay = task.posts_per_day || (task as any).schedule_times?.length || task.generated_times?.length || 1;

                      return (
                        <tr key={taskId} className="text-xs hover:bg-slate-900/60 transition-colors">
                          {/* 1. Post Order 🆔 */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs inline-block" title={orderIdDisplay}>
                              {orderIdDisplay}
                            </span>
                          </td>

                          {/* 2. Tools Name */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="font-bold text-white block max-w-[150px] mx-auto truncate" title={postHeadName}>
                              {postHeadName}
                            </span>
                          </td>

                          {/* 3. Post Images */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="flex items-center justify-center">
                              {task.image_url ? (
                                <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-slate-950 shadow-md">
                                  <img
                                    src={task.image_url}
                                    alt={postHeadName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-11 h-11 rounded-full border-2 border-slate-700 bg-slate-950 flex items-center justify-center text-slate-500 shadow-md">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 4. Post Per Day */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="font-semibold text-slate-200 inline-flex items-center justify-center gap-1.5 text-xs">
                              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{postsPerDayDisplay} / Day</span>
                            </div>
                          </td>

                          {/* 5. Group Select */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="font-bold text-indigo-300 inline-flex items-center justify-center gap-1.5 text-xs">
                              <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span>{totalGroups} Groups</span>
                            </div>
                          </td>

                          {/* 6. Post Time Sent */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="font-mono font-medium text-slate-200 inline-flex items-center justify-center gap-1.5 text-xs">
                              <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{formatTime12h(task.start_time || '09:00')}</span>
                            </div>
                          </td>

                          {/* 7. Live View Post */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <button
                              onClick={() => setPreviewModalTask(task)}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/50 border border-cyan-400/40 whitespace-nowrap"
                              title="Live View Post — WhatsApp Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-white" />
                              <span>Live View Post</span>
                            </button>
                          </td>

                          {/* 8. Next Post Sent Time */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="font-mono font-medium text-cyan-300 inline-flex items-center justify-center gap-1.5 text-xs" title={nextExec.isWithin10Min ? `Upcoming in ${nextExec.minutesRemaining}m` : undefined}>
                              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{nextScheduledStr}</span>
                            </div>
                          </td>

                          {/* 9. Expire Date (Green when valid, Red when expired) */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className={`text-[11px] font-mono px-3 py-1.5 rounded-xl border font-bold inline-block text-center whitespace-nowrap ${isExpired
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              }`}>
                              {expiryDateStr}
                            </span>
                          </td>

                          {/* 10. Status — Green ✓ SEND, Yellow ◷ PENDING, Red ✕ FAILED, Yellow ⏸️ PAUSED */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="inline-flex items-center justify-center">
                              {task.status === 'PAUSED' ? (
                                /* 3D Orange/Amber PAUSED Badge */
                                <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 text-white inline-flex items-center gap-1.5 shadow-[0_3px_10px_rgba(249,115,22,0.45)] border border-amber-300/60 ring-1 ring-black/20">
                                  <Pause className="w-3.5 h-3.5 text-white fill-white shrink-0" />
                                  <span className="tracking-wide">PAUSED</span>
                                </div>
                              ) : (task.status === 'SENDING' || task.status === 'EXECUTING') ? (
                                /* 3D Electric Cyan/Blue Live Pulsing SENDING Badge */
                                <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white inline-flex items-center gap-1.5 shadow-[0_3px_12px_rgba(6,182,212,0.55)] border border-cyan-300/70 ring-1 ring-black/20 animate-pulse">
                                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin shrink-0" />
                                  <span className="tracking-wide">SENDING...</span>
                                </div>
                              ) : (task.status === 'PENDING' || task.status === 'SCHEDULED' || (task.scheduled_target_timestamp && currentTime < task.scheduled_target_timestamp) || (sentCount === 0 && failedCount === 0)) ? (
                                /* 3D Golden Amber PENDING Badge with Live 3D Depth */
                                <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 inline-flex items-center gap-1.5 shadow-[0_3px_10px_rgba(245,158,11,0.5)] border border-yellow-200 ring-1 ring-black/20">
                                  <Clock className="w-3.5 h-3.5 text-slate-950 stroke-[2.5] shrink-0" />
                                  <span className="tracking-wide font-extrabold">PENDING</span>
                                </div>
                              ) : (totalGroups > 0 && sentCount >= totalGroups && failedCount === 0 && sentCount > 0) ? (
                                /* 3D Emerald Green SEND Badge */
                                <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white inline-flex items-center gap-1.5 shadow-[0_3px_10px_rgba(16,185,129,0.5)] border border-emerald-300/80 ring-1 ring-black/20">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0" />
                                  <span className="tracking-wide font-extrabold">SEND</span>
                                </div>
                              ) : (failedCount > 0 && sentCount === 0) ? (
                                /* 3D Crimson Red FAILED Badge */
                                <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white inline-flex items-center gap-1.5 shadow-[0_3px_10px_rgba(239,68,68,0.5)] border border-rose-300/80 ring-1 ring-black/20">
                                  <XCircle className="w-3.5 h-3.5 text-white stroke-[2.5] shrink-0" />
                                  <span className="tracking-wide font-extrabold">FAILED</span>
                                </div>
                              ) : (sentCount > 0 && failedCount > 0) ? (
                                /* Partial Multi 3D Status */
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-emerald-500 to-green-600 text-white inline-flex items-center gap-1 shadow-[0_2px_8px_rgba(16,185,129,0.4)] border border-emerald-300/70">
                                    <CheckCircle2 className="w-3 h-3 text-white stroke-[2.5]" />
                                    <span>{sentCount} SEND</span>
                                  </span>
                                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gradient-to-r from-rose-600 to-red-600 text-white inline-flex items-center gap-1 shadow-[0_2px_8px_rgba(239,68,68,0.4)] border border-rose-300/70">
                                    <XCircle className="w-3 h-3 text-white stroke-[2.5]" />
                                    <span>{failedCount} FAILED</span>
                                  </span>
                                </div>
                              ) : (
                                /* 3D Golden Amber PENDING Badge with Live 3D Depth */
                                <div className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 inline-flex items-center gap-1.5 shadow-[0_3px_10px_rgba(245,158,11,0.5)] border border-yellow-200 ring-1 ring-black/20">
                                  <Clock className="w-3.5 h-3.5 text-slate-950 stroke-[2.5] shrink-0" />
                                  <span className="tracking-wide font-extrabold">PENDING</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 11. Per Day History */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedPostForHistory(task);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-950/50 border border-indigo-400/40 whitespace-nowrap cursor-pointer"
                              title="View Per Day Posting History and live group delivery records"
                            >
                              <History className="w-3.5 h-3.5 text-white shrink-0" />
                              <span>Per Day History</span>
                            </button>
                          </td>

                          {/* 12. Actions (All Action Buttons in One Horizontal Row Directly Underneath) */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="inline-flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap">
                              {/* 1. Edit Post */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/50 border border-amber-300/70 cursor-pointer"
                                title="Open the selected post’s saved details for editing without losing its existing data"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                                <span>Edit Post</span>
                              </button>

                              {/* 2. Delete Record */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeleteRecordModalTask(task);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-rose-300 hover:text-rose-200 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md border border-rose-500/40 hover:border-rose-400/60 cursor-pointer"
                                title="Delete only the selected post’s saved record after confirmation"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400 stroke-[2.2]" />
                                <span>Delete Record</span>
                              </button>

                              {/* 3. Delete All Sent Posts from Groups */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDeleteSentPostModalTask(task);
                                }}
                                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/60 border border-rose-400/50 cursor-pointer"
                                title="Attempt to delete the selected post’s actual sent messages from all groups where it was sent"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-white stroke-[2.2]" />
                                <span>Delete All Sent Posts from Groups</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: REAL GROUPS WITH GROUP PROFILE, EXPORT & DELETE --- */}
      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                <Users className="w-6 h-6 text-emerald-400" />
                Real WhatsApp Groups ({groups.length})
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                100% real groups retrieved from your connected WhatsApp account. Strictly deduplicated by WhatsApp group JID.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  placeholder="Search groups..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={() => handleSyncGroups()}
                disabled={refreshing || !isConnected}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 whitespace-nowrap"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Sync Groups
              </button>
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto text-2xl">
                👥
              </div>
              <h3 className="text-lg font-bold text-white">No Groups Found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {isConnected ? 'No matching WhatsApp groups found. Click "Sync Groups" to refresh.' : 'Connect your WhatsApp account to view and post to your real groups.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGroups.map((grp) => (
                <div
                  key={grp.jid}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    {grp.icon_url ? (
                      <img src={grp.icon_url} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shadow bg-slate-950 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
                        👥
                      </div>
                    )}

                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{grp.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          {grp.member_count || grp.members?.length || 'Live'} members
                        </span>
                        <span>•</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${grp.can_send !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                          {grp.can_send !== false ? 'Posting Allowed' : 'Admin Only'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate">{grp.jid}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => handleViewMembers(grp)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      View Members
                    </button>

                    <button
                      onClick={() => handleExportMemberNumbers(grp)}
                      disabled={exportingGroupId === grp.jid}
                      className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      {exportingGroupId === grp.jid ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      ) : (
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      Export (.xlsx)
                    </button>

                    <button
                      onClick={() => {
                        setGroupToDelete(grp);
                        setDeleteGroupAction('REMOVE_FROM_DASHBOARD');
                      }}
                      className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      Delete Group
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB: NEW AUTO POST (RESTORED WITH SIDE-BY-SIDE LIVE PREVIEW) --- */}
      {activeTab === 'new-post' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                <Plus className="w-6 h-6 text-emerald-400" />
                {editingPostId ? 'Edit Auto Post Schedule' : 'Create New Auto Post Schedule'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure automated cloud broadcasts with custom daily frequencies, interval spacing, and strict group targeting.
              </p>
            </div>

            {/* Mobile Toggle for Live Preview */}
            <div className="flex items-center gap-2 lg:hidden w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setShowLivePreviewMobile(!showLivePreviewMobile)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showLivePreviewMobile ? 'Hide Live Preview' : 'Show Live Preview'}
              </button>
            </div>
          </div>

          {submitFeedback && (
            <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2.5 ${submitFeedback.type === 'success' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
              }`}>
              {submitFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
              {submitFeedback.text}
            </div>
          )}

          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left Column: Form Controls (7 cols on lg) */}
            <form onSubmit={handleSubmitPost} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">

              {/* 1. Tool Name / Head Name (Highlighted Headline) */}
              <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="toolNameInput" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Tool Name / Head Name *
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">Highlighted Headline in WhatsApp</span>
                </div>
                <input
                  id="toolNameInput"
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="e.g. ⚡ Mujahid Digital Zone VIP Special Offer"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-inner"
                />
              </div>

              {/* 2. Image Upload (Clean — No Separate Image Name Box) */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Post Image / Visual Creative (Optional)
                  </label>
                  {uploadedImageMeta && (
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">Image Attached</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    {uploadingImage ? 'Uploading image...' : uploadedImageMeta ? 'Replace Image' : 'Upload Post Image'}
                  </button>

                  {uploadedImageMeta && (
                    <div className="flex items-center gap-2.5 bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs flex-1 min-w-0">
                      <img src={uploadedImageMeta.image_url} alt={toolName || 'Post Visual Preview'} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-white block truncate text-[11px]">{uploadedImageMeta.filename}</span>
                        <span className="text-[10px] text-slate-400">{uploadedImageMeta.size} • {uploadedImageMeta.dimensions}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedImageMeta(null);
                        }}
                        className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Message Caption & WhatsApp Formatting Toolbar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Post Caption / Description *
                  </label>
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setMessageText(prev => prev + '*bold text*')}
                      title="Bold (*text*)"
                      className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold px-2"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageText(prev => prev + '_italic text_')}
                      title="Italic (_text_)"
                      className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold px-2"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageText(prev => prev + '~strikethrough~')}
                      title="Strikethrough (~text~)"
                      className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold px-2"
                    >
                      <Strikethrough className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageText(prev => prev + '```code```')}
                      title="Monospace (```code```)"
                      className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold px-2"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                  placeholder="Enter your promotional post message here... (Formatting supported: *bold*, _italic_, ~strike~, ```monospace```)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* 3. SIMULTANEOUS SCHEDULING CONTROLS: Posts Per Day & Interval in Hours */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Automated Schedule & Timing Settings
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">
                    {postsPerDay} run{postsPerDay > 1 ? 's' : ''} / day (Every {postingIntervalHours}h)
                  </span>
                </div>

                {/* Side-by-side: Posts Per Day AND Interval in Hours */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Posts Per Day */}
                  <div className="space-y-2 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Posts Per Day (Daily Count)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={postsPerDay}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= 24) setPostsPerDay(val);
                          else if (e.target.value === '') setPostsPerDay(1);
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {[1, 2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setPostsPerDay(num)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${postsPerDay === num
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                          >
                            {num}x
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Number of times post sends every 24 hours.</span>
                  </div>

                  {/* Interval in Hours */}
                  <div className="space-y-2 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Posting Interval (Hours)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={postingIntervalHours}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= 24) setPostingIntervalHours(val);
                          else if (e.target.value === '') setPostingIntervalHours(1);
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {[1, 2, 3, 4, 6, 8].map((hrs) => (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => setPostingIntervalHours(hrs)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${postingIntervalHours === hrs
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                              }`}
                          >
                            {hrs}h
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Spacing in hours between consecutive posts.</span>
                  </div>
                </div>

                {/* Start Date & Start Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Schedule Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      First Post Start Time
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                {/* Automatically Calculated Daily Run Times */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300 uppercase block">
                      Automatically Calculated Daily Schedule Slots ({calculatedScheduleSlots.length} Runs):
                    </span>
                    {postsPerDay * postingIntervalHours > 24 && (
                      <span className="text-[10px] text-amber-400 font-bold">
                        ⚠️ Schedule wraps over 24h
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {calculatedScheduleSlots.map((slot) => (
                      <div
                        key={slot.index}
                        className="bg-slate-900 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="font-bold text-white">{slot.time12}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({slot.label})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Active Duration */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Active Schedule Duration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { key: '1_month', label: '1 Month' },
                    { key: '2_months', label: '2 Months' },
                    { key: '3_months', label: '3 Months' },
                    { key: '4_months', label: '4 Months' },
                    { key: '5_months', label: '5 Months' }
                  ].map((dur) => (
                    <button
                      key={dur.key}
                      type="button"
                      onClick={() => setValidityDuration(dur.key)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center border transition-all ${validityDuration === dur.key
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Active until: <span className="text-emerald-400 font-bold">{calculateDurationExpiryDate(getDurationMonths(validityDuration))}</span>
                </p>
              </div>

              {/* 5. GROUP SENDING INTERVAL SETTING */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <label className="text-xs font-bold text-white uppercase tracking-wider block">
                      Group Sending Interval
                    </label>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono font-bold">
                    Sequential delay: {activeGroupIntervalSeconds}s between each group
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Controls the automatic waiting duration applied by the backend worker between consecutive WhatsApp groups during dispatch.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {[
                    { mode: '4', label: '4 Seconds' },
                    { mode: '5', label: '5 Seconds' },
                    { mode: '10', label: '10 Seconds' },
                    { mode: '20', label: '20 Seconds' },
                    { mode: 'custom', label: 'Custom Interval' }
                  ].map((btn) => (
                    <button
                      key={btn.mode}
                      type="button"
                      onClick={() => setGroupIntervalMode(btn.mode as any)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${groupIntervalMode === btn.mode
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850'
                        }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {groupIntervalMode === 'custom' && (
                  <div className="flex items-center gap-3 pt-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-300 font-medium">Custom Delay (Seconds):</span>
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={groupIntervalCustomSeconds}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val) && val >= 1) setGroupIntervalCustomSeconds(val);
                        else if (e.target.value === '') setGroupIntervalCustomSeconds(1);
                      }}
                      className="w-24 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-emerald-500"
                      placeholder="Seconds"
                    />
                    <span className="text-[11px] text-slate-400">seconds (e.g. 4s, 15s, 45s)</span>
                  </div>
                )}
              </div>

              {/* 6. STRICT GROUP SELECTION LOCK */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Target WhatsApp Groups (Strict Lock Active)
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Only explicitly checked groups receive this post. Individual contacts and private chats are excluded.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSyncGroups}
                      disabled={isRefreshingGroups || refreshing}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                      title="Reload real groups from WhatsApp"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshingGroups || refreshing ? 'animate-spin' : ''}`} />
                      {isRefreshingGroups || refreshing ? 'Refreshing...' : 'Refresh Groups'}
                    </button>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      {selectedGroups.length} of {eligibleGroups.length} Selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedGroups.length === eligibleGroups.length) setSelectedGroups([]);
                        else setSelectedGroups(eligibleGroups.map(g => g.jid));
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700"
                    >
                      {selectedGroups.length === eligibleGroups.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Group Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    placeholder="Search eligible WhatsApp groups by name or ID..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  {groupSearch && (
                    <button
                      type="button"
                      onClick={() => setGroupSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {!isConnected && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>WhatsApp is disconnected. Please connect WhatsApp in the WhatsApp Connection tab to fetch live groups and send posts.</span>
                  </div>
                )}

                {/* Group Selector Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredEligibleGroups.length === 0 ? (
                    <div className="text-center py-6 space-y-2">
                      <p className="text-xs text-slate-400">
                        {groupSearch ? 'No groups match your search query.' : !isConnected ? 'Connect WhatsApp to load eligible groups.' : 'No eligible WhatsApp groups available where your account can post.'}
                      </p>
                      {isConnected && (
                        <button
                          type="button"
                          onClick={handleSyncGroups}
                          className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/30 inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Fetch Groups from WhatsApp
                        </button>
                      )}
                    </div>
                  ) : (
                    filteredEligibleGroups.map((grp) => {
                      const isChecked = selectedGroups.includes(grp.jid);
                      return (
                        <label
                          key={grp.jid}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${isChecked
                            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                            }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedGroups(prev =>
                                  prev.includes(grp.jid) ? prev.filter(id => id !== grp.jid) : [...prev, grp.jid]
                                );
                              }}
                              className="w-4 h-4 rounded text-emerald-500 border-slate-700 bg-slate-950 focus:ring-0"
                            />
                            {grp.icon_url ? (
                              <img src={grp.icon_url} alt="" className="w-6 h-6 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs shrink-0">👥</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold truncate block">{grp.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono truncate block">{grp.jid}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono ml-2 shrink-0">
                            {grp.member_count || grp.members?.length || ''} members
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Mention all tag checkbox */}
              <div className="flex items-center gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <input
                  type="checkbox"
                  id="mentionAll"
                  checked={mentionAllInPost}
                  onChange={(e) => setMentionAllInPost(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 border-slate-700 bg-slate-900 focus:ring-0"
                />
                <label htmlFor="mentionAll" className="font-bold text-slate-300 cursor-pointer">
                  Tag All Group Members (@everyone ghost mention)
                </label>
              </div>

              {/* Submit & Schedule Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPostId(null);
                    setActiveTab('schedules');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || selectedGroups.length === 0}
                  className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving to 24/7 Cloud...' : editingPostId ? 'Update Post Schedule' : 'Save & Activate Schedule'}
                </button>
              </div>
            </form>

            {/* Right Column: Interactive Real-Time Live Preview Panel (5 cols on lg, sticky) */}
            <div className={`lg:col-span-5 space-y-4 ${showLivePreviewMobile ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Live Broadcast Preview
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Sync
                  </span>
                </div>

                {/* WhatsApp Chat Bubble Simulation */}
                <div className="bg-[#0b141a] p-3.5 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
                  {/* Image Preview */}
                  {uploadedImageMeta ? (
                    <div className="rounded-xl overflow-hidden border border-slate-800 relative bg-black/40">
                      <img
                        src={uploadedImageMeta.image_url}
                        alt={toolName || 'Post Visual Preview'}
                        className="w-full max-h-56 object-contain mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                      [No image attached — text-only post]
                    </div>
                  )}

                  {/* Formatted Caption Preview with Tool Name / Head Name Highlight */}
                  <div className="bg-[#005c4b]/30 border border-[#005c4b]/50 text-slate-100 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed space-y-2">
                    {toolName && (
                      <div className="font-bold text-emerald-300 border-b border-[#005c4b]/60 pb-1 text-xs">
                        *{toolName}*
                      </div>
                    )}
                    <div>
                      {messageText ? messageText : <span className="text-slate-500 italic">[Enter message caption to preview formatting here...]</span>}
                    </div>
                  </div>

                  {/* Mention tag notice if active */}
                  {mentionAllInPost && (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-mono">
                      🔔 @everyone ghost mention active for all recipient group members
                    </div>
                  )}
                </div>

                {/* Schedule Summary Information */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Schedule Specifications:
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Frequency:</span>
                      <span className="font-bold text-white font-mono">{postsPerDay} posts / day</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Interval:</span>
                      <span className="font-bold text-white font-mono">Every {postingIntervalHours} hours</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block">Daily Calculated Posting Times:</span>
                    <div className="flex flex-wrap gap-1">
                      {calculatedScheduleSlots.map(s => (
                        <span key={s.index} className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[10px] font-bold">
                          {s.time12}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target Groups:</span>
                    <span className={`font-bold font-mono ${selectedGroups.length > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {selectedGroups.length > 0 ? `${selectedGroups.length} groups selected` : '⚠️ 0 groups (Blocked)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-slate-200 font-mono">
                      {validityDuration.replace('_', ' ')} (until {calculateDurationExpiryDate(getDurationMonths(validityDuration))})
                    </span>
                  </div>
                </div>

                {/* Validation Status Indicator */}
                <div className={`p-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${selectedGroups.length > 0 && (messageText.trim() || uploadedImageMeta)
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  }`}>
                  {selectedGroups.length > 0 && (messageText.trim() || uploadedImageMeta) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Ready to schedule & activate 24/7 cloud broadcast</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {selectedGroups.length === 0
                          ? 'Select at least 1 WhatsApp group to activate'
                          : 'Enter message text or attach an image'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- TAB: SCAM REPORT POST (DEDICATED DASHBOARD) --- */}
      {activeTab === 'scam-reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-rose-400 flex items-center gap-2.5">
                <ShieldAlert className="w-7 h-7 text-rose-500" />
                Scam Report & Fraud Warning Module
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Independent fraud alerting system with screenshot proof, voice notes, and recipient message revocation.
              </p>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setScamSubTab('create')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${scamSubTab === 'create' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
              >
                🚨 Create Scam Report
              </button>
              <button
                onClick={() => setScamSubTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${scamSubTab === 'history' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
              >
                📜 Scam Reports History ({scamReports.length})
              </button>
            </div>
          </div>

          {/* Dedicated Scam Report 5 Statistic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Eligible Groups
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{scamStats.eligibleGroups}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Scam Posts Sent
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{scamStats.totalSent}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Failed Sends
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">{scamStats.totalFailed}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Pending Sends
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{scamStats.totalPending}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5 col-span-2 lg:col-span-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Scheduled Alerts
                </span>
                <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono">{scamStats.totalScheduled}</span>
              </div>
            </div>
          </div>

          {scamSubmitFeedback && (
            <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2.5 ${scamSubmitFeedback.type === 'success' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
              }`}>
              {scamSubmitFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
              {scamSubmitFeedback.text}
            </div>
          )}

          {scamSubTab === 'create' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
              <div className="space-y-4">
                {/* 1. Report Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Report Title / Scam Type *
                  </label>
                  <input
                    type="text"
                    value={scamTitle}
                    onChange={(e) => setScamTitle(e.target.value)}
                    placeholder="e.g. Payment Fraud / Fake Order / Impersonation Alert"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* 2. Reported Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Reported Fraudulent Phone Number *
                  </label>
                  <input
                    type="text"
                    value={scamReportedNumber}
                    onChange={(e) => setScamReportedNumber(e.target.value)}
                    placeholder="e.g. +923001234567 or 03001234567"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* 3. Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Incident Description & Context
                  </label>
                  <textarea
                    value={scamDescription}
                    onChange={(e) => setScamDescription(e.target.value)}
                    rows={4}
                    placeholder="Explain what happened, transaction reference IDs, dates, and why other group members must be warned..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                {/* 4. Proof Uploads (Screenshot Image & Voice Note) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Image Proof */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase block">Screenshot Evidence</span>
                    <input
                      type="file"
                      ref={scamImageInputRef}
                      onChange={handleScamImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => scamImageInputRef.current?.click()}
                      disabled={isUploadingScamImage}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4 text-rose-400" />
                      {isUploadingScamImage ? 'Uploading...' : 'Attach Screenshot Proof'}
                    </button>
                    {scamProofImages.map((img, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs">
                        <img src={img} alt="" className="w-8 h-8 rounded object-cover" />
                        <span className="truncate flex-1 font-mono text-[11px] text-slate-300">Proof #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setScamProofImages(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-500 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Audio / Voice Proof */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase block">Voice / Audio Recording Proof</span>
                    <input
                      type="file"
                      ref={scamAudioInputRef}
                      onChange={handleScamAudioUpload}
                      accept="audio/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => scamAudioInputRef.current?.click()}
                      disabled={isUploadingScamAudio}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <Mic className="w-4 h-4 text-rose-400" />
                      {isUploadingScamAudio ? 'Uploading...' : 'Upload Voice Proof (.mp3 / .ogg / .wav)'}
                    </button>
                    {scamProofAudios.map((audio, idx) => (
                      <div key={idx} className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-300">Audio Note #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setScamProofAudios(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <audio src={audio} controls className="w-full h-8" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Group Selection with Strict Lock */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Target WhatsApp Alert Groups
                      </label>
                      <span className="text-[11px] font-mono font-bold text-rose-400">
                        Selected: {scamSelectedGroups.length} of {groups.length} groups
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (scamSelectedGroups.length === groups.length) setScamSelectedGroups([]);
                        else setScamSelectedGroups(groups.map(g => g.jid));
                      }}
                      className="text-xs text-rose-400 hover:underline font-bold"
                    >
                      {scamSelectedGroups.length === groups.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 max-h-52 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {filteredScamGroups.map((grp) => {
                      const isChecked = scamSelectedGroups.includes(grp.jid);
                      return (
                        <label
                          key={grp.jid}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${isChecked ? 'bg-rose-950/30 border-rose-500/40 text-rose-200' : 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setScamSelectedGroups(prev =>
                                  prev.includes(grp.jid) ? prev.filter(id => id !== grp.jid) : [...prev, grp.jid]
                                );
                              }}
                              className="w-4 h-4 rounded text-rose-500 border-slate-700 bg-slate-950 focus:ring-0"
                            />
                            <span className="font-bold truncate">{grp.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{grp.member_count || ''} members</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setScamTitle('');
                      setScamReportedNumber('');
                      setScamDescription('');
                      setScamProofImages([]);
                      setScamProofAudios([]);
                      setScamSelectedGroups([]);
                      setScamSubTab('history');
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold border border-slate-700/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveOrSendScamReport(false)}
                    disabled={isSubmittingScam}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveOrSendScamReport(true)}
                    disabled={isSubmittingScam || scamSelectedGroups.length === 0}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    <Megaphone className="w-4 h-4" />
                    {isSubmittingScam ? 'Broadcasting Scam Alert...' : 'Broadcast Scam Alert Now'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Scam Report History Subtab */
            <div className="space-y-4">
              {scamReports.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
                  No scam reports found. Create a scam alert to view its history here.
                </div>
              ) : (
                scamReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">Scam Alert Report</span>
                        <h3 className="text-base font-bold text-white">{report.title}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-300">
                        {report.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Reported Number:</span>
                        <span className="font-mono text-rose-300 font-bold">{report.reported_number}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Groups Targeted:</span>
                        <span className="text-white font-bold">{report.total_groups || report.target_group_jids?.length} groups</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Delivery Status:</span>
                        <span className="text-emerald-400 font-bold">{report.sent_count || 0} Sent</span> / <span className="text-rose-400 font-bold">{report.failed_count || 0} Failed</span>
                      </div>
                    </div>

                    {report.description && (
                      <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        {report.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedScamReportForDetails(report)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleExecuteScamReport(report.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send to Groups
                        </button>
                        <button
                          onClick={() => handleRetryScamReport(report.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                          Retry Failed
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setScamReportForDeletion(report);
                            setScamDeletionResults(null);
                          }}
                          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Sent Messages
                        </button>
                        <button
                          onClick={() => handleDeleteScamReport(report.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-bold"
                        >
                          Delete Record
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB: TRUSTED POST MODULE (DEDICATED DASHBOARD) --- */}
      {activeTab === 'trusted-posts' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-indigo-400 flex items-center gap-2.5">
                <Award className="w-7 h-7 text-indigo-500" />
                Trusted Entity & Verified Business Post Module
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Official recommendations and verified business announcements with authenticity badge.
              </p>
            </div>

            {/* Sub-tab Navigation */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setTrustedSubTab('create')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${trustedSubTab === 'create' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
              >
                ✨ Create Trusted Post
              </button>
              <button
                onClick={() => setTrustedSubTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${trustedSubTab === 'history' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
              >
                📜 Trusted Posts History ({trustedPosts.length})
              </button>
            </div>
          </div>

          {/* Dedicated Trusted Post 5 Statistic Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Eligible Groups
                </span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono">{trustedStats.eligibleGroups}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Trusted Posts Sent
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{trustedStats.totalSent}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Failed Sends
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">{trustedStats.totalFailed}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Pending Sends
                </span>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{trustedStats.totalPending}</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3.5 col-span-2 lg:col-span-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block truncate">
                  Scheduled Posts
                </span>
                <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono">{trustedStats.totalScheduled}</span>
              </div>
            </div>
          </div>

          {trustedSubmitFeedback && (
            <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2.5 ${trustedSubmitFeedback.type === 'success' ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300' : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
              }`}>
              {trustedSubmitFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-rose-400" />}
              {trustedSubmitFeedback.text}
            </div>
          )}

          {trustedSubTab === 'create' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-w-4xl mx-auto">
              <div className="space-y-4">

                {/* 1. Trusted Name & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Trusted Person / Business / Org Name *
                    </label>
                    <input
                      type="text"
                      value={trustedName}
                      onChange={(e) => setTrustedName(e.target.value)}
                      placeholder="e.g. Mujahid Telecom / ABC Services"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Contact Number or Website
                    </label>
                    <input
                      type="text"
                      value={trustedContact}
                      onChange={(e) => setTrustedContact(e.target.value)}
                      placeholder="e.g. +923176080744 or https://mujahiddigitalzone.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* 2. Post Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Post Title / Endorsement Subject *
                  </label>
                  <input
                    type="text"
                    value={trustedTitle}
                    onChange={(e) => setTrustedTitle(e.target.value)}
                    placeholder="e.g. Official Partner Recommendation / 100% Trusted Dealer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 3. Description with WhatsApp formatting */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Endorsement Description / Terms
                    </label>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setTrustedDescription(prev => prev + '*bold text*')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold px-2"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrustedDescription(prev => prev + '_italic text_')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold px-2"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrustedDescription(prev => prev + '~strike~')}
                        className="p-1 hover:bg-slate-800 rounded text-slate-300 text-xs font-bold px-2"
                      >
                        <Strikethrough className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={trustedDescription}
                    onChange={(e) => setTrustedDescription(e.target.value)}
                    rows={4}
                    placeholder="Detail the verified services, trust guarantee, and special offers..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* 4. Media Uploads: Image / Audio / Supporting Document */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Logo Image */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase block">Logo / Banner Image</span>
                    <input
                      type="file"
                      ref={trustedImageInputRef}
                      onChange={handleTrustedImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => trustedImageInputRef.current?.click()}
                      disabled={isUploadingTrustedImage}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <ImageIcon className="w-4 h-4 text-indigo-400" />
                      {isUploadingTrustedImage ? 'Uploading...' : 'Upload Logo / Poster'}
                    </button>
                    {trustedImageUrl && (
                      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs">
                        <img src={trustedImageUrl} alt="" className="w-8 h-8 rounded object-cover" />
                        <span className="truncate flex-1 font-mono text-[11px] text-slate-300">Logo Attached</span>
                        <button type="button" onClick={() => setTrustedImageUrl('')} className="text-slate-500 hover:text-rose-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Audio Voice Note */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase block">Voice Recommendation</span>
                    <input
                      type="file"
                      ref={trustedAudioInputRef}
                      onChange={handleTrustedAudioUpload}
                      accept="audio/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => trustedAudioInputRef.current?.click()}
                      disabled={isUploadingTrustedAudio}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <Mic className="w-4 h-4 text-indigo-400" />
                      {isUploadingTrustedAudio ? 'Uploading...' : 'Upload Voice Note (.mp3)'}
                    </button>
                    {trustedAudioUrl && (
                      <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-slate-300">Audio Note Attached</span>
                          <button type="button" onClick={() => setTrustedAudioUrl('')} className="text-slate-500 hover:text-rose-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <audio src={trustedAudioUrl} controls className="w-full h-8" />
                      </div>
                    )}
                  </div>

                  {/* Supporting Document */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-slate-300 uppercase block">Supporting Document</span>
                    <input
                      type="file"
                      ref={trustedDocInputRef}
                      onChange={handleTrustedDocUpload}
                      accept=".pdf,.doc,.docx,.txt,.xlsx"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => trustedDocInputRef.current?.click()}
                      disabled={isUploadingTrustedDoc}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      {isUploadingTrustedDoc ? 'Uploading...' : 'Upload Document (.pdf/.doc)'}
                    </button>
                    {trustedDocUrl && (
                      <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800 text-xs">
                        <Paperclip className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate flex-1 font-mono text-[11px] text-slate-300">{trustedDocFilename || 'Document Attached'}</span>
                        <button type="button" onClick={() => { setTrustedDocUrl(''); setTrustedDocFilename(''); }} className="text-slate-500 hover:text-rose-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Schedule Option */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase block">Dispatch / Schedule Mode</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTrustedScheduleMode('IMMEDIATE')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${trustedScheduleMode === 'IMMEDIATE' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                          }`}
                      >
                        ⚡ Immediate
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrustedScheduleMode('SCHEDULED')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${trustedScheduleMode === 'SCHEDULED' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400'
                          }`}
                      >
                        📅 Schedule for Later
                      </button>
                    </div>
                  </div>

                  {trustedScheduleMode === 'SCHEDULED' && (
                    <div className="pt-2 border-t border-slate-800/80">
                      <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Select Dispatch Datetime</label>
                      <input
                        type="datetime-local"
                        value={trustedScheduleTime}
                        onChange={(e) => setTrustedScheduleTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                {/* 6. Target Groups Selection with Strict Lock */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                        Target Real WhatsApp Groups
                      </label>
                      <span className="text-[11px] font-mono font-bold text-indigo-400">
                        Selected: {trustedSelectedGroups.length} of {groups.length} groups
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (trustedSelectedGroups.length === groups.length) setTrustedSelectedGroups([]);
                        else setTrustedSelectedGroups(groups.map(g => g.jid));
                      }}
                      className="text-xs text-indigo-400 hover:underline font-bold"
                    >
                      {trustedSelectedGroups.length === groups.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 max-h-52 overflow-y-auto space-y-1.5 scrollbar-thin">
                    {filteredTrustedGroups.map((grp) => {
                      const isChecked = trustedSelectedGroups.includes(grp.jid);
                      return (
                        <label
                          key={grp.jid}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer text-xs ${isChecked ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200' : 'bg-slate-900/50 border-slate-800/80 text-slate-300'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setTrustedSelectedGroups(prev =>
                                  prev.includes(grp.jid) ? prev.filter(id => id !== grp.jid) : [...prev, grp.jid]
                                );
                              }}
                              className="w-4 h-4 rounded text-indigo-500 border-slate-700 bg-slate-950 focus:ring-0"
                            />
                            <span className="font-bold truncate">{grp.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{grp.member_count || ''} members</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setTrustedTitle('');
                      setTrustedName('');
                      setTrustedContact('');
                      setTrustedDescription('');
                      setTrustedImageUrl('');
                      setTrustedAudioUrl('');
                      setTrustedDocUrl('');
                      setTrustedDocFilename('');
                      setTrustedSelectedGroups([]);
                      setTrustedSubTab('history');
                    }}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold border border-slate-700/60"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPreviewTrustedModalOpen(true)}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4 text-indigo-400" />
                    Live Preview
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveOrSendTrustedPost(false)}
                    disabled={isSubmittingTrusted}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
                  >
                    {trustedScheduleMode === 'SCHEDULED' ? 'Save and Schedule' : 'Save Draft'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveOrSendTrustedPost(true)}
                    disabled={isSubmittingTrusted || trustedSelectedGroups.length === 0}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    {isSubmittingTrusted ? 'Broadcasting...' : 'Send Now'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Trusted Post History */
            <div className="space-y-4">
              {trustedPosts.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 text-xs">
                  No trusted posts found. Create an endorsement to view its records here.
                </div>
              ) : (
                trustedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Verified Trusted Post</span>
                        <h3 className="text-base font-bold text-white">{post.title}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                        {post.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Trusted Entity:</span>
                        <span className="text-indigo-300 font-bold">{post.trusted_name}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact / URL:</span>
                        <span className="font-mono text-slate-200">{post.contact_info || 'N/A'}</span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Dispatches:</span>
                        <span className="text-emerald-400 font-bold">{post.sent_count || 0} Sent</span> / <span className="text-rose-400 font-bold">{post.failed_count || 0} Failed</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedTrustedPostForDetails(post)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleExecuteTrustedPost(post.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send Now
                        </button>
                        <button
                          onClick={() => handleRetryTrustedPost(post.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                          Retry Failed
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setTrustedPostForDeletion(post);
                            setTrustedDeletionResults(null);
                          }}
                          className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Sent Messages
                        </button>
                        <button
                          onClick={() => handleDeleteTrustedPost(post.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-bold"
                        >
                          Delete Record
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}


      {/* --- TAB: STATUS NOTIFICATION (DEDICATED DASHBOARD) --- */}
      {activeTab === 'status-notifications' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                  <BellRing className="w-6 h-6 animate-pulse" />
                </span>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    STATUS NOTIFICATION
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      LIVE ENGINE
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 font-medium">
                    Manage WhatsApp Status Publishing & Group Notifications
                  </p>
                </div>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleOpenNewStatusUploadModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ ADD MY STATUS</span>
              </button>

              <button
                onClick={handleRefreshMyStatuses}
                disabled={isLoadingMyStatuses}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Refresh Live WhatsApp My Status Updates"
              >
                <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoadingMyStatuses ? 'animate-spin' : ''}`} />
                <span>REFRESH STATUS</span>
              </button>

              <button
                onClick={() => {
                  if (statusNotifications.length > 0) {
                    setStatusNotifLiveViewModalTask(statusNotifications[0]);
                  } else {
                    showNotification('info', 'Create a status campaign first to launch Live View.');
                  }
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                title="Live Real-Time Monitoring"
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>LIVE VIEW</span>
              </button>

              <button
                onClick={() => setStatusNotifSettingsModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Settings className="w-4 h-4 text-purple-400" />
                <span>SETTINGS</span>
              </button>
            </div>
          </div>

          {/* DEDICATED SECTION NAVIGATION (SECTIONS A TO H) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800 custom-scrollbar">
            <button
              onClick={() => setStatusNotifSubTab('my-status')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all border ${statusNotifSubTab === 'my-status'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>📱 A. My WhatsApp Status</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 text-emerald-300 font-bold">
                {liveMyStatuses.length}
              </span>
            </button>

            <button
              onClick={() => setStatusNotifSubTab('dashboard')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all border ${statusNotifSubTab === 'dashboard'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
              <Megaphone className="w-4 h-4 text-teal-400" />
              <span>📢 B & D. Status Campaigns</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 text-teal-300 font-bold">
                {statusNotifications.length}
              </span>
            </button>

            <button
              onClick={() => setStatusNotifSubTab('groups')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all border ${statusNotifSubTab === 'groups'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
              <Users className="w-4 h-4 text-indigo-400" />
              <span>👥 E. WhatsApp Groups</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/40 text-indigo-300 font-bold">
                {groups.length}
              </span>
            </button>

            <button
              onClick={() => setStatusNotifSubTab('history')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all border ${statusNotifSubTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>📜 G. Delivery History</span>
            </button>

            <button
              onClick={() => setStatusNotifSubTab('analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all border ${statusNotifSubTab === 'analytics'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-950/60 ring-1 ring-emerald-400/40'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>📊 H. Live Analytics</span>
            </button>
          </div>

          {/* SECTION A: MY WHATSAPP STATUS */}
          {statusNotifSubTab === 'my-status' && (
            <div className="space-y-6">
              {/* Account Banner & Privacy Notice (Matching Screenshot) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
                      📱
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white">
                          {status?.name || 'Mujahid Abbas'}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {status?.phone ? `+${status.phone}` : '+923176080744'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                          ● CONNECTED
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Real Live WhatsApp Status Monitor &bull; 24/7 Cloud Background Sync
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleRefreshMyStatuses}
                      disabled={isLoadingMyStatuses}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoadingMyStatuses ? 'animate-spin' : ''}`} />
                      <span>Refresh Statuses</span>
                    </button>
                    <button
                      onClick={handleOpenNewStatusUploadModal}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add My Status</span>
                    </button>
                  </div>
                </div>

                {/* End-to-end encryption notice (direct match to user reference screenshot) */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-400">
                  <span className="text-emerald-400 font-bold">🔒</span>
                  <span>
                    Your statuses are end-to-end encrypted. They will disappear after 24 hours.
                  </span>
                </div>
              </div>

              {/* Statuses Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Recent Status Updates</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-normal">
                      {liveMyStatuses.length}
                    </span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    Auto-refreshes on WhatsApp status broadcast receipts
                  </span>
                </div>

                {liveMyStatuses.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                    <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-300">No Active WhatsApp Statuses (Last 24 Hours)</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Any status posted from your phone (WhatsApp Mobile) or published through this dashboard will appear here in real time.
                    </p>
                    <button
                      onClick={handleOpenNewStatusUploadModal}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add My Status</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveMyStatuses.map((st, idx) => (
                      <div
                        key={st.id || idx}
                        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-emerald-500/40 transition-all flex flex-col justify-between"
                      >
                        {/* Media Preview / Visual Header */}
                        <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                          {(st.image_url || st.media_url || st.thumbnail_url) && (st.media_type === 'image' || st.type === 'image' || (!st.media_type && !st.type)) ? (
                            <img src={st.image_url || st.thumbnail_url || st.media_url} alt="" className="w-full h-full object-cover" />
                          ) : (st.video_url || st.media_type === 'video' || st.type === 'video') ? (
                            <div className="flex flex-col items-center justify-center gap-1 text-purple-400">
                              <Film className="w-8 h-8" />
                              <span className="text-[10px] font-mono">Video Status</span>
                            </div>
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center p-4 text-center font-bold text-white text-sm"
                              style={{ backgroundColor: st.bg_color || '#075E54' }}
                            >
                              <span className="line-clamp-3">{st.caption || st.text || 'Text Status'}</span>
                            </div>
                          )}

                          {/* Top Badges */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                              {st.media_type || st.type || (st.video_url ? 'video' : (st.image_url || st.media_url) ? 'image' : 'text')}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur-md text-slate-300 border border-slate-700">
                              {st.state || 'ACTIVE'}
                            </span>
                          </div>

                          <div className="absolute top-2.5 right-2.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-black/70 backdrop-blur-md text-cyan-300 border border-cyan-500/30">
                              {st.source === 'DIRECT_WHATSAPP' || st.source === 'whatsapp' ? '📱 Mobile' : '🖥️ Dashboard'}
                            </span>
                          </div>

                          {/* Reference Screenshot Replica Overlay (Bottom Bar: 1 view • 55 minutes ago) */}
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 flex items-center justify-between text-xs text-white">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/40" />
                              <span className="font-bold">My status</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-slate-300" />
                                <strong>{st.views_count || 0}</strong> {st.views_count === 1 ? 'view' : 'views'}
                              </span>
                              <span>&bull;</span>
                              <span>{st.time_ago || 'Recent'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card Content & Action Bar */}
                        <div className="p-4 space-y-3">
                          {(st.caption || st.text) && (
                            <p className="text-xs text-slate-300 line-clamp-2 italic">
                              "{st.caption || st.text}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2.5">
                            <span className="truncate max-w-[140px]" title={st.id}>
                              ID: {st.id ? st.id.slice(0, 12) + '...' : 'Unknown'}
                            </span>
                            <span>
                              {st.timestamp ? new Date(st.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          <div className="pt-1 flex items-center gap-2">
                            <button
                              onClick={() => {
                                setStatusNotifName(`Status Alert - ${st.id ? st.id.slice(0, 6) : 'Update'}`);
                                const mType = st.media_type || st.type;
                                if (mType === 'video') {
                                  setStatusNotifContentType('video');
                                  setStatusNotifVideoUrl(st.video_url || st.media_url || '');
                                } else if (mType === 'text') {
                                  setStatusNotifContentType('text');
                                  setStatusNotifText(st.caption || st.text || '');
                                } else {
                                  setStatusNotifContentType('image');
                                  setStatusNotifImageUrl(st.image_url || st.thumbnail_url || st.media_url || '');
                                }
                                setStatusNotifCaption(st.caption || st.text || '');
                                setStatusNotifModalOpen(true);
                              }}
                              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Group Notification</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION B, C, D & F: STATUS CAMPAIGNS & SCHEDULES */}
          {statusNotifSubTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Statistics (10 Real Backend Cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Status Campaigns */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Campaigns</span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">{statusNotifications.length}</span>
                    <span className="text-[10px] text-slate-500 block">Registered campaigns</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                {/* 2. Successfully Published */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Published to Status</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      {statusNotifications.filter(t => t.status_publishing_state === 'PUBLISHED').length}
                    </span>
                    <span className="text-[10px] text-emerald-500 block">Confirmed on My Status</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                {/* 3. Pending Publications */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Publications</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                      {statusNotifications.filter(t => t.status_publishing_state !== 'PUBLISHED' && t.status_publishing_state !== 'FAILED').length}
                    </span>
                    <span className="text-[10px] text-amber-500 block">Drafts / Queued</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>

                {/* 4. Failed Publications */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Failed Publications</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                      {statusNotifications.filter(t => t.status_publishing_state === 'FAILED').length}
                    </span>
                    <span className="text-[10px] text-rose-500 block">Groups blocked</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                </div>

                {/* 5. Selected Groups */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Groups</span>
                    <span className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">
                      {statusNotifications.reduce((acc, t) => acc + (t.selected_group_ids?.length || t.target_group_jids?.length || 0), 0)}
                    </span>
                    <span className="text-[10px] text-indigo-500 block">Targeted groups</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                {/* 6. Notifications Sent */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notifications Sent</span>
                    <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                      {statusNotifications.reduce((acc, t) => acc + (t.sent_count || 0), 0)}
                    </span>
                    <span className="text-[10px] text-cyan-500 block">Dispatched to groups</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Send className="w-5 h-5" />
                  </div>
                </div>

                {/* 7. Failed Notifications */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Failed Notifications</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                      {statusNotifications.reduce((acc, t) => acc + (t.failed_count || 0), 0)}
                    </span>
                    <span className="text-[10px] text-rose-500 block">Ready for group retry</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>

                {/* 8. Notification Clicks */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notification Clicks</span>
                    <span className="text-xl sm:text-2xl font-black text-purple-400 font-mono">
                      {statusNotifications.reduce((acc, t) => acc + (t.link_clicks || 0), 0)}
                    </span>
                    <span className="text-[10px] text-purple-500 block">Link tracking analytics</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <MousePointerClick className="w-5 h-5" />
                  </div>
                </div>

                {/* 9. Active Campaigns */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Campaigns</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      {statusNotifications.filter(t => t.status === 'ACTIVE').length}
                    </span>
                    <span className="text-[10px] text-emerald-500 block">Server-side scheduler</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Zap className="w-5 h-5" />
                  </div>
                </div>

                {/* 10. Next Scheduled Notification */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Next Schedule</span>
                    <span className="text-xs sm:text-sm font-black text-amber-300 font-mono truncate block">
                      {statusNotifications.find(t => t.next_execution_time)?.next_execution_time
                        ? new Date(statusNotifications.find(t => t.next_execution_time)!.next_execution_time!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'None active'}
                    </span>
                    <span className="text-[10px] text-slate-500 block">24/7 Cloud Background</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Campaigns Table & Cards */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-emerald-400" />
                      Status Notification Campaigns & Schedules
                    </h3>
                    <p className="text-xs text-slate-400">
                      Strict Rule: Status publishes directly to My Status first. Notifications are dispatched to groups only after verified publication.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-400">
                      Total Campaigns: <strong className="text-white">{statusNotifications.length}</strong>
                    </span>
                  </div>
                </div>

                {statusNotifications.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <BellRing className="w-12 h-12 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-300">No Status Notification Campaigns Yet</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Click the <strong>+ ADD MY STATUS</strong> button above to upload an Image, Video, or Text Status, tag your recipient groups, and schedule notifications.
                    </p>
                    <button
                      onClick={handleOpenNewStatusUploadModal}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add My Status</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-bold bg-slate-950/40">
                          <th className="py-3 px-3">Campaign & Content</th>
                          <th className="py-3 px-3">My Status Publication</th>
                          <th className="py-3 px-3">Campaign State</th>
                          <th className="py-3 px-3">Frequency & Schedule</th>
                          <th className="py-3 px-3">Groups & Delivery</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-xs">
                        {statusNotifications.map((notif) => {
                          const taskId = notif.post_id || notif.id;
                          const isPublished = notif.status_publishing_state === 'PUBLISHED';
                          const isPubFailed = notif.status_publishing_state === 'FAILED';
                          const selectedGroupsCount = notif.selected_group_ids?.length || notif.target_group_jids?.length || 0;

                          return (
                            <tr key={taskId} className="hover:bg-slate-800/40 transition-colors">
                              {/* 1. Campaign & Content */}
                              <td className="py-3.5 px-3">
                                <div className="flex items-center gap-3">
                                  {notif.image_url ? (
                                    <img
                                      src={notif.image_url}
                                      alt=""
                                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 bg-slate-950 shrink-0"
                                    />
                                  ) : notif.video_url ? (
                                    <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                                      <Film className="w-5 h-5" />
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-xl bg-teal-950/60 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
                                      TXT
                                    </div>
                                  )}
                                  <div className="space-y-0.5 min-w-0">
                                    <h4 className="font-bold text-white truncate max-w-xs">
                                      {notif.notification_headline || notif.tool_name || notif.head_name || 'Status Campaign'}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                      <span className="uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                        {notif.media_type || (notif.video_url ? 'video' : notif.image_url ? 'image' : 'text')}
                                      </span>
                                      {notif.order_id && <span className="font-mono text-slate-500">{notif.order_id}</span>}
                                    </div>
                                    {notif.message && (
                                      <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                                        "{notif.message}"
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* 2. My Status Publication */}
                              <td className="py-3.5 px-3">
                                <div className="space-y-1">
                                  {isPublished ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>PUBLISHED</span>
                                    </div>
                                  ) : isPubFailed ? (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-bold">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                      <span>PUB FAILED</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                                      <span>PENDING CONFIRM</span>
                                    </div>
                                  )}
                                  {notif.status_message_id && (
                                    <p className="text-[10px] font-mono text-slate-400">
                                      Ref: <span className="text-cyan-300">{notif.status_message_id.slice(0, 10)}...</span>
                                    </p>
                                  )}
                                  {notif.status_published_at && (
                                    <p className="text-[10px] text-slate-500">
                                      {new Date(notif.status_published_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* 3. Campaign State */}
                              <td className="py-3.5 px-3">
                                <div className="space-y-1">
                                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-block ${notif.status === 'ACTIVE'
                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                                    : notif.status === 'PAUSED'
                                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                                      : notif.status === 'EXPIRED'
                                        ? 'bg-slate-800 border border-slate-700 text-slate-400'
                                        : 'bg-slate-800 border border-slate-700 text-slate-300'
                                    }`}>
                                    {notif.status || 'DRAFT'}
                                  </span>
                                  <p className="text-[10px] text-slate-400">
                                    Duration: {notif.validity_duration || '24 hours'}
                                  </p>
                                </div>
                              </td>

                              {/* 4. Frequency & Schedule */}
                              <td className="py-3.5 px-3 font-mono">
                                <div className="space-y-0.5">
                                  <span className="text-slate-200 font-bold">
                                    {notif.posts_per_day || 1}x / Day
                                  </span>
                                  <p className="text-[10px] text-slate-400">
                                    Starts: {formatTime12h(notif.start_time || '09:00')}
                                  </p>
                                  {notif.next_execution_time && (
                                    <p className="text-[10px] text-cyan-400">
                                      Next: {new Date(notif.next_execution_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  )}
                                </div>
                              </td>

                              {/* 5. Groups & Delivery */}
                              <td className="py-3.5 px-3">
                                <div className="space-y-1">
                                  <div className="font-bold text-slate-200 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>{selectedGroupsCount} Groups Tagged</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-emerald-400 font-bold">{notif.sent_count || 0} Sent</span>
                                    <span>•</span>
                                    <span className="text-rose-400 font-bold">{notif.failed_count || 0} Failed</span>
                                  </div>
                                  {notif.target_group_names && notif.target_group_names.length > 0 && (
                                    <div className="flex flex-wrap gap-1 max-w-xs pt-0.5">
                                      {notif.target_group_names.slice(0, 3).map((name, i) => (
                                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-indigo-300 font-mono truncate max-w-[90px]">
                                          {name}
                                        </span>
                                      ))}
                                      {notif.target_group_names.length > 3 && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-950 text-indigo-300 font-mono">
                                          +{notif.target_group_names.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* 6. Actions */}
                              <td className="py-3.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                  {/* View / Edit Tagged Groups */}
                                  <button
                                    onClick={() => {
                                      setStatusNotifName(notif.notification_headline || notif.tool_name || '');
                                      setStatusNotifContentType(notif.media_type || (notif.video_url ? 'video' : notif.image_url ? 'image' : 'text'));
                                      setStatusNotifImageUrl(notif.image_url || '');
                                      setStatusNotifVideoUrl(notif.video_url || '');
                                      setStatusNotifText(notif.media_type === 'text' ? notif.message || '' : '');
                                      setStatusNotifCaption(notif.message || '');
                                      setStatusNotifLink(notif.cta_link || '');
                                      setStatusNotifSelectedGroups(notif.selected_group_ids || notif.target_group_jids || []);
                                      setStatusNotifFrequency(notif.posts_per_day || 3);
                                      setStatusNotifModalOpen(true);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1"
                                    title="View & Edit Tagged Groups"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Tagged ({selectedGroupsCount})</span>
                                  </button>

                                  {/* Live View */}
                                  <button
                                    onClick={() => setStatusNotifLiveViewModalTask(notif)}
                                    className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1"
                                    title="Live View Real-Time Tracking"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Live View</span>
                                  </button>

                                  {/* Publish Status if not published */}
                                  {!isPublished && (
                                    <button
                                      onClick={() => handlePublishStatusOnly(taskId)}
                                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1"
                                      title="Publish to WhatsApp My Status now"
                                    >
                                      <UploadCloud className="w-3.5 h-3.5" />
                                      <span>Publish Status</span>
                                    </button>
                                  )}

                                  {/* Send Notifications only if published */}
                                  {isPublished && (
                                    <button
                                      onClick={() => handleSendNotificationsOnly(taskId)}
                                      className="px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1"
                                      title="Send Status Notification to selected groups"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Send Notif</span>
                                    </button>
                                  )}

                                  {/* Retry Failed Groups */}
                                  {(notif.failed_count || 0) > 0 && (
                                    <button
                                      onClick={() => handleRetryStatusNotifGroups(taskId)}
                                      className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1"
                                      title="Retry only failed recipient groups"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Retry</span>
                                    </button>
                                  )}

                                  {/* Details / History Modal */}
                                  <button
                                    onClick={() => setStatusNotifHistoryModalTask(notif)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold"
                                    title="View per-group delivery details"
                                  >
                                    <ListOrdered className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Pause / Resume */}
                                  <button
                                    onClick={() => handleToggleStatusNotifActive(taskId, notif.status === 'PAUSED')}
                                    className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 text-xs"
                                    title={notif.status === 'PAUSED' ? 'Resume Schedule' : 'Pause Schedule'}
                                  >
                                    {notif.status === 'PAUSED' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteStatusNotif(taskId)}
                                    className="px-2 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 text-xs"
                                    title="Delete campaign"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION E: SELECT WHATSAPP GROUPS */}
          {statusNotifSubTab === 'groups' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    WhatsApp Groups for Status Notifications
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real groups loaded directly from the connected WhatsApp account. Only selected groups receive status alerts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStatusNotifSelectedGroups(groups.map(g => g.jid))}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Select All ({groups.length})
                  </button>
                  <button
                    onClick={() => setStatusNotifSelectedGroups([])}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => fetchStatusAndData(false)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Groups</span>
                  </button>
                </div>
              </div>

              {/* Search & Counter */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-72 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={statusNotifGroupSearch}
                    onChange={(e) => setStatusNotifGroupSearch(e.target.value)}
                    placeholder="Search groups by name or JID..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Selected: <strong className="text-indigo-400 font-bold">{statusNotifSelectedGroups.length}</strong> / {groups.length} Groups
                </div>
              </div>

              {/* Groups Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
                {groups
                  .filter(g => {
                    const q = statusNotifGroupSearch.toLowerCase();
                    return !q || (g.name || '').toLowerCase().includes(q) || (g.jid || '').toLowerCase().includes(q);
                  })
                  .map((g) => {
                    const isSelected = statusNotifSelectedGroups.includes(g.jid);
                    return (
                      <div
                        key={g.jid}
                        onClick={() => {
                          setStatusNotifSelectedGroups(prev =>
                            prev.includes(g.jid) ? prev.filter(j => j !== g.jid) : [...prev, g.jid]
                          );
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected
                          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                          }`}
                      >
                        {/* Profile Avatar */}
                        {g.profile_picture_url ? (
                          <img
                            src={g.profile_picture_url}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 bg-slate-900 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
                            {(g.name || 'G').charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h4 className="text-xs font-bold text-white truncate">{g.name || 'WhatsApp Group'}</h4>
                          <p className="text-[10px] font-mono text-slate-500 truncate" title={g.jid}>{g.jid}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>{g.participants_count || g.member_count || 0} members</span>
                            <span>&bull;</span>
                            <span className={g.can_send !== false ? 'text-emerald-400' : 'text-amber-400'}>
                              {g.can_send !== false ? 'Can Send' : 'Read Only'}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SECTION G: NOTIFICATION DELIVERY HISTORY */}
          {statusNotifSubTab === 'history' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-400" />
                    Status Notification Delivery History & Audit Trail
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real per-group delivery records showing verification state: Attempted, Accepted, Delivered, or Failed.
                  </p>
                </div>
                <button
                  onClick={() => fetchStatusAndData(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Refresh History</span>
                </button>
              </div>

              {/* Delivery logs */}
              {statusNotifications.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <History className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-300">No Delivery History Yet</h4>
                  <p className="text-xs text-slate-500">Dispatch notifications to groups to see delivery confirmations here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {statusNotifications.map((t) => {
                    const deliveries = t.group_deliveries || [];
                    return (
                      <div key={t.id || t.post_id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">
                              {t.notification_headline || t.tool_name || 'Campaign'}
                            </span>
                            {t.status_message_id && (
                              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-800">
                                Ref: {t.status_message_id.slice(0, 10)}...
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-400 font-bold">{t.sent_count || 0} Sent</span>
                            <span className="text-rose-400 font-bold">{t.failed_count || 0} Failed</span>
                            <span className="text-slate-400">{deliveries.length} Recipient Groups</span>
                          </div>
                        </div>

                        {deliveries.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">No delivery attempts recorded for this campaign yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {deliveries.map((d: any, didx: number) => (
                              <div
                                key={didx}
                                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${d.status === 'SENT' || d.status === 'DELIVERED'
                                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                                  : d.status === 'FAILED'
                                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                                    : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                                  }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="font-bold block truncate">{d.group_name || d.group_jid}</span>
                                  <span className="text-[10px] font-mono text-slate-400 block truncate">{d.group_jid}</span>
                                  {d.error && <span className="text-[10px] text-rose-400 block">{d.error}</span>}
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider block">
                                    {d.status}
                                  </span>
                                  {d.sent_at && (
                                    <span className="text-[10px] text-slate-400 block">
                                      {new Date(d.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* SECTION H: LIVE ANALYTICS */}
          {statusNotifSubTab === 'analytics' && (
            <div className="space-y-6">
              {/* Top 10 KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Campaigns</span>
                    <span className="text-xl sm:text-2xl font-black text-white font-mono">{statusNotifications.length}</span>
                    <span className="text-[10px] text-slate-500 block">All recorded</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Published</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                      {statusNotifications.filter(t => t.status_publishing_state === 'PUBLISHED').length}
                    </span>
                    <span className="text-[10px] text-emerald-500 block">Verified on My Status</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live My Statuses</span>
                    <span className="text-xl sm:text-2xl font-black text-cyan-400 font-mono">
                      {liveMyStatuses.length}
                    </span>
                    <span className="text-[10px] text-cyan-500 block">Active in last 24h</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notifications Sent</span>
                    <span className="text-xl sm:text-2xl font-black text-teal-400 font-mono">
                      {statusNotifications.reduce((acc, t) => acc + (t.sent_count || 0), 0)}
                    </span>
                    <span className="text-[10px] text-teal-500 block">Dispatched to groups</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Send className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Failed Recipient Alerts</span>
                    <span className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                      {statusNotifications.reduce((acc, t) => acc + (t.failed_count || 0), 0)}
                    </span>
                    <span className="text-[10px] text-rose-500 block">Ready for retry</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Analytics Breakdown Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    Status Publishing Performance
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400">My Status Publication Success Rate</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {statusNotifications.length > 0
                          ? Math.round((statusNotifications.filter(t => t.status_publishing_state === 'PUBLISHED').length / statusNotifications.length) * 100)
                          : 100}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400">Linked Account Primary Status Target</span>
                      <span className="font-bold text-white font-mono">status@broadcast</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400">Status Quoting Engine</span>
                      <span className="font-bold text-cyan-400">Native Baileys Quoted Status Broadcast</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    System & Engine Health
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400">Socket Protocol</span>
                      <span className="font-bold text-emerald-400">Baileys Multi-Device WebSockets</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400">Background Worker</span>
                      <span className="font-bold text-emerald-400">Running (Every 15 Seconds)</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="text-slate-400">Real Status Receipt Tracking</span>
                      <span className="font-bold text-emerald-400">Active (message-receipt.update)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- TAB: WHATSAPP CONNECTION --- */}
      {activeTab === 'connection' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-white">WhatsApp Sender Auto Post Connection</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Scan QR code with your mobile WhatsApp or generate an 8-digit Pairing Code for permanent 24/7 cloud sync.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
            {isConnected ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto text-2xl font-bold shadow-xl">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-white">WhatsApp Auto Sender is Connected</h3>
                <p className="text-xs text-slate-400">
                  Connected as <span className="font-bold text-emerald-400">{status?.name}</span> (+{status?.phone}). Background worker is running continuously.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <button
                    onClick={handleOpenNewPostForm}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg"
                  >
                    Create Auto Post
                  </button>
                  <button
                    onClick={handleUnlink}
                    className="px-6 py-3 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-bold"
                  >
                    Unlink Device
                  </button>
                </div>
              </div>
            ) : (status?.qrDataUrl || isQrAvailable) && status?.qrDataUrl ? (
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-3xl inline-block shadow-2xl border-4 border-slate-800">
                  <img src={status.qrDataUrl} alt="WhatsApp QR" className="w-56 h-56 sm:w-64 sm:h-64 object-contain" />
                </div>
                <p className="text-xs text-slate-400">
                  Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device and point your camera here.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleRefreshQr}
                    disabled={refreshing}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh QR Code'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto animate-spin">
                  <RefreshCw className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">Initializing WhatsApp Socket...</h3>
                <p className="text-xs text-slate-400">
                  Preparing secure multi-device session on VPS cloud server. Please wait a few seconds.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handleRefreshQr}
                    disabled={refreshing}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Generating QR...' : 'Generate Live QR Code'}
                  </button>
                </div>
              </div>
            )}

            {/* Pairing Code Section */}
            {!isConnected && (
              <div className="pt-6 border-t border-slate-800/80 space-y-3 text-left">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Or Connect with WhatsApp Phone Pairing Code
                </span>
                <form onSubmit={handleRequestPairingCode} className="flex gap-2">
                  <input
                    type="text"
                    value={pairingPhone}
                    onChange={(e) => setPairingPhone(e.target.value)}
                    placeholder="Enter phone with country code (e.g. 923176080744)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isPairingLoading}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {isPairingLoading ? 'Requesting...' : 'Get Code'}
                  </button>
                </form>
                {status?.pairingCode && (
                  <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Enter this code in WhatsApp notification:</span>
                    <span className="text-2xl font-mono font-black text-white tracking-widest">{status.pairingCode}</span>
                  </div>
                )}
                {pairingError && <p className="text-xs text-rose-400">{pairingError}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB: COMPLETE STATUS & DETAILED REPORT --- */}
      {activeTab === 'status-report' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                <Activity className="w-6 h-6 text-cyan-400" />
                Complete Status & Per-Group Delivery Records
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Detailed audit trail of message dispatches and delivery timestamps for every recipient group.
              </p>
            </div>

            {/* Select Post Dropdown */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedTaskIdForStatus || ''}
                onChange={(e) => setSelectedTaskIdForStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 max-w-xs truncate"
              >
                {tasks.map(t => (
                  <option key={t.post_id || t.id} value={t.post_id || t.id}>
                    {t.message ? t.message.slice(0, 30) : 'Visual Broadcast'} ({t.post_id || t.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTaskDetails ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Selected Post Task</span>
                  <h3 className="text-lg font-bold text-white">{selectedTaskDetails.message || 'Media Broadcast'}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
                    {selectedTaskDetails.sent_count || 0} Sent
                  </span>
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold">
                    {selectedTaskDetails.failed_count || 0} Failed
                  </span>
                </div>
              </div>

              {/* Group-by-group Delivery Table */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Per-Group Delivery Outcomes
                </span>

                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Group Profile & Name</th>
                        <th className="p-3.5">Current Status</th>
                        <th className="p-3.5">Scheduled Time</th>
                        <th className="p-3.5">Actual Attempt</th>
                        <th className="p-3.5">Confirmation / Error Reason</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/50">
                      {(selectedTaskDetails.group_deliveries && selectedTaskDetails.group_deliveries.length > 0) ? (
                        selectedTaskDetails.group_deliveries.map((del) => {
                          const statusUpper = (del.status || 'PENDING').toUpperCase();
                          return (
                            <tr key={del.group_id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="p-3.5 font-bold text-white flex items-center gap-2.5">
                                {del.group_icon ? (
                                  <img src={del.group_icon} alt="" className="w-7 h-7 rounded-full object-cover" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs">👥</div>
                                )}
                                <div>
                                  <span className="block truncate max-w-xs">{del.group_name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{del.group_id}</span>
                                </div>
                              </td>
                              <td className="p-3.5">
                                {statusUpper === 'SENT' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <Check className="w-3 h-3" /> SENT
                                  </span>
                                ) : statusUpper === 'SENDING' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" /> SENDING
                                  </span>
                                ) : statusUpper === 'RETRYING' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-orange-500/20 text-orange-400 border border-orange-500/40 animate-pulse">
                                    <RotateCcw className="w-3 h-3 animate-spin" /> RETRYING
                                  </span>
                                ) : statusUpper === 'FAILED' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                    <XCircle className="w-3 h-3" /> FAILED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                    <Clock className="w-3 h-3" /> PENDING
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 font-mono text-slate-300">
                                {del.scheduled_time ? (
                                  new Date(del.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                ) : (
                                  selectedTaskDetails.start_time || 'Scheduled'
                                )}
                              </td>
                              <td className="p-3.5 font-mono text-slate-300">
                                {del.sent_time ? (
                                  new Date(del.sent_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                ) : del.last_attempt_time ? (
                                  new Date(del.last_attempt_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="p-3.5 text-slate-300 text-[11px]">
                                {del.deletion_status === 'DELETED' ? (
                                  <span className="text-rose-400 font-bold">Deleted on WhatsApp</span>
                                ) : statusUpper === 'SENT' ? (
                                  del.message_id ? (
                                    <span className="text-emerald-400 font-mono">ID: {del.message_id.slice(0, 16)}</span>
                                  ) : (
                                    <span className="text-emerald-400 font-bold">Delivery Confirmed</span>
                                  )
                                ) : statusUpper === 'FAILED' ? (
                                  <span className="text-rose-400 font-medium">{del.error || 'Delivery attempt failed'}</span>
                                ) : statusUpper === 'RETRYING' ? (
                                  <span className="text-orange-400 font-medium">{del.error ? `Retry in progress (${del.error})` : 'Retrying delivery...'}</span>
                                ) : statusUpper === 'SENDING' ? (
                                  <span className="text-blue-400 font-medium animate-pulse">Dispatching via WhatsApp...</span>
                                ) : (
                                  <span className="text-amber-400/80 font-medium">Awaiting sequential queue</span>
                                )}
                              </td>
                              <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                                {(statusUpper === 'FAILED' || statusUpper === 'RETRYING') && (
                                  <button
                                    onClick={() => handleRetryTaskGroup(selectedTaskDetails.post_id || selectedTaskDetails.id, del.group_id)}
                                    className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white rounded-lg text-[11px] font-bold border border-cyan-500/30 transition-all inline-flex items-center gap-1"
                                    title="Retry sending to this group"
                                  >
                                    <RotateCcw className="w-3 h-3" /> Retry Group
                                  </button>
                                )}
                                {statusUpper === 'SENT' && del.deletion_status !== 'DELETED' && (
                                  <button
                                    onClick={() => handleDeleteSingleGroupSentPost(selectedTaskDetails.post_id || selectedTaskDetails.id, del.group_id)}
                                    className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-[11px] font-bold border border-rose-500/30 transition-all"
                                  >
                                    Delete Sent Msg
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-500">
                            No per-group delivery records found for this post task.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
              No task selected. Create a post schedule first.
            </div>
          )}
        </div>
      )}

      {/* --- TAB: PER DAY HISTORY --- */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                <History className="w-6 h-6 text-emerald-400" />
                Per Day History & Delivery Ledger
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Complete daily WhatsApp posting history, verified delivery confirmations, and group error diagnostics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchStatusAndData(false)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                Refresh History
              </button>
              <button
                onClick={() => handleClearCompletedTasks()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 inline-flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                Clear Completed Logs
              </button>
            </div>
          </div>

          {/* Daily Totals Cards */}
          {(() => {
            const allUnifiedLogs: HistoricalLog[] = [];
            // Combine history logs and current active task logs
            for (const log of historyLogs) {
              allUnifiedLogs.push(log);
            }
            for (const t of tasks) {
              if (t.logs && Array.isArray(t.logs)) {
                for (const l of t.logs) {
                  const exists = allUnifiedLogs.some(ul => ul.group_jid === l.group_jid && ul.sent_at === l.sent_at);
                  if (!exists) {
                    allUnifiedLogs.push({
                      ...l,
                      task_id: t.post_id || t.id,
                      order_id: t.order_id || `#ORD-${(t.post_id || t.id).replace(/^(auto_task_|task_)/, '').slice(0, 7).toUpperCase()}`,
                      tool_name: t.tool_name || t.head_name || t.image_alt_text || 'Auto Marketing Post',
                      post_caption: t.message || '[Image Broadcast]',
                      image_url: t.image_url,
                      scheduled_time: t.start_time || t.schedule_time
                    });
                  }
                }
              }
            }

            // Extract unique dates
            const uniqueDates = Array.from(new Set(allUnifiedLogs.map(l => {
              try {
                return new Date(l.sent_at).toISOString().slice(0, 10);
              } catch (_) {
                return 'Recent';
              }
            }))).sort().reverse();

            // Filter by date
            const filteredByDate = historyDateFilter === 'ALL'
              ? allUnifiedLogs
              : allUnifiedLogs.filter(l => {
                try {
                  return new Date(l.sent_at).toISOString().slice(0, 10) === historyDateFilter;
                } catch (_) {
                  return true;
                }
              });

            // Filter by status
            const filteredByStatus = historyStatusFilter === 'ALL'
              ? filteredByDate
              : filteredByDate.filter(l => l.status === historyStatusFilter);

            // Filter by group search
            const finalLogs = historyGroupFilter.trim() === ''
              ? filteredByStatus
              : filteredByStatus.filter(l =>
                (l.group_name && l.group_name.toLowerCase().includes(historyGroupFilter.toLowerCase())) ||
                (l.tool_name && l.tool_name.toLowerCase().includes(historyGroupFilter.toLowerCase())) ||
                (l.order_id && l.order_id.toLowerCase().includes(historyGroupFilter.toLowerCase()))
              );

            const totalScheduled = finalLogs.length;
            const totalSent = finalLogs.filter(l => l.status === 'SENT').length;
            const totalPending = finalLogs.filter(l => l.status === 'PENDING').length;
            const totalFailed = finalLogs.filter(l => l.status === 'FAILED').length;

            return (
              <div className="space-y-5">
                {/* 4 Summary Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Total Records</span>
                      <Calendar className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">{totalScheduled}</div>
                    <span className="text-[11px] text-slate-500 font-mono">Dispatches tracked</span>
                  </div>

                  <div className="bg-[#072419]/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ✓ SEND (Delivered)
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
                    </div>
                    <div className="text-2xl font-black text-emerald-300 mt-2">{totalSent}</div>
                    <span className="text-[11px] text-emerald-400/70 font-mono">Confirmed WhatsApp deliveries</span>
                  </div>

                  <div className="bg-[#282108]/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        ◷ PENDING
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm" />
                    </div>
                    <div className="text-2xl font-black text-amber-300 mt-2">{totalPending}</div>
                    <span className="text-[11px] text-amber-400/70 font-mono">Queued / Awaiting confirmation</span>
                  </div>

                  <div className="bg-[#290e15]/90 border border-rose-500/30 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        ✕ FAILED
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm" />
                    </div>
                    <div className="text-2xl font-black text-rose-300 mt-2">{totalFailed}</div>
                    <span className="text-[11px] text-rose-400/70 font-mono">Failed dispatches</span>
                  </div>
                </div>

                {/* Filter Toolbar */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Date Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <select
                        value={historyDateFilter}
                        onChange={(e) => setHistoryDateFilter(e.target.value)}
                        className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                      >
                        <option value="ALL" className="bg-slate-900 text-white">All Dates ({allUnifiedLogs.length})</option>
                        {uniqueDates.map((d) => (
                          <option key={d} value={d} className="bg-slate-900 text-white">
                            📅 {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Status Filter Tabs */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
                      <button
                        onClick={() => setHistoryStatusFilter('ALL')}
                        className={`px-3 py-1 rounded-lg transition-all ${historyStatusFilter === 'ALL'
                          ? 'bg-slate-800 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                          }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter('SENT')}
                        className={`px-3 py-1 rounded-lg inline-flex items-center gap-1 transition-all ${historyStatusFilter === 'SENT'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-emerald-400 hover:text-white'
                          }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        ✓ SEND
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter('PENDING')}
                        className={`px-3 py-1 rounded-lg inline-flex items-center gap-1 transition-all ${historyStatusFilter === 'PENDING'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-amber-400 hover:text-white'
                          }`}
                      >
                        <Clock className="w-3 h-3" />
                        ◷ PENDING
                      </button>
                      <button
                        onClick={() => setHistoryStatusFilter('FAILED')}
                        className={`px-3 py-1 rounded-lg inline-flex items-center gap-1 transition-all ${historyStatusFilter === 'FAILED'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'text-rose-400 hover:text-white'
                          }`}
                      >
                        <X className="w-3 h-3 stroke-[3]" />
                        ✕ FAILED
                      </button>
                    </div>
                  </div>

                  {/* Group Search Filter */}
                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search group or tool..."
                      value={historyGroupFilter}
                      onChange={(e) => setHistoryGroupFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Daily History Table */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                  {finalLogs.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 space-y-2">
                      <History className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                      <p className="text-xs font-semibold">No posting history matches your selected date and filters.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-center border-collapse min-w-[1000px]">
                        <thead>
                          <tr className="bg-slate-950/90 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Date & Scheduled Time</th>
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[150px]">Post Order 🆔 & Tools Name</th>
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Post Image & Caption</th>
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[160px]">WhatsApp Group Name</th>
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Actual Sent Time</th>
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Status</th>
                            <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[200px]">Delivery Result / Failure Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-xs">
                          {finalLogs.map((log, idx) => {
                            let formattedDate = '—';
                            let formattedTime = '—';
                            try {
                              const d = new Date(log.sent_at);
                              if (!isNaN(d.getTime())) {
                                formattedDate = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
                                formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                              }
                            } catch (_) { }

                            const orderIdStr = log.order_id || (log.task_id ? `#ORD-${log.task_id.replace(/^(auto_task_|task_)/, '').slice(0, 7).toUpperCase()}` : '#ORD-AUTO');
                            const toolNameStr = log.tool_name || 'Auto Marketing Post';

                            return (
                              <tr key={idx} className="hover:bg-slate-950/50 transition-colors">
                                {/* 1. Date & Scheduled Time */}
                                <td className="py-3.5 px-4 text-center align-middle">
                                  <div className="font-mono text-slate-300">
                                    <div className="font-bold text-white">{formattedDate}</div>
                                    <div className="text-[11px] text-slate-400">{log.scheduled_time ? formatTime12h(log.scheduled_time) : formattedTime}</div>
                                  </div>
                                </td>

                                {/* 2. Post Order ID & Tools Name */}
                                <td className="py-3.5 px-4 text-center align-middle">
                                  <div className="space-y-1">
                                    <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px] inline-block">
                                      {orderIdStr}
                                    </span>
                                    <div className="font-bold text-white truncate max-w-[140px] mx-auto" title={toolNameStr}>
                                      {toolNameStr}
                                    </div>
                                  </div>
                                </td>

                                {/* 3. Post Image & Caption */}
                                <td className="py-3.5 px-4 text-center align-middle">
                                  <div className="flex items-center justify-center gap-2">
                                    {log.image_url ? (
                                      <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 bg-black shrink-0">
                                        <img src={log.image_url} alt="thumbnail" className="w-full h-full object-cover" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-500 shrink-0">
                                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      </div>
                                    )}
                                    <span className="text-slate-300 truncate max-w-[100px] text-[11px]" title={log.post_caption || ''}>
                                      {log.post_caption || 'No caption'}
                                    </span>
                                  </div>
                                </td>

                                {/* 4. WhatsApp Group Name */}
                                <td className="py-3.5 px-4 text-center align-middle">
                                  <div className="font-bold text-white flex items-center justify-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="truncate max-w-[150px]" title={log.group_name}>
                                      {log.group_name}
                                    </span>
                                  </div>
                                </td>

                                {/* 5. Actual Sent Time */}
                                <td className="py-3.5 px-4 text-center align-middle">
                                  <span className="font-mono text-slate-300 text-[11px] block">
                                    {formattedTime}
                                  </span>
                                </td>

                                {/* 6. Status with Icons & Exact Colors */}
                                <td className="py-3.5 px-4 text-center align-middle">
                                  <div className="inline-flex items-center justify-center">
                                    {log.status === 'SENT' ? (
                                      <div className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#072419] border border-emerald-500/40 text-emerald-400 inline-flex items-center gap-1.5 shadow-sm">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
                                        <span>✓ SEND</span>
                                      </div>
                                    ) : log.status === 'FAILED' ? (
                                      <div className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#290e15] border border-rose-500/40 text-rose-400 inline-flex items-center gap-1.5 shadow-sm">
                                        <X className="w-3.5 h-3.5 text-rose-400 stroke-[3] shrink-0" />
                                        <span>✕ FAILED</span>
                                      </div>
                                    ) : (
                                      <div className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#282108] border border-amber-500/40 text-amber-300 inline-flex items-center gap-1.5 shadow-sm">
                                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <span>◷ PENDING</span>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* 7. Delivery Result / Failure Reason */}
                                <td className="py-3.5 px-4 text-center align-middle">
                                  {log.status === 'FAILED' ? (
                                    <span className="text-rose-400 text-[11px] font-mono bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded block max-w-[220px] mx-auto truncate" title={log.error || 'Send Failed'}>
                                      ⚠️ {log.error || 'Connection / Delivery Error'}
                                    </span>
                                  ) : log.status === 'SENT' ? (
                                    <span className="text-emerald-400 text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded inline-block">
                                      ✓ Delivery Confirmed {log.message_id ? `(${log.message_id.slice(0, 8)})` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 text-[11px] font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded inline-block">
                                      ◷ Queued for execution
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* --- TAB: SETTINGS & HEALTH --- */}
      {activeTab === 'settings' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-purple-400" />
              Auto Sender Cloud Server Settings & Health
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Diagnostic overview of the 24/7 background worker process and socket stability.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Worker Engine</span>
                <p className="text-sm font-bold text-emerald-400">24/7 Persistent Cloud Scheduler</p>
                <span className="text-[11px] text-slate-500">Operates continuously without browser session</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Socket Status</span>
                <p className="text-sm font-bold text-white">{status?.socketStatusMessage || 'Standing by'}</p>
                <span className="text-[11px] text-slate-500">Auto-reconnect active with exponential backoff</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase block">Maintenance Actions</span>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleSyncGroups()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                  Force Group Sync
                </button>
                <button
                  onClick={() => handleClearCompletedTasks()}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-amber-400" />
                  Clean Expired Tasks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: SCHEDULES FILTER VIEW --- */}
      {activeTab === 'schedules' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
                <Calendar className="w-6 h-6 text-emerald-400" />
                Active Auto Post Schedules ({tasks.length})
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Filter and inspect recurring schedules currently registered in the cloud task queue.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
              {(['ALL', 'ACTIVE', 'PAUSED', 'BLOCKED', 'EXPIRED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setScheduleFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${scheduleFilter === st ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredTasks.map(task => (
              <div key={task.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm font-bold text-white">{task.message ? task.message.slice(0, 50) + '...' : 'Media Broadcast'}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${task.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      task.status === 'PAUSED' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                    <span>{task.posts_per_day || 3} posts/day</span>
                    <span>•</span>
                    <span>Interval: {task.calculated_interval || `${task.interval_hours || 3}h`}</span>
                    <span>•</span>
                    <span>Group Delay: {task.group_interval_seconds || 5}s</span>
                    <span>•</span>
                    <span>{task.total_groups || (task.target_group_jids?.length || 0)} groups targeted</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedTaskIdForStatus(task.post_id || task.id);
                      setActiveTab('status-report');
                    }}
                    className="px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Live Status
                  </button>
                  <button
                    onClick={() => handleToggleTaskPause(task.post_id || task.id, task.status)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    {task.status === 'PAUSED' ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    {task.status === 'PAUSED' ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={() => handleRetryTask(task.post_id || task.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    Retry
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.post_id || task.id)}
                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODALS */}
      {/* ======================================================== */}

      {/* MODAL: DELETE GROUP (CONFIRMATION WITH CLEAR CHOICES) */}
      {groupToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete / Manage Group</h3>
                  <p className="text-xs text-slate-400 font-mono truncate max-w-xs">{groupToDelete.name}</p>
                </div>
              </div>
              <button onClick={() => setGroupToDelete(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Select Supported Operation:
              </span>

              <label className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${deleteGroupAction === 'REMOVE_FROM_DASHBOARD' ? 'bg-slate-950 border-emerald-500/50 text-emerald-200' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                <input
                  type="radio"
                  name="groupDeleteAction"
                  checked={deleteGroupAction === 'REMOVE_FROM_DASHBOARD'}
                  onChange={() => setDeleteGroupAction('REMOVE_FROM_DASHBOARD')}
                  className="mt-1"
                />
                <div>
                  <span className="text-xs font-bold text-white block">Remove from Website Dashboard List</span>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Your connected WhatsApp account remains in the group on WhatsApp. It is only hidden from the dashboard and removed from upcoming schedules.
                  </p>
                </div>
              </label>

              <label className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${deleteGroupAction === 'LEAVE_WHATSAPP_GROUP' ? 'bg-rose-950/30 border-rose-500/50 text-rose-200' : 'bg-slate-950/40 border-slate-800 text-slate-400'
                }`}>
                <input
                  type="radio"
                  name="groupDeleteAction"
                  checked={deleteGroupAction === 'LEAVE_WHATSAPP_GROUP'}
                  onChange={() => setDeleteGroupAction('LEAVE_WHATSAPP_GROUP')}
                  className="mt-1"
                />
                <div>
                  <span className="text-xs font-bold text-rose-300 block">Leave WhatsApp Group on WhatsApp</span>
                  <p className="text-[11px] text-rose-400/80 mt-1">
                    Calls WhatsApp API to exit the group permanently from your connected number.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setGroupToDelete(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteGroup}
                disabled={isDeletingGroup}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingGroup ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Confirm Group Action
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ALL SENT POSTS CONFIRMATION */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 text-xl font-bold">
                  🗑️
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete All Sent WhatsApp Posts</h3>
                  <p className="text-xs text-slate-400">Attempt WhatsApp message revocation across all recipient groups</p>
                </div>
              </div>
              <button onClick={() => setIsDeleteAllModalOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              This operation will query all stored delivery logs for your connected account and send deletion commands for every sent WhatsApp post. Future schedules can also be paused.
            </p>

            <label className="flex items-center gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={cancelFutureOnDelete}
                onChange={(e) => setCancelFutureOnDelete(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 bg-slate-900 border-slate-700"
              />
              <span className="text-xs font-bold text-slate-200">
                Cancel future recurring schedules to prevent resending deleted content
              </span>
            </label>

            {deleteSentResults && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
                <span className="font-bold text-white block">Deletion Outcome Report:</span>
                <p className="text-emerald-400">✓ Successfully revoked: {deleteSentResults.totalDeleted} messages</p>
                <p className="text-rose-400">✗ Failed / Unsupported: {deleteSentResults.totalFailed} messages</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
              >
                Close
              </button>
              <button
                onClick={handleDeleteAllSentPosts}
                disabled={isDeletingSentPosts}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isDeletingSentPosts ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeletingSentPosts ? 'Deleting from Groups...' : 'Execute Deletion on WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIVE PREVIEW TRUSTED POST */}
      {isPreviewTrustedModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Live Broadcast Preview</h3>
              </div>
              <button onClick={() => setIsPreviewTrustedModalOpen(false)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed text-slate-200">
              {`🛡️ *VERIFIED TRUSTED RECOMMENDATION & POST* 🛡️
━━━━━━━━━━━━━━━━━━━━━━
🏢 *Entity / Business / Name:* ${trustedName || '[Entity Name]'}
📞 *Contact / Info:* ${trustedContact || '[Contact Information]'}
📌 *Subject:* ${trustedTitle || '[Title]'}

📝 *Details & Endorsement:*
${trustedDescription || '[Description will appear here]'}
━━━━━━━━━━━━━━━━━━━━━━
✅ *Authenticity Verified & Dispatched via Mujahid Digital Zone Portal*`}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsPreviewTrustedModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCAM REPORT SENT MESSAGE DELETION */}
      {scamReportForDeletion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Delete Scam Alert from Groups</h3>
              </div>
              <button onClick={() => setScamReportForDeletion(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              Attempt to recall and revoke sent scam alert messages for "{scamReportForDeletion.title}" across all recipient groups on WhatsApp.
            </p>

            {scamDeletionResults && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 max-h-44 overflow-y-auto font-mono">
                <span className="font-bold text-white block">Group Revocation Log:</span>
                {scamDeletionResults.results.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 truncate max-w-xs">{r.group_name}</span>
                    <span className={`font-bold ${r.status === 'DELETED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setScamReportForDeletion(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={handleDeleteScamReportSentPosts}
                disabled={isDeletingScamMessages}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isDeletingScamMessages ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeletingScamMessages ? 'Revoking...' : 'Revoke on WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRUSTED POST SENT MESSAGE DELETION */}
      {trustedPostForDeletion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-rose-400">
                <Trash2 className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">Delete Trusted Post Messages</h3>
              </div>
              <button onClick={() => setTrustedPostForDeletion(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              Attempt to delete previously broadcast messages for "{trustedPostForDeletion.title}" from WhatsApp recipient groups.
            </p>

            {trustedDeletionResults && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 max-h-44 overflow-y-auto font-mono">
                <span className="font-bold text-white block">Group Revocation Log:</span>
                {trustedDeletionResults.results.map((r, i) => (
                  <div key={i} className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-300 truncate max-w-xs">{r.group_name}</span>
                    <span className={`font-bold ${r.status === 'DELETED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setTrustedPostForDeletion(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={handleDeleteTrustedPostSentMessages}
                disabled={isDeletingTrustedMessages}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isDeletingTrustedMessages ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeletingTrustedMessages ? 'Revoking...' : 'Revoke on WhatsApp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIVE GROUP MEMBERS LIST */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                {selectedGroupForMembers.icon_url ? (
                  <img src={selectedGroupForMembers.icon_url} alt="" className="w-10 h-10 rounded-2xl object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xl">👥</div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedGroupForMembers.name}</h3>
                  <span className="text-xs text-slate-400 font-mono">{liveGroupMembers.length} live members loaded</span>
                </div>
              </div>
              <button onClick={() => setSelectedGroupForMembers(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search member name or phone..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleExportMemberNumbers(selectedGroupForMembers)}
                disabled={exportingGroupId === selectedGroupForMembers.jid}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-md disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Export (.xlsx)
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {loadingMembers ? (
                <div className="text-center py-8 space-y-2 text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                  <span>Loading live group member records...</span>
                </div>
              ) : liveGroupMembers.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No member records loaded for this group.</p>
              ) : (
                liveGroupMembers
                  .filter(m => (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) || (m.phone || '').includes(memberSearch))
                  .map((mem, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-300 font-bold">
                          {mem.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{mem.name}</span>
                          <span className="text-[11px] font-mono text-emerald-400">{mem.phone}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${mem.role === 'Owner' ? 'bg-purple-500/20 text-purple-300' :
                        mem.role === 'Admin' ? 'bg-cyan-500/20 text-cyan-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                        {mem.role}
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedGroupForMembers(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE SCHEDULE */}
      {scheduleModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Change Posting Schedule</h3>
              </div>
              <button onClick={() => setScheduleModalTask(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Posts Per Day</label>
                <select
                  value={newPostsPerDay}
                  onChange={(e) => setNewPostsPerDay(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value={1}>1 Post Daily</option>
                  <option value={2}>2 Posts Daily</option>
                  <option value={3}>3 Posts Daily</option>
                  <option value={4}>4 Posts Daily</option>
                  <option value={5}>5 Posts Daily</option>
                  <option value={6}>6 Posts Daily</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Interval Hours</label>
                <select
                  value={newIntervalHours}
                  onChange={(e) => setNewIntervalHours(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value={1}>Every 1 Hour</option>
                  <option value={2}>Every 2 Hours</option>
                  <option value={3}>Every 3 Hours</option>
                  <option value={4}>Every 4 Hours</option>
                  <option value={6}>Every 6 Hours</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase">Next Execution Time</label>
                <input
                  type="datetime-local"
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setScheduleModalTask(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScheduleChange}
                disabled={isSavingSchedule}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingSchedule ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCAM REPORT GROUP-WISE DELIVERY DETAILS */}
      {selectedScamReportForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedScamReportForDetails.title}</h3>
                  <span className="text-xs text-rose-400 font-mono font-bold">
                    Reported Number: {selectedScamReportForDetails.reported_number}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedScamReportForDetails(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Status:</span>
                <span className="font-bold text-white">{selectedScamReportForDetails.status}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Sent / Failed:</span>
                <span className="text-emerald-400 font-bold">{selectedScamReportForDetails.sent_count || 0}</span> / <span className="text-rose-400 font-bold">{selectedScamReportForDetails.failed_count || 0}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Groups:</span>
                <span className="text-white font-bold">{selectedScamReportForDetails.target_group_jids?.length || 0} groups</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Created Date:</span>
                <span className="text-slate-300 font-mono text-[11px]">{new Date(selectedScamReportForDetails.created_at).toLocaleString()}</span>
              </div>
            </div>

            {selectedScamReportForDetails.description && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Incident Description:</span>
                <p className="text-slate-200 whitespace-pre-wrap">{selectedScamReportForDetails.description}</p>
              </div>
            )}

            {/* Group-Wise Delivery Status Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Group Delivery Status Breakdown ({selectedScamReportForDetails.group_deliveries?.length || selectedScamReportForDetails.target_group_jids?.length || 0} Groups)
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 sticky top-0 z-10 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Target Group</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Message ID / Revocation</th>
                      <th className="p-3">Sent At / Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {selectedScamReportForDetails.target_group_jids?.map((jid) => {
                      const delivery = selectedScamReportForDetails.group_deliveries?.find(d => d.group_id === jid);
                      const grpObj = groups.find(g => g.jid === jid);
                      const groupName = delivery?.group_name || grpObj?.name || jid;
                      const status = (delivery?.status || (selectedScamReportForDetails.status === 'SENT' ? 'SENT' : 'PENDING')) as string;
                      const timeVal = delivery?.sent_at || delivery?.sent_time;

                      return (
                        <tr key={jid} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">
                            <div>{groupName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{jid}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status === 'SENT' ? 'bg-emerald-500/20 text-emerald-300' :
                              status === 'FAILED' ? 'bg-rose-500/20 text-rose-300' :
                                status === 'DELETED' ? 'bg-purple-500/20 text-purple-300' :
                                  'bg-amber-500/20 text-amber-300'
                              }`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                            {delivery?.message_id ? (
                              <span className="text-emerald-400/90" title={delivery.message_id}>{delivery.message_id.slice(0, 16)}...</span>
                            ) : (
                              <span className="text-slate-600">Pending Broadcast</span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-slate-400">
                            {delivery?.error ? (
                              <span className="text-rose-400">{delivery.error}</span>
                            ) : timeVal ? (
                              new Date(timeVal).toLocaleTimeString()
                            ) : (
                              '--'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedScamReportForDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRetryScamReport(selectedScamReportForDetails.id);
                  setSelectedScamReportForDetails(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Retry Failed Groups
              </button>
              <button
                onClick={() => {
                  setScamReportForDeletion(selectedScamReportForDetails);
                  setSelectedScamReportForDetails(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Sent Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRUSTED POST GROUP-WISE DELIVERY DETAILS */}
      {selectedTrustedPostForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTrustedPostForDetails.title}</h3>
                  <span className="text-xs text-indigo-400 font-bold">
                    Trusted Entity: {selectedTrustedPostForDetails.trusted_name}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedTrustedPostForDetails(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Status:</span>
                <span className="font-bold text-white">{selectedTrustedPostForDetails.status}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Sent / Failed:</span>
                <span className="text-emerald-400 font-bold">{selectedTrustedPostForDetails.sent_count || 0}</span> / <span className="text-rose-400 font-bold">{selectedTrustedPostForDetails.failed_count || 0}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact / Website:</span>
                <span className="text-slate-300 font-mono text-[11px] truncate block">{selectedTrustedPostForDetails.contact_info || 'N/A'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Schedule Mode:</span>
                <span className="text-indigo-300 font-bold">{selectedTrustedPostForDetails.schedule_mode || 'IMMEDIATE'}</span>
              </div>
            </div>

            {selectedTrustedPostForDetails.description && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Endorsement Description:</span>
                <p className="text-slate-200 whitespace-pre-wrap">{selectedTrustedPostForDetails.description}</p>
              </div>
            )}

            {/* Group-Wise Delivery Status Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Target Group Delivery Status Breakdown ({selectedTrustedPostForDetails.group_deliveries?.length || selectedTrustedPostForDetails.target_group_jids?.length || 0} Groups)
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 sticky top-0 z-10 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="p-3">Target Group</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Message ID / Revocation</th>
                      <th className="p-3">Sent At / Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {selectedTrustedPostForDetails.target_group_jids?.map((jid) => {
                      const delivery = selectedTrustedPostForDetails.group_deliveries?.find(d => d.group_id === jid);
                      const grpObj = groups.find(g => g.jid === jid);
                      const groupName = delivery?.group_name || grpObj?.name || jid;
                      const status = (delivery?.status || ((selectedTrustedPostForDetails.status as string) === 'COMPLETED' ? 'SENT' : 'PENDING')) as string;
                      const timeVal = delivery?.sent_at || delivery?.sent_time;

                      return (
                        <tr key={jid} className="hover:bg-slate-800/40">
                          <td className="p-3 font-semibold text-white">
                            <div>{groupName}</div>
                            <div className="text-[10px] font-mono text-slate-500">{jid}</div>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${status === 'SENT' ? 'bg-emerald-500/20 text-emerald-300' :
                              status === 'FAILED' ? 'bg-rose-500/20 text-rose-300' :
                                status === 'DELETED' ? 'bg-purple-500/20 text-purple-300' :
                                  'bg-amber-500/20 text-amber-300'
                              }`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                            {delivery?.message_id ? (
                              <span className="text-emerald-400/90" title={delivery.message_id}>{delivery.message_id.slice(0, 16)}...</span>
                            ) : (
                              <span className="text-slate-600">Pending Broadcast</span>
                            )}
                          </td>
                          <td className="p-3 text-[11px] text-slate-400">
                            {delivery?.error ? (
                              <span className="text-rose-400">{delivery.error}</span>
                            ) : timeVal ? (
                              new Date(timeVal).toLocaleTimeString()
                            ) : (
                              '--'
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedTrustedPostForDetails(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRetryTrustedPost(selectedTrustedPostForDetails.id);
                  setSelectedTrustedPostForDetails(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Retry Failed Groups
              </button>
              <button
                onClick={() => {
                  setTrustedPostForDeletion(selectedTrustedPostForDetails);
                  setSelectedTrustedPostForDetails(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Sent Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE RECORD CONFIRMATION (DATABASE RECORD) */}
      {deleteRecordModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Delete Post Record</h3>
                  <p className="text-xs text-rose-400 font-bold truncate max-w-[240px]">
                    {deleteRecordModalTask.tool_name || deleteRecordModalTask.head_name || 'Post Record'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteRecordModalTask(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order ID:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    {deleteRecordModalTask.order_id || `#ORD-${String(deleteRecordModalTask.post_id || deleteRecordModalTask.id || '').replace(/^(auto_task_|task_)/, '').slice(0, 7).toUpperCase()}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Groups:</span>
                  <span className="font-bold text-white">
                    {deleteRecordModalTask.total_groups || deleteRecordModalTask.selected_group_ids?.length || deleteRecordModalTask.target_group_jids?.length || 0}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Are you sure you want to permanently delete this scheduled post from database? (Sent messages on WhatsApp recipient groups will remain untouched).
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteRecordModalTask(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingRecord}
                onClick={async () => {
                  setIsDeletingRecord(true);
                  const tId = deleteRecordModalTask.post_id || deleteRecordModalTask.id;
                  try {
                    await handleDeleteTask(tId);
                  } finally {
                    setIsDeletingRecord(false);
                  }
                }}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingRecord ? 'Deleting...' : 'Confirm Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE SENT POST FROM WHATSAPP GROUPS (TASK LEVEL) */}
      {deleteSentPostModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Delete Sent Post from WhatsApp Groups</h3>
                  <p className="text-xs text-rose-300 font-bold">
                    {deleteSentPostModalTask.message ? deleteSentPostModalTask.message.split('\n')[0].slice(0, 45) : `Auto Post — #${deleteSentPostModalTask.post_id || deleteSentPostModalTask.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDeleteSentPostModalTask(null);
                  setDeleteSentResults(null);
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold">Post ID:</span>
                <span className="font-mono text-emerald-400">#{deleteSentPostModalTask.post_id || deleteSentPostModalTask.id}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold">Sent Deliveries:</span>
                <span className="font-bold text-emerald-400">{deleteSentPostModalTask.sent_count || 0} groups</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold">Target Groups:</span>
                <span className="font-bold text-indigo-400">{deleteSentPostModalTask.total_groups || deleteSentPostModalTask.target_group_jids?.length || 0} total</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Target Groups with Sent Messages:
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                {deleteSentPostModalTask.group_deliveries && deleteSentPostModalTask.group_deliveries.filter(d => d.status === 'SENT').length > 0 ? (
                  deleteSentPostModalTask.group_deliveries.filter(d => d.status === 'SENT').map(d => (
                    <div key={d.group_id} className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="font-bold text-white truncate max-w-[200px]">{d.group_name || d.group_id}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">Message ID: {d.message_id ? `${d.message_id.slice(0, 12)}...` : 'Recorded'}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-xs text-center py-2">No confirmed sent deliveries found to delete.</p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={cancelFutureOnDelete}
                onChange={(e) => setCancelFutureOnDelete(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 border-slate-700 bg-slate-900 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Also pause and cancel future scheduled repetitions for this post</span>
            </label>

            {deleteSentResults && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <h4 className="font-bold text-emerald-400">Deletion Summary:</h4>
                <p className="text-slate-300">
                  Successfully deleted: <strong className="text-emerald-400">{deleteSentResults.totalDeleted || 0}</strong> • Failed: <strong className="text-rose-400">{deleteSentResults.totalFailed || 0}</strong>
                </p>
                {deleteSentResults.results && deleteSentResults.results.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1">
                    {deleteSentResults.results.map((r, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 bg-slate-900 rounded-lg">
                        <span className="truncate max-w-[200px] text-slate-300">{r.group_name || r.group_id}</span>
                        <span className={`px-2 py-0.5 rounded font-bold ${r.status === 'DELETED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {r.status} {r.error ? `(${r.error})` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setDeleteSentPostModalTask(null);
                  setDeleteSentResults(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={handleDeleteTaskSentPosts}
                disabled={isDeletingSentPosts}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingSentPosts ? 'Deleting from Groups...' : 'Confirm Delete on WhatsApp'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT AUTO POST SCHEDULE */}
      {scheduleModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Edit Post Schedule</h3>
                  <p className="text-xs text-purple-300 font-bold">
                    {scheduleModalTask.message ? scheduleModalTask.message.split('\n')[0].slice(0, 40) : `Post #${scheduleModalTask.post_id || scheduleModalTask.id}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScheduleModalTask(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-bold uppercase block mb-1">Start Datetime</label>
                <input
                  type="datetime-local"
                  value={newScheduleTime}
                  onChange={(e) => setNewScheduleTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-bold uppercase block mb-1">Posts Per Day</label>
                  <select
                    value={newPostsPerDay}
                    onChange={(e) => setNewPostsPerDay(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
                      <option key={n} value={n}>{n} times / day</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold uppercase block mb-1">Interval in Hours</label>
                  <select
                    value={newIntervalHours}
                    onChange={(e) => setNewIntervalHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    {[1, 2, 3, 4, 6, 8, 12].map(n => (
                      <option key={n} value={n}>{n} hours</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold uppercase block mb-1">Active Duration</label>
                <select
                  value={newValidityDuration}
                  onChange={(e) => setNewValidityDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="1_month">1 Month</option>
                  <option value="2_months">2 Months</option>
                  <option value="3_months">3 Months</option>
                  <option value="4_months">4 Months</option>
                  <option value="5_months">5 Months</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setScheduleModalTask(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScheduleFromModal}
                disabled={isSavingSchedule}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{isSavingSchedule ? 'Saving...' : 'Save Schedule'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE ALL SENT POSTS */}
      {isDeleteAllModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Delete All Sent Messages</h3>
                  <p className="text-xs text-rose-300">Revoke sent messages across all WhatsApp recipient groups</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This will send revocation commands for all confirmed sent Auto Posts across recipient WhatsApp groups where supported.
            </p>

            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={cancelFutureOnDelete}
                onChange={(e) => setCancelFutureOnDelete(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 border-slate-700 bg-slate-900 focus:ring-0"
              />
              <span className="text-slate-300 font-medium">Also pause all active schedules</span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsDeleteAllModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await handleDeleteAllSentPosts();
                  setIsDeleteAllModalOpen(false);
                }}
                disabled={isDeletingSentPosts}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingSentPosts ? 'Deleting...' : 'Delete All Sent Messages'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE PER DAY HISTORY DASHBOARD */}
      {selectedPostForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-5xl w-full shadow-2xl space-y-5 my-6 max-h-[92vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-white">Complete Per Day History Dashboard</h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-bold">
                      {selectedPostForHistory.order_id || `#ORD-${String(selectedPostForHistory.post_id || selectedPostForHistory.id || '').replace(/^(auto_task_|task_)/, '').slice(0, 7).toUpperCase()}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Daily posting ledger & per-group delivery results</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {liveDateStr}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPostForHistory(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daily History Content */}
            {(() => {
              // Gather all posts history or selected post history
              const allPostsToDisplay = tasks.filter(t => {
                if (selectedTaskIdForStatus && selectedTaskIdForStatus !== 'ALL') {
                  // If filtering by specific task
                  return String(t.post_id || t.id || '') === String(selectedPostForHistory.post_id || selectedPostForHistory.id || '');
                }
                return true;
              });

              // Also calculate daily metric summaries across tasks
              let dayTotalPosts = 0;
              let dayTotalGroups = 0;
              let dayTotalSent = 0;
              let dayTotalPending = 0;
              let dayTotalFailed = 0;

              const postCardsData = tasks.map(t => {
                const currentTaskId = String(t.post_id || t.id || '');
                const orderIdDisplay = t.order_id || `#ORD-${currentTaskId.replace(/^(auto_task_|task_)/, '').slice(0, 7).toUpperCase()}`;
                const toolNameDisplay = t.tool_name || t.head_name || t.image_alt_text || 'Auto Marketing Post';

                const groupIds = t.selected_group_ids && t.selected_group_ids.length ? t.selected_group_ids : t.target_group_jids || [];
                const groupNames = t.selected_group_names && t.selected_group_names.length ? t.selected_group_names : t.target_group_names || [];

                const postGroupRecords = groupIds.map((jid, idx) => {
                  const foundGroup = (groups || []).find(g => g.jid === jid);
                  const delivery = (t.group_deliveries || []).find(d => d.group_id === jid);
                  const log = (t.logs || []).find(l => l.group_jid === jid) || (historyLogs || []).find(l => l.task_id === currentTaskId && l.group_jid === jid);

                  const status: 'SENT' | 'PENDING' | 'FAILED' =
                    delivery?.status === 'SENT' || log?.status === 'SENT' ? 'SENT' :
                      delivery?.status === 'FAILED' || log?.status === 'FAILED' ? 'FAILED' :
                        'PENDING';

                  return {
                    group_id: jid,
                    group_name: foundGroup?.name || delivery?.group_name || groupNames[idx] || jid,
                    group_icon: foundGroup?.icon_url || delivery?.group_icon || null,
                    status,
                    sent_time: delivery?.sent_time || log?.sent_at,
                    scheduled_time: delivery?.scheduled_time || t.start_time || t.schedule_time,
                    error: delivery?.error || log?.error,
                    message_id: delivery?.message_id || log?.message_id,
                    image_url: t.image_url,
                    caption: t.message
                  };
                });

                const sentCount = postGroupRecords.filter(g => g.status === 'SENT').length;
                const failedCount = postGroupRecords.filter(g => g.status === 'FAILED').length;
                const pendingCount = postGroupRecords.filter(g => g.status === 'PENDING').length;

                let finalStatus = 'PENDING';
                if (t.status === 'PAUSED') {
                  finalStatus = 'PAUSED';
                } else if (t.status === 'SENDING' || t.status === 'EXECUTING') {
                  finalStatus = 'SENDING';
                } else if (postGroupRecords.length > 0 && sentCount === postGroupRecords.length && failedCount === 0) {
                  finalStatus = 'SENT';
                } else if (failedCount > 0 && sentCount === 0) {
                  finalStatus = 'FAILED';
                } else if (sentCount > 0 && failedCount > 0) {
                  finalStatus = 'PARTIALLY_COMPLETED';
                }

                dayTotalPosts++;
                dayTotalGroups += postGroupRecords.length;
                dayTotalSent += sentCount;
                dayTotalPending += pendingCount;
                dayTotalFailed += failedCount;

                const createdDate = t.created_at ? new Date(t.created_at).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

                return {
                  task: t,
                  task_id: currentTaskId,
                  order_id: orderIdDisplay,
                  tool_name: toolNameDisplay,
                  image_url: t.image_url,
                  message: t.message || '',
                  start_time: t.start_time || '09:00',
                  schedule_time: t.schedule_time || '',
                  scheduled_date: t.start_date || createdDate,
                  last_posting_time: t.last_posting_time,
                  total_groups: postGroupRecords.length,
                  sent_count: sentCount,
                  pending_count: pendingCount,
                  failed_count: failedCount,
                  final_status: finalStatus,
                  groups: postGroupRecords
                };
              });

              // Filter by status if set
              const filteredPosts = postCardsData.filter(p => {
                if (historyStatusFilter === 'ALL') return true;
                if (historyStatusFilter === 'SENT') return p.final_status === 'SENT' || p.sent_count > 0;
                if (historyStatusFilter === 'FAILED') return p.final_status === 'FAILED' || p.failed_count > 0;
                if (historyStatusFilter === 'PENDING') return p.final_status === 'PENDING' || p.pending_count > 0;
                return true;
              });

              return (
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  {/* Daily Metric Counters Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center shadow-md">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Daily Posts Scheduled</span>
                      <span className="text-xl font-black text-white">{dayTotalPosts} Posts ({dayTotalGroups} Groups)</span>
                    </div>

                    <div className="bg-[#072419] p-3 rounded-2xl border border-emerald-500/30 text-center shadow-md">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ✓ SEND (Delivered)
                      </span>
                      <span className="text-xl font-black text-emerald-300">{dayTotalSent}</span>
                    </div>

                    <div className="bg-[#282108] p-3 rounded-2xl border border-amber-500/30 text-center shadow-md">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        ◷ PENDING
                      </span>
                      <span className="text-xl font-black text-amber-300">{dayTotalPending}</span>
                    </div>

                    <div className="bg-[#290e15] p-3 rounded-2xl border border-rose-500/30 text-center shadow-md">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        ✕ FAILED
                      </span>
                      <span className="text-xl font-black text-rose-300">{dayTotalFailed}</span>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-cyan-400" />
                        Filter Status:
                      </span>
                      <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-bold">
                        <button
                          onClick={() => setHistoryStatusFilter('ALL')}
                          className={`px-3 py-1 rounded-lg transition-all ${historyStatusFilter === 'ALL'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                            }`}
                        >
                          All Posts
                        </button>
                        <button
                          onClick={() => setHistoryStatusFilter('SENT')}
                          className={`px-3 py-1 rounded-lg inline-flex items-center gap-1 transition-all ${historyStatusFilter === 'SENT'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-emerald-400 hover:text-white'
                            }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          ✓ SEND
                        </button>
                        <button
                          onClick={() => setHistoryStatusFilter('PENDING')}
                          className={`px-3 py-1 rounded-lg inline-flex items-center gap-1 transition-all ${historyStatusFilter === 'PENDING'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-amber-400 hover:text-white'
                            }`}
                        >
                          <Clock className="w-3 h-3" />
                          ◷ PENDING
                        </button>
                        <button
                          onClick={() => setHistoryStatusFilter('FAILED')}
                          className={`px-3 py-1 rounded-lg inline-flex items-center gap-1 transition-all ${historyStatusFilter === 'FAILED'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'text-rose-400 hover:text-white'
                            }`}
                        >
                          <X className="w-3 h-3 stroke-[3]" />
                          ✕ FAILED
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400 font-mono">
                      Showing {filteredPosts.length} Post Records with individual group deliveries
                    </div>
                  </div>

                  {/* Scrollable Container with Each Post & All Its Groups */}
                  <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin">
                    {filteredPosts.length === 0 ? (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
                        No post records match your active filter.
                      </div>
                    ) : (
                      filteredPosts.map((post) => {
                        const isCurrentSelected = String(selectedPostForHistory.post_id || selectedPostForHistory.id || '') === String(post.task_id || '');

                        return (
                          <div
                            key={post.task_id}
                            className={`rounded-2xl border p-4 sm:p-5 space-y-4 shadow-xl transition-all ${isCurrentSelected
                              ? 'bg-slate-950/90 border-cyan-500/50 ring-1 ring-cyan-500/20'
                              : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                              }`}
                          >
                            {/* Post Header Card */}
                            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-3.5 border-b border-slate-800/70">
                              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                {post.image_url ? (
                                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-700 bg-black shrink-0 shadow-md">
                                    <img src={post.image_url} alt={post.tool_name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-2xl border-2 border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500 shrink-0 shadow-md">
                                    <FileText className="w-6 h-6 text-slate-400" />
                                  </div>
                                )}
                                <div className="space-y-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-md text-xs">
                                      {post.order_id}
                                    </span>
                                    <h4 className="font-bold text-white text-sm truncate">{post.tool_name}</h4>
                                  </div>
                                  <p className="text-xs text-slate-300 max-w-xl line-clamp-1 leading-relaxed">
                                    {post.message || 'No caption text.'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                                    <span>📅 Scheduled: {post.scheduled_date} • {formatTime12h(post.start_time || '09:00')}</span>
                                    <span>•</span>
                                    <span>
                                      ⚡ Actual Sent:{' '}
                                      {post.last_posting_time
                                        ? new Date(post.last_posting_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                        : 'Awaiting scheduled time'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Post Group Delivery Totals & Status */}
                              <div className="flex items-center gap-3 self-end lg:self-center shrink-0 flex-wrap">
                                <div className="text-right text-[11px] font-mono">
                                  <span className="text-slate-400 block font-bold">{post.groups.length} Selected Groups</span>
                                  <span className="text-emerald-400 font-bold">{post.sent_count} Sent</span> •{' '}
                                  <span className="text-amber-400 font-bold">{post.pending_count} Pending</span> •{' '}
                                  <span className="text-rose-400 font-bold">{post.failed_count} Failed</span>
                                </div>

                                <div className="inline-flex items-center">
                                  {post.final_status === 'PAUSED' ? (
                                    <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#282108] border border-amber-500/40 text-amber-300 inline-flex items-center gap-1.5 shadow-sm">
                                      <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                      <span>⏸️ PAUSED</span>
                                    </div>
                                  ) : post.final_status === 'SENT' ? (
                                    <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#072419] border border-emerald-500/40 text-emerald-400 inline-flex items-center gap-1.5 shadow-sm">
                                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
                                      <span>✓ SEND</span>
                                    </div>
                                  ) : post.final_status === 'FAILED' ? (
                                    <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#290e15] border border-rose-500/40 text-rose-400 inline-flex items-center gap-1.5 shadow-sm">
                                      <X className="w-3.5 h-3.5 text-rose-400 stroke-[3] shrink-0" />
                                      <span>✕ FAILED</span>
                                    </div>
                                  ) : post.final_status === 'PARTIALLY_COMPLETED' ? (
                                    <div className="inline-flex items-center gap-1.5">
                                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#072419] border border-emerald-500/40 text-emerald-400 inline-flex items-center gap-1 shadow-sm">
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                        {post.sent_count} SEND
                                      </span>
                                      <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-[#290e15] border border-rose-500/40 text-rose-400 inline-flex items-center gap-1 shadow-sm">
                                        <X className="w-3 h-3 stroke-[2.5]" />
                                        {post.failed_count} FAILED
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold bg-[#282108] border border-amber-500/40 text-amber-300 inline-flex items-center gap-1.5 shadow-sm">
                                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                      <span>◷ PENDING</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Show EVERY group separately under its corresponding post */}
                            <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800/80 bg-slate-900/50">
                              <table className="w-full text-center border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-950/90 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                                    <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[50px]">Group Icon</th>
                                    <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[180px]">WhatsApp Group Name</th>
                                    <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[130px]">Group Status</th>
                                    <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[140px]">Actual Sent Time</th>
                                    <th className="py-2.5 px-3 text-center whitespace-nowrap min-w-[200px]">Delivery Result / Failure Reason</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                  {post.groups.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="py-4 text-center text-slate-500 text-xs">
                                        No recipient WhatsApp groups attached to this post order.
                                      </td>
                                    </tr>
                                  ) : (
                                    post.groups.map((grp, gIdx) => (
                                      <tr key={gIdx} className="hover:bg-slate-950/40 transition-colors">
                                        {/* Group Real Profile Image */}
                                        <td className="py-2.5 px-3 text-center align-middle">
                                          <div className="flex items-center justify-center">
                                            {grp.group_icon ? (
                                              <div className="w-7 h-7 rounded-full overflow-hidden border border-emerald-500/40 bg-slate-950 shadow-sm">
                                                <img src={grp.group_icon} alt={grp.group_name} className="w-full h-full object-cover" />
                                              </div>
                                            ) : (
                                              <div className="w-7 h-7 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 shadow-sm">
                                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                              </div>
                                            )}
                                          </div>
                                        </td>

                                        {/* Actual WhatsApp Group Name */}
                                        <td className="py-2.5 px-3 text-center align-middle">
                                          <span className="font-bold text-white block truncate max-w-[200px] mx-auto" title={grp.group_name}>
                                            {grp.group_name}
                                          </span>
                                        </td>

                                        {/* Group Specific Status: SEND, PENDING, FAILED */}
                                        <td className="py-2.5 px-3 text-center align-middle">
                                          <div className="inline-flex items-center justify-center">
                                            {grp.status === 'SENT' ? (
                                              <div className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#072419] border border-emerald-500/40 text-emerald-400 inline-flex items-center gap-1 shadow-sm">
                                                <Check className="w-3 h-3 text-emerald-400 stroke-[3] shrink-0" />
                                                <span>✓ SEND</span>
                                              </div>
                                            ) : grp.status === 'FAILED' ? (
                                              <div className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#290e15] border border-rose-500/40 text-rose-400 inline-flex items-center gap-1 shadow-sm">
                                                <X className="w-3 h-3 text-rose-400 stroke-[3] shrink-0" />
                                                <span>✕ FAILED</span>
                                              </div>
                                            ) : (
                                              <div className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#282108] border border-amber-500/40 text-amber-300 inline-flex items-center gap-1 shadow-sm">
                                                <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                                                <span>◷ PENDING</span>
                                              </div>
                                            )}
                                          </div>
                                        </td>

                                        {/* Actual Sent Time */}
                                        <td className="py-2.5 px-3 text-center align-middle font-mono text-[11px] text-slate-300">
                                          {grp.sent_time
                                            ? new Date(grp.sent_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                            : (grp.scheduled_time ? formatTime12h(grp.scheduled_time) : 'Pending')}
                                        </td>

                                        {/* Delivery Result / Failure Reason */}
                                        <td className="py-2.5 px-3 text-center align-middle">
                                          {grp.status === 'FAILED' ? (
                                            <span className="text-rose-400 text-[10px] font-mono bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded block max-w-[220px] mx-auto truncate" title={grp.error || 'Send Failed'}>
                                              ⚠️ {grp.error || 'Delivery Error'}
                                            </span>
                                          ) : grp.status === 'SENT' ? (
                                            <span className="text-emerald-400 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded inline-block">
                                              ✓ Delivery Confirmed {grp.message_id ? `(${grp.message_id.slice(0, 8)})` : ''}
                                            </span>
                                          ) : (
                                            <span className="text-amber-400 text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded inline-block">
                                              ◷ Waiting for scheduled time
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Bottom Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                onClick={() => setSelectedPostForHistory(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Close History Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LIVE VIEW POST (WHATSAPP PREVIEW) */}
      {previewModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Live Post Preview</h3>
                  <p className="text-xs text-cyan-300 font-mono">
                    Order ID: {previewModalTask.order_id || `#ORD-${(previewModalTask.post_id || previewModalTask.id).replace(/^(auto_task_|task_)/, '').slice(0, 7).toUpperCase()}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewModalTask(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* WhatsApp Message Preview Bubble */}
            <div className="bg-[#0b141a] rounded-2xl p-4 border border-[#202c33] space-y-3 shadow-inner">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                WhatsApp Message Delivery Preview
              </div>

              {previewModalTask.image_url && (
                <div className="rounded-xl overflow-hidden border border-[#222e35] max-h-64 bg-black flex items-center justify-center">
                  <img
                    src={previewModalTask.image_url}
                    alt={previewModalTask.tool_name || 'Post Image'}
                    className="w-full h-full object-contain max-h-64"
                  />
                </div>
              )}

              <div className="bg-[#1f2c34] text-[#e9edef] rounded-xl p-3.5 space-y-2 text-xs border border-[#2a3942]">
                <div className="font-bold text-white text-sm">
                  *{previewModalTask.tool_name || previewModalTask.head_name || 'Mujahid Digital Zone Auto Post'}*
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
                  {previewModalTask.message || 'No caption text.'}
                </p>
                <div className="text-[10px] text-slate-400 text-right font-mono pt-1">
                  {formatTime12h(previewModalTask.start_time || '09:00')} ✓✓
                </div>
              </div>

              {/* Summary metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-300">
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Target Groups:</span>
                  <strong className="text-white">{previewModalTask.total_groups || (previewModalTask.selected_group_ids?.length || 0)} Groups</strong>
                </div>
                <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Schedule Frequency:</span>
                  <strong className="text-white">{previewModalTask.posts_per_day || 1} posts / day</strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setPreviewModalTask(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Close Preview
              </button>
              <button
                onClick={() => {
                  const t = previewModalTask;
                  setPreviewModalTask(null);
                  handleEditTask(t);
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Post</span>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* ======================================================== */}
      {/* MODAL 1: + NEW STATUS UPLOAD FORM MODAL */}
      {/* ======================================================== */}
      {statusNotifModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                  <UploadCloud className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-xl font-black text-white">Add My Status</h3>
                  <p className="text-xs text-slate-400">
                    Add status content, publish directly to WhatsApp My Status, and tag recipient groups.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusNotifModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback alert */}
            {statusNotifSubmitFeedback && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${statusNotifSubmitFeedback.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                }`}>
                {statusNotifSubmitFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <span>{statusNotifSubmitFeedback.text}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT COLUMN: Content & Media */}
              <div className="space-y-5">
                {/* A. Campaign Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Status Campaign Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={statusNotifName}
                    onChange={(e) => setStatusNotifName(e.target.value)}
                    placeholder="e.g. Weekend Special Promotion"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* B. Content Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Content Type <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusNotifContentType('image')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${statusNotifContentType === 'image'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      <ImageIcon className="w-4 h-4" />
                      Image Status
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusNotifContentType('video')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${statusNotifContentType === 'video'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      <Film className="w-4 h-4" />
                      Video Status
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusNotifContentType('text')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${statusNotifContentType === 'text'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                    >
                      <FileText className="w-4 h-4" />
                      Text Status
                    </button>
                  </div>
                </div>

                {/* C. Image Upload */}
                {statusNotifContentType === 'image' && (
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block">
                      Image Upload (JPG, PNG, WebP)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStatusNotifImageUpload}
                      disabled={isUploadingStatusNotifImage}
                      className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                    />
                    {isUploadingStatusNotifImage && (
                      <p className="text-xs text-cyan-400 animate-pulse font-mono">Uploading image...</p>
                    )}
                    {statusNotifImageUrl && (
                      <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700 max-h-44 bg-slate-950 flex items-center justify-center">
                        <img src={statusNotifImageUrl} alt="Preview" className="max-h-44 object-contain" />
                        <button
                          type="button"
                          onClick={() => {
                            setStatusNotifImageUrl('');
                            setStatusNotifImagePath('');
                            setStatusNotifImageFilename('');
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 text-white text-xs shadow-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* D. Video Upload */}
                {statusNotifContentType === 'video' && (
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block">
                      Video Upload (MP4, MOV &bull; Max 30MB)
                    </label>
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={handleStatusNotifVideoUpload}
                      disabled={isUploadingStatusNotifVideo}
                      className="text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-500 cursor-pointer"
                    />
                    {isUploadingStatusNotifVideo && (
                      <p className="text-xs text-cyan-400 animate-pulse font-mono">Uploading & encoding video...</p>
                    )}
                    {statusNotifVideoUrl && (
                      <div className="mt-2 relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2">
                        <video src={statusNotifVideoUrl} controls className="max-h-40 mx-auto rounded-lg" />
                        <button
                          type="button"
                          onClick={() => {
                            setStatusNotifVideoUrl('');
                            setStatusNotifVideoPath('');
                            setStatusNotifVideoFilename('');
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-lg bg-rose-600 text-white text-xs shadow-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* E. Text Status Content */}
                {statusNotifContentType === 'text' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <label className="text-xs font-bold text-slate-300 block">
                      Status Text Message
                    </label>
                    <textarea
                      rows={3}
                      value={statusNotifText}
                      onChange={(e) => setStatusNotifText(e.target.value)}
                      placeholder="Enter the text to display in WhatsApp My Status..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium resize-none"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">Background Color:</span>
                      {['#075E54', '#128C7E', '#25D366', '#34B7F1', '#4A148C', '#B71C1C', '#263238'].map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setStatusNotifBgColor(col)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${statusNotifBgColor === col ? 'border-white scale-110 shadow-md' : 'border-transparent'
                            }`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* F. Caption */}
                {statusNotifContentType !== 'text' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Caption (optional)
                    </label>
                    <input
                      type="text"
                      value={statusNotifCaption}
                      onChange={(e) => setStatusNotifCaption(e.target.value)}
                      placeholder="Add an optional caption for the media status..."
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                )}

                {/* G. Optional Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Optional URL / Link
                  </label>
                  <input
                    type="url"
                    value={statusNotifLink}
                    onChange={(e) => setStatusNotifLink(e.target.value)}
                    placeholder="https://yourwebsite.com/promo"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-emerald-500 font-medium font-mono"
                  />
                </div>

                {/* H. Connected WhatsApp Account */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Connected WhatsApp Account
                  </label>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        WA
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {status?.name || 'Mujahid Abbas'}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {status?.phone ? `+${status.phone}` : 'Active Connected Account'} &bull; {status?.status}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      Primary
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Group Selection, Frequency, Activation Duration */}
              <div className="space-y-5">
                {/* DEDICATED SECTION: TAG WHATSAPP GROUPS */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/90 border border-slate-800">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">
                        TAG WHATSAPP GROUPS
                      </h4>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      {statusNotifSelectedGroups.length} Groups Tagged
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Only groups you explicitly tag will receive notification when this status is published.
                  </p>

                  {/* Tag Groups Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setTempTaggedGroups([...statusNotifSelectedGroups]);
                      setTagGroupsSearch('');
                      setTagGroupsModalOpen(true);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 transition-all active:scale-95"
                  >
                    <Users className="w-4 h-4" />
                    <span>Tag Groups ({groups.length} available)</span>
                  </button>

                  {/* Display Selected Groups as Removable Tags/Chips */}
                  {statusNotifSelectedGroups.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Tagged Recipient Groups:</span>
                        <button
                          type="button"
                          onClick={() => setStatusNotifSelectedGroups([])}
                          className="text-rose-400 hover:underline text-[10px] font-bold"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 custom-scrollbar">
                        {statusNotifSelectedGroups.map((jid) => {
                          const grp = groups.find((g) => g.jid === jid);
                          const name = grp?.name || grp?.subject || jid;
                          const icon = grp?.icon_url || grp?.profile_picture_url;
                          const memberCount = grp?.member_count || grp?.participants_count;
                          return (
                            <span
                              key={jid}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs font-semibold shadow-sm select-none"
                            >
                              {icon ? (
                                <img src={icon} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-indigo-800 text-[10px] font-bold flex items-center justify-center text-white shrink-0">
                                  {name.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <span className="truncate max-w-[140px]">{name}</span>
                              {memberCount ? (
                                <span className="text-[10px] text-indigo-400 font-mono font-normal">
                                  ({memberCount})
                                </span>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setStatusNotifSelectedGroups((prev) => prev.filter((j) => j !== jid))}
                                className="text-indigo-400 hover:text-rose-400 p-0.5 rounded transition-colors ml-0.5"
                                title="Remove group tag"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-center space-y-1">
                      <p className="text-xs text-slate-400 font-medium">No groups tagged yet.</p>
                      <p className="text-[10px] text-slate-500">
                        Click the <strong>Tag Groups</strong> button above to pick recipient groups.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 9: Notification Frequency */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block">
                    Notification Frequency
                  </label>
                  <p className="text-[10px] text-slate-500">
                    How many times per day the status notification is delivered to the groups.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setStatusNotifFrequency(f)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${statusNotifFrequency === f
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                      >
                        {f}x / Day
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">First Notification:</span>
                      <input
                        type="time"
                        value={statusNotifStartTime}
                        onChange={(e) => setStatusNotifStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">Interval (Hours):</span>
                      <select
                        value={statusNotifIntervalHours}
                        onChange={(e) => setStatusNotifIntervalHours(parseInt(e.target.value, 10))}
                        className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs"
                      >
                        <option value="1">1 Hour</option>
                        <option value="2">2 Hours</option>
                        <option value="3">3 Hours</option>
                        <option value="4">4 Hours</option>
                        <option value="6">6 Hours</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section 10: Activation Duration in Hours */}
                <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <label className="text-xs font-bold text-slate-300 block">
                    Campaign Activation Duration (Hours)
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Campaign automatically expires and ceases notifications once this period ends.
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 3, 6, 12, 24, 48].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => {
                          setStatusNotifDurationHours(h);
                          setStatusNotifCustomDuration(h.toString());
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${statusNotifDurationHours === h
                          ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                      >
                        {h} {h === 1 ? 'Hour' : 'Hours'}
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Expiration:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      +{statusNotifDurationHours}h from launch
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Preview, Cancel, Save Draft, Add / Publish Status */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setStatusNotifPreviewModalTask({
                    id: 'temp_preview',
                    notification_headline: statusNotifName || 'Status Preview',
                    tool_name: statusNotifName || 'Status Preview',
                    message: statusNotifText || statusNotifCaption || statusNotifName,
                    image_url: statusNotifImageUrl || undefined,
                    video_url: statusNotifVideoUrl || undefined,
                    cta_link: statusNotifLink || undefined,
                    target_group_jids: statusNotifSelectedGroups,
                    target_group_names: [],
                    schedule_time: new Date().toISOString(),
                    schedule_mode: 'IMMEDIATE',
                    status: 'DRAFT',
                    created_at: new Date().toISOString(),
                    total_groups: statusNotifSelectedGroups.length,
                    sent_count: 0,
                    failed_count: 0
                  });
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Status Preview</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
                <button
                  type="button"
                  onClick={() => setStatusNotifModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold border border-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveOrPublishStatusNotification('DRAFT')}
                  disabled={isSubmittingStatusNotif}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 disabled:opacity-50"
                >
                  Save Draft
                </button>

                {/* ADD / PUBLISH STATUS BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSaveOrPublishStatusNotification(statusNotifSelectedGroups.length > 0 ? 'PUBLISH_AND_NOTIFY' : 'PUBLISH_STATUS_ONLY')}
                  disabled={isSubmittingStatusNotif}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/60 active:scale-95 disabled:opacity-50"
                  title="Publishes directly to WhatsApp My Status. If groups are tagged, dispatches notifications after confirmation."
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>
                    {isSubmittingStatusNotif
                      ? 'Publishing Status...'
                      : statusNotifSelectedGroups.length > 0
                        ? 'Add / Publish Status & Notify Groups'
                        : 'Add / Publish Status (My Status Only)'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1B: TAG GROUPS SELECTION PANEL MODAL */}
      {/* ======================================================== */}
      {tagGroupsModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-7 space-y-5 shadow-2xl relative max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-black text-white">Tag WhatsApp Groups</h3>
                  <p className="text-xs text-slate-400">
                    Select groups from linked account to receive notification of published status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTagGroupsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Controls Bar */}
            <div className="space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={tagGroupsSearch}
                  onChange={(e) => setTagGroupsSearch(e.target.value)}
                  placeholder="Search groups by name or group ID..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTempTaggedGroups(groups.map((g) => g.jid))}
                    className="px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-500/40 text-[11px] font-bold text-indigo-300"
                  >
                    Select All ({groups.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempTaggedGroups([])}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-bold text-slate-400"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="text-xs font-mono text-slate-300">
                  Selected: <strong className="text-cyan-400 font-bold">{tempTaggedGroups.length}</strong> / {groups.length} Groups
                </div>
              </div>
            </div>

            {/* Groups Scroll List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar min-h-0 max-h-[380px]">
              {groups
                .filter((g) => {
                  if (!tagGroupsSearch) return true;
                  const q = tagGroupsSearch.toLowerCase();
                  return (g.name && g.name.toLowerCase().includes(q)) || (g.jid && g.jid.toLowerCase().includes(q));
                })
                .map((grp) => {
                  const isSelected = tempTaggedGroups.includes(grp.jid);
                  const memberCount = (grp.member_count !== undefined && grp.member_count !== null && grp.member_count > 0)
                    ? `${grp.member_count} members`
                    : (grp.members && grp.members.length > 0 ? `${grp.members.length} members` : 'Available');

                  return (
                    <div
                      key={grp.jid}
                      onClick={() => {
                        if (isSelected) {
                          setTempTaggedGroups((prev) => prev.filter((j) => j !== grp.jid));
                        } else {
                          setTempTaggedGroups((prev) => [...prev, grp.jid]);
                        }
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border select-none ${isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/60 ring-1 ring-indigo-500/40 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setTempTaggedGroups((prev) => [...prev, grp.jid]);
                            } else {
                              setTempTaggedGroups((prev) => prev.filter((j) => j !== grp.jid));
                            }
                          }}
                          className="w-4 h-4 rounded text-indigo-500 focus:ring-0 border-slate-700 bg-slate-950 cursor-pointer shrink-0"
                        />

                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700 flex items-center justify-center">
                          {grp.icon_url || grp.profile_picture_url ? (
                            <img
                              src={(grp.icon_url || grp.profile_picture_url) || ''}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-xs text-indigo-400 bg-indigo-950/50">
                              {grp.name?.slice(0, 2).toUpperCase() || 'GP'}
                            </div>
                          )}
                        </div>

                        {/* Name & ID */}
                        <div className="min-w-0 space-y-0.5">
                          <h5 className="font-bold text-white text-xs truncate max-w-[220px] sm:max-w-[320px]">
                            {grp.name || 'WhatsApp Group'}
                          </h5>
                          <p className="font-mono text-[10px] text-slate-400 truncate max-w-[220px] sm:max-w-[320px]">
                            ID: <span className="text-cyan-400">{grp.jid}</span>
                          </p>
                        </div>
                      </div>

                      {/* Member count & badge */}
                      <div className="text-right shrink-0 space-y-0.5">
                        <span className="text-[10px] font-mono text-slate-400 block">{memberCount}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${isSelected ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-slate-800 text-slate-500'
                          }`}>
                          {isSelected ? 'Tagged' : 'Untagged'}
                        </span>
                      </div>
                    </div>
                  );
                })}

              {groups.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No WhatsApp groups available for the connected account.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setTagGroupsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setStatusNotifSelectedGroups([...tempTaggedGroups]);
                  setTagGroupsModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Selected Groups ({tempTaggedGroups.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: STATUS PREVIEW MODAL */}
      {/* ======================================================== */}
      {statusNotifPreviewModalTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                WhatsApp Status Preview
              </h4>
              <button
                onClick={() => setStatusNotifPreviewModalTask(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Status Simulation Card */}
            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner p-3 space-y-3">
              {/* Header inside status */}
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-900">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs">
                  {status?.name?.charAt(0) || 'M'}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">{status?.name || 'Mujahid Abbas'}</span>
                  <span className="text-[10px] text-slate-400">Just now &bull; My Status</span>
                </div>
              </div>

              {/* Status Media Display */}
              {statusNotifPreviewModalTask.image_url ? (
                <div className="rounded-xl overflow-hidden max-h-64 flex items-center justify-center bg-slate-950">
                  <img src={statusNotifPreviewModalTask.image_url} alt="" className="max-h-64 object-contain" />
                </div>
              ) : statusNotifPreviewModalTask.video_url ? (
                <div className="rounded-xl overflow-hidden max-h-64 flex items-center justify-center bg-slate-950">
                  <video src={statusNotifPreviewModalTask.video_url} controls className="max-h-64" />
                </div>
              ) : (
                <div
                  className="rounded-xl p-6 min-h-[160px] flex items-center justify-center text-center text-white text-sm font-bold shadow-inner"
                  style={{ backgroundColor: statusNotifBgColor || '#075E54' }}
                >
                  {statusNotifPreviewModalTask.message || 'Status text message preview'}
                </div>
              )}

              {/* Caption */}
              {statusNotifPreviewModalTask.message && statusNotifPreviewModalTask.image_url && (
                <p className="text-xs text-slate-200 text-center font-medium">
                  {statusNotifPreviewModalTask.message}
                </p>
              )}

              {statusNotifPreviewModalTask.cta_link && (
                <div className="text-center pt-1">
                  <a href={statusNotifPreviewModalTask.cta_link} target="_blank" rel="noreferrer" className="text-xs text-cyan-400 font-mono underline">
                    {statusNotifPreviewModalTask.cta_link}
                  </a>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 text-center">
              Preview mode only &bull; Nothing will be published or sent from this preview.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: LIVE VIEW REAL-TIME MONITORING MODAL */}
      {/* ======================================================== */}
      {statusNotifLiveViewModalTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Activity className="w-6 h-6 animate-pulse" />
                </span>
                <div>
                  <h3 className="text-xl font-black text-white flex items-center gap-2">
                    Live View & Real-Time Tracking
                    {statusNotifLiveViewPolling && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Campaign: {statusNotifLiveViewModalTask.notification_headline || statusNotifLiveViewModalTask.tool_name || statusNotifLiveViewModalTask.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusNotifLiveViewModalTask(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Panel 1: STATUS PUBLICATION */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  STATUS PUBLICATION
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Account:</span>
                    <span className="font-bold text-white">{statusNotifLiveViewData?.status_publication?.account_name || status?.name || 'Connected Account'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Current Status:</span>
                    <span className="font-bold text-emerald-400 font-mono">{statusNotifLiveViewData?.status_publication?.current_status || status?.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Publication State:</span>
                    <span className="font-bold text-cyan-300">{statusNotifLiveViewData?.status_publication?.publication_state || statusNotifLiveViewModalTask.status_publishing_state || 'DRAFT'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Publication Time:</span>
                    <span className="font-mono text-slate-300">
                      {statusNotifLiveViewData?.status_publication?.publication_time
                        ? new Date(statusNotifLiveViewData.status_publication.publication_time).toLocaleString()
                        : (statusNotifLiveViewModalTask.status_published_at ? new Date(statusNotifLiveViewModalTask.status_published_at).toLocaleString() : 'Not published yet')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Status Reference:</span>
                    <span className="font-mono text-amber-300 text-[11px] truncate max-w-[180px]">
                      {statusNotifLiveViewData?.status_publication?.status_reference || statusNotifLiveViewModalTask.status_message_id || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Panel 2: CAMPAIGN ACTIVATION */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  CAMPAIGN ACTIVATION
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Activation State:</span>
                    <span className="font-bold text-emerald-400">{statusNotifLiveViewData?.campaign?.activation_state || statusNotifLiveViewModalTask.status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Start Time:</span>
                    <span className="font-mono text-slate-300">{statusNotifLiveViewModalTask.start_time || '09:00'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Expiration Time:</span>
                    <span className="font-mono text-slate-300">
                      {statusNotifLiveViewModalTask.expires_at ? new Date(statusNotifLiveViewModalTask.expires_at).toLocaleDateString() : 'Active Duration'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Remaining Duration:</span>
                    <span className="font-bold text-cyan-300">
                      {statusNotifLiveViewData?.campaign?.remaining_duration_hours !== undefined
                        ? `${statusNotifLiveViewData.campaign.remaining_duration_hours} hours`
                        : (statusNotifLiveViewModalTask.validity_duration || '24 hours')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Notifications Per Day:</span>
                    <span className="font-bold text-white font-mono">{statusNotifLiveViewModalTask.posts_per_day || 1}x</span>
                  </div>
                </div>
              </div>

              {/* Panel 3: GROUP NOTIFICATIONS */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-4 h-4" />
                  GROUP NOTIFICATIONS
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Selected</span>
                    <span className="text-base font-black text-white font-mono">
                      {statusNotifLiveViewData?.group_notifications?.total_selected ?? (statusNotifLiveViewModalTask.selected_group_ids?.length || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold block">Sent</span>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      {statusNotifLiveViewData?.group_notifications?.notifications_sent ?? (statusNotifLiveViewModalTask.sent_count || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-amber-400 uppercase font-bold block">Pending</span>
                    <span className="text-base font-black text-amber-400 font-mono">
                      {statusNotifLiveViewData?.group_notifications?.pending_notifications ?? (statusNotifLiveViewModalTask.pending_count || 0)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-rose-400 uppercase font-bold block">Failed</span>
                    <span className="text-base font-black text-rose-400 font-mono">
                      {statusNotifLiveViewData?.group_notifications?.failed_notifications ?? (statusNotifLiveViewModalTask.failed_count || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Panel 4: ANALYTICS */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4" />
                  ANALYTICS & VIEWS
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Notification Link Clicks:</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {statusNotifLiveViewData?.analytics?.notification_clicks ?? (statusNotifLiveViewModalTask.link_clicks || 0)}
                    </span>
                  </div>
                  <div className="py-2 border-b border-slate-900">
                    <span className="text-slate-400 block mb-1">WhatsApp Status Views:</span>
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono block">
                      NOT AVAILABLE THROUGH CURRENT INTEGRATION
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-[10px] text-slate-500">
                    <span>Last Polled:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: HISTORY & DETAILS MODAL */}
      {/* ======================================================== */}
      {statusNotifHistoryModalTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Campaign Details & Per-Group Delivery Log</h3>
                <p className="text-xs text-slate-400">
                  ID: {statusNotifHistoryModalTask.post_id || statusNotifHistoryModalTask.id}
                </p>
              </div>
              <button
                onClick={() => setStatusNotifHistoryModalTask(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Per-Group Delivery Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Per-Group Notification Status</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                      <th className="p-3">Group Name</th>
                      <th className="p-3">Delivery State</th>
                      <th className="p-3">Last Sent Time</th>
                      <th className="p-3">Error</th>
                      <th className="p-3 text-right">Retry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {statusNotifHistoryModalTask.group_deliveries && statusNotifHistoryModalTask.group_deliveries.length > 0 ? (
                      statusNotifHistoryModalTask.group_deliveries.map((del, idx) => (
                        <tr key={del.group_id || idx} className="hover:bg-slate-800/40">
                          <td className="p-3 text-white font-sans font-bold">{del.group_name || del.group_id}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${del.status === 'SENT' ? 'bg-emerald-500/15 text-emerald-400' :
                              del.status === 'FAILED' ? 'bg-rose-500/15 text-rose-400' :
                                'bg-amber-500/15 text-amber-400'
                              }`}>
                              {del.status}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{del.sent_time || del.scheduled_time || 'N/A'}</td>
                          <td className="p-3 text-rose-400 font-sans">{del.error || '-'}</td>
                          <td className="p-3 text-right">
                            {del.status === 'FAILED' && (
                              <button
                                onClick={() => handleRetryStatusNotifGroups(statusNotifHistoryModalTask.post_id || statusNotifHistoryModalTask.id)}
                                className="px-2 py-1 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold"
                              >
                                Retry Group
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-500">
                          No per-group delivery records yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: SETTINGS MODAL */}
      {/* ======================================================== */}
      {statusNotifSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" />
                Status Notification Settings
              </h4>
              <button
                onClick={() => setStatusNotifSettingsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white block">24/7 Cloud Background Execution</span>
                <p className="text-slate-400 text-[11px]">
                  Scheduled status notifications execute autonomously via the server-side cloud scheduler. You do not need to keep the browser tab open.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-emerald-400 block">Strict Publication Verification Lock</span>
                <p className="text-slate-400 text-[11px]">
                  Group notifications will strictly remain blocked if WhatsApp My Status publication fails or is pending. Only verified statuses trigger group notifications.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-cyan-400 block">Safe Rate-Limiting & Idempotency</span>
                <p className="text-slate-400 text-[11px]">
                  Duplicate dispatches on browser refresh or server restart are prevented by deterministic slot keys and per-group delivery state tracking.
                </p>
              </div>
            </div>

            <button
              onClick={() => setStatusNotifSettingsModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

