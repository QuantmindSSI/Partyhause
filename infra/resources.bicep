// resources.bicep — All PartyHause resources deployed at resource group scope.
// Called from main.bicep (subscription scope) which creates the resource group.

@description('Azure region for all resources')
param location string

@description('Unique suffix for resource names')
param suffix string

@description('Environment tag')
param environmentTag string

// ===== Database (Cosmos DB for PostgreSQL) =====
@description('Administrator login for the PostgreSQL cluster')
param postgresAdminLogin string

@description('Administrator password for the PostgreSQL cluster (secure)')
@secure()
param postgresAdminPassword string

@description('Initial database name to create on the cluster')
param postgresDbName string

// ===== Email (Resend) =====
@description('Resend API key (secret, used by the API container to send email)')
@secure()
param RESEND_API_KEY string

@description('Resend from email (verified sending address)')
param RESEND_FROM_EMAIL string

// ===== Auth (Microsoft Entra External ID / Azure AD B2C) =====
@description('Entra External ID (B2C) tenant id')
param entraTenantId string

@description('Entra External ID (B2C) API app (server) client id')
param entraApiClientId string

@description('Entra External ID (B2C) API app client secret (secure)')
@secure()
param entraApiClientSecret string

@description('Entra External ID (B2C) SPA app (web) client id')
param entraSpaClientId string

@description('B2C user-flow signup-signin policy name (e.g. B2C_1_susi)')
param entraSignUpSignInPolicy string

@description('Object ID of the deployer granted Key Vault access')
param deployerObjectId string

// ===== Log Analytics Workspace =====
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-partyhause-${suffix}'
  location: location
  properties: {
    sku: { name: 'PerGB2018' }
    retentionInDays: 30
  }
}

// ===== Key Vault =====
module keyVault 'modules/keyvault.bicep' = {
  name: 'keyVault'
  params: {
    location: location
    keyVaultName: 'kvph${suffix}'
    deployerObjectId: deployerObjectId
  }
}

// ===== Azure Container Registry =====
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'acrpartyhause${suffix}'
  location: location
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: false }
}

// ===== Azure Database for PostgreSQL Flexible Server =====
// NOTE: Deployed in centralus because this subscription is restricted from
// provisioning PostgreSQL Flexible Server in eastus2/eastus. All other
// resources remain in eastus2. Cross-region latency within the same
// geography is negligible for this workload.
module postgres 'modules/postgres.bicep' = {
  name: 'postgres'
  params: {
    location: 'centralus'
    serverName: 'psqlph-${suffix}'
    administratorLogin: postgresAdminLogin
    administratorLoginPassword: postgresAdminPassword
    databaseName: postgresDbName
  }
}

// ===== Storage Account (Blob) =====
module storage 'modules/storage.bicep' = {
  name: 'storage'
  params: {
    location: location
    storageAccountName: 'stph${suffix}'
  }
}

// Existing storage account reference for listKeys
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: 'stph${suffix}'
}

// ===== Azure Web PubSub =====
module webPubSub 'modules/webpubsub.bicep' = {
  name: 'webPubSub'
  params: {
    location: location
    pubsubName: 'wps-partyhause-${suffix}'
  }
}

// ===== Container Apps Environment =====
resource cae 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'cae-partyhause-${suffix}'
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ===== Azure OpenAI (semantic event extraction for /api/ai) =====
// The API's extraction pipeline (server/lib/event-extraction.ts) uses this
// deployment when the AZURE_OPENAI_* env vars are present and falls back to
// deterministic heuristics otherwise. gpt-5-mini/GlobalStandard was chosen
// for structured JSON extraction: low latency, low cost, GA in eastus2.
resource openai 'Microsoft.CognitiveServices/accounts@2024-10-01' = {
  name: 'oai-partyhause-${suffix}'
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: 'oai-partyhause-${suffix}'
    publicNetworkAccess: 'Enabled'
  }
  tags: {
    environment: environmentTag
  }
}

resource openaiDeployment 'Microsoft.CognitiveServices/accounts/deployments@2024-10-01' = {
  parent: openai
  name: 'gpt-5-mini'
  sku: {
    name: 'GlobalStandard'
    capacity: 10 // thousands of tokens-per-minute
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-5-mini'
      version: '2025-08-07'
    }
  }
}

// ===== Web Container App (PWA served by nginx) =====
// NOTE: VITE_* variables are build-time only — Vite inlines them into the
// static bundle during `npm run build:web`. They are passed as --build-arg
// to `az acr build` in the CI/CD workflow (deploy.yml), NOT as runtime env
// vars here. The nginx container serves static files and does not read env
// vars at runtime.
module webApp 'modules/container-app.bicep' = {
  name: 'webApp'
  params: {
    appName: 'ca-web-partyhause-${suffix}'
    location: location
    environmentId: cae.id
    acrLoginServer: acr.properties.loginServer
    acrId: acr.id
    image: '${acr.properties.loginServer}/partyhause-web:latest'
    targetPort: 80
  }
}

