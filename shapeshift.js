https = require('https')

pair = 'btc_eth'
options = {
    host: 'shapeshift.io',
    path: '/marketinfo/' + pair
}

data = {}

callback = (response) => {
    str = ''
    response.on('data', (chunk) => {
        str += chunk
    });
    response.on('end', () => {
        console.log(str)
        data = JSON.parse(str)
    });
}

https.request(options, callback).end()


