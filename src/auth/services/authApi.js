import { createApi } from '@reduxjs/toolkit/query/react';
import {
    loginSuccess,
    loginFailure,
    loginStart,
    registerStart,
    registerSuccess,
    registerFailure
} from './authSlice';
import { baseQueryWithReauth } from '../../store/baseQuery';
import { resetState, resetApiState } from '../../store/actions';

const safelyParseJSON = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    } catch (e) {
        return null;
    }
};

const safelyStringifyJSON = (obj) => {
    try {
        return JSON.stringify(obj);
    } catch (e) {
        return null;
    }
};

export const authApi = createApi({
    reducerPath: 'authApi',
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        register: builder.mutation({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: {
                    username: userData.username,
                    email: userData.email,
                    password: userData.password
                },
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                dispatch(registerStart());
                try {
                    const { data: response } = await queryFulfilled;
                    if (response.success) {
                        localStorage.setItem('verificationToken', response.data.sessionToken);
                        dispatch(registerSuccess({
                            message: response.message
                        }));
                    } else {
                        dispatch(registerFailure(response.message || 'Registration failed'));
                    }
                } catch (error) {
                    dispatch(registerFailure(error.error?.message || 'Registration failed'));
                }
            },
        }),

        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: {
                    login: credentials.login,
                    // If it's admin login button click, use default password
                    password: credentials.isAdminLogin ? 'defaultPassword123' : credentials.password
                },
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                dispatch(loginStart());
                dispatch(resetState());
                dispatch(resetApiState());
                try {
                    const { data: response } = await queryFulfilled;
                    if (response.success) {
                        // Safely store token and user data
                        localStorage.setItem('token', response.data.token);
                        const userStr = safelyStringifyJSON(response.data.user);
                        if (userStr) {
                            localStorage.setItem('user', userStr);
                        }

                        dispatch(loginSuccess({
                            user: response.data.user,
                            token: response.data.token,
                            message: response.message
                        }));
                    } else {
                        dispatch(loginFailure(response.message || 'Login failed'));
                    }
                } catch (error) {
                    dispatch(loginFailure(error.error?.message || 'Login failed'));
                }
            },
        }),


        adminLogin: builder.mutation({
            query: (credentials) => ({
                url: '/auth/admin-login',
                method: 'POST',
                body: {
                    email: credentials.email,
                    isClientPage: credentials.isClientPage
                },
            }),
            async onQueryStarted(_, { dispatch, queryFulfilled }) {
                dispatch(loginStart());
                dispatch(resetState());
                dispatch(resetApiState());
                try {
                    const { data: response } = await queryFulfilled;
                    if (response.success) {
                        // Safely store token and user data
                        localStorage.setItem('token', response.data.token);
                        const userStr = safelyStringifyJSON(response.data.user);
                        if (userStr) {
                            localStorage.setItem('user', userStr);
                        }

                        dispatch(loginSuccess({
                            user: response.data.user,
                            token: response.data.token,
                            message: response.message
                        }));
                    } else {
                        dispatch(loginFailure(response.message || 'Login failed'));
                    }
                } catch (error) {
                    dispatch(loginFailure(error.error?.message || 'Login failed'));
                }
            },
        },
    }),
});

export const {
    useLoginMutation,
    useAdminLoginMutation,
    useRegisterMutation
} = authApi;
