import {
    combineStates,
    createActionTypes,
    createImmutableList,
    createImmutableMap,
    createSelector,
    createStateField,
    IImmutableList,
    IImmutableMap,
    InferReducer,
    MDispatch
} from 'common/redux';
import { AppState } from 'common/state';
import { AddConnectorStates } from 'microsoft-search/connectors/addConnector-wizard/addConnectorWizard.redux';
import { microsoftSearchReducer } from 'microsoft-search/Reducer';
import { IContextualMenuItem } from 'office-ui-fabric-react';
import * as React from 'react';

import { connectorStepsReducerStates } from './addConnector-wizard/Steps/ConnectorSteps.redux';
import { deleteDataset, getDatasetDetails, getDatasetSummary, pauseDataset, publishDataset, resumeDataset } from './api';
import {
    closePanelAction,
    detailPaneSelectedConnectorEditState,
    detailPaneSelectedConnectorId,
    isLoadingDatasetSelector,
    OpenConnectorDetailPanelAction,
    setDetailsActionError,
    setDetailsActionInProgress,
    setDetailsLoadError,
    setLoadingDetails
} from './connectors-details/ConnectorDetailPanel.redux';
import { DatasetActions, DatasetEditState } from './ConnectorStateEnums';
import { DatasetDetail, DatasetSearchDefinition, DatasetSummary, IDetailsPanelConnectorData } from './models';
import { UDTStates } from './UDT/UDTConnector.redux';

export const connectorsListActionTypes = createActionTypes(
    {
        // change the loading spinner to loading
        ConnectorsAPIStart: 'ConnectorsAPIStart',

        // update the paging context
        // concatinate to connector state
        // if error, we populate the errorMessage
        ConnectorsApiFinished: 'ConnectorsApiFinished',

        // update the Connectors display list
        ConnectorsApiFinishedDisplay: 'ConnectorsApiFinishedDisplay',

        // obvious
        ListOnCompactModeChangedAction: 'ListOnCompactModeChangedAction',

        // update the commandbar
        // update selection state
        ListSelectionChangedAction: 'ListSelectionChangedAction',

        // To handle dispatch actions from commandbar click
        CommandBarItemInvokedAction: 'CommandBarItemInvokedAction',
        ListSearchInvokedAction: 'ListSearchInvokedAction',
        RefreshConnectorsList: 'RefreshConnectorsList',
        SetActiveConnector: 'SetActiveConnector',
        SetIsCompactMode: 'SetIsCompactMode',
        SetShownColumns: 'SetShownColumns',
        LoadingError: 'LoadingError',
        SetIsFetchingItems: 'SetIsFetchingItems',
        SetAddConnectorWizardOpenedAction: 'SetAddConnectorWizardOpenedAction',
        SetSelectedDataset: 'SetSelectedDataset',
        SetSelectedConnectorNavType: 'SetSelectedConnectorNavType'
    },
    __filename
);

export const refreshConnectorsListAction = () => {
    return {
        type: connectorsListActionTypes.RefreshConnectorsList
    };
};

export const connectorListOnCompactModeChangedAction = (isCompactList: boolean) => {
    return {
        type: connectorsListActionTypes.ListOnCompactModeChangedAction,
        payload: isCompactList
    };
};

export const connectorListSearchInvokedAction = (searchTerm: string) => {
    return {
        type: connectorsListActionTypes.ListSearchInvokedAction,
        payload: searchTerm
    };
};

const connectorsApiStartedAction = () => {
    return {
        type: connectorsListActionTypes.ConnectorsAPIStart
    };
};

export const connectorListSelectionChangedAction = (selectedConnectorKeys: string[]) => {
    return {
        type: connectorsListActionTypes.ListSelectionChangedAction,
        payload: {
            selectedConnectorKeys
        }
    };
};

export const setActiveConnectorAction = (connectorObj: IImmutableMap<DatasetSummary>) => {
    return {
        type: connectorsListActionTypes.SetActiveConnector,
        payload: connectorObj
    };
};

