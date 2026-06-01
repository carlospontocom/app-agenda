import { Router, Request, Response } from 'express'
import { pool } from '../database'
import { generateToken } from '../middleware/auth'
import { authenticate } from '../middleware/auth'
import type { User } from '../types'

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
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, docPessoal } = req.body

    const [existing] = await pool.query<any[]>('SELECT id FROM users WHERE email = ? OR docPessoal = ?', [email, docPessoal])
    if (existing.length > 0) {
      const field = existing[0].email === email ? 'Email' : 'Documento'
      res.status(409).json({ error: `${field} já cadastrado` })
      return
    }

    const { nome, genero, data_nascimento, telefone, senha, cep, logradouro, bairro, cidade, uf, complemento, numero } = req.body
    const [result] = await pool.query<any>(
      `INSERT INTO users (nome, genero, data_nascimento, telefone, docPessoal, email, senha, cep, logradouro, bairro, cidade, uf, complemento, numero, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome, genero, data_nascimento, telefone, docPessoal, email, senha, cep, logradouro, bairro, cidade, uf, complemento, numero, true]
    )

    res.status(201).json({ id: result.insertId, message: 'Usuário criado com sucesso' })
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
    const [users] = await pool.query<any[]>('SELECT * FROM users WHERE email = ? AND senha = ?', [email, senha])

    if (users.length === 0) {
      res.status(401).json({ error: 'Email ou senha inválidos' })
      return
    }

    const user = users[0] as User
    if (user.ativo === false) {
      res.status(401).json({ error: 'Sua conta está inativa. Entre em contato com o administrador.' })
      return
    }

    const token = generateToken({ userId: user.id!, isAdmin: false })
    res.json({ token, user })
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
      'SELECT * FROM users WHERE docPessoal = ? AND data_nascimento = ? AND email = ?',
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
router.post('/update-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { senha } = req.body
    await pool.query('UPDATE users SET senha = ? WHERE id = ?', [senha, req.user!.userId])
    res.json({ message: 'Senha atualizada com sucesso' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
