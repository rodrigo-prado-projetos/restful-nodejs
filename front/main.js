const axios = require('axios');

axios.get('https://appnoderodri.herokuapp.com/api/produtos').then(resp => {

    console.log(resp.data);
});