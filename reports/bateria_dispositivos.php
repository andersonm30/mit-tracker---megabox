
 <html>
  <head>
    <script type="text/javascript" src="https://www.gstatic.com/charts/loader.js"></script>
    <script type="text/javascript">
      google.charts.load('current', {'packages':['corechart']});
      google.charts.setOnLoadCallback(drawChart);

      function drawChart() {
        var data = google.visualization.arrayToDataTable([
          

		  
		  <?php
				$deviceid = $_REQUEST['deviceid'];

				include_once('conexao88.php');

				$conn = new conn();

				$conn_traccar = $conn->conn_traccar();

				$sql = "
				Select * from (
								SELECT 	attributes dado, 
										DATE_FORMAT(DATE_ADD(servertime,INTERVAL -3 hour),'%d/%m %H:%i') data,
										( Select name from tc_devices where id = tc_positions.deviceid) device
								FROM 	tc_positions 
								WHERE 	deviceid in($deviceid) 
								ORDER BY data desc LIMIT 500) Dados 
				order by data 				

				";
												
				$devices_near = mysqli_query($conn_traccar,$sql);

				$i = 0;
				
				echo "['Data', '% Bateria', 'Satelites']";
				
				while($row_devices = mysqli_fetch_assoc($devices_near)){
					$dev = $row_devices['device'];
					$json = json_decode($row_devices['dado'],true);
					if( isset($json['batteryLevel']) ){
						$i++;
						$bateria =  $json['batteryLevel'];
						$sat =  $json['sat'];
						echo ",['".$row_devices['data']."',$bateria,      $sat]";
					}	
				}
				
				

	echo "]);

        var options = {
          title: 'Device $dev',
          curveType: 'function',
          legend: { position: 'bottom' }
        };";	

?>

		  
		

        var chart = new google.visualization.LineChart(document.getElementById('curve_chart'));

        chart.draw(data, options);
      }
    </script>
  </head>
  <body>
    <div id="curve_chart" style="width: 100%; height: 100%"></div>
  </body>
</html>