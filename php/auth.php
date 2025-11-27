<?php
include 'config.php';

if($_SERVER['REQUEST_METHOD'] === 'POST'){
    $database = new Database();
    $db = $database->getConnection();

    $data = json_decode(file_get_contents("php://input"));

    if(isset($data->action)){
        switch($data->action){
            case 'register':
                if(empty($data->nombre) || empty($data->email) ||
                empty($data->password)){
                    response(false, "Todos los campos son obligatorios");
                }
                $query = "SELECT id FROM usuarios WHERE email = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$data->email]);

                if($stmt->rowCount()>0){
                    response(false, "El usuario ya existe");
                }

                $query = "INSERT INTO usuarios (nombre, edad, email, password) VALUES (?,?,?,?)";
                $stmt = $db->prepare($query);
                $hashed_password = password_hash($data->password, PASSWORD_DEFAULT);

                if($stmt->execute([$data->nombre, $data->edad, $data->email, $hashed_password])){
                    $_SESSION['user_id'] = $db->lastInsertId();
                    $_SESSION['user_email'] = $data->email;
                    $_SESSION['user_nombre'] = $data->nombre;
                    response(true, "Usuario registrado exitosamente",[
                        'id'=> $_SESSION['user_id'];
                        'email' => $data->email,
                        'nombre' => $data->nombre
                    ]);
                }else{
                    response(false, "Error al registrar usuario").
                }
                break;

                case 'login':
                    $query = "SELECT id, nombre, email, password FROM usuarios WHERE email = ?";
                    $stmt = $db->prepare($query);
                    $stmt->execute([$data->email]);

                    if($stmt->rowCount() === 1){
                        $user = $stmt->fetch(PDO::FETCH_ASSOC);

                        if(password_verify($data->password, $user['password'])){
                            $_SESSION['user_id'] = $user['id'];
                            $_SESSION['user_email'] = $user['email'];
                            $_SESSION['user_nombre'] = $user['nombre'];

                            response(true, "Login exitoso", [
                                'id' => $user['id'],
                                'email' => $user['email'],
                                'nombre' => $user['nombre']
                            ]);
                        }else{
                            response(false, "Contraseña incorrecta");
                        }
                    }else{
                        response(false, "Usuario no encontrado");
                    }
                    break;

                    case 'logout':
                        session_destroy();
                        response(true, "Sesión cerrada");
                        break;
                    
                    case 'check_session':
                        if(isset($_SESSION['user_id'])){
                            response(true, "Sesión activa", [
                                'id' => $_SESSION['user_id'],
                                'email' => $_SESSION['user_email'],
                                'nombre' => $_SESSION['user_nombre']
                            ]);
                        }else{
                            response(false, "No hay sesión activa");
                        }
                        break;
                    
                    case 'delete_account':
                        if(!isset($_SESSION['user_id'])){
                            response(false, "Usuario no autenticado");
                        }
                        $user_id = $_SESSION['user_id'];

                        $query = "DELETE FROM usuarios WHERE id = ?";
                        $stmt = $db->prepare($query);
                        if($stmt->execute([$user_id])){
                            session_destroy();
                            response(true, "Cuenta eliminada exitosamente");
                        }else{
                            response(true, "Error al eliminar la cuenta");
                        }
                        break;
        }
    }
}
?>