export type UserRole = 'admin' | 'social_media' | 'client' | 'viewer'
export type PostFormat = 'post_unico' | 'carrossel' | 'story' | 'reels' | 'video' | 'capa' | 'banner' | 'outro'
export type SocialNetwork = 'instagram' | 'linkedin' | 'facebook' | 'tiktok' | 'youtube_shorts' | 'outra'
export type PostPriority = 'baixa' | 'media' | 'alta' | 'urgente'
export type PostStatus = 'rascunho' | 'enviado_aprovacao' | 'aguardando_cliente' | 'ajustes_solicitados' | 'em_ajuste' | 'reenviado_aprovacao' | 'aprovado' | 'publicado' | 'arquivado'
export type VersionStatus = 'rascunho' | 'enviado' | 'ajustes_solicitados' | 'aprovado' | 'arquivado'
export type NotificationType = 'post_enviado_aprovacao' | 'cliente_comentou' | 'ajuste_solicitado' | 'post_aprovado' | 'prazo_proximo' | 'prazo_vencido' | 'nova_versao_enviada' | 'post_publicado'
export type ActionType = 'post_criado' | 'post_editado' | 'post_excluido' | 'arquivo_enviado' | 'arquivo_excluido' | 'post_enviado_aprovacao' | 'comentario_criado' | 'ajuste_solicitado' | 'nova_versao_enviada' | 'conteudo_aprovado' | 'post_publicado' | 'post_arquivado' | 'status_alterado' | 'cliente_criado' | 'cliente_editado' | 'cliente_excluido'

// Permissões por role
export const ROLE_PERMISSIONS = {
  admin: {
    canCreatePost: true,
    canEditPost: true,
    canDeletePost: true,
    canApprovePost: true,
    canSendForApproval: true,
    canMarkPublished: true,
    canManageClients: true,
    canManageUsers: true,
    canViewReports: true,
    canComment: true,
    canUploadFiles: true,
  },
  social_media: {
    canCreatePost: true,
    canEditPost: true,
    canDeletePost: false,
    canApprovePost: false,
    canSendForApproval: true,
    canMarkPublished: true,
    canManageClients: false,
    canManageUsers: false,
    canViewReports: true,
    canComment: true,
    canUploadFiles: true,
  },
  client: {
    canCreatePost: false,
    canEditPost: false,
    canDeletePost: false,
    canApprovePost: true,
    canSendForApproval: false,
    canMarkPublished: false,
    canManageClients: false,
    canManageUsers: false,
    canViewReports: false,
    canComment: true,
    canUploadFiles: false,
  },
  viewer: {
    canCreatePost: false,
    canEditPost: false,
    canDeletePost: false,
    canApprovePost: false,
    canSendForApproval: false,
    canMarkPublished: false,
    canManageClients: false,
    canManageUsers: false,
    canViewReports: false,
    canComment: false,
    canUploadFiles: false,
  },
} as const

export type Permission = keyof typeof ROLE_PERMISSIONS.admin

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  social_media: 'Social Media',
  client: 'Cliente',
  viewer: 'Visualizador',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  social_media: 'bg-blue-100 text-blue-700',
  client: 'bg-green-100 text-green-700',
  viewer: 'bg-gray-100 text-gray-600',
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Workspace {
  id: string
  client_id: string
  name: string
  slug: string
  is_active: boolean
  created_at: string
  client?: Client
}

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: UserRole
  created_at: string
  user?: Profile
}

export interface Client {
  id: string
  name: string
  segment: string | null
  responsible: string | null
  email: string | null
  phone: string | null
  notes: string | null
  logo_url: string | null
  primary_color: string
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  workspace?: Workspace
}

export interface Post {
  id: string
  client_id: string
  title: string
  format: PostFormat
  social_network: SocialNetwork
  scheduled_date: string | null
  approval_deadline: string | null
  responsible_id: string | null
  priority: PostPriority
  caption: string | null
  hashtags: string | null
  cta: string | null
  notes: string | null
  status: PostStatus
  current_version_num: number
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  client?: Client
  responsible?: Profile
  files?: PostFile[]
}

