<!DOCTYPE html>
<html lang="en">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"  crossorigin=""></script>

<style>
	html, body {
		height: 100%;
		margin: 0;
	}
	.leaflet-container {
		height: 100%;
		width: 100%;
		max-width: 100%;
		max-height: 100%;
	}
</style>

<?php

$date = date('Y-m-d');	

$data_inicio = str_replace('Z','',str_replace('T',' ',$_REQUEST['data_inicial']));

$data_final = str_replace('Z','',str_replace('T',' ',$_REQUEST['data_final']));

$deviceid = $_REQUEST['deviceid'];

include_once('conexao88.php');

$conn = new conn();

$conn_traccar = $conn->conn_traccar();

$sql = "SELECT 	dn.id,
											d.name name_ref,
											dn.latituderef,
											dn.longituderef,
											(SELECT NAME FROM tc_devices tdd WHERE tdd.id = dn.deviceidnear) name_near,
											dn.latitudenear,
											dn.longitudenear,
											dn.distancemt,
											dn.servertime
								FROM 		tc_devices_near dn,
											tc_devices d
								WHERE		dn.deviceidref = d.id
								and			dn.deviceidref = $deviceid
								and 		dn.servertime between '$data_inicio' and '$data_final'";
								
//echo $sql;								

$devices_near = mysqli_query($conn_traccar,$sql);

?>
<div id='map'></div>
<script>
    const map = L.map('map').setView([ -15.7801,-47.9292], 5);

	var googleLayerStandard = L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
				maxZoom: 20,
				subdomains:['mt0','mt1','mt2','mt3']
	});

	var googleLayerSatellite = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
		maxZoom: 20,
		subdomains:['mt0','mt1','mt2','mt3']
	});

	var openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		attribution: '&copy; OpenStreetMap contributors'
	});

	openStreetMapLayer.addTo(map); // Adiciona o mapa do Google como padrão

	var baseMaps = {
            "Google (Padrão)": googleLayerStandard,
            "Google (Satélite)": googleLayerSatellite,
            "OpenStreetMap": openStreetMapLayer
    };

	L.control.layers(baseMaps).addTo(map);

  
    function onEachFeature(feature, layer) {
        let popupContent = "";

        if (feature.properties && feature.properties.popupContent) {
            popupContent += feature.properties.popupContent;
        }

        layer.bindPopup(popupContent);
    }

   function loadGeoJSON(geoJSON) {
    const mapDiv = document.getElementById('map');

    if (!geoJSON || !geoJSON.features || geoJSON.features.length === 0) {
        return;
    }

    L.geoJSON(geoJSON, {
        style(feature) {
            return feature.properties && feature.properties.style;
        },
        onEachFeature: onEachFeature,
        pointToLayer(feature, latlng) {
            map.setZoom(14);
            map.panTo(latlng);
            return L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#ff0000',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        }
    }).addTo(map);
	}

<?php
	$geoJSON = '{
		"type": "FeatureCollection",
		"features": [';

	$i = 0;
	while($row_devices = mysqli_fetch_assoc($devices_near)){
	if ( $i > 0 ) { 	$geoJSON .= ','; }
	$i++;
	$geoJSON .= '{
					"geometry": {
						"type": "Point",
						"coordinates": ['.$row_devices['longituderef'].','.$row_devices['latituderef'].']
					},
					"type": "Feature",
					"properties": {
						"popupContent": "Encontro <b>'.$row_devices['name_ref'].'</b> com <b>'.$row_devices['name_near'].'</b> - Horario: '.$row_devices['servertime'].'"
					},
					"id": '.$row_devices['id'].'
				}';
	}
	$geoJSON .= ']}';
	
	echo "loadGeoJSON($geoJSON);";
?>
	
    
</script>