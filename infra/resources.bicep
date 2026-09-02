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

// ===== Email (Azure Communication Services) =====
@description('Where Communication Services stores message content at rest')
@allowed([ 'United States', 'Europe', 'Australia', 'United Kingdom', 'Asia Pacific' ])
param emailDataLocation string = 'United States'

@description('Custom sending domain to provision (requires DNS verification before use)')
param emailCustomDomain string = 'partyhause.com'

@description('Public custom domain bound to the web Container App. Both the apex and the www host are permitted CORS origins, and the apex is the canonical base URL for links in outbound email.')
param publicDomain string = 'partyhause.com'

@description('Link the custom domain to the Communication Service. Only set true AFTER the domain shows Verified, otherwise the deployment fails.')
param linkCustomEmailDomain bool = false

// ===== Auth (application-issued JWT) =====
// The API signs and verifies its own HS256 tokens (server/routes/auth.ts).
// This is the signing key for every authenticated route. It MUST be declared
// here: Container Apps deployment is declarative, so a secret that exists only
// from an out-of-band `az containerapp` patch is deleted on the next
// provisioning run. If that happens the code falls back to a default string
// that is committed to the repository, and every account becomes forgeable.
@description('HS256 signing key for application-issued JWTs (secret)')
@secure()
param jwtSecret string

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
  // Admin user must stay enabled: azure/container-apps-deploy-action fetches
  // registry credentials via `az acr credential show` during app updates and
  // hard-fails without it ("Failed to retrieve credentials for container
  // registry"). Runtime image pulls still use managed-identity AcrPull.
  properties: { adminUserEnabled: true }
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
// ===== Email (Azure Communication Services) =====
// Replaces Resend. Transactional mail (verification, password reset, invites)
// is the product's core loop, so it runs on first-party Azure infrastructure
// rather than a third-party key pasted into env vars.
//
// Two domains are provisioned:
//   AzureManagedDomain  works the moment it is created, sends from
//                       DoNotReply@<guid>.azurecomm.net, needs no DNS. This is
//                       what makes email work immediately.
//   partyhause.com      CustomerManaged. Creating it generates the SPF/DKIM
//                       records that must be published on the domain before it
//                       can send. Until then it stays unlinked, because
//                       linking an unverified domain fails the deployment.
//
// Both resources are global; dataLocation pins where message content rests.
resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: 'acsmail-partyhause-${suffix}'
  location: 'global'
  properties: {
    dataLocation: emailDataLocation
  }
  tags: {
    environment: environmentTag
  }
}

resource azureManagedDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: 'AzureManagedDomain'
  location: 'global'
  properties: {
    domainManagement: 'AzureManaged'
    userEngagementTracking: 'Disabled'
  }
}

resource customEmailDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: emailCustomDomain
  location: 'global'
  properties: {
    domainManagement: 'CustomerManaged'
    userEngagementTracking: 'Disabled'
  }
}

// noreply@<custom domain>. Only usable once the domain is DNS-verified.
resource customDomainSender 'Microsoft.Communication/emailServices/domains/senderUsernames@2023-04-01' = {
  parent: customEmailDomain
  name: 'noreply'
  properties: {
    username: 'noreply'
    displayName: 'PartyHause'
  }
}

