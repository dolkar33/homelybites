import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const baseURL = 'http://localhost:8000/';
const instance = axios.create({ baseURL });

instance.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('accessToken'); 
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default instance;