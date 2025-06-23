import { Client } from '@notionhq/client'

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
  notionVersion: '2022-06-28',
})

// Types for Notion data
export interface NotionQAItem {
  id: string
  title: string
  content: string
  category: string
  timestamp: Date
  tags?: string[]
}

export interface NotionReadingItem {
  id: string
  text: string
  link?: string
  type: 'required' | 'optional'
  category: string
  timestamp: Date
  title?: string
}

// Helper function to extract text from Notion rich text
function extractTextFromRichText(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return ''
  return richText.map(text => text.plain_text || '').join('')
}

// Helper function to extract rich text content (including formatting)
function extractRichTextContent(richText: any[]): string {
  if (!richText || !Array.isArray(richText)) return ''
  
  return richText.map(text => {
    let content = text.plain_text || ''
    
    // Apply formatting
    if (text.annotations?.bold) {
      content = `**${content}**`
    }
    if (text.annotations?.italic) {
      content = `*${content}*`
    }
    
    return content
  }).join('')
}

// Fetch QA items from Notion database
export async function getNotionQAItems(category?: string): Promise<NotionQAItem[]> {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID
    if (!databaseId) {
      console.error('NOTION_DATABASE_ID not configured')
      return []
    }

    // Map app categories to Notion categories
    const categoryMap: Record<string, string> = {
      'strategy': 'Strategy',
      'product': 'Product', 
      'technology': 'Technology'
    }

    const notionCategory = category ? categoryMap[category] : undefined

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: notionCategory ? {
        property: 'Category',
        select: {
          equals: notionCategory
        }
      } : undefined,
      sorts: [
        {
          property: 'Created',
          direction: 'descending'
        }
      ]
    })

    const qaItems: NotionQAItem[] = response.results.map((page: any) => {
      const properties = page.properties
      
      return {
        id: page.id,
        title: extractTextFromRichText(properties.Title?.title || properties.Name?.title),
        content: extractRichTextContent(properties.Text?.rich_text || properties.Content?.rich_text || []),
        category: extractTextFromRichText(properties.Category?.select?.name ? [{ plain_text: properties.Category.select.name }] : []),
        timestamp: new Date(properties.Created?.created_time || page.created_time),
        tags: extractTextFromRichText(properties.Tags?.rich_text || []).split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      }
    })

    return qaItems
  } catch (error) {
    console.error('Error fetching QA items from Notion:', error)
    return []
  }
}

// Fetch reading items from Notion database
export async function getNotionReadingItems(category?: string): Promise<NotionReadingItem[]> {
  try {
    const databaseId = process.env.NOTION_READING_DATABASE_ID || process.env.NOTION_DATABASE_ID
    if (!databaseId) {
      console.error('NOTION_DATABASE_ID not configured')
      return []
    }

    const filters: any[] = [
      {
        property: 'Type',
        select: {
          is_not_empty: true
        }
      }
    ]

    if (category) {
      // Map app categories to Notion categories
      const categoryMap: Record<string, string> = {
        'strategy': 'Strategy',
        'product': 'Product', 
        'technology': 'Technology'
      }
      const notionCategory = categoryMap[category] || category
      
      filters.push({
        property: 'Category',
        select: {
          equals: notionCategory
        }
      })
    }

    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: filters
      },
      sorts: [
        {
          property: 'Created',
          direction: 'descending'
        }
      ]
    })

    const readingItems: NotionReadingItem[] = response.results.map((page: any) => {
      const properties = page.properties
      const text = extractTextFromRichText(properties.Text?.rich_text || properties.Title?.title || properties.Name?.title)
      
      // Extract URL from text
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const urls = text.match(urlRegex)
      const link = urls ? urls[0] : extractTextFromRichText(properties.Link?.url ? [{ plain_text: properties.Link.url }] : [])
      
      return {
        id: page.id,
        text: text,
        link: link || undefined,
        type: properties.Type?.select?.name?.toLowerCase() === 'required' ? 'required' : 'optional',
        category: extractTextFromRichText(properties.Category?.select?.name ? [{ plain_text: properties.Category.select.name }] : []),
        timestamp: new Date(properties.Created?.created_time || page.created_time)
      }
    })

    return readingItems
  } catch (error) {
    console.error('Error fetching reading items from Notion:', error)
    return []
  }
}

