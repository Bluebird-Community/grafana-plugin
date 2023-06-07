import { DatasourceMetadata, DsType } from './types'
import { getDatasourceTypeFromPluginId } from './utils'

// Parse the Dashboard '__requires' section, extracting any Datasource mappings and
// updating those items to use Version 9 versions

// The 'name' is the name of the variable which may be used elsewhere in queries
// The 'pluginId' should be the datasource ID
// We convert this to use the Version 9 versions, plus save off the variable in the map
// to substitute elsewhere
//
// "__requires": [
//   {
//     "type": "datasource",
//     "id": "opennms-helm-performance-datasource",
//     "name": "OpenNMS Performance",
//     "version": "1.0.0"
//   }
// ]
export const parseRequires = (source: any[], datasourceMap: Map<string,DsType>, dsMetas: DatasourceMetadata[]) => {
  const results: any[] = []

  for (const s of source) {
    if (s.type === 'datasource' && s.id && s.id.startsWith('opennms-')) {
      const target = { ...s }
      const name = s.name
      const pluginId = s.id

      if (name && pluginId) {
        // find corresponding v9 datasource info and substitute
        const { datasourceType } = getDatasourceTypeFromPluginId(pluginId)
        let dsMeta = dsMetas.find(d => d.datasourceType && d.datasourceType === datasourceType && d.pluginVersion === 9)

        if (!dsMeta) {
          console.log(`Dashboard convert: did not find Version 9 datasource for '${datasourceType}', falling back to first available:`)
          dsMeta = dsMetas.find(d => d.datasourceType && d.datasourceType === datasourceType)
        }

        if (dsMeta) {
          target.id = dsMeta.type
          target.name = dsMeta.name
          target.version = dsMeta.version

          results.push(target)
          continue
        }
      }
    }

    // was not an OpenNms datasource, or we couldn't find a substitute, so just pass it through
    results.push(s)
  }

  return results
}
