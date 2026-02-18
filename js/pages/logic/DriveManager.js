// js/logic/DriveManager.js
import { 
    auth, db,
    collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
    query, where, serverTimestamp, writeBatch 
} from '../../../firebaseConfig.js';

// Library encoding – diambil dari global (window)
const pako = window.pako;
const base32 = window.base32;
const base85 = window.base85;
const base91 = window.base91;

export default class DriveManager {
    constructor() {
        this.user = null;
        this.githubToken = null;
        this.repos = [];
        this.repoCategories = {};
        this.db = db;
        this.auth = auth;
        this.initialized = false;
        this.initPromise = this._init();
        this.maxConcurrentUploads = 5; // batasi konkurensi upload
    }

    // ----------------------------------------------------------------------
    // Initialisation
    // ----------------------------------------------------------------------
    async _init() {
        return new Promise((resolve) => {
            this.auth.onAuthStateChanged(async (user) => {
                if (user) {
                    this.user = user;
                    await this._loadUserData();
                    this.initialized = true;
                    resolve();
                } else {
                    window.location.href = '/';
                }
            });
        });
    }

    async _loadUserData() {
        const tokenDoc = await getDoc(doc(this.db, 'users', this.user.uid, 'settings', 'github'));
        if (tokenDoc.exists()) {
            this.githubToken = tokenDoc.data().token;
        } else {
            console.warn('No GitHub token found – uploads will fail');
            this.githubToken = null;
        }

        this.repos = [
            'Cloudflare', 'Linode', 'DigitalOcean', 'Heroku', 'Netlify', 'Vercel',
            'Traefik', 'Caddy', 'Envoy', 'Istio', 'OpenTelemetry', 'Jaeger', 'Loki',
            'Sentry', 'Datadog', 'Nagios', 'Zabbix', 'Grafana', 'Prometheus',
            'ChromaDB', 'Pinecone', 'Milvus', 'ArangoDB', 'TimescaleDB', 'CouchDB',
            'Realm', 'MyBatis', 'Hibernate', 'Drizzle', 'TypeORM', 'Sequelize',
            'Prisma', 'Appwrite', 'Hasura', 'Firebase', 'Supabase', 'KeystoneJS',
            'Strapi', 'Ktor', 'Vapor', 'Rocket', 'Actix', 'Ember.js', 'Backbone.js',
            'Alpine.js', 'Astro', 'Remix', 'Blazor', 'WebAssembly', 'PowerBuilder',
            'Smalltalk', 'Haxe', 'Crystal', 'Protobuf', 'JSON', 'GraphQL', 'gRPC',
            'MQTT', 'WebSocket', 'RabbitMQ', 'Kafka', 'Elasticsearch', 'Neo4j',
            'Cassandra', 'Redis', 'MongoDB', 'SQLite', 'MySQL', 'PostgreSQL',
            'HashiCorp', 'Travis', 'CircleCI', 'Jenkins', 'Terraform', 'Ansible',
            'Kubernetes', 'WebGL', 'Three.js', 'D3.js', 'Plotly', 'Seaborn',
            'Matplotlib', 'NumPy', 'Pandas', 'LightGBM', 'CatBoost', 'XGBoost',
            'Keras', 'PyTorch', 'TensorFlow', 'Micronaut', 'Quarkus', 'FastAPI',
            'Django', 'Symfony', 'NestJS', 'Svelte', 'Angular', 'React', 'Elm',
            'Clojure', 'Lisp', 'Prolog', 'VDHL', 'Verilog', 'Solidity', 'Groovy',
            'Shell', 'COBOL', 'Fortran', 'Julia', 'MATLAB', 'Erlang', 'Elixir',
            'Haskell', 'Lua', 'Perl', 'Scala', 'Objective-C', 'Swift', 'Kotlin',
            'TypeScript', 'Flutter', 'Prabogo', 'Git', 'Hash', 'Crypto', 'Docker',
            'Encryption', 'Chunking', 'OpenCV', 'Android', 'SVM', 'Fuzzy', 'Linux',
            'RandomForest', 'CNN', 'Rust', 'Golang', 'Ruby', 'Bash', 'Dart', 'PHP',
            'Javascript', 'Css', 'ASM', 'Next', 'Vue', 'Python', 'Java'
        ];

        this._buildRepoCategories();
    }

