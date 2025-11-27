<?php
include 'config.php';

if(!isset($_SESSION['user_id'])){
    response(false, "Usuario no autenticado");
}

$database = new Database();
$db = $database->getConnection();

if($_SERVER['REQUEST_METHOD'] === 'POST'){
    $data = json_decode(file_get_contents("php://input"));

    if(isset($data->action)){
        switch($data->action){
            case 'update_profile':
                $query = "UPDATE usuarios SET genero = ?, altura = ?, peso_actual = ?, actividad = ?, objetivo = ? WHERE id = ?";
                $stmt = $db->prepare($query);
                if($stmt->execute([
                    $data->genero,
                    $data->altura,
                    $data->peso,
                    $data->actividad,
                    $data->objetivo,
                    $_SESSION['user_id']
                ])){
                    response(true, "Perfil actualizado");
                }else{
                    response(false, "Error al actualizar perfil");
                }
                break;

                case 'get_profile':
                    $query = "SELECT nombre, edad, email, genero, altura, peso_actual as peso, actividad, objetivo FROM usuarios WHERE id = ?";
                    $stmt = $db->prepare($query);
                    $stmt->execute([$_SESSION['user_id']]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);

                    response(true, "Perfil obtenido", $user);
                    break;
                case 'calculate_calories':
                    $query = "SELECT edad, genero, altura, peso_actual as peso, actividad, objetivo FROM usuarios WHERE id = ?";
                    $stmt = $db->prepare($query);
                    $stmt->execute([$_SESSION['user_id']]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                    if(!$user || !$user['genero'] || !$user['altura'] || !$user['peso'] || !$user['actividad'] || !$user['objetivo']){
                        response(false, "Completa toda la información y el objetivo");
                    }

                    // Cálculo de calorías
                if($user['genero'] === 'hombre'){
                    $BMR = 88.36 + (13.4 * $user['peso']) + (4.8 * $user['altura']) - (5.7 * $user['edad']);        
                } else if($user['genero'] === 'mujer'){
                    $BMR = 447.6 + (9.2 * $user['peso']) + (3.1 * $user['altura']) - (4.3 * $user['edad']);
                } else {
                    $BMR = 370 + (21 * $user['peso']);
                }

                 $TDEE = $BMR * floatval($user['actividad']);
                if($user['objetivo'] === 'volumen') $TDEE += 300;
                if($user['objetivo'] === 'definicion') $TDEE -= 300;
                
                response(true, "Cálculo exitoso", [
                    'calorias' => round($TDEE)
                ]);
                break;
        }
    }
}
?>