export interface PostVersion {
  id: string
  post_id: string
  version_num: number
  caption: string | null
  hashtags: string | null
  cta: string | null
  notes: string | null
  status: VersionStatus
  created_by: string | null
  created_at: string
  created_by_profile?: Profile
  files?: PostFile[]
}

export interface PostFile {
  id: string
  post_id: string
  version_id: string | null
  original_name: string
  storage_path: string
  public_url: string
  mime_type: string
  size_bytes: number
  carousel_order: number
  uploaded_by: string | null
  created_at: string
  uploaded_by_profile?: Profile
}

export interface Comment {
  id: string
  post_id: string
  version_id: string | null
  user_id: string
  content: string
  parent_id: string | null
  is_system: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  user?: Profile
  replies?: Comment[]
  version?: PostVersion
}

export interface Approval {
  id: string
  post_id: string
  version_id: string
  approved_by: string
  approved_at: string
  notes: string | null
  approved_by_profile?: Profile
  version?: PostVersion
}

export interface ActionLog {
  id: string
  entity: string
  entity_id: string
  action: ActionType
  user_id: string | null
  description: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
  user?: Profile
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  is_read: boolean
  post_id: string | null
  created_at: string
  post?: Post
}

export interface ClientApprovalMetrics {
  client_id: string
  client_name: string
  client_color: string
  total_posts: number
  approved_first_try: number
  requested_adjustments: number
  approval_rate: number
  avg_approval_hours: number | null
}

export interface MonthlyReport {
  client_id: string
  client_name: string
  month: number
  year: number
  total_created: number
  total_approved: number
  total_rejected: number
  total_published: number
  avg_approval_hours: number | null
  posts: Post[]
}

export interface ApiResponse<T = void> {
  data: T | null
  error: string | null
  success: boolean
}

export interface DashboardMetrics {
  total_posts_month: number
  awaiting_approval: number
  approved: number
  adjustments_requested: number
  overdue: number
  published: number
  active_clients: number
}

export const POST_FORMAT_LABELS: Record<PostFormat, string> = {
  post_unico: 'Post Único', carrossel: 'Carrossel', story: 'Story',
  reels: 'Reels', video: 'Vídeo', capa: 'Capa', banner: 'Banner', outro: 'Outro',
}

export const SOCIAL_NETWORK_LABELS: Record<SocialNetwork, string> = {
  instagram: 'Instagram', linkedin: 'LinkedIn', facebook: 'Facebook',
  tiktok: 'TikTok', youtube_shorts: 'YouTube Shorts', outra: 'Outra',
}

export const POST_PRIORITY_LABELS: Record<PostPriority, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', urgente: 'Urgente',
}

export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  rascunho: 'Rascunho', enviado_aprovacao: 'Enviado p/ Aprovação',
  aguardando_cliente: 'Aguardando Cliente', ajustes_solicitados: 'Ajustes Solicitados',
  em_ajuste: 'Em Ajuste', reenviado_aprovacao: 'Reenviado p/ Aprovação',
  aprovado: 'Aprovado', publicado: 'Publicado', arquivado: 'Arquivado',
}

export const POST_STATUS_COLORS: Record<PostStatus, string> = {
  rascunho: 'bg-zinc-100 text-zinc-700',
  enviado_aprovacao: 'bg-blue-100 text-blue-700',
  aguardando_cliente: 'bg-amber-100 text-amber-700',
  ajustes_solicitados: 'bg-orange-100 text-orange-700',
  em_ajuste: 'bg-yellow-100 text-yellow-700',
  reenviado_aprovacao: 'bg-indigo-100 text-indigo-700',
  aprovado: 'bg-green-100 text-green-700',
  publicado: 'bg-emerald-100 text-emerald-700',
  arquivado: 'bg-gray-100 text-gray-500',
}

export const POST_PRIORITY_COLORS: Record<PostPriority, string> = {
  baixa: 'bg-slate-100 text-slate-600',
  media: 'bg-blue-100 text-blue-600',
  alta: 'bg-orange-100 text-orange-600',
  urgente: 'bg-red-100 text-red-700',
}

export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'application/pdf', 'video/mp4']
export const MAX_FILE_SIZE = 50 * 1024 * 1024
