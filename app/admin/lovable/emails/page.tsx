'use client'

// =====================================================
// PÁGINA: Logs de Integração Lovable
// =====================================================
// Auditoria completa com abas: Usuários Criados, E-mails Enviados e Logs Técnicos
// =====================================================

import { useEffect, useState } from 'react'
import { type IntegrationLog } from '@/services/lovable-integration'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import {
  Mail,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Eye,
  User,
  Key,
  Send,
  UserPlus,
  FileText,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type TabType = 'users' | 'emails' | 'logs'

export default function LovableEmailLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<IntegrationLog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Sistema de Abas
  const [activeTab, setActiveTab] = useState<TabType>('users')

  // Filtros
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Modal de detalhes
  const [selectedLog, setSelectedLog] = useState<IntegrationLog | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  // =====================================================
  // CARREGAR LOGS
  // =====================================================

  const loadLogs = async (showToast = false) => {
    setRefreshing(true)

    try {
      const params = new URLSearchParams()
      if (actionFilter !== 'all') params.append('action', actionFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/lovable/logs?${params.toString()}`)
      const result = await response.json()

      if (result.success && result.logs) {
        setLogs(result.logs)
        if (showToast) {
          toast(`✅ ${result.logs.length} logs carregados`)
        }
      } else {
        toast(`❌ ${result.error || 'Erro ao carregar logs'}`, 'error')
      }
    } catch (error) {
      toast(`❌ Erro ao carregar logs`, 'error')
    }

    setRefreshing(false)
    setLoading(false)
  }

  useEffect(() => {
    loadLogs(false) // Não mostrar toast no carregamento inicial/filtros
  }, [actionFilter, statusFilter])

  // =====================================================
  // FILTROS POR ABA
  // =====================================================

  // Filtrar logs de usuários criados
  const userCreatedLogs = logs.filter(log => 
    log.action === 'create_user' || log.action === 'webhook_create_user'
  )

  // Filtrar logs de e-mails enviados
  const emailLogs = logs.filter(log => 
    log.action === 'send_email' || log.action.includes('email')
  )

  // Logs técnicos (todos os logs)
  const technicalLogs = logs

  // Determinar quais logs mostrar baseado na aba ativa
  const getDisplayLogs = () => {
    switch (activeTab) {
      case 'users':
        return userCreatedLogs
      case 'emails':
        return emailLogs
      case 'logs':
        return technicalLogs
      default:
        return logs
    }
  }

  const displayLogs = getDisplayLogs()

  // =====================================================
  // UTILITÁRIOS
  // =====================================================

  const getActionIcon = (action: string) => {
    if (action.includes('user')) return <User className="h-4 w-4" />
    if (action.includes('password')) return <Key className="h-4 w-4" />
    if (action.includes('email')) return <Mail className="h-4 w-4" />
    return <Send className="h-4 w-4" />
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create_user: 'Criar Usuário',
      webhook_create_user: 'Criar Usuário (Webhook)',
      reset_password: 'Reset Senha',
      list_users: 'Listar Usuários',
      send_email: 'Enviar E-mail',
      deactivate_user: 'Desativar Usuário',
      reactivate_user: 'Reativar Usuário',
      delete_user: 'Excluir Usuário',
    }
    return labels[action] || action
  }

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return (
        <Badge 
          style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 600 }}
          className="flex items-center gap-1 border-0 whitespace-nowrap"
        >
          <CheckCircle className="h-3 w-3" />
          Sucesso
        </Badge>
      )
    }
    if (status === 'error') {
      return (
        <Badge 
          style={{ backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 600 }}
          className="flex items-center gap-1 border-0 whitespace-nowrap"
        >
          <XCircle className="h-3 w-3" />
          Erro
        </Badge>
      )
    }
    return (
      <Badge 
        style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 600 }}
        className="flex items-center gap-1 border-0 whitespace-nowrap"
      >
        <Clock className="h-3 w-3" />
        Pendente
      </Badge>
    )
  }

  const formatDate = (date?: string) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const openDetails = (log: IntegrationLog) => {
    setSelectedLog(log)
    setDetailsOpen(true)
  }

  // =====================================================
  // STATS
  // =====================================================

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === 'success').length,
    error: logs.filter((l) => l.status === 'error').length,
    pending: logs.filter((l) => l.status === 'pending').length,
  }

  // =====================================================
  // RENDER
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
            <Mail className="h-8 w-8 text-white" />
            Logs de Integração Lovable
          </h1>
          <p className="text-gray-300 mt-1">
            Auditoria completa com visões específicas
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadLogs(true)}
          disabled={refreshing}
          className="border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Sistema de Abas */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'users'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Usuários Criados
          <Badge 
            className="ml-1"
            style={{ backgroundColor: activeTab === 'users' ? '#3b82f6' : '#374151', color: '#ffffff' }}
          >
            {userCreatedLogs.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'emails'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Mail className="h-4 w-4" />
          E-mails Enviados
          <Badge 
            className="ml-1"
            style={{ backgroundColor: activeTab === 'emails' ? '#10b981' : '#374151', color: '#ffffff' }}
          >
            {emailLogs.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <FileText className="h-4 w-4" />
          Logs Técnicos
          <Badge 
            className="ml-1"
            style={{ backgroundColor: activeTab === 'logs' ? '#9333ea' : '#374151', color: '#ffffff' }}
          >
            {technicalLogs.length}
          </Badge>
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              {activeTab === 'users' ? 'Usuários' : activeTab === 'emails' ? 'E-mails' : 'Total'}
            </CardTitle>
            <Mail className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="text-3xl font-bold text-white">{displayLogs.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="text-3xl font-bold text-green-400">
              {displayLogs.filter(l => l.status === 'success').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Erros</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="text-3xl font-bold text-red-400">
              {displayLogs.filter(l => l.status === 'error').length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="text-3xl font-bold text-yellow-400">
              {displayLogs.filter(l => l.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros - Apenas na aba de Logs Técnicos */}
      {activeTab === 'logs' && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-200">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block text-gray-300">Ação</label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200">
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    <SelectItem value="create_user">Criar Usuário</SelectItem>
                    <SelectItem value="webhook_create_user">Criar Usuário (Webhook)</SelectItem>
                    <SelectItem value="reset_password">Reset Senha</SelectItem>
                    <SelectItem value="deactivate_user">Desativar Usuário</SelectItem>
                    <SelectItem value="reactivate_user">Reativar Usuário</SelectItem>
                    <SelectItem value="delete_user">Excluir Usuário</SelectItem>
                    <SelectItem value="list_users">Listar Usuários</SelectItem>
                    <SelectItem value="send_email">Enviar E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block text-gray-300">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="success">Sucesso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-200">
            {activeTab === 'users' && 'Histórico de Usuários Criados'}
            {activeTab === 'emails' && 'Histórico de E-mails Enviados'}
            {activeTab === 'logs' && 'Registros de Log Técnicos'}
          </CardTitle>
          <CardDescription className="text-gray-400">
            {activeTab === 'users' && 'Todos os usuários criados manual ou automaticamente'}
            {activeTab === 'emails' && 'Todos os e-mails enviados pelo sistema'}
            {activeTab === 'logs' && 'Histórico completo de todas as operações realizadas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption className="text-gray-400">
              {displayLogs.length === 0 
                ? 'Nenhum registro encontrado' 
                : `Total: ${displayLogs.length} registro${displayLogs.length > 1 ? 's' : ''}`
              }
            </TableCaption>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-200">Data/Hora</TableHead>
                <TableHead className="text-gray-200">
                  {activeTab === 'users' ? 'Nome/E-mail' : activeTab === 'emails' ? 'Assunto' : 'Ação'}
                </TableHead>
                <TableHead className="text-gray-200">Status</TableHead>
                {activeTab === 'logs' && <TableHead className="text-gray-200">Destinatário</TableHead>}
                {activeTab === 'logs' && <TableHead className="text-gray-200">HTTP</TableHead>}
                <TableHead className="text-right text-gray-200">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayLogs.map((log) => (
                <TableRow key={log.id} className="border-gray-700">
                  <TableCell className="text-xs text-gray-400">
                    {formatDate(log.created_at)}
                  </TableCell>
                  <TableCell>
                    {activeTab === 'users' ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {log.details?.user_name || log.details?.name || '-'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {log.details?.email || log.recipient_email || '-'}
                        </span>
                      </div>
                    ) : activeTab === 'emails' ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">
                          {log.details?.subject || 'E-mail enviado'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Para: {log.recipient_email || '-'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium text-white">
                          {getActionLabel(log.action)}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.status)}</TableCell>
                  {activeTab === 'logs' && (
                    <TableCell className="text-sm text-gray-300">
                      {log.recipient_email || '-'}
                    </TableCell>
                  )}
                  {activeTab === 'logs' && (
                    <TableCell>
                      {log.http_status_code && (
                        <Badge 
                          style={{ 
                            backgroundColor: log.http_status_code < 400 ? '#10b981' : '#ef4444',
                            color: '#ffffff',
                            fontWeight: 600
                          }}
                          className="border-0"
                        >
                          {log.http_status_code}
                        </Badge>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetails(log)}
                      className="text-blue-400 hover:text-blue-300 hover:bg-gray-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog: Detalhes */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">Detalhes do Log</DialogTitle>
            <DialogDescription className="text-gray-400">
              Informações completas sobre a operação
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">ID</label>
                  <p className="text-sm font-mono text-gray-200">{selectedLog.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Data/Hora</label>
                  <p className="text-sm text-gray-200">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Ação</label>
                  <p className="text-sm text-gray-200">{getActionLabel(selectedLog.action)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                {selectedLog.recipient_email && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Destinatário
                    </label>
                    <p className="text-sm text-gray-200">{selectedLog.recipient_email}</p>
                  </div>
                )}
                {selectedLog.http_status_code && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Código HTTP
                    </label>
                    <p className="text-sm text-gray-200">{selectedLog.http_status_code}</p>
                  </div>
                )}
              </div>

              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Mensagem de Erro
                  </label>
                  <pre className="mt-1 p-3 bg-red-900/30 text-red-300 rounded text-xs overflow-x-auto">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Detalhes</label>
                  <pre className="mt-1 p-3 bg-gray-700 text-gray-200 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.request_payload && (
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Request Payload
                  </label>
                  <pre className="mt-1 p-3 bg-blue-900/30 text-blue-300 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.request_payload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.response_payload && (
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Response Payload
                  </label>
                  <pre className="mt-1 p-3 bg-green-900/30 text-green-300 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.response_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
