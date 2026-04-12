'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Eye, EyeOff, Lock, Unlock } from 'lucide-react'

interface UseLayerItemProps {
  id: string
  index: number
  name: string
  visible: boolean
  locked: boolean
  onRename: (id: string, name: string) => void
  onReorder: (from: number, to: number) => void
}

export const useLayerItem = ({
  id,
  index,
  name,
  visible,
  locked,
  onRename,
  onReorder,
}: UseLayerItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(name)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const VisibilityIcon = visible ? Eye : EyeOff
  const LockIcon = locked ? Lock : Unlock

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleRename = useCallback(() => {
    const trimmed = newName.trim()
    if (trimmed && trimmed !== name) {
      onRename(id, trimmed)
    } else {
      setNewName(name)
    }
    setIsEditing(false)
  }, [id, name, newName, onRename])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (isEditing) return
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }, [index, isEditing])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (!isNaN(fromIndex) && fromIndex !== index) {
      onReorder(fromIndex, index)
    }
  }, [index, onReorder])

  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(prev => !prev)
  }, [])

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setIsMenuOpen(false)
  }, [])

  return {
    isEditing,
    newName,
    setNewName,
    isMenuOpen,
    setIsMenuOpen,
    isDragging,
    menuRef,
    inputRef,
    VisibilityIcon,
    LockIcon,
    handleRename,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    toggleMenu,
    startEditing,
    setIsEditing,
  }
}
