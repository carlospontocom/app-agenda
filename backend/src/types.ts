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

export type Servico = 'Abrir nova conta' | 'Renegociar Dívidas' | 'Saque Volumoso' | 'Configurar app' | 'Cartão de Crédito' | 'Transferência / Pix'

export type StatusAgendamento = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Appointment {
  id?: number
  userId: number
  userName: string
  userDoc: string
  servicos: string[]
  agencia: string
  data: string
  hora: string
  status: StatusAgendamento
  createdAt?: string
}

export interface JwtPayload {
  userId: number
  isAdmin: boolean
}
