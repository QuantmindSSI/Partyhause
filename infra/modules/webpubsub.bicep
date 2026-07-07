// modules/webpubsub.bicep — Azure Web PubSub
// Replaces Supabase Realtime (postgres_changes channels) for live event/guest
// updates. The API server publishes change events; the web client subscribes.

@description('Azure region')
param location string

@description('Web PubSub resource name')
param pubsubName string

@description('Sku name')
param skuName string = 'Standard_S1'

@description('Unit count')
param unitCount int = 1

resource pubsub 'Microsoft.SignalRService/webPubSub@2023-02-01' = {
  name: pubsubName
  location: location
  sku: {
    name: skuName
    capacity: unitCount
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    tls: {
      clientCertEnabled: false
    }
    liveTraceConfiguration: {
      enabled: 'false'
    }
  }
}

output pubsubName string = pubsub.name
output pubsubId string = pubsub.id
output endpoint string = pubsub.properties.hostName
output primaryKey string = pubsub.listKeys().primaryKey
output primaryConnectionString string = pubsub.listKeys().primaryConnectionString
