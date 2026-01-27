/**
 * Valida se um CPF é válido
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false se inválido
 */
export function validateCPF(cpf: string): boolean {
  // Remove formatação
  const cleanCPF = cpf.replace(/[^\d]/g, '')

  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false
  }

  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false
  }

  // Validação dos dígitos verificadores
  let sum = 0
  let remainder

  // Valida primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }

  if (remainder !== parseInt(cleanCPF.substring(9, 10))) {
    return false
  }

  sum = 0

  // Valida segundo dígito
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i)
  }

  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) {
    remainder = 0
  }

  if (remainder !== parseInt(cleanCPF.substring(10, 11))) {
    return false
  }

  return true
}

/**
 * Formata um CPF para o padrão XXX.XXX.XXX-XX
 * @param cpf - CPF sem formatação
 * @returns CPF formatado
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/[^\d]/g, '')
  
  if (cleanCPF.length <= 3) {
    return cleanCPF
  } else if (cleanCPF.length <= 6) {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`
  } else if (cleanCPF.length <= 9) {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`
  } else {
    return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`
  }
}

/**
 * Gera CPFs válidos aleatórios (apenas para testes)
 * @returns CPF válido formatado
 */
export function generateValidCPF(): string {
  const randomDigit = () => Math.floor(Math.random() * 10)
  const calculateDigit = (cpf: number[], weight: number): number => {
    const sum = cpf.reduce((acc, digit, index) => acc + digit * (weight - index), 0)
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const cpf = Array.from({ length: 9 }, randomDigit)
  cpf.push(calculateDigit(cpf, 10))
  cpf.push(calculateDigit(cpf, 11))

  return formatCPF(cpf.join(''))
}