// Add new QA item to Notion
export async function addNotionQAItem(item: Omit<NotionQAItem, 'id' | 'timestamp'>): Promise<NotionQAItem | null> {
  try {
    const databaseId = process.env.NOTION_DATABASE_ID
    if (!databaseId) {
      console.error('NOTION_DATABASE_ID not configured')
      return null
    }

    // Create properties object with the exact field names from the database
    let properties: any = {}
    
    // Title field
    if (item.title) {
      properties.Title = {
        title: [{ text: { content: item.title } }]
      }
    }
    
    // Text field (content) - handle Notion's 2000 character limit
    if (item.content) {
      // If content is longer than 2000 characters, truncate it
      const maxLength = 1950 // Leave some buffer
      let content = item.content
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...\n\n[内容已截断，完整内容请在应用中查看]'
      }
      
      properties.Text = {
        rich_text: [{ text: { content } }]
      }
    }
    
    // Category field - map app category to Notion category
    if (item.category) {
      const categoryMap: Record<string, string> = {
        'strategy': 'Strategy',
        'product': 'Product', 
        'technology': 'Technology'
      }
      const notionCategory = categoryMap[item.category] || item.category
      
      properties.Category = {
        select: { name: notionCategory }
      }
    }
    
    // Tags field (as rich_text, not multi_select)
    if (item.tags && item.tags.length > 0) {
      properties.Tags = {
        rich_text: [{ text: { content: item.tags.join(', ') } }]
      }
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties
    })

    return {
      id: response.id,
      title: item.title,
      content: item.content,
      category: item.category,
      timestamp: new Date(),
      tags: item.tags
    }
  } catch (error) {
    console.error('Error adding QA item to Notion:', error)
    return null
  }
}

// Update QA item in Notion
export async function updateNotionQAItem(id: string, updates: Partial<NotionQAItem>): Promise<boolean> {
  try {
    const properties: any = {}
    
    if (updates.title) {
      properties.Title = {
        title: [
          {
            text: {
              content: updates.title
            }
          }
        ]
      }
    }
    
    if (updates.content) {
      // Handle Notion's 2000 character limit
      const maxLength = 1950 // Leave some buffer
      let content = updates.content
      if (content.length > maxLength) {
        content = content.substring(0, maxLength) + '...\n\n[内容已截断，完整内容请在应用中查看]'
      }
      
      properties.Text = {
        rich_text: [
          {
            text: {
              content: content
            }
          }
        ]
      }
    }
    
    if (updates.category) {
      properties.Category = {
        select: {
          name: updates.category
        }
      }
    }
    
    if (updates.tags) {
      properties.Tags = {
        rich_text: [{ text: { content: updates.tags.join(', ') } }]
      }
    }

    await notion.pages.update({
      page_id: id,
      properties
    })

    return true
  } catch (error) {
    console.error('Error updating QA item in Notion:', error)
    return false
  }
}

// Add new reading item to Notion
export async function addNotionReadingItem(item: Omit<NotionReadingItem, 'id' | 'timestamp'>): Promise<NotionReadingItem | null> {
  try {
    const databaseId = process.env.NOTION_READING_DATABASE_ID || process.env.NOTION_DATABASE_ID
    if (!databaseId) {
      console.error('NOTION_READING_DATABASE_ID not configured')
      return null
    }

    // Create properties object
    let properties: any = {}
    
    // Title field
    if (item.title) {
      properties.Title = {
        title: [{ text: { content: item.title } }]
      }
    }
    
    // Text field
    if (item.text) {
      // Handle Notion's 2000 character limit
      const maxLength = 1950 // Leave some buffer
      let text = item.text
      if (text.length > maxLength) {
        text = text.substring(0, maxLength) + '...\n\n[内容已截断，完整内容请在应用中查看]'
      }
      
      properties.Text = {
        rich_text: [{ text: { content: text } }]
      }
    }
    
    // Type field - map app type to Notion type
    if (item.type) {
      const typeMap: Record<string, string> = {
        'required': 'Required',
        'optional': 'Optional'
      }
      const notionType = typeMap[item.type] || item.type
      
      properties.Type = {
        select: { name: notionType }
      }
    }
    
    // Category field - map app category to Notion category
    if (item.category) {
      const categoryMap: Record<string, string> = {
        'strategy': 'Strategy',
        'product': 'Product', 
        'technology': 'Technology'
      }
      const notionCategory = categoryMap[item.category] || item.category
      
      properties.Category = {
        select: { name: notionCategory }
      }
    }
    
    // Links field
    if (item.link) {
      properties.Links = {
        url: item.link
      }
    }

    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties
    })

    return {
      id: response.id,
      text: item.text,
      link: item.link,
      type: item.type,
      category: item.category,
      timestamp: new Date(),
      title: item.title
    }
  } catch (error) {
    console.error('Error adding reading item to Notion:', error)
    return null
  }
}

// Delete QA item from Notion
export async function deleteNotionQAItem(id: string): Promise<boolean> {
  try {
    await notion.pages.update({
      page_id: id,
      archived: true
    })
    return true
  } catch (error) {
    console.error('Error deleting QA item from Notion:', error)
    return false
  }
} 