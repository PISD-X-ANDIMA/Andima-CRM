import { NextResponse } from 'next/server'
import { getA3ReadClient, getA3WriteClient, apiError, requireText, writeHistory } from '@/lib/a3'

export const dynamic = 'force-dynamic'

interface A3TaskRecord {
  id: string
  'Job Number'?: string | null
  job_number?: string | null
  transaction_number?: string | null
  task_title?: string | null
  Customer?: string | null
  customer?: string | null
  'Nama Field Agent'?: string | null
  assigned_to?: string | null
  'Sales Executive'?: string | null
  sales_executive?: string | null
  Origin?: string | null
  origin?: string | null
  Destination?: string | null
  destination?: string | null
  'Has Issue'?: boolean | null
  has_issue?: boolean | null
  status?: string | null
  handover_status?: string | null
  actual_cargo?: string | null
  documentation_status?: string | null
  supporting_documents_status?: string | null
  verification_status?: string | null
  mawb_hawb?: string | null
  location?: string | null
  shipper?: string | null
  consignee?: string | null
  created_at?: string | null
  updated_at?: string | null
}

function mapA3TaskRow(row: A3TaskRecord) {
  const jNum = row['Job Number'] ?? row.job_number ?? ''
  const cust = row['Customer'] ?? row.customer ?? null
  const faName = row['Nama Field Agent'] ?? row.assigned_to ?? null
  const seName = row['Sales Executive'] ?? row.sales_executive ?? null
  const origin = row['Origin'] ?? row.origin ?? null
  const dest = row['Destination'] ?? row.destination ?? null

  let hasIssueVal: boolean | null = null
  if (row['Has Issue'] !== undefined && row['Has Issue'] !== null) {
    hasIssueVal = Boolean(row['Has Issue'])
  } else if (row.has_issue !== undefined && row.has_issue !== null) {
    hasIssueVal = Boolean(row.has_issue)
  } else if (row.status === 'HAS_ISSUE' || row.verification_status === 'Issue Found') {
    hasIssueVal = true
  } else if (row.status === 'COMPLETED') {
    hasIssueVal = false
  }

  const rawStatus = (row.status || '').trim().toUpperCase()
  const isCompleted = rawStatus === 'COMPLETED' || rawStatus === 'SELESAI'
  let normalizedStatus: 'COMPLETED' | 'HAS_ISSUE' | 'IN_PROGRESS' | 'DRAFT' | 'PENDING' = 'DRAFT'
  if (hasIssueVal === true || rawStatus === 'HAS_ISSUE') {
    normalizedStatus = 'HAS_ISSUE'
  } else if (isCompleted) {
    normalizedStatus = 'COMPLETED'
  } else if (rawStatus === 'IN_PROGRESS') {
    normalizedStatus = 'IN_PROGRESS'
  } else if (rawStatus === 'DRAFT') {
    normalizedStatus = 'DRAFT'
  } else {
    normalizedStatus = 'PENDING'
  }

  return {
    id: String(row.id),
    job_number: jNum,
    transaction_number: row.transaction_number ?? '',
    task_title: row.task_title ?? `Inspection - ${jNum}`,
    customer: cust,
    field_agent_name: faName,
    sales_executive: seName,
    shipper: row.shipper ?? cust,
    consignee: row.consignee ?? dest,
    origin,
    destination: dest,
    mawb_hawb: row.mawb_hawb ?? null,
    location: row.location ?? null,
    status: normalizedStatus,
    raw_status: row.status ?? null,
    handover_status: row.handover_status ?? null,
    actual_cargo: row.actual_cargo ?? null,
    documentation_status: row.documentation_status ?? null,
    supporting_documents_status: row.supporting_documents_status ?? null,
    verification_status: row.verification_status ?? null,
    assigned_to: faName,
    has_issue: hasIssueVal,
    created_at: row.created_at ?? new Date().toISOString(),
    updated_at: row.updated_at ?? new Date().toISOString(),
  }
}

