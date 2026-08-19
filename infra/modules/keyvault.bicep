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
    // Guard against an unset AZURE_DEPLOYER_OBJECT_ID secret: an empty
    // objectId makes the whole vault write fail with BadRequest ("Invalid
    // value found at accessPolicies[0].ObjectId"), which took the entire
    // provision job down. No id -> no policy, vault still deploys.
    accessPolicies: empty(deployerObjectId) ? [] : [
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
