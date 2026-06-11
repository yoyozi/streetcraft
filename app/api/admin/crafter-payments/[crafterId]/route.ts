import { auth } from '@/auth';
import { getCrafterPaymentHistoryAdmin } from '@/lib/actions/crafter-payment.actions';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { crafterId: string } }
) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await getCrafterPaymentHistoryAdmin(params.crafterId);

    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error getting crafter payment history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}