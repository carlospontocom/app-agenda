import { pool } from './database'
import dotenv from 'dotenv'

dotenv.config()

async function migrate() {
  console.log('Executando migração...')

  const conn = await pool.getConnection()
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        genero VARCHAR(50) NOT NULL,
        data_nascimento DATE NOT NULL,
        telefone VARCHAR(50) NOT NULL,
        docPessoal VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        cep VARCHAR(20) NOT NULL,
        logradouro VARCHAR(255) NOT NULL,
        bairro VARCHAR(255) NOT NULL,
        cidade VARCHAR(255) NOT NULL,
        uf VARCHAR(10) NOT NULL,
        complemento VARCHAR(255) DEFAULT '',
        numero VARCHAR(50) NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        ativo BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email),
        INDEX idx_docPessoal (docPessoal)
      )
    `)
    console.log('✓ Tabela users criada')

    await conn.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        userName VARCHAR(255) NOT NULL,
        userDoc VARCHAR(100) NOT NULL,
        servicos JSON NOT NULL,
        agencia VARCHAR(100) NOT NULL,
        data DATE NOT NULL,
        hora VARCHAR(10) NOT NULL,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_userId (userId),
        INDEX idx_data (data),
        INDEX idx_status (status),
        INDEX idx_agencia (agencia)
      )
    `)
    console.log('✓ Tabela appointments criada')

    // Seed admin user if not exists
    const [rows] = await conn.query<any[]>('SELECT id FROM users WHERE email = ?', ['admin@gmail.com'])
    if (rows.length === 0) {
      // In production, store a bcrypt hash. For dev, plain text as per frontend.
      await conn.query(
        `INSERT INTO users (nome, genero, data_nascimento, telefone, docPessoal, email, senha, cep, logradouro, bairro, cidade, uf, complemento, numero, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['Administrador', 'Masculino', '1990-01-01', '11999999999', '00000000000', 'admin@gmail.com', '@123123', '01001000', 'Praça da Sé', 'Sé', 'São Paulo', 'SP', '', '1', true]
      )
      console.log('✓ Usuário admin criado (admin@gmail.com / @123123)')
    }

    console.log('Migração concluída com sucesso!')
  } finally {
    conn.release()
  }
}

migrate().catch(err => {
  console.error('Erro na migração:', err)
  process.exit(1)
})
