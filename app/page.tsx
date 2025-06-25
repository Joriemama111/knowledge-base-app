"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, ChevronDown, ChevronUp, ExternalLink, Trash2, User, AlertCircle, Edit2, GripVertical } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Sortable QA Card Component
interface SortableQACardProps {
  item: QAItem
  isExpanded: boolean
  searchQuery: string
  onToggleExpanded: (id: string) => void
  onEdit: (item: QAItem) => void
  onDelete: (id: string) => void
  renderRichContent: (content: string, isExpanded: boolean) => string
}

function SortableQACard({ 
  item, 
  isExpanded, 
  searchQuery, 
  onToggleExpanded, 
  onEdit, 
  onDelete, 
  renderRichContent 
}: SortableQACardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const shouldShowButton = item.content.length > 150
  const itemWithCategory = item as any // Type assertion for sourceCategory

  // Get category info for display
  const getCategoryInfo = (category: string) => {
    const categoryMap: Record<string, { label: string; color: string }> = {
      'strategy': { label: '战略', color: 'bg-blue-100 text-blue-800' },
      'product': { label: '产品', color: 'bg-green-100 text-green-800' },
      'technology': { label: '技术', color: 'bg-purple-100 text-purple-800' }
    }
    return categoryMap[category] || { label: category, color: 'bg-gray-100 text-gray-800' }
  }

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="border rounded-lg bg-gray-50 relative group"
    >
      <div className="border-l-4 border-blue-500 pl-4 pr-4 py-4">
        <div className="w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <button
                {...attributes}
                {...listeners}
                className="flex-shrink-0 w-6 h-6 hover:bg-gray-200 transition-colors duration-200 text-gray-400 hover:text-gray-600 flex items-center justify-center cursor-grab active:cursor-grabbing rounded"
                aria-label="拖拽移动"
                title="拖拽移动"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              
              <h3 className="font-bold text-lg">{item.title}</h3>
              {searchQuery && itemWithCategory.sourceCategory && (
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getCategoryInfo(itemWithCategory.sourceCategory).color}`}
                >
                  {getCategoryInfo(itemWithCategory.sourceCategory).label}
                </Badge>
              )}
            </div>
            {/* Action buttons on the right side of title */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(item)}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-100 transition-colors duration-200 text-gray-600 hover:text-blue-600 flex items-center justify-center"
                aria-label="编辑内容"
                title="编辑内容"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-red-100 transition-colors duration-200 text-gray-600 hover:text-red-600 flex items-center justify-center"
                aria-label="删除内容"
                title="删除内容"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {shouldShowButton && (
                <button
                  onClick={() => onToggleExpanded(item.id)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 text-gray-600 hover:text-gray-800 flex items-center justify-center"
                  aria-label={isExpanded ? "收起内容" : "展开内容"}
                  title={isExpanded ? "收起内容" : "展开内容"}
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Content area moved inside the blue border */}
          <div className="text-gray-700 leading-relaxed max-w-none overflow-hidden prose prose-sm pl-4">
            {shouldShowButton && !isExpanded ? (
              <div className="relative">
                <div
                  className="overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: "1.6",
                  }}
                  dangerouslySetInnerHTML={{ __html: renderRichContent(item.content, false) }}
                />
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50 to-transparent"></div>
              </div>
            ) : (
              <div className="break-words" dangerouslySetInnerHTML={{ __html: renderRichContent(item.content, true) }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface QAItem {
  id: string
  title: string
  content: string
  timestamp: any
  userId: string
  order?: number
}

interface ReadingItem {
  id: string
  text: string
  link?: string
  type: "required" | "optional"
  timestamp: any
  userId: string
}



export default function KnowledgeBasePage() {
  const [activeTab, setActiveTab] = useState("strategy")
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>({ uid: "demo-user-12345" })
  const [qaItems, setQaItems] = useState<QAItem[]>([])
  const [readingItems, setReadingItems] = useState<ReadingItem[]>([])
  const [allQaItems, setAllQaItems] = useState<Record<string, QAItem[]>>({})
  const [allReadingItems, setAllReadingItems] = useState<Record<string, ReadingItem[]>>({})
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isNewQAOpen, setIsNewQAOpen] = useState(false)
  const [newQATitle, setNewQATitle] = useState("")
  const [newQAContent, setNewQAContent] = useState("")
  const [editingItem, setEditingItem] = useState<QAItem | null>(null)
  const [isEditQAOpen, setIsEditQAOpen] = useState(false)
  const [editingReadingItem, setEditingReadingItem] = useState<ReadingItem | null>(null)
  const [isEditReadingOpen, setIsEditReadingOpen] = useState(false)
  const [newReadingText, setNewReadingText] = useState("")
  const [newOptionalText, setNewOptionalText] = useState("")
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false)
  const [isNotionAvailable, setIsNotionAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set())
  const [dataCache, setDataCache] = useState<Record<string, { qa: QAItem[], reading: ReadingItem[], timestamp: number }>>({})
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const { toast } = useToast()

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const tabs = [
    { id: "strategy", label: "战略", title: "战略知识库" },
    { id: "product", label: "产品", title: "产品知识库" },
    { id: "technology", label: "技术", title: "技术知识库" },
  ]

  // Initialize app
  useEffect(() => {
    console.log('Initializing app...')
    setIsFirebaseAvailable(false)
    setUser({ uid: "demo-user-12345" })
    
    // Initialize empty data first to show the UI
    const allCategories = ['strategy', 'product', 'technology']
    const emptyQaItems: Record<string, QAItem[]> = {}
    const emptyReadingItems: Record<string, ReadingItem[]> = {}
    
    for (const category of allCategories) {
      emptyQaItems[category] = []
      emptyReadingItems[category] = []
    }
    
    setAllQaItems(emptyQaItems)
    setAllReadingItems(emptyReadingItems)
    setIsLoading(false)
    console.log('App initialized successfully')
  }, [])

  // Load category data function with caching
  const loadCategoryData = async (category: string, force = false) => {
    const cacheKey = category
    const now = Date.now()
    const cacheExpiry = 5 * 60 * 1000 // 5 minutes cache
    
    // Check cache first (unless forced)
    if (!force && dataCache[cacheKey] && (now - dataCache[cacheKey].timestamp < cacheExpiry)) {
      console.log(`Using cached data for ${category}`)
      return dataCache[cacheKey]
    }

    // Add to loading set
    setLoadingCategories(prev => new Set(prev.add(category)))

    try {
      console.log(`Loading fresh data for ${category}...`)
      const [qaResponse, readingResponse] = await Promise.all([
        fetch(`/api/notion/qa?category=${category}`),
        fetch(`/api/notion/reading?category=${category}`)
      ])

      let qaItems: QAItem[] = []
      let readingItems: ReadingItem[] = []

      if (qaResponse.ok) {
        const qaData = await qaResponse.json()
        if (qaData.success) {
          qaItems = qaData.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            content: item.content,
            timestamp: new Date(item.timestamp),
            userId: 'notion-user',
            category: category
          }))
        }
      }

      if (readingResponse.ok) {
        const readingData = await readingResponse.json()
        if (readingData.success) {
          readingItems = readingData.data.map((item: any) => ({
            id: item.id,
            text: item.text,
            link: item.link,
            type: item.type,
            timestamp: new Date(item.timestamp),
            userId: 'notion-user',
            category: category
          }))
        }
      }

      const categoryData = { qa: qaItems, reading: readingItems, timestamp: now }
      
      // Update cache
      setDataCache(prev => ({
        ...prev,
        [cacheKey]: categoryData
      }))

      return categoryData
    } catch (error) {
      console.error(`Error loading ${category} data:`, error)
      return { qa: [], reading: [], timestamp: now }
    } finally {
      // Remove from loading set
      setLoadingCategories(prev => {
        const newSet = new Set(prev)
        newSet.delete(category)
        return newSet
      })
    }
  }

  // Initial data loading
  useEffect(() => {
    const initializeData = async () => {
      console.log('🚀 Initializing data...')
      setIsLoading(true)
      
      try {
        // Test Notion connection first
        const testResponse = await fetch(`/api/notion/qa?category=strategy`)
        if (testResponse.ok) {
          setIsNotionAvailable(true)
          console.log('✅ Notion integration available')
          
          // Immediately load current tab data
          console.log(`🔄 Loading initial data for ${activeTab}...`)
          const currentTabData = await loadCategoryData(activeTab, true) // force fresh load
          
          console.log(`📊 Initial load result:`, {
            qa: currentTabData.qa.length,
            reading: currentTabData.reading.length
          })
          
          // Set data immediately
          setQaItems(currentTabData.qa)
          setReadingItems(currentTabData.reading)
          setAllQaItems({ [activeTab]: currentTabData.qa })
          setAllReadingItems({ [activeTab]: currentTabData.reading })
          
          console.log('✅ Initial data loaded and set')
        } else {
          setIsNotionAvailable(false)
          console.log('❌ Notion integration not available')
        }
      } catch (error) {
        setIsNotionAvailable(false)
        console.log('❌ Notion integration error:', error)
      }
      
      setIsDataLoaded(true)
      setIsLoading(false)
    }

    initializeData()
  }, []) // Only run once on mount

  // Load data when tab changes (after initial load)
  useEffect(() => {
    const loadTabData = async () => {
      if (!isDataLoaded || !isNotionAvailable) {
        console.log('⏳ Skipping tab data load - not ready yet')
        return
      }
      
      console.log(`🔄 Loading data for tab: ${activeTab}`)
      
      // Check if we already have data for this tab
      if (allQaItems[activeTab] && allReadingItems[activeTab]) {
        console.log(`📋 Using cached data for ${activeTab}:`, {
          qa: allQaItems[activeTab].length,
          reading: allReadingItems[activeTab].length
        })
        setQaItems(allQaItems[activeTab])
        setReadingItems(allReadingItems[activeTab])
        return
      }
      
      // Load fresh data for this tab
      try {
        console.log(`🌐 Fetching fresh data for ${activeTab}...`)
        const categoryData = await loadCategoryData(activeTab, true) // force fresh
        
        console.log(`✅ Tab data loaded:`, {
          qa: categoryData.qa.length,
          reading: categoryData.reading.length,
          qaItems: categoryData.qa.map(item => ({ id: item.id, title: item.title })),
          readingItems: categoryData.reading.map(item => ({ id: item.id, text: item.text?.substring(0, 50) + '...' }))
        })
        
        // Update states
        setQaItems(categoryData.qa)
        setReadingItems(categoryData.reading)
        setAllQaItems(prev => ({ ...prev, [activeTab]: categoryData.qa }))
        setAllReadingItems(prev => ({ ...prev, [activeTab]: categoryData.reading }))
        
        console.log('✅ States updated for', activeTab)
      } catch (error) {
        console.error(`❌ Error loading ${activeTab} data:`, error)
        setQaItems([])
        setReadingItems([])
      }
    }

    // Only run if this is a tab switch (not initial load)
    if (isDataLoaded) {
      loadTabData()
    }
  }, [activeTab, isDataLoaded, isNotionAvailable])

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  const truncateContent = (content: string, maxLength: 200) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + "..."
  }

  const handleAddQA = async () => {
    if (!newQATitle.trim() || !newQAContent.trim() || !user) return

    const newItem: QAItem = {
      id: Date.now().toString(),
      title: newQATitle,
      content: newQAContent,
      timestamp: new Date(),
      userId: user.uid,
    }

    try {
      if (isNotionAvailable) {
        // Add to Notion
        const response = await fetch('/api/notion/qa', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: newQATitle,
            content: newQAContent,
            category: activeTab,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Add to local state with Notion ID and update allQaItems
            const notionItem = {
              ...newItem,
              id: result.data.id,
              userId: 'notion-user'
            }
            setQaItems((prev) => [notionItem, ...prev])
            setAllQaItems((prev) => ({
              ...prev,
              [activeTab]: [notionItem, ...(prev[activeTab] || [])]
            }))
          } else {
            throw new Error(result.error || 'Failed to add to Notion')
          }
        } else {
          throw new Error('Failed to add to Notion')
        }
      } else if (isFirebaseAvailable) {
        // Add to Firebase (implementation would go here)
        // For now, add to local state
        setQaItems((prev) => [newItem, ...prev])
      } else {
        // Add to local state
        setQaItems((prev) => [newItem, ...prev])
      }

      setNewQATitle("")
      setNewQAContent("")
      setIsNewQAOpen(false)
      toast({
        title: "发布成功",
        description: isNotionAvailable ? "问答内容已成功添加到 Notion 知识库" : "问答内容已成功添加到知识库",
      })
    } catch (error) {
      console.error("Error adding QA:", error)
      toast({
        title: "发布失败",
        description: error instanceof Error ? error.message : "添加内容时出现错误，请重试",
        variant: "destructive",
      })
    }
  }

  const handleEditQA = (item: QAItem) => {
    setEditingItem(item)
    setIsEditQAOpen(true)
  }

  const handleUpdateQA = async () => {
    if (!editingItem || !editingItem.title.trim() || !editingItem.content.trim()) return

    try {
      if (isNotionAvailable) {
        // Update in Notion
        const response = await fetch('/api/notion/qa', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingItem.id,
            title: editingItem.title,
            content: editingItem.content,
            category: activeTab,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Update local state
            setQaItems((prev) => 
              prev.map((item) => 
                item.id === editingItem.id 
                  ? { ...editingItem, timestamp: new Date() }
                  : item
              )
            )
          } else {
            throw new Error(result.error || 'Failed to update in Notion')
          }
        } else {
          throw new Error('Failed to update in Notion')
        }
      } else if (isFirebaseAvailable) {
        // Update in Firebase (implementation would go here)
        // For now, update in local state
        setQaItems((prev) => 
          prev.map((item) => 
            item.id === editingItem.id 
              ? { ...editingItem, timestamp: new Date() }
              : item
          )
        )
      } else {
        // Update in local state
        setQaItems((prev) => 
          prev.map((item) => 
            item.id === editingItem.id 
              ? { ...editingItem, timestamp: new Date() }
              : item
          )
        )
      }

      setEditingItem(null)
      setIsEditQAOpen(false)
      toast({
        title: "更新成功",
        description: isNotionAvailable ? "问答内容已在 Notion 中成功更新" : "问答内容已成功更新",
      })
    } catch (error) {
      console.error("Error updating QA:", error)
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "更新内容时出现错误，请重试",
        variant: "destructive",
      })
    }
  }

  const handleAddReading = async (text: string, type: "required" | "optional") => {
    if (!text.trim() || !user) return

    // Extract link if present
    const linkRegex = /(https?:\/\/[^\s]+)/g
    const links = text.match(linkRegex)
    const link = links ? links[0] : undefined

    let finalText = text
    let autoTitle = ""

    // If only a link is provided, try to auto-summarize
    if (link && text.trim() === link) {
      try {
        toast({
          title: "正在处理",
          description: "正在分析链接内容并生成摘要...",
        })

        const summaryResponse = await fetch('/api/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: link,
            category: activeTab
          }),
        })

        if (summaryResponse.ok) {
          const summaryResult = await summaryResponse.json()
          if (summaryResult.success) {
            finalText = summaryResult.data.summary
            autoTitle = summaryResult.data.title
            
            toast({
              title: "摘要生成成功",
              description: "已自动生成内容摘要和标题",
            })
          }
        }
      } catch (error) {
        console.error('Error generating summary:', error)
        toast({
          title: "摘要生成失败",
          description: "将使用原始链接内容",
          variant: "destructive",
        })
      }
    }

    const newItem: ReadingItem = {
      id: Date.now().toString(),
      text: finalText,
      link: link,
      type: type,
      timestamp: new Date(),
      userId: user.uid,
    }

    try {
      if (isNotionAvailable) {
        // Add to Notion
        const response = await fetch('/api/notion/reading', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: finalText,
            type: type,
            category: activeTab,
            link: link,
            title: autoTitle,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            // Add to local state with Notion ID and update allReadingItems
            const notionItem = {
              ...newItem,
              id: result.data.id,
              userId: 'notion-user'
            }
            setReadingItems((prev) => [notionItem, ...prev])
            setAllReadingItems((prev) => ({
              ...prev,
              [activeTab]: [notionItem, ...(prev[activeTab] || [])]
            }))
          } else {
            throw new Error(result.error || 'Failed to add to Notion')
          }
        } else {
          throw new Error('Failed to add to Notion')
        }
      } else if (isFirebaseAvailable) {
        // Add to Firebase (implementation would go here)
        // For now, add to local state
        setReadingItems((prev) => [newItem, ...prev])
      } else {
        // Add to local state
        setReadingItems((prev) => [newItem, ...prev])
      }

      if (type === "required") {
        setNewReadingText("")
      } else {
        setNewOptionalText("")
      }

      toast({
        title: "添加成功",
        description: isNotionAvailable ? 
          `已成功添加到 Notion 的${type === "required" ? "必读" : "选读"}列表` :
          `已添加到${type === "required" ? "必读" : "选读"}列表`,
      })
    } catch (error) {
      console.error("Error adding reading item:", error)
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加阅读项目时出现错误，请重试",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReading = async (id: string) => {
    try {
      if (isNotionAvailable) {
        const response = await fetch(`/api/notion/reading?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Remove from local state
          setReadingItems(prev => prev.filter(item => item.id !== id))
          // Also remove from allReadingItems
          setAllReadingItems(prev => ({
            ...prev,
            [activeTab]: prev[activeTab]?.filter(item => item.id !== id) || []
          }))
          toast({
            title: "删除成功",
            description: "阅读项目已从Notion删除",
          })
        } else {
          const data = await response.json()
          throw new Error(data.message || 'Failed to delete reading item')
        }
      } else {
        // Delete from local state only (demo mode)
        setReadingItems(prev => prev.filter(item => item.id !== id))
        setAllReadingItems(prev => ({
          ...prev,
          [activeTab]: prev[activeTab]?.filter(item => item.id !== id) || []
        }))
        toast({
          title: "删除成功",
          description: "阅读项目已删除",
        })
      }
    } catch (error) {
      console.error("Error deleting reading item:", error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const handleDeleteQA = async (id: string) => {
    try {
      if (isNotionAvailable) {
        const response = await fetch(`/api/notion/qa?id=${id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          // Remove from local state
          setQaItems(qaItems.filter(item => item.id !== id))
          // Also remove from allQaItems
          setAllQaItems(prev => ({
            ...prev,
            [activeTab]: prev[activeTab]?.filter(item => item.id !== id) || []
          }))
          toast({
            title: "删除成功",
            description: "问答内容已从Notion删除",
          })
        } else {
          const data = await response.json()
          throw new Error(data.message || 'Failed to delete QA item')
        }
      } else {
        // Delete from local state only (demo mode)
        setQaItems(qaItems.filter(item => item.id !== id))
        setAllQaItems(prev => ({
          ...prev,
          [activeTab]: prev[activeTab]?.filter(item => item.id !== id) || []
        }))
        toast({
          title: "删除成功",
          description: "问答内容已删除",
        })
      }
    } catch (error) {
      console.error('Error deleting QA item:', error)
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    }
  }

  const handleEditReading = (item: ReadingItem) => {
    setEditingReadingItem(item)
    setIsEditReadingOpen(true)
  }

  const handleUpdateReading = async () => {
    if (!editingReadingItem) return

    console.log('Updating reading item:', editingReadingItem) // Debug log

    try {
      // First update local state immediately for better UX
      setReadingItems(prev => 
        prev.map(item => 
          item.id === editingReadingItem.id ? editingReadingItem : item
        )
      )
      
      // Update allReadingItems state
      setAllReadingItems(prev => ({
        ...prev,
        [activeTab]: prev[activeTab]?.map(item => 
          item.id === editingReadingItem.id ? editingReadingItem : item
        ) || []
      }))

      // Close dialog immediately
      setIsEditReadingOpen(false)
      setEditingReadingItem(null)

      if (isNotionAvailable) {
        // Update in Notion in background
        const response = await fetch('/api/notion/reading', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editingReadingItem.id,
            text: editingReadingItem.text,
            link: editingReadingItem.link || '',
            type: editingReadingItem.type,
            category: activeTab,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (!result.success) {
            console.error('Notion update failed:', result.error)
            // Optionally revert local changes here if needed
          }
        } else {
          console.error('Failed to update in Notion:', response.status)
          // Optionally revert local changes here if needed
        }
      }
      
      toast({
        title: "更新成功",
        description: isNotionAvailable ? "阅读内容已更新（正在同步到Notion）" : "阅读内容已更新",
      })
    } catch (error) {
      console.error('Error updating reading item:', error)
      toast({
        title: "更新失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    }
  }

  // 渲染富文本内容
  const renderRichContent = (content: string, isExpanded: boolean = true) => {
    if (!content) return ''
    
    try {
      let processedContent = content
      
      // 处理文本格式
      processedContent = processedContent
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
      
      // 处理 Markdown 链接格式 [文本](链接)
      processedContent = processedContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline cursor-pointer !no-underline hover:underline" style="color: #2563eb !important; text-decoration: underline !important; cursor: pointer !important;">${text}</a>`
      })
      
      // 处理纯链接 - 匹配 http/https 开头的链接
      processedContent = processedContent.replace(/(^|[^"'>])(https?:\/\/[^\s<]+)/gi, (match, prefix, url) => {
        // 避免重复处理已经在 a 标签中的链接
        if (prefix.includes('href=')) return match
        
        // 截断显示很长的链接
        let displayUrl = url
        if (url.length > 50) {
          displayUrl = url.substring(0, 47) + '...'
        }
        
        return `${prefix}<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-all cursor-pointer" style="color: #2563eb !important; text-decoration: underline !important; cursor: pointer !important;">${displayUrl}</a>`
      })
      
      // 处理图片 - 标准 markdown 格式
      processedContent = processedContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        const imageClass = isExpanded 
          ? 'max-w-full h-auto rounded-lg my-2 shadow-sm border border-gray-200'
          : 'w-12 h-12 rounded-lg my-1 shadow-sm border border-gray-200 object-cover inline-block mr-2'
        
        const imageStyle = isExpanded 
          ? 'max-height: 250px; object-fit: contain;'
          : 'width: 48px; height: 48px; object-fit: cover;'
        
        return `<img src="${src}" alt="${alt}" class="${imageClass}" style="${imageStyle}" />`
      })
      
      // 处理换行
      processedContent = processedContent.replace(/\n/g, "<br />")
      
      return processedContent
    } catch (error) {
      console.error('Error processing rich content:', error)
      return content.replace(/\n/g, "<br />") // 返回基本处理的内容
    }
  }

  // Search across all categories when there's a search query
  const getFilteredQAItems = () => {
    if (!searchQuery.trim()) {
      return qaItems
    }
    
    // Search across all categories
    const allItems = Object.entries(allQaItems).flatMap(([category, items]) => 
      items.map(item => ({ ...item, sourceCategory: category }))
    )
    
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const filteredQAItems = getFilteredQAItems()

  // Filter reading items based on search query
  const getFilteredReadingItems = (type: "required" | "optional") => {
    const items = readingItems.filter((item) => item.type === type)
    if (searchQuery) {
      return items.filter((item) =>
        item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.link && item.link.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    return items
  }

  const requiredReading = getFilteredReadingItems("required")
  const optionalReading = getFilteredReadingItems("optional")

  // Handle drag end for QA items
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = qaItems.findIndex((item) => item.id === active.id)
    const newIndex = qaItems.findIndex((item) => item.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const newQaItems = arrayMove(qaItems, oldIndex, newIndex)
      
      // Update order for each item
      const updatedItems = newQaItems.map((item, index) => ({
        ...item,
        order: index
      }))

      setQaItems(updatedItems)
      
      // Update the allQaItems state
      const newAllQaItems = { ...allQaItems }
      newAllQaItems[activeTab] = updatedItems
      setAllQaItems(newAllQaItems)

      // TODO: Save order to backend if needed
      toast({
        title: "排序已更新",
        description: "知识卡片顺序已保存",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载知识库...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">


        {/* Chrome-style Tab Navigation with Search */}
        <div className="mb-8">
          <div className="flex items-end justify-between border-b border-gray-200">
            <div className="flex items-end">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative px-6 py-3 text-sm font-medium rounded-t-lg mr-1 transition-all duration-200 flex items-center gap-2
                    ${
                      activeTab === tab.id && !searchQuery
                        ? "bg-white text-gray-900 border-t border-l border-r border-gray-200 -mb-px z-10"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                    }
                  `}
                >
                  {tab.label}
                  {loadingCategories.has(tab.id) && (
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                  )}
                  {activeTab === tab.id && !searchQuery && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={searchQuery ? "搜索全部内容..." : "搜索知识库内容..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-500 hover:text-gray-700"
                >
                  清除
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {searchQuery && (
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                <span>搜索结果 <span className="text-lg text-gray-600">"{searchQuery}"</span></span>
              </h1>
            </div>
          )}

          {/* QA Knowledge Base Section */}
          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">问答知识库</CardTitle>
              <Dialog open={isNewQAOpen} onOpenChange={setIsNewQAOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    新建内容
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>创建新的问答内容</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="title">标题</Label>
                      <Input
                        id="title"
                        value={newQATitle}
                        onChange={(e) => setNewQATitle(e.target.value)}
                        placeholder="输入问题标题..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="content">内容</Label>
                      <RichTextEditor
                        value={newQAContent}
                        onChange={setNewQAContent}
                        placeholder="输入详细回答..."
                        rows={10}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsNewQAOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleAddQA}>发布</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit QA Dialog */}
              <Dialog open={isEditQAOpen} onOpenChange={setIsEditQAOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>编辑问答内容</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="edit-title">标题</Label>
                      <Input
                        id="edit-title"
                        value={editingItem?.title || ""}
                        onChange={(e) => 
                          setEditingItem(editingItem ? { ...editingItem, title: e.target.value } : null)
                        }
                        placeholder="输入问题标题..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-content">内容</Label>
                      <RichTextEditor
                        value={editingItem?.content || ""}
                        onChange={(content) => 
                          setEditingItem(editingItem ? { ...editingItem, content } : null)
                        }
                        placeholder="输入详细回答..."
                        rows={10}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => {
                        setIsEditQAOpen(false)
                        setEditingItem(null)
                      }}>
                        取消
                      </Button>
                      <Button onClick={handleUpdateQA}>保存更改</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Edit Reading Dialog */}
              <Dialog open={isEditReadingOpen} onOpenChange={setIsEditReadingOpen}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>编辑阅读内容</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-reading-text">内容</Label>
                      <Textarea
                        id="edit-reading-text"
                        value={editingReadingItem?.text || ""}
                        onChange={(e) => 
                          setEditingReadingItem(editingReadingItem ? { ...editingReadingItem, text: e.target.value } : null)
                        }
                        placeholder="编辑阅读内容..."
                        rows={4}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-reading-link">链接 (可选)</Label>
                      <Input
                        id="edit-reading-link"
                        value={editingReadingItem?.link || ""}
                        onChange={(e) => 
                          setEditingReadingItem(editingReadingItem ? { ...editingReadingItem, link: e.target.value } : null)
                        }
                        placeholder="输入链接地址..."
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => {
                        setIsEditReadingOpen(false)
                        setEditingReadingItem(null)
                      }}>
                        取消
                      </Button>
                      <Button onClick={handleUpdateReading}>保存更改</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                    <span>正在初始化应用...</span>
                  </div>
                </div>
              ) : loadingCategories.has(activeTab) ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3 text-gray-600">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                    <span>正在加载 {tabs.find(t => t.id === activeTab)?.label} 知识库...</span>
                  </div>
                </div>
              ) : filteredQAItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? "没有找到匹配的内容" : `暂无${tabs.find(t => t.id === activeTab)?.label}问答内容，点击"新建内容"开始添加`}
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredQAItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {filteredQAItems.map((item) => (
                        <SortableQACard
                          key={item.id}
                          item={item}
                          isExpanded={expandedItems.has(item.id)}
                          searchQuery={searchQuery}
                          onToggleExpanded={toggleExpanded}
                          onEdit={handleEditQA}
                          onDelete={handleDeleteQA}
                          renderRichContent={renderRichContent}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {/* Reading Lists Section */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Required Reading */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Reading list 必读
                  <Badge variant="destructive">必读</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="添加必读内容（支持链接）..."
                    value={newReadingText}
                    onChange={(e) => setNewReadingText(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => handleAddReading(newReadingText, "required")}
                    disabled={!newReadingText.trim()}
                    className="w-full"
                  >
                    添加到必读列表
                  </Button>
                </div>
                <div className="space-y-2">
                  {isLoading || loadingCategories.has(activeTab) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                        <span>加载中...</span>
                      </div>
                    </div>
                  ) : requiredReading.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-red-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm break-words">{item.text}</div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            打开链接
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditReading(item)}
                          className="w-7 h-7 rounded-full bg-red-100 hover:bg-green-200 transition-colors duration-200 text-red-600 hover:text-green-700 flex items-center justify-center border border-red-200 hover:border-green-300"
                          aria-label="编辑阅读内容"
                          title="编辑阅读内容"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteReading(item.id)}
                          className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 transition-colors duration-200 text-red-600 hover:text-red-700 flex items-center justify-center border border-red-200 hover:border-red-300"
                          aria-label="删除阅读内容"
                          title="删除阅读内容"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoading && !loadingCategories.has(activeTab) && requiredReading.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {searchQuery ? "无相关内容" : "暂无必读内容"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optional Reading */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Reading list 选读
                  <Badge variant="secondary">选读</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="添加选读内容（支持链接）..."
                    value={newOptionalText}
                    onChange={(e) => setNewOptionalText(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={() => handleAddReading(newOptionalText, "optional")}
                    disabled={!newOptionalText.trim()}
                    variant="secondary"
                    className="w-full"
                  >
                    添加到选读列表
                  </Button>
                </div>
                <div className="space-y-2">
                  {isLoading || loadingCategories.has(activeTab) ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                        <span>加载中...</span>
                      </div>
                    </div>
                  ) : optionalReading.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm break-words">{item.text}</div>
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs mt-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            打开链接
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEditReading(item)}
                          className="w-7 h-7 rounded-full bg-blue-100 hover:bg-green-200 transition-colors duration-200 text-blue-600 hover:text-green-700 flex items-center justify-center border border-blue-200 hover:border-green-300"
                          aria-label="编辑阅读内容"
                          title="编辑阅读内容"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteReading(item.id)}
                          className="w-7 h-7 rounded-full bg-blue-100 hover:bg-red-200 transition-colors duration-200 text-blue-600 hover:text-red-700 flex items-center justify-center border border-blue-200 hover:border-red-300"
                          aria-label="删除阅读内容"
                          title="删除阅读内容"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!isLoading && !loadingCategories.has(activeTab) && optionalReading.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      {searchQuery ? "无相关内容" : "暂无选读内容"}
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>


    </div>
  )
}
