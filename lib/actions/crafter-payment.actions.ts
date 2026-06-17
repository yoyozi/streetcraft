'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// Get crafter's banking details (crafter-facing)
export async function getCrafterBankDetails(): Promise<{
  success: boolean;
  data?: {
    bankName: string | null;
    bankAccountNumber: string | null;
    bankBranchCode: string | null;
    bankAccountType: string | null;
  };
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'craft') return { success: false, error: 'Unauthorized' };

    const crafter = await prisma.crafter.findUnique({
      where: { userId: session.user.id },
      select: { bankName: true, bankAccountNumber: true, bankBranchCode: true, bankAccountType: true },
    });

    if (!crafter) return { success: false, error: 'Crafter not found' };
    return { success: true, data: crafter as any };
  } catch (error) {
    console.error('Error getting bank details:', error);
    return { success: false, error: 'Failed to get bank details' };
  }
}

// Save/update crafter's banking details
export async function updateCrafterBankDetails(data: {
  bankName: string;
  bankAccountNumber: string;
  bankBranchCode: string;
  bankAccountType: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'craft') return { success: false, error: 'Unauthorized' };

    if (!data.bankName.trim() || !data.bankAccountNumber.trim() || !data.bankBranchCode.trim()) {
      return { success: false, error: 'Bank name, account number, and branch code are required' };
    }

    await prisma.crafter.update({
      where: { userId: session.user.id },
      data: {
        bankName: data.bankName.trim(),
        bankAccountNumber: data.bankAccountNumber.trim(),
        bankBranchCode: data.bankBranchCode.trim(),
        bankAccountType: data.bankAccountType.trim() || 'Cheque',
      },
    });

    revalidatePath('/crafter/settings');
    return { success: true, message: 'Banking details saved' };
  } catch (error) {
    console.error('Error updating bank details:', error);
    return { success: false, error: 'Failed to save banking details' };
  }
}

// Create crafter payments when an order is paid
export async function createCrafterPaymentsForOrder(orderId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Get the order with items and products
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                crafter: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Create payment records for each order item that has a crafter
    const paymentPromises = order.orderItems
      .filter(item => item.product?.crafterId && item.product.costPrice > 0)
      .map(async (item) => {
        const amount = item.product.costPrice * item.qty;
        
        return prisma.crafterPayment.create({
          data: {
            crafterId: item.product.crafterId,
            orderId: order.id,
            orderItemId: item.id,
            amount: amount,
            status: 'PENDING',
          },
        });
      });

    await Promise.all(paymentPromises);

    revalidatePath('/admin/crafter-payments');
    revalidatePath('/crafter/payments');

    return { success: true, message: 'Crafter payments created' };
  } catch (error) {
    console.error('Error creating crafter payments:', error);
    return { success: false, error: 'Failed to create crafter payments' };
  }
}

// Get crafter's payment summary
export async function getCrafterPaymentSummary(): Promise<{
  success: boolean;
  data?: {
    totalPending: number;
    totalProcessing: number;
    totalPaid: number;
    paymentCount: number;
  };
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'craft') {
      return { success: false, error: 'Unauthorized' };
    }

    const crafter = await prisma.crafter.findUnique({
      where: { userId: session.user.id },
    });

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    const payments = await prisma.crafterPayment.findMany({
      where: { crafterId: crafter.id },
    });

    const totalPending = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalProcessing = payments
      .filter(p => p.status === 'PROCESSING')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalPaid = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      success: true,
      data: {
        totalPending,
        totalProcessing,
        totalPaid,
        paymentCount: payments.length,
      },
    };
  } catch (error) {
    console.error('Error getting crafter payment summary:', error);
    return { success: false, error: 'Failed to get payment summary' };
  }
}