    _buildRepoCategories() {
        const categories = {
            devops: ['cloudflare', 'linode', 'digitalocean', 'heroku', 'netlify', 'vercel',
                     'traefik', 'caddy', 'envoy', 'istio', 'hashicorp', 'travis', 'circleci',
                     'jenkins', 'terraform', 'ansible', 'kubernetes', 'docker'],
            monitoring: ['opentelemetry', 'jaeger', 'loki', 'sentry', 'datadog', 'nagios',
                         'zabbix', 'grafana', 'prometheus'],
            database: ['chromadb', 'pinecone', 'milvus', 'arangodb', 'timescaledb', 'couchdb',
                       'realm', 'mybatis', 'hibernate', 'drizzle', 'typeorm', 'sequelize',
                       'prisma', 'elasticsearch', 'neo4j', 'cassandra', 'redis', 'mongodb',
                       'sqlite', 'mysql', 'postgresql'],
            backend: ['appwrite', 'hasura', 'firebase', 'supabase', 'keystonejs', 'strapi',
                      'ktor', 'vapor', 'rocket', 'actix', 'micronaut', 'quarkus', 'fastapi',
                      'django', 'symfony', 'nestjs'],
            web: ['ember.js', 'backbone.js', 'alpine.js', 'astro', 'remix', 'blazor',
                  'webassembly', 'three.js', 'd3.js', 'plotly', 'seaborn', 'matplotlib',
                  'numpy', 'pandas', 'svelte', 'angular', 'react', 'vue', 'next', 'javascript',
                  'css'],
            ml: ['lightgbm', 'catboost', 'xgboost', 'keras', 'pytorch', 'tensorflow',
                 'opencv', 'svm', 'randomforest', 'cnn'],
            language: ['powerbuilder', 'smalltalk', 'haxe', 'crystal', 'protobuf', 'json',
                       'graphql', 'grpc', 'mqtt', 'websocket', 'rabbitmq', 'kafka',
                       'elm', 'clojure', 'lisp', 'prolog', 'vdhl', 'verilog', 'solidity',
                       'groovy', 'shell', 'cobol', 'fortran', 'julia', 'matlab', 'erlang',
                       'elixir', 'haskell', 'lua', 'perl', 'scala', 'objective-c', 'swift',
                       'kotlin', 'typescript', 'flutter', 'git', 'hash', 'crypto',
                       'encryption', 'chunking', 'android', 'fuzzy', 'linux', 'rust',
                       'golang', 'ruby', 'bash', 'dart', 'php', 'asm', 'python', 'java']
        };

        for (const [cat, keywords] of Object.entries(categories)) {
            for (const kw of keywords) {
                for (const repo of this.repos) {
                    if (repo.toLowerCase().includes(kw)) {
                        this.repoCategories[repo] = cat;
                    }
                }
            }
        }
        const defaultCat = ['web', 'devops', 'monitoring', 'database', 'backend', 'ml', 'language'];
        for (const repo of this.repos) {
            if (!this.repoCategories[repo]) {
                this.repoCategories[repo] = defaultCat[Math.floor(Math.random() * defaultCat.length)];
            }
        }
    }

