import type { UserStoryTestSuite } from '@/lib/testgenai-types'
import { databaseService, type DatabaseService } from '../services/DatabaseService'

function extractRules(story: string) {
  const criteriaSection = story.split(/acceptance\s+criteria\s*:/i)[1] ?? ''
  return criteriaSection
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim())
    .filter(Boolean)
}

export class UserStoryRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async create(suite: UserStoryTestSuite) {
    await this.db.insert('user_story_sessions', {
      story_text: suite.story,
      provider: suite.provider?.provider ?? 'local',
      model: suite.provider?.model ?? null,
      business_rules_json: extractRules(suite.story),
      positive_tests_json: suite.positiveCases,
      negative_tests_json: suite.negativeCases,
      edge_cases_json: suite.edgeCases,
      generated_at: suite.generatedAt,
    })
    console.log(JSON.stringify({ scope: 'database', event: 'user_story_stored' }))
  }
}