// Get crafter's payment history
export async function getCrafterPaymentHistory(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'craft') {
      return { success: false, error: 'Unauthorized' };
    }

    const crafter = await prisma.crafter.findUnique({
      where: { userId: session.user.id },
    });

    if (!crafter) {
      return { success: false, error: 'Crafter not found' };
    }

    const payments = await prisma.crafterPayment.findMany({
      where: { crafterId: crafter.id },
      include: {
        payout: {
          select: {
            id: true,
            reference: true,
            processedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return {
      success: true,
      data: payments,
    };
  } catch (error) {
    console.error('Error getting crafter payment history:', error);
    return { success: false, error: 'Failed to get payment history' };
  }
}

// Get all crafters with payment summaries (admin)
export async function getAllCrafterPaymentSummaries(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const crafters = await prisma.crafter.findMany({
      where: { status: 'APPROVED' },
      include: {
        payments: {
          where: {
            status: {
              in: ['PENDING', 'PROCESSING'],
            },
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const summaries = crafters.map(crafter => {
      const totalPending = crafter.payments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalProcessing = crafter.payments
        .filter(p => p.status === 'PROCESSING')
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        id: crafter.id,
        businessName: crafter.businessName,
        name: crafter.user.name,
        email: crafter.user.email,
        mobile: crafter.mobile,
        totalPending,
        totalProcessing,
        totalOwed: totalPending + totalProcessing,
        pendingPaymentCount: crafter.payments.filter(p => p.status === 'PENDING').length,
      };
    });

    return {
      success: true,
      data: summaries,
    };
  } catch (error) {
    console.error('Error getting crafter payment summaries:', error);
    return { success: false, error: 'Failed to get payment summaries' };
  }
}

// Get detailed payment history for a specific crafter (admin)
export async function getCrafterPaymentHistoryAdmin(crafterId: string): Promise<{
  success: boolean;
  data?: any[];
  crafter?: any;
  error?: string;
}> {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    const [crafter, payments] = await Promise.all([
      prisma.crafter.findUnique({
        where: { id: crafterId },
        select: {
          businessName: true,
          mobile: true,
          bankName: true,
          bankAccountNumber: true,
          bankBranchCode: true,
          bankAccountType: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.crafterPayment.findMany({
        where: { crafterId },
        include: {
          payout: {
            select: { id: true, reference: true, processedAt: true, status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      success: true,
      data: payments,
      crafter,
    };
  } catch (error) {
    console.error('Error getting crafter payment history:', error);
    return { success: false, error: 'Failed to get payment history' };
  }
}

// Mark a crafter's PENDING payments as PAID (admin records a payout).
// Creates a CrafterPayout grouping and flips all pending payments to PAID.
export async function markCrafterPaymentsPaid(
  crafterId: string,
  options: { paymentMethod: string; reference?: string; notes?: string }
): Promise<{ success: boolean; message?: string; error?: string; paidCount?: number; total?: number }> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return { success: false, error: 'Unauthorized' };
    }

    if (!options.paymentMethod || !options.paymentMethod.trim()) {
      return { success: false, error: 'Payment method is required' };
    }

    const pending = await prisma.crafterPayment.findMany({
      where: { crafterId, status: 'PENDING' },
      select: { id: true, amount: true },
    });

    if (pending.length === 0) {
      return { success: false, error: 'No pending payments to mark as paid' };
    }

    const total = pending.reduce((sum, p) => sum + p.amount, 0);

    // Create a payout record grouping these payments
    const payout = await prisma.crafterPayout.create({
      data: {
        crafterId,
        totalAmount: total,
        status: 'COMPLETED',
        paymentMethod: options.paymentMethod.trim(),
        reference: options.reference?.trim() || null,
        notes: options.notes?.trim() || null,
        processedBy: session.user.id,
        processedAt: new Date(),
      },
    });

    await prisma.crafterPayment.updateMany({
      where: { id: { in: pending.map((p) => p.id) } },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
        paymentMethod: options.paymentMethod.trim(),
        reference: options.reference?.trim() || null,
        payoutId: payout.id,
      },
    });

    revalidatePath('/admin/crafter-payments');
    revalidatePath(`/admin/crafter-payments/${crafterId}`);
    revalidatePath('/crafter/payments');
    revalidatePath('/crafter');

    return {
      success: true,
      message: `Marked ${pending.length} payment(s) as paid`,
      paidCount: pending.length,
      total,
    };
  } catch (error) {
    console.error('Error marking crafter payments paid:', error);
    return { success: false, error: 'Failed to mark payments as paid' };
  }
}