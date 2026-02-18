#!/usr/bin/env python3
"""
GitHub Repository Populator – Ultra Realistic Edition
Mengisi 150 repository dengan file-file proyek yang sangat meyakinkan.
Jalankan SEKALI untuk membuat semua repo terlihat seperti proyek sungguhan.
Script ini sudah dikonfigurasi khusus untuk organisasi 696963 dengan token yang diberikan.
Tidak perlu mengubah apapun, langsung run.
"""

import os
import sys
import time
import random
import base64
import json
import string
import hashlib
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ==================== KONFIGURASI TETAP ====================
# Token GitHub (sudah disediakan)
GITHUB_TOKEN = "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"
ORG_NAME = "696963"  # Nama organisasi
OWNER_EMAIL = "releaseonegit@gmail.com"  # Email owner untuk default committer

# Daftar 150 repository (sudah sesuai)
REPO_NAMES = [
    "TensorFlow", "Micronaut", "Quarkus", "FastAPI",
    "Django", "Symfony", "NestJS", "Svelte", "Angular", "React", "Elm",
    "Clojure", "Lisp", "Prolog", "VDHL", "Verilog", "Solidity", "Groovy",
    "Shell", "COBOL", "Fortran", "Julia", "MATLAB", "Erlang", "Elixir",
    "Haskell", "Lua", "Perl", "Scala", "Objective-C", "Swift", "Kotlin",
    "TypeScript", "Flutter", "Prabogo", "Git", "Hash", "Crypto", "Docker",
    "Encryption", "Chunking", "OpenCV", "Android", "SVM", "Fuzzy", "Linux",
    "RandomForest", "CNN", "Rust", "Golang", "Ruby", "Bash", "Dart", "PHP",
    "Javascript", "Css", "ASM", "Next", "Vue", "Python", "Java"
]

# ==================== KATEGORISASI REPO ====================
def categorize_repo(name: str) -> str:
    """Tentukan kategori repository berdasarkan nama."""
    name_lower = name.lower()
    # Mapping keyword -> kategori (diperluas)
    categories = {
        "devops": ["cloudflare", "linode", "digitalocean", "heroku", "netlify", "vercel",
                   "traefik", "caddy", "envoy", "istio", "hashicorp", "travis", "circleci",
                   "jenkins", "terraform", "ansible", "kubernetes", "docker"],
        "monitoring": ["opentelemetry", "jaeger", "loki", "sentry", "datadog", "nagios",
                       "zabbix", "grafana", "prometheus"],
        "database": ["chromadb", "pinecone", "milvus", "arangodb", "timescaledb", "couchdb",
                     "realm", "mybatis", "hibernate", "drizzle", "typeorm", "sequelize",
                     "prisma", "elasticsearch", "neo4j", "cassandra", "redis", "mongodb",
                     "sqlite", "mysql", "postgresql"],
        "backend": ["appwrite", "hasura", "firebase", "supabase", "keystonejs", "strapi",
                    "ktor", "vapor", "rocket", "actix", "micronaut", "quarkus", "fastapi",
                    "django", "symfony", "nestjs"],
        "web": ["ember.js", "backbone.js", "alpine.js", "astro", "remix", "blazor",
                "webassembly", "three.js", "d3.js", "plotly", "seaborn", "matplotlib",
                "numpy", "pandas", "svelte", "angular", "react", "vue", "next", "javascript",
                "css"],
        "ml": ["lightgbm", "catboost", "xgboost", "keras", "pytorch", "tensorflow",
               "opencv", "svm", "randomforest", "cnn"],
        "language": ["powerbuilder", "smalltalk", "haxe", "crystal", "protobuf", "json",
                     "graphql", "grpc", "mqtt", "websocket", "rabbitmq", "kafka",
                     "elm", "clojure", "lisp", "prolog", "vdhl", "verilog", "solidity",
                     "groovy", "shell", "cobol", "fortran", "julia", "matlab", "erlang",
                     "elixir", "haskell", "lua", "perl", "scala", "objective-c", "swift",
                     "kotlin", "typescript", "flutter", "git", "hash", "crypto",
                     "encryption", "chunking", "android", "fuzzy", "linux", "rust",
                     "golang", "ruby", "bash", "dart", "php", "asm", "python", "java"]
    }
    for cat, keywords in categories.items():
        for kw in keywords:
            if kw in name_lower:
                return cat
    return "web"  # default

