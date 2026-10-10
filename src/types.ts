export interface StatusTaskGroupResult {
  group_jid: string;
  group_name: string;
  status: 'SENT' | 'FAILED' | 'PENDING';
  error?: string;
  sent_at?: string;
}

export interface StatusTask {
  id: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'text' | 'none';
  caption: string;
  target_mode: 'ALL_GROUPS' | 'SELECTED_GROUPS';
  target_groups: string[];
  scheduled_time: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED';
  total_groups: number;
  sent_count: number;
  failed_count: number;
  results: StatusTaskGroupResult[];
  created_at: string;
  executed_at?: string;
}

export interface Group {
  jid: string;
  name: string;
  is_active: boolean;
  is_locked?: boolean;
  member_count: number;
  admin_count?: number;
  icon_url?: string | null;
  rules_text: string;
  welcome_enabled: boolean;
  welcome_template_type: 'default' | 'compact';
  kick_announcement_enabled: boolean;
  anti_link_enabled: boolean;
  anti_view_channel_enabled: boolean;
  bad_words_enabled: boolean;
  bad_words_list: string;
  anti_flood_enabled: boolean;
  flood_message_limit: number;
  flood_window_seconds: number;
  scam_keyword_watch_enabled: boolean;
  scam_keywords: string;
  night_mode_enabled: boolean;
  night_mode_start: string;
  night_mode_end: string;
  goodbye_enabled: boolean;
  created_at: string;
  last_activity?: string;
}

export interface Member {
  id: string;
  connection_id?: string;
  group_jid: string;
  group_name?: string;
  sender_jid: string;
  participant_lid?: string;
  phone: string;
  phone_status?: 'AVAILABLE' | 'UNAVAILABLE';
  name: string;
  push_name?: string;
  profile_name?: string;
  profile_picture_reference?: string | null;
  role?: 'admin' | 'superadmin' | 'participant' | 'bot';
  warnings_count: number;
  kicks_count?: number;
  deleted_messages_count?: number;
  link_violations_count?: number;
  online_status?: 'ONLINE' | 'OFFLINE';
  times_left?: number;
  is_banned: boolean;
  joined_at: string;
  first_seen?: string;
  join_time?: string;
  last_active: string;
  last_seen?: string;
  last_event?: string;
  member_status?: 'ACTIVE' | 'WARNED' | 'REMOVED' | 'BANNED';
  updated_at?: string;
  created_at?: string;
}

export interface AutoSenderGroup {
  jid: string;
  name: string;
  member_count: number;
  is_active: boolean;
  icon_url?: string | null;
  can_send?: boolean;
  role?: 'Owner' | 'Admin' | 'Member' | string;
  is_admin?: boolean;
  is_announcement?: boolean;
  connection_id?: string;
  updated_at?: string;
}

export interface GroupDeliveryRecord {
  group_id: string;
  group_name: string;
  group_icon?: string | null;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED' | 'RETRYING' | 'DELETED' | string;
  scheduled_time: string;
  sent_time?: string;
  sent_at?: string;
  last_attempt_time?: string;
  next_scheduled_time?: string;
  attempts_count?: number;
  error?: string;
  message_id?: string;
  message_key?: any;
  deleted_at?: string;
  deletion_status?: 'NOT_DELETED' | 'DELETED' | 'FAILED' | 'UNSUPPORTED';
  deletion_error?: string;
}

