import api from './api';

export interface Fleet {
    id: string;
    code: string;       // e.g. PC7
    name: string;       // e.g. Pacific Ocean Fleet No. 7
    koName: string;     // e.g. 남태평양 원양선단 1팀
    homePort: string;   // e.g. 부산항 감천항만
    latitude?: number;  // e.g. 35.0784
    longitude?: number; // e.g. 129.0069
}



export const fetchFleets = async (): Promise<Fleet[]> => {
    try {
        const response = await api.get<Fleet[]>('/fleets');
        return response.data;
    } catch (error) {
        console.error('Failed to fetch fleets:', error);
        return [];
    }
};
