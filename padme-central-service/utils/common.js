module.exports = {

    combineURLs: (baseURL, relativeURL) => {
        return relativeURL
            ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
            : baseURL;
    },
    
    isEmpty: (value) => {
          return (value == null || value.length === 0);
    }
}