export interface AutoSenderTask {
  post_id?: string;
  id: string;
  connection_id?: string;
  image_url?: string;
  image_path?: string;
  image_filename?: string;
  image_size?: string;
  image_dimensions?: string;
  tool_name?: string;
  head_name?: string;
  order_id?: string;
  image_alt_text?: string;
  message: string;
  target_group_jids: string[];
  target_group_names: string[];
  selected_group_ids?: string[];
  selected_group_names?: string[];
  target_group_details?: Array<{
    jid: string;
    name: string;
    icon_url?: string | null;
    member_count?: number;
    can_send?: boolean;
    role?: string;
  }>;
  schedule_time: string;
  schedule_mode: 'IMMEDIATE' | 'SCHEDULED';
  status: 'ACTIVE' | 'SCHEDULED' | 'SENDING' | 'PAUSED' | 'BLOCKED' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'CANCELLED' | 'PENDING' | 'EXECUTING' | 'EXPIRED' | 'DELETED' | string;
  is_blocked?: boolean;
  created_at: string;
  executed_at?: string;
  sent_at?: string;
  completed_at?: string;
  execution_status?: string;
  total_groups: number;
  sent_count: number;
  failed_count: number;
  pending_count?: number;
  deleted_sent_count?: number;
  views_count?: number;
  posts_per_day?: number;
  start_time?: string;
  end_time?: string;
  interval_hours?: number;
  group_interval_seconds?: number;
  calculated_interval?: string;
  generated_times?: string[];
  validity_duration?: string;
  active_duration_months?: number;
  start_date?: string;
  expires_at?: string;
  remaining_active_days?: number;
  next_execution_time?: string | null;
  scheduled_target_timestamp?: number;
  schedule_version?: number;
  schedule_updated_at?: string;
  last_posting_time?: string | null;
  paused_at?: string | null;
  blocked_at?: string | null;
  seen_members?: Array<{
    jid: string;
    phone: string;
    name: string;
    profile_picture: string | null;
    seen_at: string;
  }>;
  group_deliveries?: GroupDeliveryRecord[];
  logs?: Array<{
    group_jid: string;
    group_name: string;
    status: 'SENT' | 'FAILED';
    sent_at: string;
    error?: string;
    message_id?: string;
  }>;
  mention_all?: boolean;
  r_tag_enabled?: boolean;
  image_decoration?: string;
  badge_overlay?: string;
  notification_headline?: string;
  is_status_notification?: boolean;
  is_draft?: boolean;
  media_type?: 'image' | 'video' | 'text';
  video_url?: string;
  video_path?: string;
  video_filename?: string;
  video_size?: string;
  cta_link?: string;
  cta_label?: string;
  tracking_id?: string;
  tracking_url?: string;
  link_clicks?: number;
  unique_clicks?: number;
  click_logs?: Array<{ timestamp: string; ip_hash?: string; user_agent?: string }>;
  status_publishing_state?: 'DRAFT' | 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED';
  status_message_id?: string;
  status_published_at?: string;
  status_publishing_error?: string;
  selected_account_phone?: string;
  selected_account_name?: string;
  history_timeline?: Array<{
    id: string;
    event: 'DRAFT_SAVED' | 'STATUS_PUBLISH_STARTED' | 'STATUS_PUBLISHED' | 'STATUS_PUBLISH_FAILED' | 'GROUP_FORWARD_STARTED' | 'GROUP_FORWARD_SUCCESS' | 'GROUP_FORWARD_FAILED' | 'RETRY_INITIATED';
    title: string;
    description: string;
    timestamp: string;
    status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'INFO';
    group_id?: string;
    group_name?: string;
    error?: string;
    message_id?: string;
  }>;
}

export interface ScamReportProof {
  id: string;
  type: 'IMAGE' | 'AUDIO' | 'DOCUMENT';
  url: string;
  path?: string;
  filename: string;
  size?: string;
}

export interface ScamReportTask {
  id: string;
  title: string;
  reported_number: string;
  description: string;
  proof_images: string[];
  proof_audios: string[];
  proof_files?: ScamReportProof[];
  target_group_jids: string[];
  target_group_names: string[];
  status: 'DRAFT' | 'SENT' | 'SENDING' | 'PARTIALLY_SENT' | 'FAILED';
  created_at: string;
  sent_at?: string;
  total_groups: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  group_deliveries?: GroupDeliveryRecord[];
  logs?: Array<{
    group_jid: string;
    group_name: string;
    status: 'SENT' | 'FAILED';
    sent_at: string;
    error?: string;
    message_id?: string;
  }>;
}

export interface TrustedPostProof {
  id: string;
  type: 'IMAGE' | 'DOCUMENT' | 'AUDIO';
  url: string;
  path?: string;
  filename: string;
  size?: string;
}