# ==================== TEMPLATE KONTEN YANG SANGAT VARIATIF ====================
# Template untuk file kode dan konfigurasi (diperluas)
CODE_TEMPLATES = {
    "web": [
        # JavaScript/TypeScript
        "// {filename}.js\nconst API_KEY = \"{random_str}\";\nexport default API_KEY;",
        "// utils/helpers.js\n/**\n * Helper functions\n */\nexport function formatDate(date) {{\n    return date.toISOString().split('T')[0];\n}}\n",
        "// config.json\n{{\n    \"version\": \"{version}\",\n    \"apiEndpoint\": \"https://api.example.com/v1\",\n    \"timeout\": {timeout}\n}}",
        "// index.html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>{title}</title>\n</head>\n<body>\n    <div id=\"app\"></div>\n</body>\n</html>",
        "// styles.css\n/* {filename}.css */\nbody {{\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 0;\n}}\n",
        "// .env\nSECRET_KEY={random_str}\nAPI_KEY={random_str}\n",
        "// package.json\n{{\n    \"name\": \"{project}\",\n    \"version\": \"{version}\",\n    \"scripts\": {{\n        \"start\": \"node index.js\"\n    }}\n}}",
        "// webpack.config.js\nmodule.exports = {{\n    entry: './src/index.js',\n    output: {{\n        filename: 'bundle.js',\n        path: __dirname + '/dist'\n    }}\n}};",
        "// src/App.js\nimport React from 'react';\nfunction App() {{\n    return <div>Hello World</div>;\n}}\nexport default App;",
        "// src/index.tsx\nimport React from 'react';\nimport ReactDOM from 'react-dom';\nimport App from './App';\nReactDOM.render(<App />, document.getElementById('root'));",
    ],
    "devops": [
        "# terraform/main.tf\nresource \"aws_instance\" \"web\" {{\n    ami           = \"ami-{random_hex}\"\n    instance_type = \"t2.micro\"\n}}\n",
        "# kubernetes/deployment.yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: app-deployment\nspec:\n  replicas: {replicas}\n  template:\n    spec:\n      containers:\n      - name: app\n        image: \"{image}:{version}\"\n",
        "# Dockerfile\nFROM alpine:latest\nRUN apk add --no-cache python3\nCOPY . /app\nWORKDIR /app\nCMD [\"python3\", \"app.py\"]\n",
        "# ansible/playbook.yml\n---\n- hosts: webservers\n  tasks:\n    - name: install nginx\n      apt:\n        name: nginx\n        state: present\n",
        "# docker-compose.yml\nversion: '3'\nservices:\n  web:\n    build: .\n    ports:\n      - \"5000:5000\"\n",
        "# .github/workflows/ci.yml\nname: CI\non: [push]\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2\n      - run: make test\n",
        "# Jenkinsfile\npipeline {{\n    agent any\n    stages {{\n        stage('Build') {{\n            steps {{\n                echo 'Building...'\n            }}\n        }}\n    }}\n}}",
        "# terraform/variables.tf\nvariable \"region\" {{\n    default = \"us-east-1\"\n}}\n",
    ],
    "monitoring": [
        "# prometheus/prometheus.yml\nglobal:\n  scrape_interval: 15s\nscrape_configs:\n  - job_name: 'node'\n    static_configs:\n      - targets: ['localhost:9100']\n",
        "# grafana/dashboards/dashboard.json\n{{\n    \"title\": \"{title}\",\n    \"panels\": []\n}}",
        "# loki/config.yaml\nauth_enabled: false\nserver:\n  http_listen_port: 3100\n",
        "# alertmanager/config.yml\nroute:\n  receiver: 'default'\nreceivers:\n- name: 'default'\n  webhook_configs:\n  - url: 'http://example.com/webhook'\n",
        "# telegraf/telegraf.conf\n[[inputs.cpu]]\n  percpu = true\n  totalcpu = true\n",
    ],
    "database": [
        "-- migrations/001_init.sql\nCREATE TABLE users (\n    id INT PRIMARY KEY,\n    name VARCHAR(255) NOT NULL\n);\n",
        "// prisma/schema.prisma\ngenerator client {{\n    provider = \"prisma-client-js\"\n}}\n\ndatasource db {{\n    provider = \"postgresql\"\n    url      = env(\"DATABASE_URL\")\n}}\n",
        "# seeds/seed_data.json\n[\n    {{\"id\": 1, \"name\": \"{random_name}\"}},\n    {{\"id\": 2, \"name\": \"{random_name}\"}}\n]",
        "// config/database.js\nmodule.exports = {{\n    host: 'localhost',\n    port: 5432,\n    username: '{random_str}',\n    password: '{random_str}'\n}};\n",
        "-- migrations/002_add_email.sql\nALTER TABLE users ADD COLUMN email VARCHAR(255);\n",
        "# models/user.py\nfrom sqlalchemy import Column, Integer, String\nfrom sqlalchemy.ext.declarative import declarative_base\nBase = declarative_base()\nclass User(Base):\n    __tablename__ = 'users'\n    id = Column(Integer, primary_key=True)\n    name = Column(String)\n",
        "// repositories/user_repository.go\npackage repositories\n\ntype UserRepository struct {{\n    db *sql.DB\n}}\n\nfunc (r *UserRepository) GetUser(id int) (*User, error) {{\n    // implementation\n    return nil, nil\n}}\n",
    ],
    "backend": [
        "# app/main.py\nfrom fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get(\"/\")\ndef read_root():\n    return {{\"message\": \"Hello World\"}}\n",
        "// src/main/java/com/example/Application.java\npackage com.example;\nimport org.springframework.boot.SpringApplication;\nimport org.springframework.boot.autoconfigure.SpringBootApplication;\n\n@SpringBootApplication\npublic class Application {{\n    public static void main(String[] args) {{\n        SpringApplication.run(Application.class, args);\n    }}\n}}\n",
        "# routes/api.rb\nRails.application.routes.draw do\n  resources :users\nend\n",
        "// controllers/UserController.cs\nusing Microsoft.AspNetCore.Mvc;\n[ApiController]\n[Route(\"[controller]\")]\npublic class UserController : ControllerBase\n{{\n    [HttpGet]\n    public IActionResult Get() => Ok(new {{ name = \"John\" }});\n}}\n",
        "# app/controllers/users_controller.rb\nclass UsersController < ApplicationController\n  def index\n    @users = User.all\n  end\nend\n",
        "// src/routes/userRoutes.js\nconst express = require('express');\nconst router = express.Router();\nrouter.get('/', (req, res) => res.json({ message: 'OK' }));\nmodule.exports = router;",
        "# app/services/user_service.py\nclass UserService:\n    def get_user(self, user_id):\n        return {\"id\": user_id, \"name\": \"Test\"}\n",
    ],
    "ml": [
        "# models/model.py\nimport torch\nimport torch.nn as nn\n\nclass SimpleModel(nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.fc = nn.Linear(10, 2)\n\n    def forward(self, x):\n        return self.fc(x)\n",
        "# notebooks/exploration.ipynb\n{{\n \"cells\": [\n  {{\n   \"cell_type\": \"code\",\n   \"execution_count\": null,\n   \"metadata\": {{}},\n   \"outputs\": [],\n   \"source\": [\n    \"import pandas as pd\\n\",\n    \"data = pd.read_csv('data.csv')\\n\"\n   ]\n  }}\n ]\n}}",
        "# data/weights.h5\n# Dummy weights file\n",
        "# train.py\nimport numpy as np\nfrom sklearn.ensemble import RandomForestClassifier\n\nX = np.random.rand(100, 10)\ny = np.random.randint(0, 2, 100)\nmodel = RandomForestClassifier()\nmodel.fit(X, y)\n",
        "# config/hyperparams.yaml\nlearning_rate: 0.001\nbatch_size: 32\nepochs: 100\n",
        "# utils/data_loader.py\nimport torch\nfrom torch.utils.data import Dataset\n\nclass MyDataset(Dataset):\n    def __len__(self):\n        return 1000\n    def __getitem__(self, idx):\n        return torch.randn(10), torch.tensor(0)\n",
    ],
    "language": [
        "# src/main.rs\nfn main() {{\n    println!(\"Hello, world!\");\n}}\n",
        "// index.js\nconsole.log('Hello, world!');\n",
        "# lib/example.ex\ndefmodule Example do\n  def hello do\n    IO.puts(\"Hello, world!\")\n  end\nend\n",
        "# main.go\npackage main\n\nimport \"fmt\"\n\nfunc main() {{\n    fmt.Println(\"Hello, world!\")\n}}\n",
        "# src/App.kt\nfun main() {{\n    println(\"Hello, world!\")\n}}\n",
        "# hello.py\nprint(\"Hello, world!\")\n",
        "# hello.rb\nputs \"Hello, world!\"\n",
        "# hello.php\n<?php\necho \"Hello, world!\";\n",
        "# hello.java\npublic class Hello {{\n    public static void main(String[] args) {{\n        System.out.println(\"Hello, world!\");\n    }}\n}}\n",
        "# hello.cpp\n#include <iostream>\nint main() {{\n    std::cout << \"Hello, world!\" << std::endl;\n    return 0;\n}}\n",
    ],
}

# Template untuk README.md dinamis
README_TEMPLATES = {
    "web": "# {repo_name}\n\nA modern web application built with {tech}. Features include:\n- Responsive design\n- API integration\n- User authentication\n- Real-time updates\n\n## Getting Started\n\n```bash\nnpm install\nnpm start\n```\n\n## Deployment\n\n```bash\nnpm run build\n```\n",
    "devops": "# {repo_name}\n\nInfrastructure as code and automation tools for {tech}. This repository contains:\n- Terraform configurations\n- Kubernetes manifests\n- CI/CD pipelines\n- Monitoring setup\n\n## Usage\n\n```bash\nterraform init\nterraform apply\n```\n\n## Structure\n\n- `terraform/` - Terraform modules\n- `kubernetes/` - K8s manifests\n- `scripts/` - Automation scripts\n",
    "monitoring": "# {repo_name}\n\nMonitoring stack for {tech}. Includes:\n- Prometheus metrics\n- Grafana dashboards\n- Alerting rules\n- Log aggregation with Loki\n\n## Quick Start\n\n```bash\ndocker-compose up -d\n```\n\nAccess Grafana at http://localhost:3000\n",
    "database": "# {repo_name}\n\nDatabase schema and migrations for {tech}. Contains:\n- SQL scripts\n- ORM models\n- Seed data\n- Query examples\n\n## Setup\n\n```sql\npsql -f migrations/001_init.sql\n```\n\n## Migrations\n\nRun migrations with:\n```bash\nnpm run migrate\n```\n",
    "backend": "# {repo_name}\n\nBackend service for {tech}. Implements REST API with:\n- JWT authentication\n- Database integration\n- Request validation\n- Unit tests\n\n## Run\n\n```bash\npython app/main.py\n```\n\n## API Endpoints\n\n- `GET /` - Health check\n- `POST /users` - Create user\n",
    "ml": "# {repo_name}\n\nMachine learning project using {tech}. Includes:\n- Model training scripts\n- Jupyter notebooks\n- Pre-trained weights\n- Evaluation metrics\n\n## Training\n\n```bash\npython models/model.py\n```\n\n## Notebooks\n\nExplore the notebooks in `notebooks/` directory.\n",
    "language": "# {repo_name}\n\nA {tech} library/example. Demonstrates:\n- Core language features\n- Best practices\n- Unit tests\n- Performance benchmarks\n\n## Build\n\n```bash\n# build instructions here\n```\n\n## Tests\n\n```bash\nmake test\n```\n",
}

