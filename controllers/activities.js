const db = require('./db');
const moment = require('moment');
const axios = require('axios');

async function getViatorData(cities, params) {
    const ops = [];
    for (let icity in cities){
        params["destId"] = parseInt(cities[icity].sourceid);
        let url =`https://viatorapi.viator.com/service/search/products?apiKey=${process.env.VIATOR_API_KEY}`;
        let op = axios.post(url, params).then( activities => {
            // data = Object.assign({}, data, activities);
            console.log(activities);
        });
        ops.push(op);
    }
    let res = await axios.all(ops);
    console.log(res);
    return res;
}

function getActivities(req, res, next){
    // get list of activity from our db
    let boundsobj = {
		south: req.query.south,
		west: req.query.west,
		north: req.query.north,
		east:  req.query.east
    };
    //let expiryDate = moment().subtract(2,'days').format('YYYY-MM-DD');
    // SELECT name, st_contains(latlon, ST_GeomFromText('POINT(16.391944 48.218056)', 4326))  FROM bezirks
    let sql = `SELECT * FROM geobuffer where st_contains(ST_GeomFromText('POLYGON((${req.query.west} ${req.query.north}, ${req.query.east} ${req.query.north}, ${req.query.east} ${req.query.south}, ${req.query.west} ${req.query.south}, ${req.query.west} ${req.query.north}))', 4326), geom)`;
    // AND  updated_at::timestamp::date < '${expiryDate}'::timestamp::date`;
    db.any(sql).then(function (cities) {
        // http://viatorapi.viator.com/service/search/products
        // {"startDate":"2019-12-02","endDate":"2020-12-02", "topX":"1-15","destId":684,     "currencyCode":"EUR", "catId":0, "subCatId":0, "dealsOnly":false}
        let params = {
            "startDate":  req.query.startdate || moment().format('YYYY-MM-DD'),
            "endDate": req.query.enddate || moment().add(1,"days").format('YYYY-MM-DD'),
            "topX":"1-15",
            "currencyCode": req.query.currency || 'EUR',
            "catId":0,
            "subCatId":0,
            "dealsOnly":false
        };
        let url =`https://viatorapi.viator.com/service/search/products?apiKey=${process.env.VIATOR_API_KEY}`;
        let ops = [];
        for(let i=0; (i < cities.length) && (i < 24); i++){
            params["destId"] = parseInt(cities[i].sourceid);
            let op = axios.post(url, params);
            ops.push(op);
        }
        Promise.all(ops).then( activitiesLists => {
            let activities = [];
            if(activitiesLists.length > 0){
                for (let activitiesList of activitiesLists){
                    if(activitiesList.data.data.length > 0){
                        for (let activity of activitiesList.data.data){
                            activities.push(activity);
                        }
                    }
                }
            }

            res.status(200).json({
                status: 'success',
                itemsNumber: activities.length,
                data: activities,
                message: 'Retrieved activities in bound.'
            });
        }).catch( error => {
            let message = 'Error retrieved activities from Viator!';
            console.log(message);
            res.status(400).json({
                code: error.code,
                status: 'error',
                error: error,
                message: message
            });
        });

    }).catch( error => {
		let message = 'Error retrieved cities from geobuffer!';
		console.log(message);
		res.status(400).json({
			code: error.code,
			status: 'error',
			error: error,
			message: message
		});
	});
}

function getActivityDetails(req, res, next){
    // http://viatorapi.viator.com/service/product?code=5010SYDNEY&currencyCode=EUR&excludeTourGradeAvailability=true&showUnavailable=false&apiKey=9217412952177776889
    let url = `http://viatorapi.viator.com/service/product?code=${req.query.id}&currencyCode=EUR&excludeTourGradeAvailability=true&showUnavailable=false&apiKey=${process.env.VIATOR_API_KEY}`
    axios.get(url).then( activity => {
        res.status(200)
            .json({
                status: 'success',
                activity: activity,
                message: 'Retrieved activity details.'
            });
    }).catch( error => {
        let message = 'Error retrieved activity details!';
        console.log(message);
        res.status(400).json({
            code: error.code,
            status: 'error',
            error: error,
            message: message
        });
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