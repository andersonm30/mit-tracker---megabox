<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Correlação</title>
    <style>
        .device-info {
            border: 1px solid #ccc;
            border-radius: 10px;
            padding: 10px;
            margin-bottom: 20px;
        }
        .map-container {
            width: 270px;
            height: 170px;
        }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
</head>
<body>

<script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

<?php

function formata_data($data_raw,$year_len){
	if( $year_len == 2 ) {$pos_ini = $year_len;} else {$pos_ini = 0;}
	$data =  substr($data_raw,8,2).'/'.substr($data_raw,5,2).'/'.substr($data_raw,$pos_ini,$year_len);
	$hora = substr($data_raw,strpos($data_raw,'T')+1,8);
	return $data.' '.$hora;
}	

session_start();

$deviceId = $_REQUEST['deviceid'];
$from = $_REQUEST['data_inicial'].':00';
$to = $_REQUEST['data_final'].':00';
$data_ini =  formata_data($_REQUEST['data_inicial'].':00',4); 
$data_fim =  formata_data($_REQUEST['data_final'].':00',4); 


echo "<div>";
echo "<table border='0' width='100%'>";
echo "<tr>";
echo "<td rowspan=3 width='10%' align='center' ><img src='img/logotipo.png' width='80px' height='80px'></img></td>";
echo "<td colspan=2 width='80%' align='center'><h2><u>Relatório de Correlação</u></h2></td>";
echo "</tr>";
echo "<tr>";
echo "<td colspan=2 align='left'></td>";
echo "</tr>";
echo "<tr>";
echo "<td colspan=2 align='left'><b>&nbsp;&nbsp;Período:</b> ".$data_ini." a ".$data_fim."</td>";
echo "</tr>";
echo "</table>";	
echo "</div><br><hr><br>";



include_once('conexao88.php');

$conn = new conn();

$conn_traccar = $conn->conn_traccar();



$devices_near = mysqli_query($conn_traccar,"SELECT 	dn.id,
											d.name name_ref,
											dn.latituderef,
											dn.longituderef,
											(SELECT NAME FROM tc_devices tdd WHERE tdd.id = dn.deviceidnear) name_near,
											dn.latitudenear,
											dn.longitudenear,
											dn.distancemt,
											date_format(dn.servertime,'%d/%m/%Y %h:%i:%s') servertime
								FROM 		tc_devices_near dn,
											tc_devices d
								WHERE		dn.deviceidref = d.id
								and			dn.deviceidref = $deviceId
								and			dn.servertime between '$from' and '$to'");


while($row_devices = mysqli_fetch_assoc($devices_near)){
		$id = $row_devices['id'];
		
		$name_ref = $row_devices['name_ref'];
		$longitude_ref = $row_devices['longituderef'];
		$latitude_ref = $row_devices['latituderef'];
		
		$name_near = $row_devices['name_near'];
		$longitude_near = $row_devices['longitudenear'];
		$latitude_near = $row_devices['latitudenear'];
		
		$horario = $row_devices['servertime'];
		$distancia = $row_devices['distancemt'];
		
		imprimir_mapa($id,$name_ref,$longitude_ref,$latitude_ref,$name_near,$longitude_near,$latitude_near,$horario,$distancia);
}	


function imprimir_mapa($id,$name_ref,$longitude_ref,$latitude_ref,$name_near,$longitude_near,$latitude_near,$horario,$distancia){
	
	$icon = 'img/pin.png';
		
	echo "<div class='device-info'>
				<table border='0'>
					<tr>
						<td width='70%'>    
							<p><strong>Nome 1: </strong>$name_ref</p>
							<p><strong>Nome 2: </strong>$name_near</p>
							<p><strong>Horário: </strong>$horario</p>
							<p><strong>Distancia: </strong>$distancia</p>
						</td>
						<td width='30%' align>    
						<div id='map-$id' class='map-container' align='right'></div>
						<script> 
							// Creating map options
							 var mapOptions = {
								center: [17.385044, 78.486671],
								zoom: 18,
								zoomControl: false
							 }
							
							const map$id = new L.map('map-$id', mapOptions).setView([$latitude_ref, $longitude_ref], 15);
							
													
							L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {maxZoom: 20}).addTo(map$id);
							var markerIcon = L.icon({iconUrl: '$icon',iconSize: [40, 40], iconAnchor: [19, 38]});
							
							L.marker([$latitude_ref, $longitude_ref],{icon: markerIcon}).addTo(map$id);
							L.marker([$latitude_near, $longitude_near],{icon: markerIcon}).addTo(map$id);
							
							</script>		
						</td>
					</tr>   
				</table>    
			</div>";
	
}
//if( $i == 0) {	
	//header('Location: report_nodata.php');
//}	
?>

</body>
</html>