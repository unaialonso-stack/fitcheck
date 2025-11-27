<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

class Database{
    private $host = "localhost";
    private $db_name = "fitcheck";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection(){
        $this->conn=null;
        try{
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . 
            $this->db_name, $this->username, $this->password);
            $this->conn->exec("set names utf8");
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO:ERRMODE_EXCEPTION);         
        }catch(PDOException $exception){
            error_log("Error de conexión: " . $exception->getMessage());
        }
        return $this->conn;
    }
}
function response($success, $message, $data = null){
    echo json_encode([
        'succes' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit;
}

session_start();
?>