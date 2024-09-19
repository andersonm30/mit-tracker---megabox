<!DOCTYPE html>
<html lang="en">

<title>Relatório de Percurso</title>

<!-- Leaflet CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>

<!-- Leaflet.heat CSS -->
<link rel="stylesheet" href="https://unpkg.com/leaflet.heat/dist/leaflet-heat.css" />
 <style>
	/* Estilo para fazer o mapa ocupar 100% da altura da tela */
	html, body, #map {
		height: 100%;
		margin: 0;
	}
</style>

<div id="map"></div>

<!-- Leaflet JS -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>

<!-- Leaflet.heat JS -->
<script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>

<script>
	// Initialize Leaflet map
	var map = L.map('map').setView([ -15.7801,-47.9292], 5);

	// Google Maps API Key
	var googleMapsKey = 'YOUR_GOOGLE_MAPS_API_KEY';

	// Google Maps Layer (Standard)
	var googleLayerStandard = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=' + googleMapsKey, {
		maxZoom: 20,
		attribution: '© Google Maps'
	});

	// Google Maps Layer (Satellite)
	var googleLayerSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=' + googleMapsKey, {
		maxZoom: 20,
		attribution: '© Google Maps'
	});

	// OpenStreetMap Layer
	var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '© OpenStreetMap'
	});

	// Add default OpenStreetMap to the map
	googleLayerStandard.addTo(map);

	 function loadHeatmapFromGeoJSON(geoJSON) {
		if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
			return;
		}

		var heatmapData = [];

		// Extrai as coordenadas dos recursos GeoJSON
		geoJSON.features.forEach(feature => {
			if (feature.geometry && feature.geometry.coordinates) {
				heatmapData.push([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
			}
		});

		// Cria a camada de heatmap
		var heatmapLayer = L.heatLayer(heatmapData, {
			radius: 20,
			blur: 20,
			maxZoom: 10
		}).addTo(map);

		// Obtém as últimas coordenadas
		var lastCoordinate = heatmapData[heatmapData.length - 1];

		// Define a visualização do mapa para as últimas coordenadas
		map.setView(lastCoordinate, 15);
	}
	
	<?php
				
		include 'api_traccar.php';

		$traccar = new traccar();
		
		$login = $traccar->login('admin','admin');	
		
		$sessionId = $login->response;

		session_start();
		$_SESSION['user'] = 'admin';
		$_SESSION['sessionId'] = $sessionId;
		$_SESSION['Basic'] = base64_encode( 'admin' . ':' . 'admin' );
		
		$deviceid = $_GET['deviceid'];
        	$data_ini = $_GET['data_inicial'];
        	$data_final = $_GET['data_final'];

        	$reponse = $traccar->positions($sessionId,$deviceid,$data_ini,$data_final);
		
        
		//$reponse = $traccar->positions($sessionId,60,'2024-04-09T09:00:00Z','2024-04-09T22:00:00Z');
				
		$positions = json_decode($reponse->response);

		$var_pos ='';
		$var_dados ='';
		$i = 0;
		
		$geoJSON = '{
				"type": "FeatureCollection",
				"features": [';

		
		foreach($positions as $position){				
						
			if ( $i > 0 ) { 	$geoJSON .= ','; }
				$i++;
				
				$geoJSON .= '{
								"geometry": {
									"type": "Point",
									"coordinates": ['.$position->longitude.','.$position->latitude.']
								},"type": "Feature",
							"properties": {
								"popupContent": "Horario: '.$position->serverTime.'",
								"posicao": "'.$i.'"
							},"id": '.$position->id.'
							}';		
			}	
			$geoJSON .= ']}';
			
			
			echo "loadHeatmapFromGeoJSON($geoJSON);";
		?>
	
	// Add layer control
	var baseMaps = {
		"Google Maps (Standard)": googleLayerStandard,
		"Google Maps (Satellite)": googleLayerSatellite,
		"OpenStreetMap": osmLayer
	};

	var overlayMaps = {};

	L.control.layers(baseMaps, overlayMaps).addTo(map);
</script>

