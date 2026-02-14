// js/pages/logic/DriveManager.js
// Main Logic Layer for Multi-Account Cloud Storage Management

class DriveManager {
    constructor() {
        // Initialize data structure
        this.initializeData()
        this.loadFromLocalStorage()
    }

    // =====================
    // DATA INITIALIZATION
    // =====================
    
    initializeData() {
        // Virtual Pool Configuration
        this.config = {
            poolName: 'MEGA Federation',
            totalVirtualSpace: 0, // Will be calculated
            distributionAlgorithm: 'smart-balance', // round-robin, space-based, type-based
            autoBackup: true,
            syncInterval: 300000, // 5 minutes
            compressionThreshold: 10 * 1024 * 1024, // 10MB
            encryptionEnabled: false
        }

        // Multi-account structure
        this.accounts = {
            // Format: accountId -> account details
            'mega-1': {
                id: 'mega-1',
                name: 'MEGA Personal 1',
                provider: 'mega',
                email: 'user1@temp-mail.com',
                usedSpace: 4.2 * 1024 * 1024 * 1024, // 4.2GB in bytes
                totalSpace: 15 * 1024 * 1024 * 1024, // 15GB in bytes
                isActive: true,
                priority: 1,
                lastSync: Date.now(),
                files: new Set(), // file IDs stored in this account
                folders: new Set(), // folder IDs stored in this account
                metadata: {
                    color: 'blue',
                    icon: 'mega',
                    quotaWarning: 0.8 // 80% usage warning
                }
            },
            'mega-2': {
                id: 'mega-2',
                name: 'MEGA Personal 2',
                provider: 'mega',
                email: 'user2@temp-mail.com',
                usedSpace: 3.1 * 1024 * 1024 * 1024, // 3.1GB
                totalSpace: 15 * 1024 * 1024 * 1024, // 15GB
                isActive: true,
                priority: 2,
                lastSync: Date.now(),
                files: new Set(),
                folders: new Set(),
                metadata: {
                    color: 'green',
                    icon: 'mega',
                    quotaWarning: 0.8
                }
            },
            'mega-3': {
                id: 'mega-3',
                name: 'MEGA Personal 3',
                provider: 'mega',
                email: 'user3@temp-mail.com',
                usedSpace: 2.8 * 1024 * 1024 * 1024, // 2.8GB
                totalSpace: 15 * 1024 * 1024 * 1024, // 15GB
                isActive: true,
                priority: 3,
                lastSync: Date.now(),
                files: new Set(),
                folders: new Set(),
                metadata: {
                    color: 'purple',
                    icon: 'mega',
                    quotaWarning: 0.8
                }
            }
        }

        // File System Structure
        this.fileSystem = {
            // Folders structure
            folders: {
                'root': {
                    id: 'root',
                    name: 'Drive',
                    type: 'folder',
                    parentId: null,
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString(),
                    metadata: {
                        color: 'gray',
                        items: 0,
                        size: 0
                    }
                }
            },
            
            // Files structure
            files: {},
            
            // File ID to Account mapping
            fileMapping: {}, // fileId -> accountId
            
            // Folder ID to Account mapping (for distributed folders)
            folderMapping: {}, // folderId -> accountId[]
        }

        // Statistics
        this.stats = {
            totalFiles: 0,
            totalFolders: 1,
            totalSize: 0,
            lastUpdated: Date.now(),
            operations: {
                uploads: 0,
                downloads: 0,
                moves: 0,
                deletes: 0
            }
        }

        // Cache for performance
        this.cache = {
            folderContents: {},
            searchResults: {},
            accountStats: null,
            lastCleanup: Date.now()
        }

        // Event system
        this.events = {
            onFileUploaded: [],
            onFileDeleted: [],
            onFolderCreated: [],
            onSpaceChanged: []
        }
    }

    // =====================
    // CORE FILE OPERATIONS
    // =====================

    /**
     * Upload single or multiple files
     * @param {Array|Object} files - File object(s)
     * @param {string} targetFolderId - Destination folder ID
     * @param {Object} options - Upload options
     * @returns {Promise} Upload result
     */
    async uploadFiles(files, targetFolderId = 'root', options = {}) {
        try {
            const fileList = Array.isArray(files) ? files : [files]
            const results = []
            
            for (const file of fileList) {
                const result = await this._uploadSingleFile(file, targetFolderId, options)
                results.push(result)
                
                // Update statistics
                this.stats.operations.uploads++
                this.stats.totalFiles++
                this.stats.totalSize += result.size || 0
                
                // Emit event
                this._emitEvent('onFileUploaded', result)
            }
            
            this.saveToLocalStorage()
            return {
                success: true,
                files: results,
                message: `${results.length} file(s) uploaded successfully`
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: 'Upload failed'
            }
        }
    }

