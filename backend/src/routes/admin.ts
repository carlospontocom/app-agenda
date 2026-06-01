import { Router, Request, Response } from 'express'
import { pool } from '../database'
import { authenticate, requireAdmin, generateToken } from '../middleware/auth'
import type { User } from '../types'

const router = Router()

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     tags: [Admin]
 *     summary: Login do administrador
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
 *       200: { description: Token JWT + dados do admin }
 *       401: { description: Credenciais inválidas }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body
    const [users] = await pool.query<any[]>('SELECT * FROM users WHERE email = ? AND senha = ?', [email, senha])

    if (users.length === 0) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const user = users[0] as User
    // Only the admin user can login as admin
    if (user.email !== 'admin@gmail.com') {
      res.status(403).json({ error: 'Acesso restrito' })
      return
    }

    const token = generateToken({ userId: user.id!, isAdmin: true })
    res.json({ token, user })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: Listar todos os usuários
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Lista de usuários (sem senha) }
 */
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [users] = await pool.query<any[]>('SELECT id, nome, genero, data_nascimento, telefone, docPessoal, email, cep, logradouro, bairro, cidade, uf, complemento, numero, createdAt, ativo FROM users ORDER BY createdAt DESC')
    res.json(users)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/admin/users/{id}:
 *   patch:
 *     tags: [Admin]
 *     summary: Atualizar dados de um usuário (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Usuário atualizado }
 */
router.patch('/users/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const updates: string[] = []
    const params: any[] = []
    for (const [key, value] of Object.entries(req.body)) {
      if (key !== 'id' && key !== 'senha') {
        updates.push(`${key} = ?`)
        params.push(value)
      }
    }
    if (updates.length === 0) {
      res.status(400).json({ error: 'Nenhum campo para atualizar' })
      return
    }
    params.push(req.params.id)
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
    res.json({ message: 'Usuário atualizado' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/admin/users/{id}/toggle-status:
 *   patch:
 *     tags: [Admin]
 *     summary: Ativar/desativar conta de usuário
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: number }
 *     responses:
 *       200: { description: Status alterado }
 */
router.patch('/users/:id/toggle-status', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [users] = await pool.query<any[]>('SELECT ativo FROM users WHERE id = ?', [req.params.id])
    if (users.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }
    const novoStatus = users[0].ativo ? false : true
    await pool.query('UPDATE users SET ativo = ? WHERE id = ?', [novoStatus, req.params.id])
    res.json({ ativo: novoStatus, message: novoStatus ? 'Conta ativada' : 'Conta desativada' })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/admin/report:
 *   get:
 *     tags: [Admin]
 *     summary: Dados do relatório (agrupados por agência, serviço, status)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: inicio
 *         schema: { type: string }
 *       - in: query
 *         name: fim
 *         schema: { type: string }
 *       - in: query
 *         name: agencia
 *         schema: { type: string }
 *       - in: query
 *         name: servico
 *         schema: { type: string }
 *     responses:
 *       200: { description: Dados agregados do relatório }
 */
router.get('/report', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { inicio, fim, agencia, servico } = req.query
    let sql = 'SELECT * FROM appointments WHERE 1=1'
    const params: any[] = []

    if (inicio) { sql += ' AND data >= ?'; params.push(inicio) }
    if (fim) { sql += ' AND data <= ?'; params.push(fim) }
    if (agencia) { sql += ' AND agencia = ?'; params.push(agencia) }

    const [rows] = await pool.query<any[]>(sql, params)
    let base = rows

    if (servico) {
      base = base.filter((r: any) => {
        const servicos: string[] = typeof r.servicos === 'string' ? JSON.parse(r.servicos) : r.servicos
        return servicos.includes(servico as string)
      })
    }

    const total = base.length

    const AGENCIAS = ['Agência Central', 'Agência Norte', 'Agência Sul', 'Agência Leste', 'Agência Oeste']
    const porAgencia: Record<string, number> = {}
    AGENCIAS.forEach(a => { porAgencia[a] = 0 })
    base.forEach((a: any) => { porAgencia[a.agencia] = (porAgencia[a.agencia] || 0) + 1 })

    const SERVICOS = ['Abrir nova conta', 'Renegociar Dívidas', 'Saque Volumoso', 'Configurar app', 'Cartão de Crédito', 'Transferência / Pix']
    const porServico: Record<string, number> = {}
    SERVICOS.forEach(s => { porServico[s] = 0 })
    base.forEach((a: any) => {
      const servicos: string[] = typeof a.servicos === 'string' ? JSON.parse(a.servicos) : a.servicos
      servicos.forEach((s: string) => { porServico[s] = (porServico[s] || 0) + 1 })
    })

    const porStatus = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 }
    base.forEach((a: any) => { (porStatus as any)[a.status]++ })

    res.json({ total, porAgencia, porServico, porStatus })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