export interface TrustedPostTask {
  id: string;
  title: string;
  trusted_name: string;
  contact_info: string;
  description: string;
  image_url?: string;
  image_filename?: string;
  document_url?: string;
  document_filename?: string;
  audio_url?: string;
  audio_filename?: string;
  proof_files?: TrustedPostProof[];
  target_group_jids: string[];
  target_group_names: string[];
  schedule_mode: 'IMMEDIATE' | 'SCHEDULED';
  schedule_time?: string;
  status: 'DRAFT' | 'ACTIVE' | 'SCHEDULED' | 'SENDING' | 'PAUSED' | 'COMPLETED' | 'PARTIALLY_COMPLETED' | 'FAILED' | 'CANCELLED';
  created_at: string;
  sent_at?: string;
  next_execution_time?: string | null;
  total_groups: number;
  sent_count: number;
  failed_count: number;
  pending_count: number;
  group_deliveries?: GroupDeliveryRecord[];
  logs?: Array<{
    group_jid: string;
    group_name: string;
    status: 'SENT' | 'FAILED';
    sent_at: string;
    error?: string;
    message_id?: string;
  }>;
}

export interface CenterMember {
  jid: string;
  phone: string;
  phone_status: 'AVAILABLE' | 'UNAVAILABLE';
  name: string;
  role: 'Owner' | 'Admin' | 'Member';
  profile_picture?: string | null;
  connection_id?: string;
}

export interface CenterGroup {
  jid: string;
  name: string;
  subject?: string;
  connection_id?: string;
  member_count: number;
  participants_count?: number;
  is_active: boolean;
  can_send?: boolean;
  role?: 'Owner' | 'Admin' | 'Member' | string;
  is_admin?: boolean;
  is_announcement?: boolean;
  icon_url: string | null;
  profile_picture_url?: string | null;
  members?: CenterMember[];
  updated_at?: string;
}

export interface WhatsAppCenterStatus {
  customer_id?: string;
  connection_id: string | null;
  status: 'UNLINKED' | 'INITIALIZING' | 'WAITING_FOR_QR' | 'QR_AVAILABLE' | 'SCANNED' | 'AUTHENTICATING' | 'AUTHENTICATED' | 'READY' | 'CONNECTED' | 'DISCONNECTED' | 'RESTORING_SESSION';
  workerStatus: 'RUNNING' | 'RECOVERING' | 'STOPPED';
  phone: string;
  hasQr: boolean;
  qrDataUrl: string;
  rawQrString: string | null;
  pairingCode?: string | null;
  qrExpiresInSeconds: number;
  socketStatusMessage: string;
  connectedAt: string | null;
  profile: ConnectionProfile | null;
  groups_count: number;
  tasks_count: number;
  vps_specs: {
    ram_gb: number;
    ram_display: string;
    worker_engine: string;
    isolation_mode: string;
  };
}

export interface AdminPromotionRecord {
  id: string;
  group_jid: string;
  group_name: string;
  member_id: string;
  participant_jid: string;
  phone: string;
  member_name: string;
  promoted_by?: string;
  created_at: string;
}

export interface IdentityServerStatus {
  serverStatus: 'ONLINE' | 'OFFLINE';
  eventListener: 'ACTIVE' | 'INACTIVE';
  identityResolver: 'ACTIVE' | 'INACTIVE';
  databaseConnected: boolean;
  totalMembersCount: number;
  lastEventTime: string;
  lastEventAction: string;
  successfulResolutions: number;
  failedResolutions: number;
}

export interface WarningRecord {
  id: string;
  group_jid: string;
  group_name: string;
  sender_jid: string;
  phone: string;
  member_name: string;
  warning_number: number;
  reason: string;
  rule_type: string;
  is_active: boolean;
  created_at: string;
}

export interface KickRecord {
  id: string;
  group_jid: string;
  group_name: string;
  sender_jid: string;
  phone: string;
  member_name: string;
  reason: string;
  rule_trigger: string;
  created_at: string;
}

