import { NextRequest, NextResponse } from 'next/server'
import { getNotionReadingItems, addNotionReadingItem } from '@/lib/notion'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    
    const readingItems = await getNotionReadingItems(category || undefined)
    
    return NextResponse.json({
      success: true,
      data: readingItems
    })
  } catch (error) {
    console.error('Error in Reading API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch reading items',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, type, category, link, title } = body
    
    if (!text || !type) {
      return NextResponse.json(
        { success: false, error: 'Text and type are required' },
        { status: 400 }
      )
    }
    
    const result = await addNotionReadingItem({
      text,
      type,
      category: category || 'strategy',
      link,
      title
    })
    
    if (result) {
      return NextResponse.json({
        success: true,
        data: result
      })
    } else {
      throw new Error('Failed to create item in Notion')
    }
  } catch (error) {
    console.error('Error in Reading POST API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create reading item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 