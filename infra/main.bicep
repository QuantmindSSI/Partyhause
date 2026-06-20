// main.bicep — PartyHause infrastructure
// Provisions: Resource Group, ACR, Container Apps Environment, Log Analytics,
// and two Container Apps (web PWA + API server) with managed identity

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Unique suffix for resource names')
param suffix string = uniqueString(resourceGroup().id)

// --- Log Analytics Workspace ---
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'log-partyhause-${suffix}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// --- Azure Container Registry ---
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: 'acrpartyhause${suffix}'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false
  }
}

// --- Container Apps Environment ---
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

// --- Web Container App (created via az containerapp create) ---
// module webApp 'modules/container-app.bicep' = {
//   name: 'webApp'
//   params: {
//     appName: 'ca-web-partyhause-${suffix}'
//     location: location
//     environmentId: cae.id
//     acrLoginServer: acr.properties.loginServer
//     acrId: acr.id
//     image: 'nginx:1.25-alpine'
//     targetPort: 80
//     envVars: [
//       {
//         name: 'VITE_SUPABASE_URL'
//         value: VITE_SUPABASE_URL
//       }
//       {
//         name: 'VITE_SUPABASE_ANON_KEY'
//         value: VITE_SUPABASE_ANON_KEY
//       }
//       {
//         name: 'VITE_APP_NAME'
//         value: 'PartyHause'
//       }
//       {
//         name: 'VITE_APP_URL'
//         value: 'https://ca-web-partyhause-${suffix}.${location}.azurecontainerapps.io'
//       }
//     ]
//   }
// }

// --- API Container App (created via az containerapp create) ---
// module apiApp 'modules/container-app.bicep' = {
//   name: 'apiApp'
//   params: {
//     appName: 'ca-api-partyhause-${suffix}'
//     location: location
//     environmentId: cae.id
//     acrLoginServer: acr.properties.loginServer
//     acrId: acr.id
//     image: 'node:18-slim'
//     targetPort: 3001
//     envVars: [
//       {
//         name: 'MAILERSEND_API_TOKEN'
//         value: MAILERSEND_API_TOKEN
//       }
//       {
//         name: 'MAILERSEND_FROM_EMAIL'
//         value: MAILERSEND_FROM_EMAIL
//       }
//       {
//         name: 'SUPABASE_URL'
//         value: SUPABASE_URL
//       }
//       {
//         name: 'SUPABASE_SERVICE_ROLE_KEY'
//         value: SUPABASE_SERVICE_ROLE_KEY
//       }
//     ]
//   }
// }

// --- Outputs ---
output webUrl string = 'https://ca-web-partyhause-${suffix}.${location}.azurecontainerapps.io'
output apiUrl string = 'https://ca-api-partyhause-${suffix}.${location}.azurecontainerapps.io'
output acrLoginServer string = acr.properties.loginServer
output acrName string = acr.name

// --- Parameters from environment ---
@description('Supabase URL')
param VITE_SUPABASE_URL string

@description('Supabase anon key')
param VITE_SUPABASE_ANON_KEY string

@description('MailerSend API token')
param MAILERSEND_API_TOKEN string

@description('MailerSend from email')
param MAILERSEND_FROM_EMAIL string

@description('Supabase service URL (server-side)')
param SUPABASE_URL string

@description('Supabase service role key')
param SUPABASE_SERVICE_ROLE_KEY string
