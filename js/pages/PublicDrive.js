// js/pages/PublicDrive.js
// ============================================================================
// PUBLIC DRIVE – Complete Google Drive clone for public usage
// No login required – everyone can view, upload, download, and manage files.
// Files are stored encrypted in GitHub Gists (public).
// Firestore collection: 'public' (single pool, no user separation).
// GitHub token is stored in Firestore document 'public/config'.
// ============================================================================

import {
    db,
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
    query, where, serverTimestamp, writeBatch, increment
} from '../../../firebaseConfig.js';

// Global libraries (loaded via index.html)
const pako = window.pako;
const base32 = window.base32;
const base85 = window.base85;
const base91 = window.base91;

// ============================================================================
// PUBLIC DRIVE MANAGER – handles all backend operations (Firestore + GitHub Gist)
// ============================================================================
class PublicDriveManager {
    constructor() {
        this.githubToken = null;
        this.tokenValid = false;
        this.db = db;
        this.initialized = false;
        this.initPromise = this._init().catch(err => {
            console.error('PublicDriveManager initialization failed:', err);
            this.initialized = true;
        });
        this.maxConcurrentUploads = 5; // masih digunakan untuk memproses chunk paralel
        this.githubOwner = null; // tidak diperlukan untuk Gist, tapi kita simpan
    }

    async _init() {
        await this._loadPublicConfig();
        if (this.githubToken) {
            this.tokenValid = await this._verifyToken();
            if (!this.tokenValid) {
                console.warn('⚠️ Public GitHub token is invalid – uploads will fail');
            }
        } else {
            console.warn('⚠️ No public GitHub token – uploads will fail');
        }
        this.initialized = true;
    }

    async _loadPublicConfig() {
        try {
            const configDoc = await getDoc(doc(this.db, 'public', 'config'));
            if (configDoc.exists()) {
                const data = configDoc.data();
                this.githubToken = data.githubToken ? data.githubToken.trim() : null;
                if (this.githubToken) {
                    console.log('✅ Public GitHub token loaded from Firestore');
                } else {
                    console.warn('⚠️ Public GitHub token field is empty – uploads will fail');
                }
            } else {
                console.warn('⚠️ No public GitHub token document – uploads will fail');
                this.githubToken = null;
            }
        } catch (error) {
            console.error('Error loading public config:', error);
            this.githubToken = null;
        }
    }

