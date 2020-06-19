const db = require('./db');
const passport = require('passport');
var mediaController = require('../controllers/medias');

function createRoadtrip(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
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
			roadtrip.departuregeom = new STPoint(roadtrip.departurelongitude, roadtrip.departurelatitude)
			roadtrip.arrivalgeom = new STPoint(roadtrip.arrivallongitude, roadtrip.arrivallatitude)
			roadtrip.distance = (req.body.roadtrip.distance !== null) ? req.body.roadtrip.distance : null
			roadtrip.duration = (req.body.roadtrip.duration !== null) ? req.body.roadtrip.duration : null
			roadtrip.hashtag = (req.body.roadtrip.hashtag !== null) ? JSON.stringify(req.body.roadtrip.hashtag) : null
			roadtrip.public = parseParam(req.body.roadtrip.public, 2)
			roadtrip.status_id = 3
			db.any('INSERT INTO roadtrip ($1:name) VALUES($1:csv) RETURNING id;', [roadtrip]).then(function (rows) {
				let roadtrip_id = rows[0].id;
				let sql = `INSERT INTO participate (promoter, account_id, roadtrip_id, status) VALUES(true, ${req.body.account_id}, ${roadtrip_id}, 1) RETURNING id;`;
				db.any(sql).then(function (rows) {
					if (waypoints) { // insert waypoints in relative table
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
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			db.any('INSERT INTO roadtrip (title, departure, arrival, "start", "end", distance, duration, hashtag, "public", status_id, comment_id, departurelongitude, departurelatitude, departuregeom, arrivallongitude, arrivallatitude, arrivalgeom) SELECT title, departure, arrival, "start", "end", distance, duration, hashtag, $1, $2, comment_id, departurelongitude, departurelatitude, departuregeom, arrivallongitude, arrivallatitude, arrivalgeom FROM roadtrip WHERE id = $3 RETURNING id', [2, 3, roadtripID])
				.then(function (rows) {
					let duplicatedRoadtripID = rows[0].id;
					let sql = `INSERT INTO participate (promoter, account_id, roadtrip_id, status) VALUES(true, ${user.id}, ${duplicatedRoadtripID}, 1) RETURNING id;`;
					db.any(sql).then(function () {
						// rajouter promise all pour les waypoints par rapport à un select des ids
						db.any('SELECT id FROM waypoint WHERE roadtrip_id = $1', [roadtripID]).then(function (waypointsToDuplicateIds) {
							let requestsWaypoints = []
							waypointsToDuplicateIds.forEach(waypointToDuplicate => {
								requestsWaypoints.push(db.any('INSERT INTO waypoint ("label", "day", "sequence", transport, geom, latitude, longitude, roadtrip_id, account_id) SELECT "label", "day", "sequence", transport, geom, latitude, longitude, $1, $2 FROM waypoint WHERE waypoint.id = $3 returning id', [duplicatedRoadtripID, user.id, waypointToDuplicate.id]))
							})
							Promise.all(requestsWaypoints).then((waypointsDuplicatedIds) => {
								console.log(waypointsDuplicatedIds)
								// do foreach sur les ids, créer chaque requete avec waypoint_id fixe et les lancer toutes d'un coup dans une promise.all 
								let requestsVisits = []
								waypointsDuplicatedIds.forEach(function (waypointInfo, index) {
									console.log(waypointInfo[0].id)
									console.log(waypointsToDuplicateIds[index].id)
									// TODO maybe find a better way to differentiate the correct waypoint than using label, could have duplicates ?
									requestsVisits.push(db.any(`INSERT INTO visit (sequence, waypoint_id, poi_id, transport) SELECT sequence, ${waypointInfo[0].id}, poi_id, transport FROM visit WHERE visit.waypoint_id IN (SELECT id from waypoint WHERE waypoint.id = ${waypointsToDuplicateIds[index].id})`))
								});
								Promise.all(requestsVisits).then(() => {
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
							console.error(`Problem during select DB (waypointsid): ${error}`);
							res.status(500).json({
								status: 'error',
								message: `Problem during select DB (waypointsid): ${error}`
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
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			var roadtripID = parseInt(req.params.id);
			let sql = `select waypoint.*, visit.id AS visit_id, visit.sequence AS visit_sequence, visit.transport AS visit_transport, poi.id as poi_id, poi.sourceid, poi.sourcetype, poi.label AS poi_label, poi.sourcetheme, poi.start, poi.end, poi.street, poi.zipcode, poi.city, poi.country, poi.latitude AS poi_latitude, poi.longitude AS poi_longitude, poi.geom AS poi_geom, poi.email, poi.web, poi.phone, poi.linkimg, poi.description, poi.type, poi.priority, poi.visnumber, poi.opening, poi.created_at AS poi_created_at, poi.updated_at AS poi_updated_at, poi.source, poi.sourcelastupdate, poi.active, poi.profiles, poi.duration, poi.price, poi.rating, poi.ocean, poi.pricerange, poi.social, poi.handicap, poi.manuallyupdate, poi.hashtag from waypoint LEFT JOIN visit ON visit.waypoint_id = waypoint.id LEFT JOIN poi ON poi.id = visit.poi_id WHERE waypoint.roadtrip_id = ${roadtripID} ORDER BY waypoint.day, waypoint.sequence, visit.sequence`;
			db.any(sql).then(function (waypoints) {
				var visits = []
				var pois = []
				var uniqueWaypoints = []
				var waypointsId = []
				waypoints.forEach(waypoint => {
					if (!waypointsId.includes(waypoint.id)) {
						uniqueWaypoints.push({ "id": waypoint.id, "label": waypoint.label, "day": waypoint.day, "sequence": waypoint.sequence, "transport": waypoint.transport, "geom": waypoint.geom, "latitude": waypoint.latitude, "longitude": waypoint.longitude, "roadtrip_id": waypoint.roadtrip_id, "account_id": waypoint.account_id, "visits": [] })
						waypointsId.push(waypoint.id)
					}
					if (waypoint.visit_id !== null) {
						visit = { "id": waypoint.visit_id, "waypoint_id": waypoint.id, "sequence": waypoint.visit_sequence, "transport": waypoint.visit_transport, "latitude": waypoint.poi_latitude, "longitude": waypoint.poi_longitude, "label": waypoint.poi_label, "poi_id": waypoint.poi_id, "linkimg": waypoint.linkimg }
						// if (waypoint.poi_id !== null) {
						// 	pois.push({"id": waypoint.poi_id, "sourceid": waypoint.sourceid, "sourcetype": waypoint.sourcetype, "poi_label": waypoint.poi_label, "sourcetheme": waypoint.sourcetheme, "start": waypoint.start, "end": waypoint.end, "street": waypoint.street, "zipcode": waypoint.zipcode, "city": waypoint.city, "country": waypoint.country, "latitude": waypoint.poi_latitude, "longitude": waypoint.poi_longitude, "geom": waypoint.poi_geom, "email": waypoint.email, "web": waypoint.web, "phone": waypoint.phone, "linkimg": waypoint.linkimg, "description": waypoint.description, "type": waypoint.type, "priority": waypoint.priority, "visnumber": waypoint.visnumber, "opening": waypoint.opening, "created_at": waypoint.poi_created_at, "updated_at": waypoint.poi_updated_at, "source": waypoint.source, "sourcelastupdate": waypoint.sourcelastupdate, "active": waypoint.active, "profiles": waypoint.profiles, "duration": waypoint.duration, "price": waypoint.price, "rating": waypoint.rating, "ocean": waypoint.ocean, "pricerange": waypoint.pricerange, "social": waypoint.social, "handicap": waypoint.handicap, "manuallyupdate": waypoint.manuallyupdate, "hashtag": waypoint.hashtag})
						// }
						// const index = uniqueWaypoints.findIndex(element => element.id = waypoint.id);

						visits.push(visit)
					}
				})
				// recuperer toutes les infos de account et ne les renvoeyr que si on participe au roadtrip
				db.any('select roadtrip.*, participate.promoter, participate.id as participatecolumn_id, participate.account_id AS participate_account_id, participate.roadtrip_id AS participate_roadtrip_id, participate.status AS participate_status, account.firstname, account.lastname, account.dateborn, account.gender, account.biography, account.email, account.phone, account.id AS account_id, account.created_at AS account_created_at, account.updated_at AS account_updated_at, account.media_id, account.status_id AS account_status_id, account.role_id, media.filename, media.filepath from roadtrip INNER JOIN participate ON participate.roadtrip_id = roadtrip.id INNER JOIN account ON account.id = participate.account_id LEFT JOIN media ON media.id = account.media_id WHERE roadtrip.id = $1', roadtripID).then(function (roadtripResult) {
					var accountsId = []
					var roadtripFormatted = { "id": roadtripResult[0].id, "title": roadtripResult[0].title, "departure": roadtripResult[0].departure, "arrival": roadtripResult[0].arrival, "start": roadtripResult[0].start, "end": roadtripResult[0].end, "distance": roadtripResult[0].distance, "duration": roadtripResult[0].duration, "hashtag": roadtripResult[0].hashtag, "public": roadtripResult[0].public, "created_at": roadtripResult[0].created_at, "updated_at": roadtripResult[0].updated_at, "status_id": roadtripResult[0].status_id, "comment_id": roadtripResult[0].comment_id, "departurelongitude": roadtripResult[0].departurelongitude, "departurelatitude": roadtripResult[0].departurelatitude, "departuregeom": roadtripResult[0].departuregeom, "arrivallongitude": roadtripResult[0].arrivallongitude, "arrivallatitude": roadtripResult[0].arrivallatitude, "arrivalgeom": roadtripResult[0].arrivalgeom, "accounts": [], "waypoints": [], "visits": [], "pois": [] }
					var accountsDetailed = []
					var accountsSimple = []
					var accountPicturePromises = []
					roadtripResult.forEach(roadtrip => {
						if (roadtrip.account_id !== null) {
							if (!accountsId.includes(roadtrip.account_id)) {
								accountsDetailed.push({ "id": roadtrip.account_id, "firstname": roadtrip.firstname, "lastname": roadtrip.lastname, "dateborn": roadtrip.dateborn, "gender": roadtrip.gender, "biography": roadtrip.biography, "email": roadtrip.email, "phone": roadtrip.phone, "created_at": roadtrip.account_created_at, "updated_at": roadtrip.account_updated_at, "media_id": roadtrip.media_id, "status_id": roadtrip.account_status_id, "role_id": roadtrip.role_id, "participate_status": roadtrip.participate_status })
								accountsSimple.push({ "id": roadtrip.account_id, "firstname": roadtrip.firstname, "media_id": roadtrip.media_id, "participate_status": roadtrip.participate_status })
								if (roadtrip.filepath !== null && roadtrip.filename !== null) {
									accountPicturePromises.push(
										mediaController.getUrl(roadtrip.filepath, 'small_' + roadtrip.filename).then(function (url) {
											if (url == undefined) {
												return null
											}
											return url
										})
									)
								} else {
									// if he has no profile pictures, we return null in a promise so that they are in order in the promise all
									accountPicturePromises.push(
										new Promise((resolve, reject) => {
											resolve(null)
										})
									)
								}
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
					Promise.all(accountPicturePromises).then(function (urlsData) {
						// urls are in order so we can just parse and add to roadtripFormatted.accounts
						urlsData.forEach(function (url, index) {
							roadtripFormatted.accounts[index].profileUrl = url
						})
						res.status(200).json({
							status: 'success',
							data: roadtripFormatted,
							message: 'Retrieved ONE roadtrip'
						});
					}).catch(function (err) {
						res.status(500).json({
							status: 'Error',
							message: `error in promise get urls : ${err}`
						});
					})
				}).catch(function (err) {
					res.status(500).json({
						status: 'Error',
						message: `error in select db : ${err}`
					});
				})
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
	var invited = (req.query.invited == 'true') ? true : false
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			let sql = `SELECT roadtrip.*, participate.promoter, participate.id as participatecolumn_id, participate.account_id AS participate_account_id, participate.roadtrip_id AS participate_roadtrip_id, participate.status AS participate_status, account.firstname, account.lastname, account.dateborn, account.gender, account.biography, account.email, account.phone, account.id AS account_id, account.created_at AS account_created_at, account.updated_at AS account_updated_at, account.media_id, account.status_id AS account_status_id, account.role_id, media.filepath, media.filename, poi.linkimg `
			sql += `FROM (SELECT * FROM roadtrip WHERE roadtrip.id IN (select roadtrip_id from participate WHERE account_id = ${user.id}`
			if (invited) {
				sql += `AND status = 3)`
			} else {
				sql += `AND (status = 1 OR status = 2))`
			}
			if (status !== null) {
				sql += ` AND roadtrip.status_id = ${status}`;
				var todayString = new Date().toISOString().substr(0, 10)
				if (status == 1) sql += ` AND roadtrip.start >= '${todayString}'`
			}
			sql += `ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}) roadtrip `
			sql += `INNER JOIN participate ON participate.roadtrip_id = roadtrip.id INNER JOIN account ON account.id = participate.account_id LEFT JOIN media ON media.id = account.media_id LEFT JOIN waypoint ON waypoint.roadtrip_id = roadtrip.id LEFT JOIN visit ON visit.waypoint_id = waypoint.id LEFT JOIN poi ON poi.id = visit.poi_id`
			sql += ` ORDER BY roadtrip.updated_at DESC, participate.roadtrip_id`;
			db.any(sql).then(function (roadtrips) {
				var uniqueRoadtrips = []
				var roadtripsId = []
				var accountsId = []
				var accountPicturePromises = []
				roadtrips.forEach(roadtrip => {
					if (!roadtripsId.includes(roadtrip.id)) {
						uniqueRoadtrips.push({ "id": roadtrip.id, "title": roadtrip.title, "departure": roadtrip.departure, "arrival": roadtrip.arrival, "start": roadtrip.start, "end": roadtrip.end, "distance": roadtrip.distance, "duration": roadtrip.duration, "hashtag": roadtrip.hashtag, "public": roadtrip.public, "created_at": roadtrip.created_at, "updated_at": roadtrip.updated_at, "status_id": roadtrip.status_id, "comment_id": roadtrip.comment_id, "departurelongitude": roadtrip.departurelongitude, "departurelatitude": roadtrip.departurelatitude, "departuregeom": roadtrip.departuregeom, "arrivallongitude": roadtrip.arrivallongitude, "arrivallatitude": roadtrip.arrivallatitude, "arrivalgeom": roadtrip.arrivalgeom, "accounts": [], "linkimgs": [] })
						roadtripsId.push(roadtrip.id)
						// we empty accountsid because they are used to avoid duplicates within a single roadtrip
						accountsId = []
					}
					if (roadtrip.account_id !== null) {
						if (!accountsId.includes(roadtrip.account_id)) {
							uniqueRoadtrips[uniqueRoadtrips.length - 1].accounts.push({ "id": roadtrip.account_id, "firstname": roadtrip.firstname, "lastname": roadtrip.lastname, "dateborn": roadtrip.dateborn, "gender": roadtrip.gender, "biography": roadtrip.biography, "email": roadtrip.email, "phone": roadtrip.phone, "created_at": roadtrip.account_created_at, "updated_at": roadtrip.account_updated_at, "media_id": roadtrip.media_id, "status_id": roadtrip.account_status_id, "role_id": roadtrip.role_id, "participate_status": roadtrip.participate_status })
							if (roadtrip.filepath !== null && roadtrip.filename !== null) {
								accountPicturePromises.push(
									// TODO optimize to avoid doing queries for the same pictures multiple times (check unique media_id ?)
									mediaController.getUrl(roadtrip.filepath, 'small_' + roadtrip.filename).then(function (url) {
										if (url == undefined) {
											return null
										}
										return url
									})
								)
							} else {
								// if he has no profile pictures, we return null in a promise so that they are in order in the promise all
								accountPicturePromises.push(
									new Promise((resolve, reject) => {
										resolve(null)
									})
								)
							}
							accountsId.push(roadtrip.account_id)
						}
					}
					if (roadtrip.linkimg !== null) {
						if (!uniqueRoadtrips[uniqueRoadtrips.length - 1].linkimgs.includes(roadtrip.linkimg)) {
							uniqueRoadtrips[uniqueRoadtrips.length - 1].linkimgs.push(roadtrip.linkimg)
						}
					}
				})
				Promise.all(accountPicturePromises).then(function (urlsData) {
					// urls are in order so we can just parse and add to roadtripFormatted.accounts
					var roadtripIndex = 0
					var counterProcessed = 0
					urlsData.forEach(function (url, index) {
						if ((index - counterProcessed) == uniqueRoadtrips[roadtripIndex].accounts.length) {
							roadtripIndex++
							counterProcessed += (index - counterProcessed)
						}
						uniqueRoadtrips[roadtripIndex].accounts[index - counterProcessed].profileUrl = url
					})
					res.status(200).json({
						status: 'success',
						data: uniqueRoadtrips,
						message: 'Retrieved ALL the roadtrips and associated participants from user'
					})
				}).catch(function (err) {
					res.status(500).json({
						status: 'Error',
						message: `error in promise get urls : ${err}`
					});
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
	let sql = `SELECT roadtrip.*, participate.promoter, participate.id as participatecolumn_id, participate.account_id AS participate_account_id, participate.roadtrip_id AS participate_roadtrip_id, participate.status AS participate_status, account.firstname, account.id AS account_id, account.media_id, media.filepath, media.filename, poi.linkimg `
	sql += `FROM (SELECT * FROM roadtrip WHERE roadtrip.public = 1 ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}) roadtrip `
	sql += `LEFT JOIN participate ON participate.roadtrip_id = roadtrip.id LEFT JOIN account ON account.id = participate.account_id LEFT JOIN media ON media.id = account.media_id LEFT JOIN waypoint ON waypoint.roadtrip_id = roadtrip.id LEFT JOIN visit ON visit.waypoint_id = waypoint.id LEFT JOIN poi ON poi.id = visit.poi_id`
	sql += ` ORDER BY roadtrip.updated_at DESC, participate.roadtrip_id`;
	db.any(sql).then(function (roadtrips) {
		var uniqueRoadtrips = []
		var roadtripsId = []
		var accountsId = []
		var accountPicturePromises = []
		roadtrips.forEach(roadtrip => {
			if (!roadtripsId.includes(roadtrip.id)) {
				uniqueRoadtrips.push({ "id": roadtrip.id, "title": roadtrip.title, "departure": roadtrip.departure, "arrival": roadtrip.arrival, "start": roadtrip.start, "end": roadtrip.end, "distance": roadtrip.distance, "duration": roadtrip.duration, "hashtag": roadtrip.hashtag, "public": roadtrip.public, "created_at": roadtrip.created_at, "updated_at": roadtrip.updated_at, "status_id": roadtrip.status_id, "comment_id": roadtrip.comment_id, "departurelongitude": roadtrip.departurelongitude, "departurelatitude": roadtrip.departurelatitude, "departuregeom": roadtrip.departuregeom, "arrivallongitude": roadtrip.arrivallongitude, "arrivallatitude": roadtrip.arrivallatitude, "arrivalgeom": roadtrip.arrivalgeom, "accounts": [], "linkimgs": [] })
				roadtripsId.push(roadtrip.id)
				// we empty accountsid because they are used to avoid duplicates within a single roadtrip
				accountsId = []
			}
			if (roadtrip.account_id !== null) {
				if (!accountsId.includes(roadtrip.account_id)) {
					uniqueRoadtrips[uniqueRoadtrips.length - 1].accounts.push({ "id": roadtrip.account_id, "firstname": roadtrip.firstname, "media_id": roadtrip.media_id, "participate_status": roadtrip.participate_status })
					if (roadtrip.filepath !== null && roadtrip.filename !== null) {
						accountPicturePromises.push(
							// TODO optimize to avoid doing queries for the same pictures multiple times (check unique media_id ?)
							mediaController.getUrl(roadtrip.filepath, 'small_' + roadtrip.filename).then(function (url) {
								if (url == undefined) {
									return null
								}
								return url
							})
						)
					} else {
						// if he has no profile pictures, we return null in a promise so that they are in order in the promise all
						accountPicturePromises.push(
							new Promise((resolve, reject) => {
								resolve(null)
							})
						)
					}
					accountsId.push(roadtrip.account_id)
				}
			}
			if (roadtrip.linkimg !== null) {
				if (!uniqueRoadtrips[uniqueRoadtrips.length - 1].linkimgs.includes(roadtrip.linkimg)) {
					uniqueRoadtrips[uniqueRoadtrips.length - 1].linkimgs.push(roadtrip.linkimg)
				}
			}
		})
		Promise.all(accountPicturePromises).then(function (urlsData) {
			// urls are in order so we can just parse and add to roadtripFormatted.accounts
			var roadtripIndex = 0
			var counterProcessed = 0
			urlsData.forEach(function (url, index) {
				if ((index - counterProcessed) == uniqueRoadtrips[roadtripIndex].accounts.length) {
					roadtripIndex++
					counterProcessed += (index - counterProcessed)
				}
				uniqueRoadtrips[roadtripIndex].accounts[index - counterProcessed].profileUrl = url
			})
			res.status(200).json({
				status: 'success',
				data: uniqueRoadtrips,
				message: 'Retrieved ALL the roadtrips and associated promoter'
			})
		}).catch(function (err) {
			res.status(500).json({
				status: 'Error',
				message: `error in promise get urls : ${err}`
			});
		})
	}).catch(function (err) {
		res.status(500).json({
			status: 'error',
			message: `Problem during query DB (roadtrips): ${err}`
		})
	});
}

function updateRoadtrip(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			var roadtrip_id = parseInt(req.params.id);
			let sql = `select * from participate WHERE account_id = ${user.id} AND roadtrip_id = ${roadtrip_id} AND (status = 1 OR status = 2)`
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
					roadtrip.updated_at = getStringDateFormatted()

					const condition = pgp.as.format(' WHERE id = $1', roadtrip_id);
					let sql = pgp.helpers.update(roadtrip, ['title', 'departure', 'arrival', 'start', 'end', 'distance', 'duration', 'hashtag', 'public', 'status_id', 'departurelongitude', 'departurelatitude', 'departuregeom', 'arrivallongitude', 'arrivallatitude', 'arrivalgeom', 'updated_at'], 'roadtrip') + condition;

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

function joinRoadtrip(req, res, next) {
	passport.authenticate('jwt', { session: false }, function (error, user, info) {
		if (user === false || error || info !== undefined) {
			let message = {
				status: 'error',
				error: error,
				user: user
			};
			if (info !== undefined) {
				message['message'] = info.message;
				message['info'] = info;
			}
			console.error(message);
			res.status(403).json(message);
		} else {
			var roadtrip_id = req.params.id
			db.none(`UPDATE participate SET status = 2 WHERE roadtrip_id = ${roadtrip_id} AND account_id = ${user.id} AND status != 1`).then(function () {
				res.status(200).json({
					status: 'success',
					message: `Successfully updated participate`
				})
			}).catch(function (err) {
				res.status(500).json({
					status: 'error',
					message: `Problem during update DB (participate): ${err}`
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

function getStringDateFormatted() {
	Number.prototype.padLeft = function (base, chr) {
		var len = (String(base || 10).length - String(this).length) + 1;
		return len > 0 ? new Array(len).join(chr || '0') + this : this;
	}
	var d = new Date
	dformat = [d.getFullYear(),
	(d.getMonth() + 1).padLeft(),
	d.getDate().padLeft()
	].join('-') + ' ' + [
		d.getHours().padLeft(),
		d.getMinutes().padLeft(),
		d.getSeconds().padLeft()
	].join(':');
	return dformat
}

module.exports = {
	createRoadtrip: createRoadtrip,
	duplicateRoadtrip, duplicateRoadtrip,
	getRoadtripDetails: getRoadtripDetails,
	getUserRoadtrips: getUserRoadtrips,
	getPublicRoadtrips: getPublicRoadtrips,
	updateRoadtrip: updateRoadtrip,
	getStringDateFormatted: getStringDateFormatted,
	joinRoadtrip: joinRoadtrip
};