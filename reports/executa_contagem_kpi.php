<?php
include("conexao88.php");
$conn = new conn();

$conn_traccar = $conn->conn_traccar();
$conn_gestao = $conn->conn_gestao();


$sql = "
SELECT  STATUS, COUNT(*) TOTAL
FROM (

SELECT  NAME,
       case  when lastupdate > DATE_ADD(NOW(),INTERVAL -2 MINUTE) AND ifnull(situacao,'ativo') != 'estoque' AND  ifnull(situacao,'ativo') != 'desativado' then 'Online'
       when lastupdate < DATE_ADD(NOW(),INTERVAL -2 MINUTE) AND ifnull(situacao,'ativo') != 'estoque' AND  ifnull(situacao,'ativo') != 'desativado' then 'Offline'
       when ifnull(situacao,'ativo') = 'estoque' then 'estoque'
       when ifnull(situacao,'ativo') = 'manutencao' then 'manutencao'
       when ifnull(situacao,'ativo') = 'desativado' then 'desativado'
                 END  STATUS

                        FROM            tc_devices d
                        WHERE           uniqueid not LIKE 'deleted%'
                        AND             categoria IN('te88v1','b8v1','veiculo')
 ) devices WHERE STATUS IS NOT null
GROUP BY STATUS ";

$cons_status = mysqli_query($conn_traccar,$sql);

$online = 0;
$offline = 0;
$estoque = 0;
$manutencao = 0;
$desativado = 0;

while($resp_status = mysqli_fetch_assoc($cons_status)){
        $status =       $resp_status['STATUS'];
        $total =        $resp_status['TOTAL'];

        if( $status     ==      'Online' ){
                                $online = $total;
        } elseif(       $status ==      'Offline' ){
                                $offline = $total;
        } elseif(       $status ==      'desativado' ){
                                $desativado = $total;
        } elseif(       $status ==      'estoque' ){
                                $estoque = $total;
        } elseif(       $status ==      'manutencao' ){
                                $manutencao = $total;
        }
}

$sql =  "SELECT                                 e.type TIPO,
                                                COUNT(*) TOTAL
                        FROM            tc_events e,
                                                tc_devices d
                        WHERE   e.deviceid      =               d.id
                        AND             TYPE            !=      'deviceOnline'
                        AND             TYPE            !=      'deviceOffline'
                        AND             TYPE            !=      'deviceUnknown'
                        AND             TYPE            !=      'deviceMoving'
                        AND             TYPE            !=      'deviceStopped'
                        AND             e.eventtime > DATE_FORMAT(NOW(),'%Y-%m-%d 00:00:00')
                        GROUP BY        e.type";

$cons_eventos = mysqli_query($conn_traccar,$sql);

$alarmes = 0;
$geocercas = 0;

while($resp_eventos = mysqli_fetch_assoc($cons_eventos)){
                if(     $resp_eventos['TIPO'] == 'alarm' ){
                        $alarmes = $resp_eventos['TOTAL'];
                } else {
                        $geocercas = $geocercas + $resp_eventos['TOTAL'];
                }
}

$sql = "Select count(*) TOTAL from gt_total_kpis
WHERE   DATE_FORMAT(dt_atualizacao,'%Y-%m-%d') =  DATE_FORMAT(NOW(),'%Y-%m-%d')";

$cons_linhas = mysqli_query($conn_gestao,$sql);
while($resp_linhas = mysqli_fetch_assoc($cons_linhas)){
        $total_linhas = $resp_linhas['TOTAL'];
}

if ( $total_linhas == 0 ){
        $sql = "Insert into gt_total_kpis(online ,
                                                                         offline ,
                                                                         manutencao,
                                                                         estoque  ,
                                                                         alarmes  ,
                                                                         geocercas  ,
                                                                         dt_atualizacao,
                                                                         desativados )
                                                                Values(
                                                                         $online,
                                                                         $offline,
                                                                         $manutencao,
                                                                         $estoque,
                                                                         $alarmes,
                                                                         $geocercas,
                                                                         now(),
                                                                        $desativado
                                                                         )";

        mysqli_query($conn_gestao,$sql);
        echo $sql;
} else {

        $sql = "update gt_total_kpis set online = $online,
                                                                         offline = $offline,
                                                                         manutencao = $manutencao,
                                                                         estoque = $estoque,
                                                                         alarmes = $alarmes,
                                                                         geocercas = $geocercas,
                                                                         dt_atualizacao = now(),
                                                                         desativados = $desativado
                        WHERE   DATE_FORMAT(dt_atualizacao,'%Y-%m-%d') =  DATE_FORMAT(NOW(),'%Y-%m-%d')";
        mysqli_query($conn_gestao,$sql);
}

//mysql_close($conn_gestao);
//mysql_close($conn_traccar);


?>

