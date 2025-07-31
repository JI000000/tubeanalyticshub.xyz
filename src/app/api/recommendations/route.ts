import { NextRequest, NextResponse } from 'next/server';

const mockRecommendations = [
  {
    id: 'rec-1',
    type: 'topic',
    title: 'AI and Machine Learning Content',
    content: 'Based on trending topics in your niche, AI and machine learning content is performing 40% better than average.',
    confidence: 0.85,
    priority: 'high',
    created_at: '2024-01-16T08:00:00Z',
    metadata: {
      avgViews: 125000,
      expectedImprovement: '+40% views',
      tips: ['Focus on practical applications', 'Include hands-on examples']
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: mockRecommendations
    });

  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully'
    });

  } catch (error) {
    console.error('Error processing recommendations request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}