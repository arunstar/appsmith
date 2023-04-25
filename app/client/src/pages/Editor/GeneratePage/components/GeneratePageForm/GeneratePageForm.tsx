import React, { useEffect, useState, useCallback, useRef } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useSelector, useDispatch } from "react-redux";
import {
  getDatasources,
  getIsFetchingDatasourceStructure,
  getGenerateCRUDEnabledPluginMap,
  getIsFetchingSinglePluginForm,
  getDatasourcesStructure,
  getNumberOfEntitiesInCurrentPage,
} from "selectors/entitiesSelector";

import type { Datasource } from "entities/Datasource";
import { fetchDatasourceStructure } from "actions/datasourceActions";
import { generateTemplateToUpdatePage } from "actions/pageActions";
import { useParams, useLocation } from "react-router";
import type { ExplorerURLParams } from "@appsmith/pages/Editor/Explorer/helpers";
import { INTEGRATION_TABS } from "constants/routes";
import history from "utils/history";
import { getQueryParams } from "utils/URLUtils";
import { getIsGeneratingTemplatePage } from "selectors/pageListSelectors";
import DataSourceOption, { DatasourceImage } from "../DataSourceOption";
import { getQueryStringfromObject } from "RouteBuilder";
import type { DropdownOption } from "design-system-old";
import {
  // getTypographyByKey,
  IconSize,
  // TooltipComponent as Tooltip,
} from "design-system-old";
import { Button, Icon, Text, Select, Option, Tooltip } from "design-system";
import GoogleSheetForm from "./GoogleSheetForm";
import {
  GENERATE_PAGE_FORM_TITLE,
  createMessage,
  GEN_CRUD_DATASOURCE_DROPDOWN_LABEL,
} from "@appsmith/constants/messages";
import type { GenerateCRUDEnabledPluginMap } from "api/PluginApi";
import {
  useDatasourceOptions,
  useSheetsList,
  useSpreadSheets,
  useSheetColumnHeaders,
  useS3BucketList,
} from "./hooks";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { AppState } from "@appsmith/reducers";
import type {
  DropdownOptions,
  DatasourceTableDropdownOption,
} from "../constants";
import {
  PluginFormInputFieldMap,
  DEFAULT_DROPDOWN_OPTION,
  DROPDOWN_DIMENSION,
  ALLOWED_SEARCH_DATATYPE,
} from "../constants";
import { Bold, Label, SelectWrapper } from "./styles";
import type { GeneratePagePayload } from "./types";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import { getCurrentApplicationId } from "selectors/editorSelectors";

import {
  getFirstTimeUserOnboardingComplete,
  getIsFirstTimeUserOnboardingEnabled,
} from "selectors/onboardingSelectors";
import { datasourcesEditorIdURL, integrationEditorURL } from "RouteBuilder";
import { PluginPackageName } from "entities/Action";
import { getCurrentAppWorkspace } from "@appsmith/selectors/workspaceSelectors";
import { hasCreateDatasourcePermission } from "@appsmith/utils/permissionHelpers";
import { Icon as IconOld } from "design-system-old";
import { getPluginImages } from "selectors/entitiesSelector";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

//  ---------- Styles ----------

const RoundBg = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 16px;
  background-color: ${Colors.GRAY};
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 8px;
`;

const TooltipWrapper = styled.div`
  /* margin-top: 2px;
  margin-left: 6px; */
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 20px 0px;
  border: none;
`;

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  &&& .ads-v2-select.has-error {
    border: 1px solid var(--ads-old-color-pomegranate);
  }

  &&& .ads-v2-select.has-error .rc-select-selection-item {
    color: var(--ads-old-color-pomegranate);
  }

  &&& .ads-v2-select.has-error .rc-select-arrow {
    color: var(--ads-old-color-pomegranate);
  }
`;

const DescWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// const Title = styled.p`
//   font-weight: 500;
//   color: ${Colors.CODE_GRAY};
//   font-size: 24px;
// `;

const Row = styled.p`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  white-space: nowrap;
`;