// ===== API Container App (Express server) =====
module apiApp 'modules/container-app.bicep' = {
  name: 'apiApp'
  params: {
    appName: 'ca-api-partyhause-${suffix}'
    location: location
    environmentId: cae.id
    acrLoginServer: acr.properties.loginServer
    acrId: acr.id
    image: '${acr.properties.loginServer}/partyhause-api:latest'
    targetPort: 3001
    envVars: [
      { name: 'NODE_ENV', value: 'production' }
      { name: 'PORT', value: '3001' }
      { name: 'CORS_ALLOWED_ORIGINS', value: 'https://${webApp.outputs.fqdn}' }
      { name: 'POSTGRES_HOST', value: postgres.outputs.serverFqdn }
      { name: 'POSTGRES_PORT', value: '5432' }
      { name: 'POSTGRES_DB', value: postgresDbName }
      { name: 'POSTGRES_USER', value: postgresAdminLogin }
      { name: 'POSTGRES_PASSWORD', secretRef: 'postgres-password' }
      { name: 'DATABASE_URL', secretRef: 'database-url' }
      { name: 'AZURE_STORAGE_ACCOUNT', value: storage.outputs.storageAccountName }
      { name: 'AZURE_STORAGE_IMAGE_CONTAINER', value: storage.outputs.imageContainerName }
      { name: 'AZURE_STORAGE_BLOB_ENDPOINT', value: storage.outputs.primaryBlobEndpoint }
      { name: 'AZURE_STORAGE_CONNECTION_STRING', secretRef: 'storage-conn-str' }
      { name: 'WEBPUBSUB_ENDPOINT', value: webPubSub.outputs.endpoint }
      { name: 'WEBPUBSUB_CONNECTION_STRING', secretRef: 'webpubsub-connection-string' }
      { name: 'ENTRA_TENANT_ID', value: entraTenantId }
      { name: 'ENTRA_API_CLIENT_ID', value: entraApiClientId }
      { name: 'ENTRA_API_CLIENT_SECRET', secretRef: 'entra-api-client-secret' }
      { name: 'ENTRA_POLICY', value: entraSignUpSignInPolicy }
      { name: 'RESEND_API_KEY', secretRef: 'resend-api-key' }
      { name: 'RESEND_FROM_EMAIL', value: RESEND_FROM_EMAIL }
      { name: 'RESEND_FROM_NAME', value: 'PartyHause' }
      { name: 'AZURE_OPENAI_ENDPOINT', value: openai.properties.endpoint }
      { name: 'AZURE_OPENAI_DEPLOYMENT', value: openaiDeployment.name }
      { name: 'AZURE_OPENAI_API_KEY', secretRef: 'azure-openai-api-key' }
    ]
    secrets: [
      { name: 'postgres-password', value: postgresAdminPassword }
      { name: 'database-url', value: 'postgresql://${postgresAdminLogin}:${postgresAdminPassword}@${postgres.outputs.serverFqdn}:5432/${postgresDbName}?sslmode=require' }
      { name: 'storage-conn-str', value: 'DefaultEndpointsProtocol=https;AccountName=${storage.outputs.storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net' }
      { name: 'webpubsub-connection-string', value: webPubSub.outputs.primaryConnectionString }
      { name: 'entra-api-client-secret', value: entraApiClientSecret }
      { name: 'resend-api-key', value: RESEND_API_KEY }
      { name: 'azure-openai-api-key', value: openai.listKeys().key1 }
    ]
  }
}

// ===== Outputs =====
output webUrl string = 'https://ca-web-partyhause-${suffix}.${location}.azurecontainerapps.io'
output apiUrl string = 'https://ca-api-partyhause-${suffix}.${location}.azurecontainerapps.io'
output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name
output postgresFqdn string = postgres.outputs.serverFqdn
output postgresClusterName string = postgres.outputs.serverName
output storageAccountName string = storage.outputs.storageAccountName
output storageBlobEndpoint string = storage.outputs.primaryBlobEndpoint
output webPubSubEndpoint string = webPubSub.outputs.endpoint
output webPubSubName string = webPubSub.outputs.pubsubName
output keyVaultName string = keyVault.outputs.keyVaultName
output keyVaultUri string = keyVault.outputs.keyVaultUri
output containerAppsEnvName string = cae.name