    async _verifyToken() {
        if (!this.githubToken) return false;
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ GitHub token valid (user: ${data.login})`);
                return true;
            } else {
                console.warn(`⚠️ GitHub token invalid (status ${response.status})`);
                return false;
            }
        } catch (error) {
            console.error('Error verifying GitHub token:', error);
            return false;
        }
    }

    // ------------------------------------------------------------------------
    // Firestore operations – collection 'public'
    // ------------------------------------------------------------------------
    async getFolderContents(folderId) {
        await this.initPromise;
        const itemsRef = collection(this.db, 'public');
        let q;
        if (!folderId) {
            q = query(itemsRef, where('parentId', '==', null));
        } else {
            q = query(itemsRef, where('parentId', '==', folderId));
        }
        q = query(q, where('trashed', '==', false));
        const snapshot = await getDocs(q);
        const folders = [];
        const files = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const item = { id: docSnap.id, ...data };
            if (data.createdAt) item.createdAt = data.createdAt.toDate().toISOString();
            if (data.modifiedAt) item.modifiedAt = data.modifiedAt.toDate().toISOString();
            if (data.type === 'folder') {
                folders.push(item);
            } else {
                files.push(item);
            }
        });
        return { folders, files, success: true };
    }

    async getFolderInfo(folderId) {
        await this.initPromise;
        if (!folderId) return { id: null, name: 'Public Drive', type: 'folder' };
        const docRef = doc(this.db, 'public', folderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data.createdAt) data.createdAt = data.createdAt.toDate().toISOString();
            if (data.modifiedAt) data.modifiedAt = data.modifiedAt.toDate().toISOString();
            return { id: snap.id, ...data };
        }
        return null;
    }

    async createFolder(name, parentId, metadata = {}) {
        await this.initPromise;
        const folderData = {
            type: 'folder',
            name,
            parentId: parentId || null,
            createdAt: serverTimestamp(),
            modifiedAt: serverTimestamp(),
            trashed: false,
            color: metadata.color || 'blue',
            items: 0,
            size: '0 B',
            downloads: 0
        };
        const docRef = await addDoc(collection(this.db, 'public'), folderData);
        return { success: true, folder: { id: docRef.id, ...folderData } };
    }

    async getFileInfo(fileId) {
        await this.initPromise;
        const docRef = doc(this.db, 'public', fileId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data.createdAt) data.createdAt = data.createdAt.toDate().toISOString();
            if (data.modifiedAt) data.modifiedAt = data.modifiedAt.toDate().toISOString();
            return data;
        }
        return null;
    }

    // ------------------------------------------------------------------------
    // Upload – menggunakan GitHub Gist
    // ------------------------------------------------------------------------
    async uploadFiles(files, targetFolderId) {
        await this.initPromise;
        if (!this.githubToken) {
            throw new Error('Public GitHub token missing – uploads disabled. Please contact administrator.');
        }
        if (!this.tokenValid) {
            throw new Error('GitHub token is invalid or expired. Please contact administrator.');
        }

        const results = [];
        for (const file of files) {
            try {
                const result = await this._uploadSingleFile(file, targetFolderId);
                results.push(result);
            } catch (error) {
                console.error(`Failed to upload ${file.name}:`, error);
                throw new Error(`Upload failed for ${file.name}: ${error.message}`);
            }
        }
        return { success: true, files: results };
    }

    async _uploadSingleFile(file, targetFolderId) {
        // 1. Generate AES‑256 key
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        const rawKey = await crypto.subtle.exportKey('raw', key);
        const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

        // 2. Baca file
        const buffer = await file.arrayBuffer();
        const fileData = new Uint8Array(buffer);
        const totalSize = fileData.length;

        // 3. Chunking (750KB per chunk)
        const CHUNK_SIZE = 750 * 1024;
        const numChunks = Math.ceil(totalSize / CHUNK_SIZE);
        const chunkPromises = [];

        for (let i = 0; i < numChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const chunkData = fileData.slice(start, end);
            chunkPromises.push(this._processChunk(chunkData, i, key));
        }

        // Proses semua chunk paralel (terbatas)
        const chunks = await this._runWithConcurrency(chunkPromises, this.maxConcurrentUploads);

        // 4. Buat Gist dengan semua file chunk
        const gistFiles = {};
        chunks.forEach(chunk => {
            // chunk.content adalah string template yang sudah berisi doubleEncoded
            gistFiles[chunk.filename] = { content: chunk.content };
        });

        const gistData = {
            description: `Public file: ${file.name}`,
            public: true,
            files: gistFiles
        };

        const gist = await this._createGist(gistData);

        // 5. Simpan metadata ke Firestore (tanpa konten chunk, hanya referensi)
        const fileDoc = {
            type: 'file',
            name: file.name,
            parentId: targetFolderId || null,
            size: totalSize,
            mimeType: file.type || 'application/octet-stream',
            createdAt: serverTimestamp(),
            modifiedAt: serverTimestamp(),
            trashed: false,
            tags: this._getTagsFromMime(file.type),
            gistId: gist.id,
            files: chunks.map(chunk => ({
                filename: chunk.filename,
                index: chunk.index,
                hash: chunk.hash,
                iv: chunk.iv,
                tag: chunk.tag,
                encoding: chunk.encoding,
                size: chunk.size
            })),
            key: keyBase64,
            downloads: 0
        };
        const docRef = await addDoc(collection(this.db, 'public'), fileDoc);

        return { id: docRef.id, name: file.name, size: totalSize };
    }

    async _processChunk(chunkData, index, cryptoKey) {
        const compressed = pako.deflate(chunkData);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            cryptoKey,
            compressed
        );
        const encryptedArray = new Uint8Array(encrypted);
        const tagLength = 16;
        const ciphertext = encryptedArray.slice(0, encryptedArray.length - tagLength);
        const tag = encryptedArray.slice(encryptedArray.length - tagLength);

        const encoding = this._randomEncoding();
        const encoded = this._encodeData(ciphertext, encoding);
        const doubleEncoded = btoa(encoded);

        // Pilih template secara acak (kita tidak perlu kategori repo lagi)
        const template = this._getRandomTemplate();
        const ext = this._getRandomExtension();
        const filename = `chunk_${index}.${ext}`;
        const content = template.replace('{encoded_data}', doubleEncoded);

        const hashBuffer = await crypto.subtle.digest('SHA-256', chunkData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return {
            filename,
            content,
            index,
            hash: hashHex,
            iv: btoa(String.fromCharCode(...iv)),
            tag: btoa(String.fromCharCode(...tag)),
            encoding,
            size: chunkData.length
        };
    }

    async _createGist(gistData) {
        const url = 'https://api.github.com/gists';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gistData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub Gist API error: ${error.message} (status ${response.status})`);
        }

        const gist = await response.json();
        console.log(`✅ Gist created: ${gist.id}`);
        return gist;
    }

    // ------------------------------------------------------------------------
    // Download dari GitHub Gist
    // ------------------------------------------------------------------------
    async downloadFiles(fileIds) {
        await this.initPromise;
        const results = [];
        for (const fileId of fileIds) {
            const fileData = await this._downloadSingleFile(fileId);
            if (fileData) {
                results.push(fileData);
                this._triggerDownload(fileData);
                await this._incrementDownloadCount(fileId);
            }
        }
        return { success: true, files: results };
    }

    async _downloadSingleFile(fileId) {
        const fileInfo = await this.getFileInfo(fileId);
        if (!fileInfo) return null;

        const key = await this._importKey(fileInfo.key);
        const files = fileInfo.files.sort((a, b) => a.index - b.index);

        // Ambil Gist
        const gist = await this._getGist(fileInfo.gistId);
        const pieces = [];

        for (const fileMeta of files) {
            const gistFile = gist.files[fileMeta.filename];
            if (!gistFile) throw new Error(`Chunk file ${fileMeta.filename} not found in Gist`);

            const content = gistFile.content;
            const doubleEncoded = this._extractDoubleEncoded(content);
            if (!doubleEncoded) throw new Error('No encoded data found in chunk');

            const encoded = atob(doubleEncoded);
            const ciphertext = this._decodeData(encoded, fileMeta.encoding);

            const iv = Uint8Array.from(atob(fileMeta.iv), c => c.charCodeAt(0));
            const tag = Uint8Array.from(atob(fileMeta.tag), c => c.charCodeAt(0));
            const encrypted = new Uint8Array([...ciphertext, ...tag]);

            const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
            const decompressed = pako.inflate(new Uint8Array(decrypted));

            // Verifikasi hash
            const hashBuffer = await crypto.subtle.digest('SHA-256', decompressed);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            if (hashHex !== fileMeta.hash) {
                console.warn(`⚠️ Hash mismatch for chunk ${fileMeta.filename}`);
            }

            pieces.push(decompressed);
        }

        const totalLength = pieces.reduce((acc, chunk) => acc + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of pieces) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return { name: fileInfo.name, data: result, mime: fileInfo.mimeType };
    }

    async _getGist(gistId) {
        const url = `https://api.github.com/gists/${gistId}`;
        // Gist publik bisa diakses tanpa token, tapi kita tetap pakai token untuk keandalan
        const response = await fetch(url, {
            headers: this.githubToken ? { 'Authorization': `token ${this.githubToken}` } : {}
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch Gist: ${response.status}`);
        }
        return await response.json();
    }

    _extractDoubleEncoded(text) {
        const doubleQuoted = text.match(/"((?:[^"\\]|\\.)*)"/g) || [];
        const singleQuoted = text.match(/'((?:[^'\\]|\\.)*)'/g) || [];
        const allQuoted = doubleQuoted.concat(singleQuoted);
        if (allQuoted.length > 0) {
            const longest = allQuoted.reduce((a, b) => a.length > b.length ? a : b, '');
            const quotedContent = longest.slice(1, -1);
            try {
                return JSON.parse('"' + quotedContent + '"');
            } catch (e) {
                return quotedContent.replace(/\\(.)/g, '$1');
            }
        }
        const base64Matches = text.match(/[A-Za-z0-9+/=]{50,}/g);
        if (base64Matches && base64Matches.length > 0) {
            return base64Matches.reduce((a, b) => a.length > b.length ? a : b, '');
        }
        return null;
    }

    async _importKey(keyBase64) {
        const rawKey = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
        return await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']);
    }

    _triggerDownload(fileData) {
        const blob = new Blob([fileData.data], { type: fileData.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        a.click();
        URL.revokeObjectURL(url);
    }

    async _incrementDownloadCount(fileId) {
        const ref = doc(this.db, 'public', fileId);
        await updateDoc(ref, { downloads: increment(1) });
    }

    // ------------------------------------------------------------------------
    // Delete / Move / Update (hanya metadata Firestore, Gist tetap ada)
    // ------------------------------------------------------------------------
    async deleteItems(itemIds, permanent = false) {
        await this.initPromise;
        const batch = writeBatch(this.db);
        for (const id of itemIds) {
            const ref = doc(this.db, 'public', id);
            if (!permanent) {
                batch.update(ref, { trashed: true, modifiedAt: serverTimestamp() });
            } else {
                batch.delete(ref);
                // Opsional: bisa juga hapus Gist, tapi biarkan saja
            }
        }
        await batch.commit();
        return { success: true, deleted: itemIds.length };
    }

    async moveItems(itemIds, targetFolderId) {
        await this.initPromise;
        const batch = writeBatch(this.db);
        for (const id of itemIds) {
            const ref = doc(this.db, 'public', id);
            batch.update(ref, { parentId: targetFolderId || null, modifiedAt: serverTimestamp() });
        }
        await batch.commit();
        return { success: true, movedItems: itemIds.length };
    }

    // ------------------------------------------------------------------------
    // Utilities (encoding, template, dll)
    // ------------------------------------------------------------------------
    _randomEncoding() {
        const available = ['base64'];
        if (typeof base32 !== 'undefined' && base32.Encoder) available.push('base32');
        if (typeof base85 !== 'undefined' && base85.encode) available.push('base85');
        if (typeof base91 !== 'undefined' && base91.encode) available.push('base91');
        return available[Math.floor(Math.random() * available.length)];
    }

    _encodeData(data, encoding) {
        const uint8 = new Uint8Array(data);
        const toBinaryString = arr => {
            let binary = '';
            for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
            return binary;
        };
        if (encoding === 'base64') return btoa(toBinaryString(uint8));
        if (encoding === 'base32' && base32?.Encoder) {
            try { return new base32.Encoder().write(uint8).finalize(); } catch (e) { }
        }
        if (encoding === 'base85' && base85?.encode) {
            try { return base85.encode(uint8); } catch (e) { }
        }
        if (encoding === 'base91' && base91?.encode) {
            try { return base91.encode(uint8); } catch (e) { }
        }
        return btoa(toBinaryString(uint8));
    }

    _decodeData(encodedStr, encoding) {
        if (encoding === 'base64') {
            const binary = atob(encodedStr);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            return bytes;
        }
        if (encoding === 'base32' && base32?.Decoder) {
            try { return new base32.Decoder().write(encodedStr).finalize(); } catch (e) { }
        }
        if (encoding === 'base85' && base85?.decode) {
            try { return base85.decode(encodedStr); } catch (e) { }
        }
        if (encoding === 'base91' && base91?.decode) {
            try { return base91.decode(encodedStr); } catch (e) { }
        }
        const binary = atob(encodedStr);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    _getRandomTemplate() {
        const allTemplates = [
            '// config.js\nconst API_KEY = "{encoded_data}";\nexport default API_KEY;',
            '// utils/helpers.js\nexport const secret = "{encoded_data}";',
            '// settings.json\n{\n  "token": "{encoded_data}"\n}',
            '// .env\nSECRET="{encoded_data}"\n',
            '// src/index.js\n// {encoded_data}\n',
            '# terraform.tfvars\nsecret = "{encoded_data}"\n',
            '# k8s-secret.yaml\napiVersion: v1\nkind: Secret\nmetadata:\n  name: app-secret\ndata:\n  token: {encoded_data}\n',
            '# Dockerfile\nENV SECRET="{encoded_data}"\n',
            '# ansible/vars.yml\nsecret: "{encoded_data}"\n',
            '# prometheus.yml\nscrape_configs:\n  - job_name: "app"\n    params:\n      token: ["{encoded_data}"]\n',
            '# grafana.ini\n[security]\nsecret_key = "{encoded_data}"\n',
            '# loki/config.yaml\nauth_token: "{encoded_data}"\n',
            '// config/database.js\nconst DB_PASS = "{encoded_data}";\n',
            '-- init.sql\n-- {encoded_data}\n',
            '// prisma/schema.prisma\n// {encoded_data}\n',
            '# seeds/seed.sql\n-- {encoded_data}\n',
            '# app/config.py\nSECRET_KEY = "{encoded_data}"\n',
            '// src/main/resources/application.properties\napi.secret={encoded_data}\n',
            '# app/config/config.exs\nconfig :app, secret: "{encoded_data}"\n',
            '# model_config.py\nMODEL_WEIGHTS = "{encoded_data}"\n',
            '# data/weights.txt\n{encoded_data}\n',
            '# notebook.ipynb\n# {encoded_data}\n',
            '// src/main.rs\nfn main() {\n    let secret = "{encoded_data}";\n}\n',
            '// index.js\nconst token = "{encoded_data}";\n',
            '# lib/secret.ex\n@secret "{encoded_data}"\n',
            '// hello.go\nvar secret = "{encoded_data}"\n',
        ];
        return allTemplates[Math.floor(Math.random() * allTemplates.length)];
    }

    _getRandomExtension() {
        const exts = ['js', 'ts', 'json', 'html', 'css', 'env', 'tf', 'yaml', 'sh', 'Dockerfile', 'yml', 'ini', 'conf', 'sql', 'prisma', 'py', 'java', 'properties', 'kt', 'exs', 'ipynb', 'txt', 'h5', 'rs', 'go', 'rb', 'php', 'c', 'cpp'];
        return exts[Math.floor(Math.random() * exts.length)];
    }

    _getTagsFromMime(mime) {
        if (!mime) return ['binary'];
        if (mime.startsWith('image/')) return ['image'];
        if (mime.startsWith('text/')) return ['text'];
        if (mime === 'application/pdf') return ['pdf'];
        return ['binary'];
    }

    async _runWithConcurrency(promises, limit) {
        const results = new Array(promises.length);
        const executing = new Set();
        for (let i = 0; i < promises.length; i++) {
            const p = promises[i].then(r => { results[i] = r; executing.delete(p); }).catch(e => { executing.delete(p); throw e; });
            executing.add(p);
            if (executing.size >= limit) await Promise.race(executing);
        }
        await Promise.all(executing);
        return results;
    }
}

// ============================================================================
// VUE PAGE COMPONENT – PublicDrive (template sama persis seperti sebelumnya)
// ============================================================================
export default {
    name: 'PublicDrivePage',

    data() {
        return {
            driveManager: null,
            currentFolderId: null,
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
            isLoading: true,
            tokenError: false,
            tokenErrorMessage: ''
        };
    },

    computed: {
        currentFolder() {
            if (!this.currentFolderId) return { id: null, name: 'Public Drive', type: 'folder' };
            return this.items.find(item => item.id === this.currentFolderId);
        },
        currentFolderName() {
            return this.currentFolder ? this.currentFolder.name : '';
        },
        breadcrumbs() {
            const crumbs = ['Public Drive'];
            let current = this.currentFolder;
            while (current && current.parentId) {
                current = this.items.find(i => i.id === current.parentId);
                if (current) crumbs.unshift(current.name);
            }
            return crumbs;
        },
        visibleItems() {
            return this.items.filter(item => item.parentId === this.currentFolderId);
        },
        filteredItems() {
            let items = this.visibleItems;
            if (this.searchQuery) {
                const q = this.searchQuery.toLowerCase();
                items = items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
            }
            return items.sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.name.localeCompare(b.name);
            });
        },
        folders() {
            return this.items.filter(i => i.type === 'folder');
        },
        selectedCount() {
            return this.selectedItems.size;
        },
        selectedItemsArray() {
            return Array.from(this.selectedItems).map(id => this.items.find(i => i.id === id)).filter(Boolean);
        },
        fileIconClasses() {
            return {
                folder: { blue: 'text-blue-600', green: 'text-green-600', purple: 'text-purple-600', yellow: 'text-yellow-600' },
                pdf: 'text-red-600',
                doc: 'text-blue-600',
                xls: 'text-green-600',
                ppt: 'text-orange-600',
                image: 'text-purple-600',
                archive: 'text-yellow-600',
                text: 'text-gray-600',
                ai: 'text-pink-600',
                csv: 'text-teal-600'
            };
        }
    },

    methods: {
        async initDriveManager() {
            try {
                this.isLoading = true;
                this.driveManager = new PublicDriveManager();
                await this.loadFolderContents();

                if (this.driveManager.githubToken && !this.driveManager.tokenValid) {
                    this.tokenError = true;
                    this.tokenErrorMessage = 'GitHub token is invalid or expired. Please check token in Firestore.';
                } else if (!this.driveManager.githubToken) {
                    this.tokenError = true;
                    this.tokenErrorMessage = 'GitHub token not configured. Please add token in Firestore (public/config).';
                }

                this.isLoading = false;
            } catch (error) {
                console.error('Failed to init PublicDriveManager:', error);
                this.isLoading = false;
                this.tokenError = true;
                this.tokenErrorMessage = 'Failed to initialize Public Drive. Please refresh.';
            }
        },

        async loadFolderContents() {
            if (!this.driveManager) return;
            const result = await this.driveManager.getFolderContents(this.currentFolderId);
            if (result.success) {
                this.items = [
                    ...result.folders.map(this.formatFolderForUI),
                    ...result.files.map(this.formatFileForUI)
                ];
            }
        },

        formatFolderForUI(folder) {
            return {
                id: folder.id,
                name: folder.name,
                type: 'folder',
                size: folder.size || '0 B',
                date: folder.createdAt ? new Date(folder.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
                items: folder.items || 0,
                color: folder.color || 'blue',
                parentId: folder.parentId,
                downloads: folder.downloads || 0,
                createdAt: folder.createdAt
            };
        },

        formatFileForUI(file) {
            return {
                id: file.id,
                name: file.name,
                type: file.type,
                size: this.formatBytes(file.size),
                date: file.createdAt ? new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
                downloads: file.downloads || 0,
                parentId: file.parentId,
                createdAt: file.createdAt
            };
        },

        formatBytes(bytes, decimals = 2) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const dm = decimals < 0 ? 0 : decimals;
            const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
        },

        // Selection & Click Handling (sama persis dengan versi sebelumnya)
        handleItemClick(item, event) {
            this.clickCount++;
            if (this.clickCount === 1) {
                this.pendingClickItem = item;
                this.pendingClickEvent = event;
                this.clickTimer = setTimeout(() => {
                    this.processSingleClick(item, event);
                    this.clickCount = 0;
                    this.pendingClickItem = null;
                    this.pendingClickEvent = null;
                }, 250);
            } else if (this.clickCount === 2) {
                clearTimeout(this.clickTimer);
                this.processDoubleClick(item);
                this.clickCount = 0;
                this.pendingClickItem = null;
                this.pendingClickEvent = null;
            }
        },

        processSingleClick(item, event) {
            const index = this.filteredItems.findIndex(i => i.id === item.id);
            if (event.ctrlKey || event.metaKey) {
                this.toggleSelectItem(item.id, index);
            } else if (event.shiftKey && this.lastSelectedIndex !== -1) {
                this.selectRange(index);
            } else {
                this.clearSelection();
                this.selectSingleItem(item.id, index);
            }
        },

        processDoubleClick(item) {
            if (item.type === 'folder') {
                this.navigateToFolder(item.id);
            } else {
                this.downloadFiles([item.id]);
            }
        },

        selectSingleItem(itemId, index) {
            this.selectedItems.clear();
            this.selectedItems.add(itemId);
            this.isSelecting = true;
            this.lastSelectedIndex = index;
            this.lastSelectedId = itemId;
        },

        toggleSelectItem(itemId, index) {
            if (this.selectedItems.has(itemId)) {
                this.selectedItems.delete(itemId);
                if (this.lastSelectedId === itemId) {
                    this.lastSelectedIndex = -1;
                    this.lastSelectedId = null;
                }
            } else {
                this.selectedItems.add(itemId);
                this.lastSelectedIndex = index;
                this.lastSelectedId = itemId;
            }
            this.isSelecting = this.selectedItems.size > 0;
            if (this.selectedItems.size === 0) {
                this.lastSelectedIndex = -1;
                this.lastSelectedId = null;
            }
        },

        selectRange(toIndex) {
            if (this.lastSelectedIndex === -1) {
                this.clearSelection();
                this.selectSingleItem(this.filteredItems[toIndex].id, toIndex);
                return;
            }
            const start = Math.min(this.lastSelectedIndex, toIndex);
            const end = Math.max(this.lastSelectedIndex, toIndex);
            this.selectedItems.clear();
            for (let i = start; i <= end; i++) {
                this.selectedItems.add(this.filteredItems[i].id);
            }
            this.isSelecting = true;
            this.lastSelectedIndex = toIndex;
            this.lastSelectedId = this.filteredItems[toIndex].id;
        },

        selectAll() {
            if (this.selectedItems.size === this.filteredItems.length) {
                this.clearSelection();
            } else {
                this.selectedItems = new Set(this.filteredItems.map(i => i.id));
                this.isSelecting = true;
                this.lastSelectedIndex = this.filteredItems.length - 1;
                this.lastSelectedId = this.filteredItems[this.lastSelectedIndex]?.id;
            }
        },

        clearSelection() {
            this.selectedItems.clear();
            this.isSelecting = false;
            this.lastSelectedIndex = -1;
            this.lastSelectedId = null;
        },

        navigateToFolder(folderId) {
            this.currentFolderId = folderId;
            this.clearSelection();
            this.loadFolderContents();
        },

        goBack() {
            if (this.currentFolderId) {
                const folder = this.items.find(i => i.id === this.currentFolderId);
                this.currentFolderId = folder?.parentId || null;
                this.clearSelection();
                this.loadFolderContents();
            }
        },

        navigateToRoot() {
            this.currentFolderId = null;
            this.clearSelection();
            this.loadFolderContents();
        },

        async downloadFiles(fileIds) {
            if (!this.driveManager) return;
            try {
                await this.driveManager.downloadFiles(fileIds);
                await this.loadFolderContents();
                this.showNotification(`Download started for ${fileIds.length} file(s)`);
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        },

        async deleteSelectedItems() {
            if (this.selectedCount === 0) return;
            if (!confirm(`Delete ${this.selectedCount} item(s)? They will be moved to trash.`)) return;
            const ids = Array.from(this.selectedItems);
            const result = await this.driveManager.deleteItems(ids, true);
            if (result.success) {
                this.clearSelection();
                await this.loadFolderContents();
                this.showNotification(`${result.deleted} item(s) moved to trash`);
            } else {
                this.showNotification('Delete failed', 'error');
            }
        },

        async createNewFolder() {
            if (!this.newFolderName.trim()) return;
            const result = await this.driveManager.createFolder(
                this.newFolderName.trim(),
                this.currentFolderId,
                { color: ['blue', 'green', 'purple', 'yellow'][Math.floor(Math.random() * 4)] }
            );
            if (result.success) {
                this.newFolderName = '';
                this.showNewFolderModal = false;
                await this.loadFolderContents();
                this.showNotification(`Folder "${result.folder.name}" created`);
            } else {
                this.showNotification(result.error, 'error');
            }
        },

        async moveSelectedItems(targetFolderId) {
            const ids = Array.from(this.selectedItems);
            const result = await this.driveManager.moveItems(ids, targetFolderId);
            if (result.success) {
                this.clearSelection();
                this.showMoveModal = false;
                await this.loadFolderContents();
                this.showNotification(`${result.movedItems} item(s) moved`);
            } else {
                this.showNotification(result.error, 'error');
            }
        },

        async processUpload(files, targetFolderId = this.currentFolderId) {
            if (this.tokenError) {
                this.showNotification('Uploads are disabled due to token issue. Please contact administrator.', 'error');
                return;
            }

            this.showUploadModal = true;
            this.isUploading = true;
            this.uploadedFiles = [];
            this.uploadProgress = [];

            const fileList = Array.from(files);
            fileList.forEach((file, i) => {
                this.uploadedFiles.push({
                    name: file.name,
                    size: this.formatBytes(file.size),
                    type: this.getFileTypeFromName(file.name),
                    targetFolderId
                });
                this.uploadProgress.push(0);
            });

            this.simulateUploadProgress();

            try {
                const result = await this.driveManager.uploadFiles(fileList, targetFolderId);
                if (result.success) {
                    this.uploadProgress = this.uploadProgress.map(() => 100);
                    setTimeout(async () => {
                        this.isUploading = false;
                        await this.loadFolderContents();
                        this.showNotification(`${result.files.length} file(s) uploaded to Public Drive`);
                    }, 1000);
                } else {
                    this.showNotification(result.error, 'error');
                    this.closeUploadModal();
                }
            } catch (error) {
                this.showNotification('Upload failed: ' + error.message, 'error');
                this.closeUploadModal();
            }
        },

        simulateUploadProgress() {
            this.uploadProgress.forEach((_, idx) => {
                const interval = setInterval(() => {
                    this.uploadProgress[idx] += Math.random() * 15;
                    if (this.uploadProgress[idx] >= 95) this.uploadProgress[idx] = 95;
                    this.uploadProgress = [...this.uploadProgress];
                }, 200);
            });
        },

        startUpload() {
            if (this.tokenError) {
                this.showNotification('Uploads are disabled due to token issue. Please contact administrator.', 'error');
                return;
            }
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.onchange = (e) => {
                if (e.target.files.length) this.processUpload(e.target.files);
                document.body.removeChild(input);
            };
            document.body.appendChild(input);
            input.click();
        },

        closeUploadModal() {
            this.showUploadModal = false;
            this.uploadProgress = [];
            this.uploadedFiles = [];
            this.isUploading = false;
        },

        // Drag & Drop (sama persis)
        handleDragStart(item, event) {
            this.dragSource = item;
            this.dragItems = this.selectedItems.has(item.id) ? this.selectedItemsArray : [item];
            event.dataTransfer.setData('application/json', JSON.stringify({ type: 'move', items: this.dragItems.map(i => i.id) }));
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', 'internal-drag');
        },

        handleDragEnter(e) {
            e.preventDefault();
            e.stopPropagation();
            this.dragCounter++;
            const hasFiles = e.dataTransfer.types.includes('Files');
            const isInternal = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag';
            if (!this.isDragOver && !this.showUploadModal && hasFiles && !isInternal) {
                this.isDragOver = true;
                this.isExternalDrag = true;
            } else if (isInternal) {
                this.isExternalDrag = false;
            }
        },

        handleDragLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            this.dragCounter--;
            if (this.dragCounter === 0) {
                this.isDragOver = false;
                this.isExternalDrag = false;
            }
        },

        handleDragOver(e) {
            e.preventDefault();
            e.stopPropagation();
            const isInternal = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag';
            e.dataTransfer.dropEffect = isInternal ? 'move' : 'copy';
        },

        async handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            this.dragCounter = 0;
            this.isDragOver = false;
            this.isExternalDrag = false;
            if (this.showUploadModal) return;

            const isInternal = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag';
            if (isInternal) {
                try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (data.type === 'move') {
                        await this.moveSelectedItems(this.currentFolderId);
                    }
                } catch (error) {
                    console.error('Drop error:', error);
                }
            } else if (e.dataTransfer.files.length) {
                this.processUpload(e.dataTransfer.files);
            }
        },

        async handleFolderDrop(folder, e) {
            e.preventDefault();
            e.stopPropagation();
            const isInternal = e.dataTransfer.types.includes('application/json') || e.dataTransfer.getData('text/plain') === 'internal-drag';
            if (isInternal) {
                try {
                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (data.type === 'move') {
                        await this.moveSelectedItems(folder.id);
                    }
                } catch (error) {
                    console.error('Folder drop error:', error);
                }
            } else if (e.dataTransfer.files.length) {
                this.processUpload(e.dataTransfer.files, folder.id);
            }
        },

        toggleViewMode() {
            this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
        },

        getItemIcon(item) {
            if (item.type === 'folder') {
                const colorClass = this.fileIconClasses.folder[item.color] || 'text-blue-600';
                return `<div class="w-12 h-12 ${colorClass}"><svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg></div>`;
            }
            const colorClass = this.fileIconClasses[item.type] || 'text-gray-600';
            return this.getFileIcon(item.type, colorClass);
        },

        getFileIcon(type, colorClass) {
            const icons = {
                pdf: `<div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
                text: `<div class="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-gray-200"><svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
                archive: `<div class="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center border-2 border-yellow-200"><svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg></div>`,
                ppt: `<div class="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center border-2 border-orange-200"><svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
                image: `<div class="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center border-2 border-purple-200"><svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`,
                csv: `<div class="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center border-2 border-teal-200"><svg class="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
                ai: `<div class="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center border-2 border-pink-200"><svg class="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>`,
                doc: `<div class="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center border-2 border-blue-200"><svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`,
                xls: `<div class="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center border-2 border-green-200"><svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>`
            };
            return icons[type] || icons.text;
        },

        getItemBackgroundClass(item) {
            if (item.type === 'folder') {
                const map = { blue: 'bg-blue-50', green: 'bg-green-50', purple: 'bg-purple-50', yellow: 'bg-yellow-50' };
                return map[item.color] || 'bg-blue-50';
            }
            return 'bg-white';
        },

        getItemBorderClass(item) {
            if (item.type === 'folder') {
                const map = { blue: 'border-blue-200', green: 'border-green-200', purple: 'border-purple-200', yellow: 'border-yellow-200' };
                return map[item.color] || 'border-blue-200';
            }
            return 'border-gray-200';
        },

        getGridItemClasses(item) {
            const base = 'p-4 rounded-lg cursor-pointer transition-all duration-200 relative group shadow-sm hover:shadow';
            const bg = this.getItemBackgroundClass(item);
            const border = this.getItemBorderClass(item);
            const selected = this.selectedItems.has(item.id) ? 'ring-2 ring-slate-900 ring-opacity-20 border-slate-900' : '';
            return `${base} ${bg} border ${border} ${selected}`;
        },

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
            };
            return colors[type] || 'bg-gray-100 text-gray-700';
        },

        getTypeDisplay(type) {
            const map = {
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
            };
            return map[type] || type.toUpperCase();
        },

        getDownloadsBadgeClass(downloads) {
            if (downloads > 500) return 'bg-red-100 text-red-700';
            if (downloads > 200) return 'bg-orange-100 text-orange-700';
            return 'bg-blue-100 text-blue-700';
        },

        formatDownloads(count) {
            return count >= 1000 ? (count / 1000).toFixed(1) + 'k' : count.toString();
        },

        getSizeColor(size) {
            if (size.includes('GB')) return 'text-red-600 font-medium';
            if (size.includes('MB')) return 'text-orange-600 font-medium';
            return 'text-slate-600 font-medium';
        },

        getFolderItemCount(item) {
            return `${item.items} ${item.items === 1 ? 'item' : 'items'}`;
        },

        getFileTypeFromName(filename) {
            const ext = filename.split('.').pop().toLowerCase();
            const map = {
                pdf: 'pdf', doc: 'doc', docx: 'doc', xls: 'xls', xlsx: 'xls',
                ppt: 'ppt', pptx: 'ppt', jpg: 'image', jpeg: 'image', png: 'image',
                gif: 'image', zip: 'archive', rar: 'archive', txt: 'text',
                md: 'text', ai: 'ai', psd: 'image', csv: 'csv'
            };
            return map[ext] || 'text';
        },

        getTotalUploadProgress() {
            if (!this.uploadProgress.length) return 0;
            const sum = this.uploadProgress.reduce((a, b) => a + b, 0);
            return sum / this.uploadProgress.length;
        },

        showNotification(msg, type = 'success') {
            const notif = document.createElement('div');
            notif.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${type === 'error' ? 'bg-red-500' : 'bg-slate-900'} text-white`;
            notif.textContent = msg;
            document.body.appendChild(notif);
            setTimeout(() => {
                notif.style.opacity = '0';
                notif.style.transform = 'translateY(-20px)';
                setTimeout(() => notif.remove(), 300);
            }, 3000);
        }
    },

    async created() {
        await this.initDriveManager();
    },

    mounted() {
        document.addEventListener('dragenter', this.handleDragEnter);
        document.addEventListener('dragleave', this.handleDragLeave);
        document.addEventListener('dragover', this.handleDragOver);
        document.addEventListener('drop', this.handleDrop);
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-drive-item], .selection-toolbar, .action-bar');
            if (!target && this.isSelecting) this.clearSelection();
        });
    },

    beforeDestroy() {
        document.removeEventListener('dragenter', this.handleDragEnter);
        document.removeEventListener('dragleave', this.handleDragLeave);
        document.removeEventListener('dragover', this.handleDragOver);
        document.removeEventListener('drop', this.handleDrop);
        if (this.clickTimer) clearTimeout(this.clickTimer);
    },

    template: `
        <div class="flex flex-col h-full px-4 sm:px-6 lg:px-8 relative">
            <!-- Drag & Drop Overlay (external files only) -->
            <div 
                v-if="isDragOver && !showUploadModal && isExternalDrag"
                class="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6"
                @dragover.prevent
                @dragleave.prevent="handleDragLeave"
                @drop.prevent="handleDrop"
            >
                <div class="border-4 border-dashed border-white/50 rounded-3xl p-12 text-center max-w-lg">
                    <div class="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-white mb-3">Drop files to upload</h3>
                    <p class="text-white/80 text-lg mb-6">Release to upload to Public Drive</p>
                    <div class="text-sm text-white/60">Public • Anyone can view</div>
                </div>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center">
                <div class="text-center">
                    <div class="w-16 h-16 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
                    <div class="text-slate-700 font-medium">Loading Public Drive...</div>
                </div>
            </div>

            <!-- Token Error Banner (if any) -->
            <div v-if="tokenError" class="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg shadow-sm">
                <div class="flex items-start">
                    <div class="text-red-600 mr-3 mt-0.5 flex-shrink-0">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.842 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm text-red-800 font-medium">
                            <span class="font-bold">Configuration Error:</span> {{ tokenErrorMessage }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Header -->
            <div class="mb-8 pt-4 action-bar">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center space-x-3">
                        <button 
                            v-if="currentFolderId"
                            @click="goBack"
                            class="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <div>
                            <div class="flex items-center space-x-2">
                                <button @click="navigateToRoot" class="font-semibold text-slate-600 hover:text-slate-900">Public Drive</button>
                                <span v-if="currentFolderId" class="text-slate-400">/</span>
                                <span class="font-semibold text-slate-900">{{ currentFolderName }}</span>
                                <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">Public</span>
                            </div>
                            <span v-if="selectedCount > 0" class="text-sm text-slate-600 font-medium">
                                {{ selectedCount }} item(s) selected
                            </span>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
                        <div class="relative flex-1 sm:flex-initial sm:w-64">
                            <input v-model="searchQuery" type="text" placeholder="Search public files..."
                                class="pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent w-full shadow-sm" />
                            <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <div class="flex border border-slate-300 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                <button @click="toggleViewMode" :class="viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'" class="p-2.5 transition-colors" title="Grid view">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                                    </svg>
                                </button>
                                <button @click="toggleViewMode" :class="viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'" class="p-2.5 border-l border-slate-300 transition-colors" title="List view">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path>
                                    </svg>
                                </button>
                            </div>

                            <button @click="showNewFolderModal = true"
                                class="px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2 flex-shrink-0"
                                :disabled="tokenError">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                                <span class="hidden sm:inline">New Folder</span>
                            </button>

                            <button @click="startUpload"
                                class="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2 flex-shrink-0"
                                :disabled="tokenError">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                                </svg>
                                <span class="hidden sm:inline">Upload</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Public notice -->
                <div class="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg shadow-sm">
                    <div class="flex items-start">
                        <div class="text-blue-600 mr-3 mt-0.5 flex-shrink-0">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <div>
                            <p class="text-sm text-blue-800 font-medium">
                                <span class="font-bold">Public Drive</span> – Anyone can view, download, upload, and manage files. 
                                All content is publicly accessible. No login required.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Selection Toolbar -->
            <div v-if="isSelecting"
                class="mb-6 p-4 bg-white border border-slate-300 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 shadow-sm selection-toolbar">
                <div class="flex items-center space-x-4">
                    <span class="text-sm font-semibold text-slate-900">{{ selectedCount }} item(s) selected</span>
                    <button @click="clearSelection" class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Clear</button>
                </div>
                <div class="flex items-center space-x-3">
                    <button @click="showMoveModal = true" class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Move to</button>
                    <button @click="downloadFiles(Array.from(selectedItems))" class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Download</button>
                    <button class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">Share</button>
                    <button @click="deleteSelectedItems" class="text-sm text-red-600 hover:text-red-800 hover:underline font-medium">Delete</button>
                </div>
            </div>

            <!-- Main Content -->
            <div class="flex-1">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <h2 class="text-lg font-bold text-slate-900">{{ currentFolder ? currentFolder.name + ' Contents' : 'All Public Files' }}</h2>
                    <div class="flex items-center space-x-4">
                        <button @click="selectAll" class="text-sm text-slate-600 hover:text-slate-900 hover:underline font-medium">
                            {{ selectedItems.size === filteredItems.length ? 'Deselect all' : 'Select all' }}
                        </button>
                        <span class="text-sm text-slate-500 font-medium">{{ filteredItems.length }} items</span>
                    </div>
                </div>

                <!-- Grid View -->
                <div v-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
                    <div v-for="item in filteredItems.filter(i => i.type === 'folder')" :key="item.id" data-drive-item
                        @click="handleItemClick(item, $event)" @dragover.prevent="handleDragOver" @drop.prevent="handleFolderDrop(item, $event)"
                        :class="getGridItemClasses(item)" draggable="true" @dragstart="handleDragStart(item, $event)">
                        <button @click.stop="downloadFiles([item.id])" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10">
                            <div class="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm hover:shadow">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                            </div>
                        </button>
                        <div class="flex justify-center pt-2" v-html="getItemIcon(item)"></div>
                        <div class="mt-4">
                            <div class="flex items-start justify-between mb-2">
                                <div class="font-semibold text-slate-900 truncate flex-1 mr-2">{{ item.name }}</div>
                                <div class="text-xs font-semibold px-2 py-1 rounded-full" :class="getTypeBadgeColor(item.type)">{{ getTypeDisplay(item.type) }}</div>
                            </div>
                            <div class="flex items-center justify-between text-sm mt-3">
                                <div class="text-slate-600">{{ getFolderItemCount(item) }}</div>
                                <div class="text-xs text-slate-400">{{ item.date }}</div>
                            </div>
                            <div class="mt-3">
                                <span class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1 w-fit" :class="getDownloadsBadgeClass(item.downloads)">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    <span>{{ formatDownloads(item.downloads) }} downloads</span>
                                </span>
                            </div>
                        </div>
                        <div v-if="selectedItems.has(item.id)" class="absolute top-3 left-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center">
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <div class="absolute inset-0 border-2 border-dashed border-blue-500 rounded-lg opacity-0 group-hover:opacity-30 pointer-events-none"></div>
                    </div>

                    <div v-for="item in filteredItems.filter(i => i.type !== 'folder')" :key="item.id" data-drive-item
                        @click="handleItemClick(item, $event)" :class="getGridItemClasses(item)" draggable="true" @dragstart="handleDragStart(item, $event)">
                        <button @click.stop="downloadFiles([item.id])" class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 z-10">
                            <div class="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-sm hover:shadow">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                </svg>
                            </div>
                        </button>
                        <div class="flex justify-center pt-2" v-html="getItemIcon(item)"></div>
                        <div class="mt-4">
                            <div class="flex items-start justify-between mb-2">
                                <div class="font-semibold text-slate-900 truncate flex-1 mr-2">{{ item.name }}</div>
                                <div class="text-xs font-semibold px-2 py-1 rounded-full" :class="getTypeBadgeColor(item.type)">{{ getTypeDisplay(item.type) }}</div>
                            </div>
                            <div class="flex items-center justify-between text-sm mt-3">
                                <div :class="getSizeColor(item.size)">{{ item.size }}</div>
                                <div class="text-xs text-slate-400">{{ item.date }}</div>
                            </div>
                            <div class="mt-3">
                                <span class="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-1 w-fit" :class="getDownloadsBadgeClass(item.downloads)">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                    </svg>
                                    <span>{{ formatDownloads(item.downloads) }}</span>
                                </span>
                            </div>
                        </div>
                        <div v-if="selectedItems.has(item.id)" class="absolute top-3 left-3 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center">
                            <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- List View -->
                <div v-else class="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm"
                    @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-full">
                            <thead class="bg-slate-50 border-b border-slate-300">
                                <tr>
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
                                <tr v-for="item in filteredItems" :key="item.id" data-drive-item
                                    @click="handleItemClick(item, $event)"
                                    :class="[{ 'bg-slate-50': selectedItems.has(item.id) }, item.type === 'folder' ? getItemBackgroundClass(item) : 'bg-white']"
                                    draggable="true" @dragstart="handleDragStart(item, $event)"
                                    @dragover.prevent="item.type === 'folder' && handleDragOver($event)"
                                    @drop.prevent="item.type === 'folder' && handleFolderDrop(item, $event)">
                                    <td class="py-4 px-4 sm:px-6">
                                        <div class="relative">
                                            <div v-html="getItemIcon(item)" class="flex-shrink-0"></div>
                                            <div v-if="selectedItems.has(item.id)" class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-white shadow-sm flex items-center justify-center">
                                                <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="py-4 px-4 sm:px-6">
                                        <div class="font-semibold text-slate-900">{{ item.name }}</div>
                                        <div class="text-xs text-slate-500">{{ item.type === 'folder' ? getFolderItemCount(item) : item.size }}</div>
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
                                    <td class="py-4 px-4 sm:px-6 text-sm text-slate-700">{{ item.date }}</td>
                                    <td class="py-4 px-4 sm:px-6">
                                        <button @click.stop="downloadFiles([item.id])"
                                            class="px-3 py-1.5 text-sm bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow flex items-center space-x-1">
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
                <div v-if="filteredItems.length === 0" class="text-center py-16 border border-slate-300 rounded-lg bg-white shadow-sm"
                    @dragenter.prevent="handleDragEnter" @dragover.prevent="handleDragOver" @drop.prevent="handleDrop">
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
                        <button @click="showNewFolderModal = true"
                            class="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2"
                            :disabled="tokenError">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <span>New Folder</span>
                        </button>
                        <button @click="startUpload"
                            class="px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all shadow-sm hover:shadow flex items-center space-x-2"
                            :disabled="tokenError">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                            <span>Upload Files</span>
                        </button>
                    </div>
                    <p class="text-sm text-slate-500 mt-4">or drag files anywhere on this page</p>
                </div>
            </div>

            <!-- Move Modal -->
            <div v-if="showMoveModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                @click.self="showMoveModal = false">
                <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-slate-900">Move {{ selectedCount }} item(s) to</h3>
                        <button @click="showMoveModal = false" class="p-2 rounded-lg hover:bg-slate-100">
                            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="mb-6 max-h-64 overflow-y-auto space-y-2">
                        <div @click="moveSelectedItems(null)" class="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center space-x-3">
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
                        <div v-for="folder in folders.filter(f => !selectedItems.has(f.id))" :key="folder.id"
                            @click="moveSelectedItems(folder.id)" class="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center space-x-3">
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
                    <div class="flex justify-end">
                        <button @click="showMoveModal = false" class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- New Folder Modal -->
            <div v-if="showNewFolderModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                @click.self="showNewFolderModal = false">
                <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-slate-900">Create New Folder</h3>
                        <button @click="showNewFolderModal = false" class="p-2 rounded-lg hover:bg-slate-100">
                            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-slate-700 mb-2">Folder Name</label>
                        <input v-model="newFolderName" type="text" placeholder="Enter folder name"
                            class="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent shadow-sm"
                            @keyup.enter="createNewFolder" autofocus />
                        <p class="text-xs text-slate-500 mt-2">This folder will be created in {{ currentFolder ? currentFolder.name : 'Public Drive' }}</p>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button @click="showNewFolderModal = false" class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                        <button @click="createNewFolder" :disabled="!newFolderName.trim()" class="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed">Create Folder</button>
                    </div>
                </div>
            </div>

            <!-- Upload Modal -->
            <div v-if="showUploadModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                @click.self="closeUploadModal">
                <div class="bg-white border border-slate-300 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-xl font-bold text-slate-900">{{ isUploading ? 'Uploading ' + uploadedFiles.length + ' files' : 'Upload Complete' }}</h3>
                        <button @click="closeUploadModal" class="p-2 rounded-lg hover:bg-slate-100">
                            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
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
                    <div class="mb-8">
                        <div class="flex justify-between items-center mb-3">
                            <span :class="isUploading ? 'text-slate-700 font-medium' : 'text-green-600 font-semibold'">
                                {{ isUploading ? 'Uploading... (' + uploadedFiles.length + ' files)' : 'Complete!' }}
                            </span>
                            <span class="text-slate-700 font-semibold">{{ Math.round(getTotalUploadProgress()) }}%</span>
                        </div>
                        <div class="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div class="h-full bg-slate-900 transition-all duration-300 ease-out"
                                :style="{ width: getTotalUploadProgress() + '%' }"
                                :class="isUploading ? '' : 'bg-green-600'"></div>
                        </div>
                    </div>
                    <div class="mb-8 max-h-64 overflow-y-auto">
                        <div v-for="(file, index) in uploadedFiles" :key="index" class="p-3 bg-slate-50 border border-slate-300 rounded-lg mb-2 last:mb-0">
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
                    <div class="flex justify-end space-x-3">
                        <button v-if="isUploading" @click="closeUploadModal" class="px-5 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">Cancel All</button>
                        <button v-else @click="closeUploadModal" class="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-sm hover:shadow">Done</button>
                    </div>
                </div>
            </div>

            <!-- Footer spacer -->
            <div class="mt-8 pt-6 border-t border-slate-300"></div>
        </div>
    `
};