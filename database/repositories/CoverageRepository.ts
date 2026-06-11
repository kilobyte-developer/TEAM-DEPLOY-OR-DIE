import type { CoverageReport } from '@/lib/testgenai-types'
import { databaseService, type DatabaseService } from '../services/DatabaseService'

export class CoverageRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async create(uploadedFileId: string, coverage: CoverageReport) {
    await this.db.insert('coverage_reports', {
      uploaded_file_id: uploadedFileId,
      coverage_percent: coverage.coveragePercent,
      functions_covered: coverage.functionsCovered,
      functions_missing: coverage.functionsMissingCoverage,
      coverage_summary: coverage.summary,
      coverage_json: coverage,
      generated_at: coverage.generatedAt,
    })
    console.log(JSON.stringify({ scope: 'database', event: 'coverage_stored', uploaded_file_id: uploadedFileId }))
  }
}
