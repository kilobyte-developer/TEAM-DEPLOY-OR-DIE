import type { AnalysisResult } from '@/lib/testgenai-types'
import { databaseService, type DatabaseService } from '../services/DatabaseService'

export class AnalysisRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async create(uploadedFileId: string, analysis: AnalysisResult) {
    return this.db.insert('analysis_results', {
      uploaded_file_id: uploadedFileId,
      function_count: analysis.functions.length,
      class_count: analysis.classes.length,
      import_count: analysis.imports.length,
      dependency_count: analysis.dependencies.length,
      functions_json: analysis.functions,
      classes_json: analysis.classes,
      imports_json: analysis.imports,
      dependencies_json: analysis.dependencies,
      generated_at: analysis.generatedAt,
    })
  }
}