resource communicationService 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: 'acs-partyhause-${suffix}'
  location: 'global'
  properties: {
    dataLocation: emailDataLocation
    // The custom domain joins this list only after DNS verification; linking an
    // unverified domain is rejected by the resource provider.
    linkedDomains: linkCustomEmailDomain
      ? [ azureManagedDomain.id, customEmailDomain.id ]
      : [ azureManagedDomain.id ]
  }
  tags: {
    environment: environmentTag
  }
}

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
      // Both custom hostnames plus the container FQDN. The FQDN is kept so the
      // app is still reachable if a custom domain binding is ever removed;
      // dropping it would make the API unusable from the only URL that is
      // guaranteed to exist. Comma-separated: server/index.ts splits on comma.
      { name: 'CORS_ALLOWED_ORIGINS', value: 'https://${publicDomain},https://www.${publicDomain},https://${webApp.outputs.fqdn}' }
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
      { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
      { name: 'ENTRA_TENANT_ID', value: entraTenantId }
      { name: 'ENTRA_API_CLIENT_ID', value: entraApiClientId }
      { name: 'ENTRA_API_CLIENT_SECRET', secretRef: 'entra-api-client-secret' }
      { name: 'ENTRA_POLICY', value: entraSignUpSignInPolicy }
      // Azure Communication Services is the active email transport.
      { name: 'ACS_CONNECTION_STRING', secretRef: 'acs-connection-string' }
      // Sender address. Until partyhause.com is DNS-verified this resolves to
      // the Azure-managed domain, which sends immediately with no DNS setup.
      { name: 'ACS_SENDER_ADDRESS', value: linkCustomEmailDomain
          ? 'noreply@${emailCustomDomain}'
          : 'DoNotReply@${azureManagedDomain.properties.mailFromSenderDomain}' }
      { name: 'ACS_SENDER_DISPLAY_NAME', value: 'PartyHause' }
      // Resend retained as an explicit fallback while the ACS custom domain is
      // pending verification. The code prefers ACS when both are present.
      { name: 'RESEND_API_KEY', secretRef: 'resend-api-key' }
      { name: 'RESEND_FROM_EMAIL', value: RESEND_FROM_EMAIL }
      { name: 'RESEND_FROM_NAME', value: 'PartyHause' }
      { name: 'AZURE_OPENAI_ENDPOINT', value: openai.properties.endpoint }
      { name: 'AZURE_OPENAI_DEPLOYMENT', value: openaiDeployment.name }
      { name: 'AZURE_OPENAI_API_KEY', secretRef: 'azure-openai-api-key' }
      // Must support the gpt-5 family + max_completion_tokens; without it the
      // code's fallback default applies, but pinning here keeps infra explicit.
      // Newest GA version — previews get retired on short notice.
      { name: 'AZURE_OPENAI_API_VERSION', value: '2024-10-21' }
      // Base URL for links embedded in verification / password-reset emails.
      // Without it the API defaults to http://localhost:5173.
      // Canonical public domain, not the container FQDN: this string is what
      // recipients see in invitation, verification and password-reset links.
      { name: 'VITE_APP_URL', value: 'https://${publicDomain}' }
    ]
    secrets: [
      { name: 'postgres-password', value: postgresAdminPassword }
      // uriComponent(): raw passwords containing URL-reserved characters
      // ('#' in particular) truncate the URL at the fragment marker and fail
      // pg/Prisma parsing — prod DB access was broken by exactly this.
      { name: 'database-url', value: 'postgresql://${postgresAdminLogin}:${uriComponent(postgresAdminPassword)}@${postgres.outputs.serverFqdn}:5432/${postgresDbName}?sslmode=require' }
      { name: 'storage-conn-str', value: 'DefaultEndpointsProtocol=https;AccountName=${storage.outputs.storageAccountName};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net' }
      { name: 'webpubsub-connection-string', value: webPubSub.outputs.primaryConnectionString }
      { name: 'acs-connection-string', value: communicationService.listKeys().primaryConnectionString }
      { name: 'jwt-secret', value: jwtSecret }
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

// ===== Email outputs =====
// The DNS records below must be published on the custom domain before it can
// send. Re-run provisioning with linkCustomEmailDomain=true once verified.
output emailServiceName string = emailService.name
output communicationServiceName string = communicationService.name
output azureManagedSenderDomain string = azureManagedDomain.properties.mailFromSenderDomain
output azureManagedSenderAddress string = 'DoNotReply@${azureManagedDomain.properties.mailFromSenderDomain}'
output customEmailDomainName string = customEmailDomain.name
output customEmailDomainVerificationStates object = customEmailDomain.properties.verificationStates
output customEmailDomainVerificationRecords object = customEmailDomain.properties.verificationRecords
