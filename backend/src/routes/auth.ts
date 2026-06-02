import { Router, Request, Response } from 'express'
import { pool } from '../database'
import bcrypt from 'bcryptjs'
import { authenticate, generateToken } from '../middleware/auth'

import type { User } from '../types'
const saltRounds = 10

const router = Router()

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Autenticação]
 *     summary: Registrar novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome: { type: string }
 *               genero: { type: string }
 *               data_nascimento: { type: string }
 *               telefone: { type: string }
 *               docPessoal: { type: string }
 *               email: { type: string }
 *               senha: { type: string }
 *               cep: { type: string }
 *               logradouro: { type: string }
 *               bairro: { type: string }
 *               cidade: { type: string }
 *               uf: { type: string }
 *               complemento: { type: string }
 *               numero: { type: string }
 *     responses:
 *       201: { description: Usuário criado }
 *       409: { description: Email ou documento já cadastrado }
 */
function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (!/^\d{11}$/.test(digits)) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const calc = (mul: number) =>
    digits
      .slice(0, mul - 1)
      .split('')
      .reduce((s, d, i) => s + parseInt(d) * (mul - i), 0) * 10 % 11 % 10

  return calc(10) === parseInt(digits[9]) && calc(11) === parseInt(digits[10])
}

function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (!/^\d{14}$/.test(digits)) return false
  if (/^(\d)\1+$/.test(digits)) return false

  const calc = (mul: number[]) =>
    digits.slice(0, mul.length).split('').reduce((s, d, i) => s + parseInt(d) * mul[i], 0) % 11

  const d1 = (r: number) => r < 2 ? 0 : 11 - r
  if (d1(calc([5,4,3,2,9,8,7,6,5,4,3,2])) !== parseInt(digits[12])) return false
  return d1(calc([6,5,4,3,2,9,8,7,6,5,4,3,2])) === parseInt(digits[13])
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, docPessoal } = req.body
    const docClean = docPessoal.replace(/\D/g, '')

    if (docClean.length <= 11) {
      if (!isValidCPF(docClean)) {
        res.status(400).json({ error: 'CPF inválido' })
        return
      }
    } else {
      if (!isValidCNPJ(docClean)) {
        res.status(400).json({ error: 'CNPJ inválido' })
        return
      }
    }

    const [existing] = await pool.query<any[]>('SELECT id, email FROM usuarios WHERE email = ? OR docPessoal = ?', [email, docPessoal])
    if (existing.length > 0) {
      const field = existing[0].email === email ? 'Email' : 'Documento'
      res.status(409).json({ error: `${field} já cadastrado` })
      return
    }

    const { nome, genero, data_nascimento, telefone, senha, cep, logradouro, bairro, cidade, uf, complemento, numero } = req.body
    const senhaHash = await bcrypt.hash(senha, 10)
    const [result] = await pool.query<any>(
      `INSERT INTO usuarios (nome, genero, data_nascimento, telefone, docPessoal, email, senha, cep, logradouro, bairro, cidade, uf, complemento, numero, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, genero, data_nascimento, telefone, docPessoal, email, senhaHash, cep, logradouro, bairro, cidade, uf, complemento, numero, true]
    )

    res.status(201).json({ id: result.insertId, message: 'Usuário criado com sucesso' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/auth/check:
 *   post:
 *     tags: [Autenticação]
 *     summary: Verificar se CPF ou email já estão cadastrados
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               docPessoal: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Status de cada campo }
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { docPessoal, email } = req.body
    const [rows] = await pool.query<any[]>(
      "SELECT docPessoal, email FROM usuarios WHERE docPessoal = ? OR email = ?",
      [docPessoal, email]
    )
    const existentes = { docPessoal: false, email: false }
    rows.forEach((r: any) => {
      if (r.docPessoal === docPessoal) existentes.docPessoal = true
      if (r.email === email) existentes.email = true
    })
    res.json(existentes)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Login do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               senha: { type: string }
 *     responses:
 *       200: { description: Token JWT + dados do usuário }
 *       401: { description: Credenciais inválidas ou conta inativa }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body
    const [users] = await pool.query<any[]>('SELECT * FROM usuarios WHERE email = ?', [email])

    if (users.length === 0) {
      res.status(401).json({ error: 'Email ou senha inválidos' })
      return
    }

    const user = users[0] as User
    const senhaValida = await bcrypt.compare(senha, user.senha)
    if (!senhaValida) {
      res.status(401).json({ error: 'Email ou senha inválidos' })
      return
    }

    if (user.ativo === false) {
      res.status(401).json({ error: 'Sua conta está inativa. Entre em contato com o administrador.' })
      return
    }

    const isAdmin = user.email === 'admin@gmail.com' || user.email.endsWith('@banco.com')
    const token = generateToken({ userId: user.id!, isAdmin })
    res.json({ token, user: { ...user, isAdmin } })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/auth/recover:
 *   post:
 *     tags: [Autenticação]
 *     summary: Recuperar senha
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               docPessoal: { type: string }
 *               data_nascimento: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Usuário encontrado }
 *       401: { description: Dados não conferem ou conta inativa }
 */
router.post('/recover', async (req: Request, res: Response) => {
  try {
    const { docPessoal, data_nascimento, email } = req.body
    const [users] = await pool.query<any[]>(
      'SELECT * FROM usuarios WHERE docPessoal = ? AND data_nascimento = ? AND email = ?',
      [docPessoal, data_nascimento, email]
    )

    if (users.length === 0) {
      res.status(401).json({ error: 'Dados não conferem' })
      return
    }

    const user = users[0] as User
    if (user.ativo === false) {
      res.status(401).json({ error: 'Sua conta está inativa. Entre em contato com o administrador.' })
      return
    }

    res.json({ message: 'Usuário encontrado', userId: user.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/auth/update-password:
 *   post:
 *     tags: [Autenticação]
 *     summary: Atualizar senha (autenticado)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senha: { type: string }
 *     responses:
 *       200: { description: Senha atualizada }
 */
/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Autenticação]
 *     summary: Redefinir senha (sem token, fluxo de recuperação)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: number }
 *               senha: { type: string }
 *     responses:
 *       200: { description: Senha redefinida }
 */
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { userId, senha } = req.body
    const hashedSenha = await bcrypt.hash(senha, saltRounds)
    await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [hashedSenha, userId])
    res.json({ message: 'Senha redefinida com sucesso' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/update-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { senha } = req.body
    const hashedSenha = await bcrypt.hash(senha, saltRounds)
    await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [hashedSenha, req.user!.userId])
    res.json({ message: 'Senha atualizada com sucesso' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
