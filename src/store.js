import { createStore } from 'redux';


const initialState = {
    expanded: false,
    userEmail: '',
    customMenuItems: [],
    nickname: '',
    avatarUrl: ''
};

// Пример редуктора
function rootReducer(state = initialState, action) {
    switch (action.type) {
        case 'SET_EXPANDED':
            return { ...state, expanded: action.payload };
        case 'SET_USER_EMAIL':
            return { ...state, userEmail: action.payload };
        case 'SET_CUSTOM_MENU_ITEMS':
            return { ...state, customMenuItems: action.payload };
        case 'SET_NICKNAME':
            return { ...state, nickname: action.payload };
        case 'SET_AVATAR_URL':
            return { ...state, avatarUrl: action.payload };
        default:
            return state;
    }
}

// Создание store
const store = createStore(rootReducer);

export default store;