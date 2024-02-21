import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial global state
const initialState = {
  currentlyEquipped: {},
  editingObjectId: null,
  customKitCount: 0,
  spartanInventory: [], // New state for Spartan inventory
  armoryRow: [], // New state for Armory row
  isLoading: false, // New state to track loading status
};

// Action types for readability and to avoid typos
const actionTypes = {
  SET_CURRENTLY_EQUIPPED: 'SET_CURRENTLY_EQUIPPED',
  SET_EDITING_OBJECT_ID: 'SET_EDITING_OBJECT_ID',
  SET_CUSTOM_KIT_COUNT: 'SET_CUSTOM_KIT_COUNT',
  SET_SPARTAN_INVENTORY: 'SET_SPARTAN_INVENTORY',
  SET_ARMORY_ROW: 'SET_ARMORY_ROW',
  SET_LOADING: 'SET_LOADING',
};

// Reducer function to manage state updates
const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_CURRENTLY_EQUIPPED:
      return { ...state, currentlyEquipped: action.payload };
    case actionTypes.SET_EDITING_OBJECT_ID:
      return { ...state, editingObjectId: action.payload };
    case actionTypes.SET_CUSTOM_KIT_COUNT:
      return { ...state, customKitCount: action.payload };
    case actionTypes.SET_SPARTAN_INVENTORY:
      return { ...state, spartanInventory: action.payload };
    case actionTypes.SET_ARMORY_ROW:
      return { ...state, armoryRow: action.payload };
    case actionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Create context
const GlobalStateContext = createContext();

// Create a provider component
export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Example async function to fetch Spartan inventory
  const fetchSpartanInventory = useCallback(async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    try {
      // Simulate fetching inventory (replace with your actual fetch logic)
      const inventory = await fetch('https://example.com/spartanInventory').then(res => res.json());
      dispatch({ type: actionTypes.SET_SPARTAN_INVENTORY, payload: inventory });
    } catch (error) {
      console.error('Failed to fetch Spartan inventory:', error);
    } finally {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // Pass fetchSpartanInventory along with state and dispatch
  const value = { state, dispatch, fetchSpartanInventory };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
};

// Custom hook to use global state and actions
export const useGlobalState = () => useContext(GlobalStateContext);
