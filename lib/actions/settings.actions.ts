'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { checkAdminAuth } from './auth-actions';
import {
  EFT_BANK_NAME,
  EFT_ACCOUNT_HOLDER,
  EFT_ACCOUNT_NUMBER,
  EFT_BRANCH_CODE,
} from '@/lib/constants';

// Deal settings keys
const DEAL_KEYS = {
  DEAL_ACTIVE: 'deal_active',
  DEAL_TARGET_DATE: 'deal_target_date',
  DEAL_TITLE: 'deal_title',
  DEAL_DESCRIPTION: 'deal_description',
  DEAL_IMAGE: 'deal_image',
} as const;

// Crafter upload settings keys
const UPLOADER_KEYS = {
  DAILY_UPLOAD_LIMIT: 'daily_upload_limit',
} as const;

// Admin digest settings keys
const DIGEST_KEYS = {
  DIGEST_ENABLED: 'digest_enabled',
} as const;

export interface DealSettings {
  isActive: boolean;
  targetDate: string;
  title: string;
  description: string;
  image: string;
}

export interface UploaderSettings {
  dailyUploadLimit: number;
}

export interface DigestSettings {
  enabled: boolean;
}

// Get deal settings (public - no auth required)
export async function getDealSettings(): Promise<DealSettings> {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: Object.values(DEAL_KEYS) },
    },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  return {
    isActive: map.get(DEAL_KEYS.DEAL_ACTIVE) === 'true',
    targetDate: map.get(DEAL_KEYS.DEAL_TARGET_DATE) || '',
    title: map.get(DEAL_KEYS.DEAL_TITLE) || 'Deal Of The Month',
    description:
      map.get(DEAL_KEYS.DEAL_DESCRIPTION) ||
      "Get ready for a shopping experience like never before with our Deals of the Month! Every purchase comes with exclusive perks and offers, making this month a celebration of savvy choices and amazing deals. Don't miss out!",
    image: map.get(DEAL_KEYS.DEAL_IMAGE) || '',
  };
}

// Update deal settings (admin only)
export async function updateDealSettings(data: DealSettings) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const entries = [
      { key: DEAL_KEYS.DEAL_ACTIVE, value: String(data.isActive) },
      { key: DEAL_KEYS.DEAL_TARGET_DATE, value: data.targetDate },
      { key: DEAL_KEYS.DEAL_TITLE, value: data.title },
      { key: DEAL_KEYS.DEAL_DESCRIPTION, value: data.description },
      { key: DEAL_KEYS.DEAL_IMAGE, value: data.image || '' },
    ];

    for (const entry of entries) {
      await prisma.siteSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Error updating deal settings:', error);
    return { success: false, error: 'Failed to update deal settings' };
  }
}

// Get uploader settings (public - no auth required)
export async function getUploaderSettings(): Promise<UploaderSettings> {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: { in: Object.values(UPLOADER_KEYS) },
    },
  });

  const map = new Map(settings.map((s) => [s.key, s.value]));

  return {
    dailyUploadLimit: parseInt(map.get(UPLOADER_KEYS.DAILY_UPLOAD_LIMIT) || '5', 10),
  };
}

// Update uploader settings (admin only)
export async function updateUploaderSettings(data: UploaderSettings) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const entries = [
      { key: UPLOADER_KEYS.DAILY_UPLOAD_LIMIT, value: String(data.dailyUploadLimit) },
    ];

    for (const entry of entries) {
      await prisma.siteSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating uploader settings:', error);
    return { success: false, error: 'Failed to update uploader settings' };
  }
}

// Get admin digest settings (enabled by default)
export async function getDigestSettings(): Promise<DigestSettings> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: DIGEST_KEYS.DIGEST_ENABLED },
  });

  // Default to enabled when not explicitly set
  return { enabled: setting ? setting.value === 'true' : true };
}

// Update admin digest settings (admin only)
export async function updateDigestSettings(data: DigestSettings) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    await prisma.siteSetting.upsert({
      where: { key: DIGEST_KEYS.DIGEST_ENABLED },
      update: { value: String(data.enabled) },
      create: { key: DIGEST_KEYS.DIGEST_ENABLED, value: String(data.enabled) },
    });

    revalidatePath('/admin/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating digest settings:', error);
    return { success: false, error: 'Failed to update digest settings' };
  }
}