# Template lisensi yang lebih lengkap
LICENSES = {
    "MIT": """MIT License

Copyright (c) {year} {repo_name} Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.""",
    "Apache-2.0": """Apache License, Version 2.0

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.
      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by
      reason of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "[]"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright {year} {repo_name} Contributors

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.""",
    "GPL-3.0": """GNU GENERAL PUBLIC LICENSE
   Version 3, 29 June 2007

Copyright (C) 2007 Free Software Foundation, Inc. <https://fsf.org/>
Everyone is permitted to copy and distribute verbatim copies
of this license document, but changing it is not allowed.

                            Preamble

  The GNU General Public License is a free, copyleft license for
software and other kinds of works.

  The licenses for most software and other practical works are designed
to take away your freedom to share and change the works.  By contrast,
the GNU General Public License is intended to guarantee your freedom to
share and change all versions of a program--to make sure it remains free
software for all its users.  We, the Free Software Foundation, use the
GNU General Public License for most of our software; it applies also to
any other work released this way by its authors.  You can apply it to
your programs, too.

  When we speak of free software, we are referring to freedom, not
price.  Our General Public Licenses are designed to make sure that you
have the freedom to distribute copies of free software (and charge for
them if you wish), that you receive source code or can get it if you
want it, that you can change the software or use pieces of it in new
free programs, and that you know you can do these things.

  To protect your rights, we need to prevent others from denying you
these rights or asking you to surrender the rights.  Therefore, you have
certain responsibilities if you distribute copies of the software, or if
you modify it: responsibilities to respect the freedom of others.

  For example, if you distribute copies of such a program, whether
gratis or for a fee, you must pass on to the recipients the same
freedoms that you received.  You must make sure that they, too, receive
or can get the source code.  And you must show them these terms so they
know their rights.

  Developers that use the GNU GPL protect your rights with two steps:
(1) assert copyright on the software, and (2) offer you this License
giving you legal permission to copy, distribute and/or modify it.

  For the developers' and authors' protection, the GPL clearly explains
that there is no warranty for this free software.  For both users' and
authors' sake, the GPL requires that modified versions be marked as
changed, so that their problems will not be attributed erroneously to
authors of previous versions.

  Some devices are designed to deny users access to install or run
modified versions of the software inside them, although the manufacturer
can do so.  This is fundamentally incompatible with the aim of
protecting users' freedom to change the software.  The systematic
pattern of such abuse occurs in the area of products for individuals to
use, which is precisely where it is most unacceptable.  Therefore, we
have designed this version of the GPL to prohibit the practice for those
products.  If such problems arise substantially in other domains, we
stand ready to extend this provision to those domains in future versions
of the GPL, as needed to protect the freedom of users.

  Finally, every program is threatened constantly by software patents.
States should not allow patents to restrict development and use of
software on general-purpose computers, but in those that do, we wish to
avoid the special danger that patents applied to a free program could
make it effectively proprietary.  To prevent this, the GPL assures that
patents cannot be used to render the program non-free.

  The precise terms and conditions for copying, distribution and
modification follow.

                       TERMS AND CONDITIONS

  0. Definitions.

  "This License" refers to version 3 of the GNU General Public License.

  "Copyright" also means copyright-like laws that apply to other kinds of
works, such as semiconductor masks.

  "The Program" refers to any copyrightable work licensed under this
License.  Each licensee is addressed as "you".  "Licensees" and
"recipients" may be individuals or organizations.

  To "modify" a work means to copy from or adapt all or part of the work
in a fashion requiring copyright permission, other than the making of an
exact copy.  The resulting work is called a "modified version" of the
earlier work or a work "based on" the earlier work.

  A "covered work" means either the unmodified Program or a work based
on the Program.

  To "propagate" a work means to do anything with it that, without
permission, would make you directly or secondarily liable for
infringement under applicable copyright law, except executing it on a
computer or modifying a private copy.  Propagation includes copying,
distribution (with or without modification), making available to the
public, and in some countries other activities as well.

  To "convey" a work means any kind of propagation that enables other
parties to make or receive copies.  Mere interaction with a user through
a computer network, with no transfer of a copy, is not conveying.

  An interactive user interface displays "Appropriate Legal Notices"
to the extent that it includes a convenient and prominently visible
feature that (1) displays an appropriate copyright notice, and (2)
tells the user that there is no warranty for the work (except to the
extent that warranties are provided), that licensees may convey the
work under this License, and how to view a copy of this License.  If
the interface presents a list of user commands or options, such as a
menu, a prominent item in the list meets this criterion.

  1. Source Code.

  The "source code" for a work means the preferred form of the work
for making modifications to it.  "Object code" means any non-source
form of a work.

  A "Standard Interface" means an interface that either is an official
standard defined by a recognized standards body, or, in the case of
interfaces specified for a particular programming language, one that
is widely used among developers working in that language.

  The "System Libraries" of an executable work include anything, other
than the work as a whole, that (a) is included in the normal form of
packaging a Major Component, but which is not part of that Major
Component, and (b) serves only to enable use of the work with that
Major Component, or to implement a Standard Interface for which an
implementation is available to the public in source code form.  A
"Major Component", in this context, means a major essential component
(kernel, window system, and so on) of the specific operating system
(if any) on which the executable work runs, or a compiler used to
produce the work, or an object code interpreter used to run it.

  The "Corresponding Source" for a work in object code form means all
the source code needed to generate, install, and (for an executable
work) run the object code and to modify the work, including scripts to
control those activities.  However, it does not include the work's
System Libraries, or general-purpose tools or generally available free
programs which are used unmodified in performing those activities but
which are not part of the work.  For example, Corresponding Source
includes interface definition files associated with source files for
the work, and the source code for shared libraries and dynamically
linked subprograms that the work is specifically designed to require,
such as by intimate data communication or control flow between those
subprograms and other parts of the work.

  The Corresponding Source need not include anything that users
can regenerate automatically from other parts of the Corresponding
Source.

  The Corresponding Source for a work in source code form is that
same work.

  2. Basic Permissions.

  All rights granted under this License are granted for the term of
copyright on the Program, and are irrevocable provided the stated
conditions are met.  This License explicitly affirms your unlimited
permission to run the unmodified Program.  The output from running a
covered work is covered by this License only if the output, given its
content, constitutes a covered work.  This License acknowledges your
rights of fair use or other equivalent, as provided by copyright law.

  You may make, run and propagate covered works that you do not
convey, without conditions so long as your license otherwise remains
in force.  You may convey covered works to others for the sole purpose
of having them make modifications exclusively for you, or provide you
with facilities for running those works, provided that you comply with
the terms of this License in conveying all material for which you do
not control copyright.  Those thus making or running the covered works
for you must do so exclusively on your behalf, under your direction
and control, on terms that prohibit them from making any copies of
your copyrighted material outside their relationship with you.

  Conveying under any other circumstances is permitted solely under
the conditions stated below.  Sublicensing is not allowed; section 10
makes it unnecessary.

  3. Protecting Users' Legal Rights From Anti-Circumvention Law.

  No covered work shall be deemed part of an effective technological
measure under any applicable law fulfilling obligations under article
11 of the WIPO copyright treaty adopted on 20 December 1996, or
similar laws prohibiting or restricting circumvention of such
measures.

  When you convey a covered work, you waive any legal power to forbid
circumvention of technological measures to the extent such circumvention
is effected by exercising rights under this License with respect to
the covered work, and you disclaim any intention to limit operation or
modification of the work as a means of enforcing, against the work's
users, your or third parties' legal rights to forbid circumvention of
technological measures.

  4. Conveying Verbatim Copies.

  You may convey verbatim copies of the Program's source code as you
receive it, in any medium, provided that you conspicuously and
appropriately publish on each copy an appropriate copyright notice;
keep intact all notices stating that this License and any
non-permissive terms added in accord with section 7 apply to the code;
keep intact all notices of the absence of any warranty; and give all
recipients a copy of this License along with the Program.

  You may charge any price or no price for each copy that you convey,
and you may offer support or warranty protection for a fee.

  5. Conveying Modified Source Versions.

  You may convey a work based on the Program, or the modifications to
produce it from the Program, in the form of source code under the
terms of section 4, provided that you also meet all of these conditions:

    a) The work must carry prominent notices stating that you modified
    it, and giving a relevant date.

    b) The work must carry prominent notices stating that it is
    released under this License and any conditions added under section
    7.  This requirement modifies the requirement in section 4 to
    "keep intact all notices".

    c) You must license the entire work, as a whole, under this
    License to anyone who comes into possession of a copy.  This
    License will therefore apply, along with any applicable section 7
    additional terms, to the whole of the work, and all its parts,
    regardless of how they are packaged.  This License gives no
    permission to license the work in any other way, but it does not
    invalidate such permission if you have separately received it.

    d) If the work has interactive user interfaces, each must display
    Appropriate Legal Notices; however, if the Program has interactive
    interfaces that do not display Appropriate Legal Notices, your
    work need not make them do so.

  A compilation of a covered work with other separate and independent
works, which are not by their nature extensions of the covered work,
and which are not combined with it such as to form a larger program,
in or on a volume of a storage or distribution medium, is called an
"aggregate" if the compilation and its resulting copyright are not
used to limit the access or legal rights of the compilation's users
beyond what the individual works permit.  Inclusion of a covered work
in an aggregate does not cause this License to apply to the other
parts of the aggregate.

  6. Conveying Non-Source Forms.

  You may convey a covered work in object code form under the terms
of sections 4 and 5, provided that you also convey the
machine-readable Corresponding Source under the terms of this License,
in one of these ways:

    a) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by the
    Corresponding Source fixed on a durable physical medium
    customarily used for software interchange.

    b) Convey the object code in, or embodied in, a physical product
    (including a physical distribution medium), accompanied by a
    written offer, valid for at least three years and valid for as
    long as you offer spare parts or customer support for that product
    model, to give anyone who possesses the object code either (1) a
    copy of the Corresponding Source for all the software in the
    product that is covered by this License, on a durable physical
    medium customarily used for software interchange, for a price no
    more than your reasonable cost of physically performing this
    conveying of source, or (2) access to copy the
    Corresponding Source from a network server at no charge.

    c) Convey individual copies of the object code with a copy of the
    written offer to provide the Corresponding Source.  This
    alternative is allowed only occasionally and noncommercially, and
    only if you received the object code with such an offer, in accord
    with subsection 6b.

    d) Convey the object code by offering access from a designated
    place (gratis or for a charge), and offer equivalent access to the
    Corresponding Source in the same way through the same place at no
    further charge.  You need not require recipients to copy the
    Corresponding Source along with the object code.  If the place to
    copy the object code is a network server, the Corresponding Source
    may be on a different server (operated by you or a third party)
    that supports equivalent copying facilities, provided you maintain
    clear directions next to the object code saying where to find the
    Corresponding Source.  Regardless of what server hosts the
    Corresponding Source, you remain obligated to ensure that it is
    available for as long as needed to satisfy these requirements.

    e) Convey the object code using peer-to-peer transmission, provided
    you inform other peers where the object code and Corresponding
    Source of the work are being offered to the general public at no
    charge under subsection 6d.

  A separable portion of the object code, whose source code is excluded
from the Corresponding Source as a System Library, need not be
included in conveying the object code work.

  A "User Product" is either (1) a "consumer product", which means any
tangible personal property which is normally used for personal, family,
or household purposes, or (2) anything designed or sold for incorporation
into a dwelling.  In determining whether a product is a consumer product,
doubtful cases shall be resolved in favor of coverage.  For a particular
product received by a particular user, "normally used" refers to a
typical or common use of that class of product, regardless of the status
of the particular user or of the way in which the particular user
actually uses, or expects or is expected to use, the product.  A product
is a consumer product regardless of whether the product has substantial
commercial, industrial or non-consumer uses, unless such uses represent
the only significant mode of use of the product.

  "Installation Information" for a User Product means any methods,
procedures, authorization keys, or other information required to install
and execute modified versions of a covered work in that User Product from
a modified version of its Corresponding Source.  The information must
suffice to ensure that the continued functioning of the modified object
code is in no case prevented or interfered with solely because
modification has been made.

  If you convey an object code work under this section in, or with, or
specifically for use in, a User Product, and the conveying occurs as
part of a transaction in which the right of possession and use of the
User Product is transferred to the recipient in perpetuity or for a
fixed term (regardless of how the transaction is characterized), the
Corresponding Source conveyed under this section must be accompanied
by the Installation Information.  But this requirement does not apply
if neither you nor any third party retains the ability to install
modified object code on the User Product (for example, the work has
been installed in ROM).

  The requirement to provide Installation Information does not include a
requirement to continue to provide support service, warranty, or updates
for a work that has been modified or installed by the recipient, or for
the User Product in which it has been modified or installed.  Access to a
network may be denied when the modification itself materially and
adversely affects the operation of the network or violates the rules and
protocols for communication across the network.

  Corresponding Source conveyed, and Installation Information provided,
in accord with this section must be in a format that is publicly
documented (and with an implementation available to the public in
source code form), and must require no special password or key for
unpacking, reading or copying.

  7. Additional Terms.

  "Additional permissions" are terms that supplement the terms of this
License by making exceptions from one or more of its conditions.
Additional permissions that are applicable to the entire Program shall
be treated as though they were included in this License, to the extent
that they are valid under applicable law.  If additional permissions
apply only to part of the Program, that part may be used separately
under those permissions, but the entire Program remains governed by
this License without regard to the additional permissions.

  When you convey a copy of a covered work, you may at your option
remove any additional permissions from that copy, or from any part of
it.  (Additional permissions may be written to require their own
removal in certain cases when you modify the work.)  You may place
additional permissions on material, added by you to a covered work,
for which you have or can give appropriate copyright permission.

  Notwithstanding any other provision of this License, for material you
add to a covered work, you may (if authorized by the copyright holders of
that material) supplement the terms of this License with terms:

    a) Disclaiming warranty or limiting liability differently from the
    terms of sections 15 and 16 of this License; or

    b) Requiring preservation of specified reasonable legal notices or
    author attributions in that material or in the Appropriate Legal
    Notices displayed by works containing it; or

    c) Prohibiting misrepresentation of the origin of that material, or
    requiring that modified versions of such material be marked in
    reasonable ways as different from the original version; or

    d) Limiting the use for publicity purposes of names of licensors or
    authors of the material; or

    e) Declining to grant rights under trademark law for use of some
    trade names, trademarks, or service marks; or

    f) Requiring indemnification of licensors and authors of that
    material by anyone who conveys the material (or modified versions of
    it) with contractual assumptions of liability to the recipient, for
    any liability that these contractual assumptions directly impose on
    those licensors and authors.

  All other non-permissive additional terms are considered "further
restrictions" within the meaning of section 10.  If the Program as you
received it, or any part of it, contains a notice stating that it is
governed by this License along with a term that is a further
restriction, you may remove that term.  If a license document contains
a further restriction but permits relicensing or conveying under this
License, you may add to a covered work material governed by the terms
of that license document, provided that the further restriction does
not survive such relicensing or conveying.

  If you add terms to a covered work in accord with this section, you
must place, in the relevant source files, a statement of the
additional terms that apply to those files, or a notice indicating
where to find the applicable terms.

  Additional terms, permissive or non-permissive, may be stated in the
form of a separately written license, or stated as exceptions;
the above requirements apply either way.

  8. Termination.

  You may not propagate or modify a covered work except as expressly
provided under this License.  Any attempt otherwise to propagate or
modify it is void, and will automatically terminate your rights under
this License (including any patent licenses granted under the third
paragraph of section 11).

  However, if you cease all violation of this License, then your
license from a particular copyright holder is reinstated (a)
provisionally, unless and until the copyright holder explicitly and
finally terminates your license, and (b) permanently, if the copyright
holder fails to notify you of the violation by some reasonable means
prior to 60 days after the cessation.

  Moreover, your license from a particular copyright holder is
reinstated permanently if the copyright holder notifies you of the
violation by some reasonable means, this is the first time you have
received notice of violation of this License (for any work) from that
copyright holder, and you cure the violation prior to 30 days after
your receipt of the notice.

  Termination of your rights under this section does not terminate the
licenses of parties who have received copies or rights from you under
this License.  If your rights have been terminated and not permanently
reinstated, you do not qualify to receive new licenses for the same
material under section 10.

  9. Acceptance Not Required for Having Copies.

  You are not required to accept this License in order to receive or
run a copy of the Program.  Ancillary propagation of a covered work
occurring solely as a consequence of using peer-to-peer transmission
to receive a copy likewise does not require acceptance.  However,
nothing other than this License grants you permission to propagate or
modify any covered work.  These actions infringe copyright if you do
not accept this License.  Therefore, by modifying or propagating a
covered work, you indicate your acceptance of this License to do so.

  10. Automatic Licensing of Downstream Recipients.

  Each time you convey a covered work, the recipient automatically
receives a license from the original licensors, to run, modify and
propagate that work, subject to this License.  You are not responsible
for enforcing compliance by third parties with this License.

  An "entity transaction" is a transaction transferring control of an
organization, or substantially all assets of one, or subdividing an
organization, or merging organizations.  If propagation of a covered
work results from an entity transaction, each party to that
transaction who receives a copy of the work also receives whatever
licenses to the work the party's predecessor in interest had or could
give under the previous paragraph, plus a right to possession of the
Corresponding Source of the work from the predecessor in interest, if
the predecessor has it or can get it with reasonable efforts.

  You may not impose any further restrictions on the exercise of the
rights granted or affirmed under this License.  For example, you may
not impose a license fee, royalty, or other charge for exercise of
rights granted under this License, and you may not initiate litigation
(including a cross-claim or counterclaim in a lawsuit) alleging that
any patent claim is infringed by making, using, selling, offering for
sale, or importing the Program or any portion of it.

  11. Patents.

  A "contributor" is a copyright holder who authorizes use under this
License of the Program or a work on which the Program is based.  The
work thus licensed is called the contributor's "contributor version".

  A contributor's "essential patent claims" are all patent claims
owned or controlled by the contributor, whether already acquired or
hereafter acquired, that would be infringed by some manner, permitted
by this License, of making, using, or selling its contributor version,
but do not include claims that would be infringed only as a
consequence of further modification of the contributor version.  For
purposes of this definition, "control" includes the right to grant
patent sublicenses in a manner consistent with the requirements of
this License.

  Each contributor grants you a non-exclusive, worldwide, royalty-free
patent license under the contributor's essential patent claims, to
make, use, sell, offer for sale, import and otherwise run, modify and
propagate the contents of its contributor version.

  In the following three paragraphs, a "patent license" is any express
agreement or commitment, however denominated, not to enforce a patent
(such as an express permission to practice a patent or covenant not to
sue for patent infringement).  To "grant" such a patent license to a
party means to make such an agreement or commitment not to enforce a
patent against the party.

  If you convey a covered work, knowingly relying on a patent license,
and the Corresponding Source of the work is not available for anyone
to copy, free of charge and under the terms of this License, through a
publicly available network server or other readily accessible means,
then you must either (1) cause the Corresponding Source to be so
available, or (2) arrange to deprive yourself of the benefit of the
patent license for this particular work, or (3) arrange, in a manner
consistent with the requirements of this License, to extend the patent
license to downstream recipients.  "Knowingly relying" means you have
actual knowledge that, but for the patent license, your conveying the
covered work in a country, or your recipient's use of the covered work
in a country, would infringe one or more identifiable patents in that
country that you have reason to believe are valid.

  If, pursuant to or in connection with a single transaction or
arrangement, you convey, or propagate by procuring conveyance of, a
covered work, and grant a patent license to some of the parties
receiving the covered work authorizing them to use, propagate, modify
or convey a specific copy of the covered work, then the patent license
you grant is automatically extended to all recipients of the covered
work and works based on it.

  A patent license is "discriminatory" if it does not include within
the scope of its coverage, prohibits the exercise of, or is
conditioned on the non-exercise of one or more of the rights that are
specifically granted under this License.  You may not convey a covered
work if you are a party to an arrangement with a third party that is
in the business of distributing software, under which you make payment
to the third party based on the extent of your activity of conveying
the work, and under which the third party grants, to any of the
parties who would receive the covered work from you, a discriminatory
patent license (a) in connection with copies of the covered work
conveyed by you (or copies made from those copies), or (b) primarily
for and in connection with specific products or compilations that
contain the covered work, unless you entered into that arrangement,
or that patent license was granted, prior to 28 March 2007.

  Nothing in this License shall be construed as excluding or limiting
any implied license or other defenses to infringement that may
otherwise be available to you under applicable patent law.

  12. No Surrender of Others' Freedom.

  If conditions are imposed on you (whether by court order, agreement or
otherwise) that contradict the conditions of this License, they do not
excuse you from the conditions of this License.  If you cannot convey a
covered work so as to satisfy simultaneously your obligations under this
License and any other pertinent obligations, then as a consequence you may
not convey it at all.  For example, if you agree to terms that obligate you
to collect a royalty for further conveying from those to whom you convey
the Program, the only way you could satisfy both those terms and this
License would be to refrain entirely from conveying the Program.

  13. Use with the GNU Affero General Public License.

  Notwithstanding any other provision of this License, you have
permission to link or combine any covered work with a work licensed
under version 3 of the GNU Affero General Public License into a single
combined work, and to convey the resulting work.  The terms of this
License will continue to apply to the part which is the covered work,
but the special requirements of the GNU Affero General Public License,
section 13, concerning interaction through a network will apply to the
combination as such.

  14. Revised Versions of this License.

  The Free Software Foundation may publish revised and/or new versions of
the GNU General Public License from time to time.  Such new versions will
be similar in spirit to the present version, but may differ in detail to
address new problems or concerns.

  Each version is given a distinguishing version number.  If the
Program specifies that a certain numbered version of the GNU General
Public License "or any later version" applies to it, you have the
option of following the terms and conditions either of that numbered
version or of any later version published by the Free Software
Foundation.  If the Program does not specify a version number of the
GNU General Public License, you may choose any version ever published
by the Free Software Foundation.

  If the Program specifies that a proxy can decide which future
versions of the GNU General Public License can be used, that proxy's
public statement of acceptance of a version permanently authorizes you
to choose that version for the Program.

  Later license versions may give you additional or different
permissions.  However, no additional obligations are imposed on any
author or copyright holder as a result of your choosing to follow a
later version.

  15. Disclaimer of Warranty.

  THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY
APPLICABLE LAW.  EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT
HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY
OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
PURPOSE.  THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM
IS WITH YOU.  SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
ALL NECESSARY SERVICING, REPAIR OR CORRECTION.

  16. Limitation of Liability.

  IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING
WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MODIFIES AND/OR CONVEYS
THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY
GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE
USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF
DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD
PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS),
EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF
SUCH DAMAGES.

  17. Interpretation of Sections 15 and 16.

  If the disclaimer of warranty and limitation of liability provided
above cannot be given local legal effect according to their terms,
reviewing courts shall apply local law that most closely approximates
an absolute waiver of all civil liability in connection with the
Program, unless a warranty or assumption of liability accompanies a
copy of the Program in return for a fee.

                     END OF TERMS AND CONDITIONS

            How to Apply These Terms to Your New Programs

  If you develop a new program, and you want it to be of the greatest
possible use to the public, the best way to achieve this is to make it
free software which everyone can redistribute and change under these terms.

  To do so, attach the following notices to the program.  It is safest
to attach them to the start of each source file to most effectively
state the exclusion of warranty; and each file should have at least
the "copyright" line and a pointer to where the full notice is found.

    <one line to give the program's name and a brief idea of what it does.>
    Copyright (C) {year} {repo_name} Contributors

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

Also add information on how to contact you by electronic and paper mail.

  If the program does terminal interaction, make it output a short
notice like this when it starts in an interactive mode:

    <program>  Copyright (C) {year}  {repo_name} Contributors
    This program comes with ABSOLUTELY NO WARRANTY; for details type `show w'.
    This is free software, and you are welcome to redistribute it
    under certain conditions; type `show c' for details.

The hypothetical commands `show w' and `show c' should show the appropriate
parts of the General Public License.  Of course, your program's commands
might be different; for a GUI interface, you would use an "about box".

  You should also get your employer (if you work as a programmer) or school,
if any, to sign a "copyright disclaimer" for the program, if necessary.
For more information on this, and how to apply and follow the GNU GPL, see
<https://www.gnu.org/licenses/>.

  The GNU General Public License does not permit incorporating your program
into proprietary programs.  If your program is a subroutine library, you
may consider it more useful to permit linking proprietary applications with
the library.  If this is what you want to do, use the GNU Lesser General
Public License instead of this License.  But first, please read
<https://www.gnu.org/licenses/why-not-lgpl.html>.""",
}

