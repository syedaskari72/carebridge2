import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { canNurseTakeBooking } from '@/lib/subscription';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
    });

    if (!nurse) {
      return NextResponse.json({ error: 'Nurse not found' }, { status: 404 });
    }

    const validation = await canNurseTakeBooking(nurse.id);

    return NextResponse.json(validation);
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({ error: 'Failed to validate' }, { status: 500 });
  }
}
