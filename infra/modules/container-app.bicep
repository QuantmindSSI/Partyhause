// modules/container-app.bicep — Reusable Container App module
// Provisions a Container App with system-assigned managed identity,
// ACR pull permissions, ingress, and health probes

@description('Container App name')
param appName string

@description('Azure region')
param location string

@description('Container Apps Environment ID')
param environmentId string

@description('ACR login server')
param acrLoginServer string

@description('ACR resource ID (for role assignment)')
param acrId string

@description('Full container image reference (e.g. acrpartyhause.azurecr.io/web:latest or nginx:alpine)')
param image string

@description('Target port for ingress')
param targetPort int

@description('Environment variables (non-secret values use `value`; secret values use `secretRef` matching a name in `secrets`)')
param envVars array = []

@description('''Create the AcrPull role assignment for the app's managed
identity. Default false: in the existing prod environment both app
identities already hold AcrPull via out-of-band assignments, and a
template-created duplicate of the same (principal, role, scope) triple
fails with RoleAssignmentExists. Set true when provisioning a fresh
environment.''')
param manageAcrPullAssignment bool = false

@description('Secrets exposed to the container app. Each item: { name: string, value: string }. Referenced from envVars via secretRef.')
param secrets array = []

@description('''Minimum replicas. Zero lets the app scale to nothing and
cold-start on the next request, which was measured at ~21s to first byte on
both tiers: far past the point a browser gives up, and the documented cause of
the Safari "cannot open page" reports 428afe1 tried to fix.

That fix was applied with `az containerapp update` and never written here, so
every `az deployment sub create` in deploy.yml silently reset it. Keep any
change to this value in the template, not on the live app.

Defaults to 1 so an unattended provision cannot reintroduce the cold start.
Pass 0 deliberately for non-production environments where idle cost matters
more than first-byte latency.''')
@minValue(0)
param minReplicas int = 1

@description('Maximum replicas.')
@minValue(1)
param maxReplicas int = 3

// --- Container App ---
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: appName
  location: location
  properties: {
    environmentId: environmentId
    configuration: {
      activeRevisionsMode: 'Single'
      secrets: secrets
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
        allowInsecure: false
        traffic: [
          {
            weight: 100
            latestRevision: true
          }
        ]
      }
      registries: [
        {
          server: acrLoginServer
          identity: 'system'
        }
      ]
    }
    template: {
      containers: [
        {
          name: appName
          image: image
          env: envVars
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
      scale: {
        minReplicas: minReplicas
        maxReplicas: maxReplicas
      }
    }
  }
  identity: {
    type: 'SystemAssigned'
  }
}

// --- AcrPull role assignment for system-assigned identity on ACR ---
resource acrResource 'Microsoft.ContainerRegistry/registries@2023-07-01' existing = {
  name: last(split(acrId, '/'))
  scope: resourceGroup()
}

resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (manageAcrPullAssignment) {
  name: guid(containerApp.id, 'AcrPull')
  properties: {
    principalId: containerApp.identity.principalId
    // subscriptionResourceId, not a bare /providers/ path (tenant-scope
    // lookups fail), and the AcrPull GUID VERIFIED against this tenant:
    //   az role definition list --name AcrPull
    // The widely-documented public-cloud constant (7f951ddb-4da3-...) does
    // not exist in this environment and failed every reprovision with
    // RoleDefinitionDoesNotExist.
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalType: 'ServicePrincipal'
  }
  scope: acrResource
}

// --- Outputs ---
output fqdn string = containerApp.properties.configuration.ingress.fqdn
output url string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output principalId string = containerApp.identity.principalId
