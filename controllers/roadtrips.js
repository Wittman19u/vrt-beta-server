const db = require('./db');
const passport = require('passport');

function createRoadtrip(req, res, next) {
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if(info !== undefined){
				message['message']= info.message;
				message['info']= info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			const pgp = db.$config.pgp;
			class STPoint {
				constructor(x, y) {
					this.x = x;
					this.y = y;
					this.rawType = true; // no escaping, because we return pre-formatted SQL
				}
				toPostgres(self) {
					return pgp.as.format('ST_SetSRID(ST_MakePoint($1, $2),4326)', [this.x, this.y]);
				}
			}
			if (req.body.account_id === null) {
				res.status(500).json({
					status: 'error',
					message: 'account id missing'
				})
			}
			// essential : title/departure/arrival/start/end						
			let roadtrip = req.body.roadtrip
			let waypoints = req.body.waypoints
			// TODO improve object in request (front side) to remove waypoints from roadtrips object
			delete roadtrip["waypoints"]
			roadtrip.departuregeom = new STPoint( roadtrip.departurelongitude, roadtrip.departurelatitude)
			roadtrip.arrivalgeom = new STPoint(roadtrip.arrivallongitude,roadtrip.arrivallatitude)
			roadtrip.distance = (req.body.roadtrip.distance !== null) ? req.body.roadtrip.distance : null
			roadtrip.duration = (req.body.roadtrip.duration !== null) ? req.body.roadtrip.duration : null
			roadtrip.hashtag = (req.body.roadtrip.hashtag !== null) ? JSON.stringify(req.body.roadtrip.hashtag) : null
			roadtrip.public = parseParam(req.body.roadtrip.public, 2)
			roadtrip.status_id = 3
			db.any('INSERT INTO roadtrip ($1:name) VALUES($1:csv) RETURNING id;', [roadtrip]).then(function (rows) {
				let roadtrip_id = rows[0].id;
				let sql = `INSERT INTO participate (promoter, account_id, roadtrip_id) VALUES(true, ${req.body.account_id}, ${roadtrip_id}) RETURNING id;`;
				db.any(sql).then(function (rows) {
					if(waypoints){ // insert waypoints in relative table
						waypoints.forEach(waypoint => {
							delete waypoint["visits"]
							waypoint.geom = `POINT(${waypoint.longitude} ${waypoint.latitude})`;
							waypoint.roadtrip_id = roadtrip_id
							waypoint.account_id = req.body.account_id
							// let sql = `INSERT INTO waypoint (label, day, sequence, transport, geom, latitude, longitude, roadtrip_id, account_id) VALUES('${waypoint.label}', ${waypoint.day}, ${waypoint.sequence}, ${waypoint.transport}, ST_GeomFromText('${geom}',4326), ${waypoint.latitude}, ${waypoint.longitude}, ${roadtrip_id}, ${req.body.account_id});`;
							db.any('INSERT INTO waypoint ($1:name) VALUES ($1:csv);', [waypoint])
							.catch(function (error) {
								console.error(`Problem during insert DB (waypoint): ${error}`);
								res.status(500).json({
									status: 'error',
									message: `Problem during insert DB (waypoint): ${error}`
								});
							});
						});
						res.status(200).json({
							status: 'success',
							message: `Inserted one roadtrip and its waypoints`,
							id: roadtrip_id
						});
					} else {
						res.status(200)
						.json({
							status: 'success',
							message: 'Inserted one roadtrip',
							id: roadtrip_id
						});
					}			
				}).catch(function (error) {
					console.error(`Problem during insert DB (participate): ${error}`);
					res.status(500).json({
						status: 'error',
						message: `Problem during insert DB (participate): ${error}`
					});
				});
			}).catch(function (error) {
				console.error(`Problem during insert DB (roadtrip): ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem during insert DB (roadtrip): ${error}`
				});
			});
		}
	})(req, res, next);
}