# Template .gitignore yang lebih lengkap dan bervariasi
GITIGNORE_TEMPLATES = {
    "web": """# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
.pnpm-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Directory for instrumented libs generated by jscoverage/JSCover
lib-cov

# Coverage directory used by tools like istanbul
coverage
*.lcov

# nyc test coverage
.nyc_output

# Grunt intermediate storage (https://gruntjs.com/creating-plugins#storing-task-files)
.grunt

# Bower dependency directory (https://bower.io/)
bower_components

# node-waf configuration
.lock-wscript

# Compiled binary addons (https://nodejs.org/api/addons.html)
build/Release

# Dependency directories
node_modules/
jspm_packages/

# Snowpack dependency directory (https://snowpack.dev/)
web_modules/

# TypeScript cache
*.tsbuildinfo

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# Next.js build output
.next
out

# Nuxt.js build / generate output
.nuxt
dist

# Gatsby files
.cache/
# Comment in the public line in if your project uses Gatsby and not Next.js
# https://nextjs.org/blog/next-9-1#public-directory-support
# public

# vuepress build output
.vuepress/dist

# vuepress v2.x temp and cache
.temp
.cache

# Docusaurus cache and generated files
.docusaurus

# Serverless directories
.serverless/

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# yarn v2
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*
""",
    "python": """# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
share/python-wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# PyInstaller
#  Usually these files are written by a python script from a template
#  before PyInstaller builds the exe, so as to inject date/other infos into builds.
*.manifest
*.spec

# Installer logs
pip-log.txt
pip-delete-this-directory.txt

# Unit test / coverage reports
htmlcov/
.tox/
.nox/
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.py,cover
.hypothesis/
.pytest_cache/
cover/

# Translations
*.mo
*.pot

# Django stuff:
*.log
local_settings.py
db.sqlite3
db.sqlite3-journal

# Flask stuff:
instance/
.webassets-cache

# Scrapy stuff:
.scrapy

# Sphinx documentation
docs/_build/

# PyBuilder
.pybuilder/
target/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
#   For a library or package, you might want to ignore these files since the code is
#   intended to run in multiple environments; otherwise, check them in:
.python-version

# pipenv
#   According to pypa/pipenv#598, it is recommended to include Pipfile.lock in version control.
#   However, in case of collaboration, if having platform-specific dependencies or dependencies
#   having no cross-platform support, pipenv may install dependencies that don't work, or not
#   install all needed dependencies.
#Pipfile.lock

# poetry
#   Similar to Pipfile.lock, it is generally recommended to include poetry.lock in version control.
#   This is especially recommended for binary packages to ensure reproducibility, and is more
#   commonly ignored for libraries.
#   https://python-poetry.org/docs/basic-usage/#commit-your-poetrylock-file-to-version-control
#poetry.lock

# pdm
#   Similar to Pipfile.lock, it is generally recommended to include pdm.lock in version control.
#pdm.lock
#   pdm stores project-wide configurations in .pdm.toml, but it is recommended to not include it
#   in version control.
#   https://pdm.fming.dev/#use-with-ide
.pdm.toml

# PEP 582; used by e.g. github.com/David-OConnor/pyflow and github.com/pdm-project/pdm
__pypackages__/

# Celery stuff
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Environments
.env
.venv
env/
venv/
ENV/
env.bak/
venv.bak/

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# IDEs
.vscode/
.idea/
""",
    "java": """.classpath
.project
.settings/
target/
*.class
*.jar
*.war
*.ear
*.log
*.iml
.idea/
*.iws
*.ipr
.settings/
.classpath
.project
""",
    "go": """# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out

# Dependency directories
vendor/
# Go workspace
go.work
go.work.sum

# Output of the go coverage tool
*.out

# Go module files
go.sum
""",
    "rust": """# Generated by Cargo
/target/
**/*.rs.bk
Cargo.lock
""",
    "ruby": """*.gem
*.rbc
/.config
/coverage/
/InstalledFiles
/pkg/
/spec/reports/
/spec/examples.txt
/test/tmp/
/test/version_tmp/
/tmp/

# Used by dotenv library to load environment variables.
.env

# Ignore Byebug command history file.
.byebug_history

## Specific to RubyMotion:
.dat*
.repl_history
build/
*.bridgesupport
build-iPhoneOS/
build-iPhoneSimulator/

## Specific to RubyMotion (use of CocoaPods):
#
# We recommend against adding the Pods directory to your .gitignore. However
# you should judge for yourself, the pros and cons are listed at:
# https://guides.cocoapods.org/using/using-cocoapods.html#should-i-check-the-pods-directory-into-source-control
#
# vendor/Pods/

## Documentation cache and generated files:
/.yardoc/
/_yardoc/
/doc/
/rdoc/

## Environment normalization:
/.bundle/
/vendor/bundle
/lib/bundler/man/

# for a library or gem, you might want to ignore these files since the code is
# intended to run in multiple environments; otherwise, check them in:
# Gemfile.lock
# .ruby-version
# .ruby-gemset

# unless supporting rvm < 1.11.0 or doing something fancy, ignore this:
.rvmrc
""",
    "php": """/vendor/
composer.lock
composer.phar
.phpunit.result.cache
.phpunit.cache
.php_cs.cache
.php_cs.dist
.php_cs
phpunit.xml
phpunit.xml.dist
.phpstorm.meta.php
_ide_helper.php
.phpstorm.meta.php
.phpstorm.meta.php
""",
}

