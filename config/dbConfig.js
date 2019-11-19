module.exports = {
	// LOCAL CONFIG
	host: 'ec2-46-137-173-221.eu-west-1.compute.amazonaws.com', // server name or IP address;
	port: 5432,
	database: 'd5l2immgr9mpsj',
	user: 'byauhesadwzgra',
	ssl:true,
	password: '606e5f15fe5102e0ec0638efa1d3a1e54dc544e0f09450f32ff97d18fcd42b6a',
	uri: 'postgres://byauhesadwzgra:606e5f15fe5102e0ec0638efa1d3a1e54dc544e0f09450f32ff97d18fcd42b6a@ec2-46-137-173-221.eu-west-1.compute.amazonaws.com:5432/d5l2immgr9mpsj'
}


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