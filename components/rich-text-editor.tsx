"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Bold, Italic, ImageIcon, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function RichTextEditor({ value, onChange, placeholder, rows = 8 }: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const insertText = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)

    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    onChange(newText)

    // 重新设置光标位置
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleBold = () => {
    insertText("**", "**")
  }

  const handleItalic = () => {
    insertText("*", "*")
  }

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: "文件类型错误",
        description: "请选择图片文件",
        variant: "destructive",
      })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      // 降低到2MB限制
      toast({
        title: "文件过大",
        description: "图片大小不能超过2MB，请压缩后重试",
        variant: "destructive",
      })
      return
    }

    try {
      // 显示上传中的提示
      const uploadingText = `\n[上传中...]\n`
      const textarea = textareaRef.current
      const cursorPos = textarea?.selectionStart || 0
      const tempText = value.substring(0, cursorPos) + uploadingText + value.substring(cursorPos)
      onChange(tempText)

      // 压缩图片
      const compressedImage = await compressImage(file)
      
      // 对于演示目的，我们仍然使用base64，但进行了压缩
      // 在生产环境中，这里应该上传到云存储服务
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const imageMarkdown = `\n![${file.name}](${imageUrl})\n`

        // 替换"上传中..."文本
        const finalText = tempText.replace(uploadingText, imageMarkdown)
        onChange(finalText)

        setTimeout(() => {
          textarea?.focus()
          const newCursorPos = cursorPos + imageMarkdown.length
          textarea?.setSelectionRange(newCursorPos, newCursorPos)
        }, 0)

        toast({
          title: "图片上传成功",
          description: `已添加图片：${file.name}`,
        })
      }
      reader.readAsDataURL(compressedImage)

    } catch (error) {
      console.error('图片处理失败:', error)
      
      // 移除"上传中..."文本
      const cleanText = value.replace(`\n[上传中...]\n`, '')
      onChange(cleanText)
      
      toast({
        title: "图片处理失败",
        description: "请尝试选择更小的图片文件",
        variant: "destructive",
      })
    }

    // 清空文件输入
    event.target.value = ""
  }

  // 图片压缩函数
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // 计算压缩后的尺寸
        const maxWidth = 800
        const maxHeight = 600
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          file.type,
          0.8 // 压缩质量
        )
      }

      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(file)
    })
  }

  const renderPreview = (text: string) => {
    if (!text) return ''
    
    try {
      let processedContent = text
      
      // 处理文本格式
      processedContent = processedContent
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
      
      // 处理图片 - 标准 markdown 格式
      processedContent = processedContent.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        return `<img src="${src}" alt="${alt}" class="max-w-full h-auto rounded-lg my-2 shadow-sm border border-gray-200" style="max-height: 250px; object-fit: contain;" />`
      })
      
      // 处理换行
      processedContent = processedContent.replace(/\n/g, "<br />")
      
      return processedContent
    } catch (error) {
      console.error('Error processing preview content:', error)
      return text.replace(/\n/g, "<br />") // 返回基本处理的内容
    }
  }

  return (
    <div className="space-y-3">
      {/* 工具栏 */}
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-gray-50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className="h-8 w-8 p-0"
          title="加粗 (**文字**)"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className="h-8 w-8 p-0"
          title="斜体 (*文字*)"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-gray-300 mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleImageUpload}
          className="h-8 w-8 p-0"
          title="上传图片"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <div className="flex-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsPreview(!isPreview)}
          className="h-8 px-3 text-xs"
          title={isPreview ? "编辑模式" : "预览模式"}
        >
          {isPreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
          {isPreview ? "编辑" : "预览"}
        </Button>
      </div>

      {/* 编辑器内容 */}
      {isPreview ? (
        <div
          className="min-h-[200px] p-3 border rounded-lg bg-white prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: renderPreview(value) }}
        />
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="resize-none"
        />
      )}

      {/* 隐藏的文件输入 */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      {/* 格式说明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>支持的格式：</p>
        <div className="flex flex-wrap gap-4">
          <span>
            **粗体** → <strong>粗体</strong>
          </span>
          <span>
            *斜体* → <em>斜体</em>
          </span>
          <span>图片上传（≤2MB，自动压缩至800x600）</span>
        </div>
      </div>
    </div>
  )
}