# Default gitignore untuk kategori lain
GITIGNORE_TEMPLATES["default"] = GITIGNORE_TEMPLATES["web"]

# Data gambar dummy (PNG 1x1 pixel transparan) dalam base64
DUMMY_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
# ICO dummy (16x16 pixel sederhana) - base64 dari file ico kecil
DUMMY_ICO_BASE64 = "AAABAAEAEBACAAEAAQCwAAAAFgAAACgAAAAQAAAAIAAAAAEAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA////AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA"
# SVG dummy
DUMMY_SVG = """<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
</svg>"""

# Struktur folder per kategori (diperluas)
FOLDERS = {
    "web": ["src", "utils", "config", "public", "tests", "scripts", "components", "pages", "styles", "assets", "hooks", "store"],
    "devops": ["terraform", "kubernetes", "docker", "scripts", "ansible", "monitoring", "ci", "helm", "packer", "vagrant"],
    "monitoring": ["prometheus", "grafana", "loki", "alertmanager", "config", "dashboards", "rules", "provisioning"],
    "database": ["migrations", "seeds", "config", "prisma", "models", "queries", "schema", "backups"],
    "backend": ["app", "config", "routes", "controllers", "models", "tests", "middleware", "services", "api", "core"],
    "ml": ["models", "data", "notebooks", "utils", "weights", "configs", "scripts", "experiments", "evaluation"],
    "language": ["src", "lib", "examples", "tests", "bin", "docs", "benchmarks", "include"],
}