const setIsFetchingItemsAction = (state: boolean) => {
    return {
        type: connectorsListActionTypes.SetIsFetchingItems,
        payload: state
    };
};

const setShownColumnsAction = (columns: IImmutableList<string>) => {
    return {
        type: connectorsListActionTypes.SetShownColumns,
        payload: columns
    };
};

const connectorsApiFinishedAction = (
    payload: {
        connectorsData?: IImmutableList<IImmutableMap<DatasetSummary>>;
        pageToken?: string;
        error?: Error;
    },
    isError: boolean,
    err?: Error
) => {
    return {
        type: connectorsListActionTypes.ConnectorsApiFinished,
        payload: {
            error: err,
            ...payload
        },
        error: isError
    };
};

const connectorsApiFinishedActionDisplay = (
    payload: {
        connectorsList?: IImmutableList<IImmutableMap<DatasetSummary>>;
        searchTerm?: string;
        pageToken?: string;
        error?: Error;
    },
    isError: boolean,
    err?: Error
) => {
    return {
        type: connectorsListActionTypes.ConnectorsApiFinishedDisplay,
        payload: {
            error: err,
            ...payload
        },
        error: isError
    };
};

export const setSelectedConnectorNavTypeAction = (selectedNav: DatasetEditState) => {
    return {
        type: connectorsListActionTypes.SetSelectedConnectorNavType,
        payload: selectedNav
    };
};

const selectedDataSet = createStateField(createImmutableMap({} as DatasetDetail), {
    [connectorsListActionTypes.SetSelectedDataset]: (_: IImmutableMap<DatasetDetail>, action: ReturnType<typeof setSelectedDataset>) => {
        return action.payload;
    }
});

export const setSelectedDataset = (state: IImmutableMap<DatasetDetail>) => {
    return {
        type: connectorsListActionTypes.SetSelectedDataset,
        payload: state
    };
};

export const resetSelectedDataset = () => {
    return async (dispatch: MDispatch) => {
        dispatch(setSelectedDataset(createImmutableMap({} as DatasetDetail)));
    };
};

export const onDetailsLoadError = () => {
    return async (dispatch: MDispatch) => {
        dispatch(setDetailsLoadError(true));
        dispatch(setLoadingDetails(false));
    };
};

export const getDatasetDetailsData = (resetDataset: boolean) => {
    return async (dispatch: MDispatch, getState: () => AppState) => {
        try {
            let state = getState();

            // Only load if this is a new connector or there is no loading in progress, continue.
            if (resetDataset || !isLoadingDatasetSelector(state)) {
                if (resetDataset) {
                    // Reset selection, in case of manual-refresh or if there was a value from wizard, so that the loader shows
                    dispatch(resetSelectedDataset());
                }

                // Get last clicked Details pane Connector Data.
                let selectedDataSetId = detailPaneSelectedConnectorId(state);
                const selectedDataSetEditState = detailPaneSelectedConnectorEditState(state);

                // Set loading to be on
                dispatch(setLoadingDetails(true));

                // Request data
                const datasetDetails = await getDatasetDetails(selectedDataSetId, selectedDataSetEditState);

                if (datasetDetails) {
                    const datasetDetailsData = datasetDetails.get('datasetDetail');

                    // If App-state changed while data was being fetched to another connector, then do not update the dataset detail
                    // To Stale data.
                    state = getState();
                    selectedDataSetId = detailPaneSelectedConnectorId(state);

                    if (datasetDetailsData && datasetDetailsData.get('datasetId') === selectedDataSetId) {
                        dispatch(setSelectedDataset(datasetDetails.get('datasetDetail')));

                        // Only after the current dataset is loaded, mark loading off. This is because if another loading starts for another
                        // Connector, then we do not want other requests to come through in the middle.
                        dispatch(setLoadingDetails(false));
                        return;
                    }
                }

                dispatch(onDetailsLoadError());
            }
        } catch (err) {
            dispatch(onDetailsLoadError());
        }
    };
};