export interface BlacklistRecord {
  id: string;
  phone: string;
  reason: string;
  added_by: string;
  created_at: string;
}

export interface TrustReview {
  id: string;
  target_phone: string;
  target_name: string;
  reviewer_phone: string;
  reviewer_name: string;
  rating: number;
  label?: string;
  review_text: string;
  source_type?: 'ADMIN' | 'MEMBER';
  group_name?: string;
  status: 'APPROVED' | 'DISPUTED';
  created_at: string;
}

export interface AdminIssue {
  id: string;
  ticket_id: string;
  group_jid: string;
  group_name: string;
  member_jid: string;
  member_phone: string;
  member_name: string;
  issue_description: string;
  assigned_admin: string;
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED';
  created_at: string;
  resolved_at?: string;
  admin_notes?: string;
}

export interface ActivityLog {
  id: string;
  level: 'INFO' | 'ACTION_SUCCESS' | 'WARNING_ISSUED' | 'KICK_EXECUTED' | 'ERROR';
  event_type: string;
  group_jid?: string;
  group_name?: string;
  actor_jid?: string;
  target_jid?: string;
  details: string;
  created_at: string;
}

export interface ConsoleLog {
  id: string;
  timestamp: string;
  level: 'SUCCESS' | 'WARN' | 'DANGER' | 'INFO';
  tag: string;
  message: string;
}

export interface ConnectionProfile {
  name: string;
  phone: string;
  pictureUrl: string | null;
  status: 'CONNECTED' | 'RECOVERING' | 'DISCONNECTED';
  connectedAt: string | null;
  activatedAt: string | null;
  lastHeartbeat: string;
  serverRole: 'PRIMARY' | 'BACKUP';
  serverHost: string;
  version: string; // 'A2-4'
  sessionHealth: 'EXCELLENT' | 'DEGRADED' | 'OFFLINE';
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  totalMembers: number;
}

export interface CommandAuditItem {
  id: string;
  command: string;
  category: 'MEMBER' | 'ADMIN' | 'DIAGNOSTIC' | 'MODERATION';
  description: string;
  backendReceived: boolean;
  whatsappExecuted: boolean;
  resultVerified: boolean;
  outputPreview: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  testedAt: string;
}

export interface CommandAuditSummary {
  total: number;
  tested: number;
  passed: number;
  failed: number;
  notTested: number;
  lastRunAt: string;
  items: CommandAuditItem[];
}

export interface FailoverConfig {
  enabled: boolean;
  primaryUrl: string;
  backupUrl: string;
  activeNode: 'PRIMARY' | 'BACKUP';
  healthStatus: 'HEALTHY' | 'FAILOVER_ACTIVE' | 'ALL_DOWN';
  lastPing: string;
}

export interface BotStatus {
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
  workerStatus: 'RUNNING' | 'RECOVERING' | 'STOPPED';
  uptimeSeconds: number;
  botPhone: string;
  botName: string;
  ownerPhone?: string;
  adminPhone?: string;
  supportNumber?: string;
  warningLimit?: number;
  memberProfilePhoto?: boolean;
  pairingCode: string | null;
  hasQr: boolean;
  qrDataUrl: string;
  qrDataUrlRaw?: string;
  rawQrString: string | null;
  qrExpiresInSeconds: number;
  socketStatusMessage: string;
  isRealBaileys: boolean;
  version: string; // 'A2-4'
  serverNode: string;
  connectedAt: string | null;
  activatedAt: string | null;
  lastHeartbeat: string;
  profile: ConnectionProfile | null;
  failover: FailoverConfig;
  publicAppUrl?: string;
  stats: {
    active_groups: number;
    total_groups: number;
    total_members: number;
    warnings_today: number;
    kicks_today: number;
    total_kicks: number;
    blacklist_count: number;
    reviews_count: number;
    admin_issues_pending?: number;
  };
  vps_specs?: {
    ram_gb: number;
    ram_display: string;
    worker_engine: string;
    dual_sessions_active: boolean;
  };
}