# Ekstensi file per kategori (untuk file acak)
EXTENSIONS = {
    "web": ["js", "ts", "json", "html", "css", "scss", "env", "md", "jsx", "tsx", "vue"],
    "devops": ["tf", "yaml", "sh", "Dockerfile", "yml", "conf", "toml", "cfg", "ini"],
    "monitoring": ["yml", "ini", "conf", "json", "rules", "alerts"],
    "database": ["sql", "js", "json", "prisma", "graphql", "go", "py", "rb", "php"],
    "backend": ["py", "java", "kt", "go", "rb", "php", "cs", "rs", "scala", "exs"],
    "ml": ["py", "ipynb", "txt", "h5", "json", "yaml", "csv", "pkl", "joblib"],
    "language": ["rs", "go", "ex", "js", "rb", "php", "java", "c", "cpp", "swift", "kt", "scala", "lua", "hs", "erl", "exs", "clj", "groovy", "sh"],
}

# ==================== FUNGSI PEMBANTU ====================
def random_string(length=8):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def random_hex(length=6):
    return ''.join(random.choices(string.hexdigits.lower(), k=length))

def random_version():
    return f"{random.randint(1,5)}.{random.randint(0,9)}.{random.randint(0,9)}"

def random_name():
    first = random.choice(["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kevin", "Laura", "Mike", "Nancy", "Oliver", "Patricia", "Quinn", "Robert", "Sarah", "Tom", "Uma", "Victor", "Wendy", "Xavier", "Yvonne", "Zack"])
    last = random.choice(["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez"])
    return f"{first} {last}"

