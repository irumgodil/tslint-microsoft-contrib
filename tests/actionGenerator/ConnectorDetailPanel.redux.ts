import { panelActionTypes } from 'common/features/panel/panel.redux';
import {
    combineStates,
    createActionTypes,
    createImmutableMap,
    createSelector,
    createStateField,
    IImmutableMap,
    InferReducer
} from 'common/redux';
import { AppState } from 'common/state';
import { microsoftSearchReducer } from 'microsoft-search/Reducer';
import { DatasetActions, DatasetEditState } from '../ConnectorStateEnums';
import { DatasetDetail, DatasetStatisticsResponse, DataSetStatusResponse, GCSApiError, IDetailsPanelConnectorData } from '../models';
export const connectorDetailPanelActionTypes = createActionTypes(
    {
        OpenConnectorDetailPanel: 'OpenConnectorDetailPanel',
        SetLoadingDetails: 'SetLoadingDetails',
        SetDetailsActionError: 'SetDetailsActionError',
        ShowActionWarning: 'ShowActionWarning',
        SetDetailsLoadError: 'SetDetailsLoadError',
        SetActionInProgress: 'SetActionInProgress',
        EnableAutoRefreshAction: 'EnableAutoRefreshAction',
        test: test
    },
    __filename
);
export const OpenConnectorDetailPanelAction = (detailsData: IDetailsPanelConnectorData) => {
    return {
        type: connectorDetailPanelActionTypes.OpenConnectorDetailPanel,
        payload: detailsData
    };
};
export const setDetailsActionError = (isError: boolean, err?: IImmutableMap<GCSApiError>) => {
    return {
        type: connectorDetailPanelActionTypes.SetDetailsActionError,
        payload: {
            isError,
            err
        }
    };
};
export const SetShowActionWarning = (showActionWarningDialog: boolean, action: DatasetActions) => {
    return {
        type: connectorDetailPanelActionTypes.ShowActionWarning,
        payload: {
            showActionWarningDialog,
            action
        }
    };
};
export const setDetailsLoadError = (isError: boolean, err?: IImmutableMap<GCSApiError>) => {
    return {
        type: connectorDetailPanelActionTypes.SetDetailsLoadError,
        payload: {
            isError,
            err
        }
    };
};
export const setDetailsActionInProgress = (inProgress: boolean) => {
    return {
        type: connectorDetailPanelActionTypes.SetActionInProgress,
        payload: inProgress
    };
};
export const setLoadingDetails = (isLoading: boolean) => {
    return {
        type: connectorDetailPanelActionTypes.SetLoadingDetails,
        payload: isLoading
    };
};
const showActionWarning = createStateField(false, {
    [connectorDetailPanelActionTypes.ShowActionWarning]: (_: boolean, action: ReturnType<typeof SetShowActionWarning>) => {
        return action.payload.showActionWarningDialog;
    }
});
const actionToConfirm = createStateField(DatasetActions.None, {
    [connectorDetailPanelActionTypes.ShowActionWarning]: (_: DatasetActions, action: ReturnType<typeof SetShowActionWarning>) => {
        return action.payload.action;
    }
});
const detailsLoadingError = createStateField(false, {
    [connectorDetailPanelActionTypes.SetDetailsLoadError]: (_: boolean, action: ReturnType<typeof setDetailsLoadError>) => {
        return action.payload.isError;
    },
    [connectorDetailPanelActionTypes.OpenConnectorDetailPanel]: (_: boolean) => {
        return false;
    }
});
const gcsApiErrorDetail = createStateField(createImmutableMap({} as GCSApiError), {
    [connectorDetailPanelActionTypes.SetDetailsLoadError]: (
        state: IImmutableMap<GCSApiError>,
        action: ReturnType<typeof setDetailsLoadError>
    ) => {
        if (action.payload.err) {
            return action.payload.err;
        }
        return state;
    },
    [connectorDetailPanelActionTypes.SetDetailsActionError]: (
        state: IImmutableMap<GCSApiError>,
        action: ReturnType<typeof setDetailsActionError>
    ) => {
        if (action.payload.err) {
            return action.payload.err;
        }
        return state;
    }
});
export const EnableAutoRefreshAction = (isEnabled: boolean) => {
    return {
        type: connectorDetailPanelActionTypes.EnableAutoRefreshAction,
        payload: isEnabled
    };
};
const errorOnAction = createStateField(false, {
    [connectorDetailPanelActionTypes.SetDetailsActionError]: (_: boolean, action: ReturnType<typeof setDetailsActionError>) => {
        return action.payload.isError;
    },
    [connectorDetailPanelActionTypes.OpenConnectorDetailPanel]: (_: boolean) => {
        return false;
    }
});
const isLoadingDetails = createStateField(false, {
    [connectorDetailPanelActionTypes.SetLoadingDetails]: (_: boolean, action: ReturnType<typeof setLoadingDetails>) => {
        return action.payload;
    }
});
const actionInProgress = createStateField(false, {
    [connectorDetailPanelActionTypes.SetActionInProgress]: (_: boolean, action: ReturnType<typeof setDetailsActionInProgress>) => {
        return action.payload;
    }
});
const isOpen = createStateField(false, {
    [panelActionTypes.ClosePanel]: (_: boolean) => {
        return false;
    },
    [connectorDetailPanelActionTypes.OpenConnectorDetailPanel]: (_: boolean) => {
        return true;
    }
});
const connectorId = createStateField(null, {
    [connectorDetailPanelActionTypes.OpenConnectorDetailPanel]: (_: string, action: ReturnType<typeof OpenConnectorDetailPanelAction>) => {
        return action.payload.connectorId;
    },
    [panelActionTypes.ClosePanel]: (_: string) => {
        return null;
    }
});
const connectorEditState = createStateField(DatasetEditState.Draft, {
    [connectorDetailPanelActionTypes.OpenConnectorDetailPanel]: (
        _: DatasetEditState,
        action: ReturnType<typeof OpenConnectorDetailPanelAction>
    ) => {
        return action.payload.editState;
    },
    [panelActionTypes.ClosePanel]: (_: DatasetEditState) => {
        return DatasetEditState.Draft;
    }
});
const enabledAutoRefreshStatus = createStateField(true, {
    [connectorDetailPanelActionTypes.EnableAutoRefreshAction]: (_: boolean, action: ReturnType<typeof EnableAutoRefreshAction>) => {
        return action.payload;
    }
});
type ConnectorDetailPanelProps = {
    isOpen: InferReducer<typeof isOpen>;
    connectorId: InferReducer<typeof connectorId>;
    connectorEditState: InferReducer<typeof connectorEditState>;
    isLoadingDetails: InferReducer<typeof isLoadingDetails>;
    errorOnAction: InferReducer<typeof errorOnAction>;
    gcsApiErrorDetail: InferReducer<typeof gcsApiErrorDetail>;
    detailsLoadingError: InferReducer<typeof detailsLoadingError>;
    actionInProgress: InferReducer<typeof actionInProgress>;
    enabledAutoRefreshStatus: InferReducer<typeof enabledAutoRefreshStatus>;
    showActionWarning: InferReducer<typeof showActionWarning>;
    actionToConfirm: InferReducer<typeof actionToConfirm>;
};
const connectorDetailPanelReducer = combineStates<ConnectorDetailPanelProps>({
    isOpen: isOpen,
    connectorId: connectorId,
    connectorEditState: connectorEditState,
    isLoadingDetails: isLoadingDetails,
    detailsLoadingError: detailsLoadingError,
    errorOnAction: errorOnAction,
    gcsApiErrorDetail: gcsApiErrorDetail,
    actionInProgress: actionInProgress,
    enabledAutoRefreshStatus: enabledAutoRefreshStatus,
    showActionWarning: showActionWarning,
    actionToConfirm: actionToConfirm
});
microsoftSearchReducer.addSubStates({ connectorDetailPanel: connectorDetailPanelReducer });
export type ConnectorDetailPanelStates = IImmutableMap<ConnectorDetailPanelProps>;
/**
 *  Selectors
 */
const DatasetStatisticSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorList', 'selectedDataSet']),
    (dataset: IImmutableMap<DatasetDetail>) => dataset.get('datasetStatistics')
);
const DatasetStatusSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorList', 'selectedDataSet']),
    (dataset: IImmutableMap<DatasetDetail>) => dataset.get('datasetStatus')
);
export const isConnectorReadyToPublishSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorList', 'selectedDataSet']),
    (dataset: IImmutableMap<DatasetDetail>) =>
        dataset.get('datasetEditState') === DatasetEditState.Draft &&
        dataset.get('mashupSettings') &&
        !dataset.get('mashupSettings')!.isEmpty() &&
        dataset.get('refreshSetting') &&
        !dataset.get('refreshSetting')!.isEmpty()
);
export const CrawlStateSelector = createSelector(
    [DatasetStatusSelector],
    (datasetStats: IImmutableMap<DataSetStatusResponse> | undefined) =>
        // If we come to the .get value, the datasetStats has to be non-null && non-undefined
        datasetStats && datasetStats!.get('crawlState')
);
export const CrawlErrorCodeSelector = createSelector(
    [DatasetStatusSelector],
    (datasetStats: IImmutableMap<DataSetStatusResponse> | undefined) => {
        // If we come to the .get value, the datasetStats has to be non-null && non-undefined
        const crawlError = datasetStats && datasetStats!.get('errorCode');
        if (crawlError && crawlError !== '0') {
            return crawlError;
        }
        return undefined;
    }
);
export const CrawlErrorMessageSelector = createSelector(
    [DatasetStatusSelector, CrawlErrorCodeSelector],
    (datasetStats: IImmutableMap<DataSetStatusResponse> | undefined, crawlErrorCode: string | undefined) => {
        if (crawlErrorCode && datasetStats!.get('errorMessage')) {
            return datasetStats!.get('errorMessage');
        }
        return undefined;
    }
);
export const ActionToConfirmSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'actionToConfirm']),
    (action: DatasetActions) => action
);
export const ShowActionWarningSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'showActionWarning']),
    (showActionWarningValue: boolean) => showActionWarningValue
);
export const ActionErrorSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'errorOnAction']),
    (isError: boolean) => isError
);
export const DetailsErrorSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'detailsLoadingError']),
    (isError: boolean) => isError
);
export const CrawledItemsSelector = createSelector(
    [DatasetStatisticSelector],
    (datasetStats: IImmutableMap<DatasetStatisticsResponse> | undefined) =>
        // If we come to the .get value, the datasetStats has to be non-null && non-undefined
        datasetStats && datasetStats!.get('crawledItemsCount')
);
export const FailedItemsSelector = createSelector(
    [DatasetStatisticSelector],
    (datasetStats: IImmutableMap<DatasetStatisticsResponse> | undefined) =>
        // If we come to the .get value, the datasetStats has to be non-null && non-undefined
        datasetStats && datasetStats!.get('failedItemsCount')
);
export const TotalItemsToCrawlItemsSelector = createSelector(
    [DatasetStatisticSelector],
    (datasetStats: IImmutableMap<DatasetStatisticsResponse> | undefined) =>
        // If we come to the .get value, the datasetStats has to be non-null && non-undefined
        datasetStats && datasetStats!.get('totalItemsCount')
);
export const RemainingCrawlItemsSelector = createSelector(
    [CrawledItemsSelector, TotalItemsToCrawlItemsSelector],
    (CrawledItemCount: number | undefined, TotalItemCount: number | undefined) =>
        // If we come to the subtraction, the operands have to be non-null && non-undefined
        (CrawledItemCount && TotalItemCount && TotalItemCount - CrawledItemCount) || 0
);
export const isConnectorDetailsOpen = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'isOpen']),
    (open: boolean) => open
);
export const detailPaneSelectedConnectorId = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'connectorId']),
    (selectedConnectorId: string) => selectedConnectorId
);
export const detailPaneSelectedConnectorEditState = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'connectorEditState']),
    (editState: DatasetEditState) => {
        return editState;
    }
);
export const isLoadingDatasetSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'isLoadingDetails']),
    (isLoadingDatasetData: boolean) => {
        return isLoadingDatasetData;
    }
);
export const IsActionInProgress = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'actionInProgress']),
    (inProgress: boolean) => {
        return inProgress;
    }
);
export const isAutoRefreshEnabledSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'enabledAutoRefreshStatus']),
    (enabled: boolean) => enabled
);
export const gcsApiErrorDetailSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorDetailPanel', 'gcsApiErrorDetail']),
    (errorDetail: IImmutableMap<GCSApiError>) => errorDetail
);
