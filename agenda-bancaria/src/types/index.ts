export interface User {
  id?: number
  nome: string
  genero: string
  data_nascimento: string
  telefone: string
  docPessoal: string
  email: string
  senha: string
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  complemento: string
  numero: string
  createdAt?: string
  ativo?: boolean
}

export interface Appointment {
  id?: number
  userId: number
  userName: string
  userDoc: string
  servicos: string[]
  agencia: string
  data: string
  hora: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt?: string
}

export interface CepResponse {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export type Servico = 'Abrir nova conta' | 'Renegociar Dívidas' | 'Saque Volumoso' | 'Configurar app' | 'Cartão de Crédito' | 'Transferência / Pix'

export type StatusAgendamento = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export const MAX_SERVICOS = 2

export const AGENCIAS = [
  'Agência Central',
  'Agência Norte',
  'Agência Sul',
  'Agência Leste',
  'Agência Oeste'
]

export const SERVICOS: Servico[] = [
  'Abrir nova conta',
  'Renegociar Dívidas',
  'Saque Volumoso',
  'Configurar app',
  'Cartão de Crédito',
  'Transferência / Pix'
]

export const STATUS_MAP: Record<StatusAgendamento, string> = {
  pending: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado'
}

export function formatDate(data: string): string {
  if (!data) return ''
  const partes = data.split('T')[0].split('-')
  if (partes.length !== 3) return data
  const [ano, mes, dia] = partes
  return `${dia}/${mes}/${ano}`
}

export function formatarStatusAgendamento(app: { status: StatusAgendamento; data: string }): string {
  if (app.status === 'pending') {
    return `Agendado para o dia ${formatDate(app.data)}`
  }
  return STATUS_MAP[app.status]
}

export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 9; h < 15; h++) {
    for (let m = 0; m < 60; m += 20) {
      slots.push(`${String(h).padStart(2, '0')}h${String(m).padStart(2, '0')}`)
    }
  }
  slots.push('14h40')
  return slots
}

export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getProximosDiasUteis(): { label: string; value: string; diaSemana: string }[] {
  const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const result: { label: string; value: string; diaSemana: string }[] = []
  const hoje = new Date()
  let count = 0
  for (let i = 0; count < 5; i++) {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + i)
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      result.push({
        label: `${dd}/${mm}`,
        value: `${yyyy}-${mm}-${dd}`,
        diaSemana: dias[d.getDay()]
      })
      count++
    }
  }
  return result
}
