// main.bicep — PartyHause infrastructure (Azure-native, post-Supabase migration)
// Subscription-scope orchestrator: creates the resource group, then delegates
// to resources.bicep (resource-group scope) which provisions:
//   - Log Analytics Workspace
//   - Key Vault (secrets)
//   - Azure Container Registry
//   - Cosmos DB for PostgreSQL cluster (replaces Supabase Postgres)
//   - Storage Account + Blob containers (replaces Supabase Storage)
//   - Azure Web PubSub (replaces Supabase Realtime)
//   - Container Apps Environment
//   - Web Container App (PWA, nginx)
//   - API Container App (Express) with managed identity + AcrPull
//
// Auth (Microsoft Entra External ID / Azure AD B2C) is configured out-of-band at
// the tenant level — see MIGRATION_STATUS.md. The API container receives the
// B2C tenant/client/audience ids as env vars to validate JWTs.

targetScope = 'subscription'

@description('Azure region for all resources')
param location string = 'eastus2'

@description('Resource group name (will be created)')
param resourceGroupName string = 'rg-partyhause-prod'

@description('Unique suffix for resource names')
param suffix string = uniqueString(subscription().id, resourceGroupName)

@description('Environment tag')
param environmentTag string = 'prod'

// ===== Database (Cosmos DB for PostgreSQL) =====
@description('Administrator login for the PostgreSQL cluster')
param postgresAdminLogin string = 'partyadmin'

@description('Administrator password for the PostgreSQL cluster (secure)')
@secure()
param postgresAdminPassword string

@description('Initial database name to create on the cluster')
param postgresDbName string = 'partyhause'

// ===== Email (Resend) =====
@description('Resend API key (secret, used by the API container to send email)')
@secure()
param RESEND_API_KEY string

@description('Resend from email (verified sending address)')
param RESEND_FROM_EMAIL string

// ===== Auth (Microsoft Entra External ID / Azure AD B2C) =====
@description('Entra External ID (B2C) tenant id')
param entraTenantId string = ''

@description('Entra External ID (B2C) API app (server) client id')
param entraApiClientId string = ''

@description('Entra External ID (B2C) API app client secret (secure)')
@secure()
param entraApiClientSecret string = ''

@description('Entra External ID (B2C) SPA app (web) client id')
param entraSpaClientId string = ''

@description('B2C user-flow signup-signin policy name (e.g. B2C_1_susi)')
param entraSignUpSignInPolicy string = 'B2C_1_susi'

@description('Object ID of the deployer (signed-in user/SP) granted Key Vault access. Run: az ad signed-in-user show --query id -o tsv')
param deployerObjectId string

// ===== Resource Group =====
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: {
    project: 'PartyHause'
    environment: environmentTag
    managedBy: 'bicep'
  }
}

// ===== All resources (RG scope) =====
module resources 'resources.bicep' = {
  name: 'partyhause-resources'
  scope: rg
  params: {
    location: location
    suffix: suffix
    environmentTag: environmentTag
    postgresAdminLogin: postgresAdminLogin
    postgresAdminPassword: postgresAdminPassword
    postgresDbName: postgresDbName
    RESEND_API_KEY: RESEND_API_KEY
    RESEND_FROM_EMAIL: RESEND_FROM_EMAIL
    entraTenantId: entraTenantId
    entraApiClientId: entraApiClientId
    entraApiClientSecret: entraApiClientSecret
    entraSpaClientId: entraSpaClientId
    entraSignUpSignInPolicy: entraSignUpSignInPolicy
    deployerObjectId: deployerObjectId
  }
}

// ===== Outputs =====
output resourceGroupName string = rg.name
output webUrl string = resources.outputs.webUrl
output apiUrl string = resources.outputs.apiUrl
output acrLoginServer string = resources.outputs.acrLoginServer
output acrName string = resources.outputs.acrName
output postgresFqdn string = resources.outputs.postgresFqdn
output postgresClusterName string = resources.outputs.postgresClusterName
output storageAccountName string = resources.outputs.storageAccountName
output storageBlobEndpoint string = resources.outputs.storageBlobEndpoint
output webPubSubEndpoint string = resources.outputs.webPubSubEndpoint
output webPubSubName string = resources.outputs.webPubSubName
output keyVaultName string = resources.outputs.keyVaultName
output keyVaultUri string = resources.outputs.keyVaultUri
output containerAppsEnvName string = resources.outputs.containerAppsEnvName
