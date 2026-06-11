import type { ExecutionResult } from '@/lib/testgenai-types'
import { databaseService, type DatabaseService } from '../services/DatabaseService'

type ExecutionRecord = {
  id: string
}

function extractExecutionDetails(execution: ExecutionResult) {
  return execution.logs
    .map((log) => {
      const match = log.message.match(/::([A-Za-z0-9_]+)\s+(PASSED|FAILED|ERROR|SKIPPED)/)
      if (!match) return null
      return {
        test_name: match[1],
        status: match[2].toLowerCase(),
        actual_output: log.message,
        failure_reason: match[2] === 'FAILED' || match[2] === 'ERROR' ? log.message : null,
      }
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
}

export class ExecutionRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async create(uploadedFileId: string, execution: ExecutionResult) {
    const row = await this.db.insert<ExecutionRecord>('executions', {
      uploaded_file_id: uploadedFileId,
      execution_timestamp: execution.generatedAt,
      status: execution.status,
      total_tests: execution.totalTests,
      passed_tests: execution.passedTests,
      failed_tests: execution.failedTests,
      pass_rate: execution.passRate,
      execution_time: execution.executionTime,
      logs_json: execution.logs,
    })

    if (!row?.id) return

    const details = extractExecutionDetails(execution).map((detail) => ({
      execution_id: row.id,
      ...detail,
    }))

    if (details.length) await this.db.insert('execution_details', details)
    console.log(JSON.stringify({ scope: 'database', event: 'execution_stored', uploaded_file_id: uploadedFileId }))
  }
}
