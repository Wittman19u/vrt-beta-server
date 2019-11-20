console.log(process.env.DB_HOST);
module.exports = {
	// LOCAL CONFIG
	host: process.env.DB_HOST, // server name or IP address;
	port: process.env.DB_PORT,
	database: process.env.DB_DATABASE,
	user: process.env.DB_USER,
	ssl: process.env.DB_SSL ,
	password: process.env.DB_PASSWORD,
	uri: process.env.DB_URI
};


// -- FUNCTION: public.st_createfishnet(integer, integer, numeric, numeric, numeric, numeric)

// -- DROP FUNCTION public.st_createfishnet(integer, integer, numeric, numeric, numeric, numeric);

// CREATE OR REPLACE FUNCTION public.st_createfishnet(
// 	nrow integer,
// 	ncol integer,
// 	north numeric,
// 	south numeric,
// 	east numeric,
// 	west numeric,
// 	OUT "row" integer,
// 	OUT col integer,
// 	OUT geom geometry)
//     RETURNS SETOF record
//     LANGUAGE 'sql'

//     COST 100
//     IMMUTABLE STRICT
//     ROWS 1000
// AS $BODY$
// SELECT i + 1 AS row, j + 1 AS col,  ST_Translate(cell, ((j * (($5-$6) /$2)) + $6 ), ((i * (($3-$4)/$1))+$4)) AS geom
// FROM generate_series(0, $1 - 1) AS i,
//      generate_series(0, $2 - 1) AS j,
// (
// SELECT ST_GeomFromText('POLYGON(( 0 0, 0 '||($3-$4)/$1||', '||($5-$6)/$2||' '||($3-$4)/$1||', '||($5-$6)/$2||' 0, 0 0))',4326) AS cell
// ) AS foo;
// $BODY$;

// ALTER FUNCTION public.st_createfishnet(integer, integer, numeric, numeric, numeric, numeric)
//     OWNER TO postgres;