export const connectorListItemInvokedAction = (item: DatasetSummary, _index: number) => {
    return async (dispatch: MDispatch) => {
        if (!item) {
            return;
        }

        // open react panel and set selected Id first
        dispatch(
            OpenConnectorDetailPanelAction({
                connectorId: item.datasetId,
                editState: item.datasetEditState
            } as IDetailsPanelConnectorData)
        );
        dispatch(getDatasetDetailsData(true));
    };
};

// get connector list data when loadAllConnectors is set
export const dispatchSearchConnectorListData = (searchDefinition: DatasetSearchDefinition, loadAllConnectors: boolean) => {
    return async (dispatch: MDispatch, getState: () => AppState) => {
        try {
            dispatch(setIsFetchingItemsAction(true));
            dispatch(connectorsApiStartedAction());

            const searchTerm = searchDefinition.SearchString;

            // We are keeping 2 states, one for all-connectors returned from the server and one is the list to be displayed.
            // In case there is no search being done, call the API to set the 'allConnectors' value. Later use the value to find
            // Out all the connectors to be displayed
            if (loadAllConnectors) {
                const data = await getDatasetSummary();
                const connectorsData = data.get('datasetSummary');
                dispatch(connectorsApiFinishedAction({ connectorsData }, false));
            }

            const state = getState();
            const connectorsList = state.getIn(['microsoftSearch', 'connectorList', 'allConnectors']);

            dispatch(connectorsApiFinishedActionDisplay({ connectorsList, searchTerm }, false));
            dispatch(setIsFetchingItemsAction(false));
        } catch (err) {
            dispatch(setIsFetchingItemsAction(false));
            dispatch(connectorsApiFinishedAction({}, true, err));
        }
    };
};

export const dispatchSearchContextConnectorsData = (loadAllConnectors: boolean) => {
    return async (dispatch: MDispatch, getState: () => AppState) => {
        const state = getState();

        const searchTerm = state.getIn(['microsoftSearch', 'connectorList', 'searchString']);

        const searchDefinition: DatasetSearchDefinition = {
            SearchString: searchTerm
        };
        dispatch(dispatchSearchConnectorListData(searchDefinition, loadAllConnectors));
    };
};

export const isCompactMode = createStateField(false, {
    [connectorsListActionTypes.ListOnCompactModeChangedAction]: (
        _: boolean,
        action: ReturnType<typeof connectorListOnCompactModeChangedAction>
    ) => {
        return action.payload;
    }
});

const searchString = createStateField('', {
    [connectorsListActionTypes.ListSearchInvokedAction]: (_: string, action: ReturnType<typeof connectorListSearchInvokedAction>) => {
        return action.payload;
    }
});

const allConnectors = createStateField(createImmutableList([]), {
    [connectorsListActionTypes.RefreshConnectorsList]: () => {
        return createImmutableList([]);
    },
    [connectorsListActionTypes.ConnectorsApiFinished]: (
        state: IImmutableList<IImmutableMap<DatasetSummary>>,
        action: ReturnType<typeof connectorsApiFinishedAction>
    ) => {
        if (!action.error) {
            return state.withMutations((mutableState: IImmutableList<IImmutableMap<DatasetSummary>>) => {
                mutableState.clear();
                action.payload.connectorsData!.forEach((connector: IImmutableMap<DatasetSummary>) => {
                    mutableState.push(connector);
                });
            });
        }
        return state;
    }
});

const errorLoadingConnectorsReducer = createStateField(false, {
    [connectorsListActionTypes.RefreshConnectorsList]: () => {
        return false;
    },
    [connectorsListActionTypes.ConnectorsApiFinished]: (_state: boolean, action: ReturnType<typeof connectorsApiFinishedAction>) => {
        return action.error;
    }
});