    /**
     * Internal method for single file upload
     */
    async _uploadSingleFile(file, targetFolderId, options) {
        const fileId = this._generateId('file')
        const accountId = this._chooseAccountForFile(file, targetFolderId)
        
        if (!accountId) {
            throw new Error('No available account with enough space')
        }
        
        // Calculate file size
        const fileSize = file.size || this._estimateFileSize(file.name, file.type)
        
        // Check if account has enough space
        if (!this._hasEnoughSpace(accountId, fileSize)) {
            throw new Error(`Account ${accountId} doesn't have enough space`)
        }
        
        // Create file record
        const fileRecord = {
            id: fileId,
            name: file.name || `File_${Date.now()}`,
            type: this._getFileType(file.name || file.type || ''),
            size: fileSize,
            parentId: targetFolderId,
            accountId: accountId,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            metadata: {
                extension: this._getFileExtension(file.name),
                starred: false,
                tags: options.tags || [],
                hash: this._generateFileHash(file),
                compressed: fileSize > this.config.compressionThreshold
            }
        }
        
        // Store file
        this.fileSystem.files[fileId] = fileRecord
        this.fileMapping[fileId] = accountId
        
        // Update account usage
        this.accounts[accountId].usedSpace += fileSize
        this.accounts[accountId].files.add(fileId)
        
        // Update folder metadata
        this._updateFolderMetadata(targetFolderId)
        
        // Update cache
        this._clearCache('folderContents')
        
        return {
            ...fileRecord,
            accountName: this.accounts[accountId].name,
            downloadUrl: this._generateDownloadUrl(fileId)
        }
    }

