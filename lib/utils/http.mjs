import axios from 'axios';

export async function getPublicIP() {
    try {
        const response = await axios.get('https://api.ipify.org');
        return response.data;
    } catch (error) {
        return null;
    }
}
