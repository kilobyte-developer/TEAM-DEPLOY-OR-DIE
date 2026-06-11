import type { AnalysisResult, GeneratedTests, SemanticFunctionTestSuite } from '@/lib/testgenai-types'
import { databaseService, type DatabaseService } from '../services/DatabaseService'

function signatureFor(suite: SemanticFunctionTestSuite, analysis?: AnalysisResult) {
  const fn = analysis?.functions.find(
    (item) => item.name === suite.functionName && item.className === suite.className,
  )
  if (!fn) return suite.className ? `${suite.className}.${suite.functionName}` : suite.functionName
  const params = fn.parameters.map((parameter) => parameter.name).join(', ')
  return `${fn.className ? `${fn.className}.` : ''}${fn.name}(${params})`
}

export class TestRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async createSemanticSuites(uploadedFileId: string, tests: GeneratedTests, analysis?: AnalysisResult) {
    const records = (tests.semanticSuites ?? []).map((suite) => ({
      uploaded_file_id: uploadedFileId,
      provider: tests.provider?.provider ?? 'local',
      model: tests.provider?.model ?? 'mvp_engine',
      function_name: suite.functionName,
      signature: signatureFor(suite, analysis),
      unit_tests_json: suite.unitTests,
      negative_tests_json: suite.negativeTests,
      edge_cases_json: suite.edgeCases,
      boundary_cases_json: suite.boundaryCases,
      potential_logic_issues_json: suite.potentialLogicIssues ?? [],
      generated_at: tests.generatedAt,
    }))

    if (records.length) await this.db.insert('semantic_test_cases', records)
  }

  async createArtifacts(uploadedFileId: string, tests: GeneratedTests) {
    const artifacts = [
      ...tests.unitTests.map((artifact) => ({ ...artifact, artifactType: 'unit' })),
      ...tests.edgeCaseTests.map((artifact) => ({ ...artifact, artifactType: 'edge' })),
    ]

    if (!artifacts.length) return

    await this.db.insert(
      'generated_pytest_artifacts',
      artifacts.map((artifact) => ({
        uploaded_file_id: uploadedFileId,
        artifact_name: artifact.fileName,
        artifact_type: artifact.artifactType,
        artifact_content: artifact.code,
        generated_at: tests.generatedAt,
      })),
    )
  }
}
