import React from 'react'
import styled from 'styled-components'

interface OnSelectChartProps {
  onSelectChart: (value: string) => void
}

function SelectChart({onSelectChart}) {
  const handleSelectChart = (e) => {
    const value = e.target.value
    onSelectChart(value)
  }
  
  return (
    <StyledSelectChart onChange={handleSelectChart}>
      <option value="bar">
        bar
      </option>
      <option value="pie">
        pie
      </option>
      <option value = 'doughnut'>
        doughnut
      </option>

    </StyledSelectChart>
  )
}

export default SelectChart

const StyledSelectChart = styled.select`
  width: 120px;
  height: 30px;
  font-size: 20px;
  text-align: center;
`