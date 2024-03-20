async function fetchImage(path, spartankey) {
    try {
        if (path === null || path === undefined) {
            return null;
        }
        const proxyBaseUrl = process.env.PROXY_BASE_URL || 'http://localhost:3001/api/';
        const url = `${proxyBaseUrl}/${path}`;
        const headers = new Headers();
        headers.append('X-343-Authorization-Spartan', spartankey);

        const requestOptions = {
            method: 'GET',
            headers: headers,
        };

        const response = await fetch(url, requestOptions);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const imageBlob = await response.blob();
        return URL.createObjectURL(imageBlob);
    } catch (error) {
        console.error('Fetching image failed:', error);
        return null;
    }
}
export default fetchImage;