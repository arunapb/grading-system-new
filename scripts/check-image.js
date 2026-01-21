const axios = require('axios');

async function checkImage() {
    try {
        const url = 'https://uom.lk/student/IT-21/214001A.png';
        console.log(`Checking ${url}...`);
        const response = await axios.head(url);
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.log('Status:', error.response.status);
        }
    }
}

checkImage();
