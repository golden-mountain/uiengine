import React, { useState, useCallback } from "react";
import { Steps } from "antd";
import _ from "lodash";

export const CustomSteps = (props: any) => {
  const {
    stepList = [],
    onChange = _.noop,
    direction = 'horizontal',
    uinode,
  } = props
  const { Step } = Steps

  const [current, setCurent] = useState(0);
  const handleChange = useCallback((current) => {
    uinode.dataNode.updateData(current)
    console.log('uinode:', uinode)
    setCurent(current)
    onChange()
  }, [current])
  return (
    <Steps
      current={current}
      onChange={current => handleChange(current)}
      direction={direction}
    >
      {
        stepList.map((step: any, index: number) => {
          return <Step
            description={_.get(step, 'description', '')}
            icon={_.get(step, 'icon', null)}
            title={_.get(step, 'title', '')}
            key={_.get(step, 'key', index)}
          />
        })
      }
    </Steps>
  )
}
