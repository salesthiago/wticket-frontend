# 🌐 Guia de Deploy Frontend - S3 + CloudFront + SSL

Este guia explica como configurar o deploy automático do frontend Angular no **AWS S3 + CloudFront** com HTTPS usando GitHub Actions.

---

## ✅ VANTAGENS DE USAR S3 + CloudFront

- ✅ **Menor custo** - Paga apenas pelo armazenamento e transferência
- ✅ **Alta disponibilidade** - 99.99% de uptime
- ✅ **Performance global** - CDN distribui conteúdo mundialmente
- ✅ **SSL gratuito** - Certificado da AWS
- ✅ **Escalabilidade automática** - Suporta milhões de acessos
- ✅ **Deploy automático** - Via GitHub Actions

---

## 📋 PRÉ-REQUISITOS

- ✅ Conta AWS ativa
- ✅ Domínio configurado (ex: `wticket.godprovider.com.br`)
- ✅ Acesso ao Route 53 ou DNS do domínio
- ✅ Repositório GitHub com o código do frontend

---

## 🔧 PASSO 1: Criar Bucket S3

### 1.1 Acessar S3 no Console AWS

1. Acesse: https://console.aws.amazon.com/s3
2. Click em **"Create bucket"**

### 1.2 Configurar o Bucket

**Configurações:**

- **Bucket name:** `wticket-frontend` (ou outro nome único)
- **AWS Region:** `sa-east-1` (São Paulo) ou `us-east-1`
- **Object Ownership:** ACLs disabled (recommended)
- **Block Public Access settings:**
  - ✅ **Desmarque** "Block all public access"
  - ⚠️ Confirme que entende os riscos
- **Bucket Versioning:** Disabled (ou Enable se quiser histórico)
- **Encryption:** Enable (Server-side encryption with Amazon S3 managed keys)

Click em **"Create bucket"**

### 1.3 Configurar Bucket para Hospedagem Estática

1. Selecione o bucket criado
2. Vá em **Properties**
3. Role até **Static website hosting**
4. Click em **"Edit"**
5. Configure:
   - **Static website hosting:** Enable
   - **Hosting type:** Host a static website
   - **Index document:** `index.html`
   - **Error document:** `index.html` (importante para Angular routing!)
6. Click em **"Save changes"**

### 1.4 Configurar Política do Bucket