function duplicateRoadtrip(req, res, next) {
	var roadtripID = parseInt(req.params.id);
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if(info !== undefined){
				message['message']= info.message;
				message['info']= info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			db.any('INSERT INTO roadtrip (title, departure, arrival, "start", "end", distance, duration, hashtag, "public", status_id, comment_id, departurelongitude, departurelatitude, departuregeom, arrivallongitude, arrivallatitude, arrivalgeom) SELECT title, departure, arrival, "start", "end", distance, duration, hashtag, $1, $2, comment_id, departurelongitude, departurelatitude, departuregeom, arrivallongitude, arrivallatitude, arrivalgeom FROM roadtrip WHERE id = $3 RETURNING id', [2, 3, roadtripID])
				.then(function (rows) {
				let duplicatedRoadtripID = rows[0].id;
				let sql = `INSERT INTO participate (promoter, account_id, roadtrip_id) VALUES(true, ${user.id}, ${duplicatedRoadtripID}) RETURNING id;`;
				db.any(sql).then(function () {
					db.any('INSERT INTO waypoint ("label", "day", "sequence", transport, geom, latitude, longitude, roadtrip_id, account_id) SELECT "label", "day", "sequence", transport, geom, latitude, longitude, $1, $2 FROM waypoint WHERE waypoint.roadtrip_id = $3 returning id, label', [duplicatedRoadtripID, user.id, roadtripID]).then(function (waypointsInfo) {
						// do foreach sur les ids, créer chaque requete avec waypoint_id fixe et les lancer toutes d'un coup dans une promise.all 
						let requests = []
						waypointsInfo.forEach(waypointInfo => {
							// TODO maybe find a better way to differentiate the correct waypoint than using label, could have duplicates ?
							requests.push(db.any(`INSERT INTO visit (sequence, waypoint_id, poi_id, transport) SELECT sequence, ${waypointInfo.id}, poi_id, transport FROM visit WHERE visit.waypoint_id IN (SELECT id from waypoint WHERE waypoint.roadtrip_id = ${roadtripID} AND waypoint.label = '${waypointInfo.label}')`))
						});
						Promise.all(requests).then(() => {
							res.status(200).json({
								status: 'success',
								message: 'Duplicated one roadtrip and its waypoints and visits',
								id: duplicatedRoadtripID
							});
						}).catch(function (error) {
							console.error(`Problem during duplicate DB (visit): ${error}`);
							res.status(500).json({
								status: 'error',
								message: `Problem during duplicate DB (visit): ${error}`
							});
						});
					}).catch(function (error) {
						console.error(`Problem during duplicate DB (waypoint): ${error}`);
						res.status(500).json({
							status: 'error',
							message: `Problem during duplicate DB (waypoint): ${error}`
						});
					});			
				}).catch(function (error) {
					console.error(`Problem during insert DB (participate): ${error}`);
					res.status(500).json({
						status: 'error',
						message: `Problem during insert DB (participate): ${error}`
					});
				});
			}).catch(function (error) {
				console.error(`Problem during insert DB (roadtrip): ${error}`);
				res.status(500).json({
					status: 'error',
					message: `Problem during insert DB (roadtrip): ${error}`
				});
			});
		}
	})(req, res, next);
}