def random_email(name):
    parts = name.lower().split()
    domains = ["gmail.com", "yahoo.com", "outlook.com", "protonmail.com", "company.com", "example.org", "dev.local", "github.com"]
    if len(parts) >= 2:
        return f"{parts[0]}.{parts[1]}@{random.choice(domains)}"
    return f"{parts[0]}@{random.choice(domains)}"

def random_date(start_year=2023, end_year=2025):
    """Generate random datetime antara start_year dan end_year."""
    start = datetime(start_year, 1, 1)
    end = datetime(end_year, 12, 31)
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)

def random_commit_message():
    msgs = [
        "Add {file}",
        "Update {file}",
        "Refactor {file}",
        "Fix typo in {file}",
        "Improve {file}",
        "Initial commit for {file}",
        "Add new feature: {file}",
        "Remove debug code from {file}",
        "Optimize {file}",
        "Document {file}",
        "Fix bug in {file}",
        "Rename {file}",
        "Move {file} to new location",
        "Add tests for {file}",
        "Update dependencies",
        "Bump version",
        "Add configuration",
        "Clean up code",
        "Merge branch 'develop' into main",
        "Hotfix: fix issue in {file}",
    ]
    return random.choice(msgs)

def generate_content(template: str, filename: str) -> str:
    """Isi placeholder dalam template dengan data acak."""
    placeholders = {
        "{random_str}": random_string(12),
        "{random_hex}": random_hex(8),
        "{version}": random_version(),
        "{timeout}": str(random.randint(1000, 10000)),
        "{title}": random_string(10).capitalize(),
        "{replicas}": str(random.randint(1, 5)),
        "{image}": random_string(6),
        "{random_name}": random_string(8).capitalize(),
        "{filename}": filename.split('.')[0],
        "{project}": random_string(8),
        "{year}": str(random.randint(2023, 2025)),
    }
    content = template
    for ph, val in placeholders.items():
        content = content.replace(ph, val)
    return content

