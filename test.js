const request = require('request')
const fs = require('fs');

const file = "./test.gif";

var options = {
    uri: 'http://localhost:8000/resize',
    method: 'POST',
    headers: {
        "Content-Type": "multipart/form-data"
    },
    qs: {
        "width": 200,
        "height": 200
    },
    formData: {
        "file": fs.createReadStream(file)
    }
};


request.post(options, (error, res, body) => {
    if (error) {
        console.error(error)
        return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)
})