const db = require('./db');
const moment = require('moment');
const axios = require('axios');


function getActivities(req, res, next){
    return true;
}

function getActivityDetails(req, res, next){
    // http://viatorapi.viator.com/service/product?code=5010SYDNEY&currencyCode=EUR&excludeTourGradeAvailability=true&showUnavailable=false&apiKey=9217412952177776889
    let url = `http://viatorapi.viator.com/service/product?code=${req.query.activity}`
    axios.get().then( activity => {

    });
}


module.exports = {
    //	getAllPois: getAllPois,
        getActivities: getActivities,
        getActivityDetails: getActivityDetails
    //	createPoi: createPoi,
    //	updatePoi: updatePoi,
    //	removePoi: removePoi
    };