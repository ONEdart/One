// js/pages/Drive.js
import DriveManager from './logic/DriveManager.js'

export default {
  name: 'DrivePage',
  
  data() {
    return {
      driveManager: null,
      currentFolderId: 'root',
      currentFolderData: null,
      folderPath: [],
      viewMode: 'grid',
      searchQuery: '',
      isUploading: false,
      uploadProgress: [],
      showUploadModal: false,
      uploadedFiles: [],
      showNewFolderModal: false,
      newFolderName: '',
      showMoveModal: false,
      isDragOver: false,
      dragCounter: 0,
      dragSource: null,
      dragItems: [],
      isExternalDrag: false,
      selectedItems: new Set(),
      isSelecting: false,
      lastSelectedIndex: -1,
      lastSelectedId: null,
      clickTimer: null,
      clickCount: 0,
      pendingClickItem: null,
      pendingClickEvent: null,
      items: [],
      storageStats: null,
      isLoading: true,
      progressIntervals: [] // untuk membersihkan interval upload simulasi
    }
  },
  
  computed: {
    currentFolder() {
      if (this.currentFolderId === 'root') {
        return { id: 'root', name: 'Drive', type: 'folder' }
      }
      return this.currentFolderData || { id: this.currentFolderId, name: 'Loading...', type: 'folder' }
    },
    
    currentFolderName() {
      return this.currentFolder.name
    },
    
    breadcrumbs() {
      const names = this.folderPath.map(f => f.name)
      names.unshift('Drive')
      return names
    },
    
    visibleItems() {
      return this.items
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
      return items.sort((a, b) => {
        if (a.type === 'folder' && b.type !== 'folder') return -1
        if (a.type !== 'folder' && b.type === 'folder') return 1
        return a.name.localeCompare(b.name)
      })
    },
    
    folders() {
      return this.items.filter(item => item.type === 'folder')
    },
    
    selectedCount() {
      return this.selectedItems.size
    },
    
    selectedItemsArray() {
      return Array.from(this.selectedItems).map(id => 
        this.items.find(item => item.id === id)
      ).filter(Boolean)
    },
    
    fileIconClasses() {
      return {
        folder: {
          blue: 'text-blue-600',
          green: 'text-green-600',
          purple: 'text-purple-600',
          yellow: 'text-yellow-600',
          pink: 'text-pink-600',
          indigo: 'text-indigo-600',
          teal: 'text-teal-600'
        },
        pdf: 'text-red-600',
        doc: 'text-blue-600',
        xls: 'text-green-600',
        ppt: 'text-orange-600',
        image: 'text-purple-600',
        video: 'text-red-600',
        audio: 'text-green-600',
        archive: 'text-yellow-600',
        text: 'text-gray-600',
        code: 'text-gray-600',
        ai: 'text-pink-600',
        psd: 'text-blue-600',
        sketch: 'text-orange-600',
        binary: 'text-gray-600',
        unknown: 'text-gray-600'
      }
    },
    
    storageUsage() {
      if (!this.storageStats) return { used: 0, total: 0, percentage: 0 }
      return {
        used: this.formatBytes(this.storageStats.totalSize),
        total: this.formatBytes(this.storageStats.virtualPool.totalSpace),
        percentage: this.storageStats.virtualPool.usagePercentage
      }
    },
    
    accountInfo() {
      if (!this.driveManager) return []
      const stats = this.driveManager.getAccountStats()
      return stats.accounts || []
    }
  },
  
  methods: {
    // ===================== INITIALIZATION =====================
    async initDriveManager() {
      try {
        this.isLoading = true
        this.driveManager = new DriveManager()
        await this.loadFolderContents()
        await this.updateCurrentFolderInfo()
        this.storageStats = this.driveManager.getStats()
        this.isLoading = false
        // Auto-save tidak perlu karena Firestore langsung tersimpan
      } catch (error) {
        console.error('Failed to initialize DriveManager:', error)
        this.isLoading = false
      }
    },
    
    async updateCurrentFolderInfo() {
      if (this.currentFolderId === 'root') {
        this.currentFolderData = null
        this.folderPath = []
        return
      }
      const folder = await this.driveManager.getFolderInfo(this.currentFolderId)
      this.currentFolderData = folder
      await this.buildFolderPath(this.currentFolderId)
    },
    
    async buildFolderPath(folderId) {
      const path = []
      let currentId = folderId
      while (currentId && currentId !== 'root') {
        const folder = await this.driveManager.getFolderInfo(currentId)
        if (!folder) break
        path.unshift(folder)
        currentId = folder.parentId
      }
      this.folderPath = path
    },
    
    // ===================== DATA LOADING =====================
    async loadFolderContents() {
      if (!this.driveManager) return
      try {
        const contents = await this.driveManager.getFolderContents(this.currentFolderId, false)
        if (contents.success === false) {
          console.error('Error loading folder contents:', contents.error)
          this.items = []
          return
        }
        this.items = [
          ...(contents.folders || []).map(folder => this.formatFolderForUI(folder)),
          ...(contents.files || []).map(file => this.formatFileForUI(file))
        ]
      } catch (error) {
        console.error('Error in loadFolderContents:', error)
        this.items = []
      }
    },
    
    formatFolderForUI(folder) {
      return {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        size: this.formatBytes(folder.metadata?.size || 0),
        date: new Date(folder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        items: folder.metadata?.items || 0,
        color: folder.metadata?.color || 'blue',
        parentId: folder.parentId,
        createdAt: folder.createdAt,
        metadata: folder.metadata
      }
    },
    
    formatFileForUI(file) {
      return {
        id: file.id,
        name: file.name,
        type: file.type,
        size: this.formatBytes(file.size || 0),
        date: new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        starred: file.starred || false,
        parentId: file.parentId,
        createdAt: file.createdAt,
        metadata: file.metadata
      }
    },
    
    // ===================== NAVIGASI =====================
    async navigateToFolder(folderId) {
      this.currentFolderId = folderId
      this.clearSelection()
      await this.loadFolderContents()
      await this.updateCurrentFolderInfo()
    },
    
    goBack() {
      if (this.currentFolderId && this.currentFolderId !== 'root') {
        const parentId = this.currentFolderData?.parentId || 'root'
        this.navigateToFolder(parentId)
      }
    },
    
    navigateToRoot() {
      this.navigateToFolder('root')
    },
    
    // ===================== ITEM CLICK HANDLING =====================
    handleItemClick(item, event) {
      this.clickCount++
      if (this.clickCount === 1) {
        this.pendingClickItem = item
        this.pendingClickEvent = event
        this.clickTimer = setTimeout(() => {
          this.processSingleClick(item, event)
          this.clickCount = 0
          this.pendingClickItem = null
          this.pendingClickEvent = null
        }, 250)
      } else if (this.clickCount === 2) {
        clearTimeout(this.clickTimer)
        this.processDoubleClick(item)
        this.clickCount = 0
        this.pendingClickItem = null
        this.pendingClickEvent = null
      }
    },
    
    processSingleClick(item, event) {
      const index = this.filteredItems.findIndex(i => i.id === item.id)
      if (event.ctrlKey || event.metaKey) {
        this.toggleSelectItem(item.id, index)
      } else if (event.shiftKey && this.lastSelectedIndex !== -1) {
        this.selectRange(index)
      } else {
        this.clearSelection()
        this.selectSingleItem(item.id, index)
      }
    },
    
    processDoubleClick(item) {
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
      if (this.selectedItems.size === 0) {
        this.lastSelectedIndex = -1
        this.lastSelectedId = null
      }
    },
    
    selectRange(toIndex) {
      if (this.lastSelectedIndex === -1) {
        this.clearSelection()
        this.selectSingleItem(this.filteredItems[toIndex].id, toIndex)
        return
      }
      const start = Math.min(this.lastSelectedIndex, toIndex)
      const end = Math.max(this.lastSelectedIndex, toIndex)
      this.selectedItems.clear()
      for (let i = start; i <= end; i++) {
        this.selectedItems.add(this.filteredItems[i].id)
      }
      this.isSelecting = true
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
        this.navigateToFolder(item.id)
      } else {
        this.showFilePreview(item)
      }
    },
    
    showFilePreview(file) {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'
      
      // Ambil info file dari DriveManager (opsional)
      // const fileInfo = await this.driveManager.getFileInfo(file.id) // tidak bisa await di sini, jadi kita pakai data yang ada
      
      modal.innerHTML = `
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">File Details</h3>
            <button onclick="this.closest('.fixed').remove()" class="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="flex items-center space-x-4 mb-6">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center border-2 ${
              file.type === 'pdf' ? 'bg-red-50 border-red-200' :
              file.type === 'doc' ? 'bg-blue-50 border-blue-200' :
              file.type === 'xls' ? 'bg-green-50 border-green-200' :
              file.type === 'image' ? 'bg-purple-50 border-purple-200' :
              'bg-gray-50 border-gray-200'
            }">
              <span class="font-bold text-sm">${file.type.toUpperCase().slice(0, 3)}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-900 truncate">${file.name}</div>
              <div class="text-sm text-slate-600">${file.size} • ${file.date}</div>
              <div class="text-xs text-slate-500 mt-1">Distributed across GitHub repositories</div>
            </div>
          </div>
          <div class="space-y-3 mb-6">
            <div class="flex justify-between text-sm"><span class="text-slate-600">File ID:</span><span class="font-mono text-slate-900">${file.id}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-600">Created:</span><span class="text-slate-900">${file.date}</span></div>
            <div class="flex justify-between text-sm"><span class="text-slate-600">Type:</span><span class="text-slate-900">${this.getTypeDisplay(file.type)}</span></div>
          </div>
          <div class="flex justify-end space-x-3">
            <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors">Close</button>
            <button onclick="window.downloadFile('${file.id}')" class="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">Download</button>
          </div>
        </div>
      `
      document.body.appendChild(modal)
      
      // Simpan referensi ke instance Vue untuk digunakan di window.downloadFile
      const self = this
      window.downloadFile = async (fileId) => {
        const result = await self.downloadFiles([fileId])
        if (result.success) {
          modal.remove()
          self.showNotification(`Downloading ${result.files.length} file(s)`)
        }
      }
    },
    
    async toggleStar(itemId) {
      const item = this.items.find(f => f.id === itemId)
      if (item && item.type !== 'folder') {
        await this.driveManager.toggleStar(itemId)
        await this.loadFolderContents()
      }
    },
    
    // ===================== FOLDER OPERATIONS =====================
    async createNewFolder() {
      if (!this.newFolderName.trim()) return
      const result = await this.driveManager.createFolder(
        this.newFolderName.trim(),
        this.currentFolderId,
        { color: ['blue', 'green', 'purple', 'yellow', 'pink', 'indigo', 'teal'][Math.floor(Math.random() * 7)] }
      )
      if (result.success) {
        this.newFolderName = ''
        this.showNewFolderModal = false
        await this.loadFolderContents()
        this.showNotification(`Folder "${result.folder.name}" created`)
      } else {
        this.showNotification(result.error, 'error')
      }
    },
    
    // ===================== MOVE OPERATIONS =====================
    async moveSelectedItems(targetFolderId) {
      const selectedIds = Array.from(this.selectedItems)
      const result = await this.driveManager.moveItems(selectedIds, targetFolderId)
      if (result.success) {
        this.clearSelection()
        this.showMoveModal = false
        await this.loadFolderContents()
        this.showNotification(`${result.movedItems} item(s) moved successfully`)
      } else if (result.errors && result.errors.length > 0) {
        this.showNotification(result.errors.join('\n'), 'error')
      }
    },
    
    // ===================== UPLOAD =====================
    async processUpload(files, targetFolderId = this.currentFolderId) {
      this.showUploadModal = true
      this.isUploading = true
      this.uploadedFiles = []
      this.uploadProgress = []
      const fileList = Array.from(files)
      fileList.forEach((file, index) => {
        this.uploadedFiles.push({
          name: file.name,
          size: this.formatBytes(file.size),
          type: this.getFileTypeFromName(file.name),
          targetFolderId: targetFolderId
        })
        this.uploadProgress.push(0)
      })
      
      // Simulasi progress
      this.progressIntervals = []
      this.uploadProgress.forEach((_, index) => {
        const interval = setInterval(() => {
          this.uploadProgress[index] += Math.random() * 20
          if (this.uploadProgress[index] >= 95) {
            this.uploadProgress[index] = 95
            clearInterval(interval)
          }
          this.uploadProgress = [...this.uploadProgress]
        }, 200)
        this.progressIntervals.push(interval)
      })
      
      try {
        const result = await this.driveManager.uploadFiles(fileList, targetFolderId)
        
        // Hentikan semua interval simulasi
        this.progressIntervals.forEach(clearInterval)
        this.progressIntervals = []
        
        if (result.success) {
          this.uploadProgress = this.uploadProgress.map(() => 100)
          setTimeout(async () => {
            this.isUploading = false
            await this.loadFolderContents()
            this.showNotification(`${result.files.length} file(s) uploaded`)
            // Modal akan ditutup manual oleh user atau otomatis setelah beberapa detik?
            // Biarkan user menekan Done
          }, 1000)
        } else {
          this.showNotification(result.error, 'error')
          this.closeUploadModal()
        }
      } catch (error) {
        this.progressIntervals.forEach(clearInterval)
        this.progressIntervals = []
        this.showNotification('Upload failed: ' + error.message, 'error')
        this.closeUploadModal()
      }
    },
    
    startUpload() {
      const input = document.createElement('input')
      input.type = 'file'
      input.multiple = true
      input.style.display = 'none'
      input.onchange = (e) => {
        const files = Array.from(e.target.files)
        if (files.length > 0) this.processUpload(files)
        document.body.removeChild(input)
      }
      document.body.appendChild(input)
      input.click()
    },
    
    closeUploadModal() {
      // Hentikan interval jika masih berjalan
      this.progressIntervals.forEach(clearInterval)
      this.progressIntervals = []
      
      this.showUploadModal = false
      this.uploadProgress = []
      this.uploadedFiles = []
      this.isUploading = false
    },
    
    // ===================== DRAG & DROP =====================
    handleDragStart(item, event) {
      this.dragSource = item
      this.dragItems = this.selectedItems.has(item.id) ? this.selectedItemsArray : [item]
      event.dataTransfer.setData('application/json', JSON.stringify({ type: 'move', items: this.dragItems.map(i => i.id) }))
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', 'internal-drag')
    },
    
    handleDragEnter(e) {
      e.preventDefault()
      e.stopPropagation()
      this.dragCounter++
      const hasFiles = e.dataTransfer.types.includes('Files')
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag'
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
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag'
      if (isInternalDrag) e.dataTransfer.dropEffect = 'move'
      else e.dataTransfer.dropEffect = 'copy'
    },
    
    async handleDrop(e) {
      e.preventDefault()
      e.stopPropagation()
      this.dragCounter = 0
      this.isDragOver = false
      this.isExternalDrag = false
      if (this.showUploadModal) return
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag'
      if (isInternalDrag) {
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'))
          if (data.type === 'move') {
            const result = await this.driveManager.moveItems(data.items, this.currentFolderId)
            if (result.success) {
              await this.loadFolderContents()
              this.showNotification(`${result.movedItems} item(s) moved`)
            } else if (result.errors && result.errors.length > 0) {
              this.showNotification(result.errors.join('\n'), 'error')
            }
          }
        } catch (error) {
          console.error('Error handling internal drop:', error)
        }
      } else if (e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files)
        this.processUpload(files)
      }
    },
    
    async handleFolderDrop(folder, e) {
      e.preventDefault()
      e.stopPropagation()
      const isInternalDrag = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag'
      if (isInternalDrag) {
        try {
          const data = JSON.parse(e.dataTransfer.getData('application/json'))
          if (data.type === 'move') {
            const result = await this.driveManager.moveItems(data.items, folder.id)
            if (result.success) {
              await this.loadFolderContents()
              this.showNotification(`${result.movedItems} item(s) moved to "${folder.name}"`)
            } else if (result.errors && result.errors.length > 0) {
              this.showNotification(result.errors.join('\n'), 'error')
            }
          }
        } catch (error) {
          console.error('Error handling folder drop:', error)
        }
      } else if (e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files)
        this.processUpload(files, folder.id)
      }
    },
    
    // ===================== DOWNLOAD =====================
    async downloadSelectedFiles() {
      const selectedIds = Array.from(this.selectedItems)
      if (selectedIds.length === 0) return
      const result = await this.driveManager.downloadFiles(selectedIds)
      if (result.success) {
        this.showNotification(`Downloading ${result.files.length} file(s)`)
      } else {
        this.showNotification(result.error, 'error')
      }
    },
    
    async downloadFiles(fileIds) {
      return await this.driveManager.downloadFiles(fileIds)
    },
    
    // ===================== DELETE =====================
    async deleteSelectedItems() {
      const selectedIds = Array.from(this.selectedItems)
      if (selectedIds.length === 0) return
      if (!confirm(`Delete ${selectedIds.length} item(s)?`)) return
      const result = await this.driveManager.deleteItems(selectedIds, false)
      if (result.success) {
        this.clearSelection()
        await this.loadFolderContents()
        this.showNotification(`${result.deleted} item(s) moved to trash`)
      } else {
        this.showNotification(result.error, 'error')
      }
    },
    
    // ===================== UTILITY =====================
    getFileTypeFromName(filename) {
      const extension = filename.split('.').pop().toLowerCase()
      const typeMap = {
        'pdf': 'pdf', 'doc': 'doc', 'docx': 'doc',
        'xls': 'xls', 'xlsx': 'xls',
        'ppt': 'ppt', 'pptx': 'ppt',
        'jpg': 'image', 'jpeg': 'image', 'png': 'image',
        'gif': 'image', 'bmp': 'image', 'svg': 'image',
        'mp4': 'video', 'avi': 'video', 'mkv': 'video',
        'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio',
        'zip': 'archive', 'rar': 'archive', '7z': 'archive',
        'txt': 'text', 'md': 'text', 'rtf': 'text',
        'js': 'code', 'json': 'code', 'html': 'code',
        'css': 'code', 'py': 'code', 'java': 'code',
        'ai': 'ai', 'psd': 'psd', 'sketch': 'sketch',
        'exe': 'binary', 'dmg': 'binary', 'apk': 'binary'
      }
      return typeMap[extension] || 'unknown'
    },
    
    toggleViewMode() {
      this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid'
    },
    
    getItemIcon(item) {
      if (item.type === 'folder') {
        const colorClass = this.fileIconClasses.folder[item.color] || this.fileIconClasses.folder.blue
        return `<div class="w-12 h-12 ${colorClass}"><svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>`
      }
      return this.getFileIcon(item.type)
    },
    
    getFileIcon(type) {
      const icons = {
        pdf: `<div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
        doc: `<div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200"><svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
        xls: `<div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center border-2 border-green-200"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
        ppt: `<div class="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center border-2 border-orange-200"><svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
        image: `<div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center border-2 border-purple-200"><svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`,
        video: `<div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>`,
        audio: `<div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center border-2 border-green-200"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg></div>`,
        archive: `<div class="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center border-2 border-yellow-200"><svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg></div>`,
        text: `<div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-gray-200"><svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
        code: `<div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-gray-200"><svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg></div>`,
        ai: `<div class="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center border-2 border-pink-200"><svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>`,
        psd: `<div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200"><svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`,
        sketch: `<div class="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center border-2 border-orange-200"><svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>`
      }
      return icons[type] || `<div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-gray-200"><svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`
    },
    
    getItemBackgroundClass(item) {
      if (item.type === 'folder') {
        const colorMap = { blue: 'bg-blue-50', green: 'bg-green-50', purple: 'bg-purple-50', yellow: 'bg-yellow-50', pink: 'bg-pink-50', indigo: 'bg-indigo-50', teal: 'bg-teal-50' }
        return colorMap[item.color] || 'bg-blue-50'
      }
      return 'bg-white'
    },
    
    getItemBorderClass(item) {
      if (item.type === 'folder') {
        const colorMap = { blue: 'border-blue-200', green: 'border-green-200', purple: 'border-purple-200', yellow: 'border-yellow-200', pink: 'border-pink-200', indigo: 'border-indigo-200', teal: 'border-teal-200' }
        return colorMap[item.color] || 'border-blue-200'
      }
      return 'border-gray-200'
    },
    
    getGridItemClasses(item) {
      const baseClasses = 'p-4 rounded-lg cursor-pointer transition-all duration-200 relative group shadow-sm hover:shadow'
      const backgroundClass = this.getItemBackgroundClass(item)
      const borderClass = this.getItemBorderClass(item)
      const selectedClass = this.selectedItems.has(item.id) ? 'ring-2 ring-slate-900 ring-opacity-20 border-slate-900' : ''
      return `${baseClasses} ${backgroundClass} border ${borderClass} ${selectedClass}`
    },
    
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const dm = decimals < 0 ? 0 : decimals
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    },
    
    getFolderItemCount(item) {
      return `${item.items} ${item.items === 1 ? 'item' : 'items'}`
    },
    
    getTypeBadgeColor(type) {
      const colors = {
        folder: 'bg-blue-100 text-blue-700',
        pdf: 'bg-red-100 text-red-700',
        doc: 'bg-blue-100 text-blue-700',
        xls: 'bg-green-100 text-green-700',
        ppt: 'bg-orange-100 text-orange-700',
        image: 'bg-purple-100 text-purple-700',
        video: 'bg-red-100 text-red-700',
        audio: 'bg-green-100 text-green-700',
        archive: 'bg-yellow-100 text-yellow-700',
        text: 'bg-gray-100 text-gray-700',
        code: 'bg-gray-100 text-gray-700',
        ai: 'bg-pink-100 text-pink-700',
        psd: 'bg-blue-100 text-blue-700',
        sketch: 'bg-orange-100 text-orange-700',
        binary: 'bg-gray-100 text-gray-700',
        unknown: 'bg-gray-100 text-gray-700'
      }
      return colors[type] || 'bg-gray-100 text-gray-700'
    },
    
    getTypeDisplay(type) {
      const typeMap = {
        folder: 'Folder', pdf: 'PDF', doc: 'Document', xls: 'Spreadsheet', ppt: 'Presentation',
        image: 'Image', video: 'Video', audio: 'Audio', archive: 'Archive', text: 'Text',
        code: 'Code', ai: 'Vector', psd: 'PSD', sketch: 'Sketch', binary: 'Binary', unknown: 'File'
      }
      return typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1)
    },
    
    getSizeColor(size) {
      if (size.includes('GB') || size.includes('TB')) return 'text-red-600 font-medium'
      if (size.includes('MB')) return 'text-orange-600 font-medium'
      return 'text-slate-600 font-medium'
    },
    
    getTotalUploadProgress() {
      if (this.uploadProgress.length === 0) return 0
      const total = this.uploadProgress.reduce((sum, p) => sum + p, 0)
      return total / this.uploadProgress.length
    },
    
    // ===================== NOTIFICATION =====================
    showNotification(message, type = 'success') {
      const existing = document.querySelector('.drive-notification')
      if (existing) existing.remove()
      const notification = document.createElement('div')
      notification.className = `drive-notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`
      notification.textContent = message
      document.body.appendChild(notification)
      setTimeout(() => {
        notification.style.opacity = '0'
        notification.style.transform = 'translateY(-20px)'
        setTimeout(() => notification.remove(), 300)
      }, 3000)
    },
    
    // ===================== STORAGE =====================
    optimizeStorage() {
      const result = this.driveManager.optimizeStorage()
      if (result.success) {
        this.loadFolderContents()
        this.showNotification(`Optimization complete: ${result.movedFiles} files moved`)
      } else {
        this.showNotification('Optimization failed', 'error')
      }
    },
    
    showStorageInfo() {
      const modal = document.createElement('div')
      modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50'
      const stats = this.driveManager.getStats()
      const accountStats = this.driveManager.getAccountStats()
      modal.innerHTML = `
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">Storage Information</h3>
            <button onclick="this.closest('.fixed').remove()" class="p-2 rounded-lg hover:bg-slate-100 transition-colors"><svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="mb-6">
            <div class="flex justify-between items-center mb-2"><span class="text-slate-700 font-medium">Virtual Pool</span><span class="font-semibold text-slate-900">${stats.formatted.usedSpace} / ${stats.formatted.totalSpace}</span></div>
            <div class="h-3 bg-slate-200 rounded-full overflow-hidden"><div class="h-full bg-slate-900 transition-all duration-300" style="width: ${stats.virtualPool.usagePercentage.toFixed(1)}%"></div></div>
            <div class="text-xs text-slate-500 mt-1 text-right">${stats.virtualPool.usagePercentage.toFixed(1)}% used</div>
          </div>
          <div class="space-y-4 max-h-96 overflow-y-auto">
            ${accountStats.accounts.map(account => `
              <div class="p-3 border border-slate-300 rounded-lg">
                <div class="flex justify-between items-center mb-2"><div class="font-semibold text-slate-900">${account.name}</div><div class="text-sm font-medium ${account.usagePercentage >= 90 ? 'text-red-600' : account.usagePercentage >= 80 ? 'text-orange-600' : 'text-slate-600'}">${(account.usedSpace / (1024 * 1024 * 1024)).toFixed(1)} GB / ${(account.totalSpace / (1024 * 1024 * 1024)).toFixed(0)} GB</div></div>
                <div class="h-2 bg-slate-200 rounded-full overflow-hidden"><div class="h-full ${account.usagePercentage >= 90 ? 'bg-red-500' : account.usagePercentage >= 80 ? 'bg-orange-500' : 'bg-slate-600'}" style="width: ${account.usagePercentage.toFixed(1)}%"></div></div>
                <div class="flex justify-between text-xs text-slate-500 mt-1"><span>${account.fileCount} files</span><span>${account.usagePercentage.toFixed(1)}% used</span></div>
              </div>
            `).join('')}
          </div>
          <div class="flex justify-end mt-6"><button onclick="this.closest('.fixed').remove()" class="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors">Close</button></div>
        </div>
      `
      document.body.appendChild(modal)
    },
    
    handleClickOutside(e) {
      const isDriveItem = e.target.closest('[data-drive-item]') || e.target.closest('.selection-toolbar') || e.target.closest('.action-bar')
      if (!isDriveItem && this.isSelecting) this.clearSelection()
    }
  },
  
  created() {
    this.initDriveManager()
  },
  
  mounted() {
    document.addEventListener('dragenter', this.handleDragEnter)
    document.addEventListener('dragleave', this.handleDragLeave)
    document.addEventListener('dragover', this.handleDragOver)
    document.addEventListener('drop', this.handleDrop)
    document.addEventListener('click', this.handleClickOutside)
  },
  
  beforeDestroy() {
    document.removeEventListener('dragenter', this.handleDragEnter)
    document.removeEventListener('dragleave', this.handleDragLeave)
    document.removeEventListener('dragover', this.handleDragOver)
    document.removeEventListener('drop', this.handleDrop)
    document.removeEventListener('click', this.handleClickOutside)
    if (this.clickTimer) clearTimeout(this.clickTimer)
    this.progressIntervals.forEach(clearInterval)
    // Tidak perlu simpan ke localStorage
  },
  
  template: `
    <div class="flex flex-col h-full px-4 sm:px-6 lg:px-8 relative">
      <!-- Drag & Drop Overlay -->
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
          <p class="text-white/80 text-lg mb-6">Release to upload files to {{ currentFolderName }}</p>
          <div class="text-sm text-white/60">Supports all file types</div>
        </div>
      </div>
      
      <!-- Loading State -->
      <div v-if="isLoading" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
        <div class="text-center">
          <div class="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <div class="text-slate-700 font-medium">Initializing Drive Manager...</div>
        </div>
      </div>
      
      <!-- Header Section -->
      <div class="mb-8 pt-4 action-bar">
        <!-- Storage Info Bar -->
        <div class="mb-6 p-3 bg-slate-50 border border-slate-300 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <div class="font-medium text-slate-900">MEGA Federation Storage</div>
              <div class="text-sm font-semibold text-slate-700">{{ storageUsage.used }} / {{ storageUsage.total }}</div>
            </div>
            <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-slate-900 transition-all duration-300" 
                   :style="{ width: storageUsage.percentage + '%' }"
                   :class="storageUsage.percentage >= 90 ? 'bg-red-500' : storageUsage.percentage >= 80 ? 'bg-orange-500' : 'bg-slate-900'"></div>
            </div>
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>{{ accountInfo.length }} active accounts</span>
              <button @click="showStorageInfo" class="text-slate-600 hover:text-slate-900 hover:underline">Details</button>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button @click="optimizeStorage" class="px-3 py-1.5 text-xs bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors">
              Optimize
            </button>
            <button @click="showStorageInfo" class="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Top Bar with Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <!-- Page Title and Breadcrumb -->
          <div class="flex items-center space-x-3">
            <button 
              v-if="currentFolderId && currentFolderId !== 'root'"
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
                  Drive
                </button>
                <template v-for="(crumb, index) in breadcrumbs" :key="index">
                  <span v-if="index > 0" class="text-slate-400">/</span>
                  <span class="font-semibold text-slate-900">{{ crumb }}</span>
                </template>
              </div>
              <span v-if="selectedCount > 0" class="text-sm text-slate-600 font-medium">
                {{ selectedCount }} {{ selectedCount === 1 ? 'item' : 'items' }} selected
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
                placeholder="Search files and folders..."
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
          <button @click="downloadSelectedFiles" class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Download</button>
          <button class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Share</button>
          <button @click="deleteSelectedItems" class="text-sm text-red-600 hover:text-red-800 hover:underline font-medium">Delete</button>
        </div>
      </div>
      
      <!-- Main Content -->
      <div class="flex-1">
        <!-- Items Section -->
        <div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
            <h2 class="text-lg font-bold text-slate-900">{{ currentFolderName }} Contents</h2>
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
              <div class="flex justify-center pt-2" v-html="getItemIcon(item)"></div>
              <div class="mt-4">
                <div class="flex items-start justify-between mb-2">
                  <div class="font-semibold text-slate-900 truncate flex-1 mr-2">{{ item.name }}</div>
                  <div class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0" :class="getTypeBadgeColor(item.type)">{{ getTypeDisplay(item.type) }}</div>
                </div>
                <div class="flex items-center justify-between text-sm mt-3">
                  <div class="text-slate-600">{{ getFolderItemCount(item) }}</div>
                  <div class="text-xs text-slate-400">{{ item.date }}</div>
                </div>
              </div>
              <div v-if="selectedItems.has(item.id)" class="absolute top-3 left-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center z-10">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
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
              <button @click.stop="toggleStar(item.id)" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10" :class="{ 'opacity-100': item.starred }">
                <svg class="w-5 h-5 transition-transform" :class="item.starred ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
              </button>
              <div class="flex justify-center pt-2" v-html="getItemIcon(item)"></div>
              <div class="mt-4">
                <div class="flex items-start justify-between mb-2">
                  <div class="font-semibold text-slate-900 truncate flex-1 mr-2">{{ item.name }}</div>
                  <div class="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0" :class="getTypeBadgeColor(item.type)">{{ getTypeDisplay(item.type) }}</div>
                </div>
                <div class="flex items-center justify-between text-sm mt-3">
                  <div class="text-slate-600" :class="getSizeColor(item.size)">{{ item.size }}</div>
                  <div class="text-xs text-slate-400">{{ item.date }}</div>
                </div>
              </div>
              <div v-if="selectedItems.has(item.id)" class="absolute top-3 left-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center z-10">
                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
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
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900">Type</th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900">Modified</th>
                    <th class="text-left py-4 px-4 sm:px-6 text-sm font-semibold text-slate-900 w-12"></th>
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
                        <div v-if="selectedItems.has(item.id)" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center z-10">
                          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                      </div>
                    </td>
                    <td class="py-4 px-4 sm:px-6">
                      <div class="min-w-0 flex-1">
                        <div class="font-semibold text-slate-900 truncate">{{ item.name }}</div>
                        <div class="text-xs text-slate-500">{{ item.type === 'folder' ? getFolderItemCount(item) : item.size }}</div>
                      </div>
                    </td>
                    <td class="py-4 px-4 sm:px-6 text-sm font-medium" :class="getSizeColor(item.size)">{{ item.size }}</td>
                    <td class="py-4 px-4 sm:px-6"><span class="text-xs font-semibold px-3 py-1.5 rounded-full" :class="getTypeBadgeColor(item.type)">{{ getTypeDisplay(item.type) }}</span></td>
                    <td class="py-4 px-4 sm:px-6 text-sm text-slate-700">{{ item.date }}</td>
                    <td class="py-4 px-4 sm:px-6">
                      <button v-if="item.type !== 'folder'" @click.stop="toggleStar(item.id)" class="text-lg hover:scale-110 transition-transform">
                        <svg class="w-5 h-5" :class="item.starred ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Empty State -->
          <div 
            v-if="filteredItems.length === 0 && !isLoading"
            class="text-center py-16 border border-slate-300 rounded-lg bg-white shadow-sm"
            @dragenter.prevent="handleDragEnter"
            @dragover.prevent="handleDragOver"
            @drop.prevent="handleDrop"
          >
            <div class="w-20 h-20 bg-slate-100 border border-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-3">No items found</h3>
            <p class="text-slate-600 mb-8 max-w-md mx-auto">{{ searchQuery ? 'Try a different search term' : 'Start by uploading files or creating folders' }}</p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button @click="showNewFolderModal = true" class="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <span>New Folder</span>
              </button>
              <button @click="startUpload" class="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                <span>Upload Files</span>
              </button>
            </div>
            <p class="text-sm text-slate-500 mt-4">or drag files anywhere on this page</p>
          </div>
        </div>
      </div>
      
      <!-- Move to Folder Modal -->
      <div v-if="showMoveModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all" @click.self="showMoveModal = false">
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">Move {{ selectedCount }} item(s) to</h3>
            <button @click="showMoveModal = false" class="p-2 rounded-lg hover:bg-slate-100 transition-colors"><svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="mb-6">
            <p class="text-slate-600 mb-4">Select destination folder:</p>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              <div @click="moveSelectedItems('root')" class="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center space-x-3">
                <div class="w-10 h-10 text-slate-600"><svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>
                <div><div class="font-semibold text-slate-900">Drive (Root)</div><div class="text-xs text-slate-500">Move to main drive</div></div>
              </div>
              <div v-for="folder in folders.filter(f => !selectedItems.has(f.id) && f.id !== currentFolderId)" :key="folder.id" @click="moveSelectedItems(folder.id)" class="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center space-x-3">
                <div :class="'w-10 h-10 ' + (fileIconClasses.folder[folder.color] || 'text-blue-600')"><svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>
                <div><div class="font-semibold text-slate-900">{{ folder.name }}</div><div class="text-xs text-slate-500">{{ getFolderItemCount(folder) }} • {{ folder.size }}</div></div>
              </div>
            </div>
          </div>
          <div class="flex justify-end space-x-3"><button @click="showMoveModal = false" class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel</button></div>
        </div>
      </div>
      
      <!-- New Folder Modal -->
      <div v-if="showNewFolderModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all" @click.self="showNewFolderModal = false">
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">Create New Folder</h3>
            <button @click="showNewFolderModal = false" class="p-2 rounded-lg hover:bg-slate-100 transition-colors"><svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="mb-6">
            <label class="block text-sm font-medium text-slate-700 mb-2">Folder Name</label>
            <input v-model="newFolderName" type="text" placeholder="Enter folder name" class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent shadow-sm" @keyup.enter="createNewFolder" autofocus />
            <p class="text-xs text-slate-500 mt-2">This folder will be created in {{ currentFolderName }}</p>
          </div>
          <div class="flex justify-end space-x-3">
            <button @click="showNewFolderModal = false" class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
            <button @click="createNewFolder" :disabled="!newFolderName.trim()" class="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed">Create Folder</button>
          </div>
        </div>
      </div>
      
      <!-- Upload Modal -->
      <div v-if="showUploadModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all" @click.self="closeUploadModal">
        <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-bold text-slate-900">{{ isUploading ? 'Uploading ' + uploadedFiles.length + ' files' : 'Upload Complete' }}</h3>
            <button @click="closeUploadModal" class="p-2 rounded-lg hover:bg-slate-100 transition-colors"><svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
          </div>
          <div class="mb-8">
            <div class="flex justify-between items-center mb-3">
              <span :class="isUploading ? 'text-slate-700 font-medium' : 'text-green-600 font-semibold'">{{ isUploading ? 'Uploading... (' + uploadedFiles.length + ' files)' : 'Complete!' }}</span>
              <span class="text-slate-700 font-semibold">{{ Math.round(getTotalUploadProgress()) }}%</span>
            </div>
            <div class="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div class="h-full bg-slate-900 transition-all duration-300 ease-out" :style="{ width: getTotalUploadProgress() + '%' }" :class="isUploading ? '' : 'bg-green-600'"></div>
            </div>
          </div>
          <div class="mb-8 max-h-64 overflow-y-auto">
            <div v-for="(file, index) in uploadedFiles" :key="index" class="p-3 bg-slate-50 border border-slate-300 rounded-lg mb-2 last:mb-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-8 h-8 rounded flex items-center justify-center border-2 bg-gray-50 border-gray-200 text-gray-700"><span class="font-bold text-xs">{{ file.type.toUpperCase().slice(0, 3) }}</span></div>
                  <div class="min-w-0 flex-1"><div class="font-medium text-slate-900 truncate text-sm">{{ file.name }}</div><div class="text-xs text-slate-600">{{ file.size }}</div></div>
                </div>
                <div class="text-sm font-semibold text-slate-700">{{ Math.round(uploadProgress[index]) }}%</div>
              </div>
            </div>
          </div>
          <div class="flex justify-end space-x-3">
            <button v-if="isUploading" @click="closeUploadModal" class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel All</button>
            <button v-else @click="closeUploadModal" class="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow">Done</button>
          </div>
        </div>
      </div>
    </div>
  `
}