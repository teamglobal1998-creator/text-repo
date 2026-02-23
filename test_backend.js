import axios from 'axios';

async function testBackend() {
    try {
        console.log('Testing login...');
        const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@company.com',
            password: 'admin123'
        });
        console.log('Login successful:', loginRes.status, loginRes.data.token ? 'Token OK' : 'No Token');

        const token = loginRes.data.token;

        console.log('Testing /me endpoint...');
        const meRes = await axios.get('http://localhost:5000/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('User info:', meRes.status, meRes.data.email);

        console.log('Testing /clients endpoint...');
        const clientRes = await axios.get('http://localhost:5000/api/clients', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Clients count:', clientRes.data.length);

    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testBackend();
