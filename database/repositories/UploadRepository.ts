import { databaseService, type DatabaseService } from '../services/DatabaseService'

export type UploadedFileRecord = {
  id: string
  file_name: string
  file_path?: string
  language?: string
  file_size?: number
  upload_timestamp?: string
  repository_name?: string
  source_type?: string
  analysis_completed?: boolean
  test_generation_completed?: boolean
  execution_completed?: boolean
  coverage_completed?: boolean
}

export class UploadRepository {
  constructor(private readonly db: DatabaseService = databaseService) {}

  async create(record: Omit<UploadedFileRecord, 'id'>) {
    return this.db.insert<UploadedFileRecord>('uploaded_files', record)
  }

  async findLatestByName(fileName: string) {
    const rows = await this.db.select<UploadedFileRecord>('uploaded_files', {
      select: '*',
      eq: { file_name: fileName },
      order: 'upload_timestamp.desc',
      limit: 1,
    })
    return rows[0]
  }

  async mark(fileId: string, patch: Record<string, boolean>) {
    return this.db.update<UploadedFileRecord>('uploaded_files', { id: fileId }, patch)
  }
}
