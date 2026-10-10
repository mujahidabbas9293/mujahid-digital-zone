import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BellRing,
  Plus,
  RefreshCw,
  Trash2,
  Eye,
  History,
  Send,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Calendar,
  Clock,
  Users,
  Search,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Palette,
  Sliders,
  Check,
  Filter,
  Layers,
  Sparkles,
  Lock,
  Save,
  MessageSquare
} from 'lucide-react';
import { AutoSenderTask, CenterGroup, Group, StatusTask, BotStatus } from '../types';

interface StatusManagerViewProps {
  groups?: Group[];
  tasks?: StatusTask[];
  onCreateTask?: (task: any) => Promise<void>;
  status?: BotStatus | null;
}

export const StatusManagerView: React.FC<StatusManagerViewProps> = ({
  groups: propGroups = [],
  tasks: legacyTasks = [],
  onCreateTask,
  status
}) => {
  // State
  const [statusNotifications, setStatusNotifications] = useState<AutoSenderTask[]>([]);
  const [realGroups, setRealGroups] = useState<CenterGroup[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [statusNotifSubTab, setStatusNotifSubTab] = useState<'saved' | 'new'>('saved');
  const [statusNotifFeedback, setStatusNotifFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Form State
  const [editingStatusNotifId, setEditingStatusNotifId] = useState<string | null>(null);
  const [statusNotifHeadline, setStatusNotifHeadline] = useState<string>('');
  const [statusNotifMessage, setStatusNotifMessage] = useState<string>('');
  const [statusNotifAltText, setStatusNotifAltText] = useState<string>('');
  const [statusNotifSelectedGroups, setStatusNotifSelectedGroups] = useState<string[]>([]);
  const [statusNotifGroupSearch, setStatusNotifGroupSearch] = useState<string>('');
  const [statusNotifPostsPerDay, setStatusNotifPostsPerDay] = useState<number>(3);
  const [statusNotifIntervalHours, setStatusNotifIntervalHours] = useState<number>(3);
  const [statusNotifStartDate, setStatusNotifStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [statusNotifStartTime, setStatusNotifStartTime] = useState<string>('09:00');
  const [statusNotifValidityDuration, setStatusNotifValidityDuration] = useState<string>('1_month');
  const [statusNotifSendImmediately, setStatusNotifSendImmediately] = useState<boolean>(false);
  const [statusNotifRTag, setStatusNotifRTag] = useState<boolean>(false);
  const [statusNotifMentionAll, setStatusNotifMentionAll] = useState<boolean>(false);
  const [statusNotifImageDecoration, setStatusNotifImageDecoration] = useState<string>('none');
  const [statusNotifBadgeOverlay, setStatusNotifBadgeOverlay] = useState<string>('none');
  const [statusNotifImageMeta, setStatusNotifImageMeta] = useState<{
    image_url: string;
    image_path?: string;
    filename: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [statusNotifUploadingImage, setStatusNotifUploadingImage] = useState<boolean>(false);
  const [statusNotifSubmitting, setStatusNotifSubmitting] = useState<boolean>(false);
  const [statusNotifShowPreviewMobile, setStatusNotifShowPreviewMobile] = useState<boolean>(false);
  const statusNotifFileInputRef = useRef<HTMLInputElement>(null);

  // Modals State
  const [selectedStatusNotifForHistory, setSelectedStatusNotifForHistory] = useState<AutoSenderTask | null>(null);
  const [statusNotifPreviewModalTask, setStatusNotifPreviewModalTask] = useState<AutoSenderTask | null>(null);
  const [statusNotifDeleteSentModalTask, setStatusNotifDeleteSentModalTask] = useState<AutoSenderTask | null>(null);
  const [statusNotifChangeScheduleModalTask, setStatusNotifChangeScheduleModalTask] = useState<AutoSenderTask | null>(null);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'SENT' | 'PENDING' | 'FAILED'>('ALL');
  const [historyGroupFilter, setHistoryGroupFilter] = useState<string>('');
  const [isDeletingSent, setIsDeletingSent] = useState<boolean>(false);

  // Quick schedule change inputs
  const [csStartDate, setCsStartDate] = useState<string>('');
  const [csStartTime, setCsStartTime] = useState<string>('');
  const [isChangingSchedule, setIsChangingSchedule] = useState<boolean>(false);

  // Fetch status notifications and groups
  const fetchStatusNotifications = async () => {
    try {
      const [notifsRes, groupsRes] = await Promise.all([
        fetch('/api/auto-sender/status-notifications').then(r => r.json()).catch(() => []),
        fetch('/api/auto-sender/groups').then(r => r.json()).catch(() => [])
      ]);

      if (Array.isArray(notifsRes)) {
        setStatusNotifications(notifsRes);
      }
      if (Array.isArray(groupsRes) && groupsRes.length > 0) {
        setRealGroups(groupsRes);
      } else if (propGroups.length > 0) {
        setRealGroups(propGroups.map(g => ({
          jid: g.jid,
          name: g.name,
          member_count: g.member_count || 0,
          is_active: g.is_active,
          can_send: true,
          icon_url: g.icon_url || null
        })));
      }
    } catch (e) {
      console.error('[STATUS_NOTIF] Error loading data:', e);
    }
  };

  useEffect(() => {
    fetchStatusNotifications();
    const interval = setInterval(fetchStatusNotifications, 3500);
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, []);

  const effectiveGroups = useMemo(() => {
    if (realGroups.length > 0) return realGroups;
    return propGroups.map(g => ({
      jid: g.jid,
      name: g.name,
      member_count: g.member_count || 0,
      is_active: g.is_active,
      can_send: true,
      icon_url: g.icon_url || null
    }));
  }, [realGroups, propGroups]);

  const filteredGroups = useMemo(() => {
    if (!statusNotifGroupSearch.trim()) return effectiveGroups;
    const q = statusNotifGroupSearch.toLowerCase();
    return effectiveGroups.filter(g => g.name.toLowerCase().includes(q) || g.jid.includes(q));
  }, [effectiveGroups, statusNotifGroupSearch]);

  // Duration Helper
  const getDurationMonths = (durationKey: string): number => {
    switch (durationKey) {
      case '1_week': return 0.25;
      case '1_month': return 1;
      case '2_months': return 2;
      case '3_months': return 3;
      case '6_months': return 6;
      case '1_year': return 12;
      default: return 1;
    }
  };

  const calculateDurationExpiryDate = (months: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + Math.round(months * 30));
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Schedule Slots Calculation
  const calculatedStatusNotifSlots = useMemo(() => {
    const slots: Array<{ index: number; time24: string; time12: string; label: string }> = [];
    const [startH, startM] = (statusNotifStartTime || '09:00').split(':').map(Number);
    const interval = Number(statusNotifIntervalHours) || 3;
    const runs = Number(statusNotifPostsPerDay) || 1;

    for (let i = 0; i < runs; i++) {
      const totalMinutes = (startH * 60 + startM) + (i * interval * 60);
      const slotHour = Math.floor(totalMinutes / 60) % 24;
      const slotMinute = totalMinutes % 60;
      const time24 = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;

      const period = slotHour >= 12 ? 'PM' : 'AM';
      const h12 = slotHour % 12 === 0 ? 12 : slotHour % 12;
      const time12 = `${h12.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')} ${period}`;

      slots.push({
        index: i + 1,
        time24,
        time12,
        label: `Slot ${i + 1}`
      });
    }
    return slots;
  }, [statusNotifStartTime, statusNotifIntervalHours, statusNotifPostsPerDay]);

  // Compute Next Execution Time
  const getTaskNextExecutionTime = (task: AutoSenderTask, nowMs: number) => {
    if (task.status === 'PAUSED' || task.status === 'BLOCKED' || task.status === 'EXPIRED') {
      return { nextFormatted: 'Paused / Inactive', isWithin10Min: false, minutesRemaining: 0 };
    }

    if (task.next_execution_time) {
      const targetMs = new Date(task.next_execution_time).getTime();
      const diffMs = targetMs - nowMs;
      const minutesRemaining = Math.max(0, Math.floor(diffMs / 60000));
      const formatted = new Date(targetMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        nextFormatted: formatted,
        isWithin10Min: diffMs > 0 && diffMs <= 600000,
        minutesRemaining
      };
    }

    return { nextFormatted: task.start_time || 'Scheduled Slot', isWithin10Min: false, minutesRemaining: 0 };
  };

  // Status Badge Helper
  const getPostLiveStatus = (task: AutoSenderTask, nowMs: number) => {
    const isSending = task.status === 'SENDING';
    const isPaused = task.status === 'PAUSED';
    const isBlocked = task.status === 'BLOCKED';
    const isFailed = task.status === 'FAILED';

    if (isSending) {
      return {
        label: '🟢 SENDING NOW',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
        dotColor: 'bg-emerald-400',
        details: '24/7 Cloud Worker actively sending'
      };
    }
    if (isPaused) {
      return {
        label: '⏸️ PAUSED',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/50',
        dotColor: 'bg-amber-400',
        details: 'Schedule temporarily stopped'
      };
    }
    if (isBlocked) {
      return {
        label: '🚫 BLOCKED',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        dotColor: 'bg-rose-400',
        details: 'Protected by administrator'
      };
    }
    if (isFailed) {
      return {
        label: '🔴 FAILED',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        dotColor: 'bg-rose-400',
        details: 'Send error — Click Retry'
      };
    }

    return {
      label: '🟢 ACTIVE SCHEDULE',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
      dotColor: 'bg-emerald-400',
      details: '24/7 Cloud Automation Running'
    };
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    let totalDelivered = 0;
    let totalPending = 0;
    let totalFailed = 0;

    statusNotifications.forEach(t => {
      totalDelivered += t.sent_count || 0;
      totalFailed += t.failed_count || 0;
      totalPending += t.pending_count || 0;
    });

    return {
      totalNotifications: statusNotifications.length,
      eligibleGroups: effectiveGroups.length,
      totalDelivered,
      totalPending,
      totalFailed
    };
  }, [statusNotifications, effectiveGroups]);

  // Open Form Handlers
  const handleOpenNewStatusNotifForm = () => {
    setEditingStatusNotifId(null);
    setStatusNotifHeadline('');
    setStatusNotifMessage('');
    setStatusNotifAltText('');
    setStatusNotifImageMeta(null);
    setStatusNotifSelectedGroups(effectiveGroups.map(g => g.jid));
    setStatusNotifPostsPerDay(3);
    setStatusNotifIntervalHours(3);
    setStatusNotifStartDate(new Date().toISOString().split('T')[0]);
    setStatusNotifStartTime('09:00');
    setStatusNotifValidityDuration('1_month');
    setStatusNotifSendImmediately(false);
    setStatusNotifRTag(false);
    setStatusNotifMentionAll(false);
    setStatusNotifImageDecoration('none');
    setStatusNotifBadgeOverlay('none');
    setStatusNotifFeedback(null);
    setStatusNotifSubTab('new');
  };

  const handleEditStatusNotification = (task: AutoSenderTask) => {
    setEditingStatusNotifId(task.post_id || task.id);
    setStatusNotifHeadline(task.notification_headline || task.tool_name || task.head_name || '');
    setStatusNotifMessage(task.message || '');
    setStatusNotifAltText(task.image_alt_text || '');
    setStatusNotifSelectedGroups(task.target_group_jids || task.selected_group_ids || []);
    setStatusNotifPostsPerDay(task.posts_per_day || 3);
    setStatusNotifIntervalHours(task.interval_hours || 3);
    setStatusNotifStartDate(task.start_date || (task.created_at ? task.created_at.split('T')[0] : new Date().toISOString().split('T')[0]));
    setStatusNotifStartTime(task.start_time || '09:00');
    setStatusNotifValidityDuration(task.validity_duration || '1_month');
    setStatusNotifSendImmediately(false);
    setStatusNotifRTag(Boolean(task.r_tag_enabled));
    setStatusNotifMentionAll(Boolean(task.mention_all));
    setStatusNotifImageDecoration(task.image_decoration || 'none');
    setStatusNotifBadgeOverlay(task.badge_overlay || 'none');
    if (task.image_url) {
      setStatusNotifImageMeta({
        image_url: task.image_url,
        image_path: task.image_path,
        filename: task.image_filename || 'status_image.jpg',
        size: task.image_size || 'Attached',
        dimensions: task.image_dimensions || '1080x1080'
      });
    } else {
      setStatusNotifImageMeta(null);
    }
    setStatusNotifFeedback(null);
    setStatusNotifSubTab('new');
  };

  // Image Upload Handler
  const handleStatusNotifImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusNotifUploadingImage(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      const img = new Image();
      img.onload = async () => {
        const dimStr = `${img.width}x${img.height}`;
        try {
          const res = await fetch('/api/auto-sender/upload-image', {
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
            setStatusNotifImageMeta({
              image_url: data.image_url,
              image_path: data.image_path,
              filename: data.filename,
              size: data.size,
              dimensions: data.dimensions
            });
            setStatusNotifFeedback({ type: 'success', text: 'Status image uploaded successfully.' });
          } else {
            alert('Upload failed: ' + (data.error || 'Server error'));
          }
        } catch (err: any) {
          alert('Upload failed: ' + err.message);
        } finally {
          setStatusNotifUploadingImage(false);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleSubmitStatusNotification = async (e: React.FormEvent, sendNow: boolean = false) => {
    e.preventDefault();
    if (statusNotifSelectedGroups.length === 0) {
      setStatusNotifFeedback({ type: 'error', text: 'Please select at least one WhatsApp group.' });
      return;
    }
    if (!statusNotifMessage.trim() && !statusNotifImageMeta) {
      setStatusNotifFeedback({ type: 'error', text: 'Please enter a notification caption or upload an image.' });
      return;
    }

    setStatusNotifSubmitting(true);
    setStatusNotifFeedback(null);

    try {
      const payload = {
        tool_name: statusNotifHeadline.trim() || 'Status Notification',
        head_name: statusNotifHeadline.trim() || 'Status Notification',
        notification_headline: statusNotifHeadline.trim() || 'Status Notification',
        image_url: statusNotifImageMeta?.image_url,
        image_path: statusNotifImageMeta?.image_path,
        image_filename: statusNotifImageMeta?.filename,
        image_size: statusNotifImageMeta?.size,
        image_dimensions: statusNotifImageMeta?.dimensions,
        image_alt_text: statusNotifAltText.trim() || undefined,
        image_decoration: statusNotifImageDecoration,
        badge_overlay: statusNotifBadgeOverlay,
        message: statusNotifMessage.trim(),
        target_group_jids: statusNotifSelectedGroups,
        posts_per_day: statusNotifPostsPerDay,
        interval_hours: statusNotifIntervalHours,
        start_date: statusNotifStartDate,
        start_time: statusNotifStartTime,
        calculated_interval: `${statusNotifIntervalHours} hours`,
        generated_times: calculatedStatusNotifSlots.map(s => s.time24),
        validity_duration: statusNotifValidityDuration,
        schedule_mode: (sendNow || statusNotifSendImmediately) ? 'IMMEDIATE' : 'SCHEDULED',
        schedule_time: (sendNow || statusNotifSendImmediately) ? new Date().toISOString() : `${statusNotifStartDate}T${statusNotifStartTime}:00`,
        mention_all: statusNotifMentionAll,
        r_tag_enabled: statusNotifRTag
      };

      let res: Response;
      if (editingStatusNotifId) {
        res = await fetch(`/api/auto-sender/status-notifications/${editingStatusNotifId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/auto-sender/status-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save status notification');

      setStatusNotifFeedback({
        type: 'success',
        text: editingStatusNotifId
          ? 'Status notification schedule updated successfully!'
          : `Status notification activated with Order ID: ${data.task?.order_id || 'Active'}`
      });

      await fetchStatusNotifications();
      setTimeout(() => {
        setStatusNotifSubTab('saved');
        setEditingStatusNotifId(null);
        setStatusNotifFeedback(null);
      }, 1000);
    } catch (err: any) {
      setStatusNotifFeedback({ type: 'error', text: err?.message || 'Submission failed' });
    } finally {
      setStatusNotifSubmitting(false);
    }
  };

  // Actions
  const handleExecuteNowStatusNotif = async (taskId: string) => {
    try {
      const res = await fetch(`/api/auto-sender/status-notifications/${taskId}/execute`, { method: 'POST' });
      if (res.ok) {
        setStatusNotifFeedback({ type: 'success', text: 'Immediate notification broadcast initiated.' });
        fetchStatusNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatusNotifPause = async (taskId: string, currentStatus: string) => {
    try {
      const action = currentStatus === 'PAUSED' ? 'resume' : 'pause';
      const res = await fetch(`/api/auto-sender/status-notifications/${taskId}/${action}`, { method: 'POST' });
      if (res.ok) {
        fetchStatusNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetryStatusNotification = async (taskId: string) => {
    try {
      const res = await fetch(`/api/auto-sender/status-notifications/${taskId}/retry`, { method: 'POST' });
      if (res.ok) {
        setStatusNotifFeedback({ type: 'success', text: 'Retrying failed groups in background.' });
        fetchStatusNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteStatusNotification = async (taskId: string) => {
    if (!window.confirm('Delete this scheduled status notification permanently?')) return;
    try {
      const res = await fetch(`/api/auto-sender/status-notifications/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchStatusNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDeleteSentPosts = async () => {
    if (!statusNotifDeleteSentModalTask) return;
    const taskId = statusNotifDeleteSentModalTask.post_id || statusNotifDeleteSentModalTask.id;
    setIsDeletingSent(true);
    try {
      const res = await fetch(`/api/auto-sender/status-notifications/${taskId}/delete-sent-posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelFutureSchedules: true })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusNotifFeedback({
          type: 'success',
          text: `Revocation completed: ${data.totalDeleted || 0} messages deleted across recipient groups.`
        });
        setStatusNotifDeleteSentModalTask(null);
        fetchStatusNotifications();
      } else {
        alert(data.error || 'Failed to revoke sent posts.');
      }
    } catch (err: any) {
      alert('Revocation error: ' + err.message);
    } finally {
      setIsDeletingSent(false);
    }
  };

  const handleDeleteAllStatusNotifSentPosts = async () => {
    if (!window.confirm('Revoke and delete ALL sent status notifications from all recipient WhatsApp groups?')) return;
    try {
      const res = await fetch('/api/auto-sender/status-notifications/delete-all-sent-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancelFutureSchedules: true })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusNotifFeedback({
          type: 'success',
          text: `All sent status notifications revoked across recipient groups (${data.totalDeleted || 0} deleted).`
        });
        fetchStatusNotifications();
      }
    } catch (err: any) {
      alert('Error revoking sent posts: ' + err.message);
    }
  };

  const handleSaveQuickScheduleChange = async () => {
    if (!statusNotifChangeScheduleModalTask) return;
    const taskId = statusNotifChangeScheduleModalTask.post_id || statusNotifChangeScheduleModalTask.id;
    setIsChangingSchedule(true);
    try {
      const res = await fetch(`/api/auto-sender/status-notifications/${taskId}/change-schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: csStartDate,
          start_time: csStartTime
        })
      });
      if (res.ok) {
        setStatusNotifFeedback({ type: 'success', text: 'Schedule timing updated successfully.' });
        setStatusNotifChangeScheduleModalTask(null);
        fetchStatusNotifications();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsChangingSchedule(false);
    }
  };

  const handleRetrySingleGroup = async (taskId: string, jid: string) => {
    try {
      const res = await fetch(`/api/auto-sender/tasks/${taskId}/groups/${encodeURIComponent(jid)}/retry`, { method: 'POST' });
      if (res.ok) {
        alert('Retry queued for group.');
        fetchStatusNotifications();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSingleGroupPost = async (taskId: string, jid: string) => {
    if (!window.confirm('Delete and revoke the sent status notification from this WhatsApp group?')) return;
    try {
      const res = await fetch(`/api/auto-sender/status-notifications/${taskId}/groups/${encodeURIComponent(jid)}/delete-sent-post`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert('Message deleted from group successfully.');
        fetchStatusNotifications();
      } else {
        alert(data.error || 'Failed to delete message from group.');
      }
    } catch (err: any) {
      alert('Deletion error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & METRIC CARDS */}
      {/* ======================================================== */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
            <BellRing className="w-8 h-8 text-amber-400" />
            Status Notification Dashboard
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
              {statusNotifications.length} Scheduled
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dedicated broadcast engine for automated WhatsApp status announcements, real-time group notifications, rich media decoration &amp; 24/7 background delivery.
          </p>
        </div>

        {/* Sub-tab Navigation and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
            <button
              type="button"
              onClick={() => setStatusNotifSubTab('saved')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                statusNotifSubTab === 'saved'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Saved Notifications ({statusNotifications.length})
            </button>
            <button
              type="button"
              onClick={handleOpenNewStatusNotifForm}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                statusNotifSubTab === 'new'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {editingStatusNotifId ? 'Edit Notification' : 'New Status Notification'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchStatusNotifications().finally(() => setTimeout(() => setRefreshing(false), 500));
            }}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all shadow-md"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {statusNotifications.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllStatusNotifSentPosts}
              className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
              title="Revoke all sent status notifications from recipient groups"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete All Sent
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Saved Statuses</span>
            <BellRing className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-2 tabular-nums">
            {metrics.totalNotifications}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">24/7 background worker</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Eligible Groups</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-2 tabular-nums">
            {metrics.eligibleGroups}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Real target recipients</span>
        </div>

        <div className="bg-[#072419] border border-emerald-500/30 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>🟢 SEND (Delivered)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-300 mt-2 tabular-nums">
            {metrics.totalDelivered}
          </div>
          <span className="text-[10px] text-emerald-500/80 font-mono mt-1 block">Delivered successfully</span>
        </div>

        <div className="bg-[#282108] border border-amber-500/30 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span>🟡 PENDING (Queue)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-2 tabular-nums">
            {metrics.totalPending}
          </div>
          <span className="text-[10px] text-amber-500/80 font-mono mt-1 block">Waiting for slot time</span>
        </div>

        <div className="bg-[#290e15] border border-rose-500/30 p-4 rounded-2xl shadow-lg col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold uppercase tracking-wider">
            <span>🔴 FAILED (Retry)</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-300 mt-2 tabular-nums">
            {metrics.totalFailed}
          </div>
          <span className="text-[10px] text-rose-500/80 font-mono mt-1 block">Ready to retry</span>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusNotifFeedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2.5 ${
          statusNotifFeedback.type === 'success'
            ? 'bg-amber-950/70 border-amber-500/50 text-amber-200'
            : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
        }`}>
          {statusNotifFeedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{statusNotifFeedback.text}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. SUB-TAB 1: SAVED NOTIFICATIONS (TABLE VIEW) */}
      {/* ======================================================== */}
      {statusNotifSubTab === 'saved' && (
        <div className="space-y-5">
          {statusNotifications.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <BellRing className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Status Notifications Configured</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Create your first automated status notification to broadcast news, announcements, alerts, and promotions to WhatsApp groups on a 24/7 background schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenNewStatusNotifForm}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black transition-all shadow-lg inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Status Notification
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="overflow-x-auto scrollbar-thin rounded-xl border border-slate-800/80 bg-slate-950/60 shadow-inner">
                <table className="w-full min-w-[2000px] text-center border-collapse">
                  <thead>
                    <tr className="bg-slate-950/90 border-b border-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Post Order 🆔</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[170px]">Notification Headline</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Status Images</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[130px]">Post Per Day</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap min-w-[140px]">Group Select</th>
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
                    {statusNotifications.map((task) => {
                      const taskId = task.post_id || task.id;
                      const nextExec = getTaskNextExecutionTime(task, currentTime);
                      const totalGroups = task.total_groups || (task.selected_group_ids?.length || task.target_group_jids?.length || 0);
                      const sentCount = task.sent_count || 0;
                      const failedCount = task.failed_count || 0;
                      const pendingCount = task.pending_count !== undefined ? task.pending_count : Math.max(0, totalGroups - sentCount - failedCount);

                      const createdDate = task.created_at ? new Date(task.created_at) : new Date();
                      const expiryDate = task.expires_at ? new Date(task.expires_at) : (() => {
                        const d = new Date(createdDate);
                        const months = getDurationMonths(task.validity_duration || '1_month');
                        d.setMonth(d.getMonth() + months);
                        return d;
                      })();
                      const isExpired = expiryDate.getTime() < currentTime;
                      const expiryDateStr = `${expiryDate.getMonth() + 1}/${expiryDate.getDate()}/${expiryDate.getFullYear()}`;

                      const orderIdDisplay = task.order_id || `#ORD-STAT-${taskId.replace(/^(status_notif_|auto_task_|task_)/, '').slice(0, 6).toUpperCase()}`;
                      const headlineDisplay = task.notification_headline || task.tool_name || task.head_name || 'Status Notification';
                      const postsPerDayDisplay = task.posts_per_day || (task as any).schedule_times?.length || task.generated_times?.length || 1;
                      const statusDetails = getPostLiveStatus(task, currentTime);

                      return (
                        <tr key={taskId} className="text-xs hover:bg-slate-900/60 transition-colors">
                          {/* 1. Post Order 🆔 */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs inline-block shadow-sm" title={orderIdDisplay}>
                              {orderIdDisplay}
                            </span>
                          </td>

                          {/* 2. Notification Headline */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="font-bold text-white block max-w-[160px] mx-auto truncate" title={headlineDisplay}>
                              {headlineDisplay}
                            </span>
                            {task.r_tag_enabled && (
                              <span className="text-[10px] text-amber-400 font-mono font-bold block mt-0.5">
                                [R] Tag Active
                              </span>
                            )}
                          </td>

                          {/* 3. Status Images */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            {task.image_url ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="relative">
                                  <img
                                    src={task.image_url}
                                    alt="Status Preview"
                                    className={`w-12 h-12 object-cover rounded-lg border border-slate-700 mx-auto shadow-md ${
                                      task.image_decoration === 'gold' ? 'ring-2 ring-amber-400' :
                                      task.image_decoration === 'neon' ? 'ring-2 ring-emerald-400' :
                                      task.image_decoration === 'cyberpunk' ? 'ring-2 ring-pink-500' : ''
                                    }`}
                                  />
                                  {task.badge_overlay && task.badge_overlay !== 'none' && (
                                    <span className="absolute -top-1 -right-1 text-[9px] bg-black/80 px-1 rounded shadow">
                                      🏷️
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[90px]">
                                  {task.image_filename || '1 Image'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px] font-mono">No Image</span>
                            )}
                          </td>

                          {/* 4. Post Per Day */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="font-bold text-white block">
                              {postsPerDayDisplay} Posts / Day
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Every {task.interval_hours || 3} Hours
                            </span>
                          </td>

                          {/* 5. Group Select */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="font-bold text-emerald-400 block">
                              {totalGroups} WhatsApp Groups
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Sent: {sentCount} | Pending: {pendingCount}
                            </span>
                          </td>

                          {/* 6. Post Time Sent */}
                          <td className="py-3.5 px-4 text-center align-middle font-mono text-slate-300">
                            <div>First: {task.start_time || '09:00'}</div>
                            <div className="text-[10px] text-slate-500">Start: {task.start_date || 'Today'}</div>
                          </td>

                          {/* 7. Live View Post */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => setStatusNotifPreviewModalTask(task)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                              title="View Live Status Notification Preview"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              Live View
                            </button>
                          </td>

                          {/* 8. Next Post Sent Time */}
                          <td className="py-3.5 px-4 text-center align-middle font-mono">
                            <div className="font-bold text-cyan-300">
                              {nextExec.nextFormatted}
                            </div>
                            {nextExec.isWithin10Min && (
                              <span className="text-[10px] text-amber-400 animate-pulse font-bold">
                                Upcoming in {nextExec.minutesRemaining}m
                              </span>
                            )}
                          </td>

                          {/* 9. Expire Date */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <span className="text-slate-300 font-mono block">
                              {expiryDateStr}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mt-0.5 ${
                              isExpired ? 'text-rose-400' : 'text-emerald-400'
                            }`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>

                          {/* 10. Status */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide inline-flex items-center gap-1.5 shadow-[0_3px_10px_rgba(0,0,0,0.3)] border ring-1 ring-black/20 ${statusDetails.badgeBg}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${statusDetails.dotColor} animate-pulse`} />
                                <span>{statusDetails.label}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {statusDetails.details}
                              </span>
                            </div>
                          </td>

                          {/* 11. Per Day History */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => setSelectedStatusNotifForHistory(task)}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white border border-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm"
                              title="View Per Day Group Delivery Ledger"
                            >
                              <History className="w-3.5 h-3.5 text-amber-400" />
                              Per Day History
                            </button>
                          </td>

                          {/* 12. Actions */}
                          <td className="py-3.5 px-4 text-center align-middle">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleExecuteNowStatusNotif(taskId)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                                title="Send this notification immediately now"
                              >
                                <Send className="w-3 h-3" />
                                Send Now
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatusNotifPause(taskId, task.status)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                title={task.status === 'PAUSED' ? 'Resume Schedule' : 'Pause Schedule'}
                              >
                                {task.status === 'PAUSED' ? (
                                  <>
                                    <Play className="w-3 h-3 text-emerald-400" />
                                    Resume
                                  </>
                                ) : (
                                  <>
                                    <Pause className="w-3 h-3 text-amber-400" />
                                    Pause
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRetryStatusNotification(taskId)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                title="Retry failed groups"
                              >
                                <RotateCcw className="w-3 h-3 text-cyan-400" />
                                Retry
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEditStatusNotification(task)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                title="Edit Notification Schedule"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setCsStartDate(task.start_date || new Date().toISOString().split('T')[0]);
                                  setCsStartTime(task.start_time || '09:00');
                                  setStatusNotifChangeScheduleModalTask(task);
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                title="Change schedule date and time"
                              >
                                <Calendar className="w-3 h-3 text-amber-400" />
                                Schedule
                              </button>

                              <button
                                type="button"
                                onClick={() => setStatusNotifDeleteSentModalTask(task)}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/70 border border-slate-700 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                                title="Revoke sent messages across groups"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                Delete Sent
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteStatusNotification(taskId)}
                                className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold transition-all"
                                title="Delete notification record from database"
                              >
                                Delete
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

      {/* ======================================================== */}
      {/* 3. SUB-TAB 2: NEW / EDIT STATUS NOTIFICATION COMPOSER */}
      {/* ======================================================== */}
      {statusNotifSubTab === 'new' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Sub Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-amber-400" />
                {editingStatusNotifId ? 'Edit Status Notification Schedule' : 'Create New Status Notification Schedule'}
              </h2>
              <p className="text-xs text-slate-400">
                Target real WhatsApp groups, upload decorated status media, configure tags, and automate recurring delivery.
              </p>
            </div>

            {/* Mobile Preview Toggle */}
            <div className="flex items-center gap-2 lg:hidden w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setStatusNotifShowPreviewMobile(!statusNotifShowPreviewMobile)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {statusNotifShowPreviewMobile ? 'Hide Live Preview' : 'Show Live Preview'}
              </button>
            </div>
          </div>

          {/* Form and Preview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Side (7 cols) */}
            <form onSubmit={(e) => handleSubmitStatusNotification(e, false)} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
              
              {/* 1. Headline / Head Name */}
              <div className="space-y-1.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="statusNotifHeadlineInput" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Notification Headline / Head Name *
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold">Highlighted Header in WhatsApp</span>
                </div>
                <input
                  id="statusNotifHeadlineInput"
                  type="text"
                  value={statusNotifHeadline}
                  onChange={(e) => setStatusNotifHeadline(e.target.value)}
                  placeholder="e.g. 🔔 MUJAHID DIGITAL ZONE STATUS ALERT"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-inner"
                />
              </div>

              {/* 2. Media Upload & Decoration Controls */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Status Image / Media Attachment
                  </label>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP supported</span>
                </div>

                <input
                  ref={statusNotifFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStatusNotifImageFileChange}
                  className="hidden"
                />

                {statusNotifImageMeta ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={statusNotifImageMeta.image_url}
                        alt="Status Preview"
                        className={`w-14 h-14 object-cover rounded-lg border border-slate-700 ${
                          statusNotifImageDecoration === 'gold' ? 'ring-2 ring-amber-400' :
                          statusNotifImageDecoration === 'neon' ? 'ring-2 ring-emerald-400' :
                          statusNotifImageDecoration === 'cyberpunk' ? 'ring-2 ring-pink-500' : ''
                        }`}
                      />
                      <div className="text-xs space-y-0.5">
                        <span className="font-bold text-white block truncate max-w-[200px]">
                          {statusNotifImageMeta.filename}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {statusNotifImageMeta.dimensions} • {statusNotifImageMeta.size}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStatusNotifImageMeta(null)}
                      className="px-2.5 py-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/40 rounded-lg border border-rose-500/20"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => statusNotifFileInputRef.current?.click()}
                    className="py-6 px-4 rounded-xl border border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/50 hover:bg-slate-900 cursor-pointer text-center space-y-2 transition-all"
                  >
                    <UploadCloud className="w-8 h-8 text-amber-400 mx-auto" />
                    <div className="text-xs font-bold text-slate-300">
                      {statusNotifUploadingImage ? 'Uploading Status Media...' : 'Click to Upload Status Image'}
                    </div>
                    <span className="text-[10px] text-slate-500 block">Recommended size: 1080x1080 or 1080x1920</span>
                  </div>
                )}

                {/* Image Decoration Frame Presets */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-amber-400" />
                      Image Decoration Frame:
                    </span>
                    <span className="text-[10px] text-amber-400 uppercase font-mono">{statusNotifImageDecoration}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'gold', label: '✨ Gold Luxury' },
                      { id: 'neon', label: '⚡ Neon Glow' },
                      { id: 'minimal', label: '◻️ Minimal' },
                      { id: 'cyberpunk', label: '🔥 Cyberpunk' }
                    ].map((dec) => (
                      <button
                        key={dec.id}
                        type="button"
                        onClick={() => setStatusNotifImageDecoration(dec.id)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          statusNotifImageDecoration === dec.id
                            ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {dec.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Badge Overlay Presets */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      Badge Overlay Header:
                    </span>
                    <span className="text-[10px] text-amber-400 uppercase font-mono">{statusNotifBadgeOverlay}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'urgent', label: '⚡ Urgent Alert' },
                      { id: 'breaking', label: '🔔 Breaking Update' },
                      { id: 'vip', label: '⭐ Special VIP' },
                      { id: 'exclusive', label: '🏷️ Exclusive Offer' },
                      { id: 'notice', label: '⚠️ Important Notice' }
                    ].map((bdg) => (
                      <button
                        key={bdg.id}
                        type="button"
                        onClick={() => setStatusNotifBadgeOverlay(bdg.id)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                          statusNotifBadgeOverlay === bdg.id
                            ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {bdg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Notification Caption & Formatting Toolbar */}
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label htmlFor="statusNotifMessageArea" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Notification Caption &amp; Content *
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {statusNotifMessage.length} chars
                  </span>
                </div>

                {/* Quick Formatting Toolbar */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStatusNotifMessage(prev => prev + ' *bold text* ')}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800"
                    title="Bold"
                  >
                    <Bold className="w-3 h-3 inline mr-1" /> Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusNotifMessage(prev => prev + ' _italic text_ ')}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800"
                    title="Italic"
                  >
                    <Italic className="w-3 h-3 inline mr-1" /> Italic
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusNotifMessage(prev => prev + ' ~strike~ ')}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800"
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-3 h-3 inline mr-1" /> Strike
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusNotifMessage(prev => prev + ' ```code``` ')}
                    className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-800"
                    title="Monospace Code"
                  >
                    <Code className="w-3 h-3 inline mr-1" /> Code
                  </button>

                  {/* Tag Actions: Reseller Tag and Ghost Mention */}
                  <button
                    type="button"
                    onClick={() => setStatusNotifRTag(!statusNotifRTag)}
                    className={`px-2.5 py-1 rounded text-[10px] font-black border transition-all ${
                      statusNotifRTag
                        ? 'bg-amber-600 text-white border-amber-400'
                        : 'bg-slate-950 text-amber-300 border-amber-500/30 hover:bg-slate-800'
                    }`}
                    title="Include Reseller [R] Tag"
                  >
                    [R] Tag {statusNotifRTag ? '✓' : ''}
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusNotifMentionAll(!statusNotifMentionAll)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                      statusNotifMentionAll
                        ? 'bg-emerald-600 text-white border-emerald-400'
                        : 'bg-slate-950 text-emerald-300 border-emerald-500/30 hover:bg-slate-800'
                    }`}
                    title="Tag All Group Members via Ghost Mention"
                  >
                    @everyone {statusNotifMentionAll ? '✓' : ''}
                  </button>
                </div>

                <textarea
                  id="statusNotifMessageArea"
                  rows={5}
                  value={statusNotifMessage}
                  onChange={(e) => setStatusNotifMessage(e.target.value)}
                  placeholder="Type status notification announcement text, updates, links, instructions..."
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 font-mono leading-relaxed focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-inner"
                />
              </div>

              {/* 4. Scheduling & Frequencies */}
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Broadcast Timing &amp; Cloud Frequencies
                </span>

                {/* Posts Per Day & Interval */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Posts Per Day (Daily Broadcast Count)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={statusNotifPostsPerDay}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= 24) setStatusNotifPostsPerDay(val);
                          else if (e.target.value === '') setStatusNotifPostsPerDay(1);
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {[1, 2, 3, 4, 6].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setStatusNotifPostsPerDay(num)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                              statusNotifPostsPerDay === num
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {num}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                      Posting Interval (Hours Between Posts)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={statusNotifIntervalHours}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1 && val <= 24) setStatusNotifIntervalHours(val);
                          else if (e.target.value === '') setStatusNotifIntervalHours(1);
                        }}
                        className="w-20 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono font-bold text-center focus:outline-none focus:border-amber-500"
                      />
                      <div className="flex flex-wrap gap-1 flex-1">
                        {[1, 2, 3, 4, 6, 8].map((hrs) => (
                          <button
                            key={hrs}
                            type="button"
                            onClick={() => setStatusNotifIntervalHours(hrs)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                              statusNotifIntervalHours === hrs
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            Every {hrs}h
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Date & Start Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Start Date (First Broadcast)
                    </label>
                    <input
                      type="date"
                      value={statusNotifStartDate}
                      onChange={(e) => setStatusNotifStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Start Time (24h format)
                    </label>
                    <input
                      type="time"
                      value={statusNotifStartTime}
                      onChange={(e) => setStatusNotifStartTime(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Real-time Calculated Daily Run Slots */}
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase block">
                    Automatically Calculated Daily Slots ({calculatedStatusNotifSlots.length} Runs):
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {calculatedStatusNotifSlots.map((slot) => (
                      <div
                        key={slot.index}
                        className="bg-slate-950 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-white font-mono">{slot.time12}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({slot.label})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Validity Duration */}
                <div className="space-y-1.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Active Duration (Auto-Expiration)
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Expires: {calculateDurationExpiryDate(getDurationMonths(statusNotifValidityDuration))}
                    </span>
                  </div>
                  <select
                    value={statusNotifValidityDuration}
                    onChange={(e) => setStatusNotifValidityDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="1_week">1 Week (7 Days)</option>
                    <option value="1_month">1 Month (30 Days)</option>
                    <option value="2_months">2 Months (60 Days)</option>
                    <option value="3_months">3 Months (90 Days)</option>
                    <option value="6_months">6 Months (180 Days)</option>
                    <option value="1_year">1 Year (365 Days)</option>
                  </select>
                </div>

                {/* Send Immediately Checkbox */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <input
                    type="checkbox"
                    id="statusNotifSendNowCheck"
                    checked={statusNotifSendImmediately}
                    onChange={(e) => setStatusNotifSendImmediately(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 border-slate-700 bg-slate-900 focus:ring-0"
                  />
                  <label htmlFor="statusNotifSendNowCheck" className="text-slate-300 font-bold cursor-pointer">
                    Trigger first notification immediately upon saving
                  </label>
                </div>
              </div>

              {/* 5. Real WhatsApp Groups Target Selection */}
              <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Target WhatsApp Groups (Strict Lock Active) *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      {statusNotifSelectedGroups.length} / {effectiveGroups.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (statusNotifSelectedGroups.length === effectiveGroups.length) {
                          setStatusNotifSelectedGroups([]);
                        } else {
                          setStatusNotifSelectedGroups(effectiveGroups.map(g => g.jid));
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold border border-slate-700"
                    >
                      {statusNotifSelectedGroups.length === effectiveGroups.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Group Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search WhatsApp groups..."
                    value={statusNotifGroupSearch}
                    onChange={(e) => setStatusNotifGroupSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Group Selector List */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2.5 max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
                  {filteredGroups.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-6">
                      {effectiveGroups.length === 0 ? 'No WhatsApp groups found. Connect WhatsApp session first.' : 'No matching groups found.'}
                    </p>
                  ) : (
                    filteredGroups.map((grp) => {
                      const isChecked = statusNotifSelectedGroups.includes(grp.jid);
                      return (
                        <label
                          key={grp.jid}
                          className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                              : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setStatusNotifSelectedGroups(prev =>
                                  prev.includes(grp.jid) ? prev.filter(id => id !== grp.jid) : [...prev, grp.jid]
                                );
                              }}
                              className="w-4 h-4 rounded text-amber-500 border-slate-700 bg-slate-950 focus:ring-0"
                            />
                            {grp.icon_url ? (
                              <img src={grp.icon_url} alt="" className="w-6 h-6 rounded-lg object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs">👥</div>
                            )}
                            <span className="text-xs font-bold truncate">{grp.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono ml-2">
                            {grp.member_count || ''} members
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form Submission Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStatusNotifId(null);
                    setStatusNotifSubTab('saved');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSubmitStatusNotification(e, true)}
                  disabled={statusNotifSubmitting || statusNotifSelectedGroups.length === 0}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  Send Immediately
                </button>

                <button
                  type="submit"
                  disabled={statusNotifSubmitting || statusNotifSelectedGroups.length === 0}
                  className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {statusNotifSubmitting ? 'Saving to 24/7 Cloud...' : editingStatusNotifId ? 'Update Notification Schedule' : 'Save & Activate Schedule'}
                </button>
              </div>
            </form>

            {/* Right Side: Interactive Live Preview Panel (5 cols) */}
            <div className={`lg:col-span-5 space-y-4 ${statusNotifShowPreviewMobile ? 'block' : 'hidden lg:block'}`}>
              <div className="sticky top-20 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Status Notification Preview
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                    Live Sync
                  </span>
                </div>

                {/* Realistic WhatsApp Chat Bubble */}
                <div className="bg-[#0b141a] p-3.5 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
                  {/* Media Visual */}
                  {statusNotifImageMeta ? (
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black/40">
                      <img
                        src={statusNotifImageMeta.image_url}
                        alt="Status Preview"
                        className={`w-full max-h-56 object-contain mx-auto transition-all ${
                          statusNotifImageDecoration === 'gold' ? 'ring-4 ring-amber-400 border-2 border-yellow-200' :
                          statusNotifImageDecoration === 'neon' ? 'ring-4 ring-emerald-400/80 border-2 border-cyan-400' :
                          statusNotifImageDecoration === 'minimal' ? 'ring-2 ring-slate-400/50' :
                          statusNotifImageDecoration === 'cyberpunk' ? 'ring-4 ring-pink-500 border-2 border-cyan-400' : ''
                        }`}
                      />
                      {statusNotifBadgeOverlay && statusNotifBadgeOverlay !== 'none' && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-lg uppercase tracking-wider">
                          {statusNotifBadgeOverlay === 'urgent' ? '⚡ Urgent Alert' :
                           statusNotifBadgeOverlay === 'breaking' ? '🔔 Breaking Update' :
                           statusNotifBadgeOverlay === 'vip' ? '⭐ Special VIP' :
                           statusNotifBadgeOverlay === 'exclusive' ? '🏷️ Exclusive Offer' : '⚠️ Important Notice'}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-6 px-4 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                      [No image attached — text-only notification]
                    </div>
                  )}

                  {/* Formatted Content with Headline Highlight */}
                  <div className="bg-[#005c4b]/30 border border-[#005c4b]/50 text-slate-100 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed space-y-2">
                    {statusNotifHeadline && (
                      <div className="font-bold text-amber-300 border-b border-[#005c4b]/60 pb-1 text-xs">
                        *{statusNotifHeadline}*
                      </div>
                    )}
                    <div>
                      {statusNotifMessage ? statusNotifMessage : <span className="text-slate-500 italic">[Enter notification message caption to preview...]</span>}
                    </div>
                  </div>

                  {/* Ghost mention tag notice */}
                  {statusNotifMentionAll && (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 font-mono">
                      🔔 @everyone ghost mention active for all recipient group members
                    </div>
                  )}
                </div>

                {/* Schedule Specifications */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Broadcast Specifications:
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Daily Frequency:</span>
                      <span className="font-bold text-white font-mono">{statusNotifPostsPerDay} posts / day</span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Interval Spacing:</span>
                      <span className="font-bold text-white font-mono">Every {statusNotifIntervalHours} hours</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block">Daily Calculated Slots:</span>
                    <div className="flex flex-wrap gap-1">
                      {calculatedStatusNotifSlots.map(s => (
                        <span key={s.index} className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px] font-bold">
                          {s.time12}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Target Groups:</span>
                    <span className={`font-bold font-mono ${statusNotifSelectedGroups.length > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {statusNotifSelectedGroups.length > 0 ? `${statusNotifSelectedGroups.length} groups selected` : '⚠️ 0 groups selected'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Duration:</span>
                    <span className="text-slate-200 font-mono">
                      {statusNotifValidityDuration.replace('_', ' ')} (until {calculateDurationExpiryDate(getDurationMonths(statusNotifValidityDuration))})
                    </span>
                  </div>
                </div>

                {/* Validation Indicator */}
                <div className={`p-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 ${
                  statusNotifSelectedGroups.length > 0 && (statusNotifMessage.trim() || statusNotifImageMeta)
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {statusNotifSelectedGroups.length > 0 && (statusNotifMessage.trim() || statusNotifImageMeta) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Ready to activate 24/7 background broadcast</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>
                        {statusNotifSelectedGroups.length === 0
                          ? 'Select at least 1 recipient group'
                          : 'Enter notification caption or upload an image'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: PER DAY HISTORY & DELIVERY LEDGER */}
      {/* ======================================================== */}
      {selectedStatusNotifForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-5xl w-full shadow-2xl space-y-5 my-6 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-white">Status Notification Per Day History</h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
                      {selectedStatusNotifForHistory.order_id || `#ORD-STAT-${(selectedStatusNotifForHistory.post_id || selectedStatusNotifForHistory.id).replace(/^(status_notif_|auto_task_|task_)/, '').slice(0, 6).toUpperCase()}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Group-wise delivery confirmation ledger</span>
                    <span>•</span>
                    <span className="text-amber-400 font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStatusNotifForHistory(null)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Daily History Content */}
            {(() => {
              const currentTaskId = selectedStatusNotifForHistory.post_id || selectedStatusNotifForHistory.id;
              const targetJids = selectedStatusNotifForHistory.target_group_jids || selectedStatusNotifForHistory.selected_group_ids || [];

              const groupRecords = targetJids.map((jid) => {
                const foundGroup = effectiveGroups.find(g => g.jid === jid);
                const delivery = selectedStatusNotifForHistory.group_deliveries?.find(d => d.group_id === jid);
                const log = selectedStatusNotifForHistory.logs?.find(l => l.group_jid === jid);

                const status: 'SENT' | 'PENDING' | 'FAILED' =
                  delivery?.status === 'SENT' || log?.status === 'SENT' ? 'SENT' :
                  delivery?.status === 'FAILED' || log?.status === 'FAILED' ? 'FAILED' :
                  'PENDING';

                return {
                  group_id: jid,
                  group_name: foundGroup?.name || delivery?.group_name || jid,
                  group_icon: foundGroup?.icon_url || delivery?.group_icon || null,
                  status,
                  sent_time: delivery?.sent_time || log?.sent_at,
                  scheduled_time: delivery?.scheduled_time || selectedStatusNotifForHistory.start_time || selectedStatusNotifForHistory.schedule_time,
                  error: delivery?.error || log?.error,
                  message_id: delivery?.message_id || log?.message_id
                };
              });

              const sentCount = groupRecords.filter(g => g.status === 'SENT').length;
              const failedCount = groupRecords.filter(g => g.status === 'FAILED').length;
              const pendingCount = groupRecords.filter(g => g.status === 'PENDING').length;

              const filteredRecords = groupRecords.filter(g => {
                if (historyStatusFilter !== 'ALL' && g.status !== historyStatusFilter) return false;
                if (historyGroupFilter.trim() && !g.group_name.toLowerCase().includes(historyGroupFilter.toLowerCase())) return false;
                return true;
              });

              return (
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  {/* Daily Metric Counters Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center shadow-md">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Groups</span>
                      <span className="text-xl font-black text-white">{groupRecords.length}</span>
                    </div>

                    <div className="bg-[#072419] p-3 rounded-2xl border border-emerald-500/30 text-center shadow-md">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        🟢 SEND (Delivered)
                      </span>
                      <span className="text-xl font-black text-emerald-300">{sentCount}</span>
                    </div>

                    <div className="bg-[#282108] p-3 rounded-2xl border border-amber-500/30 text-center shadow-md">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        🟡 PENDING
                      </span>
                      <span className="text-xl font-black text-amber-300">{pendingCount}</span>
                    </div>

                    <div className="bg-[#290e15] p-3 rounded-2xl border border-rose-500/30 text-center shadow-md">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center justify-center gap-1">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        🔴 FAILED
                      </span>
                      <span className="text-xl font-black text-rose-300">{failedCount}</span>
                    </div>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-amber-400" />
                        Status:
                      </span>
                      <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs font-bold">
                        {(['ALL', 'SENT', 'PENDING', 'FAILED'] as const).map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setHistoryStatusFilter(st)}
                            className={`px-3 py-1 rounded-lg transition-all ${
                              historyStatusFilter === st
                                ? 'bg-amber-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {st === 'ALL' ? 'All' : st === 'SENT' ? '🟢 Sent' : st === 'PENDING' ? '🟡 Pending' : '🔴 Failed'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search group name..."
                        value={historyGroupFilter}
                        onChange={(e) => setHistoryGroupFilter(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Group Delivery List */}
                  <div className="flex-1 overflow-y-auto border border-slate-800 rounded-2xl bg-slate-950/60 divide-y divide-slate-800/80 scrollbar-thin">
                    {filteredRecords.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        No groups found matching filter.
                      </div>
                    ) : (
                      filteredRecords.map((item, idx) => (
                        <div key={item.group_id || idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {item.group_icon ? (
                              <img src={item.group_icon} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                            ) : (
                              <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-sm shrink-0">👥</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-white truncate">{item.group_name}</h4>
                              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                                <span>Target: {item.group_id.slice(0, 15)}...</span>
                                {item.sent_time && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-400">Sent at: {new Date(item.sent_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                  </>
                                )}
                                {item.error && (
                                  <>
                                    <span>•</span>
                                    <span className="text-rose-400 font-bold">Failure: {item.error}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                              item.status === 'SENT'
                                ? 'bg-[#072419] text-emerald-300 border-emerald-500/40'
                                : item.status === 'FAILED'
                                ? 'bg-[#290e15] text-rose-300 border-rose-500/40'
                                : 'bg-[#282108] text-amber-300 border-amber-500/40'
                            }`}>
                              {item.status === 'SENT' ? '🟢 SEND (Delivered)' : item.status === 'FAILED' ? '🔴 FAILED' : '🟡 PENDING'}
                            </span>

                            {item.status === 'FAILED' && (
                              <button
                                type="button"
                                onClick={() => handleRetrySingleGroup(currentTaskId, item.group_id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                                title="Retry delivery for this group"
                              >
                                <RotateCcw className="w-3 h-3 text-cyan-400" />
                                Retry Group
                              </button>
                            )}

                            {item.status === 'SENT' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleGroupPost(currentTaskId, item.group_id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-rose-950/70 text-rose-300 rounded text-[10px] font-bold border border-slate-700 flex items-center gap-1"
                                title="Revoke sent notification from this group"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                Revoke
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedStatusNotifForHistory(null)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
                    >
                      Close Ledger
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: LIVE VIEW POST (WHATSAPP SIMULATION) */}
      {/* ======================================================== */}
      {statusNotifPreviewModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 my-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live WhatsApp Message Preview</h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusNotifPreviewModalTask(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#0b141a] p-4 rounded-2xl border border-slate-800 space-y-3 shadow-inner">
              {statusNotifPreviewModalTask.image_url && (
                <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-black/40">
                  <img
                    src={statusNotifPreviewModalTask.image_url}
                    alt="Status Visual"
                    className="w-full max-h-64 object-contain mx-auto"
                  />
                  {statusNotifPreviewModalTask.badge_overlay && statusNotifPreviewModalTask.badge_overlay !== 'none' && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                      🏷️ {statusNotifPreviewModalTask.badge_overlay.toUpperCase()}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#005c4b]/30 border border-[#005c4b]/50 text-slate-100 p-3.5 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed space-y-2">
                {(statusNotifPreviewModalTask.notification_headline || statusNotifPreviewModalTask.tool_name) && (
                  <div className="font-bold text-amber-300 border-b border-[#005c4b]/60 pb-1">
                    *{statusNotifPreviewModalTask.notification_headline || statusNotifPreviewModalTask.tool_name}*
                  </div>
                )}
                <div>{statusNotifPreviewModalTask.message || ''}</div>
              </div>

              {statusNotifPreviewModalTask.mention_all && (
                <div className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  🔔 Ghost mention active for group participants
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatusNotifPreviewModalTask(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. MODAL: DELETE SENT POSTS (REVOCATION) */}
      {/* ======================================================== */}
      {statusNotifDeleteSentModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Revoke Sent Status Notification?</h3>
              <p className="text-xs text-slate-400">
                This will trigger remote message revocation commands on WhatsApp to delete all confirmed sent messages from the recipient groups.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusNotifDeleteSentModalTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSentPosts}
                disabled={isDeletingSent}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg disabled:opacity-50"
              >
                {isDeletingSent ? 'Revoking on WhatsApp...' : 'Confirm Revocation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. MODAL: QUICK SCHEDULE CHANGE */}
      {/* ======================================================== */}
      {statusNotifChangeScheduleModalTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Change Broadcast Schedule</h3>
              </div>
              <button
                type="button"
                onClick={() => setStatusNotifChangeScheduleModalTask(null)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">Schedule Date</label>
                <input
                  type="date"
                  value={csStartDate}
                  onChange={(e) => setCsStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 block">Schedule Start Time</label>
                <input
                  type="time"
                  value={csStartTime}
                  onChange={(e) => setCsStartTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStatusNotifChangeScheduleModalTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickScheduleChange}
                disabled={isChangingSchedule}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isChangingSchedule ? 'Updating...' : 'Update Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
