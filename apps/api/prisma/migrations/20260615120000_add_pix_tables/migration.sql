-- CreateEnum
CREATE TYPE "PixKeyType" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'EVP');

-- CreateEnum
CREATE TYPE "PixKeyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "PixTransferStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PixQrCodeType" AS ENUM ('STATIC', 'DYNAMIC');

-- CreateEnum
CREATE TYPE "PixQrCodeStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'PAID');

-- CreateTable
CREATE TABLE "pix_keys" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "key_type" "PixKeyType" NOT NULL,
    "key_value" TEXT NOT NULL,
    "status" "PixKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pix_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pix_transfers" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "sender_account_id" TEXT NOT NULL,
    "receiver_account_id" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "status" "PixTransferStatus" NOT NULL DEFAULT 'PENDING',
    "e2e_id" TEXT NOT NULL,
    "pix_key" TEXT NOT NULL,
    "pix_key_type" "PixKeyType" NOT NULL,
    "description" TEXT,
    "journal_entry_id" TEXT,
    "error_message" TEXT,
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pix_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pix_qr_codes" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "pix_key_id" TEXT NOT NULL,
    "type" "PixQrCodeType" NOT NULL,
    "amount" DECIMAL(18,2),
    "description" TEXT,
    "payload" TEXT NOT NULL,
    "tx_id" TEXT,
    "status" "PixQrCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pix_qr_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pix_keys_org_id_idx" ON "pix_keys"("org_id");

-- CreateIndex
CREATE INDEX "pix_keys_account_id_idx" ON "pix_keys"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "pix_keys_key_type_key_value_status_key" ON "pix_keys"("key_type", "key_value", "status");

-- CreateIndex
CREATE UNIQUE INDEX "pix_transfers_e2e_id_key" ON "pix_transfers"("e2e_id");

-- CreateIndex
CREATE INDEX "pix_transfers_org_id_created_at_idx" ON "pix_transfers"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "pix_transfers_sender_account_id_idx" ON "pix_transfers"("sender_account_id");

-- CreateIndex
CREATE INDEX "pix_transfers_receiver_account_id_idx" ON "pix_transfers"("receiver_account_id");

-- CreateIndex
CREATE INDEX "pix_qr_codes_org_id_idx" ON "pix_qr_codes"("org_id");

-- CreateIndex
CREATE INDEX "pix_qr_codes_account_id_idx" ON "pix_qr_codes"("account_id");

-- CreateIndex
CREATE INDEX "pix_qr_codes_pix_key_id_idx" ON "pix_qr_codes"("pix_key_id");

-- AddForeignKey
ALTER TABLE "pix_keys" ADD CONSTRAINT "pix_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_keys" ADD CONSTRAINT "pix_keys_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_transfers" ADD CONSTRAINT "pix_transfers_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_transfers" ADD CONSTRAINT "pix_transfers_sender_account_id_fkey" FOREIGN KEY ("sender_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_transfers" ADD CONSTRAINT "pix_transfers_receiver_account_id_fkey" FOREIGN KEY ("receiver_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_transfers" ADD CONSTRAINT "pix_transfers_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_qr_codes" ADD CONSTRAINT "pix_qr_codes_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_qr_codes" ADD CONSTRAINT "pix_qr_codes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pix_qr_codes" ADD CONSTRAINT "pix_qr_codes_pix_key_id_fkey" FOREIGN KEY ("pix_key_id") REFERENCES "pix_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
