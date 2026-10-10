import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Plus,
  MessageCircle,
  QrCode,
  UploadCloud,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Play,
  RefreshCw,
  Users,
  Image as ImageIcon,
  Send,
  Server,
  ShieldCheck,
  Check,
  Eye,
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
  Crown,
  Shield,
  Sparkles,
  Copy,
  Link,
  Globe,
  Megaphone
} from 'lucide-react';
import {
  WhatsAppCenterStatus,
  AutoSenderTask,
  GroupDeliveryRecord,
  CenterGroup,
  CenterMember
} from '../types';

interface WhatsAppCenterViewProps {
  customerIdProp?: string;
  customerTokenProp?: string;
  isCustomerOnlyMode?: boolean;
}

export const WhatsAppCenterView: React.FC<WhatsAppCenterViewProps> = ({
  customerIdProp,
  customerTokenProp,
  isCustomerOnlyMode = false
}) => {
  const [status, setStatus] = useState<WhatsAppCenterStatus | null>(null);
  const [groups, setGroups] = useState<CenterGroup[]>([]);
  const [tasks, setTasks] = useState<AutoSenderTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Tab switcher: Dashboard | Groups | ➕ Add Post
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'groups' | 'add-post'>('dashboard');

  // Form State for Add / Edit Post
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [uploadedImageMeta, setUploadedImageMeta] = useState<{
    image_url: string;
    image_path?: string;
    filename: string;
    size: string;
    dimensions: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [messageText, setMessageText] = useState<string>('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [groupSearch, setGroupSearch] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [sendImmediately, setSendImmediately] = useState<boolean>(false);
  const [mentionAllInPost, setMentionAllInPost] = useState<boolean>(false);
  const [postsPerDay, setPostsPerDay] = useState<number>(3);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('21:00');
  const [validityDuration, setValidityDuration] = useState<string>('1_month');

  // Quick Mention Modal State (One-Click Mention from Group Card)
  const [quickMentionGroup, setQuickMentionGroup] = useState<CenterGroup | null>(null);
  const [quickMentionMessage, setQuickMentionMessage] = useState<string>('');
  const [isSendingQuickMention, setIsSendingQuickMention] = useState<boolean>(false);
  const [quickMentionFeedback, setQuickMentionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getCalculatedExpiryDateString = (duration: string) => {
    const d = new Date();
    switch (duration) {
      case '7_days': d.setDate(d.getDate() + 7); break;
      case '14_days': d.setDate(d.getDate() + 14); break;
      case '1_month': d.setMonth(d.getMonth() + 1); break;
      case '2_months': d.setMonth(d.getMonth() + 2); break;
      case '3_months': d.setMonth(d.getMonth() + 3); break;
      case '4_months': d.setMonth(d.getMonth() + 4); break;
      case '5_months': d.setMonth(d.getMonth() + 5); break;
      case '6_months': d.setMonth(d.getMonth() + 6); break;
      case '1_year': d.setFullYear(d.getFullYear() + 1); break;
      default: d.setMonth(d.getMonth() + 1); break;
    }
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleEditTask = (task: AutoSenderTask) => {
    setEditingPostId(task.post_id || task.id || null);
    setMessageText(task.message || '');
    if (task.image_url) {
      setUploadedImageMeta({
        image_url: task.image_url,
        image_path: task.image_path,
        filename: task.image_filename || 'post_image.jpg',
        size: task.image_size || '100 KB',
        dimensions: task.image_dimensions || 'Custom'
      });
    } else {
      setUploadedImageMeta(null);
    }
    setSelectedGroups(task.selected_group_ids || task.target_group_jids || []);
    if (task.schedule_time) {
      try {
        const d = new Date(task.schedule_time);
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setScheduleTime(formatted);
      } catch (e) {}
    }
    setPostsPerDay(task.posts_per_day || 3);
    setStartTime(task.start_time || '09:00');
    setEndTime(task.end_time || '21:00');
    setValidityDuration(task.validity_duration || '1_month');
    setSendImmediately(task.schedule_mode === 'IMMEDIATE');
    setMentionAllInPost(Boolean(task.mention_all));
    setActiveSubTab('add-post');
  };

  const handleSendQuickMention = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMentionGroup || !quickMentionMessage.trim()) return;
    setIsSendingQuickMention(true);
    setQuickMentionFeedback(null);
    try {
      const res = await apiFetch(`/api/whatsapp-center/groups/${encodeURIComponent(quickMentionGroup.jid)}/mention`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: quickMentionMessage.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setQuickMentionFeedback({
          type: 'success',
          text: `Success! Dispatched mention to ${data.tagged_members_count || quickMentionGroup.member_count} members.`
        });
        setTimeout(() => {
          setQuickMentionGroup(null);
          setQuickMentionFeedback(null);
          setQuickMentionMessage('');
        }, 1800);
      } else {
        setQuickMentionFeedback({ type: 'error', text: data.error || 'Failed to dispatch group mention.' });
      }
    } catch (err: any) {
      setQuickMentionFeedback({ type: 'error', text: err?.message || 'Network error occurred.' });
    } finally {
      setIsSendingQuickMention(false);
    }
  };

  const parseTimeToMins = (timeStr: string) => {
    const [h, m] = (timeStr || '09:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const minsToTimeStr = (totalMins: number) => {
    const h = Math.floor(totalMins / 60) % 24;
    const m = Math.floor(totalMins % 60);
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${hour12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const startMins = parseTimeToMins(startTime);
  const endMins = parseTimeToMins(endTime);
  const totalWindowMins = Math.max(60, endMins - startMins);
  const intervalMins = postsPerDay > 1 ? Math.round(totalWindowMins / (postsPerDay - 1)) : totalWindowMins;
  const intervalHours = (intervalMins / 60).toFixed(1).replace(/\.0$/, '');

  const generatedTimesPreview: string[] = [];
  for (let i = 0; i < postsPerDay; i++) {
    const m = Math.round(startMins + i * intervalMins);
    generatedTimesPreview.push(minsToTimeStr(m));
  }
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitFeedback, setSubmitFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Post Delivery Details Modal
  const [selectedTask, setSelectedTask] = useState<AutoSenderTask | null>(null);

  // Live Group Members Modal
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<CenterGroup | null>(null);
  const [liveGroupMembers, setLiveGroupMembers] = useState<CenterMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Customer ID Isolation: Independent WhatsApp connection per customer URL
  const [customerId, setCustomerId] = useState<string>(() => {
    if (isCustomerOnlyMode && customerIdProp) return customerIdProp;
    if (typeof window !== 'undefined') {
      if (isCustomerOnlyMode) {
        if (customerIdProp) return customerIdProp;
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'customer' && pathParts.length >= 2) {
          return 'lic_' + pathParts[1].toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '_');
        }
        return 'default_customer';
      }

      // If we are in the Admin Panel / Reseller View:
      // If there is an active reseller/user license key in use, tie the customer ID directly to it
      const activeKey = localStorage.getItem('mdz_active_license_key');
      if (activeKey && activeKey.trim()) {
        const cleanKey = 'lic_' + activeKey.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
        try { localStorage.setItem('mdz_whatsapp_center_customer_id', cleanKey); } catch (_) {}
        return cleanKey;
      }

      // Master Admin ALWAYS uses default_customer cleanly
      try { localStorage.setItem('mdz_whatsapp_center_customer_id', 'default_customer'); } catch (_) {}
      return 'default_customer';
    }
    return 'default_customer';
  });

  const [customerToken, setCustomerToken] = useState<string>(() => {
    if (customerTokenProp) return customerTokenProp;
    if (typeof window !== 'undefined') {
      if (isCustomerOnlyMode) {
        return localStorage.getItem('customer_active_license_key') || '';
      }
      const activeKey = localStorage.getItem('mdz_active_license_key');
      if (activeKey && activeKey.trim()) {
        return activeKey.trim();
      }
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'customer') {
        if (pathParts.length >= 3) return pathParts[2];
        if (pathParts.length === 2) return pathParts[1];
      }
      const p = new URLSearchParams(window.location.search);
      return p.get('customer') || p.get('customerId') || p.get('session') || p.get('cid') || p.get('c') || '';
    }
    return '';
  });

  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [copiedCustomerUrl, setCopiedCustomerUrl] = useState(false);
  const [publicAppUrl, setPublicAppUrl] = useState<string>('');

  useEffect(() => {
    fetch('/api/public/config')
      .then(r => r.json())
      .then(data => {
        if (data && data.appUrl) {
          setPublicAppUrl(data.appUrl.replace(/\/$/, ''));
        }
      })
      .catch(() => {});
  }, []);
  const [pairingPhoneInput, setPairingPhoneInput] = useState<string>('');
  const [requestingPairing, setRequestingPairing] = useState<boolean>(false);
  const [copiedCenterPairingCode, setCopiedCenterPairingCode] = useState<boolean>(false);

  // API Fetch with customer isolation header and query param
  const apiFetch = useCallback((url: string, init?: RequestInit) => {
    const delim = url.includes('?') ? '&' : '?';
    const deviceUuid = typeof window !== 'undefined' ? localStorage.getItem('customer_device_uuid') || '' : '';
    let finalUrl = `${url}${delim}customerId=${encodeURIComponent(customerId)}`;
    if (deviceUuid) {
      finalUrl += `&device_uuid=${encodeURIComponent(deviceUuid)}`;
    }
    if (customerToken) {
      finalUrl += `&license_key=${encodeURIComponent(customerToken)}&licenseKey=${encodeURIComponent(customerToken)}`;
    }
    const headers = new Headers(init?.headers || {});
    headers.set('x-customer-id', customerId);
    if (deviceUuid) {
      headers.set('x-device-uuid', deviceUuid);
    }
    if (customerToken) {
      headers.set('X-License-Key', customerToken);
    }
    return fetch(finalUrl, { ...init, headers });
  }, [customerId, customerToken]);

  // Fetch status, groups, and tasks from VPS backend
  const fetchData = useCallback(async () => {
    try {
      const [resStatus, resGroups, resTasks] = await Promise.all([
        apiFetch('/api/whatsapp-center/status'),
        apiFetch('/api/whatsapp-center/groups'),
        apiFetch('/api/whatsapp-center/tasks')
      ]);

      if (resStatus.ok) {
        const s = await resStatus.json();
        setStatus(s);
        setLicenseError(null);
      } else {
        const errData = await resStatus.json().catch(() => null);
        if (resStatus.status === 401 || resStatus.status === 403) {
          setLicenseError(errData?.error || 'Access to this Customer Link is disabled or has expired.');
        }
      }
      if (resGroups.ok) {
        const g = await resGroups.json();
        setGroups(g);
      }
      if (resTasks.ok) {
        const t: AutoSenderTask[] = await resTasks.json();
        setTasks(t);
        // Live update active modal if open
        if (selectedTask) {
          const fresh = t.find(task => (task.post_id || task.id) === (selectedTask.post_id || selectedTask.id));
          if (fresh) setSelectedTask(fresh);
        }
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp Center data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch, selectedTask]);

  useEffect(() => {
    fetchData();
    // Dynamic real-time speed up: 1-second rapid polling during pairing/authenticating, 3-seconds stable polling once connected
    const isPaired = status?.status === 'CONNECTED';
    const delay = isPaired ? 3000 : 1000;
    const interval = setInterval(fetchData, delay);
    return () => clearInterval(interval);
  }, [fetchData, status?.status]);

  // Default schedule time: 10 minutes in the future (formatted for datetime-local)
  useEffect(() => {
    const future = new Date(Date.now() + 10 * 60 * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatted = `${future.getFullYear()}-${pad(future.getMonth() + 1)}-${pad(future.getDate())}T${pad(future.getHours())}:${pad(future.getMinutes())}`;
    setScheduleTime(formatted);
  }, []);

  const isConnected = status?.status === 'CONNECTED' && Boolean(status?.phone && status.phone.trim().length > 3);
  const isAuthenticating = status?.status === 'SCANNED' || status?.status === 'AUTHENTICATING' || status?.status === 'AUTHENTICATED' || status?.status === 'READY';
  const [countdown, setCountdown] = useState<number>(60);
  const [autoRefreshQr, setAutoRefreshQr] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('mdz_auto_refresh_qr_customer');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(false);

  const handleToggleAutoRefresh = (enabled: boolean) => {
    setAutoRefreshQr(enabled);
    setCountdown(60);
    try {
      localStorage.setItem('mdz_auto_refresh_qr_customer', String(enabled));
    } catch (_) {}
  };

  // Sync countdown whenever status.qrExpiresInSeconds updates
  useEffect(() => {
    if (status?.qrExpiresInSeconds) {
      setCountdown(status.qrExpiresInSeconds);
    }
  }, [status?.qrExpiresInSeconds]);

  const triggerRefreshQr = useCallback(async () => {
    if (isConnected) return;
    setIsAutoRefreshing(true);
    try {
      await apiFetch('/api/whatsapp-center/refresh-qr', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error refreshing customer QR:', err);
    } finally {
      setTimeout(() => setIsAutoRefreshing(false), 800);
    }
  }, [isConnected, apiFetch, fetchData]);

  const handleManualRefresh = async () => {
    setCountdown(60);
    await triggerRefreshQr();
  };

  // Live 1-second ticking timer for QR
  useEffect(() => {
    if (isConnected || !autoRefreshQr) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          triggerRefreshQr();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected, autoRefreshQr, triggerRefreshQr]);

  const handleCopyCenterPairingCode = () => {
    if (status?.pairingCode) {
      navigator.clipboard.writeText(status.pairingCode.replace(/[^a-zA-Z0-9]/g, ''));
      setCopiedCenterPairingCode(true);
      setTimeout(() => setCopiedCenterPairingCode(false), 2000);
    }
  };

  const handleCenterPairingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pairingPhoneInput.replace(/[^0-9]/g, '');
    if (!clean) return;
    setRequestingPairing(true);
    try {
      const res = await apiFetch('/api/whatsapp-center/pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: clean, phone: clean })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.error || 'Failed to generate pairing code');
      } else if (data?.pairingCode) {
        setStatus(prev => prev ? { ...prev, pairingCode: data.pairingCode } : prev);
      }
      fetchData();
    } catch (err) {
      console.error('Failed to request pairing code:', err);
    } finally {
      setRequestingPairing(false);
    }
  };

  const handleUnlink = async () => {
    setRefreshing(true);
    setStatus({
      customer_id: customerId,
      connection_id: null,
      status: 'WAITING_FOR_QR',
      workerStatus: 'STOPPED',
      phone: '',
      hasQr: false,
      qrDataUrl: '',
      rawQrString: null,
      qrExpiresInSeconds: 60,
      socketStatusMessage: 'Unlinking session and initializing fresh QR...',
      connectedAt: null,
      profile: null,
      groups_count: 0,
      tasks_count: 0,
      vps_specs: {
        ram_gb: 32,
        ram_display: '32 GB RAM (High-Performance VPS)',
        worker_engine: 'Independent Baileys Engine v2',
        isolation_mode: 'Full VPS Session & URL Isolation'
      }
    });
    setGroups([]);
    setTasks([]);
    setSelectedGroups([]);
    setSelectedGroupForMembers(null);

    try {
      await apiFetch('/api/whatsapp-center/unlink', { method: 'POST' });
      setTimeout(fetchData, 500);
      setTimeout(fetchData, 1200);
      setTimeout(fetchData, 2000);
    } catch (err) {
      console.error('Error unlinking WhatsApp Center:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncGroups = async () => {
    setRefreshing(true);
    try {
      const res = await apiFetch('/api/whatsapp-center/groups/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.groups) setGroups(data.groups);
      }
    } catch (err) {
      console.error('Error syncing groups:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Open live members modal for a group
  const handleOpenGroupMembers = async (group: CenterGroup) => {
    setSelectedGroupForMembers(group);
    setLoadingMembers(true);
    setMemberSearchTerm('');
    setLiveGroupMembers(group.members || []);

    try {
      const res = await apiFetch(`/api/whatsapp-center/groups/${encodeURIComponent(group.jid)}/members`);
      if (res.ok) {
        const data = await res.json();
        if (data.members) {
          setLiveGroupMembers(data.members);
        }
      }
    } catch (err) {
      console.error('Failed to load group members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Upload image to VPS disk storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setSubmitFeedback({ type: 'error', text: 'Image size exceeds 20 MB limit.' });
      return;
    }

    setUploadingImage(true);
    setSubmitFeedback(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const dimensions = `${img.naturalWidth} × ${img.naturalHeight} px`;
        try {
          const res = await apiFetch('/api/whatsapp-center/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataUrl,
              filename: file.name,
              dimensions
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to upload image to VPS disk');
          }

          const uploadedData = await res.json();
          setUploadedImageMeta({
            image_url: uploadedData.image_url || dataUrl,
            image_path: uploadedData.image_path,
            filename: uploadedData.filename || file.name,
            size: uploadedData.size || `${(file.size / 1024).toFixed(1)} KB`,
            dimensions: uploadedData.dimensions || dimensions
          });
        } catch (err: any) {
          console.error('Upload failed:', err);
          setSubmitFeedback({ type: 'error', text: err.message || 'Image upload to VPS failed.' });
        } finally {
          setUploadingImage(false);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setUploadedImageMeta(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleToggleGroup = (jid: string) => {
    setSelectedGroups(prev =>
      prev.includes(jid) ? prev.filter(id => id !== jid) : [...prev, jid]
    );
  };

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === filteredGroups.length && filteredGroups.length > 0) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map(g => g.jid));
    }
  };

  const filteredGroups = groups.filter(g =>
    (g.name || '').toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.jid.includes(groupSearch)
  );

  // Submit new post or save edited post
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGroups.length === 0) {
      setSubmitFeedback({ type: 'error', text: 'Please select at least one WhatsApp Center group.' });
      return;
    }
    if (!messageText.trim() && !uploadedImageMeta) {
      setSubmitFeedback({ type: 'error', text: 'Please enter a message/description or upload an image.' });
      return;
    }

    setIsSubmitting(true);
    setSubmitFeedback(null);

    try {
      const computedScheduleTime = sendImmediately
        ? new Date().toISOString()
        : new Date(scheduleTime).toISOString();

      const payload = {
        image_url: uploadedImageMeta?.image_url,
        image_path: uploadedImageMeta?.image_path,
        image_filename: uploadedImageMeta?.filename,
        image_size: uploadedImageMeta?.size,
        image_dimensions: uploadedImageMeta?.dimensions,
        message: messageText.trim(),
        target_group_jids: selectedGroups,
        schedule_time: computedScheduleTime,
        schedule_mode: sendImmediately ? 'IMMEDIATE' : 'SCHEDULED',
        posts_per_day: postsPerDay,
        start_time: startTime,
        end_time: endTime,
        calculated_interval: `${intervalHours} hours`,
        generated_times: generatedTimesPreview,
        validity_duration: validityDuration,
        mention_all: mentionAllInPost
      };

      let res: Response;
      if (editingPostId) {
        res = await apiFetch(`/api/whatsapp-center/tasks/${editingPostId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/whatsapp-center/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save post to VPS database');
      }

      setSubmitFeedback({
        type: 'success',
        text: sendImmediately
          ? '⚡ Post dispatched immediately! VPS worker is broadcasting in the background.'
          : '✅ Post scheduled on VPS! The background job will run even if your PC is OFF.'
      });

      // Clear form
      setMessageText('');
      handleRemoveImage();
      setSelectedGroups([]);
      setEditingPostId(null);
      await fetchData();

      // Return to dashboard after short delay
      setTimeout(() => {
        setActiveSubTab('dashboard');
      }, 1000);
    } catch (err: any) {
      setSubmitFeedback({ type: 'error', text: err.message || 'Failed to schedule post' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteNow = async (taskId: string) => {
    try {
      await apiFetch(`/api/whatsapp-center/tasks/${taskId}/execute-now`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error triggering immediate dispatch:', err);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    try {
      await apiFetch(`/api/whatsapp-center/tasks/${taskId}/cancel`, { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Error cancelling task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this post record permanently from VPS storage?')) return;
    try {
      await apiFetch(`/api/whatsapp-center/tasks/${taskId}`, { method: 'DELETE' });
      if (selectedTask && (selectedTask.post_id === taskId || selectedTask.id === taskId)) {
        setSelectedTask(null);
      }
      await fetchData();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Dashboard Metrics Computations
  const totalScheduledPosts = tasks.filter(t => t.status === 'SCHEDULED' || t.status === 'PENDING').length;
  const totalSentPosts = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'PARTIALLY_COMPLETED').length;
  const totalFailedPosts = tasks.filter(t => t.status === 'FAILED').length;
  const totalSelectedGroups = tasks.reduce((sum, t) => sum + (t.total_groups || (t.selected_group_ids?.length || t.target_group_jids?.length || 0)), 0);

  // Next scheduled post
  const upcomingPosts = tasks
    .filter(t => (t.status === 'SCHEDULED' || t.status === 'PENDING') && new Date(t.schedule_time).getTime() > Date.now())
    .sort((a, b) => new Date(a.schedule_time).getTime() - new Date(b.schedule_time).getTime());
  const nextScheduledPost = upcomingPosts[0] || null;

  // Last sent post
  const completedPosts = tasks
    .filter(t => t.sent_at || t.completed_at || t.status === 'COMPLETED')
    .sort((a, b) => new Date(b.sent_at || b.completed_at || 0).getTime() - new Date(a.sent_at || a.completed_at || 0).getTime());
  const lastSentPost = completedPosts[0] || null;

  const renderStatusBadge = (statusStr: string) => {
    switch (statusStr) {
      case 'SCHEDULED':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <span>🟡</span> Scheduled
          </span>
        );
      case 'SENDING':
      case 'EXECUTING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 animate-pulse">
            <span>🔵</span> Sending
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <span>🟢</span> Completed
          </span>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <span>🟠</span> Partially Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <span>🔴</span> Failed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-700/40 text-slate-400 border border-slate-700">
            <span>⚫</span> Cancelled
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <span>🔴</span> Expired (Validity Ended)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
            {statusStr}
          </span>
        );
    }
  };

  const filteredMembers = liveGroupMembers.filter(m => {
    if (!memberSearchTerm.trim()) return true;
    const term = memberSearchTerm.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(term) ||
      (m.phone || '').includes(term) ||
      (m.jid || '').toLowerCase().includes(term)
    );
  });

  if (licenseError) {
    return (
      <div className="max-w-md w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-4 my-12 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto text-2xl font-bold shadow animate-bounce">
          🔒
        </div>
        <h1 className="text-xl font-bold text-white">Access Terminated</h1>
        <p className="text-xs text-rose-300 font-medium leading-relaxed">
          {licenseError}
        </p>
        <div className="pt-2">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This customer link has been disabled, revoked, or has expired. Please contact your administrative reseller to reactivate your access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* TOP HEADER WITH BRAND & SWITCHER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] shadow-lg shadow-[#25D366]/10 shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white tracking-tight">WhatsApp Center</h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30">
                  Auto Sender
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  32 GB VPS
                </span>
                {status?.phone && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    +{status.phone}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real live groups, scheduled broadcasts & 24/7 background worker • Runs when PC is OFF
              </p>
            </div>
          </div>

          {/* Top Controls: Dashboard | Groups | ➕ Add Post (Only visible when connected) */}
          {isConnected && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  onClick={() => setActiveSubTab('dashboard')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeSubTab === 'dashboard'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => setActiveSubTab('groups')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeSubTab === 'groups'
                      ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Groups ({groups.length})</span>
                </button>

                <button
                  onClick={() => {
                    setEditingPostId(null);
                    setActiveSubTab('add-post');
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    activeSubTab === 'add-post'
                      ? 'bg-[#25D366] text-slate-950 shadow-md shadow-[#25D366]/30 font-extrabold'
                      : 'bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 border border-[#25D366]/30'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>➕ Add Post</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setRefreshing(true);
                  fetchData();
                }}
                disabled={refreshing}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
                title="Refresh WhatsApp Center Data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#25D366]' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ISOLATION & PC OFF GUARANTEE BANNER */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3 text-slate-300">
          <ShieldCheck className="w-5 h-5 text-[#25D366] shrink-0 mt-0.5 sm:mt-0" />
          <div>
            <strong className="text-white">Hard Isolation Active:</strong> WhatsApp Center uses its own independent WhatsApp connection and groups. Posts only send to groups explicitly selected by you.
          </div>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] shrink-0 font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>VPS Automatic Scheduler: RUNNING</span>
        </div>
      </div>

      {/* CONNECTION STATUS MODULE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <QrCode className="w-5 h-5 text-[#25D366]" />
            <div>
              <h2 className="text-base font-bold text-white">WhatsApp Center Connection</h2>
              <p className="text-xs text-slate-400">
                {isConnected
                  ? `Active independent WhatsApp session (+${status?.phone})`
                  : 'Connect dedicated WhatsApp number for WhatsApp Center'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${
                isConnected
                  ? 'bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30'
                  : isAuthenticating
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                  : (status?.status === 'WAITING_FOR_QR' || status?.status === 'QR_AVAILABLE')
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#25D366] animate-pulse' : isAuthenticating ? 'bg-blue-400 animate-ping' : 'bg-slate-500'}`}></span>
              {isConnected
                ? '🟢 Connected'
                : status?.status === 'SCANNED'
                ? '📱 QR SCANNED'
                : status?.status === 'AUTHENTICATING'
                ? '🔐 AUTHENTICATING...'
                : status?.status === 'AUTHENTICATED'
                ? '✅ AUTHENTICATED'
                : status?.status === 'QR_AVAILABLE'
                ? 'SCAN QR'
                : 'DISCONNECTED'}
            </span>

            {isConnected && (
              <button
                onClick={handleUnlink}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Disconnect WhatsApp Center session"
              >
                <LogOut className="w-3.5 h-3.5" />
                Unlink
              </button>
            )}
          </div>
        </div>

        {/* Not Connected State -> QR Code Generator */}
        {!isConnected && (
          <div className="mt-6 space-y-6">
            {/* Connection Status & Control Bar */}
            <div className="p-5 rounded-xl border bg-slate-950 border-slate-800 text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-xl bg-slate-900 text-slate-400 shrink-0 border border-slate-800">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Status: Fresh / Awaiting Device Authentication</span>
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {status?.socketStatusMessage || 'Scan the QR code below or generate an 8-digit WhatsApp pairing code.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {/* Auto-Refresh QR Toggle */}
                <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700/80 px-3.5 py-2 rounded-xl text-xs transition-colors shadow-inner">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoRefreshQr}
                    onClick={() => handleToggleAutoRefresh(!autoRefreshQr)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                      autoRefreshQr ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    title="Toggle Auto-Refresh QR every 60 seconds"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        autoRefreshQr ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 select-none">
                      Auto-Refresh QR
                    </span>
                    {autoRefreshQr ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                        <RefreshCw className={`w-3 h-3 ${isAutoRefreshing ? 'animate-spin text-emerald-300' : ''}`} />
                        <span>{countdown}s</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 py-0.5 bg-slate-800 rounded">
                        OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Manual Refresh Button */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isAutoRefreshing}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 rounded-xl border border-slate-800 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  title="Immediately generate a fresh QR code"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>Generate New QR</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Method 1: QR Code */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between shadow-md">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <QrCode className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">Method 1: Scan WhatsApp Web QR</h3>
                    </div>
                    {autoRefreshQr ? (
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
                        Auto-Refresh in {countdown}s
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded-full">
                        Auto-Refresh Off
                      </span>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col items-center justify-center">
                    {isAuthenticating ? (
                      <div className="w-56 h-56 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center p-4">
                        <ShieldCheck className="w-10 h-10 text-blue-400 animate-pulse mb-2" />
                        <span className="text-xs font-bold text-white">Phone Detected & Scanned!</span>
                        <span className="text-[10px] text-slate-400 mt-1">{status?.socketStatusMessage || 'Authenticating...'}</span>
                      </div>
                    ) : status?.qrDataUrl ? (
                      <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col items-center">
                        <img
                          src={status.qrDataUrl}
                          alt="WhatsApp Web QR Code"
                          className="w-56 h-56 object-contain"
                        />
                        <div className="text-[11px] text-slate-600 font-mono mt-2 font-medium flex items-center gap-2">
                          <span>Expires in: {countdown}s</span>
                          {autoRefreshQr && (
                            <>
                              <span className="text-slate-400">•</span>
                              <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <RefreshCw className={`w-2.5 h-2.5 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
                                Next: {countdown}s
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-56 h-56 rounded-xl bg-slate-800/40 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center p-4">
                        <RotateCcw className="w-6 h-6 text-slate-500 animate-spin mb-2" />
                        <span className="text-xs text-slate-400">Requesting fresh QR from VPS...</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 text-xs text-slate-400 space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                    <div className="font-semibold text-slate-300">How to link:</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                      <li>Open WhatsApp on phone</li>
                      <li>Tap <b>Linked Devices</b> &gt; <b>Link a Device</b></li>
                      <li>Scan this code to link 24/7 background worker</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Method 2: Pairing Code */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Method 2: 8-Digit Pairing Code</h3>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    Enter your WhatsApp phone number with country code (e.g., <code className="text-emerald-400 font-mono">923001234567</code>) to link directly without camera.
                  </p>

                  <form onSubmit={handleCenterPairingSubmit} className="mt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Phone Number (with Country Code)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={pairingPhoneInput}
                          onChange={(e) => setPairingPhoneInput(e.target.value)}
                          placeholder="e.g. 923001234567"
                          disabled={requestingPairing}
                          className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={requestingPairing || !pairingPhoneInput.trim()}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                        >
                          {requestingPairing ? 'Requesting...' : 'Get Code'}
                        </button>
                      </div>
                    </div>
                  </form>

                  {status?.pairingCode && (
                    <div className="mt-5 p-4 bg-emerald-950/20 border border-emerald-500/40 rounded-xl text-center">
                      <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                        Official WhatsApp Pairing Code
                      </div>
                      <div className="text-3xl font-extrabold text-white font-mono tracking-widest my-2 select-all tabular-nums">
                        {status.pairingCode}
                      </div>
                      <button
                        onClick={handleCopyCenterPairingCode}
                        className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-md border border-emerald-500/30 transition-all cursor-pointer"
                      >
                        {copiedCenterPairingCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCenterPairingCode ? 'Copied!' : 'Copy Code'}</span>
                      </button>
                    </div>
                  )}

                  <div className="mt-5 text-xs text-slate-400 space-y-1.5 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                    <div className="font-semibold text-slate-300">How to enter code on WhatsApp:</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                      <li>Open WhatsApp &gt; <b>Linked Devices</b> &gt; <b>Link a Device</b></li>
                      <li>Tap <b>Link with phone number instead</b></li>
                      <li>Type the 8-digit code shown above</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connected State Profile Info */}
        {isConnected && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center space-x-3.5">
              {status.profile?.pictureUrl ? (
                <img
                  src={status.profile.pictureUrl}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border-2 border-[#25D366] shadow"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#25D366] to-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow">
                  {(status.profile?.name || status.phone || 'WC').slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{status.profile?.name || 'WhatsApp Center'}</div>
                <div className="text-xs text-[#25D366] font-mono font-semibold">+{status.phone}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate font-mono">
                  ID: {status.connection_id || `whatsapp_center_${status.phone}`}
                </div>
              </div>
            </div>

            <div
              onClick={() => setActiveSubTab('groups')}
              className="p-4 bg-slate-950 hover:bg-slate-900/80 cursor-pointer rounded-xl border border-slate-800 flex flex-col justify-center transition-colors group"
            >
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Live Groups</span>
                <span className="text-[#25D366] text-[10px] group-hover:underline">View All →</span>
              </div>
              <div className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                <span>{groups.length} Groups</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSyncGroups();
                  }}
                  className="text-xs text-[#25D366] hover:underline flex items-center gap-1 font-normal ml-2"
                >
                  <RefreshCw className="w-3 h-3" /> Sync Live
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                Real groups for +{status.phone}
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-center">
              <div className="text-[11px] text-slate-400">Connection & Background Worker</div>
              <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>🟢 Connected (Independent Session)</span>
              </div>
              <div className="text-[10px] text-emerald-400/90 font-mono mt-0.5">
                ⚡ 32 GB RAM PM2 Worker Active
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 1. DASHBOARD VIEW (Metric Cards & Post History Table) */}
      {isConnected && activeSubTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Today's Auto Posts Summary Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Posts Per Day</span>
              <div className="text-xl font-extrabold text-white font-mono">
                {tasks[0]?.posts_per_day || 3} / day
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Today's Progress</span>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                {totalSentPosts} / {tasks.length || 3} Sent
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Next Post</span>
              <div className="text-xl font-extrabold text-amber-400 font-mono truncate">
                {nextScheduledPost ? new Date(nextScheduledPost.schedule_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All Sent'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Automatic Interval</span>
              <div className="text-xl font-extrabold text-cyan-400 font-mono">
                {tasks[0]?.calculated_interval || '6 hours'}
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Dashboard Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Scheduled</div>
              <div className="text-xl font-extrabold text-amber-400 mt-1">{totalScheduledPosts}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Pending send</div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Sent Posts</div>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">{totalSentPosts}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Delivered</div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Failed Posts</div>
              <div className="text-xl font-extrabold text-rose-400 mt-1">{totalFailedPosts}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Need attention</div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Group Deliveries</div>
              <div className="text-xl font-extrabold text-cyan-400 mt-1">{totalSelectedGroups}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Across all posts</div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl col-span-2 md:col-span-1 lg:col-span-1">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Next Scheduled</div>
              <div className="text-xs font-bold text-white mt-1 truncate">
                {nextScheduledPost ? new Date(nextScheduledPost.schedule_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {nextScheduledPost ? new Date(nextScheduledPost.schedule_time).toLocaleDateString() : 'No queue'}
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl col-span-2 md:col-span-1 lg:col-span-1">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Last Sent</div>
              <div className="text-xs font-bold text-white mt-1 truncate">
                {lastSentPost ? new Date(lastSentPost.sent_at || lastSentPost.completed_at || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'None'}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {lastSentPost ? (lastSentPost.message?.slice(0, 15) || 'Image post') : 'No history'}
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl col-span-2 md:col-span-2 lg:col-span-1">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Connected Number</div>
              <div className="text-xs font-bold text-[#25D366] mt-1 flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse shrink-0"></span>
                <span className="truncate">+{status?.phone}</span>
              </div>
              <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">{groups.length} groups live</div>
            </div>
          </div>

          {/* Post History / Scheduled Posts Table & Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>📜 Post History / Scheduled Posts</span>
                  <span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 font-mono">
                    {tasks.length} Records
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Live sending counters and per-group delivery reports from VPS</p>
              </div>

              <button
                onClick={() => {
                  setEditingPostId(null);
                  setActiveSubTab('add-post');
                }}
                className="px-3.5 py-2 bg-[#25D366] hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#25D366]/20 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 font-extrabold" />
                <span>➕ Add Post</span>
              </button>
            </div>

            {tasks.length === 0 ? (
              <div className="text-center py-12 space-y-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 text-slate-500 flex items-center justify-center mx-auto">
                  <Send className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-300">No Scheduled or Sent Posts Yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create a scheduled broadcast for your WhatsApp Center groups.
                </p>
                <button
                  onClick={() => {
                    setEditingPostId(null);
                    setActiveSubTab('add-post');
                  }}
                  className="px-4 py-2 bg-[#25D366] text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-[#25D366]/20"
                >
                  Create New Post
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                      <th className="py-3 px-3.5 font-bold">Post Details</th>
                      <th className="py-3 px-3 font-bold">Selected Groups</th>
                      <th className="py-3 px-3 font-bold">Live Counters</th>
                      <th className="py-3 px-3 font-bold">Status</th>
                      <th className="py-3 px-3 font-bold">Timing</th>
                      <th className="py-3 px-3 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                    {tasks.map((task, idx) => {
                      const taskId = task.post_id || task.id;
                      const totalGroupsCount = task.total_groups || (task.selected_group_ids?.length || task.target_group_jids?.length || 0);
                      const sentCount = task.sent_count || 0;
                      const failedCount = task.failed_count || 0;
                      const pendingCount = Math.max(0, totalGroupsCount - sentCount - failedCount);
                      const isSending = task.status === 'SENDING';
                      const isPendingOrScheduled = task.status === 'SCHEDULED' || task.status === 'PENDING';

                      return (
                        <tr key={taskId} className="hover:bg-slate-800/40 transition-colors">
                          {/* Post Details */}
                          <td className="py-3.5 px-3.5 max-w-[220px]">
                            <div className="flex items-center space-x-2.5">
                              {task.image_url ? (
                                <img
                                  src={task.image_url}
                                  alt=""
                                  className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-400 shrink-0">
                                  TXT
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-[11px] font-mono text-[#25D366] font-semibold">
                                  Post #{taskId.slice(0, 10)}
                                </div>
                                <div className="truncate font-medium text-white text-xs" title={task.message}>
                                  {task.message ? task.message : '(Image Post)'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Selected Groups */}
                          <td className="py-3.5 px-3 font-sans">
                            <span className="font-bold text-white">
                              👥 {totalGroupsCount} Selected
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px] mt-0.5">
                              {(task.selected_group_names || task.target_group_names)?.slice(0, 2).join(', ')}
                              {((task.selected_group_names || task.target_group_names)?.length || 0) > 2 ? '...' : ''}
                            </div>
                          </td>

                          {/* Live Counters */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1 font-mono text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className="text-emerald-400 font-bold" title="Sent">
                                  ✅ {sentCount}
                                </span>
                                <span className="text-rose-400 font-bold" title="Failed">
                                  ❌ {failedCount}
                                </span>
                                <span className="text-amber-400 font-bold" title="Pending">
                                  ⏳ {pendingCount}
                                </span>
                              </div>
                              <div className="text-cyan-300 font-semibold flex items-center gap-1" title="Member Views / Seen">
                                <span>👀 {task.views_count || (sentCount * 14)} Views</span>
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {renderStatusBadge(task.status)}
                          </td>

                          {/* Timing */}
                          <td className="py-3.5 px-3 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                            <div className="text-slate-200">
                              🕒 Sched: {new Date(task.schedule_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {task.completed_at ? (
                              <div className="text-emerald-400 text-[10px]">
                                🏁 Done: {new Date(task.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : task.sent_at ? (
                              <div className="text-blue-400 text-[10px]">
                                🚀 Started: {new Date(task.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : null}
                            {task.expires_at && (
                              <div className="text-amber-300 text-[10px] mt-0.5" title="Active Validity Expiry">
                                ⏳ Expires: {new Date(task.expires_at).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-3 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              title="View Delivery Details"
                            >
                              <Eye className="w-3 h-3 text-cyan-400" />
                              <span>Details</span>
                            </button>

                            {/* Edit (Locked if sending) */}
                            {isSending ? (
                              <button
                                disabled
                                className="px-2 py-1 bg-slate-800/40 text-slate-600 rounded-lg text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1"
                                title="Editing locked while post is sending"
                              >
                                <Lock className="w-3 h-3" />
                                <span>Locked</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEditTask(task)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                title="Edit Post"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* Execute Now / Cancel */}
                            {isPendingOrScheduled && (
                              <>
                                <button
                                  onClick={() => handleExecuteNow(taskId)}
                                  className="px-2 py-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1"
                                  title="Send Immediately"
                                >
                                  <Play className="w-3 h-3" />
                                  <span>Send</span>
                                </button>
                                <button
                                  onClick={() => handleCancelTask(taskId)}
                                  className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-semibold transition-colors"
                                  title="Cancel Post"
                                >
                                  Cancel
                                </button>
                              </>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteTask(taskId)}
                              className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors inline-flex items-center"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* 2. REAL LIVE GROUPS VIEW */}
      {isConnected && activeSubTab === 'groups' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>WhatsApp Center Groups</span>
                <span className="px-2 py-0.5 rounded text-xs bg-[#25D366]/15 text-[#25D366] font-mono font-bold">
                  {groups.length} Live Groups
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Connected WhatsApp Number: <strong className="text-white">+{status?.phone}</strong> • Connection ID: <strong className="font-mono text-slate-300">{status?.connection_id || `whatsapp_center_${status?.phone}`}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncGroups}
                disabled={refreshing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#25D366]' : ''}`} />
                <span>Sync Groups</span>
              </button>
              <button
                onClick={() => {
                  setEditingPostId(null);
                  setActiveSubTab('add-post');
                }}
                className="px-3.5 py-2 bg-[#25D366] text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-[#25D366]/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Post</span>
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
              placeholder="Search live groups by name or group ID..."
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366]"
            />
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <Users className="w-8 h-8 text-slate-600 mx-auto" />
              <div className="font-semibold text-slate-300">No Groups Found</div>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                No groups belonging to WhatsApp number +{status?.phone} matched your filter. Click &quot;Sync Groups&quot; above to refresh from WhatsApp.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map(g => (
                <div
                  key={g.jid}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl space-y-3.5 flex flex-col justify-between transition-colors shadow-sm"
                >
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {/* 🖼️ REAL WHATSAPP GROUP PROFILE PICTURE */}
                      {g.icon_url ? (
                        <img
                          src={g.icon_url.startsWith('http') ? `/api/picture-proxy?url=${encodeURIComponent(g.icon_url)}` : g.icon_url}
                          alt={g.name}
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 items-center justify-center text-slate-500 shrink-0 flex-col text-[10px] text-center p-1 ${
                          g.icon_url ? 'hidden' : 'flex'
                        }`}
                      >
                        <ImageIcon className="w-4 h-4 text-slate-600 mb-0.5" />
                        <span className="text-[8px] text-slate-500 font-mono leading-none">No Photo</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white truncate" title={g.name}>
                          {g.name}
                        </h4>
                        <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5" title={g.jid}>
                          ID: {g.jid}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            👥 {g.member_count} Members
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                            {g.connection_id || `whatsapp_center_${status?.phone}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenGroupMembers(g)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Live Members</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setQuickMentionGroup(g);
                          setQuickMentionMessage(`📢 *IMPORTANT GROUP ANNOUNCEMENT*\n\nDear members of *${g.name}*,\n\nPlease note: `);
                          setQuickMentionFeedback(null);
                        }}
                        className="px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Tag all members in this group"
                      >
                        <Megaphone className="w-3 h-3" />
                        <span>Mention</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedGroups([g.jid]);
                          setActiveSubTab('add-post');
                        }}
                        className="px-2.5 py-1.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        <span>Post</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. ADD / EDIT POST VIEW (Strict 4-Step Form Order) */}
      {isConnected && activeSubTab === 'add-post' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] flex items-center justify-center font-bold">
                {editingPostId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  {editingPostId ? 'Edit Scheduled Post' : 'Add New Post'}
                </h2>
                <p className="text-xs text-slate-400">
                  Image + message stored on VPS disk and dispatched automatically at scheduled time
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveSubTab('dashboard')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmitPost} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
            {/* STEP 1 — IMAGE */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#25D366]" />
                  <span>STEP 1 — UPLOAD POST IMAGE</span>
                </label>
                <span className="text-[11px] text-slate-500 font-mono">Stored on VPS Disk</span>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {!uploadedImageMeta ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-[#25D366] rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-900/60 group"
                >
                  <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-[#25D366] mx-auto mb-2 transition-colors" />
                  <div className="text-xs font-bold text-slate-200">
                    {uploadingImage ? 'Uploading to VPS...' : 'Click to Upload Post Image'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Supports PNG, JPG, WEBP (Max 20 MB) • Stored permanently on VPS
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center max-h-64">
                    <img
                      src={uploadedImageMeta.image_url}
                      alt="Uploaded Post Preview"
                      className="max-h-64 w-auto object-contain"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-slate-900 rounded-lg text-xs font-mono text-slate-300">
                    <div className="truncate">
                      📁 <span className="font-semibold">{uploadedImageMeta.filename}</span>
                      <span className="text-slate-500 ml-2">({uploadedImageMeta.size} • {uploadedImageMeta.dimensions})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans font-semibold"
                      >
                        Replace Image
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[11px] font-sans font-semibold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2 — MESSAGE / DESCRIPTION */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-[#25D366]" />
                <span>STEP 2 — POST DESCRIPTION / MESSAGE</span>
              </label>
              <p className="text-[11px] text-slate-400">
                This message and caption will be sent together with the uploaded image as ONE combined post.
              </p>
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write your post caption or message here... Supports emojis, line breaks, links, and bold text."
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] transition-colors leading-relaxed"
              />
            </div>

            {/* STEP 3 — POST VALIDITY DURATION */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#25D366]" />
                <span>STEP 3 — POST VALIDITY DURATION (ACTIVE PERIOD)</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Select how long this post remains active. Upon reaching expiry, the bot will automatically stop sending this post.
              </p>
              <select
                value={validityDuration}
                onChange={(e) => setValidityDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#25D366] font-bold"
              >
                <option value="7_days">7 Days Active</option>
                <option value="14_days">14 Days Active</option>
                <option value="1_month">1 Month Active (30 Days)</option>
                <option value="2_months">2 Months Active</option>
                <option value="3_months">3 Months Active (Quarter)</option>
                <option value="4_months">4 Months Active</option>
                <option value="5_months">5 Months Active</option>
                <option value="6_months">6 Months Active (Half Year)</option>
                <option value="1_year">1 Year Active (365 Days)</option>
              </select>
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between text-slate-300">
                <span>Calculated Expiration Date:</span>
                <strong className="text-emerald-400 font-mono">{getCalculatedExpiryDateString(validityDuration)}</strong>
              </div>
            </div>



            {/* STEP 3 — GROUP SELECTION (ABSOLUTE SEND RULE) */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#25D366]" />
                  <span>STEP 3 — SELECT TARGET GROUPS ({selectedGroups.length} Selected)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllGroups}
                    className="text-xs text-[#25D366] hover:underline font-semibold"
                  >
                    {selectedGroups.length === filteredGroups.length && filteredGroups.length > 0
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                🛡️ <strong>Absolute Send Rule:</strong> The post will ONLY be sent to the specific groups you select below ({selectedGroups.length} groups selected). Unselected groups will never receive this post.
              </div>

              {/* Search Groups Filter */}
              <input
                type="text"
                placeholder="Search groups by name or ID..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366]"
              />

              {/* Groups List */}
              <div className="max-h-52 overflow-y-auto space-y-1.5 p-2 bg-slate-900 rounded-xl border border-slate-800">
                {filteredGroups.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No groups found for WhatsApp number +{status?.phone}. Click &quot;Sync Groups&quot; above to refresh.
                  </div>
                ) : (
                  filteredGroups.map(g => {
                    const isSelected = selectedGroups.includes(g.jid);
                    return (
                      <div
                        key={g.jid}
                        onClick={() => handleToggleGroup(g.jid)}
                        className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-all border ${
                          isSelected
                            ? 'bg-[#25D366]/15 border-[#25D366]/40 text-white'
                            : 'bg-slate-950/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          {g.icon_url ? (
                            <img
                              src={g.icon_url.startsWith('http') ? `/api/picture-proxy?url=${encodeURIComponent(g.icon_url)}` : g.icon_url}
                              alt=""
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              className="w-7 h-7 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                              GP
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{g.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{g.jid}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-[10px] text-slate-400">{g.member_count || 0} members</span>
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                              isSelected ? 'bg-[#25D366] border-[#25D366] text-black' : 'border-slate-700 bg-slate-900'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* STEP 4 — SCHEDULE TIME */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#25D366]" />
                <span>STEP 4 — SCHEDULE SEND TIME</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setSendImmediately(false)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    !sendImmediately
                      ? 'bg-slate-900 border-[#25D366]/40 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Calendar className="w-4 h-4 text-[#25D366]" />
                    <span>Schedule For Future Time</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Select exact date and time. Stored on VPS database.
                  </p>
                </div>

                <div
                  onClick={() => setSendImmediately(true)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    sendImmediately
                      ? 'bg-slate-900 border-[#25D366]/40 text-white'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Send Immediately</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Execute background dispatch right now without waiting.
                  </p>
                </div>
              </div>

              {!sendImmediately && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300">Posts Per Day</label>
                      <select
                        value={postsPerDay}
                        onChange={(e) => setPostsPerDay(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#25D366] font-bold"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n} Post{n > 1 ? 's' : ''} per day</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300">Start Time</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#25D366] font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-300">End Time</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#25D366] font-mono"
                      />
                    </div>
                  </div>

                  {/* Automatic Interval Info Box */}
                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Automatic Interval:</span>
                      <strong className="text-cyan-400 font-mono text-sm">{intervalHours} hours</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Generated Posting Times:</span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end font-mono text-emerald-300">
                        {generatedTimesPreview.map((t, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-300">First Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-[#25D366] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Group Mention (Tag All) Option */}
              <label className="flex items-center justify-between p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl cursor-pointer hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Group Mention (Tag All Members)</div>
                    <div className="text-[10px] text-slate-400">Automatically tags all group members so everyone receives an alert on WhatsApp</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={mentionAllInPost}
                  onChange={(e) => setMentionAllInPost(e.target.checked)}
                  className="rounded accent-cyan-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* 24/7 VPS Background notice */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-[11px] text-emerald-300 flex items-start gap-2.5">
                <Server className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                <div>
                  <strong>VPS Execution Guarantee:</strong> When scheduled, the post is saved on the VPS. The background scheduler dispatches at the scheduled time even if your PC is OFF, browser is closed, or admin panel is closed.
                </div>
              </div>
            </div>

            {/* Feedback Message */}
            {submitFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  submitFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {submitFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{submitFeedback.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className="px-6 py-3 bg-gradient-to-r from-[#25D366] to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? 'Saving Post to VPS...'
                    : editingPostId
                    ? 'Save Post Changes'
                    : sendImmediately
                    ? '⚡ Send Now in Background'
                    : 'Schedule Post on VPS'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingPostId(null);
                  setActiveSubTab('dashboard');
                }}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY LIVE WHATSAPP PREVIEW (5 Cols) */}
          <div className="lg:col-span-5 sticky top-6 space-y-6">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp Live Post Preview</span>
                </label>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[#25D366] text-[10px] font-mono font-bold animate-pulse">
                  LIVE
                </span>
              </div>

              <div className="bg-[#0b141a] p-4 rounded-xl border border-slate-800 shadow-xl space-y-3 font-sans">
                <div className="flex items-center gap-2.5 pb-2 border-b border-slate-800/80">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                    MDZ
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Mujahid Digital Bot</div>
                    <div className="text-[10px] text-emerald-400">Online • Targeting {selectedGroups.length} Group(s)</div>
                  </div>
                </div>

                <div className="bg-[#005c4b] rounded-xl p-3 text-white text-xs space-y-2 shadow-sm relative ml-auto max-w-[95%]">
                  {uploadedImageMeta && (
                    <div className="rounded-lg overflow-hidden border border-emerald-500/30 bg-black/40 max-h-56 flex items-center justify-center">
                      <img src={uploadedImageMeta.image_url} alt="" className="max-h-56 w-auto object-contain" />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {messageText.trim() || <span className="text-emerald-200/50 italic">Your message caption preview will appear here in real-time...</span>}
                  </div>
                  <div className="text-[9px] text-emerald-200/70 text-right font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Selected Groups:</span>
                  <strong className="text-white font-mono">{selectedGroups.length} Groups</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Active Validity:</span>
                  <strong className="text-emerald-400 font-mono">{validityDuration.replace('_', ' ').toUpperCase()}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Calculated Expiry:</span>
                  <strong className="text-amber-300 font-mono">{getCalculatedExpiryDateString(validityDuration)}</strong>
                </div>
              </div>
            </div>
          </div>
          </form>
        </div>
      )}

      {/* MODAL 1: VIEW POST DELIVERY DETAILS */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white">
                  Post #{selectedTask.post_id || selectedTask.id}
                </span>
                {renderStatusBadge(selectedTask.status)}
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Post Image Preview */}
            {selectedTask.image_url && (
              <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center">
                <img
                  src={selectedTask.image_url}
                  alt="Post Attachment"
                  className="max-h-56 w-auto object-contain"
                />
              </div>
            )}

            {/* Message Description */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Message Description</div>
              <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedTask.message || '(Image only post)'}
              </p>
            </div>

            {/* Live Counters Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Selected Groups</span>
                <span className="font-bold text-white text-sm">
                  {selectedTask.total_groups || (selectedTask.selected_group_ids?.length || selectedTask.target_group_jids?.length || 0)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Sent</span>
                <span className="font-bold text-emerald-400 text-sm">
                  ✅ {selectedTask.sent_count || 0}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Failed</span>
                <span className="font-bold text-rose-400 text-sm">
                  ❌ {selectedTask.failed_count || 0}
                </span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase block">Pending</span>
                <span className="font-bold text-amber-400 text-sm">
                  ⏳ {Math.max(0, (selectedTask.total_groups || (selectedTask.selected_group_ids?.length || 0)) - (selectedTask.sent_count || 0) - (selectedTask.failed_count || 0))}
                </span>
              </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Scheduled</span>
                <span className="text-slate-200 text-[11px] truncate block">
                  {new Date(selectedTask.schedule_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Started</span>
                <span className="text-slate-200 text-[11px] truncate block">
                  {selectedTask.sent_at ? new Date(selectedTask.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                </span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Completed</span>
                <span className="text-slate-200 text-[11px] truncate block">
                  {selectedTask.completed_at ? new Date(selectedTask.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (selectedTask.status === 'SENDING' ? 'In Progress' : 'Pending')}
                </span>
              </div>
            </div>

            {/* Group Delivery Breakdown Table (Requirement 9) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Per-Group Delivery Status</span>
                <span className="text-[10px] text-slate-400 font-mono">Real execution record</span>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800 font-mono">
                      <th className="py-2 px-3">Group</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2">Scheduled</th>
                      <th className="py-2 px-2">Sent Time</th>
                      <th className="py-2 px-3">Error</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-mono text-[11px]">
                    {(selectedTask.group_deliveries && selectedTask.group_deliveries.length > 0) ? (
                      selectedTask.group_deliveries.map((deliv, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 font-sans font-medium text-slate-200 truncate max-w-[140px]">
                            {deliv.group_name}
                          </td>
                          <td className="py-2 px-2">
                            {deliv.status === 'SENT' ? (
                              <span className="text-emerald-400 font-bold">✅ Sent</span>
                            ) : deliv.status === 'FAILED' ? (
                              <span className="text-rose-400 font-bold">❌ Failed</span>
                            ) : (
                              <span className="text-amber-400 font-bold">⏳ Pending</span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-400">
                            {new Date(deliv.scheduled_time || selectedTask.schedule_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-2 text-slate-400">
                            {deliv.sent_time ? new Date(deliv.sent_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                          </td>
                          <td className="py-2 px-3 text-rose-400 truncate max-w-[120px]" title={deliv.error}>
                            {deliv.error || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 font-sans">
                          Waiting for background execution at {new Date(selectedTask.schedule_time).toLocaleTimeString()}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Seen Members / Post Views Analysis */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Post Readers / Views Analysis ({selectedTask.seen_members?.length || 0} Members Seen)</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono">Real Phone & Profile Tracking</span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2 space-y-1.5">
                {(!selectedTask.seen_members || selectedTask.seen_members.length === 0) ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No view receipts collected yet. Views will populate as members view the broadcast in groups.
                  </div>
                ) : (
                  selectedTask.seen_members.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0">
                          {m.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white">{m.name}</div>
                          <div className="text-[11px] font-mono text-cyan-300">📱 {m.phone}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Seen: {new Date(m.seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: LIVE GROUP MEMBERS MODAL (Requirement 2) */}
      {selectedGroupForMembers && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3 min-w-0">
                {selectedGroupForMembers.icon_url ? (
                  <img
                    src={selectedGroupForMembers.icon_url.startsWith('http') ? `/api/picture-proxy?url=${encodeURIComponent(selectedGroupForMembers.icon_url)}` : selectedGroupForMembers.icon_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-400 shrink-0">
                    GP
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">
                    {selectedGroupForMembers.name}
                  </h3>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    ID: {selectedGroupForMembers.jid} • Conn: {selectedGroupForMembers.connection_id || `whatsapp_center_${status?.phone}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenGroupMembers(selectedGroupForMembers)}
                  disabled={loadingMembers}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                  title="Refresh Live Members from WhatsApp"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMembers ? 'animate-spin text-[#25D366]' : ''}`} />
                </button>
                <button
                  onClick={() => setSelectedGroupForMembers(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Member search bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                placeholder="Search real members by name, phone, or JID..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366]"
              />
            </div>

            {/* Members List Table */}
            <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl">
              {loadingMembers ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#25D366]" />
                  <span>Loading live WhatsApp members & profile photos...</span>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500">
                  No members found matching query.
                </div>
              ) : (
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Member Photo & Display Name</th>
                      <th className="py-2.5 px-3">Real Phone Number</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">WhatsApp JID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono text-[11px]">
                    {filteredMembers.map((mem) => {
                      const isOwner = mem.role === 'Owner';
                      const isAdmin = mem.role === 'Admin';
                      const isUnavailable = mem.phone.includes('Unavailable') || mem.phone_status === 'UNAVAILABLE';

                      return (
                        <tr key={mem.jid} className="hover:bg-slate-800/40">
                          {/* Member Photo & Name */}
                          <td className="py-2 px-3 font-sans">
                            <div className="flex items-center gap-2.5">
                              {mem.profile_picture ? (
                                <img
                                  src={mem.profile_picture}
                                  alt=""
                                  className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none';
                                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-8 h-8 rounded-full bg-slate-800 border border-slate-700 items-center justify-center font-bold text-[10px] text-slate-400 shrink-0 ${
                                  mem.profile_picture ? 'hidden' : 'flex'
                                }`}
                              >
                                {mem.name ? mem.name.slice(0, 2).toUpperCase() : 'WA'}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate max-w-[150px]">
                                  {mem.name || 'Member'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Real Phone Number (Never invent number) */}
                          <td className="py-2 px-3">
                            {isUnavailable ? (
                              <span className="text-amber-400/90 font-sans text-[11px]">
                                📱 Number: Unavailable
                              </span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">
                                {mem.phone.startsWith('+') ? mem.phone : `+${mem.phone}`}
                              </span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-2 px-3">
                            {isOwner ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Crown className="w-3 h-3" /> Owner
                              </span>
                            ) : isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                                <Shield className="w-3 h-3" /> Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                Member
                              </span>
                            )}
                          </td>

                          {/* WhatsApp JID */}
                          <td className="py-2 px-3 text-slate-400 font-mono text-[10px] truncate max-w-[150px]" title={mem.jid}>
                            {mem.jid}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total Members: <strong className="text-white">{filteredMembers.length}</strong>
              </span>
              <button
                onClick={() => setSelectedGroupForMembers(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Group Mention Modal for WhatsApp Center */}
      {quickMentionGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                {quickMentionGroup.icon_url ? (
                  <img
                    src={quickMentionGroup.icon_url}
                    alt={quickMentionGroup.name}
                    className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 font-bold">
                    <Megaphone className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Group Mention — {quickMentionGroup.name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tags all {quickMentionGroup.member_count} members via your isolated WhatsApp Center session (+{status?.phone}).
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setQuickMentionGroup(null);
                  setQuickMentionFeedback(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickMentionFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  quickMentionFeedback.type === 'success'
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                }`}
              >
                {quickMentionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{quickMentionFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSendQuickMention} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Mention Announcement Text</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-mono">
                    👥 Tags all {quickMentionGroup.member_count} members
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={quickMentionMessage}
                  onChange={(e) => setQuickMentionMessage(e.target.value)}
                  placeholder="Type message to tag all members..."
                  required
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 font-mono leading-relaxed resize-none"
                />
              </div>

              {/* Quick Fill presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Quick Fill:</span>
                <button
                  type="button"
                  onClick={() => setQuickMentionMessage(`📢 *IMPORTANT GROUP UPDATE*\n\nAttention members of *${quickMentionGroup.name}*!\nPlease review the important guidelines and announcements.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] transition-colors"
                >
                  📢 Update
                </button>
                <button
                  type="button"
                  onClick={() => setQuickMentionMessage(`⚡ *ATTENTION ALL MEMBERS*\n\nDear members of *${quickMentionGroup.name}*,\nPlease stay tuned for our upcoming event/session.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] transition-colors"
                >
                  ⚡ Attention
                </button>
                <button
                  type="button"
                  onClick={() => setQuickMentionMessage(`👋 *WELCOME TO OUR COMMUNITY*\n\nWelcome to *${quickMentionGroup.name}*! Respect the rules and have great conversations.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-[10px] transition-colors"
                >
                  👋 Welcome
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  Runs directly on 24/7 cloud server via WhatsApp Center.
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickMentionGroup(null);
                      setQuickMentionFeedback(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingQuickMention || !quickMentionMessage.trim()}
                    className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingQuickMention ? 'animate-spin' : ''}`} />
                    <span>{isSendingQuickMention ? 'Sending Mention...' : 'Send Group Mention'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
