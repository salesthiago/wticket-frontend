# ✅ Checklist Rápido - Deploy Frontend S3 + CloudFront

Use este checklist para garantir que tudo está configurado.

---

## 📦 NO CONSOLE AWS

### S3 Bucket
- [ ] Bucket criado (nome: `wticket-frontend`)
- [ ] Região selecionada (ex: `sa-east-1`)
- [ ] "Block all public access" **DESMARCADO**
- [ ] Static website hosting **HABILITADO**
- [ ] Index document: `index.html`
- [ ] Error document: `index.html`
- [ ] Bucket policy configurada (permite leitura pública)

### CloudFront
- [ ] Distribuição criada
- [ ] Origin: Endpoint de website do S3 (não o padrão!)
- [ ] Viewer protocol policy: **Redirect HTTP to HTTPS**
- [ ] Alternate domain name (CNAME): Seu domínio adicionado
- [ ] Default root object: `index.html`
- [ ] Error pages configuradas:
  - [ ] 403 → /index.html (200 OK)
  - [ ] 404 → /index.html (200 OK)

### Certificado SSL (ACM)
- [ ] Certificado solicitado na região **us-east-1** ⚠️
- [ ] Domínio: `wticket.godprovider.com.br`
- [ ] Método de validação: DNS
- [ ] Registro CNAME adicionado no DNS
- [ ] Certificado validado (Status: Issued)
- [ ] Certificado anexado ao CloudFront

### IAM User
- [ ] Usuário criado: `github-actions-wticket-frontend`
- [ ] Política personalizada criada e anexada
- [ ] Access Key criada
- [ ] Access Key ID copiado
- [ ] Secret Access Key copiado

---

## 🌐 NO DNS

- [ ] Registro CNAME/A criado:
  - **Name:** `wticket` (ou conforme seu domínio)
  - **Type:** CNAME (ou A se Route 53)
  - **Value:** CloudFront domain (ex: `d123.cloudfront.net`)

---

## 🔐 NO GITHUB

### Secrets Configurados
Acesse: https://github.com/salesthiago/wticket-frontend/settings/secrets/actions

- [ ] `AWS_ACCESS_KEY_ID` - Access key do IAM user
- [ ] `AWS_SECRET_ACCESS_KEY` - Secret key do IAM user
- [ ] `AWS_REGION` - Região do bucket (ex: `sa-east-1`)
- [ ] `S3_BUCKET_NAME` - Nome do bucket (ex: `wticket-frontend`)
- [ ] `CLOUDFRONT_DISTRIBUTION_ID` - ID da distribuição CloudFront
- [ ] `CLOUDFRONT_DOMAIN` - Seu domínio (ex: `wticket.godprovider.com.br`)

---

## 📂 NO REPOSITÓRIO LOCAL

- [ ] Arquivo `.github/workflows/deploy-frontend-s3.yml` criado
- [ ] Arquivo `S3-CLOUDFRONT-SETUP.md` criado
- [ ] Arquivos adicionados ao git (`git add`)
- [ ] Commit criado (`git commit`)
- [ ] Push realizado (`git push origin development`)

---

## 🧪 TESTES

- [ ] GitHub Actions rodou com sucesso
- [ ] Arquivos apareceram no bucket S3
- [ ] CloudFront cache foi invalidado
- [ ] Site abre com HTTPS: `https://wticket.godprovider.com.br`
- [ ] Cadeado verde no navegador
- [ ] Navegação entre rotas funciona (Angular routing)
- [ ] Console do navegador sem erros

---

## 📝 INFORMAÇÕES IMPORTANTES

### Onde encontrar cada informação:

| Informação | Onde encontrar |
|------------|----------------|
| S3 Bucket Name | S3 Console → Buckets |
| CloudFront Distribution ID | CloudFront Console → ID (ex: E123ABC) |
| CloudFront Domain | CloudFront Console → Domain name |
| Access Key ID | IAM → Users → Security credentials |
| Secret Access Key | ⚠️ Só aparece uma vez ao criar |
| Certificate ARN | ACM Console (us-east-1) |

### Comandos de verificação:

```bash
# Verificar DNS
nslookup wticket.godprovider.com.br

# Testar HTTPS
curl -I https://wticket.godprovider.com.br

# Listar arquivos no S3
aws s3 ls s3://wticket-frontend/

# Ver distribuições CloudFront
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,DomainName]"
```

---

## 🐛 PROBLEMAS COMUNS

### ❌ Deploy falha: "Access Denied"
**Solução:** Verifique permissões do usuário IAM

### ❌ Site retorna 403/404
**Solução:** Configure Error Pages no CloudFront

### ❌ SSL não funciona
**Solução:** Certificado deve estar em **us-east-1**

### ❌ Mudanças não aparecem
**Solução:** Invalidar cache do CloudFront:
```bash
aws cloudfront create-invalidation \
  --distribution-id SEU_ID \
  --paths "/*"
```

---

## 💡 DICAS

1. **CloudFront pode demorar 10-15 minutos** para criar/atualizar
2. **Certificado SSL leva até 30 minutos** para validar
3. **DNS pode demorar até 48h** para propagar (geralmente minutos)
4. **Sempre invalide o cache** após fazer deploy
5. **S3 + CloudFront é muito mais barato** que EC2 para frontend

---

## 🎯 ORDEM RECOMENDADA

1. ✅ Criar bucket S3
2. ✅ Solicitar certificado SSL (us-east-1)
3. ✅ Validar certificado via DNS
4. ✅ Criar distribuição CloudFront
5. ✅ Configurar Error Pages
6. ✅ Anexar certificado ao CloudFront
7. ✅ Configurar DNS
8. ✅ Criar usuário IAM
9. ✅ Configurar secrets no GitHub
10. ✅ Fazer push e testar

---

## ✅ TUDO PRONTO?

Se todos os itens estão marcados, seu frontend está pronto para deploy automático! 🎉

Próximo passo: Conectar frontend com backend via `https://api-wticket.godprovider.com.br`