function getRoadtripDetails(req, res, next) {
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if(info !== undefined){
				message['message']= info.message;
				message['info']= info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			var roadtripID = parseInt(req.params.id);
			let sql= `select waypoint.*, visit.id AS visit_id, visit.sequence AS visit_sequence, visit.transport AS visit_transport, poi.id as poi_id, poi.sourceid, poi.sourcetype, poi.label AS poi_label, poi.sourcetheme, poi.start, poi.end, poi.stree, poi.zipcode, poi.city, poi.country, poi.latitude AS poi_latitude, poi.longitude AS poi_longitude, poi.geom AS poi_geom, poi.email, poi.web, poi.phone, poi.linkimg, poi.description, poi.type, poi.priority, poi.visnumber, poi.opening, poi.created_at AS poi_created_at, poi.updated_at AS poi_updated_at, poi.source, poi.sourcelastupdate, poi.active, poi.profiles, poi.duration, poi.price, poi.rating, poi.ocean, poi.pricerange, poi.social, poi.handicap, poi.manuallyupdate, poi.hashtag from waypoint LEFT JOIN visit ON visit.waypoint_id = waypoint.id LEFT JOIN poi ON poi.id = visit.poi_id WHERE waypoint.roadtrip_id = ${roadtripID} ORDER BY waypoint.day, waypoint.sequence, visit.sequence`;
			db.any(sql).then(function (waypoints) {
				console.log(waypoints)
				var visits = []
				var pois = []
				var uniqueWaypoints = []
				var waypointsId = []
				waypoints.forEach(waypoint => {	
					if (!waypointsId.includes(waypoint.id)){
						uniqueWaypoints.push({"id": waypoint.id, "label": waypoint.label, "day": waypoint.day, "sequence": waypoint.sequence, "transport": waypoint.transport, "geom": waypoint.geom, "latitude": waypoint.latitude, "longitude": waypoint.longitude, "roadtrip_id": waypoint.roadtrip_id, "account_id": waypoint.account_id,"visits": []})
						waypointsId.push(waypoint.id)
					}
					if (waypoint.visit_id !== null) {
						visit = {"id": waypoint.visit_id,"waypoint_id": waypoint.id, "sequence": waypoint.visit_sequence, "transport": waypoint.visit_transport, "latitude": waypoint.poi_latitude, "longitude": waypoint.poi_longitude,"label": waypoint.poi_label, "linkimg": waypoint.linkimg}
						// if (waypoint.poi_id !== null) {
						// 	pois.push({"id": waypoint.poi_id, "sourceid": waypoint.sourceid, "sourcetype": waypoint.sourcetype, "poi_label": waypoint.poi_label, "sourcetheme": waypoint.sourcetheme, "start": waypoint.start, "end": waypoint.end, "stree": waypoint.stree, "zipcode": waypoint.zipcode, "city": waypoint.city, "country": waypoint.country, "latitude": waypoint.poi_latitude, "longitude": waypoint.poi_longitude, "geom": waypoint.poi_geom, "email": waypoint.email, "web": waypoint.web, "phone": waypoint.phone, "linkimg": waypoint.linkimg, "description": waypoint.description, "type": waypoint.type, "priority": waypoint.priority, "visnumber": waypoint.visnumber, "opening": waypoint.opening, "created_at": waypoint.poi_created_at, "updated_at": waypoint.poi_updated_at, "source": waypoint.source, "sourcelastupdate": waypoint.sourcelastupdate, "active": waypoint.active, "profiles": waypoint.profiles, "duration": waypoint.duration, "price": waypoint.price, "rating": waypoint.rating, "ocean": waypoint.ocean, "pricerange": waypoint.pricerange, "social": waypoint.social, "handicap": waypoint.handicap, "manuallyupdate": waypoint.manuallyupdate, "hashtag": waypoint.hashtag})
						// }
						// const index = uniqueWaypoints.findIndex(element => element.id = waypoint.id);

						visits.push(visit)
					}
				})
				// recuperer toutes les infos de account et ne les renvoeyr que si on participe au roadtrip
				db.any('select roadtrip.*, participate.promoter, participate.id as participatecolumn_id, participate.account_id AS participate_account_id, participate.roadtrip_id AS participate_roadtrip_id, account.firstname, account.lastname, account.dateborn, account.gender, account.biography, account.email, account.phone, account.id AS account_id, account.created_at AS account_created_at, account.updated_at AS account_updated_at, account.media_id, account.status_id AS account_status_id, account.role_id from roadtrip INNER JOIN participate ON participate.roadtrip_id = roadtrip.id INNER JOIN account ON account.id = participate.account_id where roadtrip.id = $1', roadtripID).then(function (roadtripResult) {
					var participatesId = []
					var accountsId = []
					var roadtripFormatted = {"id": roadtripResult[0].id, "title": roadtripResult[0].title, "departure": roadtripResult[0].departure, "arrival": roadtripResult[0].arrival, "start": roadtripResult[0].start, "end": roadtripResult[0].end, "distance": roadtripResult[0].distance, "duration": roadtripResult[0].duration, "hashtag": roadtripResult[0].hashtag, "public": roadtripResult[0].public, "created_at": roadtripResult[0].created_at, "updated_at": roadtripResult[0].updated_at, "status_id": roadtripResult[0].status_id, "comment_id": roadtripResult[0].comment_id, "departurelongitude": roadtripResult[0].departurelongitude, "departurelatitude": roadtripResult[0].departurelatitude, "departuregeom": roadtripResult[0].departuregeom, "arrivallongitude": roadtripResult[0].arrivallongitude, "arrivallatitude": roadtripResult[0].arrivallatitude, "arrivalgeom": roadtripResult[0].arrivalgeom, "participates": [], "accounts": [], "waypoints": [], "visits": [], "pois": []}
					var accountsDetailed = []
					var accountsSimple = []
					roadtripResult.forEach(roadtrip => {
						if (roadtrip.participatecolumn_id !== null) {
							if (!participatesId.includes(roadtrip.participatecolumn_id)) {
								roadtripFormatted.participates.push({"id": roadtrip.participatecolumn_id, "promoter": roadtrip.promoter, "account_id": roadtrip.participate_account_id, "roadtrip_id": roadtrip.participate_roadtrip_id})
								participatesId.push(roadtrip.participatecolumn_id)
							}
						}
						if (roadtrip.account_id !== null) {
							if (!accountsId.includes(roadtrip.account_id)) {
								accountsDetailed.push({"id": roadtrip.account_id, "firstname": roadtrip.firstname, "lastname": roadtrip.lastname, "dateborn": roadtrip.dateborn, "gender": roadtrip.gender, "biography": roadtrip.biography, "email": roadtrip.email, "phone": roadtrip.phone, "created_at": roadtrip.account_created_at, "updated_at": roadtrip.account_updated_at, "media_id": roadtrip.media_id, "status_id": roadtrip.account_status_id, "role_id": roadtrip.role_id})
								accountsSimple.push({"id": roadtrip.account_id, "firstname": roadtrip.firstname, "media_id": roadtrip.media_id})
								accountsId.push(roadtrip.account_id)
							}
						}
					})
					if (accountsId.includes(user.id)) {
						roadtripFormatted.accounts = accountsDetailed;
					} else {
						roadtripFormatted.accounts = accountsSimple;
					}
					roadtripFormatted.waypoints = uniqueWaypoints;
					roadtripFormatted.visits = visits;
					roadtripFormatted.pois = pois;
					res.status(200).json({
						status: 'success',
						data: roadtripFormatted,
						message: 'Retrieved ONE roadtrip'
					});
				}).catch(function (err) {
					return next(err);
				});
			}).catch(function (err) {
				return next(err);
			});
		}
	})(req, res, next);
}

