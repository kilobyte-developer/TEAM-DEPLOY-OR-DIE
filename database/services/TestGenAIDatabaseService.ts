import type { AnalysisResult, CoverageReport, ExecutionResult, GeneratedTests, UserStoryTestSuite } from '@/lib/testgenai-types'
import { AnalysisRepository } from '../repositories/AnalysisRepository'
import { CoverageRepository } from '../repositories/CoverageRepository'
import { ExecutionRepository } from '../repositories/ExecutionRepository'
import { MetricsRepository } from '../repositories/MetricsRepository'
import { TestRepository } from '../repositories/TestRepository'
import { UploadRepository } from '../repositories/UploadRepository'
import { UserStoryRepository } from '../repositories/UserStoryRepository'

function logError(event: string, error: unknown) {
  console.log(JSON.stringify({
    scope: 'database',
    event,
    level: 'error',
    message: error instanceof Error ? error.message : String(error),
  }))
}

export class TestGenAIDatabaseService {
  private readonly uploads = new UploadRepository()
  private readonly analysis = new AnalysisRepository()
  private readonly tests = new TestRepository()
  private readonly executions = new ExecutionRepository()
  private readonly coverage = new CoverageRepository()
  private readonly userStories = new UserStoryRepository()
  private readonly metrics = new MetricsRepository()

  async recordUpload(input: {
    fileName: string
    filePath: string
    language: string
    fileSize: number
    repositoryName: string
    sourceType: string
    uploadedAt: string
  }) {
    try {
      await this.uploads.create({
        file_name: input.fileName,
        file_path: input.filePath,
        language: input.language,
        file_size: input.fileSize,
        upload_timestamp: input.uploadedAt,
        repository_name: input.repositoryName,
        source_type: input.sourceType,
      })
      await this.metrics.refresh()
    } catch (error) {
      logError('upload_store_failed', error)
    }
  }

  async recordAnalysis(fileName: string, analysis: AnalysisResult) {
    try {
      const file = await this.uploads.findLatestByName(fileName)
      if (!file?.id) return
      await this.analysis.create(file.id, analysis)
      await this.uploads.mark(file.id, { analysis_completed: true })
    } catch (error) {
      logError('analysis_store_failed', error)
    }
  }

  async recordGeneratedTests(fileName: string, tests: GeneratedTests) {
    try {
      const file = await this.uploads.findLatestByName(fileName)
      if (!file?.id) return
      const analysis = await this.latestAnalysis(file.id)
      await this.tests.createSemanticSuites(file.id, tests, analysis)
      await this.tests.createArtifacts(file.id, tests)
      await this.uploads.mark(file.id, { test_generation_completed: true })
      await this.metrics.refresh()
    } catch (error) {
      logError('tests_store_failed', error)
    }
  }

  async recordExecution(fileName: string, execution: ExecutionResult) {
    try {
      const file = await this.uploads.findLatestByName(fileName)
      if (!file?.id) return
      await this.executions.create(file.id, execution)
      await this.uploads.mark(file.id, { execution_completed: true })
      await this.metrics.refresh()
    } catch (error) {
      logError('execution_store_failed', error)
    }
  }

  async recordCoverage(fileName: string, coverage: CoverageReport) {
    try {
      const file = await this.uploads.findLatestByName(fileName)
      if (!file?.id) return
      await this.coverage.create(file.id, coverage)
      await this.uploads.mark(file.id, { coverage_completed: true })
      await this.metrics.refresh()
    } catch (error) {
      logError('coverage_store_failed', error)
    }
  }

  async recordUserStorySuite(suite: UserStoryTestSuite) {
    try {
      await this.userStories.create(suite)
      await this.metrics.refresh()
    } catch (error) {
      logError('user_story_store_failed', error)
    }
  }

  private async latestAnalysis(uploadedFileId: string): Promise<AnalysisResult | undefined> {
    const rows = await import('../services/DatabaseService').then(({ databaseService }) =>
      databaseService.select<{ functions_json: AnalysisResult['functions']; classes_json: AnalysisResult['classes']; imports_json: string[]; dependencies_json: string[]; generated_at: string }>('analysis_results', {
        select: 'functions_json,classes_json,imports_json,dependencies_json,generated_at',
        eq: { uploaded_file_id: uploadedFileId },
        order: 'generated_at.desc',
        limit: 1,
      }),
    )
    const row = rows[0]
    if (!row) return undefined
    return {
      repository: 'local-workspace',
      generatedAt: row.generated_at,
      functions: row.functions_json,
      classes: row.classes_json,
      imports: row.imports_json,
      dependencies: row.dependencies_json,
    }
  }
}

export const testgenaiDatabase = new TestGenAIDatabaseService()
