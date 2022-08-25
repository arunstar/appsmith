import equal from "fast-deep-equal/es6";
import React from "react";

import BaseWidget, { WidgetProps } from "./BaseWidget";
import {
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
} from "constants/WidgetConstants";
import {
  getWidgetEvalValues,
  getIsWidgetLoading,
} from "selectors/dataTreeSelectors";
import {
  getMainCanvasProps,
  computeMainContainerWidget,
  getChildWidgets,
  getRenderMode,
  getMetaWidgetChildrenStructure,
  getMetaCanvasWidget,
} from "selectors/editorSelectors";
import { AppState } from "reducers";
import { useSelector } from "react-redux";
import { getWidget } from "sagas/selectors";
import {
  createCanvasWidget,
  createLoadingWidget,
} from "utils/widgetRenderUtils";
import { FlattenedWidgetProps } from "./constants";

const WIDGETS_WITH_CHILD_WIDGETS = ["LIST_WIDGET", "FORM_WIDGET"];

const getChildCanvasWidgets = (
  state: AppState,
  parentWidgetId: string,
  childCanvasWidgets: Record<string, FlattenedWidgetProps> = {},
) => {
  const { canvasWidgets } = state.entities;

  const parentWidget = canvasWidgets[parentWidgetId];
  parentWidget.children?.forEach((childId) => {
    childCanvasWidgets[childId] = canvasWidgets[childId];

    getChildCanvasWidgets(state, childId, childCanvasWidgets);
  });

  return childCanvasWidgets;
};

function withWidgetProps(WrappedWidget: typeof BaseWidget) {
  function WrappedPropsComponent(
    props: WidgetProps & { skipWidgetPropsHydration?: boolean },
  ) {
    const { children, skipWidgetPropsHydration, type, widgetId } = props;

    const canvasWidget = useSelector((state: AppState) =>
      getWidget(state, widgetId),
    );
    const mainCanvasProps = useSelector((state: AppState) =>
      getMainCanvasProps(state),
    );
    const renderMode = useSelector(getRenderMode);
    const metaCanvasWidget = useSelector(getMetaCanvasWidget(widgetId));

    const evaluatedWidget = useSelector((state: AppState) =>
      getWidgetEvalValues(
        state,
        canvasWidget?.widgetName || metaCanvasWidget?.widgetName,
      ),
    );
    const isLoading = useSelector((state: AppState) =>
      getIsWidgetLoading(
        state,
        canvasWidget?.widgetName || metaCanvasWidget?.widgetName,
      ),
    );
    const isMetaCanvasWidget = Boolean(metaCanvasWidget);
    const metaWidgetChildrenStructure = useSelector(
      getMetaWidgetChildrenStructure(widgetId, isMetaCanvasWidget),
      equal,
    );

    const childWidgets = useSelector((state: AppState) => {
      if (!WIDGETS_WITH_CHILD_WIDGETS.includes(type)) return undefined;
      return getChildWidgets(state, widgetId);
    }, equal);

    const childCanvasWidgets = useSelector((state: AppState) => {
      if (type === "LIST_WIDGET_V2") {
        return getChildCanvasWidgets(state, widgetId);
      }
    }, equal);

    let widgetProps: WidgetProps = {} as WidgetProps;

    if (!skipWidgetPropsHydration) {
      const canvasWidgetProps = (() => {
        if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
          return computeMainContainerWidget(canvasWidget, mainCanvasProps);
        }

        //if (isMetaCanvasWidget) return metaCanvasWidget;

        return evaluatedWidget
          ? createCanvasWidget(
              canvasWidget || metaCanvasWidget,
              evaluatedWidget,
            )
          : createLoadingWidget(canvasWidget);
      })();

      widgetProps = { ...canvasWidgetProps };
      /**
       * MODAL_WIDGET by default is to be hidden unless the isVisible property is found.
       * If the isVisible property is undefined and the widget is MODAL_WIDGET then isVisible
       * is set to false
       * If the isVisible property is undefined and the widget is not MODAL_WIDGET then isVisible
       * is set to true
       */
      widgetProps.isVisible =
        canvasWidgetProps.isVisible ??
        canvasWidgetProps.type !== "MODAL_WIDGET";

      if (
        props.type === "CANVAS_WIDGET" &&
        widgetId !== MAIN_CONTAINER_WIDGET_ID
      ) {
        widgetProps.rightColumn = props.rightColumn;
        widgetProps.bottomRow = props.bottomRow;
        widgetProps.minHeight = props.minHeight;
        widgetProps.shouldScrollContents = props.shouldScrollContents;
        widgetProps.canExtend = props.canExtend;
        widgetProps.parentId = props.parentId;
      } else if (widgetId !== MAIN_CONTAINER_WIDGET_ID) {
        widgetProps.parentColumnSpace = props.parentColumnSpace;
        widgetProps.parentRowSpace = props.parentRowSpace;
        widgetProps.parentId = props.parentId;

        // Form Widget Props
        widgetProps.onReset = props.onReset;
        if ("isFormValid" in props) widgetProps.isFormValid = props.isFormValid;
      }

      widgetProps.children = children;
      widgetProps.metaWidgetChildrenStructure = metaWidgetChildrenStructure;
      widgetProps.isLoading = isLoading;
      widgetProps.childWidgets = childWidgets;
      widgetProps.childCanvasWidgets = childCanvasWidgets;
    }

    //merging with original props
    widgetProps = { ...props, ...widgetProps, renderMode };

    // isVisible prop defines whether to render a detached widget
    if (widgetProps.detachFromLayout && !widgetProps.isVisible) {
      return null;
    }

    // We don't render invisible widgets in view mode
    if (renderMode === RenderModes.PAGE && !widgetProps.isVisible) {
      return null;
    }

    return <WrappedWidget {...widgetProps} />;
  }

  return WrappedPropsComponent;
}

export default withWidgetProps;
