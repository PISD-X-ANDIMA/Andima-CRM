import { NextRequest } from 'next/server'
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response'
import { getCustomers } from '@/lib/services/customer-service'
import type { CustomerListItem } from '@/types/customer'

export const dynamic = 'force-dynamic'

/** Read-only dashboard projection; transaction and job values remain owned by A2. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const search = params.get('search')?.trim() || ''
  const from = params.get('from')?.trim() || ''
  const to = params.get('to')?.trim() || ''
  const company = params.get('company')?.trim() || ''
  const pic = params.get('pic')?.trim() || ''
  const jobNumber = params.get('jobNumber')?.trim() || ''
  const page = Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(params.get('limit') || '5', 10) || 5))

  try {
    // Collect company pages before paginating the rows which actually have an A2 transaction.
    const transactionRows: CustomerListItem[] = []
    let pageNumber = 1
    let totalPages = 1
    do {
      const result = await getCustomers({
        search,
        page: pageNumber,
        perPage: 100,
        requireTransactions: true,
      })
      transactionRows.push(...result.customers.filter((customer) => customer.transactionNo))
      totalPages = result.totalPages
      pageNumber += 1
    } while (pageNumber <= totalPages)

    let filteredRows = transactionRows
    if (from || to) {
      filteredRows = filteredRows.filter((customer) => {
        const itemDate = (customer.createdAt || customer.createdDate || '').slice(0, 10)
        if (!itemDate) return false
        if (from && itemDate < from) return false
        if (to && itemDate > to) return false
        return true
      })
    }

    if (company && company !== 'All Company') {
      filteredRows = filteredRows.filter((customer) => customer.companyName.toLowerCase() === company.toLowerCase())
    }

    if (pic && pic !== 'All PIC') {
      filteredRows = filteredRows.filter((customer) => customer.primaryPic?.fullName.toLowerCase() === pic.toLowerCase())
    }

    if (jobNumber && jobNumber !== 'All Job Number') {
      filteredRows = filteredRows.filter((customer) => (customer.jobNumber || '').toLowerCase().includes(jobNumber.toLowerCase()))
    }

    const hasFilters = Boolean(
      search ||
      from ||
      to ||
      (company && company !== 'All Company') ||
      (pic && pic !== 'All PIC') ||
      (jobNumber && jobNumber !== 'All Job Number')
    )

    if (hasFilters && filteredRows.length === 0) {
      return createErrorResponse('SRCH_001', 'No customer or transaction found', undefined, 404)
    }

    const offset = (page - 1) * limit
    const rows = filteredRows.slice(offset, offset + limit)
    return createSuccessResponse(rows, {
      total: filteredRows.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filteredRows.length / limit)),
    })
  } catch {
    return createErrorResponse('SRCH_002', 'The customer or transaction search failed', undefined, 500)
  }
}

