const db = require('./db');
const moment = require('moment');

function getActivities(){
    return true;
}

function getActivityDetails(){
    return true;
}


module.exports = {
    //	getAllPois: getAllPois,
        getActivities: getActivities,
        getActivityDetails: getActivityDetails
    //	createPoi: createPoi,
    //	updatePoi: updatePoi,
    //	removePoi: removePoi
    };