import { SourceDatasourceInfo } from './datasources';
import { DatasourceMetadata, DsType } from './types'

// add 'name', '$name' and '${name}' variations
export const addVariationsToMap = (varName: string, dsType: DsType,  datasourceMap: Map<string,DsType>) => {
  const rawName = varName.replace(/[${}]/gi, '')

  datasourceMap.set(rawName, dsType)
  datasourceMap.set('$' + rawName, dsType)
  datasourceMap.set('${' + rawName + '}', dsType)
}

// returns a string which is one of the DsTypes or else empty string, and
// whether this is a "legacy" datasource or not (legacy is version < 9)
export const getDatasourceTypeFromPluginId = (pluginId: string) => {
  const legacyMatch = pluginId.match(/^opennms-helm-([^-]+)-datasource$/i)

  if (legacyMatch && legacyMatch.length > 0) {
    return {
      isLegacy: true,
      datasourceType: legacyMatch[1]
    }
  }

  const m = pluginId.match(/^opennms-([^-]+)-datasource$/i)

  if (m && m.length > 0) {
    return {
      isLegacy: false,
      datasourceType: m[1]
    }
  }

  return {
    isLegacy: false,
    datasourceType: ''
  }
}

export const getDashboardTitle = (json: string) => {
  try {
    const dashboard = JSON.parse(json)
    return dashboard?.title || ''
  } catch {
  }

  return ''
}

// Checks if the datasource for a source (panel, panel target, etc.) is an OpenNMS one and if so,
// updates the type and uid
// Will retain the original uid if it's a template variable, e.g. pointing to a datasource in '__inputs'.
// sourceDsInfo is from calling getSourceDatasourceInfo(source, datasourceMap)
// source may be a panel, panel.target, etc. which contains a 'datasource' field
export const updateTargetDatasource = (source: any, sourceDsInfo: SourceDatasourceInfo, dsMetas: DatasourceMetadata[]) => {
  if (sourceDsInfo.isOpenNmsDatasource && sourceDsInfo.datasourceType) {
    const dsMeta = dsMetas.find(d => d.datasourceType === sourceDsInfo.datasourceType && d.pluginVersion === 9)

    if (dsMeta) {
      // retain the uid if it's a template variable
      const dsUid = sourceDsInfo.isTemplateVariable && !!source.datasource.uid ? source.datasource.uid : dsMeta.uid

      source.datasource = {
        type: dsMeta.type,
        uid: dsUid
      }
    }
  }
}
