import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function fetchWebContent(url: string): Promise<{ title: string; content: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = titleMatch?.[1]?.trim() || '网页内容'
    
    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i)
    const description = descMatch?.[1]?.trim() || ''
    
    return {
      title: title.length > 100 ? title.substring(0, 100) + '...' : title,
      content: description || '这是一个网页链接'
    }
  } catch (error) {
    console.error('Error fetching web content:', error)
    throw new Error('Failed to fetch web content')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, category } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      )
    }
    
    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      )
    }
    
    // Fetch web content
    const { title, content } = await fetchWebContent(url)
    
    // Add category context to the summary
    const categoryContext: Record<string, string> = {
      strategy: '从战略管理角度来看，',
      product: '从产品设计角度来看，', 
      technology: '从技术发展角度来看，'
    }
    const contextPrefix = categoryContext[category] || ''
    
    const enhancedSummary = content ? `${contextPrefix}${content}` : `这是一个关于${title}的网页链接。`
    
    return NextResponse.json({
      success: true,
      data: {
        title: title || '网页内容摘要',
        summary: enhancedSummary,
        originalUrl: url
      }
    })
    
  } catch (error) {
    console.error('Error in summarize API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to summarize content',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}