1. Vá em **Permissions**
2. Em **Bucket policy**, click em **"Edit"**
3. Cole esta política (substitua `wticket-frontend` pelo nome do seu bucket):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::wticket-frontend/*"
        }
    ]
}
```

4. Click em **"Save changes"**

---

## 🌍 PASSO 2: Criar Distribuição CloudFront

### 2.1 Acessar CloudFront

1. Acesse: https://console.aws.amazon.com/cloudfront
2. Click em **"Create distribution"**

### 2.2 Configurar Distribuição

**Origin settings:**

- **Origin domain:** Selecione o bucket S3 criado (wticket-frontend.s3.sa-east-1.amazonaws.com)
  - ⚠️ **IMPORTANTE:** Use o endpoint de **website** do S3, não o endpoint padrão
  - Formato correto: `wticket-frontend.s3-website-sa-east-1.amazonaws.com`
- **Origin path:** (deixe vazio)
- **Name:** Será preenchido automaticamente
- **Origin access:** Public

**Default cache behavior:**

- **Viewer protocol policy:** Redirect HTTP to HTTPS
- **Allowed HTTP methods:** GET, HEAD, OPTIONS
- **Cache policy:** CachingOptimized (ou crie uma personalizada)

**Settings:**

- **Price class:** Use all edge locations (melhor performance)
  - OU: Use Only North America and Europe (mais barato)
- **Alternate domain names (CNAMEs):** `wticket.godprovider.com.br` (seu domínio)
- **Custom SSL certificate:** (vamos configurar depois)
- **Default root object:** `index.html`

**Error pages (IMPORTANTE para Angular):**

Depois de criar, vá em **Error Pages** e adicione:

- **HTTP Error Code:** 403 Forbidden
- **Customize Error Response:** Yes
- **Response Page Path:** `/index.html`
- **HTTP Response Code:** 200 OK

- **HTTP Error Code:** 404 Not Found
- **Customize Error Response:** Yes
- **Response Page Path:** `/index.html`
- **HTTP Response Code:** 200 OK

Click em **"Create distribution"**

⚠️ **IMPORTANTE:** A distribuição pode levar 10-15 minutos para ser criada.

---

## 🔒 PASSO 3: Configurar SSL no CloudFront

### 3.1 Solicitar Certificado SSL (ACM)

⚠️ **ATENÇÃO:** O certificado para CloudFront **DEVE** ser criado na região **us-east-1** (N. Virginia)!

1. Acesse: https://console.aws.amazon.com/acm (⚠️ mude para **us-east-1**)
2. Click em **"Request a certificate"**
3. Selecione **"Request a public certificate"**
4. **Domain names:**
   - `wticket.godprovider.com.br`
   - `*.wticket.godprovider.com.br` (opcional, para subdomínios)
5. **Validation method:** DNS validation (recomendado)
6. Click em **"Request"**

### 3.2 Validar o Certificado

1. Após solicitar, você verá um botão **"Create records in Route 53"** (se usar Route 53)
   - OU copie os registros CNAME para adicionar no seu provedor de DNS

2. No seu provedor de DNS (GoDaddy, etc), adicione:
   - **Type:** CNAME
   - **Name:** (copie do ACM)
   - **Value:** (copie do ACM)

3. Aguarde a validação (pode levar até 30 minutos)

### 3.3 Adicionar Certificado ao CloudFront

1. Volte para a distribuição CloudFront
2. Click em **"Edit"**
3. Em **Custom SSL certificate**, selecione o certificado criado
4. **Security policy:** TLSv1.2_2021 (recomendado)
5. Click em **"Save changes"**

---

## 🌐 PASSO 4: Configurar DNS

No seu provedor de DNS (ou Route 53), adicione:

**Registro A com Alias (se usar Route 53):**
- **Record name:** `wticket` (ou deixe vazio para root domain)
- **Record type:** A
- **Alias:** Yes
- **Route traffic to:** CloudFront distribution
- **Distribution:** Selecione sua distribuição

**OU Registro CNAME (outros provedores):**
- **Type:** CNAME
- **Name:** `wticket`
- **Value:** `d1234567890abc.cloudfront.net` (copie da distribuição CloudFront)
- **TTL:** 300

---

## 🔑 PASSO 5: Criar Usuário IAM para GitHub Actions

### 5.1 Criar Usuário IAM

1. Acesse: https://console.aws.amazon.com/iam
2. Vá em **Users** → **Create user**
3. **User name:** `github-actions-wticket-frontend`
4. **Access type:** Programmatic access
5. Click em **"Next"**

### 5.2 Criar Política Personalizada

1. Click em **"Attach policies directly"**
2. Click em **"Create policy"**
3. Selecione **JSON** e cole:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3SyncAccess",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::wticket-frontend",
                "arn:aws:s3:::wticket-frontend/*"
            ]
        },
        {
            "Sid": "CloudFrontInvalidation",
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateInvalidation",
                "cloudfront:GetInvalidation",
                "cloudfront:ListInvalidations"
            ],
            "Resource": "arn:aws:cloudfront::*:distribution/*"
        }
    ]
}
```

4. **Policy name:** `GitHubActionsWTicketFrontendPolicy`
5. Click em **"Create policy"**

### 5.3 Anexar Política ao Usuário

1. Volte para criação do usuário
2. Busque e selecione a política `GitHubActionsWTicketFrontendPolicy`
3. Click em **"Next"** → **"Create user"**

### 5.4 Criar Access Key

1. Selecione o usuário criado
2. Vá em **Security credentials**
3. Click em **"Create access key"**
4. **Use case:** Application running outside AWS
5. Click em **"Next"** → **"Create access key"**
6. **COPIE:**
   - **Access key ID**
   - **Secret access key** ⚠️ (só aparece uma vez!)

---

## 🔐 PASSO 6: Configurar Secrets no GitHub

Acesse: https://github.com/salesthiago/wticket-frontend/settings/secrets/actions

Adicione os seguintes secrets:

### Secret 1: `AWS_ACCESS_KEY_ID`
- **Nome:** `AWS_ACCESS_KEY_ID`
- **Valor:** (Access key ID do passo 5.4)

### Secret 2: `AWS_SECRET_ACCESS_KEY`
- **Nome:** `AWS_SECRET_ACCESS_KEY`
- **Valor:** (Secret access key do passo 5.4)

### Secret 3: `AWS_REGION`
- **Nome:** `AWS_REGION`
- **Valor:** `sa-east-1` (ou a região do seu bucket)

### Secret 4: `S3_BUCKET_NAME`
- **Nome:** `S3_BUCKET_NAME`
- **Valor:** `wticket-frontend` (nome do bucket)

### Secret 5: `CLOUDFRONT_DISTRIBUTION_ID`
- **Nome:** `CLOUDFRONT_DISTRIBUTION_ID`
- **Valor:** (ID da distribuição, ex: `E1234567890ABC`)
  - Encontre em: CloudFront Console → Distributions → ID

### Secret 6: `CLOUDFRONT_DOMAIN`
- **Nome:** `CLOUDFRONT_DOMAIN`
- **Valor:** `wticket.godprovider.com.br` (seu domínio)

---

## 📤 PASSO 7: Fazer Deploy

### 7.1 Commit e Push

```powershell
cd E:\projetos\wticket\frontend

git add .github/workflows/deploy-frontend-s3.yml
git add .
git commit -m "Add S3 + CloudFront deployment with GitHub Actions"
git push origin development
```

### 7.2 Acompanhar Deploy

1. Acesse: https://github.com/salesthiago/wticket-frontend/actions
2. Veja o workflow rodando
3. Aguarde conclusão

### 7.3 Testar o Frontend

Acesse: https://wticket.godprovider.com.br

Deve mostrar o cadeado verde e o frontend carregado! 🎉

---

## 🔧 COMANDOS ÚTEIS AWS CLI

### S3

```bash
# Listar arquivos no bucket
aws s3 ls s3://wticket-frontend/

# Fazer upload manual
aws s3 sync dist/frontend/browser/ s3://wticket-frontend/ --delete

# Ver política do bucket
aws s3api get-bucket-policy --bucket wticket-frontend
```

### CloudFront

```bash
# Listar distribuições
aws cloudfront list-distributions

# Invalidar cache manualmente
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Ver status de invalidação
aws cloudfront get-invalidation \
  --distribution-id E1234567890ABC \
  --id I1234567890ABC
```

---

## 💰 CUSTOS ESTIMADOS

### S3
- Armazenamento: ~$0.023/GB/mês (região sa-east-1)
- Frontend típico: ~50MB = **~$0.001/mês**

### CloudFront
- Primeiros 10 TB/mês: $0.085/GB transferência
- 1000 requisições HTTP: grátis
- Estimativa para 10.000 visitas/mês: **~$5-10/mês**

### Total estimado: **~$5-10/mês** 💵

---

## 🐛 TROUBLESHOOTING

### Frontend retorna 403 ou 404

1. Verifique a política do bucket S3 (deve ser pública)
2. Verifique Error Pages no CloudFront (deve redirecionar para index.html)
3. Invalidar cache do CloudFront

### SSL não funciona

1. Certificado deve estar na região **us-east-1**
2. Certificado deve estar validado (status: Issued)
3. CNAME deve estar configurado no CloudFront

### Deploy falha no GitHub Actions

1. Verifique se todos os secrets estão corretos
2. Verifique permissões do usuário IAM
3. Veja os logs detalhados no GitHub Actions

### Mudanças não aparecem

```bash
# Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id SEU_DISTRIBUTION_ID \
  --paths "/*"
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Bucket S3 criado e configurado para website estático
- [ ] Política do bucket permite leitura pública
- [ ] Distribuição CloudFront criada
- [ ] Error pages configuradas (403 → /index.html, 404 → /index.html)
- [ ] Certificado SSL criado e validado (us-east-1)
- [ ] Certificado anexado à distribuição CloudFront
- [ ] DNS apontando para CloudFront
- [ ] Usuário IAM criado com permissões corretas
- [ ] Secrets configurados no GitHub
- [ ] Workflow executado com sucesso
- [ ] HTTPS funciona no navegador
- [ ] Frontend carrega corretamente

---

## 🎉 PRONTO!

Agora seu frontend está no ar com:
- ✅ HTTPS gratuito
- ✅ CDN global
- ✅ Deploy automático via GitHub Actions
- ✅ Alta disponibilidade e performance

Aproveite! 🚀
