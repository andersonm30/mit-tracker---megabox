<?php
class Conn {

    public static function conn_traccar(){
        $servidor = "localhost:54102";
        $usuario = "suporte";
        $senha = "Suporte80";
        $dbname = "traccar";
        $conn_traccar = mysqli_connect($servidor, $usuario, $senha, $dbname);
        
        if (!$conn_traccar) {
            die("Falha na conexão: " . mysqli_connect_error());
        }

        return $conn_traccar;
    }

    public static function conn_gestao(){
        $servidor_gestao = "localhost:54102";
        $usuario_gestao = "suporte";
        $senha_gestao = "Suporte80";
        $dbname_gestao = "gestao";

        $conn_gestao = mysqli_connect($servidor_gestao, $usuario_gestao, $senha_gestao, $dbname_gestao);
        
        if (!$conn_gestao) {
            die("Falha na conexão: " . mysqli_connect_error());
        }

        return $conn_gestao;
    }        
}
?>