    // ----------------------------------------------------------------------
    // Folder / file metadata operations (Firestore)
    // ----------------------------------------------------------------------
    async getFolderContents(folderId, includeTrash = false) {
        await this.initPromise;
        const itemsRef = collection(this.db, 'users', this.user.uid, 'items');
        let q;
        if (folderId === 'root') {
            q = query(itemsRef, where('parentId', '==', null));
        } else {
            q = query(itemsRef, where('parentId', '==', folderId));
        }
        if (!includeTrash) {
            q = query(q, where('trashed', '==', false));
        }
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
        if (folderId === 'root') {
            return { id: 'root', name: 'Drive', type: 'folder' };
        }
        const docRef = doc(this.db, 'users', this.user.uid, 'items', folderId);
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
            parentId: parentId === 'root' ? null : parentId,
            createdAt: serverTimestamp(),
            modifiedAt: serverTimestamp(),
            trashed: false,
            starred: false,
            color: metadata.color || 'blue',
            items: 0
        };
        const docRef = await addDoc(collection(this.db, 'users', this.user.uid, 'items'), folderData);
        return { success: true, folder: { id: docRef.id, ...folderData } };
    }

    async getFileInfo(fileId) {
        await this.initPromise;
        const docRef = doc(this.db, 'users', this.user.uid, 'items', fileId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data.createdAt) data.createdAt = data.createdAt.toDate().toISOString();
            if (data.modifiedAt) data.modifiedAt = data.modifiedAt.toDate().toISOString();
            return data;
        }
        return null;
    }

    // ----------------------------------------------------------------------
    // Upload logic (diperbaiki)
    // ----------------------------------------------------------------------
    async uploadFiles(files, targetFolderId) {
        await this.initPromise;
        if (!this.githubToken) {
            throw new Error('GitHub token missing – please set it in Profile');
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
        const key = await crypto.subtle.generateKey(
            { name: 'AES-GCM', length: 256 },
            true,
            ['encrypt', 'decrypt']
        );
        const rawKey = await crypto.subtle.exportKey('raw', key);
        const keyBase64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

        const buffer = await file.arrayBuffer();
        const fileData = new Uint8Array(buffer);
        const totalSize = fileData.length;

        const CHUNK_SIZE = 750 * 1024;
        const numChunks = Math.ceil(totalSize / CHUNK_SIZE);
        const chunks = [];

        const uploadPromises = [];
        for (let i = 0; i < numChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const chunkData = fileData.slice(start, end);

            const promise = this._processAndUploadChunk(chunkData, i, key)
                .then(chunkInfo => {
                    chunks[i] = chunkInfo;
                });
            uploadPromises.push(promise);
        }

        await this._runWithConcurrency(uploadPromises, this.maxConcurrentUploads);

        if (chunks.length !== numChunks || chunks.some(c => !c)) {
            throw new Error('Some chunks failed to upload');
        }

        const fileDoc = {
            type: 'file',
            name: file.name,
            parentId: targetFolderId === 'root' ? null : targetFolderId,
            size: totalSize,
            mimeType: file.type || 'application/octet-stream',
            createdAt: serverTimestamp(),
            modifiedAt: serverTimestamp(),
            trashed: false,
            starred: false,
            tags: this._getTagsFromMime(file.type),
            chunks: chunks,
            key: keyBase64
        };
        const docRef = await addDoc(collection(this.db, 'users', this.user.uid, 'items'), fileDoc);

        return { id: docRef.id, name: file.name, size: totalSize };
    }

    async _processAndUploadChunk(chunkData, index, cryptoKey) {
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

        const repoName = this._selectRepo();
        const category = this.repoCategories[repoName] || 'web';
        const template = this._getTemplate(category);
        let path = this._generatePath(category, index);

        const content = template.replace('{encoded_data}', doubleEncoded);
        const success = await this._uploadToGithubWithRetry(repoName, path, content, index);
        if (!success) {
            throw new Error(`Failed to upload chunk ${index} to ${repoName}`);
        }

        const hashBuffer = await crypto.subtle.digest('SHA-256', chunkData);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return {
            repo: repoName,
            path: path,
            index: index,
            hash: hashHex,
            iv: btoa(String.fromCharCode(...iv)),
            tag: btoa(String.fromCharCode(...tag)),
            encoding: encoding,
            size: chunkData.length
        };
    }

    async _uploadToGithubWithRetry(repo, basePath, content, chunkIndex, maxRetries = 5) {
        let attempt = 0;
        let currentPath = basePath;

        while (attempt < maxRetries) {
            try {
                const result = await this._githubCreateFile(repo, currentPath, content, `Add chunk ${chunkIndex}`);
                if (result === true) return true;

                const category = this.repoCategories[repo] || 'web';
                currentPath = this._generatePath(category, chunkIndex + attempt * 1000 + Math.floor(Math.random() * 1000));
                attempt++;
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
            } catch (error) {
                if (error.message.includes('403') || error.message.includes('rate limit')) {
                    const wait = 60 * 1000 * Math.pow(2, attempt);
                    console.warn(`Rate limit, waiting ${wait}ms before retry`);
                    await new Promise(resolve => setTimeout(resolve, wait));
                } else if (error.message.includes('5') || error.message.includes('502') || error.message.includes('503')) {
                    await new Promise(resolve => setTimeout(resolve, 5000 * Math.pow(2, attempt)));
                } else {
                    throw error;
                }
                attempt++;
            }
        }
        return false;
    }

async _githubCreateFile(repo, path, content, message) {
    const url = `https://api.github.com/repos/696963/${repo}/contents/${path}`;
    const contentBase64 = btoa(unescape(encodeURIComponent(content))); // UTF‑8 safe base64
    const body = { message, content: contentBase64 };
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const error = await response.json();
        // 422 (Unprocessable Entity) atau 409 (Conflict) berarti file sudah ada
        if (response.status === 422 || response.status === 409) {
            return false; // konflik → perlu retry dengan path baru
        }
        throw new Error(`GitHub API error (${repo}): ${error.message} (status ${response.status})`);
    }
    return true;
}

    async _runWithConcurrency(promises, limit) {
        const results = [];
        const executing = new Set();
        for (const promise of promises) {
            const p = promise.then(result => {
                executing.delete(p);
                return result;
            });
            results.push(p);
            executing.add(p);
            if (executing.size >= limit) {
                await Promise.race(executing);
            }
        }
        return Promise.all(results);
    }

    // ----------------------------------------------------------------------
    // Download logic (diperbaiki)
    // ----------------------------------------------------------------------
    async downloadFiles(fileIds) {
        await this.initPromise;
        const results = [];
        for (const fileId of fileIds) {
            const fileData = await this._downloadSingleFile(fileId);
            if (fileData) {
                results.push(fileData);
                this._triggerDownload(fileData);
            }
        }
        return { success: true, files: results };
    }

    async _downloadSingleFile(fileId) {
        const fileInfo = await this.getFileInfo(fileId);
        if (!fileInfo) return null;

        const key = await this._importKey(fileInfo.key);
        const chunks = fileInfo.chunks.sort((a, b) => a.index - b.index);
        const pieces = [];

        for (const chunk of chunks) {
            const chunkData = await this._downloadChunk(chunk, key);
            pieces.push(chunkData);
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

    async _downloadChunk(chunk, key) {
        const url = `https://raw.githubusercontent.com/696963/${chunk.repo}/main/${chunk.path}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch chunk from GitHub: ${response.status}`);
        }
        const text = await response.text();

        const doubleEncoded = this._extractDoubleEncoded(text);
        if (!doubleEncoded) {
            throw new Error('No encoded data found in the GitHub file');
        }

        const encoded = atob(doubleEncoded);
        const ciphertext = this._decodeData(encoded, chunk.encoding);

        const iv = Uint8Array.from(atob(chunk.iv), c => c.charCodeAt(0));
        const tag = Uint8Array.from(atob(chunk.tag), c => c.charCodeAt(0));

        const encrypted = new Uint8Array([...ciphertext, ...tag]);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        const decompressed = pako.inflate(new Uint8Array(decrypted));

        const hashBuffer = await crypto.subtle.digest('SHA-256', decompressed);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex !== chunk.hash) {
            console.warn(`Hash mismatch for chunk ${chunk.path}`);
        }

        return decompressed;
    }

    _extractDoubleEncoded(text) {
        const doubleQuoted = text.match(/"((?:[^"\\]|\\.)*)"/g) || [];
        const singleQuoted = text.match(/'((?:[^'\\]|\\.)*)'/g) || [];
        const allQuoted = doubleQuoted.concat(singleQuoted);

        if (allQuoted.length > 0) {
            const longest = allQuoted.reduce((a, b) => a.length > b.length ? a : b, '');
            return longest.slice(1, -1);
        }

        const base64Matches = text.match(/[A-Za-z0-9+/=]{50,}/g);
        if (base64Matches && base64Matches.length > 0) {
            return base64Matches.reduce((a, b) => a.length > b.length ? a : b, '');
        }

        return null;
    }

    async _importKey(keyBase64) {
        const rawKey = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
        return await crypto.subtle.importKey(
            'raw',
            rawKey,
            { name: 'AES-GCM' },
            false,
            ['decrypt']
        );
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

    // ----------------------------------------------------------------------
    // Encoding utilities (tetap sama, hanya fallback)
    // ----------------------------------------------------------------------
    _randomEncoding() {
        const available = ['base64'];
        if (typeof base32 !== 'undefined' && base32.Encoder) available.push('base32');
        if (typeof base85 !== 'undefined' && base85.encode) available.push('base85');
        if (typeof base91 !== 'undefined' && base91.encode) available.push('base91');
        return available[Math.floor(Math.random() * available.length)];
    }

_encodeData(data, encoding) {
    const uint8 = new Uint8Array(data);

    // Helper aman: konversi Uint8Array ke binary string tanpa spread
    const toBinaryString = (arr) => {
        let binary = '';
        for (let i = 0; i < arr.length; i++) {
            binary += String.fromCharCode(arr[i]);
        }
        return binary;
    };

    if (encoding === 'base64') {
        return btoa(toBinaryString(uint8));
    }

    if (encoding === 'base32') {
        if (typeof base32 !== 'undefined' && base32.Encoder) {
            try {
                const encoder = new base32.Encoder();
                return encoder.write(uint8).finalize();
            } catch (e) {
                console.warn('base32 encoding failed, falling back to base64', e);
            }
        } else {
            console.warn('base32 library not available, falling back to base64');
        }
        return btoa(toBinaryString(uint8));
    }

    if (encoding === 'base85') {
        if (typeof base85 !== 'undefined' && base85.encode) {
            try {
                return base85.encode(uint8);
            } catch (e) {
                console.warn('base85 encoding failed, falling back to base64', e);
            }
        } else {
            console.warn('base85 library not available, falling back to base64');
        }
        return btoa(toBinaryString(uint8));
    }

    if (encoding === 'base91') {
        if (typeof base91 !== 'undefined' && base91.encode) {
            try {
                return base91.encode(uint8);
            } catch (e) {
                console.warn('base91 encoding failed, falling back to base64', e);
            }
        } else {
            console.warn('base91 library not available, falling back to base64');
        }
        return btoa(toBinaryString(uint8));
    }

    return btoa(toBinaryString(uint8));
}

    _decodeData(encodedStr, encoding) {
        if (encoding === 'base64') {
            const binary = atob(encodedStr);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
            return bytes;
        }
        if (encoding === 'base32' && typeof base32 !== 'undefined' && base32.Decoder) {
            try {
                const decoder = new base32.Decoder();
                return decoder.write(encodedStr).finalize();
            } catch (e) {
                console.warn('base32 decoding failed, trying base64 fallback', e);
            }
        }
        if (encoding === 'base85' && typeof base85 !== 'undefined' && base85.decode) {
            try {
                return base85.decode(encodedStr);
            } catch (e) {
                console.warn('base85 decoding failed, trying base64 fallback', e);
            }
        }
        if (encoding === 'base91' && typeof base91 !== 'undefined' && base91.decode) {
            try {
                return base91.decode(encodedStr);
            } catch (e) {
                console.warn('base91 decoding failed, trying base64 fallback', e);
            }
        }
        const binary = atob(encodedStr);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }

    _selectRepo() {
        return this.repos[Math.floor(Math.random() * this.repos.length)];
    }

    _getTemplate(category) {
        const templates = {
            web: [
                '// config.js\nconst API_KEY = "{encoded_data}";\nexport default API_KEY;',
                '// utils/helpers.js\nexport const secret = "{encoded_data}";',
                '// settings.json\n{\n  "token": "{encoded_data}"\n}',
                '// .env\nSECRET="{encoded_data}"\n',
                '// src/index.js\n// {encoded_data}\n',
            ],
            devops: [
                '# terraform.tfvars\nsecret = "{encoded_data}"\n',
                '# k8s-secret.yaml\napiVersion: v1\nkind: Secret\nmetadata:\n  name: app-secret\ndata:\n  token: {encoded_data}\n',
                '# Dockerfile\nENV SECRET="{encoded_data}"\n',
                '# ansible/vars.yml\nsecret: "{encoded_data}"\n',
            ],
            monitoring: [
                '# prometheus.yml\nscrape_configs:\n  - job_name: "app"\n    params:\n      token: ["{encoded_data}"]\n',
                '# grafana.ini\n[security]\nsecret_key = "{encoded_data}"\n',
                '# loki/config.yaml\nauth_token: "{encoded_data}"\n',
            ],
            database: [
                '// config/database.js\nconst DB_PASS = "{encoded_data}";\n',
                '-- init.sql\n-- {encoded_data}\n',
                '// prisma/schema.prisma\n// {encoded_data}\n',
                '# seeds/seed.sql\n-- {encoded_data}\n',
            ],
            backend: [
                '# app/config.py\nSECRET_KEY = "{encoded_data}"\n',
                '// src/main/resources/application.properties\napi.secret={encoded_data}\n',
                '# app/config/config.exs\nconfig :app, secret: "{encoded_data}"\n',
            ],
            ml: [
                '# model_config.py\nMODEL_WEIGHTS = "{encoded_data}"\n',
                '# data/weights.txt\n{encoded_data}\n',
                '# notebook.ipynb\n# {encoded_data}\n',
            ],
            language: [
                '// src/main.rs\nfn main() {\n    let secret = "{encoded_data}";\n}\n',
                '// index.js\nconst token = "{encoded_data}";\n',
                '# lib/secret.ex\n@secret "{encoded_data}"\n',
                '// hello.go\nvar secret = "{encoded_data}"\n',
            ],
        };
        const list = templates[category] || templates.web;
        return list[Math.floor(Math.random() * list.length)];
    }

    _generatePath(category, index) {
        const folders = {
            web: ['src', 'utils', 'config', 'lib', 'public', 'components', 'pages', 'hooks'],
            devops: ['terraform', 'kubernetes', 'scripts', 'config', 'ansible', 'docker'],
            monitoring: ['prometheus', 'grafana', 'config', 'loki', 'alertmanager'],
            database: ['migrations', 'seeds', 'config', 'prisma', 'models', 'queries'],
            backend: ['app', 'config', 'routes', 'controllers', 'services', 'api'],
            ml: ['models', 'data', 'notebooks', 'utils', 'weights', 'configs'],
            language: ['src', 'lib', 'examples', 'tests', 'bin'],
        };
        const folder = (folders[category] || ['src'])[Math.floor(Math.random() * (folders[category] || ['src']).length)];
        const ext = this._getExtension(category);
        const name = `file_${Math.random().toString(36).substring(2, 8)}_${index}.${ext}`;
        return `${folder}/${name}`;
    }

    _getExtension(category) {
        const exts = {
            web: ['js', 'ts', 'json', 'html', 'css', 'env'],
            devops: ['tf', 'yaml', 'sh', 'Dockerfile', 'yml'],
            monitoring: ['yml', 'ini', 'conf', 'json'],
            database: ['sql', 'js', 'json', 'prisma'],
            backend: ['py', 'java', 'properties', 'kt', 'exs'],
            ml: ['py', 'ipynb', 'txt', 'h5'],
            language: ['rs', 'go', 'ex', 'js', 'rb', 'php', 'java', 'c', 'cpp'],
        };
        const list = exts[category] || ['txt'];
        return list[Math.floor(Math.random() * list.length)];
    }

    // ----------------------------------------------------------------------
    // Other operations (move, delete, star, stats)
    // ----------------------------------------------------------------------
    async deleteItems(itemIds, moveToTrash = true) {
        await this.initPromise;
        const batch = writeBatch(this.db);
        for (const id of itemIds) {
            const ref = doc(this.db, 'users', this.user.uid, 'items', id);
            if (moveToTrash) {
                batch.update(ref, { trashed: true, modifiedAt: serverTimestamp() });
            } else {
                batch.delete(ref);
            }
        }
        await batch.commit();
        return { success: true, deleted: itemIds.length };
    }

    async moveItems(itemIds, targetFolderId) {
        await this.initPromise;
        const batch = writeBatch(this.db);
        for (const id of itemIds) {
            const ref = doc(this.db, 'users', this.user.uid, 'items', id);
            batch.update(ref, {
                parentId: targetFolderId === 'root' ? null : targetFolderId,
                modifiedAt: serverTimestamp()
            });
        }
        await batch.commit();
        return { success: true, movedItems: itemIds.length };
    }

    async toggleStar(fileId) {
        await this.initPromise;
        const ref = doc(this.db, 'users', this.user.uid, 'items', fileId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const starred = !snap.data().starred;
            await updateDoc(ref, { starred });
        }
    }

    getStats() {
        return {
            totalSize: 12345678,
            virtualPool: {
                totalSpace: 150 * 1024 * 1024 * 1024,
                usagePercentage: 10
            },
            formatted: {
                usedSpace: '12.3 MB',
                totalSpace: '150 GB'
            }
        };
    }

    getAccountStats() {
        const accounts = this.repos.map(name => ({
            name,
            usedSpace: Math.random() * 0.5 * 1024 * 1024 * 1024,
            totalSpace: 1 * 1024 * 1024 * 1024,
            fileCount: Math.floor(Math.random() * 50),
            usagePercentage: Math.random() * 50
        }));
        return { accounts };
    }

    optimizeStorage() {
        return { success: true, movedFiles: 0 };
    }

    saveToLocalStorage() {}

    _getTagsFromMime(mime) {
        if (!mime) return ['binary'];
        if (mime.startsWith('image/')) return ['image'];
        if (mime.startsWith('text/')) return ['text'];
        if (mime === 'application/pdf') return ['pdf'];
        return ['binary'];
    }
}