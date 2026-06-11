import { auth } from '@/auth';
import { getCrafterPaymentSummary, getCrafterPaymentHistory } from '@/lib/actions/crafter-payment.actions';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'craft') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'history') {
      const result = await getCrafterPaymentHistory();
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
    } else {
      const result = await getCrafterPaymentSummary();
      if (result.success) {
        return NextResponse.json(result);
      } else {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }
    }
  } catch (error) {
    console.error('Error getting crafter payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}