    /**
     * Download file(s)
     * @param {string|Array} fileIds - File ID(s) to download
     * @returns {Promise} Download information
     */
    async downloadFiles(fileIds) {
        try {
            const ids = Array.isArray(fileIds) ? fileIds : [fileIds]
            const files = []
            
            for (const fileId of ids) {
                const file = this.fileSystem.files[fileId]
                if (!file) continue
                
                const accountId = this.fileMapping[fileId]
                const account = this.accounts[accountId]
                
                files.push({
                    ...file,
                    account: account.name,
                    downloadUrl: this._generateDownloadUrl(fileId),
                    estimatedTime: this._estimateDownloadTime(file.size)
                })
                
                // Update statistics
                this.stats.operations.downloads++
            }
            
            return {
                success: true,
                files: files,
                totalSize: files.reduce((sum, f) => sum + f.size, 0),
                message: `Preparing ${files.length} file(s) for download`
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Move items to different folder
     * @param {Array} itemIds - Item IDs to move
     * @param {string} targetFolderId - Destination folder
     * @returns {Object} Move result
     */
    moveItems(itemIds, targetFolderId) {
        try {
            const movedItems = []
            const errors = []
            
            for (const itemId of itemIds) {
                // Check if moving to self or descendant
                if (itemId === targetFolderId) {
                    errors.push(`Cannot move item into itself`)
                    continue
                }
                
                // Check if target is descendant
                if (this._isDescendant(targetFolderId, itemId)) {
                    errors.push(`Cannot move item into its subfolder`)
                    continue
                }
                
                // Find item
                const item = this.fileSystem.files[itemId] || this.fileSystem.folders[itemId]
                if (!item) {
                    errors.push(`Item ${itemId} not found`)
                    continue
                }
                
                // Update parent
                item.parentId = targetFolderId
                item.modifiedAt = new Date().toISOString()
                
                // Update folder metadata
                this._updateFolderMetadata(item.parentId)
                this._updateFolderMetadata(targetFolderId)
                
                movedItems.push(item)
                this.stats.operations.moves++
            }
            
            this._clearCache('folderContents')
            this.saveToLocalStorage()
            
            return {
                success: errors.length === 0,
                movedItems: movedItems.length,
                errors: errors,
                message: `${movedItems.length} item(s) moved successfully`
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Delete items (move to trash)
     * @param {Array} itemIds - Item IDs to delete
     * @param {boolean} permanent - Permanent delete
     * @returns {Object} Delete result
     */
    deleteItems(itemIds, permanent = false) {
        try {
            const deletedItems = []
            
            for (const itemId of itemIds) {
                const item = this.fileSystem.files[itemId] || this.fileSystem.folders[itemId]
                if (!item) continue
                
                if (permanent) {
                    // Permanent delete
                    if (item.type === 'file') {
                        const accountId = this.fileMapping[itemId]
                        if (accountId && this.accounts[accountId]) {
                            this.accounts[accountId].usedSpace -= item.size || 0
                            this.accounts[accountId].files.delete(itemId)
                        }
                        delete this.fileSystem.files[itemId]
                        delete this.fileMapping[itemId]
                        this.stats.totalFiles--
                        this.stats.totalSize -= item.size || 0
                    } else {
                        // Delete folder and its contents
                        const contents = this.getFolderContents(itemId, true)
                        const fileIds = contents.files.map(f => f.id)
                        const folderIds = contents.folders.map(f => f.id)
                        
                        // Recursively delete all contents
                        this.deleteItems([...fileIds, ...folderIds], true)
                        delete this.fileSystem.folders[itemId]
                        this.stats.totalFolders--
                    }
                } else {
                    // Move to trash (soft delete)
                    item.metadata = item.metadata || {}
                    item.metadata.trashed = true
                    item.metadata.trashedAt = new Date().toISOString()
                }
                
                deletedItems.push(item)
                this.stats.operations.deletes++
                this._emitEvent('onFileDeleted', item)
            }
            
            this._clearCache('folderContents')
            this.saveToLocalStorage()
            
            return {
                success: true,
                deleted: deletedItems.length,
                permanent: permanent,
                message: `${deletedItems.length} item(s) ${permanent ? 'permanently deleted' : 'moved to trash'}`
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    // =====================
    // FOLDER OPERATIONS
    // =====================

    /**
     * Create new folder
     * @param {string} name - Folder name
     * @param {string} parentId - Parent folder ID
     * @param {Object} options - Folder options
     * @returns {Object} Created folder
     */
    createFolder(name, parentId = 'root', options = {}) {
        try {
            // Validate parent
            if (!this.fileSystem.folders[parentId]) {
                throw new Error('Parent folder not found')
            }
            
            // Generate folder ID
            const folderId = this._generateId('folder')
            
            // Create folder record
            const folder = {
                id: folderId,
                name: name.trim(),
                type: 'folder',
                parentId: parentId,
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString(),
                metadata: {
                    color: options.color || this._getRandomColor(),
                    items: 0,
                    size: 0,
                    distributed: options.distributed || false,
                    ...options.metadata
                }
            }
            
            // Store folder
            this.fileSystem.folders[folderId] = folder
            this.stats.totalFolders++
            
            // If distributed, assign to accounts
            if (folder.metadata.distributed) {
                this._distributeFolder(folderId)
            }
            
            // Update parent folder metadata
            this._updateFolderMetadata(parentId)
            
            // Clear cache
            this._clearCache('folderContents')
            this.saveToLocalStorage()
            
            this._emitEvent('onFolderCreated', folder)
            
            return {
                success: true,
                folder: folder,
                message: `Folder "${name}" created successfully`
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get folder contents
     * @param {string} folderId - Folder ID
     * @param {boolean} recursive - Include subfolders
     * @returns {Object} Folder contents
     */
    getFolderContents(folderId = 'root', recursive = false) {
        // Check cache first
        const cacheKey = `${folderId}_${recursive}`
        if (this.cache.folderContents[cacheKey]) {
            return this.cache.folderContents[cacheKey]
        }
        
        try {
            const folder = this.fileSystem.folders[folderId]
            if (!folder) {
                throw new Error('Folder not found')
            }
            
            const folders = []
            const files = []
            
            // Get direct children
            Object.values(this.fileSystem.folders).forEach(f => {
                if (f.parentId === folderId) {
                    folders.push(f)
                }
            })
            
            Object.values(this.fileSystem.files).forEach(f => {
                if (f.parentId === folderId) {
                    files.push(f)
                }
            })
            
            let result = {
                folder: folder,
                folders: folders,
                files: files,
                totalItems: folders.length + files.length,
                totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0)
            }
            
            // If recursive, include all descendants
            if (recursive) {
                const allFiles = [...files]
                const allFolders = [...folders]
                
                folders.forEach(subfolder => {
                    const subContents = this.getFolderContents(subfolder.id, true)
                    allFiles.push(...subContents.files)
                    allFolders.push(...subContents.folders)
                })
                
                result = {
                    ...result,
                    allFiles: allFiles,
                    allFolders: allFolders,
                    recursiveCount: allFiles.length + allFolders.length,
                    recursiveSize: allFiles.reduce((sum, f) => sum + (f.size || 0), 0)
                }
            }
            
            // Cache the result
            this.cache.folderContents[cacheKey] = result
            
            return result
        } catch (error) {
            return {
                success: false,
                error: error.message,
                folder: null,
                folders: [],
                files: []
            }
        }
    }

    /**
     * Update folder metadata
     */
    _updateFolderMetadata(folderId) {
        if (!folderId || !this.fileSystem.folders[folderId]) return
        
        const contents = this.getFolderContents(folderId, false)
        const folder = this.fileSystem.folders[folderId]
        
        folder.metadata.items = contents.totalItems
        folder.metadata.size = contents.totalSize
        folder.modifiedAt = new Date().toISOString()
        
        // Update parent folders recursively
        if (folder.parentId) {
            this._updateFolderMetadata(folder.parentId)
        }
    }

    // =====================
    // ACCOUNT MANAGEMENT
    // =====================

    /**
     * Add new account
     * @param {Object} accountData - Account information
     * @returns {Object} Result
     */
    addAccount(accountData) {
        try {
            const accountId = this._generateId('account')
            
            const account = {
                id: accountId,
                name: accountData.name || `MEGA Account ${Object.keys(this.accounts).length + 1}`,
                provider: 'mega',
                email: accountData.email || '',
                usedSpace: 0,
                totalSpace: accountData.totalSpace || 15 * 1024 * 1024 * 1024,
                isActive: true,
                priority: Object.keys(this.accounts).length + 1,
                lastSync: Date.now(),
                files: new Set(),
                folders: new Set(),
                metadata: {
                    color: accountData.color || this._getRandomColor(),
                    icon: 'mega',
                    quotaWarning: 0.8,
                    addedAt: new Date().toISOString()
                }
            }
            
            this.accounts[accountId] = account
            
            // Recalculate virtual pool
            this._calculateVirtualPool()
            
            this.saveToLocalStorage()
            
            return {
                success: true,
                account: account,
                message: `Account "${account.name}" added successfully`
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Remove account
     * @param {string} accountId - Account ID
     * @param {boolean} transferFiles - Transfer files to other accounts
     * @returns {Object} Result
     */
    removeAccount(accountId, transferFiles = true) {
        try {
            const account = this.accounts[accountId]
            if (!account) {
                throw new Error('Account not found')
            }
            
            if (transferFiles) {
                // Transfer files to other accounts
                const filesToTransfer = Array.from(account.files)
                for (const fileId of filesToTransfer) {
                    const file = this.fileSystem.files[fileId]
                    if (file) {
                        const newAccountId = this._chooseAccountForFile(file, file.parentId)
                        if (newAccountId) {
                            // Update file mapping
                            this.fileMapping[fileId] = newAccountId
                            
                            // Update account usage
                            this.accounts[newAccountId].usedSpace += file.size || 0
                            this.accounts[newAccountId].files.add(fileId)
                        }
                    }
                }
            }
            
            // Remove account
            delete this.accounts[accountId]
            
            // Recalculate virtual pool
            this._calculateVirtualPool()
            
            this.saveToLocalStorage()
            
            return {
                success: true,
                message: `Account "${account.name}" removed successfully`
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    /**
     * Get account statistics
     * @returns {Object} Account stats
     */
    getAccountStats() {
        if (this.cache.accountStats) {
            return this.cache.accountStats
        }
        
        const accounts = Object.values(this.accounts)
        const totalSpace = accounts.reduce((sum, acc) => sum + acc.totalSpace, 0)
        const usedSpace = accounts.reduce((sum, acc) => sum + acc.usedSpace, 0)
        const freeSpace = totalSpace - usedSpace
        
        const stats = {
            totalAccounts: accounts.length,
            activeAccounts: accounts.filter(acc => acc.isActive).length,
            totalSpace: totalSpace,
            usedSpace: usedSpace,
            freeSpace: freeSpace,
            usagePercentage: totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0,
            accounts: accounts.map(acc => ({
                id: acc.id,
                name: acc.name,
                usedSpace: acc.usedSpace,
                totalSpace: acc.totalSpace,
                freeSpace: acc.totalSpace - acc.usedSpace,
                usagePercentage: (acc.usedSpace / acc.totalSpace) * 100,
                fileCount: acc.files.size,
                isActive: acc.isActive,
                metadata: acc.metadata
            })),
            warnings: this._getSpaceWarnings()
        }
        
        this.cache.accountStats = stats
        return stats
    }

    // =====================
    // SEARCH & FILTER
    // =====================

    /**
     * Search files and folders
     * @param {string} query - Search query
     * @param {Object} filters - Search filters
     * @returns {Object} Search results
     */
    search(query, filters = {}) {
        try {
            const cacheKey = JSON.stringify({ query, filters })
            if (this.cache.searchResults[cacheKey]) {
                return this.cache.searchResults[cacheKey]
            }
            
            let files = Object.values(this.fileSystem.files)
            let folders = Object.values(this.fileSystem.folders)
            
            // Apply search query
            if (query && query.trim()) {
                const searchTerm = query.toLowerCase().trim()
                files = files.filter(f => 
                    f.name.toLowerCase().includes(searchTerm) ||
                    (f.metadata?.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
                )
                folders = folders.filter(f => 
                    f.name.toLowerCase().includes(searchTerm)
                )
            }
            
            // Apply filters
            if (filters.type) {
                files = files.filter(f => f.type === filters.type)
            }
            
            if (filters.minSize || filters.maxSize) {
                files = files.filter(f => {
                    const size = f.size || 0
                    if (filters.minSize && size < filters.minSize) return false
                    if (filters.maxSize && size > filters.maxSize) return false
                    return true
                })
            }
            
            if (filters.dateFrom || filters.dateTo) {
                const from = filters.dateFrom ? new Date(filters.dateFrom) : null
                const to = filters.dateTo ? new Date(filters.dateTo) : null
                
                files = files.filter(f => {
                    const date = new Date(f.createdAt)
                    if (from && date < from) return false
                    if (to && date > to) return false
                    return true
                })
            }
            
            if (filters.starred) {
                files = files.filter(f => f.metadata?.starred === true)
            }
            
            // Sort results
            const sortBy = filters.sortBy || 'name'
            const sortOrder = filters.sortOrder || 'asc'
            
            const sortFunction = (a, b) => {
                let aVal, bVal
                
                switch (sortBy) {
                    case 'name':
                        aVal = a.name.toLowerCase()
                        bVal = b.name.toLowerCase()
                        break
                    case 'size':
                        aVal = a.size || 0
                        bVal = b.size || 0
                        break
                    case 'date':
                        aVal = new Date(a.createdAt)
                        bVal = new Date(b.createdAt)
                        break
                    case 'type':
                        aVal = a.type
                        bVal = b.type
                        break
                    default:
                        aVal = a.name
                        bVal = b.name
                }
                
                if (sortOrder === 'asc') {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
                } else {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
                }
            }
            
            files.sort(sortFunction)
            folders.sort(sortFunction)
            
            const result = {
                success: true,
                query: query,
                filters: filters,
                files: files,
                folders: folders,
                totalResults: files.length + folders.length,
                fileCount: files.length,
                folderCount: folders.length
            }
            
            // Cache result
            this.cache.searchResults[cacheKey] = result
            
            return result
        } catch (error) {
            return {
                success: false,
                error: error.message,
                files: [],
                folders: []
            }
        }
    }

    // =====================
    // UTILITY METHODS
    // =====================

    /**
     * Choose best account for file
     */
    _chooseAccountForFile(file, targetFolderId) {
        const accounts = Object.values(this.accounts)
            .filter(acc => acc.isActive)
            .sort((a, b) => {
                switch (this.config.distributionAlgorithm) {
                    case 'space-based':
                        // Prefer accounts with most free space
                        return (b.totalSpace - b.usedSpace) - (a.totalSpace - a.usedSpace)
                    
                    case 'round-robin':
                        // Round robin based on priority
                        return a.priority - b.priority
                    
                    case 'type-based':
                        // Distribute by file type
                        const fileType = this._getFileType(file.name || file.type || '')
                        const typeHash = this._hashString(fileType)
                        return (typeHash % accounts.length) - (this._hashString(a.id) % accounts.length)
                    
                    case 'smart-balance':
                    default:
                        // Smart balancing: consider both free space and load
                        const aScore = (a.totalSpace - a.usedSpace) / a.totalSpace - (a.files.size / 1000)
                        const bScore = (b.totalSpace - b.usedSpace) / b.totalSpace - (b.files.size / 1000)
                        return bScore - aScore
                }
            })
        
        return accounts.length > 0 ? accounts[0].id : null
    }

    /**
     * Check if account has enough space
     */
    _hasEnoughSpace(accountId, fileSize) {
        const account = this.accounts[accountId]
        if (!account) return false
        
        const availableSpace = account.totalSpace - account.usedSpace
        const safetyBuffer = account.totalSpace * 0.05 // 5% safety buffer
        
        return fileSize <= (availableSpace - safetyBuffer)
    }

    /**
     * Calculate virtual pool statistics
     */
    _calculateVirtualPool() {
        const accounts = Object.values(this.accounts)
        this.config.totalVirtualSpace = accounts.reduce((sum, acc) => sum + acc.totalSpace, 0)
        
        // Update stats
        this.stats.totalSize = accounts.reduce((sum, acc) => sum + acc.usedSpace, 0)
        this.stats.lastUpdated = Date.now()
        
        // Emit space changed event
        this._emitEvent('onSpaceChanged', {
            totalSpace: this.config.totalVirtualSpace,
            usedSpace: this.stats.totalSize
        })
    }

    /**
     * Generate file download URL
     */
    _generateDownloadUrl(fileId) {
        // In real implementation, this would generate actual MEGA download link
        // For simulation, we generate a data URL or placeholder
        return `https://mega.nz/file/${fileId}#simulated-download`
    }

    /**
     * Get file type from name/extension
     */
    _getFileType(filename) {
        const extension = this._getFileExtension(filename).toLowerCase()
        const typeMap = {
            // Documents
            'pdf': 'pdf',
            'doc': 'doc', 'docx': 'doc',
            'xls': 'xls', 'xlsx': 'xls',
            'ppt': 'ppt', 'pptx': 'ppt',
            'txt': 'text', 'md': 'text', 'rtf': 'text',
            
            // Images
            'jpg': 'image', 'jpeg': 'image', 'png': 'image',
            'gif': 'image', 'bmp': 'image', 'svg': 'image',
            'webp': 'image', 'ico': 'image',
            
            // Audio
            'mp3': 'audio', 'wav': 'audio', 'ogg': 'audio',
            'flac': 'audio', 'm4a': 'audio',
            
            // Video
            'mp4': 'video', 'avi': 'video', 'mkv': 'video',
            'mov': 'video', 'wmv': 'video', 'flv': 'video',
            
            // Archives
            'zip': 'archive', 'rar': 'archive', '7z': 'archive',
            'tar': 'archive', 'gz': 'archive',
            
            // Code
            'js': 'code', 'json': 'code', 'html': 'code',
            'css': 'code', 'py': 'code', 'java': 'code',
            'cpp': 'code', 'cs': 'code', 'php': 'code',
            
            // Other
            'exe': 'binary', 'dmg': 'binary', 'apk': 'binary',
            'ai': 'vector', 'psd': 'psd', 'sketch': 'sketch'
        }
        
        return typeMap[extension] || 'unknown'
    }

    /**
     * Get file extension
     */
    _getFileExtension(filename) {
        return filename.split('.').pop() || ''
    }

    /**
     * Estimate file size
     */
    _estimateFileSize(filename, fileType) {
        // Rough estimation based on file type
        const sizeMap = {
            'text': 50 * 1024, // 50KB average
            'pdf': 2 * 1024 * 1024, // 2MB average
            'doc': 500 * 1024, // 500KB average
            'image': 3 * 1024 * 1024, // 3MB average
            'video': 50 * 1024 * 1024, // 50MB average
            'audio': 5 * 1024 * 1024, // 5MB average
            'archive': 10 * 1024 * 1024, // 10MB average
            'code': 100 * 1024 // 100KB average
        }
        
        return sizeMap[fileType] || 1 * 1024 * 1024 // Default 1MB
    }

    /**
     * Estimate download time
     */
    _estimateDownloadTime(fileSize) {
        const avgSpeed = 5 * 1024 * 1024 // 5MB/s average
        const seconds = fileSize / avgSpeed
        return Math.ceil(seconds)
    }

    /**
     * Generate unique ID
     */
    _generateId(type) {
        const timestamp = Date.now().toString(36)
        const random = Math.random().toString(36).substr(2, 9)
        return `${type}_${timestamp}_${random}`
    }

    /**
     * Generate file hash (simulated)
     */
    _generateFileHash(file) {
        const str = `${file.name}_${file.size}_${Date.now()}_${Math.random()}`
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return hash.toString(36)
    }

    /**
     * Get random color for folders
     */
    _getRandomColor() {
        const colors = ['blue', 'green', 'purple', 'yellow', 'pink', 'indigo', 'teal']
        return colors[Math.floor(Math.random() * colors.length)]
    }

    /**
     * Hash string for distribution
     */
    _hashString(str) {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return Math.abs(hash)
    }

    /**
     * Check if folder is descendant
     */
    _isDescendant(folderId, potentialAncestorId) {
        if (!folderId || !potentialAncestorId) return false
        
        let currentId = folderId
        while (currentId) {
            const current = this.fileSystem.folders[currentId]
            if (!current) break
            
            if (current.parentId === potentialAncestorId) {
                return true
            }
            
            currentId = current.parentId
        }
        
        return false
    }

    /**
     * Distribute folder across accounts
     */
    _distributeFolder(folderId) {
        const folder = this.fileSystem.folders[folderId]
        if (!folder) return
        
        const accounts = Object.values(this.accounts).filter(acc => acc.isActive)
        if (accounts.length === 0) return
        
        // Assign folder to all accounts for distributed storage
        folder.metadata.distributedAccounts = accounts.map(acc => acc.id)
        folder.metadata.distributionStrategy = 'replicated'
    }

    /**
     * Get space warnings
     */
    _getSpaceWarnings() {
        const warnings = []
        const stats = this.getAccountStats()
        
        stats.accounts.forEach(acc => {
            if (acc.usagePercentage >= 90) {
                warnings.push({
                    type: 'critical',
                    account: acc.name,
                    message: `Account is almost full (${acc.usagePercentage.toFixed(1)}%)`,
                    remaining: this._formatBytes(acc.freeSpace)
                })
            } else if (acc.usagePercentage >= 80) {
                warnings.push({
                    type: 'warning',
                    account: acc.name,
                    message: `Account is getting full (${acc.usagePercentage.toFixed(1)}%)`,
                    remaining: this._formatBytes(acc.freeSpace)
                })
            }
        })
        
        if (stats.usagePercentage >= 85) {
            warnings.push({
                type: 'pool-warning',
                message: `Virtual pool is ${stats.usagePercentage.toFixed(1)}% full`,
                suggestion: 'Consider adding more accounts or cleaning up old files'
            })
        }
        
        return warnings
    }

    /**
     * Format bytes to human readable
     */
    _formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes'
        
        const k = 1024
        const dm = decimals < 0 ? 0 : decimals
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
        
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }

    /**
     * Clear cache
     */
    _clearCache(type) {
        switch (type) {
            case 'folderContents':
                this.cache.folderContents = {}
                break
            case 'searchResults':
                this.cache.searchResults = {}
                break
            case 'accountStats':
                this.cache.accountStats = null
                break
            case 'all':
                this.cache = {
                    folderContents: {},
                    searchResults: {},
                    accountStats: null,
                    lastCleanup: Date.now()
                }
                break
        }
    }

    /**
     * Emit event
     */
    _emitEvent(eventName, data) {
        if (this.events[eventName]) {
            this.events[eventName].forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in ${eventName} callback:`, error)
                }
            })
        }
    }

    /**
     * Add event listener
     */
    on(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName].push(callback)
        }
    }

    /**
     * Remove event listener
     */
    off(eventName, callback) {
        if (this.events[eventName]) {
            this.events[eventName] = this.events[eventName].filter(cb => cb !== callback)
        }
    }

    // =====================
    // PERSISTENCE
    // =====================

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        try {
            const data = {
                config: this.config,
                accounts: this._serializeAccounts(),
                fileSystem: this.fileSystem,
                fileMapping: this.fileMapping,
                stats: this.stats,
                version: '1.0.0',
                savedAt: new Date().toISOString()
            }
            
            localStorage.setItem('driveManagerData', JSON.stringify(data))
            localStorage.setItem('driveManagerLastSave', Date.now().toString())
            
            return true
        } catch (error) {
            console.error('Error saving to localStorage:', error)
            return false
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const data = localStorage.getItem('driveManagerData')
            if (!data) return false
            
            const parsed = JSON.parse(data)
            
            // Restore config
            this.config = parsed.config || this.config
            
            // Restore accounts
            this.accounts = this._deserializeAccounts(parsed.accounts || {})
            
            // Restore file system
            this.fileSystem = parsed.fileSystem || this.fileSystem
            this.fileMapping = parsed.fileMapping || this.fileMapping
            
            // Restore stats
            this.stats = parsed.stats || this.stats
            
            // Recalculate virtual pool
            this._calculateVirtualPool()
            
            // Clear cache
            this._clearCache('all')
            
            return true
        } catch (error) {
            console.error('Error loading from localStorage:', error)
            return false
        }
    }

    /**
     * Serialize accounts for storage
     */
    _serializeAccounts() {
        const serialized = {}
        Object.keys(this.accounts).forEach(accountId => {
            const account = this.accounts[accountId]
            serialized[accountId] = {
                ...account,
                files: Array.from(account.files),
                folders: Array.from(account.folders)
            }
        })
        return serialized
    }

    /**
     * Deserialize accounts from storage
     */
    _deserializeAccounts(data) {
        const accounts = {}
        Object.keys(data).forEach(accountId => {
            const accountData = data[accountId]
            accounts[accountId] = {
                ...accountData,
                files: new Set(accountData.files || []),
                folders: new Set(accountData.folders || [])
            }
        })
        return accounts
    }

    /**
     * Export data as JSON
     */
    exportData() {
        const data = {
            config: this.config,
            accounts: this._serializeAccounts(),
            fileSystem: this.fileSystem,
            fileMapping: this.fileMapping,
            stats: this.stats,
            exportedAt: new Date().toISOString()
        }
        
        return JSON.stringify(data, null, 2)
    }

    /**
     * Import data from JSON
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData)
            
            // Validate data structure
            if (!data.fileSystem || !data.accounts) {
                throw new Error('Invalid data format')
            }
            
            // Merge with existing data
            this.config = { ...this.config, ...data.config }
            this.accounts = this._deserializeAccounts(data.accounts)
            this.fileSystem = data.fileSystem
            this.fileMapping = data.fileMapping
            this.stats = data.stats
            
            // Recalculate
            this._calculateVirtualPool()
            this._clearCache('all')
            this.saveToLocalStorage()
            
            return {
                success: true,
                message: 'Data imported successfully',
                stats: this.stats
            }
        } catch (error) {
            return {
                success: false,
                error: error.message
            }
        }
    }

    // =====================
    // PUBLIC API
    // =====================

    /**
     * Get system statistics
     */
    getStats() {
        return {
            ...this.stats,
            virtualPool: {
                name: this.config.poolName,
                totalSpace: this.config.totalVirtualSpace,
                usedSpace: this.stats.totalSize,
                freeSpace: this.config.totalVirtualSpace - this.stats.totalSize,
                usagePercentage: (this.stats.totalSize / this.config.totalVirtualSpace) * 100
            },
            formatted: {
                totalSpace: this._formatBytes(this.config.totalVirtualSpace),
                usedSpace: this._formatBytes(this.stats.totalSize),
                freeSpace: this._formatBytes(this.config.totalVirtualSpace - this.stats.totalSize)
            }
        }
    }

    /**
     * Get file info by ID
     */
    getFileInfo(fileId) {
        const file = this.fileSystem.files[fileId]
        if (!file) return null
        
        const accountId = this.fileMapping[fileId]
        const account = this.accounts[accountId]
        
        return {
            ...file,
            account: account ? {
                id: account.id,
                name: account.name,
                provider: account.provider
            } : null,
            downloadUrl: this._generateDownloadUrl(fileId),
            path: this._getItemPath(fileId)
        }
    }

    /**
     * Get folder info by ID
     */
    getFolderInfo(folderId) {
        const folder = this.fileSystem.folders[folderId]
        if (!folder) return null
        
        return {
            ...folder,
            path: this._getItemPath(folderId),
            breadcrumbs: this._getBreadcrumbs(folderId)
        }
    }

    /**
     * Get item path
     */
    _getItemPath(itemId) {
        const path = []
        let currentId = itemId
        
        while (currentId) {
            const item = this.fileSystem.files[currentId] || this.fileSystem.folders[currentId]
            if (!item) break
            
            path.unshift(item.name)
            currentId = item.parentId
        }
        
        return path.join('/')
    }

    /**
     * Get breadcrumbs for folder
     */
    _getBreadcrumbs(folderId) {
        const breadcrumbs = []
        let currentId = folderId
        
        while (currentId) {
            const folder = this.fileSystem.folders[currentId]
            if (!folder) break
            
            breadcrumbs.unshift({
                id: folder.id,
                name: folder.name
            })
            
            currentId = folder.parentId
        }
        
        return breadcrumbs
    }

    /**
     * Toggle file star
     */
    toggleStar(fileId) {
        const file = this.fileSystem.files[fileId]
        if (!file) return false
        
        file.metadata = file.metadata || {}
        file.metadata.starred = !file.metadata.starred
        file.modifiedAt = new Date().toISOString()
        
        this.saveToLocalStorage()
        return file.metadata.starred
    }

    /**
     * Clean up trash (permanently delete trashed items)
     */
    cleanupTrash() {
        const trashedFiles = Object.values(this.fileSystem.files)
            .filter(f => f.metadata?.trashed)
            .map(f => f.id)
        
        const trashedFolders = Object.values(this.fileSystem.folders)
            .filter(f => f.id !== 'root' && f.metadata?.trashed)
            .map(f => f.id)
        
        const result = this.deleteItems([...trashedFiles, ...trashedFolders], true)
        
        return {
            ...result,
            message: `Cleaned up ${result.deleted} trashed item(s)`
        }
    }

    /**
     * Optimize storage (rebalance files across accounts)
     */
    optimizeStorage() {
        const startTime = Date.now()
        let movedFiles = 0
        let errors = []
        
        // Get all files
        const files = Object.values(this.fileSystem.files)
        
        for (const file of files) {
            const currentAccountId = this.fileMapping[file.id]
            const optimalAccountId = this._chooseAccountForFile(file, file.parentId)
            
            if (optimalAccountId && optimalAccountId !== currentAccountId) {
                try {
                    // Move file to optimal account
                    const currentAccount = this.accounts[currentAccountId]
                    const optimalAccount = this.accounts[optimalAccountId]
                    
                    // Check if optimal account has space
                    if (this._hasEnoughSpace(optimalAccountId, file.size)) {
                        // Update mappings
                        this.fileMapping[file.id] = optimalAccountId
                        
                        // Update account usage
                        currentAccount.usedSpace -= file.size
                        currentAccount.files.delete(file.id)
                        
                        optimalAccount.usedSpace += file.size
                        optimalAccount.files.add(file.id)
                        
                        movedFiles++
                    }
                } catch (error) {
                    errors.push(`Failed to move ${file.name}: ${error.message}`)
                }
            }
        }
        
        const duration = Date.now() - startTime
        
        this._clearCache('accountStats')
        this.saveToLocalStorage()
        
        return {
            success: errors.length === 0,
            movedFiles: movedFiles,
            errors: errors,
            duration: duration,
            message: `Storage optimized. Moved ${movedFiles} file(s) to better accounts.`
        }
    }
}

// Export as ES6 module
export default DriveManager

// Also support CommonJS for compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DriveManager
}