const prisma = require('../config/prisma');
const {
  calculateDefaultExpiry,
  alertValueToDays,
  getAsoStatus,
} = require('../utils/asoStatus');

const DEFAULT_ALERT = { value: 30, unit: 'DAYS' };

/**
 * Busca a configuração global de alerta (cria uma padrão se não existir ainda).
 */
async function getGlobalAlertSetting() {
  let setting = await prisma.alertSetting.findFirst({ where: { employeeId: null } });
  if (!setting) {
    setting = await prisma.alertSetting.create({
      data: { employeeId: null, value: DEFAULT_ALERT.value, unit: DEFAULT_ALERT.unit },
    });
  }
  return setting;
}

/**
 * Anexa o campo "status" (ok / warning / expired) e "daysRemaining" a cada funcionário,
 * usando a configuração de alerta específica dele (se houver) ou a global.
 */
function attachStatus(employee, globalAlert) {
  const alert = employee.alertSetting || globalAlert;
  const alertDays = alertValueToDays(alert.value, alert.unit);
  return {
    ...employee,
    status: getAsoStatus(employee.asoExpiryDate, alertDays),
  };
}

async function list(req, res) {
  try {
    const { search, status, department } = req.query;

    const employees = await prisma.employee.findMany({
      where: {
        active: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { cpf: { contains: search } },
          ],
        }),
        ...(department && { department }),
      },
      include: { alertSetting: true },
      orderBy: { asoExpiryDate: 'asc' },
    });

    const globalAlert = await getGlobalAlertSetting();
    let result = employees.map((e) => attachStatus(e, globalAlert));

    if (status) {
      result = result.filter((e) => e.status === status);
    }

    return res.json(result);
  } catch (err) {
    console.error('Erro em list employees:', err);
    return res.status(500).json({ error: 'Erro interno ao listar funcionários.' });
  }
}

async function getById(req, res) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: req.params.id },
      include: { alertSetting: true, notifications: { orderBy: { sentAt: 'desc' }, take: 10 } },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    const globalAlert = await getGlobalAlertSetting();
    return res.json(attachStatus(employee, globalAlert));
  } catch (err) {
    console.error('Erro em getById employee:', err);
    return res.status(500).json({ error: 'Erro interno ao buscar funcionário.' });
  }
}

async function create(req, res) {
  try {
    const {
      name, cpf, role, department, email, phone,
      admissionDate, asoIssueDate, asoExpiryDate,
      alertValue, alertUnit,
    } = req.body;

    if (!name || !cpf || !role || !department || !asoIssueDate) {
      return res.status(400).json({
        error: 'Nome, CPF, cargo, setor e data de emissão do ASO são obrigatórios.',
      });
    }

    const issueDate = new Date(asoIssueDate);
    const expiryDate = asoExpiryDate ? new Date(asoExpiryDate) : calculateDefaultExpiry(issueDate);

    const employee = await prisma.employee.create({
      data: {
        name,
        cpf,
        role,
        department,
        email: email || null,
        phone: phone || null,
        admissionDate: admissionDate ? new Date(admissionDate) : null,
        asoIssueDate: issueDate,
        asoExpiryDate: expiryDate,
        ...(alertValue && alertUnit && {
          alertSetting: { create: { value: Number(alertValue), unit: alertUnit } },
        }),
      },
      include: { alertSetting: true },
    });

    return res.status(201).json(employee);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um funcionário cadastrado com esse CPF.' });
    }
    console.error('Erro em create employee:', err);
    return res.status(500).json({ error: 'Erro interno ao cadastrar funcionário.' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const {
      name, cpf, role, department, email, phone,
      admissionDate, asoIssueDate, asoExpiryDate,
      alertValue, alertUnit,
    } = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(cpf && { cpf }),
        ...(role && { role }),
        ...(department && { department }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(admissionDate && { admissionDate: new Date(admissionDate) }),
        ...(asoIssueDate && { asoIssueDate: new Date(asoIssueDate) }),
        ...(asoExpiryDate && { asoExpiryDate: new Date(asoExpiryDate) }),
      },
      include: { alertSetting: true },
    });

    // Atualiza (ou cria) a configuração de alerta específica do funcionário, se enviada
    if (alertValue && alertUnit) {
      await prisma.alertSetting.upsert({
        where: { employeeId: id },
        update: { value: Number(alertValue), unit: alertUnit },
        create: { employeeId: id, value: Number(alertValue), unit: alertUnit },
      });
    }

    return res.json(employee);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Já existe um funcionário cadastrado com esse CPF.' });
    }
    console.error('Erro em update employee:', err);
    return res.status(500).json({ error: 'Erro interno ao atualizar funcionário.' });
  }
}

// Exclusão lógica (soft delete) -- mantém o histórico no banco
async function remove(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Funcionário não encontrado.' });
    }

    await prisma.employee.update({ where: { id }, data: { active: false } });
    return res.status(204).send();
  } catch (err) {
    console.error('Erro em remove employee:', err);
    return res.status(500).json({ error: 'Erro interno ao remover funcionário.' });
  }
}

module.exports = { list, getById, create, update, remove, getGlobalAlertSetting };
