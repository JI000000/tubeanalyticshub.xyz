import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, dataType } = body;

    if (!userId || !type || !dataType) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const taskId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      taskId,
      message: 'Export task created successfully'
    });

  } catch (error) {
    console.error('Error creating export task:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create export task' },
      { status: 500 }
    );
  }
}