export interface MessageEngineStatus {
  id: string;
  name: string;
  category: 'CORE' | 'DEFENSE' | 'ENGAGEMENT' | 'DISPATCH';
  status: 'ONLINE' | 'ACTIVE' | 'STANDBY' | 'DEGRADED' | 'DISABLED';
  description: string;
  trigger_rule: string;
  metrics: {
    processedCount: number;
    successCount: number;
    failureCount: number;
    lastTriggeredAt: string | null;
    avgLatencyMs: number;
  };
}

export interface ProcessedMessageLog {
  id: string;
  timestamp: string;
  sender_phone: string;
  sender_name?: string;
  group_name: string;
  group_jid: string;
  message_snippet: string;
  engine_triggered: string;
  outcome: 'DELIVERED' | 'INTERCEPTED' | 'DELETED' | 'BLOCKED' | 'WARNED' | 'KICKED';
  details: string;
  latency_ms: number;
}

export interface MessageStatusReport {
  overall_status: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  worker_mode: '24_7_BACKGROUND';
  server_host: string;
  uptime_seconds: number;
  last_heartbeat: string;
  total_messages_processed: number;
  messages_per_minute: number;
  total_commands_executed: number;
  total_links_blocked: number;
  total_warnings_issued: number;
  total_kicks_executed: number;
  engines: MessageEngineStatus[];
  recent_messages: ProcessedMessageLog[];
}

export interface SamePostViolation {
  id: string;
  sender_phone: string;
  sender_jid: string;
  sender_name: string;
  group_jid: string;
  group_name: string;
  message_preview: string;
  attempt_number: number;
  limit: number;
  removed_at: string;
  status: 'REMOVED_AND_WARNED';
}

export interface SamePostSettings {
  enabled: boolean;
  limit: number;
  window_hours: number;
  custom_warning_template?: string;
  total_violations_count: number;
  total_tracked_messages: number;
}

export interface MessageFingerprint {
  id: string;
  fingerprint: string;
  sender_phone: string;
  sender_jid: string;
  sender_name?: string;
  group_jid: string;
  group_name?: string;
  post_content: string;
  normalized_text: string;
  attempt_number: number;
  timestamp: number;
  created_at: string;
  expires_at: string;
  status: 'ALLOWED' | 'EXCEEDED_LIMIT_REMOVED';
  source?: string;
}

export interface ResellerLicenseUser {
  id: string;
  key: string;
  username: string;
  plan_months: number;
  plan_days: number;
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'REVOKED';
  created_at: string;
  activated_at?: string | null;
  expires_at?: string | null;
  remaining_days?: number;
  has_group_control: boolean;
  has_whatsapp_center: boolean;
  allowed_features: string[];
  notes?: string;
  reseller_id: string;
}

export interface ResellerState {
  is_active_license: boolean;
  active_user: ResellerLicenseUser | null;
  is_master_admin: boolean;
  status_label: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'MASTER_ADMIN';
  remaining_days: number;
  activation_date?: string | null;
  expiry_date?: string | null;
  allowed_features: string[];
  has_whatsapp_center: boolean;
  has_group_control: boolean;
}

export interface AutoSenderStatus {
  status: 'DISCONNECTED' | 'WAITING_FOR_QR' | 'PAIRING_CODE' | 'QR_AVAILABLE' | 'CONNECTED' | 'STOPPED' | 'CONNECTING' | string;
  workerStatus: 'RUNNING' | 'STOPPED' | 'RECOVERING' | string;
  phone?: string;
  name?: string;
  pictureUrl?: string | null;
  profile?: {
    name?: string;
    phone?: string;
    pictureUrl?: string | null;
    status?: string;
    connectedAt?: string;
  } | null;
  qrDataUrl?: string;
  rawQr?: string;
  qrExpiresAt?: number;
  pairingCode?: string | null;
  socketStatusMessage?: string;
  groups_count: number;
  tasks_count: number;
  groupsCount?: number;
  tasksCount?: number;
  authenticated: boolean;
  connectedAt?: string | null;
  connected_at?: string | null;
  lastHeartbeat?: string;
}


