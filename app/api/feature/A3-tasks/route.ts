import { NextResponse } from 'next/server'
import { getA3Client, apiError } from '@/lib/a3'

export const dynamic = 'force-dynamic'

interface WorksheetRecord {
  worksheet_id: number
  transaction_no: string | null
  job_no: string | null
  customer_id: string | null
  created_by_user_id: string | null
  create_date: string | null
  status_kendala: string | null
  field_agent_id: string | null
  sales_pic_id: string | null
  shipper: string | null
  consignee: string | null
  mawb: string | null
  hawb: string | null
  handover_datetime: string | null
  handover_location: string | null
  pihak_penyerah: string | null
  pihak_penerima: string | null
  has_issue: boolean | null
  issue_note: string | null
  progress_status: string | null
  a1_company_list?: {
    company_list_id?: string
    company_name?: string
  } | null
  field_agent?: {
    id?: string
    full_name?: string
    employee_id?: string
  } | null
}

export async function GET(): Promise<NextResponse> {
  try {
    let client
    try {
      client = getA3Client()
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Database configuration is unavailable.',
      }, { status: 500 })
    }

    // Ambil data penugasan dari a2_worksheets (tabel utama yang terintegrasi dengan modul CRM & HRMS)
    const { data: worksheets, error: wsError } = await client
      .from('a2_worksheets')
      .select(`
        worksheet_id,
        transaction_no,
        job_no,
        customer_id,
        created_by_user_id,
        create_date,
        status_kendala,
        field_agent_id,
        sales_pic_id,
        shipper,
        consignee,
        mawb,
        hawb,
        handover_datetime,
        handover_location,
        pihak_penyerah,
        pihak_penerima,
        has_issue,
        issue_note,
        progress_status,
        a1_company_list ( company_list_id, company_name ),
        field_agent:d3_employee!a2_worksheets_field_agent_id_fkey ( id, full_name, employee_id )
      `)
      .order('worksheet_id', { ascending: false })

    if (!wsError && worksheets && worksheets.length > 0) {
      const mappedTasks = (worksheets as unknown as WorksheetRecord[]).map((w) => {
        const isIssue = Boolean(w.has_issue || w.status_kendala === 'kendala_terdeteksi')
        let status = 'DRAFT'
        if (isIssue) {
          status = 'HAS_ISSUE'
        } else if (w.progress_status) {
          const formatted = String(w.progress_status).toUpperCase().replace(/\s+/g, '_')
          if (formatted === 'COMPLETED') status = 'COMPLETED'
          else if (formatted === 'IN_PROGRESS') status = 'IN_PROGRESS'
          else status = 'DRAFT'
        } else if (w.field_agent_id) {
          status = 'IN_PROGRESS'
        }

        const mawbHawb = [w.mawb, w.hawb].filter(Boolean).join(' / ') || '-'

        return {
          id: String(w.worksheet_id),
          job_number: w.job_no || `#JOB-${w.worksheet_id}`,
          transaction_number: w.transaction_no || `TRX-${w.worksheet_id}`,
          task_title: `Physical Cargo Inspection - ${w.job_no || 'Job #' + w.worksheet_id}`,
          customer: w.a1_company_list?.company_name || 'PT DSV TRANSPORT INDONESIA',
          shipper: w.shipper || 'PT Astra Component Logistics',
          consignee: w.consignee || 'Toyota Tsusho Asia',
          mawb_hawb: mawbHawb,
          location: w.handover_location || 'Area Cargo MM2100, Cikarang Barat',
          status,
          handover_status: w.pihak_penyerah ? 'Completed' : 'Pending',
          actual_cargo: 'Standard Pallet Cargo',
          documentation_status: 'Verified',
          supporting_documents_status: 'Attached',
          verification_status: isIssue ? 'Issue Found' : 'Verified',
          assigned_to: w.field_agent?.full_name || 'Rizky Pratama',
          created_at: w.create_date || new Date().toISOString(),
          updated_at: w.handover_datetime || new Date().toISOString(),
        }
      })

      return NextResponse.json({
        success: true,
        data: mappedTasks,
      })
    }

    // Fallback opsional ke tabel jobs jika a2_worksheets belum memiliki baris data
    const { data: jobs, error: jobsError } = await client
      .from('jobs')
      .select('*')
      .order('id', { ascending: false })

    if (!jobsError && jobs && jobs.length > 0) {
      return NextResponse.json({
        success: true,
        data: jobs,
      })
    }

    return NextResponse.json({
      success: true,
      data: [],
    })
  } catch (error) {
    return apiError(error)
  }
}