const connectors = createStateField(createImmutableList([]), {
    [connectorsListActionTypes.RefreshConnectorsList]: () => {
        return createImmutableList([]);
    },
    [connectorsListActionTypes.ConnectorsApiFinishedDisplay]: (
        state: IImmutableList<IImmutableMap<DatasetSummary>>,
        action: ReturnType<typeof connectorsApiFinishedActionDisplay>
    ) => {
        const searchTerm = action.payload.searchTerm;
        if (!action.error) {
            // If there is no search term, then return the full list. Otherwise, do a client side search on the values.
            if (!searchTerm) {
                return action.payload.connectorsList;
            } else {
                return state.withMutations((mutableState: IImmutableList<IImmutableMap<DatasetSummary>>) => {
                    const lowerSearchTerm = searchTerm.toLocaleLowerCase();
                    mutableState = mutableState.clear();

                    action.payload.connectorsList!.forEach((connector: IImmutableMap<DatasetSummary>) => {
                        let foundSearchTerm = false;

                        // Search on name and description

                        const nameValue = connector.get('datasetName');
                        if (nameValue && nameValue.toLocaleLowerCase().indexOf(lowerSearchTerm) !== -1) {
                            foundSearchTerm = true;
                        } else {
                            const description = connector.get('description');
                            if (description && description.toLocaleLowerCase().indexOf(lowerSearchTerm) !== -1) {
                                foundSearchTerm = true;
                            }
                        }

                        if (foundSearchTerm) {
                            mutableState.push(connector);
                        }
                    });
                });
            }
        }
        return state;
    }
});

const isFetchingItems = createStateField(false, {
    [connectorsListActionTypes.SetIsFetchingItems]: (_: boolean, action: ReturnType<typeof setIsFetchingItemsAction>) => {
        return action.payload;
    }
});

const shownColumns = createStateField(
    createImmutableList(['ConnectorName', 'Publisher', 'LastSyncTime', 'LastModifiedBy', 'LastModifiedDateTime', 'Status']),
    {
        [connectorsListActionTypes.SetShownColumns]: (_: IImmutableList<string>, action: ReturnType<typeof setShownColumnsAction>) => {
            return action.payload;
        }
    }
);

export const setAddConnectorWizardOpenedAction = (state: boolean) => {
    return {
        type: connectorsListActionTypes.SetAddConnectorWizardOpenedAction,
        payload: state
    };
};

export const isAddConnectorWizardOpened = createStateField(false, {
    [connectorsListActionTypes.SetAddConnectorWizardOpenedAction]: (
        _: boolean,
        action: ReturnType<typeof setAddConnectorWizardOpenedAction>
    ) => {
        return action.payload;
    }
});

const selectedConnectorNavTypeReducer = createStateField(DatasetEditState.Published, {
    [connectorsListActionTypes.SetSelectedConnectorNavType]: (
        _: DatasetEditState,
        action: ReturnType<typeof setSelectedConnectorNavTypeAction>
    ) => {
        return action.payload;
    }
});

const selectedConnectorItemIds = createStateField(createImmutableList([]), {
    [connectorsListActionTypes.ListSelectionChangedAction]: (
        _: IImmutableList<string>,
        action: ReturnType<typeof connectorListSelectionChangedAction>
    ) => {
        return createImmutableList(action.payload.selectedConnectorKeys);
    }
});

// Need this for the ListFeatureFactory for mandatory fields, not needed in this control
export const defaultConnectorAction = () => {
    return () => {
        return;
    };
};

export const DefaultDatasetSearchDefinition: DatasetSearchDefinition = {
    SearchString: ''
};

export const componentDidMountAction = () => {
    return (dispatch: MDispatch) => {
        dispatch(dispatchSearchConnectorListData(DefaultDatasetSearchDefinition, true));
    };
};

// 1104414 - honor search in case of refresh.
export const refreshConnectorsData = () => {
    return (dispatch: MDispatch) => {
        dispatch(refreshConnectorsListAction());
        dispatch(dispatchSearchContextConnectorsData(true));
    };
};

