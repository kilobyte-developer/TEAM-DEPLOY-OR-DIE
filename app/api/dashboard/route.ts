import { NextResponse } from 'next/server'
import { AnalyticsService } from '@/database/services/AnalyticsService'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const dashboard = await new AnalyticsService().getDashboardData()
    return NextResponse.json(dashboard)
  } catch {
    return NextResponse.json(
      {
        error: 'Unable to load analytics dashboard.',
        isEmpty: true,
        kpis: {
          totalFilesUploaded: 0,
          totalExecutions: 0,
          totalTestsGenerated: 0,
          totalTestsPassed: 0,
          totalTestsFailed: 0,
          averagePassRate: 0,
          averageCoverage: 0,
          userStoriesProcessed: 0,
          logicIssuesDetected: 0,
        },
        charts: {
          passFail: [],
          coverageTrend: [],
          executionsOverTime: [],
          providerUsage: [],
          logicIssuesTrend: [],
        },
        insights: {},
        leaderboard: [],
        activity: [],
      },
      { status: 500 },
    )
  }
}
