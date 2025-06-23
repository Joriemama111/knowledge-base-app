import { NextRequest, NextResponse } from 'next/server'
import { getNotionQAItems, addNotionQAItem, updateNotionQAItem, deleteNotionQAItem } from '@/lib/notion'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    
    const qaItems = await getNotionQAItems(category || undefined)
    
    return NextResponse.json({
      success: true,
      data: qaItems
    })
  } catch (error) {
    console.error('Error in QA API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch QA items',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, category, tags } = body
    
    if (!title || !content || !category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: title, content, category' 
        },
        { status: 400 }
      )
    }
    
    const newItem = await addNotionQAItem({
      title,
      content,
      category,
      tags
    })
    
    if (!newItem) {
      throw new Error('Failed to create item in Notion')
    }
    
    return NextResponse.json({
      success: true,
      data: newItem
    })
  } catch (error) {
    console.error('Error in QA POST API:', error)
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create QA item',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, content, category, tags } = body
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required field: id' 
        },
        { status: 400 }
      )
    }
    
    const success = await updateNotionQAItem(id, {
      title,
      content,
      category,
      tags
    })
    
    if (!success) {
      throw new Error('Failed to update item in Notion')
    }
    
    return NextResponse.json({
      success: true,
      message: 'QA item updated successfully'
    })
  } catch (error) {
    console.error('Error in QA PUT API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update QA item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required parameter: id' 
        },
        { status: 400 }
      )
    }
    
    const success = await deleteNotionQAItem(id)
    
    if (!success) {
      throw new Error('Failed to delete item from Notion')
    }
    
    return NextResponse.json({
      success: true,
      message: 'QA item deleted successfully'
    })
  } catch (error) {
    console.error('Error in QA DELETE API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete QA item',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 