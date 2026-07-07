// modules/postgres.bicep — Azure Database for PostgreSQL Flexible Server
// Replaces Supabase Postgres. PostgreSQL-compatible so existing SQL migrations
// can be reused with minimal changes.
//
// NOTE: Originally specified as Cosmos DB for PostgreSQL (serverGroupV2 / Citus),
// but that resource type is not available in the target subscription/region.
// Pivoted to Flexible Server — the closest available PostgreSQL-compatible
// managed offering. See MIGRATION_STATUS.md.

@description('Azure region')
param location string

@description('Server name (lowercase, 3-63, alphanumeric + hyphens)')
param serverName string

@description('PostgreSQL major version')
param postgresVersion string = '15'

@description('Administrator login')
param administratorLogin string

@description('Administrator password (secure)')
@secure()
param administratorLoginPassword string

@description('Initial database name to create')
param databaseName string

@description('Sku name (burstable for dev)')
param skuName string = 'Standard_B1ms'

@description('Storage size in GB')
param storageGB int = 64

@description('Enable public network access for dev')
param enablePublicNetworkAccess bool = true

resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2024-08-01' = {
  name: serverName
  location: location
  sku: {
    name: skuName
    tier: contains(skuName, 'B') ? 'Burstable' : (contains(skuName, 'D') ? 'GeneralPurpose' : 'MemoryOptimized')
  }
  properties: {
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorLoginPassword
    version: postgresVersion
    storage: {
      storageSizeGB: storageGB
    }
    network: {
      publicNetworkAccess: enablePublicNetworkAccess ? 'Enabled' : 'Disabled'
    }
    createMode: 'Default'
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource firewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2024-08-01' = {
  name: '${server.name}/AllowAllAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

resource db 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2024-08-01' = {
  name: '${server.name}/${databaseName}'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

output serverName string = server.name
output serverFqdn string = server.properties.fullyQualifiedDomainName
output administratorLogin string = administratorLogin
output databaseName string = databaseName
