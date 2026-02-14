// js/pages/PublicDrive.js
// Public Drive page - Solid White Design with Drag & Drop (All Features Enabled)

export default {
  name: 'PublicDrivePage',
  
  data() {
    return {
      // Current folder state
      currentFolderId: null, // null means root folder
      viewMode: 'grid',
      searchQuery: '',
      
      // Upload state
      isUploading: false,
      uploadProgress: [],
      showUploadModal: false,
      uploadedFiles: [],
      
      // New folder modal
      showNewFolderModal: false,
      newFolderName: '',
      
      // Move to folder modal
      showMoveModal: false,
      
      // Drag & Drop state
      isDragOver: false,
      dragCounter: 0,
      dragSource: null,
      dragItems: [],
      isExternalDrag: false,
      
      // Selection state
      selectedItems: new Set(),
      isSelecting: false,
      lastSelectedIndex: -1,
      lastSelectedId: null,
      
      // Click handling
      clickTimer: null,
      clickCount: 0,
      pendingClickItem: null,
      pendingClickEvent: null,
      
      // Public files and folders data - with parentId structure
      items: [
        { 
          id: 1, 
          name: 'Open Source License.pdf', 
          type: 'pdf', 
          size: '1.2 MB', 
          date: '2024-01-10', 
          downloads: 245,
          parentId: null
        },
        { 
          id: 2, 
          name: 'Community Guidelines.md', 
          type: 'text', 
          size: '0.5 MB', 
          date: '2024-01-09', 
          downloads: 189,
          parentId: null
        },
        { 
          id: 3, 
          name: 'Project Templates.zip', 
          type: 'archive', 
          size: '15.8 MB', 
          date: '2024-01-08', 
          downloads: 342,
          parentId: null
        },
        { 
          id: 4, 
          name: 'Public Presentation.pptx', 
          type: 'ppt', 
          size: '8.7 MB', 
          date: '2024-01-07', 
          downloads: 156,
          parentId: null
        },
        { 
          id: 5, 
          name: 'API Documentation.pdf', 
          type: 'pdf', 
          size: '3.4 MB', 
          date: '2024-01-06', 
          downloads: 421,
          parentId: null
        },
        { 
          id: 6, 
          name: 'Sample Datasets.csv', 
          type: 'csv', 
          size: '12.3 MB', 
          date: '2024-01-05', 
          downloads: 278,
          parentId: null
        },
        { 
          id: 7, 
          name: 'Logo Assets.png', 
          type: 'image', 
          size: '4.8 MB', 
          date: '2024-01-04', 
          downloads: 193,
          parentId: null
        },
        { 
          id: 8, 
          name: 'Getting Started.pdf', 
          type: 'pdf', 
          size: '2.1 MB', 
          date: '2024-01-03', 
          downloads: 567,
          parentId: null
        },
        { 
          id: 9, 
          name: 'Tutorial Videos', 
          type: 'folder', 
          size: '125.4 MB', 
          date: '2024-01-02', 
          items: 8,
          downloads: 89,
          color: 'blue',
          parentId: null
        },
        { 
          id: 10, 
          name: 'Code Examples', 
          type: 'folder', 
          size: '38.9 MB', 
          date: '2024-01-01', 
          items: 12,
          downloads: 312,
          color: 'green',
          parentId: null
        },
        { 
          id: 11, 
          name: 'System Architecture.ai', 
          type: 'ai', 
          size: '9.2 MB', 
          date: '2023-12-31', 
          downloads: 134,
          parentId: null
        },
        { 
          id: 12, 
          name: 'Release Notes.txt', 
          type: 'text', 
          size: '0.3 MB', 
          date: '2023-12-30', 
          downloads: 432,
          parentId: null
        },
        { 
          id: 13, 
          name: 'Beginner Tutorials', 
          type: 'folder', 
          size: '45.6 MB', 
          date: '2024-01-02', 
          items: 5,
          downloads: 0,
          color: 'purple',
          parentId: 9 // Inside Tutorial Videos folder
        },
        { 
          id: 14, 
          name: 'Python Examples', 
          type: 'folder', 
          size: '18.3 MB', 
          date: '2024-01-01', 
          items: 7,
          downloads: 0,
          color: 'yellow',
          parentId: 10 // Inside Code Examples folder
        }
      ]
    }
  },
  
  computed: {
    currentFolder() {
      return this.currentFolderId ? this.items.find(item => item.id === this.currentFolderId) : null
    },
    
    currentFolderName() {
      return this.currentFolder ? this.currentFolder.name : ''
    },
    
    breadcrumbs() {
      if (!this.currentFolderId) return ['Public Drive']
      
      const crumbs = ['Public Drive']
      let current = this.currentFolder
      
      while (current) {
        crumbs.unshift(current.name)
        current = current.parentId ? this.items.find(item => item.id === current.parentId) : null
      }
      
      return crumbs
    },
    
    visibleItems() {
      // Filter items that belong to current folder
      return this.items.filter(item => item.parentId === this.currentFolderId)
    },
    
    filteredItems() {
      let items = this.visibleItems
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase()
        items = items.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)
        )
      }
      
      return items
    },
    
    folders() {
      return this.items.filter(item => item.type === 'folder')
    },
    
    selectedCount() {
      return this.selectedItems.size
    },
    
    selectedItemsArray() {
      return Array.from(this.selectedItems).map(id => this.items.find(item => item.id === id))
    },
    
    // File icon styling
    fileIconClasses() {
      return {
        folder: {
          blue: 'text-blue-600',
          green: 'text-green-600',
          purple: 'text-purple-600',
          yellow: 'text-yellow-600'
        },
        pdf: 'text-red-600',
        doc: 'text-blue-600',
        xls: 'text-green-600',
        ppt: 'text-orange-600',
        image: 'text-purple-600',
        archive: 'text-yellow-600',
        text: 'text-gray-600',
        ai: 'text-pink-600',
        csv: 'text-teal-600'
      }
    }
  },
  
  methods: {
    // Item click handling with single/double click detection
    handleItemClick(item, event) {
      this.clickCount++
      
      if (this.clickCount === 1) {
        this.pendingClickItem = item
        this.pendingClickEvent = event
        
        this.clickTimer = setTimeout(() => {
          // This is a single click
          this.processSingleClick(item, event)
          this.clickCount = 0
          this.pendingClickItem = null
          this.pendingClickEvent = null
        }, 250)
      } else if (this.clickCount === 2) {
        clearTimeout(this.clickTimer)
        // This is a double click
        this.processDoubleClick(item)
        this.clickCount = 0
        this.pendingClickItem = null
        this.pendingClickEvent = null
      }
    },
    
    processSingleClick(item, event) {
      const index = this.filteredItems.findIndex(i => i.id === item.id)
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd click - toggle selection
        this.toggleSelectItem(item.id, index)
      } else if (event.shiftKey && this.lastSelectedIndex !== -1) {
        // Shift click - select range from last selected to current
        this.selectRange(index)
      } else {
        // Regular click - clear and select single item
        this.clearSelection()
        this.selectSingleItem(item.id, index)
      }
    },
    
    processDoubleClick(item) {
      // Double click always opens the item
      this.openItem(item)
    },
    
    selectSingleItem(itemId, index) {
      this.selectedItems.clear()
      this.selectedItems.add(itemId)
      this.isSelecting = true
      this.lastSelectedIndex = index
      this.lastSelectedId = itemId
    },
    
    toggleSelectItem(itemId, index) {
      if (this.selectedItems.has(itemId)) {
        this.selectedItems.delete(itemId)
        if (this.lastSelectedId === itemId) {
          this.lastSelectedIndex = -1
          this.lastSelectedId = null
        }
      } else {
        this.selectedItems.add(itemId)
        this.lastSelectedIndex = index
        this.lastSelectedId = itemId
      }
      
      this.isSelecting = this.selectedItems.size > 0
      
      // If no items selected, reset last selected
      if (this.selectedItems.size === 0) {
        this.lastSelectedIndex = -1
        this.lastSelectedId = null
      }
    },
    
    selectRange(toIndex) {
      if (this.lastSelectedIndex === -1) {
        // If no last selection, just select the clicked item
        this.clearSelection()
        this.selectSingleItem(this.filteredItems[toIndex].id, toIndex)
        return
      }
      
      const start = Math.min(this.lastSelectedIndex, toIndex)
      const end = Math.max(this.lastSelectedIndex, toIndex)
      
      // Clear and select range
      this.selectedItems.clear()
      for (let i = start; i <= end; i++) {
        this.selectedItems.add(this.filteredItems[i].id)
      }
      
      this.isSelecting = this.selectedItems.size > 0
      this.lastSelectedIndex = toIndex
      this.lastSelectedId = this.filteredItems[toIndex].id
    },
    
    selectAll() {
      if (this.selectedItems.size === this.filteredItems.length) {
        this.clearSelection()
      } else {
        this.selectedItems = new Set(this.filteredItems.map(f => f.id))
        this.isSelecting = true
        this.lastSelectedIndex = this.filteredItems.length - 1
        this.lastSelectedId = this.filteredItems[this.lastSelectedIndex]?.id
      }
    },
    
    clearSelection() {
      this.selectedItems.clear()
      this.isSelecting = false
      this.lastSelectedIndex = -1
      this.lastSelectedId = null
    },
    
    openItem(item) {
      this.clearSelection()
      
      if (item.type === 'folder') {
        // Navigate to folder
        this.navigateToFolder(item.id)
      } else {
        // Download file and show notification
        this.downloadFile(item.id)
      }
    },
    
    navigateToFolder(folderId) {
      this.currentFolderId = folderId
      this.clearSelection()
    },
    
    goBack() {
      if (this.currentFolderId) {
        const currentFolder = this.items.find(item => item.id === this.currentFolderId)
        this.currentFolderId = currentFolder?.parentId || null
        this.clearSelection()
      }
    },
    
    navigateToRoot() {
      this.currentFolderId = null
      this.clearSelection()
    },
    
    downloadFile(fileId) {
      const item = this.items.find(f => f.id === fileId)
      if (item) {
        item.downloads++
        this.showDownloadNotification(item.name)
      }
    },
    
    showDownloadNotification(fileName) {
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 flex items-center space-x-2 animate-fade-in'
      notification.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Downloading ${fileName}...</span>
      `
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.remove()
      }, 2000)
    },
    
    deleteSelectedItems() {
      if (this.selectedCount === 0) return
      
      if (confirm(`Delete ${this.selectedCount} item(s)? This action cannot be undone.`)) {
        this.selectedItemsArray.forEach(item => {
          const index = this.items.findIndex(i => i.id === item.id)
          if (index !== -1) {
            this.items.splice(index, 1)
          }
        })
        this.clearSelection()
      }
    },
    
    // New folder methods
    createNewFolder() {
      if (!this.newFolderName.trim()) return
      
      const newFolder = {
        id: this.items.length + 1,
        name: this.newFolderName,
        type: 'folder',
        size: '0 B',
        date: new Date().toISOString().split('T')[0],
        items: 0,
        downloads: 0,
        color: ['blue', 'green', 'purple', 'yellow'][Math.floor(Math.random() * 4)],
        parentId: this.currentFolderId
      }
      
      this.items.unshift(newFolder)
      this.newFolderName = ''
      this.showNewFolderModal = false
    },
    
    // Move selected items to a folder
    moveSelectedItems(targetFolderId) {
      // Check if trying to move folder into itself or its descendants
      const invalidMoves = []
      
      this.selectedItemsArray.forEach(item => {
        if (item.type === 'folder') {
          // Check if target folder is the same as the folder being moved
          if (item.id === targetFolderId) {
            invalidMoves.push(`Cannot move folder "${item.name}" into itself`)
            return
          }
          
          // Check if target folder is a descendant of the folder being moved
          if (this.isDescendant(targetFolderId, item.id)) {
            invalidMoves.push(`Cannot move folder "${item.name}" into its subfolder`)
            return
          }
        }
        
        // Proceed with move
        item.parentId = targetFolderId
        if (item.type === 'folder') {
          this.updateFolderStats(item.id)
        }
      })
      
      if (invalidMoves.length > 0) {
        alert(invalidMoves.join('\n'))
      }
      
      this.clearSelection()
      this.showMoveModal = false
    },
    
    // Check if folderId is a descendant of potentialAncestorId
    isDescendant(folderId, potentialAncestorId) {
      if (!folderId || !potentialAncestorId) return false
      
      let currentId = folderId
      while (currentId) {
        const current = this.items.find(item => item.id === currentId)
        if (!current) return false
        
        // If we find the potential ancestor in the parent chain
        if (current.parentId === potentialAncestorId) {
          return true
        }
        
        // Move up the hierarchy
        currentId = current.parentId
      }
      return false
    },
    
    // Check if folderId is an ancestor of potentialDescendantId
    isAncestor(folderId, potentialDescendantId) {
      return this.isDescendant(potentialDescendantId, folderId)
    },
    
    updateFolderStats(folderId) {
      const folder = this.items.find(item => item.id === folderId)
      if (!folder) return
      
      const itemsInFolder = this.items.filter(item => item.parentId === folderId)
      const fileItems = itemsInFolder.filter(item => item.type !== 'folder')
      const folderItems = itemsInFolder.filter(item => item.type === 'folder')
      
      // Calculate total size
      let totalSize = 0
      fileItems.forEach(item => {
        const sizeMatch = item.size.match(/(\d+\.?\d*)\s*(B|KB|MB|GB)/)
        if (sizeMatch) {
          const value = parseFloat(sizeMatch[1])
          const unit = sizeMatch[2]
          const multiplier = unit === 'GB' ? 1024 * 1024 * 1024 :
                           unit === 'MB' ? 1024 * 1024 :
                           unit === 'KB' ? 1024 : 1
          totalSize += value * multiplier
        }
      })
      
      // Add sizes from subfolders
      folderItems.forEach(subfolder => {
        const subfolderItems = this.items.filter(item => item.parentId === subfolder.id)
        subfolderItems.forEach(item => {
          const sizeMatch = item.size.match(/(\d+\.?\d*)\s*(B|KB|MB|GB)/)
          if (sizeMatch) {
            const value = parseFloat(sizeMatch[1])
            const unit = sizeMatch[2]
            const multiplier = unit === 'GB' ? 1024 * 1024 * 1024 :
                             unit === 'MB' ? 1024 * 1024 :
                             unit === 'KB' ? 1024 : 1
            totalSize += value * multiplier
          }
        })
      })
      
      // Format size
      let formattedSize
      if (totalSize >= 1024 * 1024 * 1024) {
        formattedSize = `${(totalSize / (1024 * 1024 * 1024)).toFixed(1)} GB`
      } else if (totalSize >= 1024 * 1024) {
        formattedSize = `${(totalSize / (1024 * 1024)).toFixed(1)} MB`
      } else if (totalSize >= 1024) {
        formattedSize = `${(totalSize / 1024).toFixed(1)} KB`
      } else {
        formattedSize = `${totalSize} B`
      }
      
      folder.size = formattedSize
      folder.items = itemsInFolder.length
    },
    
    // Drag & Drop methods
    handleDragStart(item, event) {
      this.dragSource = item
      this.dragItems = this.selectedItems.has(item.id) ? 
        this.selectedItemsArray : [item]
      
      // Set data for internal drag (not files)
      event.dataTransfer.setData('application/json', JSON.stringify({
        type: 'move',
        items: this.dragItems.map(i => i.id)
      }))
      event.dataTransfer.effectAllowed = 'move'
      
      // Set a flag to indicate this is an internal drag
      event.dataTransfer.setData('text/plain', 'internal-drag')
    },
    
    handleDragEnter(e) {
      e.preventDefault()
      e.stopPropagation()
      this.dragCounter++
      
      // Check if this is an external drag (has files)
      const hasFiles = e.dataTransfer.types.includes('Files')
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || 
                            e.dataTransfer.getData('text/plain') === 'internal-drag'
      
      // Only show overlay for external drags (file uploads)
      if (!this.isDragOver && !this.showUploadModal && hasFiles && !isInternalDrag) {
        this.isDragOver = true
        this.isExternalDrag = true
      } else if (isInternalDrag) {
        this.isExternalDrag = false
      }
    },
    
    handleDragLeave(e) {
      e.preventDefault()
      e.stopPropagation()
      this.dragCounter--
      if (this.dragCounter === 0) {
        this.isDragOver = false
        this.isExternalDrag = false
      }
    },
    
    handleDragOver(e) {
      e.preventDefault()
      e.stopPropagation()
      
      // Check if this is an internal drag
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || 
                            e.dataTransfer.getData('text/plain') === 'internal-drag'
      
      if (isInternalDrag) {
        // Internal move operation
        e.dataTransfer.dropEffect = 'move'
      } else {
        // External file upload
        e.dataTransfer.dropEffect = 'copy'
      }
    },
    
    handleDrop(e) {
      e.preventDefault()
      e.stopPropagation()
      
      this.dragCounter = 0
      this.isDragOver = false
      this.isExternalDrag = false
      
      if (this.showUploadModal) return
      
      // Check if this is an internal drag (move) or external (upload)
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || 
                            e.dataTransfer.getData('text/plain') === 'internal-drag'
      
      if (isInternalDrag) {
        // Internal move - dropped on empty space, move to current folder
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'))
          if (data.type === 'move') {
            const invalidMoves = []
            
            data.items.forEach(itemId => {
              const item = this.items.find(i => i.id === itemId)
              if (item) {
                // Don't move item to its current location
                if (item.parentId === this.currentFolderId) {
                  return
                }
                
                // For folders, check if moving to itself or descendants
                if (item.type === 'folder') {
                  if (item.id === this.currentFolderId) {
                    invalidMoves.push(`Cannot move folder "${item.name}" into itself`)
                    return
                  }
                  
                  if (this.isDescendant(this.currentFolderId, item.id)) {
                    invalidMoves.push(`Cannot move folder "${item.name}" into its subfolder`)
                    return
                  }
                }
                
                item.parentId = this.currentFolderId
                if (item.type === 'folder') {
                  this.updateFolderStats(item.id)
                }
              }
            })
            
            if (invalidMoves.length > 0) {
              alert(invalidMoves.join('\n'))
            }
            
            this.clearSelection()
          }
        } catch (error) {
          console.error('Error parsing drag data:', error)
        }
      } else if (e.dataTransfer.files.length > 0) {
        // External file upload
        const files = Array.from(e.dataTransfer.files)
        this.processUpload(files)
      }
    },
    
    handleFolderDrop(folder, e) {
      e.preventDefault()
      e.stopPropagation()
      
      // Check if this is an internal drag
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || 
                            e.dataTransfer.getData('text/plain') === 'internal-drag'
      
      if (isInternalDrag) {
        // Internal move to specific folder
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'))
          if (data.type === 'move') {
            const invalidMoves = []
            
            data.items.forEach(itemId => {
              const item = this.items.find(i => i.id === itemId)
              if (item) {
                // Don't move item to its current location
                if (item.parentId === folder.id) {
                  return
                }
                
                // Don't move a folder into itself
                if (item.id === folder.id) {
                  invalidMoves.push(`Cannot move folder "${item.name}" into itself`)
                  return
                }
                
                // Don't move a folder into its descendant
                if (item.type === 'folder' && this.isDescendant(folder.id, item.id)) {
                  invalidMoves.push(`Cannot move folder "${item.name}" into its subfolder`)
                  return
                }
                
                item.parentId = folder.id
                if (item.type === 'folder') {
                  this.updateFolderStats(item.id)
                }
              }
            })
            
            if (invalidMoves.length > 0) {
              alert(invalidMoves.join('\n'))
            }
            
            this.clearSelection()
          }
        } catch (error) {
          console.error('Error parsing drag data:', error)
        }
      } else if (e.dataTransfer.files.length > 0) {
        // Upload files directly to this folder
        const files = Array.from(e.dataTransfer.files)
        this.processUpload(files, folder.id)
      }
    },
    
    // Upload methods - supports multiple files
    processUpload(files, targetFolderId = this.currentFolderId) {
      this.showUploadModal = true
      this.isUploading = true
      this.uploadedFiles = []
      this.uploadProgress = []
      
      // Prepare upload data for each file
      files.forEach((file, index) => {
        this.uploadedFiles.push({
          name: file.name || `Public_Upload_${Date.now()}_${index}.txt`,
          size: file.size ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${(Math.random() * 5).toFixed(1)} MB`,
          type: this.getFileTypeFromName(file.name),
          targetFolderId: targetFolderId
        })
        this.uploadProgress.push(0)
      })
      
      // Simulate upload progress for each file
      this.uploadedFiles.forEach((_, index) => {
        this.simulateUpload(index)
      })
    },
    
    simulateUpload(index) {
      const interval = setInterval(() => {
        this.uploadProgress[index] += Math.random() * 15
        if (this.uploadProgress[index] >= 100) {
          this.uploadProgress[index] = 100
          clearInterval(interval)
          
          // Check if all uploads are complete
          this.checkAllUploadsComplete()
        }
        // Force update
        this.uploadProgress = [...this.uploadProgress]
      }, 200)
    },
    
    checkAllUploadsComplete() {
      const allComplete = this.uploadProgress.every(progress => progress >= 100)
      if (allComplete) {
        setTimeout(() => {
          this.isUploading = false
          
          // Add all uploaded files to items list
          this.uploadedFiles.forEach((file, index) => {
            const newFile = {
              id: this.items.length + index + 1,
              name: file.name,
              type: file.type,
              size: file.size,
              date: new Date().toISOString().split('T')[0],
              downloads: 0,
              parentId: file.targetFolderId
            }
            
            this.items.unshift(newFile)
          })
          
          // Update folder stats if needed
          const targetFolderId = this.uploadedFiles[0]?.targetFolderId
          if (targetFolderId) {
            this.updateFolderStats(targetFolderId)
          }
        }, 500)
      }
    },
    
    startUpload() {
      const fakeFiles = [
        { name: `Public_Document_${Date.now()}.pdf`, size: `${(Math.random() * 5).toFixed(1)} MB` },
        { name: `Public_Image_${Date.now()}.jpg`, size: `${(Math.random() * 3).toFixed(1)} MB` },
        { name: `Public_Spreadsheet_${Date.now()}.xlsx`, size: `${(Math.random() * 2).toFixed(1)} MB` }
      ]
      this.processUpload(fakeFiles)
    },
    
    closeUploadModal() {
      this.showUploadModal = false
      this.uploadProgress = []
      this.uploadedFiles = []
      this.isUploading = false
    },
    
    getFileTypeFromName(filename) {
      const extension = filename.split('.').pop().toLowerCase()
      const typeMap = {
        'pdf': 'pdf',
        'doc': 'doc',
        'docx': 'doc',
        'xls': 'xls',
        'xlsx': 'xls',
        'ppt': 'ppt',
        'pptx': 'ppt',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'gif': 'image',
        'zip': 'archive',
        'rar': 'archive',
        'txt': 'text',
        'md': 'text',
        'ai': 'ai',
        'psd': 'image',
        'csv': 'csv'
      }
      return typeMap[extension] || 'text'
    },
    
    // View mode toggle
    toggleViewMode() {
      this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid'
    },
    
    // Item icon - using Heroicons
    getItemIcon(item) {
      if (item.type === 'folder') {
        const colorClass = this.fileIconClasses.folder[item.color] || this.fileIconClasses.folder.blue
        return `
          <div class="w-12 h-12 ${colorClass}">
            <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        `
      }
      
      const colorClass = this.fileIconClasses[item.type] || 'text-gray-600'
      return this.getFileIcon(item.type, colorClass)
    },
    
    getFileIcon(type, colorClass) {
      const icons = {
        pdf: `
          <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        `,
        text: `
          <div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-gray-200">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        `,
        archive: `
          <div class="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center border-2 border-yellow-200">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
        `,
        ppt: `
          <div class="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center border-2 border-orange-200">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        `,
        image: `
          <div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center border-2 border-purple-200">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        `,
        csv: `
          <div class="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center border-2 border-teal-200">
            <svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        `,
        ai: `
          <div class="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center border-2 border-pink-200">
            <svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        `,
        doc: `
          <div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        `,
        xls: `
          <div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center border-2 border-green-200">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        `
      }
      
      return icons[type] || icons.text
    },
    
    // Get background color class based on item type
    getItemBackgroundClass(item) {
      if (item.type === 'folder') {
        const colorMap = {
          blue: 'bg-blue-50',
          green: 'bg-green-50',
          purple: 'bg-purple-50',
          yellow: 'bg-yellow-50'
        }
        return colorMap[item.color] || 'bg-blue-50'
      }
      
      return 'bg-white'
    },
    
    // Get border color class based on item type
    getItemBorderClass(item) {
      if (item.type === 'folder') {
        const colorMap = {
          blue: 'border-blue-200',
          green: 'border-green-200',
          purple: 'border-purple-200',
          yellow: 'border-yellow-200'
        }
        return colorMap[item.color] || 'border-blue-200'
      }
      
      return 'border-gray-200'
    },
    
    // Get item card classes for grid view
    getGridItemClasses(item) {
      const baseClasses = 'p-4 rounded-lg cursor-pointer transition-all duration-200 relative group shadow-sm hover:shadow'
      const backgroundClass = this.getItemBackgroundClass(item)
      const borderClass = this.getItemBorderClass(item)
      const selectedClass = this.selectedItems.has(item.id) ? 'ring-2 ring-slate-900 ring-opacity-20 border-slate-900' : ''
      
      return `${baseClasses} ${backgroundClass} border ${borderClass} ${selectedClass}`
    },
    
    // Format date
    formatDate(dateStr) {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    },
    
    // Format download count
    formatDownloads(count) {
      if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
      return count.toString()
    },
    
    // Get folder item count text
    getFolderItemCount(item) {
      return `${item.items} ${item.items === 1 ? 'item' : 'items'}`
    },
    
    // File size color based on size
    getSizeColor(size) {
      if (size.includes('GB')) return 'text-red-600 font-medium'
      if (size.includes('MB')) return 'text-orange-600 font-medium'
      return 'text-slate-600 font-medium'
    },
    
    // Get type badge color
    getTypeBadgeColor(type) {
      const colors = {
        folder: 'bg-blue-100 text-blue-700',
        pdf: 'bg-red-100 text-red-700',
        text: 'bg-gray-100 text-gray-700',
        archive: 'bg-yellow-100 text-yellow-700',
        ppt: 'bg-orange-100 text-orange-700',
        image: 'bg-purple-100 text-purple-700',
        csv: 'bg-teal-100 text-teal-700',
        ai: 'bg-pink-100 text-pink-700',
        doc: 'bg-blue-100 text-blue-700',
        xls: 'bg-green-100 text-green-700'
      }
      return colors[type] || 'bg-gray-100 text-gray-700'
    },
    
    // Get type display text
    getTypeDisplay(type) {
      const typeMap = {
        folder: 'Folder',
        pdf: 'PDF',
        text: 'Text',
        archive: 'Archive',
        ppt: 'Presentation',
        image: 'Image',
        csv: 'Spreadsheet',
        ai: 'Vector',
        doc: 'Document',
        xls: 'Spreadsheet'
      }
      return typeMap[type] || type.toUpperCase()
    },
    
    // Get downloads badge class
    getDownloadsBadgeClass(downloads) {
      if (downloads > 500) return 'bg-red-100 text-red-700'
      if (downloads > 200) return 'bg-orange-100 text-orange-700'
      return 'bg-blue-100 text-blue-700'
    },
    
    // Get total upload progress
    getTotalUploadProgress() {
      if (this.uploadProgress.length === 0) return 0
      const total = this.uploadProgress.reduce((sum, progress) => sum + progress, 0)
      return total / this.uploadProgress.length
    }
  },
  
  mounted() {
    document.addEventListener('dragenter', this.handleDragEnter)
    document.addEventListener('dragleave', this.handleDragLeave)
    document.addEventListener('dragover', this.handleDragOver)
    document.addEventListener('drop', this.handleDrop)
    
    // Add click outside to clear selection
    document.addEventListener('click', (e) => {
      const isDriveItem = e.target.closest('[data-drive-item]') || 
                          e.target.closest('.selection-toolbar') ||
                          e.target.closest('.action-bar')
      
      if (!isDriveItem && this.isSelecting) {
        this.clearSelection()
      }
    })
  },
  
  beforeDestroy() {
    document.removeEventListener('dragenter', this.handleDragEnter)
    document.removeEventListener('dragleave', this.handleDragLeave)
    document.removeEventListener('dragover', this.handleDragOver)
    document.removeEventListener('drop', this.handleDrop)
    
    if (this.clickTimer) {
      clearTimeout(this.clickTimer)
    }
  },
  
  template: `
    <div class="flex flex-col h-full px-4 sm:px-6 lg:px-8 relative">
      <!-- Drag & Drop Overlay - ONLY for external file uploads -->
      <div 
        v-if="isDragOver && !showUploadModal && isExternalDrag"
        class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 transition-all duration-300"
        @dragover.prevent
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="border-4 border-dashed border-white/50 rounded-3xl p-12 text-center max-w-lg w-full">
          <div class="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-white mb-3">Drop files to upload</h3>
          <p class="text-white/80 text-lg mb-6">Release to upload files to Public Drive</p>
          <div class="text-sm text-white/60">Supports all file types • Public access</div>
        </div>
      </div>
      
      <!-- Header Section -->
      <div class="mb-8 pt-4 action-bar">
        <!-- Top Bar with Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <!-- Page Title and Breadcrumb -->
          <div class="flex items-center space-x-3">
            <button 
              v-if="currentFolderId"
              @click="goBack"
              class="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm hover:shadow"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div>
              <div class="flex items-center space-x-2">
                <button 
                  @click="navigateToRoot"
                  class="font-semibold text-slate-600 hover:text-slate-900"
                >
                  Public Drive
                </button>
                <span v-if="currentFolder" class="text-slate-400">/</span>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">{{ currentFolderName }}</h1>
                <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex-shrink-0">
                  Public
                </span>
              </div>
              <span v-if="selectedCount > 0" class="text-sm text-slate-600 font-medium">
                {{ selectedCount }} item(s) selected
              </span>
            </div>
          </div>
          
          <!-- Actions Bar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
            <!-- Search -->
            <div class="relative flex-1 sm:flex-initial sm:w-64">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search public files and folders..."
                class="pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent w-full shadow-sm hover:shadow transition-shadow"
              />
              <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex items-center gap-3">
              <!-- View Toggle -->
              <div class="flex border border-slate-300 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                <button
                  @click="toggleViewMode"
                  class="p-2.5 transition-colors"
                  :class="viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
                  title="Grid view"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                  </svg>
                </button>
                <button
                  @click="toggleViewMode"
                  class="p-2.5 border-l border-slate-300 transition-colors"
                  :class="viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'"
                  title="List view"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                  </svg>
                </button>
              </div>
              
              <!-- New Folder Button -->
              <button
                @click="showNewFolderModal = true"
                class="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2 flex-shrink-0"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span class="hidden sm:inline">New Folder</span>
              </button>
              
              <!-- Upload Button -->
              <button
                @click="startUpload"
                class="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2 flex-shrink-0"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span class="hidden sm:inline">Upload</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Public Drive Notice -->
        <div class="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg shadow-sm">
          <div class="flex items-start">
            <div class="text-blue-600 mr-3 mt-0.5 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm text-blue-800 font-medium">
                <span class="font-bold">Public Drive</span> - Anyone can view, download, upload, and manage files in this space. 
                All files are publicly accessible. No login required.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Selection Toolbar -->
      <div 
        v-if="isSelecting"
        class="mb-6 p-4 bg-white border border-slate-300 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 shadow-sm selection-toolbar"
      >
        <div class="flex items-center space-x-4">
          <span class="text-sm font-semibold text-slate-900">{{ selectedCount }} item(s) selected</span>
          <button
            @click="clearSelection"
            class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium"
          >
            Clear
          </button>
        </div>
        <div class="flex items-center space-x-3">
          <button @click="showMoveModal = true" class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Move to</button>
          <button class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Download All</button>
          <button class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Share</button>
          <button @click="deleteSelectedItems" class="text-sm text-red-600 hover:text-red-800 hover:underline font-medium">Delete</button>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="flex-1">
        <!-- Items Section -->
        <div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 class="text-lg font-bold text-slate-900">{{ currentFolder ? currentFolder.name + ' Contents' : 'All Public Files' }}</h2>
            <div class="flex items-center space-x-4">
              <button
                @click="selectAll"
                class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium"
              >
                {{ selectedItems.size === filteredItems.length ? 'Deselect all' : 'Select all' }}
              </button>
              <span class="text-sm text-slate-500 font-medium">{{ filteredItems.length }} items</span>
            </div>
          </div>
          
          <!-- Grid View -->
          <div 
            v-if="viewMode === 'grid'" 
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
          >
            <!-- Folders first -->
            <div
              v-for="item in filteredItems.filter(i => i.type === 'folder')"
              :key="item.id"
              data-drive-item
              @click="handleItemClick(item, $event)"
              @dragover.prevent="handleDragOver"
              @drop.prevent="handleFolderDrop(item, $event)"
              :class="getGridItemClasses(item)"
              draggable="true"
              @dragstart="handleDragStart(item, $event)"
            >
              <!-- Download Button -->
              <button
                @click.stop="downloadFile(item.id)"
                class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                title="Download Folder"
              >
                <div class="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm hover:shadow">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                </div>
              </button>
              
              <!-- Item Icon -->
              <div class="flex justify-center pt-2">
                <div v-html="getItemIcon(item)"></div>
              </div>
              
              <!-- Item Content -->
              <div class="mt-4">
                <div class="flex items-start justify-between mb-2">
                  <div class="font-semibold text-slate-900 truncate flex-1 mr-2">{{ item.name }}</div>
                  <div class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0" :class="getTypeBadgeColor(item.type)">
                    {{ getTypeDisplay(item.type) }}
                  </div>
                </div>
                
                <div class="flex items-center justify-between text-sm mt-3">
                  <div class="text-slate-600">
                    {{ getFolderItemCount(item) }}
                  </div>
                  <div class="text-xs text-slate-400">{{ formatDate(item.date) }}</div>
                </div>
                
                <!-- Downloads Badge -->
                <div class="mt-3">
                  <span class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1 w-fit" :class="getDownloadsBadgeClass(item.downloads)">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>{{ formatDownloads(item.downloads) }} downloads</span>
                  </span>
                </div>
              </div>
              
              <!-- Selection Indicator -->
              <div 
                v-if="selectedItems.has(item.id)"
                class="absolute top-3 left-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center z-10"
              >
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <!-- Drop indicator for folders -->
              <div class="absolute inset-0 border-2 border-dashed border-blue-500 rounded-lg opacity-0 group-hover:opacity-30 pointer-events-none transition-opacity"></div>
            </div>
            
            <!-- Files -->
            <div
              v-for="item in filteredItems.filter(i => i.type !== 'folder')"
              :key="item.id"
              data-drive-item
              @click="handleItemClick(item, $event)"
              :class="getGridItemClasses(item)"
              draggable="true"
              @dragstart="handleDragStart(item, $event)"
            >
              <!-- Download Button -->
              <button
                @click.stop="downloadFile(item.id)"
                class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10"
                title="Download"
              >
                <div class="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm hover:shadow">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                </div>
              </button>
              
              <!-- Item Icon -->
              <div class="flex justify-center pt-2">
                <div v-html="getItemIcon(item)"></div>
              </div>
              
              <!-- Item Content -->
              <div class="mt-4">
                <div class="flex items-start justify-between mb-2">
                  <div class="font-semibold text-slate-900 truncate flex-1 mr-2">{{ item.name }}</div>
                  <div class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0" :class="getTypeBadgeColor(item.type)">
                    {{ getTypeDisplay(item.type) }}
                  </div>
                </div>
                
                <div class="flex items-center justify-between text-sm mt-3">
                  <div class="text-slate-600">{{ item.size }}</div>
                  <div class="text-xs text-slate-400">{{ formatDate(item.date) }}</div>
                </div>
                
                <!-- Downloads Badge -->
                <div class="mt-3">
                  <span class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1 w-fit" :class="getDownloadsBadgeClass(item.downloads)">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>{{ formatDownloads(item.downloads) }} downloads</span>
                  </span>
                </div>
              </div>
              
              <!-- Selection Indicator -->
              <div 
                v-if="selectedItems.has(item.id)"
                class="absolute top-3 left-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center z-10"
              >
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            </div>
          </div>
          
          <!-- List View -->
          <div 
            v-else 
            class="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
          >
            <div class="overflow-x-auto">
              <table class="w-full min-w-full">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-300">
                    <th class="text-left py-4 px-4 sm:px-6 w-16"></th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900">Name</th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900">Size</th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900">Downloads</th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900">Type</th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900">Modified</th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in filteredItems"
                    :key="item.id"
                    data-drive-item
                    @click="handleItemClick(item, $event)"
                    :class="[{ 'bg-slate-50': selectedItems.has(item.id) }, item.type === 'folder' ? getItemBackgroundClass(item) : 'bg-white']"
                    draggable="true"
                    @dragstart="handleDragStart(item, $event)"
                    @dragover.prevent="item.type === 'folder' && handleDragOver($event)"
                    @drop.prevent="item.type === 'folder' && handleFolderDrop(item, $event)"
                  >
                    <td class="py-4 px-4 sm:px-6">
                      <div class="relative">
                        <div v-html="getItemIcon(item)" class="flex-shrink-0"></div>
                        <div 
                          v-if="selectedItems.has(item.id)"
                          class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center z-10"
                        >
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-4 sm:px-6">
                      <div class="min-w-0 flex-1">
                        <div class="font-semibold text-slate-900 truncate">{{ item.name }}</div>
                        <div class="text-xs text-slate-500">
                          {{ item.type === 'folder' ? getFolderItemCount(item) : item.size }}
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-4 sm:px-6 text-sm font-medium" :class="getSizeColor(item.size)">{{ item.size }}</td>
                    <td class="py-4 px-4 sm:px-6">
                      <span class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1 w-fit" :class="getDownloadsBadgeClass(item.downloads)">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        <span>{{ formatDownloads(item.downloads) }}</span>
                      </span>
                    </td>
                    <td class="py-4 px-4 sm:px-6">
                      <span class="text-xs font-semibold px-3 py-1.5 rounded-full" :class="getTypeBadgeColor(item.type)">
                        {{ getTypeDisplay(item.type) }}
                      </span>
                    </td>
                    <td class="py-4 px-4 sm:px-6 text-sm text-slate-700">{{ formatDate(item.date) }}</td>
                    <td class="py-4 px-4 sm:px-6">
                      <button
                        @click.stop="downloadFile(item.id)"
                        class="px-3 py-1.5 text-sm bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow flex items-center space-x-1"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                        <span class="hidden sm:inline">Download</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Empty State -->
          <div 
            v-if="filteredItems.length === 0"
            class="text-center py-16 border border-slate-300 rounded-lg bg-white shadow-sm"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
          >
            <div class="w-20 h-20 bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">No public files found</h3>
            <p class="text-slate-600 mb-8 max-w-md mx-auto">
              {{ searchQuery ? 'Try a different search term' : 'Start by uploading files or creating folders' }}
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                @click="showNewFolderModal = true"
                class="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>New Folder</span>
              </button>
              <button
                @click="startUpload"
                class="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
                <span>Upload Files</span>
              </button>
            </div>
            <p class="text-sm text-slate-500 mt-4">or drag files anywhere on this page</p>
          </div>
        </div>
      </div>
      
      <!-- Move to Folder Modal -->
      <div
        v-if="showMoveModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all"
        @click.self="showMoveModal = false"
      >
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">Move {{ selectedCount }} item(s) to</h3>
            <button
              @click="showMoveModal = false"
              class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="mb-6">
            <p class="text-slate-600 mb-4">Select destination folder:</p>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <!-- Root option -->
              <div 
                @click="moveSelectedItems(null)"
                class="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center space-x-3"
              >
                <div class="w-10 h-10 text-slate-600">
                  <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold text-slate-900">Public Drive (Root)</div>
                  <div class="text-xs text-slate-500">Move to main public drive</div>
                </div>
              </div>
              
              <!-- Available folders -->
              <div 
                v-for="folder in folders.filter(f => !selectedItems.has(f.id))"
                :key="folder.id"
                @click="moveSelectedItems(folder.id)"
                class="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center space-x-3"
              >
                <div :class="'w-10 h-10 ' + (fileIconClasses.folder[folder.color] || 'text-blue-600')">
                  <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <div class="font-semibold text-slate-900">{{ folder.name }}</div>
                  <div class="text-xs text-slate-500">{{ getFolderItemCount(folder) }} • {{ folder.size }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="showMoveModal = false"
              class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      <!-- New Folder Modal -->
      <div
        v-if="showNewFolderModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all"
        @click.self="showNewFolderModal = false"
      >
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">Create New Folder</h3>
            <button
              @click="showNewFolderModal = false"
              class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 mb-2">Folder Name</label>
            <input
              v-model="newFolderName"
              type="text"
              placeholder="Enter folder name"
              class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent shadow-sm"
              @keyup.enter="createNewFolder"
              autofocus
            />
            <p class="text-xs text-slate-500 mt-2">This folder will be created in {{ currentFolder ? currentFolder.name : 'Public Drive' }}</p>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              @click="showNewFolderModal = false"
              class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel
            </button>
            <button
              @click="createNewFolder"
              :disabled="!newFolderName.trim()"
              class="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Folder
            </button>
          </div>
        </div>
      </div>
      
      <!-- Upload Modal (Multiple Files) -->
      <div
        v-if="showUploadModal"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all"
        @click.self="closeUploadModal"
      >
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">{{ isUploading ? 'Uploading ' + uploadedFiles.length + ' files' : 'Upload Complete' }}</h3>
            <button
              @click="closeUploadModal"
              class="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <!-- Public Upload Warning -->
          <div class="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-xl">
            <div class="flex items-start">
              <div class="text-yellow-600 mr-3 mt-0.5 flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.842 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
              <div>
                <p class="text-sm text-yellow-800 font-medium">
                  <span class="font-bold">Public Notice:</span> Files uploaded here will be visible to everyone. 
                  Do not upload sensitive or private information.
                </p>
              </div>
            </div>
          </div>
          
          <!-- Progress Bar -->
          <div class="mb-8">
            <div class="flex justify-between items-center mb-3">
              <span :class="isUploading ? 'text-slate-700 font-medium' : 'text-green-600 font-semibold'">
                {{ isUploading ? 'Uploading... (' + uploadedFiles.length + ' files)' : 'Complete!' }}
              </span>
              <span class="text-slate-700 font-semibold">{{ Math.round(getTotalUploadProgress()) }}%</span>
            </div>
            <div class="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div 
                class="h-full bg-slate-900 transition-all duration-300 ease-out"
                :style="{ width: getTotalUploadProgress() + '%' }"
                :class="isUploading ? '' : 'bg-green-600'"
              ></div>
            </div>
          </div>
          
          <!-- Upload Info List -->
          <div class="mb-8 max-h-64 overflow-y-auto">
            <div 
              v-for="(file, index) in uploadedFiles"
              :key="index"
              class="p-3 bg-slate-50 border border-slate-300 rounded-lg mb-2 last:mb-0"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded flex items-center justify-center border-2 bg-gray-50 border-gray-200 text-gray-700">
                    <span class="font-bold text-xs">{{ file.type.toUpperCase().slice(0, 3) }}</span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="font-medium text-slate-900 truncate text-sm">{{ file.name }}</div>
                    <div class="text-xs text-slate-600">{{ file.size }}</div>
                  </div>
                </div>
                <div class="text-sm font-semibold text-slate-700">{{ Math.round(uploadProgress[index]) }}%</div>
              </div>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex justify-end space-x-3">
            <button
              v-if="isUploading"
              @click="closeUploadModal"
              class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              Cancel All
            </button>
            <button
              v-else
              @click="closeUploadModal"
              class="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow"
            >
              Done
            </button>
          </div>
        </div>
      </div>
      
      <!-- Public Drive Footer -->
      <div class="mt-8 pt-6 border-t border-slate-300">
  `
}