function getUserRoadtrips(req, res, next) {
	var limit = parseParam(req.query.limit, 10)
	var offset = parseParam(req.query.offset, 0)
	var status = parseParam(req.query.status, null)
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if(info !== undefined){
				message['message']= info.message;
				message['info']= info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			var userId = parseInt(req.params.id);
			let sql= `SELECT roadtrip.*, participate.promoter, participate.id as participatecolumn_id, participate.account_id AS participate_account_id, participate.roadtrip_id AS participate_roadtrip_id, account.firstname, account.lastname, account.dateborn, account.gender, account.biography, account.email, account.phone, account.id AS account_id, account.created_at AS account_created_at, account.updated_at AS account_updated_at, account.media_id, account.status_id AS account_status_id, account.role_id, poi.linkimg `
			sql += `FROM (SELECT * FROM roadtrip WHERE roadtrip.id IN (select roadtrip_id from participate WHERE account_id = ${userId})`
			if (status !== null) sql += ` AND roadtrip.status_id = ${status}`;
			sql += `ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}) roadtrip `
			sql += `INNER JOIN participate ON participate.roadtrip_id = roadtrip.id INNER JOIN account ON account.id = participate.account_id LEFT JOIN waypoint ON waypoint.roadtrip_id = roadtrip.id LEFT JOIN visit ON visit.waypoint_id = waypoint.id LEFT JOIN poi ON poi.id = visit.poi_id`
			sql += ` ORDER BY roadtrip.updated_at DESC, participate.roadtrip_id`;
			db.any(sql).then(function (roadtrips) {
				var uniqueRoadtrips = []
				var roadtripsId = []
				var participatesId = []
				var accountsId = []
				roadtrips.forEach(roadtrip => {
					if (!roadtripsId.includes(roadtrip.id)){
						uniqueRoadtrips.push({"id": roadtrip.id, "title": roadtrip.title, "departure": roadtrip.departure, "arrival": roadtrip.arrival, "start": roadtrip.start, "end": roadtrip.end, "distance": roadtrip.distance, "duration": roadtrip.duration, "hashtag": roadtrip.hashtag, "public": roadtrip.public, "created_at": roadtrip.created_at, "updated_at": roadtrip.updated_at, "status_id": roadtrip.status_id, "comment_id": roadtrip.comment_id, "departurelongitude": roadtrip.departurelongitude, "departurelatitude": roadtrip.departurelatitude, "departuregeom": roadtrip.departuregeom, "arrivallongitude": roadtrip.arrivallongitude, "arrivallatitude": roadtrip.arrivallatitude, "arrivalgeom": roadtrip.arrivalgeom, "participates": [], "accounts": [], "linkimgs": []})
						roadtripsId.push(roadtrip.id)
						// we empty participatesid and accountsid because they are used to avoid duplicates within a single roadtrip
						participatesId = []
						accountsId = []
					}
					if (roadtrip.participatecolumn_id !== null) {
						if (!participatesId.includes(roadtrip.participatecolumn_id)) {
							// add to the latest roadtrip we added
							uniqueRoadtrips[uniqueRoadtrips.length-1].participates.push({"id": roadtrip.participatecolumn_id, "promoter": roadtrip.promoter, "account_id": roadtrip.participate_account_id, "roadtrip_id": roadtrip.participate_roadtrip_id})
							participatesId.push(roadtrip.participatecolumn_id)
						}
					}
					if (roadtrip.account_id !== null) {
						if (!accountsId.includes(roadtrip.account_id)) {
							uniqueRoadtrips[uniqueRoadtrips.length-1].accounts.push({"id": roadtrip.account_id, "firstname": roadtrip.firstname, "lastname": roadtrip.lastname, "dateborn": roadtrip.dateborn, "gender": roadtrip.gender, "biography": roadtrip.biography, "email": roadtrip.email, "phone": roadtrip.phone, "created_at": roadtrip.account_created_at, "updated_at": roadtrip.account_updated_at, "media_id": roadtrip.media_id, "status_id": roadtrip.account_status_id, "role_id": roadtrip.role_id})
							accountsId.push(roadtrip.account_id)
						}
					}
					if (roadtrip.linkimg !== null) {
						if (!uniqueRoadtrips[uniqueRoadtrips.length-1].linkimgs.includes(roadtrip.linkimg)) {
							uniqueRoadtrips[uniqueRoadtrips.length-1].linkimgs.push(roadtrip.linkimg)
						}
					}
				})
				res.status(200).json({
					status: 'success',
					data: uniqueRoadtrips,
					message: 'Retrieved ALL the roadtrips and associated participants from user'
				})
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during query DB (roadtrips): ${err}`
				})
			});
		}
	})(req, res, next);
}

function getPublicRoadtrips(req, res, next) {
	var limit = parseParam(req.query.limit, 10)
	var offset = parseParam(req.query.offset, 0)
	let sql= `SELECT roadtrip.*, participate.promoter, participate.id as participatecolumn_id, participate.account_id AS participate_account_id, participate.roadtrip_id AS participate_roadtrip_id, account.firstname, account.id AS account_id, account.media_id, poi.linkimg `
	sql += `FROM (SELECT * FROM roadtrip WHERE roadtrip.public = 1 ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}) roadtrip `
	sql += `LEFT JOIN participate ON participate.roadtrip_id = roadtrip.id LEFT JOIN account ON account.id = participate.account_id LEFT JOIN waypoint ON waypoint.roadtrip_id = roadtrip.id LEFT JOIN visit ON visit.waypoint_id = waypoint.id LEFT JOIN poi ON poi.id = visit.poi_id`
	sql += ` ORDER BY roadtrip.updated_at DESC, participate.roadtrip_id`;
	db.any(sql).then(function (roadtrips) {
		var uniqueRoadtrips = []
		var roadtripsId = []
		var participatesId = []
		var accountsId = []
		roadtrips.forEach(roadtrip => {
			if (!roadtripsId.includes(roadtrip.id)){
				uniqueRoadtrips.push({"id": roadtrip.id, "title": roadtrip.title, "departure": roadtrip.departure, "arrival": roadtrip.arrival, "start": roadtrip.start, "end": roadtrip.end, "distance": roadtrip.distance, "duration": roadtrip.duration, "hashtag": roadtrip.hashtag, "public": roadtrip.public, "created_at": roadtrip.created_at, "updated_at": roadtrip.updated_at, "status_id": roadtrip.status_id, "comment_id": roadtrip.comment_id, "departurelongitude": roadtrip.departurelongitude, "departurelatitude": roadtrip.departurelatitude, "departuregeom": roadtrip.departuregeom, "arrivallongitude": roadtrip.arrivallongitude, "arrivallatitude": roadtrip.arrivallatitude, "arrivalgeom": roadtrip.arrivalgeom, "participates": [], "accounts": [], "linkimgs": []})
				roadtripsId.push(roadtrip.id)
				// we empty participatesid and accountsid because they are used to avoid duplicates within a single roadtrip
				participatesId = []
				accountsId = []
			}
			if (roadtrip.participatecolumn_id !== null) {
				if (!participatesId.includes(roadtrip.participatecolumn_id)) {
					uniqueRoadtrips[uniqueRoadtrips.length-1].participates.push({"id": roadtrip.participatecolumn_id, "promoter": roadtrip.promoter, "account_id": roadtrip.participate_account_id, "roadtrip_id": roadtrip.participate_roadtrip_id})
					participatesId.push(roadtrip.participatecolumn_id)
				}
			}
			if (roadtrip.account_id !== null) {
				if (!accountsId.includes(roadtrip.account_id)) {
					uniqueRoadtrips[uniqueRoadtrips.length-1].accounts.push({"id": roadtrip.account_id, "firstname": roadtrip.firstname, "media_id": roadtrip.media_id})
					accountsId.push(roadtrip.account_id)
				}
			}
			if (roadtrip.linkimg !== null) {
				if (!uniqueRoadtrips[uniqueRoadtrips.length-1].linkimgs.includes(roadtrip.linkimg)) {
					uniqueRoadtrips[uniqueRoadtrips.length-1].linkimgs.push(roadtrip.linkimg)
				}
			}
		})
		res.status(200).json({
			status: 'success',
			data: uniqueRoadtrips,
			message: 'Retrieved ALL the roadtrips and associated promoter'
		})
	}).catch(function (err) {
		res.status(500).json({
			status: 'error',
			message: `Problem during query DB (roadtrips): ${err}`
		})
	});
}

function updateRoadtrip(req, res, next) {
	passport.authenticate('jwt', { session: false },function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if(info !== undefined){
				message['message']= info.message;
				message['info']= info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			var roadtrip_id = parseInt(req.params.id);
			let sql = `select * from participate WHERE account_id = ${user.id} AND roadtrip_id = ${roadtrip_id}`
			db.any(sql).then(function (rows) {
				if (rows[0].id !== null) {
					const pgp = db.$config.pgp;
					class STPoint {
						constructor(x, y) {
							this.x = x;
							this.y = y;
							this.rawType = true; // no escaping, because we return pre-formatted SQL
						}
						toPostgres(self) {
							return pgp.as.format('ST_SetSRID(ST_MakePoint($1, $2),4326)', [this.x, this.y]);
						}
					}
					console.log(req.body)
					let roadtrip = req.body.roadtrip
					roadtrip.departuregeom = new STPoint(roadtrip.departurelongitude, roadtrip.departurelatitude)
					roadtrip.arrivalgeom = new STPoint(roadtrip.arrivallongitude, roadtrip.arrivallatitude)
					roadtrip.distance = (req.body.roadtrip.distance !== null) ? req.body.roadtrip.distance : null
					roadtrip.duration = (req.body.roadtrip.duration !== null) ? req.body.roadtrip.duration : null
					roadtrip.hashtag = (req.body.roadtrip.hashtag !== null) ? JSON.stringify(req.body.roadtrip.hashtag) : null
					roadtrip.public = (req.body.roadtrip.public !== null) ? parseInt(req.body.roadtrip.public) : 2
					roadtrip.status_id = (req.body.roadtrip.status_id !== null) ? parseInt(req.body.roadtrip.status_id) : 3

					const condition = pgp.as.format(' WHERE id = $1', roadtrip_id);
					let sql = pgp.helpers.update(roadtrip, ['title', 'departure', 'arrival', 'start', 'end', 'distance', 'duration', 'hashtag', 'public', 'status_id', 'departurelongitude', 'departurelatitude', 'departuregeom', 'arrivallongitude', 'arrivallatitude', 'arrivalgeom'], 'roadtrip') + condition;

					db.any(sql).then(function () {
					// let sql = `UPDATE roadtrip SET title = '${roadtrip.title}', departure = '${roadtrip.departure}', arrival = '${roadtrip.arrival}', "start" = '${roadtrip.start}', "end" = '${roadtrip.end}', distance = ${roadtrip.distance}, duration = ${roadtrip.duration}, hashtag = ${roadtrip.hashtag}, "public" = ${roadtrip.public}, status_id = ${roadtrip.status_id}, departurelongitude = ${roadtrip.departurelongitude}, departurelatitude = ${roadtrip.departurelatitude}, departuregeom = '${roadtrip.departuregeom}', arrivallongitude = ${roadtrip.arrivallongitude}, arrivallatitude = ${roadtrip.arrivallatitude}, arrivalgeom = '${roadtrip.arrivalgeom}' WHERE id = ${roadtrip_id}`
						res.status(200).json({
							status: 'success',
							message: `Successfully updated roadtrip ${roadtrip_id}`
						})
					}).catch(function (err) {
						res.status(500).json({
							status: 'error',
							message: `Problem during query DB (update roadtrip): ${err}`
						})
					});
				} else {
					res.status(403).json({
						status: 'error',
						message: 'The user does not participate in the roadtrip'
					})
				}
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during query DB (participate): ${err}`
				})
			});
		}
	})(req, res, next);
}

// to parse limit/offset/etc... (any optional int parameters)
function parseParam(param, defaultValue) {
	const parsed = parseInt(param);
	if (isNaN(parsed)) { return defaultValue; }
	return parsed;
}

module.exports = {
	createRoadtrip: createRoadtrip,
	duplicateRoadtrip, duplicateRoadtrip,
	getRoadtripDetails: getRoadtripDetails,
	getUserRoadtrips: getUserRoadtrips,
	getPublicRoadtrips: getPublicRoadtrips,
	updateRoadtrip: updateRoadtrip
};