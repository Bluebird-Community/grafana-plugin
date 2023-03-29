import React from 'react'
import { PanelOptionsEditorProps } from '@grafana/data'
import { Select } from '@grafana/ui'
import { AlarmGroups } from './constants'

interface Props extends PanelOptionsEditorProps<number> { }

export const AlarmGroupEditor: React.FC<Props> = ({ value, onChange }) => {
    return (
        <div>
            <Select options={[
                { ...AlarmGroups.Acknowledged },
                { ...AlarmGroups.Severity },
            ]}
                value={value}
                onChange={(e) => onChange(e.value)}
            />
        </div>
    )
}
