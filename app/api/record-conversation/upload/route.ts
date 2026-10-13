import { NextRequest, NextResponse } from 'next/server';
import { uploadConversationFile } from '@/backend/record_conversation/uploadService';

/**
 * POST /api/record-conversation/upload
 * Endpoint untuk upload berkas percakapan / meeting note.
 * Menerima FormData dengan key 'file'.
 * Mengembalikan metadata berkas yang siap disisipkan ke tabel a2_conversation_files.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file uploaded. Key "file" is required in FormData.',
        },
        { status: 400 }
      );
    }

    const result = await uploadConversationFile(file);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to process file upload',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/record-conversation/upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