export const commandBarItemsClickedAction = (
    _ev?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
    item?: IContextualMenuItem
) => {
    if (item && item.key) {
        switch (item.key) {
            case 'addConnector':
                return (dispatch: MDispatch) => {
                    dispatch(closePanelAction());
                    dispatch(resetSelectedDataset());
                    dispatch(setAddConnectorWizardOpenedAction(true));
                };
            case 'refreshList':
                return (dispatch: MDispatch) => {
                    dispatch(closePanelAction());
                    dispatch(refreshConnectorsData());
                };
            case 'selectionCount': // this is hiding bug in listFeatureFactory when you clear selected state row doesnt re-render.
                return (dispatch: MDispatch) => {
                    dispatch(closePanelAction());
                    dispatch(refreshConnectorsListAction());
                    dispatch(dispatchSearchContextConnectorsData(false));
                };
            case 'normalList':
                return (dispatch: MDispatch) => {
                    dispatch(closePanelAction());
                    dispatch(connectorListOnCompactModeChangedAction(false));
                };
            case 'compactList':
                return (dispatch: MDispatch) => {
                    dispatch(closePanelAction());
                    dispatch(connectorListOnCompactModeChangedAction(true));
                };
        }
    }
    return { type: connectorsListActionTypes.CommandBarItemInvokedAction };
};

export const actOnConnector = (datasetId: string, action: DatasetActions) => {
    return async (dispatch: MDispatch) => {
        dispatch(setDetailsActionInProgress(true));

        // Reset error (note this will only change action error, not crawling).
        dispatch(setDetailsActionError(false));
        try {
            if (action === DatasetActions.Delete) {
                await deleteDataset(datasetId);
                dispatch(refreshConnectorsData());
                dispatch(closePanelAction());
            } else if (action === DatasetActions.Pause) {
                await pauseDataset(datasetId);
            } else if (action === DatasetActions.Resume) {
                await resumeDataset(datasetId);
            } else if (action === DatasetActions.Publish) {
                await publishDataset(datasetId);
                dispatch(refreshConnectorsData());
                dispatch(closePanelAction());
            }
        } catch (err) {
            dispatch(setDetailsActionError(true));
        }
        dispatch(setDetailsActionInProgress(false));
    };
};

type ConnectorListProps = {
    allConnectors: InferReducer<typeof allConnectors>;
    connectors: InferReducer<typeof connectors>;
    isCompactMode: InferReducer<typeof isCompactMode>;
    searchString: InferReducer<typeof searchString>;
    selectedConnectorItemIds: InferReducer<typeof selectedConnectorItemIds>;
    shownColumns: InferReducer<typeof shownColumns>;
    isFetchingItems: InferReducer<typeof isFetchingItems>;
    isAddConnectorWizardOpened: InferReducer<typeof isAddConnectorWizardOpened>;
    udtStates: UDTStates;
    addConnectorWizard: AddConnectorStates;
    connectorStepsReducer: connectorStepsReducerStates;
    selectedDataSet: InferReducer<typeof DatasetDetail>;
    selectedConnectorNavTypeReducer: InferReducer<typeof selectedConnectorNavTypeReducer>;
    errorLoadingConnectorsReducer: InferReducer<typeof errorLoadingConnectorsReducer>;
};
export type ConnectorListStates = IImmutableMap<ConnectorListProps>;

// TODO 1114523: Separate out connectorListReducer and connectorsReducer
export const connectorListReducer = combineStates<ConnectorListProps>({
    // when API come back, it needs to be appened to the connector
    allConnectors,
    connectors,
    isCompactMode,
    isFetchingItems,
    selectedConnectorItemIds,
    searchString,
    shownColumns,
    isAddConnectorWizardOpened,
    selectedDataSet,
    selectedConnectorNavTypeReducer,
    errorLoadingConnectorsReducer
});

microsoftSearchReducer.addSubStates({ connectorList: connectorListReducer });

export const selectedConnectorNavTypeSelector = createSelector(
    (state: AppState) => state.getIn(['microsoftSearch', 'connectorList', 'selectedConnectorNavTypeReducer']),
    (selectedNav: DatasetEditState) => selectedNav
);
