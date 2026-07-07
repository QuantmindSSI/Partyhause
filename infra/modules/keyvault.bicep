// modules/keyvault.bicep — Azure Key Vault for secrets
// Stores DB admin password, Resend API key, Web PubSub connection string, etc.

@description('Azure region')
param location string

@description('Key Vault name (3-24 chars, alphanumeric + hyphens, globally unique)')
param keyVaultName string

@description('Object ID of the deployer (current user/SP) to grant access policy')
param deployerObjectId string

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    accessPolicies: [
      {
        tenantId: subscription().tenantId
        objectId: deployerObjectId
        permissions: {
          keys: ['get', 'list', 'create', 'delete', 'purge']
          secrets: ['get', 'list', 'set', 'delete', 'purge']
          certificates: ['get', 'list', 'delete', 'purge']
        }
      }
    ]
    enableRbacAuthorization: false
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    publicNetworkAccess: 'Enabled'
  }
}

output keyVaultName string = keyVault.name
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
