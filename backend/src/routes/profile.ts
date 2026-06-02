import { Router, Request, Response } from 'express'
import { pool } from '../database'
import { authenticate } from '../middleware/auth'
import bcrypt from 'bcryptjs'

const router = Router()

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags: [Perfil]
 *     summary: Obter dados do próprio perfil
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dados do usuário }
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const [users] = await pool.query<any[]>('SELECT * FROM usuarios WHERE id = ?', [req.user!.userId])
    if (users.length === 0) {
      res.status(404).json({ error: 'Usuário não encontrado' })
      return
    }
    const { senha, ...user } = users[0]
    res.json(user)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

/**
 * @openapi
 * /api/profile:
 *   patch:
 *     tags: [Perfil]
 *     summary: Atualizar próprio perfil (telefone, email, endereço, senha)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200: { description: Perfil atualizado }
 */
router.patch('/', authenticate, async (req: Request, res: Response) => {
  try {
    const allowedFields = ['telefone', 'email', 'cep', 'logradouro', 'bairro', 'cidade', 'uf', 'complemento', 'numero', 'senha']
    const updates: string[] = []
    const params: any[] = []

    for (const [key, value] of Object.entries(req.body)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`)
        params.push(key === 'senha' ? await bcrypt.hash(String(value), 10) : value)
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ error: 'Nenhum campo permitido para atualização' })
      return
    }

    params.push(req.user!.userId)
    await pool.query(`UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`, params)
    const [users] = await pool.query<any[]>('SELECT id, nome, genero, data_nascimento, telefone, docPessoal, email, cep, logradouro, bairro, cidade, uf, complemento, numero, createdAt, ativo FROM usuarios WHERE id = ?', [req.user!.userId])
    res.json(users[0])
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