// Payment gateway settings keys
const PAYMENT_KEYS = {
  EFT_ENABLED: 'payment_eft_enabled',
  PAYSTACK_ENABLED: 'payment_paystack_enabled',
  YOCO_ENABLED: 'payment_yoco_enabled',
  EFT_BANK_NAME: 'eft_bank_name',
  EFT_ACCOUNT_HOLDER: 'eft_account_holder',
  EFT_ACCOUNT_NUMBER: 'eft_account_number',
  EFT_BRANCH_CODE: 'eft_branch_code',
} as const;

export interface PaymentSettings {
  eftEnabled: boolean;
  paystackEnabled: boolean;
  yocoEnabled: boolean;
  eftBankName: string;
  eftAccountHolder: string;
  eftAccountNumber: string;
  eftBranchCode: string;
}

// Get payment settings (public - checkout needs to know enabled gateways)
export async function getPaymentSettings(): Promise<PaymentSettings> {
  const settings = await prisma.siteSetting.findMany({
    where: { key: { in: Object.values(PAYMENT_KEYS) } },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));

  return {
    // EFT is enabled by default when not explicitly set
    eftEnabled: map.has(PAYMENT_KEYS.EFT_ENABLED) ? map.get(PAYMENT_KEYS.EFT_ENABLED) === 'true' : true,
    paystackEnabled: map.get(PAYMENT_KEYS.PAYSTACK_ENABLED) === 'true',
    yocoEnabled: map.get(PAYMENT_KEYS.YOCO_ENABLED) === 'true',
    eftBankName: map.get(PAYMENT_KEYS.EFT_BANK_NAME) || EFT_BANK_NAME,
    eftAccountHolder: map.get(PAYMENT_KEYS.EFT_ACCOUNT_HOLDER) || EFT_ACCOUNT_HOLDER,
    eftAccountNumber: map.get(PAYMENT_KEYS.EFT_ACCOUNT_NUMBER) || EFT_ACCOUNT_NUMBER,
    eftBranchCode: map.get(PAYMENT_KEYS.EFT_BRANCH_CODE) || EFT_BRANCH_CODE,
  };
}

// Get the list of enabled payment method names (for checkout)
export async function getEnabledPaymentMethods(): Promise<string[]> {
  const s = await getPaymentSettings();
  const methods: string[] = [];
  if (s.eftEnabled) methods.push('EFT');
  if (s.paystackEnabled) methods.push('Paystack');
  if (s.yocoEnabled) methods.push('Yoco');
  // Never leave checkout with no options — fall back to EFT
  return methods.length > 0 ? methods : ['EFT'];
}

// Update payment settings (admin only)
export async function updatePaymentSettings(data: PaymentSettings) {
  try {
    const authCheck = await checkAdminAuth();
    if (!authCheck.authorized) {
      return { success: false, error: authCheck.error };
    }

    const entries = [
      { key: PAYMENT_KEYS.EFT_ENABLED, value: String(data.eftEnabled) },
      { key: PAYMENT_KEYS.PAYSTACK_ENABLED, value: String(data.paystackEnabled) },
      { key: PAYMENT_KEYS.YOCO_ENABLED, value: String(data.yocoEnabled) },
      { key: PAYMENT_KEYS.EFT_BANK_NAME, value: data.eftBankName || '' },
      { key: PAYMENT_KEYS.EFT_ACCOUNT_HOLDER, value: data.eftAccountHolder || '' },
      { key: PAYMENT_KEYS.EFT_ACCOUNT_NUMBER, value: data.eftAccountNumber || '' },
      { key: PAYMENT_KEYS.EFT_BRANCH_CODE, value: data.eftBranchCode || '' },
    ];

    for (const entry of entries) {
      await prisma.siteSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }

    revalidatePath('/admin/settings');
    revalidatePath('/payment-method');
    return { success: true };
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return { success: false, error: 'Failed to update payment settings' };
  }
}
