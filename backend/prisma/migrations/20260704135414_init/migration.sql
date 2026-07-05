-- CreateEnum
CREATE TYPE "AlertUnit" AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'RH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "admissionDate" TIMESTAMP(3),
    "asoIssueDate" TIMESTAMP(3) NOT NULL,
    "asoExpiryDate" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_settings" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "value" INTEGER NOT NULL,
    "unit" "AlertUnit" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_config" (
    "id" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL,
    "smtpUser" TEXT NOT NULL,
    "smtpPass" TEXT NOT NULL,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "fromName" TEXT NOT NULL DEFAULT 'Sistema de Controle de ASO',
    "fromEmail" TEXT NOT NULL,
    "notifyEmails" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "asoExpiryDateSnapshot" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_cpf_key" ON "employees"("cpf");

-- CreateIndex
CREATE INDEX "employees_asoExpiryDate_idx" ON "employees"("asoExpiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "alert_settings_employeeId_key" ON "alert_settings"("employeeId");

-- CreateIndex
CREATE INDEX "notifications_employeeId_asoExpiryDateSnapshot_idx" ON "notifications"("employeeId", "asoExpiryDateSnapshot");

-- AddForeignKey
ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
