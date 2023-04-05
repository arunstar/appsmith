import React from "react";
import { NumberInput } from "design-system";

import type { ControlData, ControlProps } from "./BaseControl";
import BaseControl from "./BaseControl";
import { emitInteractionAnalyticsEvent } from "utils/AppsmithUtils";

export interface NumericInputControlProps extends ControlProps {
  propertyValue: string;
  min?: number;
  max?: number;
  minorStepSize?: number | null;
  majorStepSize?: number | null;
  placeholderText?: string;
  stepSize?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}
class NumericInputControl extends BaseControl<NumericInputControlProps> {
  inputElement: HTMLInputElement | null;

  constructor(props: NumericInputControlProps) {
    super(props);
    this.inputElement = null;
  }

  static getControlType() {
    return "NUMERIC_INPUT";
  }

  handleKeydown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      emitInteractionAnalyticsEvent(this.inputElement, {
        key: `${e.shiftKey ? "Shift+" : ""}${e.key}`,
      });
    }
  };

  public render() {
    const {
      // majorStepSize,
      max,
      min,
      // minorStepSize,
      onBlur,
      onFocus,
      placeholderText,
      propertyValue,
      stepSize,
    } = this.props;
    return (
      <NumberInput
        //@ts-expect-error: Type mismatch
        max={max}
        min={min}
        onBlur={onBlur}
        onChange={this.handleValueChange}
        onFocus={onFocus}
        placeholder={placeholderText}
        //@ts-expect-error: Type mismatch
        ref={(element) => {
          this.inputElement = element;
        }}
        scale={stepSize}
        value={parseInt(propertyValue)}
      />
    );
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return !isNaN(Number(value));
  }

  private handleValueChange = (value: number) => {
    // Update the propertyValue
    this.updateProperty(
      this.props.propertyName,
      value.toString(),
      document.activeElement === this.inputElement,
    );
  };
}

export default NumericInputControl;
