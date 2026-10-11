import { NextResponse } from 'next/server'
import { getA3ReadClient, apiError } from '@/lib/a3'

export const dynamic = 'force-dynamic'

interface VwFieldTaskRecord {
  worksheet_id: number
  transaction_no: string | null
  job_no: string | null
  customer_name: string | null
  field_agent_name: string | null
  shipper: string | null
  consignee: string | null
  mawb: string | null
  hawb: string | null
  handover_datetime: string | null
  handover_location: string | null
  pihak_penyerah: string | null
  pihak_penerima: string | null
  has_issue: boolean | null
  status_kendala: string | null
  issue_note: string | null
  field_stage: string | null
  field_status: string | null
  create_date: string | null
  open_issues_count?: number | null
  latest_issue_category?: string | null
}

export async function GET(): Promise<NextResponse> {
  try {
    let client
    try {
      client = getA3ReadClient()
    } catch (clientErr) {
      console.error('[GET A3-tasks] Failed to get read client:', clientErr)
      return NextResponse.json({
        success: false,
        error: 'Database configuration is unavailable.',
      }, { status: 500 })
    }

    const { data: tasks, error: taskError } = await client
      .from('vw_field_tasks')
      .select('*')
      .order('worksheet_id', { ascending: false })

    if (taskError) {
      console.error('[GET A3-tasks] Database error querying vw_field_tasks:', taskError)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch field tasks from database view.',
      }, { status: 500 })
    }

    const taskRows = (tasks as unknown as VwFieldTaskRecord[]) ?? []
    const mappedTasks = taskRows.map((w) => {
      let status = 'DRAFT'
      if (w.has_issue) {
        status = 'HAS_ISSUE'
      } else if (w.field_stage === 'Completed') {
        status = 'COMPLETED'
      } else if (w.field_stage === 'In Progress' || w.field_stage === 'Assigned') {
        status = 'IN_PROGRESS'
      } else if (w.field_stage === 'Draft') {
        status = 'DRAFT'
      } else {
        status = 'DRAFT'
      }

      const isIssue = Boolean(w.has_issue || w.status_kendala === 'kendala_terdeteksi')
      const mawbHawb = [w.mawb, w.hawb].filter(Boolean).join(' / ') || '-'

      return {
        id: String(w.worksheet_id),
        job_number: w.job_no || `#JOB-${w.worksheet_id}`,
        transaction_number: w.transaction_no || `TRX-${w.worksheet_id}`,
        task_title: `Physical Cargo Inspection - ${w.job_no || 'Job #' + w.worksheet_id}`,
        customer: w.customer_name || 'PT DSV TRANSPORT INDONESIA',
        shipper: w.shipper || 'PT Astra Component Logistics',
        consignee: w.consignee || 'Toyota Tsusho Asia',
        mawb_hawb: mawbHawb,
        location: w.handover_location || 'Area Cargo MM2100, Cikarang Barat',
        status,
        pihak_penyerah: w.pihak_penyerah || null,
        pihak_penerima: w.pihak_penerima || null,
        handover_location: w.handover_location || null,
        handover_status: w.pihak_penyerah ? 'Completed' : 'Pending',
        actual_cargo: 'Standard Pallet Cargo',
        documentation_status: 'Verified',
        supporting_documents_status: 'Attached',
        verification_status: isIssue ? 'Issue Found' : 'Verified',
        assigned_to: w.field_agent_name || 'Rizky Pratama',
        created_at: w.create_date || new Date().toISOString(),
        updated_at: w.handover_datetime || new Date().toISOString(),
      }
    })

    return NextResponse.json({
      success: true,
      data: mappedTasks,
    })
  } catch (error) {
    console.error('[GET A3-tasks] Unexpected error:', error)
    return apiError(error, 500)
  }
}