def create_file(session: requests.Session, repo: str, path: str, content: str, commit_date: datetime, binary: bool = False):
    """Buat file di GitHub menggunakan API dengan timestamp tertentu."""
    url = f"https://api.github.com/repos/{ORG_NAME}/{repo}/contents/{path}"
    
    if binary:
        # Jika binary, content sudah dalam bentuk bytes, kita encode base64
        content_bytes = content if isinstance(content, bytes) else content.encode('utf-8')
        content_b64 = base64.b64encode(content_bytes).decode('ascii')
    else:
        # Teks biasa
        content_bytes = content.encode('utf-8')
        content_b64 = base64.b64encode(content_bytes).decode('ascii')
    
    # Buat author/committer acak agar lebih realistis
    author_name = random_name()
    author_email = random_email(author_name)
    
    # Pesan commit bervariasi
    commit_msg = random_commit_message().replace("{file}", os.path.basename(path))
    
    data = {
        "message": commit_msg,
        "content": content_b64,
        "committer": {
            "name": author_name,
            "email": author_email,
            "date": commit_date.isoformat() + "Z"
        },
        "author": {
            "name": author_name,
            "email": author_email
        }
    }
    
    try:
        response = session.put(url, json=data)
        if response.status_code == 201:
            print(f"  ✅ Created {repo}/{path} (date: {commit_date.date()})")
            return True
        elif response.status_code == 422:
            # File already exists – coba dengan path berbeda? Kita akan skip saja.
            print(f"  ⚠️  File exists: {repo}/{path} - skipping")
            return False
        else:
            print(f"  ❌ Error {response.status_code} for {repo}/{path}: {response.text[:100]}")
            return False
    except Exception as e:
        print(f"  ❌ Exception: {e}")
        return False

def populate_repo(session: requests.Session, repo_name: str):
    """Isi satu repository dengan file-file acak yang sangat realistis."""
    print(f"\n📦 Processing {repo_name}...")
    category = categorize_repo(repo_name)
    folders = FOLDERS.get(category, ["src"])
    code_templates = CODE_TEMPLATES.get(category, CODE_TEMPLATES["web"])
    
    # Tentukan jumlah file: antara 30 dan 45 (lebih banyak agar lebih ramai)
    num_files = random.randint(30, 45)
    print(f"   Category: {category}, files: {num_files}")
    
    # Pastikan file-file penting dibuat terlebih dahulu
    essential_files = [
        ("README.md", "README"),
        ("LICENSE", "LICENSE"),
        (".gitignore", "GITIGNORE"),
        (".editorconfig", "EDITORCONFIG"),
        ("CONTRIBUTING.md", "CONTRIBUTING"),
        ("CHANGELOG.md", "CHANGELOG"),
    ]
    
    for fname, ftype in essential_files:
        path = fname
        if ftype == "README":
            template = README_TEMPLATES.get(category, README_TEMPLATES["web"])
            content = template.format(repo_name=repo_name, tech=repo_name)
        elif ftype == "LICENSE":
            license_type = random.choice(list(LICENSES.keys()))
            content = LICENSES[license_type].format(year=random.randint(2023, 2025), repo_name=repo_name)
        elif ftype == "GITIGNORE":
            content = GITIGNORE_TEMPLATES.get(category, GITIGNORE_TEMPLATES.get("default", ""))
        elif ftype == "EDITORCONFIG":
            content = """root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.{py,rb}]
indent_size = 4

[*.{java,cpp,c}]
indent_size = 4

[*.md]
trim_trailing_whitespace = false
"""
        elif ftype == "CONTRIBUTING":
            content = f"# Contributing to {repo_name}\n\nPlease read the guidelines before contributing.\n"
        elif ftype == "CHANGELOG":
            content = f"# Changelog\n\n## [{random_version()}] - {random_date().date()}\n### Added\n- Initial release\n"
        else:
            continue
        
        commit_date = random_date(2023, 2025)
        create_file(session, repo_name, path, content, commit_date)
        time.sleep(random.uniform(0.5, 1.2))
    
    # Buat file-file lainnya
    for i in range(num_files - len(essential_files)):
        # Pilih folder acak
        folder = random.choice(folders)
        
        # 10% kemungkinan buat file gambar dummy
        rand_val = random.random()
        if rand_val < 0.1:
            # File gambar PNG
            ext = "png"
            base = random_string(6)
            filename = f"{base}.{ext}"
            path = f"{folder}/{filename}"
            content = base64.b64decode(DUMMY_PNG_BASE64)  # bytes
            binary = True
        elif rand_val < 0.15:
            # File gambar SVG
            ext = "svg"
            base = random_string(6)
            filename = f"{base}.{ext}"
            path = f"{folder}/{filename}"
            content = DUMMY_SVG
            binary = False
        elif rand_val < 0.18:
            # File favicon.ico
            ext = "ico"
            base = "favicon"
            filename = f"{base}.{ext}"
            path = f"{folder}/{filename}"
            content = base64.b64decode(DUMMY_ICO_BASE64)
            binary = True
        else:
            # File teks biasa
            template = random.choice(code_templates)
            ext = random.choice(EXTENSIONS.get(category, ["txt"]))
            base = random_string(6)
            filename = f"{base}.{ext}"
            path = f"{folder}/{filename}"
            content = generate_content(template, filename)
            binary = False
        
        commit_date = random_date(2023, 2025)
        success = create_file(session, repo_name, path, content, commit_date, binary)
        if success:
            # Jeda antar file untuk menghindari rate limit
            time.sleep(random.uniform(0.5, 1.2))
        else:
            # Jika gagal (file sudah ada), lanjutkan
            pass

def get_authenticated_session() -> requests.Session:
    """Membuat session dengan retry dan token."""
    session = requests.Session()
    retry = Retry(
        total=3,
        read=3,
        connect=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    session.headers.update({
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Repo-Populator/2.0"
    })
    return session

# ==================== MAIN ====================
def main():
    print("=" * 80)
    print("🚀 GitHub Repository Populator – Ultra Realistic Edition v2.0")
    print("=" * 80)
    print(f"Organisasi: {ORG_NAME}")
    print(f"Jumlah repo: {len(REPO_NAMES)}")
    print(f"Estimasi file per repo: 30–45")
    print(f"Total estimasi request: ~{len(REPO_NAMES)*37} (dalam batas rate limit 5000/jam)")
    print("Pastikan token memiliki akses ke repositori organisasi.")
    print("=" * 80)
    
    # Konfirmasi
    response = input("Lanjutkan? (y/N): ").strip().lower()
    if response != 'y':
        print("Dibatalkan.")
        return
    
    # Setup session
    session = get_authenticated_session()
    
    # Verifikasi token
    try:
        test = session.get("https://api.github.com/user")
        test.raise_for_status()
        user = test.json()['login']
        print(f"✅ Token valid. Terautentikasi sebagai {user}")
        
        # Verifikasi akses ke organisasi
        org_check = session.get(f"https://api.github.com/orgs/{ORG_NAME}")
        if org_check.status_code == 200:
            print(f"✅ Organisasi {ORG_NAME} ditemukan.")
        else:
            print(f"⚠️  Organisasi {ORG_NAME} tidak dapat diakses. Pastikan token memiliki akses.")
    except Exception as e:
        print(f"❌ Gagal verifikasi token: {e}")
        return
    
    # Loop semua repo
    total_repos = len(REPO_NAMES)
    start_time = time.time()
    
    for idx, repo in enumerate(REPO_NAMES, 1):
        print(f"\n[{idx}/{total_repos}] Memproses {repo}...")
        try:
            populate_repo(session, repo)
        except KeyboardInterrupt:
            print("\n⏹️  Dibatalkan oleh user.")
            break
        except Exception as e:
            print(f"❌ Error pada {repo}: {e}")
            # Tetap lanjut ke repo berikutnya
            continue
        
        # Jeda antar repo agar tidak terlalu cepat
        time.sleep(random.uniform(3, 6))
    
    elapsed = time.time() - start_time
    print("\n" + "=" * 80)
    print("✅ Selesai! Semua repo telah diisi.")
    print(f"⏱️  Waktu total: {elapsed/60:.1f} menit")
    print("=" * 80)

if __name__ == "__main__":
    main()