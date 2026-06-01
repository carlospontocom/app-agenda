import axios from 'axios'
import type { CepResponse } from '../types'

const viaCep = axios.create({
  baseURL: 'https://viacep.com.br/ws'
})

export async function buscarCep(cep: string): Promise<CepResponse> {
  const cleaned = cep.replace(/\D/g, '')
  if (cleaned.length !== 8) throw new Error('CEP deve ter 8 dígitos')
  const { data } = await viaCep.get<CepResponse>(`/${cleaned}/json/`)
  if (data.erro) throw new Error('CEP não encontrado')
  return data
}