export async function GET(request: Request): Promise<NextResponse> {
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

    const url = new URL(request.url)
    const jobNumberParam = url.searchParams.get('jobNumber')

    // Single job detail request with relational data
    if (jobNumberParam) {
      const cleanJob = jobNumberParam.trim().replace(/^#/, '')

      // 1. Fetch task row from a3_tasks by exact column 'Job Number'
      let { data: taskRows, error: taskErr } = await client
        .from('a3_tasks')
        .select('*')
        .eq('Job Number', cleanJob)
        .limit(1)

      if (taskErr) {
        console.error('[GET A3-tasks] Error querying single task from a3_tasks:', taskErr)
      }

      // Fallback check by transaction_number if not matched by Job Number
      if ((!taskRows || taskRows.length === 0) && !taskErr) {
        const { data: trxRows } = await client
          .from('a3_tasks')
          .select('*')
          .eq('transaction_number', cleanJob)
          .limit(1)
        if (trxRows && trxRows.length > 0) {
          taskRows = trxRows
        }
      }

      let mappedTask = null
      if (taskRows && taskRows.length > 0) {
        mappedTask = mapA3TaskRow(taskRows[0] as unknown as A3TaskRecord)
      } else {
        // Fallback check in a2_worksheets/vw_field_tasks
        const { data: wsRows } = await client
          .from('a2_worksheets')
          .select('*')
          .eq('job_no', cleanJob)
          .limit(1)
        if (wsRows && wsRows.length > 0) {
          const ws = wsRows[0]
          mappedTask = {
            id: String(ws.worksheet_id),
            job_number: ws.job_no,
            transaction_number: ws.transaction_no,
            task_title: `Physical Cargo Inspection - ${ws.job_no}`,
            customer: ws.shipper || null,
            field_agent_name: null,
            sales_executive: null,
            shipper: ws.shipper || null,
            consignee: ws.consignee || null,
            origin: null,
            destination: ws.consignee || null,
            mawb_hawb: [ws.mawb, ws.hawb].filter(Boolean).join(' / ') || null,
            location: ws.handover_location || null,
            status: ws.has_issue ? 'HAS_ISSUE' : 'DRAFT',
            raw_status: null,
            handover_status: ws.handover_datetime ? 'COMPLETED' : 'PENDING',
            actual_cargo: null,
            documentation_status: 'PENDING',
            supporting_documents_status: 'PENDING',
            verification_status: null,
            assigned_to: null,
            has_issue: Boolean(ws.has_issue),
            created_at: ws.create_date || new Date().toISOString(),
            updated_at: ws.updated_at || new Date().toISOString(),
          }
        }
      }

      if (!mappedTask) {
        return NextResponse.json({
          success: false,
          error: `Pekerjaan dengan Job Number ${cleanJob} tidak ditemukan.`,
        }, { status: 404 })
      }

      // 2. Fetch related details in parallel (handover, documentation, verifications, issues, history)
      const [handoverRes, docRes, verifRes, issueRes, historyRes] = await Promise.all([
        client.from('a3_handovers').select('*').eq('job_number', cleanJob).order('created_at', { ascending: false }).limit(1),
        client.from('a3_documentation').select('*').eq('job_number', cleanJob).order('created_at', { ascending: false }).limit(1),
        client.from('a3_verifications').select('*').eq('job_number', cleanJob).order('created_at', { ascending: false }).limit(1),
        client.from('a3_issues').select('*').eq('job_number', cleanJob).order('reported_at', { ascending: false }),
        client.from('a3_history').select('*').eq('job_number', cleanJob).order('created_at', { ascending: true }),
      ])

      return NextResponse.json({
        success: true,
        data: {
          task: mappedTask,
          handover: handoverRes.data?.[0] ?? null,
          documentation: docRes.data?.[0] ?? null,
          verification: verifRes.data?.[0] ?? null,
          issues: issueRes.data ?? [],
          history: historyRes.data ?? [],
        },
      })
    }

    // List all tasks directly from a3_tasks
    const { data: tasks, error: taskError } = await client
      .from('a3_tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (taskError) {
      console.error('[GET A3-tasks] Database error querying a3_tasks:', taskError)
      // Fallback query to vw_field_tasks if a3_tasks fails
      const { data: fallbackTasks, error: fbError } = await client
        .from('vw_field_tasks')
        .select('*')
        .order('worksheet_id', { ascending: false })

      if (fbError || !fallbackTasks) {
        return NextResponse.json({
          success: false,
          error: 'Gagal mengambil data tugas lapangan dari database.',
        }, { status: 500 })
      }

      const mappedFallback = fallbackTasks.map((w: any) => ({
        id: String(w.worksheet_id),
        job_number: w.job_no || `#JOB-${w.worksheet_id}`,
        transaction_number: w.transaction_no || `TRX-${w.worksheet_id}`,
        task_title: `Physical Cargo Inspection - ${w.job_no || 'Job #' + w.worksheet_id}`,
        customer: w.customer_name || null,
        sales_executive: w.sales_pic_name || null,
        shipper: w.shipper || null,
        consignee: w.consignee || null,
        origin: null,
        destination: null,
        mawb_hawb: [w.mawb, w.hawb].filter(Boolean).join(' / ') || '-',
        location: w.handover_location || null,
        status: w.field_stage === 'Completed' ? 'COMPLETED' : (w.has_issue ? 'HAS_ISSUE' : 'DRAFT'),
        handover_status: w.handover_done ? 'COMPLETED' : 'PENDING',
        actual_cargo: null,
        documentation_status: w.field_stage === 'Completed' ? 'COMPLETE' : 'PENDING',
        supporting_documents_status: null,
        verification_status: null,
        assigned_to: w.field_agent_name || null,
        has_issue: Boolean(w.has_issue),
        created_at: w.create_date || new Date().toISOString(),
        updated_at: w.updated_at || new Date().toISOString(),
      }))

      return NextResponse.json({
        success: true,
        data: mappedFallback,
      })
    }

    const taskRows = (tasks as unknown as A3TaskRecord[]) ?? []
    const mappedTasks = taskRows.map(mapA3TaskRow)

    return NextResponse.json({
      success: true,
      data: mappedTasks,
    })
  } catch (error) {
    console.error('[GET A3-tasks] Unexpected error:', error)
    return apiError(error, 500)
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const rawJobNumber = requireText(body.jobNumber, 'jobNumber', 100)
    const jobNumber = rawJobNumber.trim().replace(/^#/, '')
    const client = getA3WriteClient()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.status !== undefined) {
      const upper = String(body.status).toUpperCase()
      updatePayload.status = upper === 'COMPLETED' || upper === 'SELESAI' ? 'COMPLETED' : body.status
    }
    if (body.handoverStatus !== undefined) {
      updatePayload.handover_status = body.handoverStatus
    }
    if (body.documentationStatus !== undefined) {
      updatePayload.documentation_status = body.documentationStatus
    }
    if (body.verificationStatus !== undefined) {
      updatePayload.verification_status = body.verificationStatus
    }
    if (body.actualCargo !== undefined) {
      updatePayload.actual_cargo = body.actualCargo
    }
    if (body.location !== undefined) {
      updatePayload.location = body.location
    }
    if (body.hasIssue !== undefined) {
      updatePayload['Has Issue'] = Boolean(body.hasIssue)
    }
    if (body.fieldAgentName !== undefined) {
      updatePayload['Nama Field Agent'] = body.fieldAgentName
      updatePayload.assigned_to = body.fieldAgentName
    }
    if (body.salesExecutive !== undefined) {
      updatePayload['Sales Executive'] = body.salesExecutive
    }
    if (body.origin !== undefined) {
      updatePayload['Origin'] = body.origin
    }
    if (body.destination !== undefined) {
      updatePayload['Destination'] = body.destination
    }

    let { data, error } = await client
      .from('a3_tasks')
      .update(updatePayload)
      .eq('Job Number', jobNumber)
      .select()

    if ((!data || data.length === 0) && !error) {
      const trxUpdate = await client
        .from('a3_tasks')
        .update(updatePayload)
        .eq('transaction_number', jobNumber)
        .select()
      if (trxUpdate.data && trxUpdate.data.length > 0) {
        data = trxUpdate.data
      }
    }

    if (error) {
      console.error('[PATCH A3-tasks] Error updating a3_tasks:', error)
      return apiError(error, 500)
    }

    return NextResponse.json({
      success: true,
      message: `Status pekerjaan ${jobNumber} berhasil diperbarui di database.`,
      data,
    })
  } catch (error) {
    console.error('[PATCH A3-tasks] Catch error:', error)
    return apiError(error, 400)
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json()
    const rawJobNumber = requireText(body.jobNumber, 'jobNumber', 100)
    const jobNumber = rawJobNumber.trim().replace(/^#/, '')
    const client = getA3WriteClient()

    const customerName = body.customerName ? body.customerName.replace(/^\d+\.\s*/, '').trim() : 'PT Indofood CBP Sukses Makmur Tbk'
    const fieldAgentName = body.fieldAgentName || body.performedBy || 'Andima Field Agent'
    const salesExecutive = body.salesExecutive || 'Bu Wulan'
    const pieces = Number(body.actualPieces) || 24
    const weight = Number(body.actualGrossWeight) || 360
    const location = body.handoverLocation || body.location || 'Cengkareng, Banten, Indonesia'
    const origin = body.origin || 'Cengkareng, Banten, Indonesia'
    const destination = body.destination || 'Singapore (SIN)'
    const cargoDesc = body.cargo || body.commodity || 'General Cargo'
    const transactionNo = `TRX-${Date.now().toString().slice(-8)}`
    const mawbHawb = body.mawb || body.hawb ? [body.mawb, body.hawb].filter(Boolean).join(' / ') : `MAWB-${jobNumber}`

    // 1. Insert into a3_tasks
    const { data: newTask, error: insertTaskErr } = await client
      .from('a3_tasks')
      .insert({
        'Job Number': jobNumber,
        'Customer': customerName,
        'Nama Field Agent': fieldAgentName,
        'Sales Executive': salesExecutive,
        'Origin': origin,
        'Destination': destination,
        'Has Issue': false,
        status: 'DRAFT',
        handover_status: 'PENDING',
        actual_cargo: `${pieces} Pcs · ${weight} Kg`,
        documentation_status: 'PENDING',
        supporting_documents_status: 'PENDING',
        verification_status: 'PENDING',
        assigned_to: fieldAgentName,
        location: location,
        task_title: `Physical Cargo Inspection - ${jobNumber}`,
        transaction_number: transactionNo,
        shipper: customerName,
        consignee: destination,
        mawb_hawb: mawbHawb,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertTaskErr) {
      console.warn('[POST A3-tasks] Insert into a3_tasks warning:', insertTaskErr)
    }

    // 2. Backward compatibility insert to a2_worksheets
    try {
      let customerId = body.customerId
      if (!customerId) {
        const custQuery = customerName
          ? client.from('a1_company_list').select('company_list_id').ilike('company_name', `%${customerName.slice(0, 20)}%`).limit(1)
          : client.from('a1_company_list').select('company_list_id').limit(1)
        const { data: cData } = await custQuery
        customerId = cData?.[0]?.company_list_id || '909016c5-ecc1-41ba-b57f-2ba328d006ea'
      }

      await client
        .from('a2_worksheets')
        .insert({
          job_no: jobNumber,
          transaction_no: transactionNo,
          customer_id: customerId,
          created_by_user_id: 1,
          create_date: new Date().toISOString().split('T')[0],
          status_kendala: 'normal',
          field_agent_id: body.fieldAgentId || '9c274330-44f1-474d-91c0-523aac3ea9cf',
          sales_pic_id: body.salesPicId || '9c274330-44f1-474d-91c0-523aac3ea9cf',
          shipper: customerName,
          consignee: destination,
          mawb: body.mawb || `126-${Math.floor(10000000 + Math.random() * 90000000)}`,
          hawb: body.hawb || `HAWB-${jobNumber}`,
          handover_location: location,
          pihak_penyerah: body.deliveringParty || 'Budi Santoso',
          pihak_penerima: body.receivingParty || 'Andima Field Agent',
          is_dangerous_goods: false,
          has_issue: false,
        })
    } catch (wsErr) {
      console.warn('[POST A3-tasks] a2_worksheets sync skipped:', wsErr)
    }

    // 3. Write History
    await writeHistory({
      jobNumber,
      activity: 'Task Created by Field Agent',
      performedBy: fieldAgentName,
      notes: `Input New Task. Customer: ${customerName}, Origin: ${origin}, Destination: ${destination}, Komoditas: ${cargoDesc}, Koli: ${pieces} Pcs, Berat: ${weight} Kg`,
    }).catch(() => null)

    return NextResponse.json({
      success: true,
      message: `Task ${jobNumber} berhasil dibuat dan disimpan ke database.`,
      data: {
        job_number: jobNumber,
        task: newTask,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('[POST A3-tasks] Catch error:', error)
    return apiError(error, 400)
  }
}