const ErrorMsg = styled.span`
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  color: var(--ads-v2-color-fg-error);
  margin-top: var(--ads-spaces-3);
`;

const HelperMsg = styled.span`
  font-weight: normal;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: -0.221538px;
  color: var(--ads-v2-color-fg-muted);
  margin: 6px 0px 10px;
`;

const StyledIcon = styled(IconOld)``;

const StyledIconWrapper = styled.div`
  height: 20px;
  width: auto;
  display: flex;
  align-items: center;
  margin: 0px 8px 0px 0px;
`;

const OptionWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
`;
// Constants

const datasourceIcon = "tables";
const columnIcon = "column";

const GENERATE_PAGE_MODE = {
  NEW: "NEW", // a new page is created for the template. (new pageId created)
  REPLACE_EMPTY: "REPLACE_EMPTY", // current page's content (DSL) is updated to template DSL. (same pageId)
};

function GeneratePageSubmitBtn({
  disabled,
  isLoading,
  onSubmit,
  showSubmitButton,
}: {
  onSubmit: () => void;
  isLoading: boolean;
  showSubmitButton: boolean;
  disabled: boolean;
}) {
  return showSubmitButton ? (
    <Button
      data-cy="t--generate-page-form-submit"
      isDisabled={disabled}
      isLoading={isLoading}
      kind="secondary"
      onClick={() => !disabled && onSubmit()}
      size={"md"}
    >
      Generate Page
    </Button>
  ) : null;
}

enum GeneratePageSelectedViewIconEnum {
  PLUGIN_ICON = "plugin-icon",
  ADS_ICON = "ads-icon",
}

const DatasourceOptionSelectedView = (props: any) => {
  const { iconType, option, pluginImages } = props;
  return (
    <OptionWrapper>
      <StyledIconWrapper>
        {props.iconType === GeneratePageSelectedViewIconEnum.PLUGIN_ICON && (
          <DatasourceImage
            alt=""
            className="dataSourceImage"
            src={getAssetUrl(
              pluginImages[(option as DropdownOption)?.data?.pluginId],
            )}
          />
        )}
        {iconType === GeneratePageSelectedViewIconEnum.ADS_ICON && (
          <StyledIcon
            fillColor={option?.iconColor}
            hoverFillColor={option?.iconColor}
            name={option.icon}
            size={option.iconSize || IconSize.XL}
          />
        )}
      </StyledIconWrapper>
      <Text renderAs="p">{option.label} </Text>
    </OptionWrapper>
  );
};

// ---------- GeneratePageForm Component ----------

function GeneratePageForm() {
  const dispatch = useDispatch();
  const querySearch = useLocation().search;

  const { pageId: currentPageId } = useParams<ExplorerURLParams>();

  const pluginImages = useSelector(getPluginImages);

  const applicationId = useSelector(getCurrentApplicationId);
  const workspace = useSelector(getCurrentAppWorkspace);

  const datasources: Datasource[] = useSelector(getDatasources);
  const isGeneratingTemplatePage = useSelector(getIsGeneratingTemplatePage);
  const numberOfEntities = useSelector(getNumberOfEntitiesInCurrentPage);
  const currentMode = useRef(
    numberOfEntities > 0
      ? GENERATE_PAGE_MODE.NEW
      : GENERATE_PAGE_MODE.REPLACE_EMPTY,
  );

  const [datasourceIdToBeSelected, setDatasourceIdToBeSelected] =
    useState<string>("");
  const datasourcesStructure = useSelector(getDatasourcesStructure);

  const isFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const generateCRUDSupportedPlugin: GenerateCRUDEnabledPluginMap = useSelector(
    getGenerateCRUDEnabledPluginMap,
  );

  const [datasourceTableOptions, setSelectedDatasourceTableOptions] =
    useState<DropdownOptions>([]);

  const [selectedTableColumnOptions, setSelectedTableColumnOptions] =
    useState<DropdownOptions>([]);

  const [selectedDatasource, selectDataSource] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const [isSelectedTableEmpty, setIsSelectedTableEmpty] =
    useState<boolean>(false);

  const selectedDatasourcePluginId: string = selectedDatasource.data?.pluginId;
  const selectedDatasourcePluginPackageName: string =
    generateCRUDSupportedPlugin[selectedDatasourcePluginId];

  const isGoogleSheetPlugin =
    selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS;

  const isS3Plugin =
    selectedDatasourcePluginPackageName === PluginPackageName.S3;

  const isFetchingSheetPluginForm = useSelector((state: AppState) => {
    if (isGoogleSheetPlugin) {
      return getIsFetchingSinglePluginForm(
        state,
        selectedDatasource.data?.pluginId,
      );
    }
    return false;
  });

  const [selectedTable, selectTable] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const [selectedDatasourceIsInvalid, setSelectedDatasourceIsInvalid] =
    useState(false);

  const [selectedColumn, selectColumn] = useState<DropdownOption>(
    DEFAULT_DROPDOWN_OPTION,
  );

  const { bucketList, failedFetchingBucketList, isFetchingBucketList } =
    useS3BucketList();

  const isFirstTimeUserOnboardingEnabled = useSelector(
    getIsFirstTimeUserOnboardingEnabled,
  );
  const isFirstTimeUserOnboardingComplete = useSelector(
    getFirstTimeUserOnboardingComplete,
  );

  const onSelectDataSource = useCallback(
    (
      datasource: string | undefined,
      dataSourceObj: DropdownOption | undefined,
    ) => {
      if (
        datasource &&
        dataSourceObj &&
        selectedDatasource.id !== dataSourceObj.id
      ) {
        const pluginId: string = dataSourceObj.data.pluginId;
        const pluginPackageName: string = generateCRUDSupportedPlugin[pluginId];
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_DATASOURCE", {
          datasourceType: pluginPackageName,
        });
        selectDataSource(dataSourceObj);
        setSelectedDatasourceTableOptions([]);
        setSelectedTableColumnOptions([]);
        selectTable(DEFAULT_DROPDOWN_OPTION);
        selectColumn(DEFAULT_DROPDOWN_OPTION);
        setSelectedDatasourceIsInvalid(false);
        if (dataSourceObj.id) {
          switch (pluginPackageName) {
            case PluginPackageName.GOOGLE_SHEETS:
              break;
            default: {
              if (dataSourceObj.id) {
                dispatch(fetchDatasourceStructure(dataSourceObj.id, true));
              }
            }
          }
        }
      }
    },
    [
      generateCRUDSupportedPlugin,
      selectDataSource,
      setSelectedDatasourceTableOptions,
      setSelectedTableColumnOptions,
      selectTable,
      selectColumn,
      dispatch,
      setSelectedDatasourceIsInvalid,
      selectedDatasource,
      generateCRUDSupportedPlugin,
    ],
  );

  const onSelectTable = useCallback(
    (
      table: string | undefined,
      TableObj: DatasourceTableDropdownOption | undefined,
    ) => {
      if (table && TableObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_TABLE");
        selectTable(TableObj);
        selectColumn(DEFAULT_DROPDOWN_OPTION);
        if (!isGoogleSheetPlugin && !isS3Plugin) {
          const { data } = TableObj;

          if (Array.isArray(data.columns)) {
            if (data.columns.length === 0) setIsSelectedTableEmpty(true);
            else {
              if (isSelectedTableEmpty) setIsSelectedTableEmpty(false);
              const newSelectedTableColumnOptions: DropdownOption[] = [];
              data.columns.map((column) => {
                if (
                  column.type &&
                  ALLOWED_SEARCH_DATATYPE.includes(column.type.toLowerCase())
                ) {
                  newSelectedTableColumnOptions.push({
                    id: column.name,
                    label: column.name,
                    value: column.name,
                    subText: column.type,
                    icon: columnIcon,
                    iconSize: IconSize.LARGE,
                    iconColor: Colors.GOLD,
                  });
                }
              });
              setSelectedTableColumnOptions(newSelectedTableColumnOptions);
            }
          } else {
            setSelectedTableColumnOptions([]);
          }
        }
      }
    },
    [
      isSelectedTableEmpty,
      selectTable,
      setSelectedTableColumnOptions,
      selectColumn,
      setIsSelectedTableEmpty,
      isGoogleSheetPlugin,
      isS3Plugin,
    ],
  );

  const onSelectColumn = useCallback(
    (table: string | undefined, ColumnObj: DropdownOption | undefined) => {
      if (table && ColumnObj) {
        AnalyticsUtil.logEvent("GEN_CRUD_PAGE_SELECT_SEARCH_COLUMN");
        selectColumn(ColumnObj);
      }
    },
    [selectColumn],
  );

  const canCreateDatasource = hasCreateDatasourcePermission(
    workspace?.userPermissions || [],
  );

  const dataSourceOptions = useDatasourceOptions({
    canCreateDatasource,
    datasources,
    generateCRUDSupportedPlugin,
  });

  const spreadSheetsProps = useSpreadSheets({
    setSelectedDatasourceTableOptions,
    setSelectedDatasourceIsInvalid,
  });

  const sheetsListProps = useSheetsList();

  const sheetColumnsHeaderProps = useSheetColumnHeaders();

  useEffect(() => {
    if (isS3Plugin && bucketList && bucketList.length) {
      const tables = bucketList.map((bucketName) => ({
        id: bucketName,
        label: bucketName,
        value: bucketName,
        icon: datasourceIcon,
        iconSize: IconSize.LARGE,
        iconColor: Colors.BURNING_ORANGE,
      }));
      setSelectedDatasourceTableOptions(tables);
    }
  }, [bucketList, isS3Plugin, setSelectedDatasourceTableOptions]);

  useEffect(() => {
    if (
      selectedDatasource.id &&
      selectedDatasource.value &&
      !isFetchingDatasourceStructure
    ) {
      // when finished fetching datasource structure
      const selectedDatasourceStructure =
        datasourcesStructure[selectedDatasource.id] || {};

      const hasError = selectedDatasourceStructure?.error;

      if (hasError) {
        setSelectedDatasourceIsInvalid(true);
      } else {
        setSelectedDatasourceIsInvalid(false);
        const tables = selectedDatasourceStructure?.tables;
        if (tables) {
          const newTables = tables.map(({ columns, name }) => ({
            id: name,
            label: name,
            value: name,
            icon: datasourceIcon,
            iconSize: IconSize.LARGE,
            iconColor: Colors.BURNING_ORANGE,
            data: {
              columns,
            },
          }));
          setSelectedDatasourceTableOptions(newTables);
        }
      }
    }
  }, [
    datasourcesStructure,
    selectedDatasource,
    isFetchingDatasourceStructure,
    setSelectedDatasourceIsInvalid,
    setSelectedDatasourceTableOptions,
  ]);

  useEffect(() => {
    // If there is any datasource id passed in queryParams which needs to be selected
    if (datasourceIdToBeSelected) {
      if (selectedDatasource.id !== datasourceIdToBeSelected) {
        for (let i = 0; i < dataSourceOptions.length; i++) {
          if (dataSourceOptions[i].id === datasourceIdToBeSelected) {
            onSelectDataSource(
              dataSourceOptions[i].value,
              dataSourceOptions[i],
            );
            setDatasourceIdToBeSelected("");
            break;
          }
        }
      }
    }
  }, [
    dataSourceOptions,
    datasourceIdToBeSelected,
    onSelectDataSource,
    setDatasourceIdToBeSelected,
  ]);

  useEffect(() => {
    if (querySearch) {
      const queryParams = getQueryParams();
      const datasourceId = queryParams.datasourceId;
      const generateNewPage = queryParams.new_page;
      if (datasourceId) {
        if (generateNewPage || numberOfEntities > 0) {
          currentMode.current = GENERATE_PAGE_MODE.NEW;
        } else {
          currentMode.current = GENERATE_PAGE_MODE.REPLACE_EMPTY;
        }
        setDatasourceIdToBeSelected(datasourceId);
        delete queryParams.datasourceId;
        delete queryParams.new_page;
        const redirectURL =
          window.location.pathname + getQueryStringfromObject(queryParams);
        history.replace(redirectURL);
      }
    }
  }, [numberOfEntities, querySearch, setDatasourceIdToBeSelected]);

  const routeToCreateNewDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_CREATE_NEW_DATASOURCE");
    history.push(
      integrationEditorURL({
        pageId: currentPageId,
        selectedTab: INTEGRATION_TABS.NEW,
        params: { isGeneratePageMode: "generate-page" },
      }),
    );
  };

  const generatePageAction = (data: GeneratePagePayload) => {
    let extraParams = {};
    if (data.pluginSpecificParams) {
      extraParams = {
        pluginSpecificParams: data.pluginSpecificParams,
      };
    }

    const payload = {
      applicationId: applicationId || "",
      pageId:
        currentMode.current === GENERATE_PAGE_MODE.NEW
          ? ""
          : currentPageId || "",
      columns: data.columns || [],
      searchColumn: data.searchColumn,
      tableName: data.tableName,
      datasourceId: selectedDatasource.id || "",
      mode: currentMode.current,
      ...extraParams,
    };

    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_FORM_SUBMIT");
    dispatch(generateTemplateToUpdatePage(payload));
    if (isFirstTimeUserOnboardingEnabled) {
      dispatch({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_APPLICATION_ID,
        payload: "",
      });
    }
    if (isFirstTimeUserOnboardingComplete) {
      dispatch({
        type: ReduxActionTypes.SET_FIRST_TIME_USER_ONBOARDING_COMPLETE,
        payload: false,
      });
    }
  };

  const handleFormSubmit = () => {
    const payload = {
      columns: [],
      searchColumn: selectedColumn.value,
      tableName: selectedTable.value || "",
    };
    generatePageAction(payload);
  };

  const goToEditDatasource = () => {
    AnalyticsUtil.logEvent("GEN_CRUD_PAGE_EDIT_DATASOURCE_CONFIG", {
      datasourceId: selectedDatasource.id,
    });
    const redirectURL = datasourcesEditorIdURL({
      pageId: currentPageId,
      datasourceId: selectedDatasource.id as string,
      params: { isGeneratePageMode: "generate-page" },
    });
    history.push(redirectURL);
  };

  // if the datasource has basic information to connect to db it is considered as a valid structure hence isValid true.
  const isValidDatasourceConfig = selectedDatasource.data?.isValid;

  const pluginField: {
    TABLE: string;
    COLUMN: string;
  } =
    selectedDatasourcePluginPackageName &&
    PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      ? PluginFormInputFieldMap[selectedDatasourcePluginPackageName]
      : PluginFormInputFieldMap.DEFAULT;

  let tableDropdownErrorMsg = "";

  const fetchingDatasourceConfigs =
    isFetchingDatasourceStructure ||
    (isFetchingBucketList && isS3Plugin) ||
    ((isFetchingSheetPluginForm || spreadSheetsProps.isFetchingSpreadsheets) &&
      isGoogleSheetPlugin);

  const fetchingDatasourceConfigError =
    selectedDatasourceIsInvalid ||
    !isValidDatasourceConfig ||
    (failedFetchingBucketList && isS3Plugin);

  if (!fetchingDatasourceConfigs) {
    if (datasourceTableOptions.length === 0) {
      tableDropdownErrorMsg = `Couldn't find any ${pluginField.TABLE}, Please select another datasource`;
    }
    if (fetchingDatasourceConfigError) {
      tableDropdownErrorMsg = `Failed fetching datasource structure, Please check your datasource configuration`;
    }
    if (isSelectedTableEmpty) {
      tableDropdownErrorMsg = `Couldn't find any columns, Please select table with columns.`;
    }
  }

  const showEditDatasourceBtn =
    !isFetchingDatasourceStructure &&
    (selectedDatasourceIsInvalid || !isValidDatasourceConfig) &&
    !!selectedDatasource.value;

  const showSearchableColumn =
    !!selectedTable.value &&
    PluginPackageName.S3 !== selectedDatasourcePluginPackageName;

  const showSubmitButton =
    selectedTable.value &&
    !showEditDatasourceBtn &&
    !fetchingDatasourceConfigs &&
    !fetchingDatasourceConfigError &&
    !!selectedDatasource.value;

  const submitButtonDisable =
    !selectedTable.value || !showSubmitButton || isSelectedTableEmpty;

  return (
    <div className="space-y-4">
      <Wrapper>
        <DescWrapper>
          <Text kind="heading-l" renderAs="h2">
            {GENERATE_PAGE_FORM_TITLE()}
          </Text>
        </DescWrapper>
      </Wrapper>
      <FormWrapper>
        <SelectWrapper className="space-y-2" width={DROPDOWN_DIMENSION.WIDTH}>
          <Label>{createMessage(GEN_CRUD_DATASOURCE_DROPDOWN_LABEL)}</Label>
          <Select
            data-testid="t--datasource-dropdown"
            onChange={(value) =>
              onSelectDataSource(
                value,
                dataSourceOptions.find((ds) => ds.value === value),
              )
            }
            style={{ width: DROPDOWN_DIMENSION.WIDTH }}
            value={
              selectedDatasource?.label !== DEFAULT_DROPDOWN_OPTION?.label
                ? {
                    key: selectedDatasource?.value,
                    label: (
                      <DatasourceOptionSelectedView
                        iconType={GeneratePageSelectedViewIconEnum.PLUGIN_ICON}
                        option={selectedDatasource}
                        pluginImages={pluginImages}
                      />
                    ),
                  }
                : selectedDatasource
            }
          >
            {dataSourceOptions.map((option) => {
              return (
                <Option key={option.value} value={option.value}>
                  <DataSourceOption
                    cypressSelector="t--datasource-dropdown-option"
                    extraProps={{ routeToCreateNewDatasource }}
                    key={(option as DropdownOption).id}
                    option={option}
                    optionWidth={DROPDOWN_DIMENSION.WIDTH}
                  />
                </Option>
              );
            })}
          </Select>
        </SelectWrapper>
        {selectedDatasource.value ? (
          <SelectWrapper className="space-y-2" width={DROPDOWN_DIMENSION.WIDTH}>
            <Label>
              Select {pluginField.TABLE} from{" "}
              <Bold>{selectedDatasource.label}</Bold>
            </Label>

            <Select
              className={tableDropdownErrorMsg ? "has-error" : ""}
              data-testid="t--table-dropdown"
              isDisabled={!!tableDropdownErrorMsg}
              isLoading={fetchingDatasourceConfigs}
              onChange={(value) =>
                onSelectTable(
                  value,
                  datasourceTableOptions.find(
                    (table) => table.value === value,
                  ) as DatasourceTableDropdownOption,
                )
              }
              value={
                selectedTable?.label !== DEFAULT_DROPDOWN_OPTION?.label
                  ? {
                      key: selectedTable?.value,
                      label: (
                        <DatasourceOptionSelectedView
                          iconType={GeneratePageSelectedViewIconEnum.ADS_ICON}
                          option={selectedTable}
                        />
                      ),
                    }
                  : selectedTable
              }
            >
              {datasourceTableOptions.map((table) => {
                return (
                  <Option key={table.value} value={table.value}>
                    <OptionWrapper>
                      <StyledIconWrapper>
                        <StyledIcon
                          fillColor={
                            tableDropdownErrorMsg
                              ? "var(--ads-v2-color-fg-error)"
                              : table?.iconColor
                          }
                          hoverFillColor={
                            tableDropdownErrorMsg
                              ? "var(--ads-v2-color-fg-error)"
                              : table?.iconColor
                          }
                          name={table.icon}
                          size={table.iconSize || IconSize.XL}
                        />
                      </StyledIconWrapper>
                      <Text renderAs="p">{table.label}</Text>
                    </OptionWrapper>
                  </Option>
                );
              })}
            </Select>
            {tableDropdownErrorMsg && (
              <ErrorMsg className="ads-dropdown-errorMsg">
                {tableDropdownErrorMsg}
              </ErrorMsg>
            )}
          </SelectWrapper>
        ) : null}
        {showEditDatasourceBtn && (
          <Button kind="secondary" onClick={goToEditDatasource} size={"md"}>
            Edit Datasource
          </Button>
        )}
        {!isGoogleSheetPlugin ? (
          <>
            {showSearchableColumn && (
              <SelectWrapper
                className="space-y-2"
                width={DROPDOWN_DIMENSION.WIDTH}
              >
                <Row>
                  Select a searchable {pluginField.COLUMN} from the
                  selected&nbsp;
                  {pluginField.TABLE}
                  <TooltipWrapper>
                    <Tooltip
                      content="Only string values are allowed for searchable column"
                      // hoverOpenDelay={200}
                    >
                      <RoundBg>
                        <Icon name="help" size="sm" />
                      </RoundBg>
                    </Tooltip>
                  </TooltipWrapper>
                </Row>
                <Select
                  data-testid="t--table-dropdown"
                  isDisabled={selectedTableColumnOptions.length === 0}
                  onChange={(value) =>
                    onSelectColumn(
                      value,
                      selectedTableColumnOptions.find(
                        (column) => column.value === value,
                      ),
                    )
                  }
                  value={
                    selectedColumn?.label !== DEFAULT_DROPDOWN_OPTION?.label
                      ? {
                          key: selectedColumn?.value,
                          label: (
                            <DatasourceOptionSelectedView
                              iconType={
                                GeneratePageSelectedViewIconEnum.ADS_ICON
                              }
                              option={selectedColumn}
                            />
                          ),
                        }
                      : selectedColumn
                  }
                >
                  {selectedTableColumnOptions.map((column) => {
                    return (
                      <Option key={column.value} value={column.value}>
                        <OptionWrapper>
                          <StyledIconWrapper>
                            <StyledIcon
                              fillColor={column?.iconColor}
                              hoverFillColor={column?.iconColor}
                              name={column.icon}
                              size={column.iconSize || IconSize.XL}
                            />
                          </StyledIconWrapper>
                          <Text renderAs="p">{column.label}</Text>
                        </OptionWrapper>
                      </Option>
                    );
                  })}
                </Select>
                <HelperMsg>
                  {selectedTableColumnOptions.length === 0
                    ? `* Optional (No searchable ${pluginField.COLUMN} to select)`
                    : "* Optional"}
                </HelperMsg>
              </SelectWrapper>
            )}
            <div className="mt-4">
              <GeneratePageSubmitBtn
                disabled={submitButtonDisable}
                isLoading={!!isGeneratingTemplatePage}
                onSubmit={handleFormSubmit}
                showSubmitButton={!!showSubmitButton}
              />
            </div>
          </>
        ) : (
          <GoogleSheetForm
            generatePageAction={generatePageAction}
            googleSheetPluginId={selectedDatasourcePluginId}
            renderSubmitButton={({
              disabled,
              isLoading,
              onSubmit,
            }: {
              onSubmit: () => void;
              disabled: boolean;
              isLoading: boolean;
            }) => (
              <GeneratePageSubmitBtn
                disabled={disabled}
                isLoading={!!isGeneratingTemplatePage || isLoading}
                onSubmit={onSubmit}
                showSubmitButton={!!showSubmitButton}
              />
            )}
            selectedDatasource={selectedDatasource}
            selectedSpreadsheet={selectedTable}
            sheetColumnsHeaderProps={sheetColumnsHeaderProps}
            sheetsListProps={sheetsListProps}
            spreadSheetsProps={spreadSheetsProps}
          />
        )}
      </FormWrapper>
    </div>
  );
}

export default GeneratePageForm;
