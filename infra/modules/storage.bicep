// modules/storage.bicep — Azure Storage Account + Blob container
// Replaces Supabase Storage (event-invites bucket).

@description('Azure region')
param location string

@description('Storage account name (lowercase, 3-24, globally unique)')
param storageAccountName string

@description('Blob container name for event invite images')
param imageContainerName string = 'event-invites'

@description('Container for user avatars / misc uploads')
param uploadsContainerName string = 'uploads'

resource storage 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_GRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true
    publicNetworkAccess: 'Enabled'
  }
}

resource imageContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storage.name}/default/${imageContainerName}'
  properties: {
    publicAccess: 'Blob'
  }
}

resource uploadsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  name: '${storage.name}/default/${uploadsContainerName}'
  properties: {
    publicAccess: 'None'
  }
}

output storageAccountName string = storage.name
output primaryBlobEndpoint string = storage.properties.primaryEndpoints.blob
output imageContainerName string = imageContainerName
output storageAccountId string = storage.id
